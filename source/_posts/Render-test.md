---
title: Render test
date: 2025-05-24 18:43:16
tags:
title-number: false
excerpt: This is only a rendering test
---

打算在这里记录一下在这段时间里我对 SD 的各种了解，也可以方便与别人知识共享。

目录：

---

# 1. StableDiffusion 的原理和架构

## 1.1 模型概述

StableDiffusion 是一种**基于潜在扩散模型（Latent Diffusion Model, LDM）的文本生成图像（Text-to-Image）深度生成模型**。它由 CompVis 团队于 2022 年发布，其主要特点是通过在低维潜在空间中进行扩散过程，大幅度降低了生成图像所需的算力，同时保持了图像质量。

传统的扩散模型（如 DDPM）直接在高分辨率的图像空间中进行“**添加噪声—去噪**”的迭代过程，**计算量极大，难以部署**。

Stable Diffusion 创新性地将生成过程转移到**图像的潜在空间（由 VAE 编码器学习而来）中**，这个潜在空间**信息压缩度高，维度低，计算效率高**。这个做法就是 **“Latent Diffusion”。**

| **版本号** | **发布时间** | **参数** | **发布方** |
| --- | --- | --- | --- |
| **v1.1 / v1.2 / v1.3 / v1.4** | 2022/08 | - | CompVis |
| **v1.5** | 2022/10 | 98.3m | RunwayML |
| **v2.0** | 2022/11 | - | Stability AI |
| **v2.1** | 2022/12 | - | Stability AI |
| **SDXL 1.0** | 2023/07 | 3.5b | Stability AI |
| **SDXL Turbo** | 2023/11 | - | Stability AI |

## 1.2 核心组件

### 1.2.1 VAE (Variational Autoencoder)

在 VAE 中，我们希望模型能够学习如何从**一些隐藏的特征（称为“潜在变量”）中生成与原始数据相似的样本**。

直接让模型学习如何从压缩的信息中重建图像可能会导致模型记住每一张图像的细节，而不是学习到通用的特征。**换句话说，我们希望模型能够理解数据的本质，并能够从中生成新的、类似的数据。**

VAE 旨在学习一个生成模型，使得**给定潜在变量 $z$，可以生成与输入数据 $x$ 相似的样本**。其结构包括：

- **编码器（Encoder）**：将输入数据 $x$ 映射到潜在空间，输出潜在变量的分布参数（均值 $\mu$ 和标准差 $\sigma$）。
- **解码器（Decoder）**：从潜在变量 $z$ 中生成重构数据 $\hat{x}$。

VAE 的训练目标是最大化输入数据的**对数似然** $\log p(x)$，这表示**模型生成数据的能力**。然而，直接计算这个值在实际中非常困难，**因为它涉及到对所有可能的潜在变量进行积分，这在高维空间中是不可行的**。采用**变分推断**的方法，引入变分后验分布 $q(z|x)$ 来近似真实的后验分布 $p(z|x)$。

为了使得模型可以**通过梯度下降**进行优化，VAE 引入了**重参数化**技巧。具体地，将潜在变量 $z$ 表示为： 

$$
z = \mu + \sigma \odot \epsilon,\quad \epsilon \sim \mathcal{N}(0, I)
$$

其中，$\odot$ 表示按元素相乘。

从**标准正态分布**中独立采样噪声向量 $\epsilon \sim \mathcal{N}(0,\,I)$，并且 $ε$ 完全不依赖于网络参数，是整个重参数化过程的“随机源”。

这种方式将随机性从模型参数中分离出来，使得损失函数对参数 $\mu$ 和 $\sigma$ 可导，从而可以使用**反向传播**进行训练。

具体而言，VAE 的损失函数由两部分组成：

- **重构损失**：衡量解码器生成的样本 $\hat{x}$ 与原始输入 $x$ 的相似程度，常用均方误差（MSE）表示。
- **KL 散度**：衡量变分后验分布 $q(z|x)$ 与先验分布 $p(z)$ 之间的差异，鼓励潜在空间的分布接近标准正态分布。

通过**最小化这两个损失项的加权和**，VAE 能够学习到有效的潜在表示，同时保持生成数据的多样性。

在实际训练过程中，涉及到 VAE 的流程有：

- **编码阶段**：将输入图像 $x$ 通过编码器映射到潜在空间，得到潜在表示 $z$。
- *扩散过程*：在潜在空间中对 $z$ 进行扩散建模，逐步添加噪声，训练模型学习去噪过程。
    
    ※ *这段过程不是由 VAE 实现的，而是扩散模型负责的，但是为了完整性在这里保留这一步。*
    
- **解码阶段**：将去噪后的潜在表示 $z{\prime}$ 通过解码器还原为图像 $\hat{x}$。

### 1.2.2 UNet

UNet 是一种**卷积神经网络结构（CNN）**。其结构特点是一个对称的“U”形状，包括两部分：

- **编码器（Encoder）**：逐步提取图像的高级特征（downsampling）
- **解码器（Decoder）**：逐步还原图像空间尺寸（upsampling）

中间通过**跳跃连接（skip connection）**将低层信息传递到上层，保留细节。

在扩散模型中，我们的目标是：

> 给定一张被加了噪声的 latent 图像（如 $z_t$），预测它的原始状态或噪声量。
> 

这时候，UNet 的任务是：

$$
ϵθ(z_t,t,c)≈ϵ
$$

其中：

- $z_t$：$t$ 时刻加噪后的 latent 图像
- $t$：时间步，用来告诉网络当前处于扩散的第几步
- $c$：条件（如文本提示 embedding）
- $ϵ$：我们想还原的噪声

所以 **UNet 是扩散过程中的“预测器”**，它学会如何从带噪数据一步一步回推原始图像。

UNet 每一层都是由**卷积操作**构成，可以理解为一个带权重的滑动窗口，它从图像中提取局部模式：

$$
y(i,j)=∑_{u,v}x(i+u,j+v)⋅w(u,v) 
$$

这就像人看图时先看**细节**（**边缘、纹理**等）。

- **下采样（Downsampling）：**通过卷积+池化，使图像“更小、更深”，提取语义。
- **上采样（Upsampling）：**通过反卷积或插值操作，使图像“更大、更浅”，还原细节。

在实际生成图像中，UNet 不只是根据 $z_t$ 去还原图像，它还要根据提示词生成指定内容。

这就是**条件扩散模型**，UNet 会接收一个嵌入向量 $c$，表示输入的 prompt（如：`"a studio photo of a cat"`），并将其融入网络（通过 cross-attention 等方式），实现**文本指导生成**。

在实际训练过程中，可以分为：

- **编码**：$x \xrightarrow{\text{VAE Encoder}} z_0$
- **正向扩散**：$z_0 \rightarrow z_1 \rightarrow \cdots \rightarrow z_T$（逐步加入噪声）
- **反向去噪**：$z_T \xrightarrow{\text{UNet}} z_{T-1} \rightarrow \cdots \rightarrow z_0$
- **解码**：$z_0 \xrightarrow{\text{VAE Decoder}} \hat{x}$

在生成图片时候，直接从**反向去噪**步骤开始。

### 1.2.3 CLIP Text Encoder

CLIP（Contrastive Language–Image Pretraining）Text Encoder 是 Stable Diffusion 中的“**语言理解器**”。它的任务是：

> 把 prompt 变成一串能被图像模型理解的数字（向量），用于指导图像生成。
> 

他的工作结构如下：

- **分词**：将文本切分为子词（token）
- **嵌入（Embedding）**：每个词变成一个长度为 512 的向量
- **位置编码**：加入词语顺序信息
- **Transformer 层**：理解词与词之间的关系
- **输出 [EOS] 位置的向量**：得到整句话的语义表达

例如，我的 prompt 输入是：

```
"A cat sitting on a wooden chair"
```

把文本切分成词（或子词）：

```
["A", "cat", "sitting", "on", "a", "wooden", "chair"]
```

每个词都会被映射成一个**固定长度的向量**（例如 768 维）：

$$
\text{cat} \rarr \vec e_{\text{cat}} \in \mathbb R^{768}
$$

这些词向量就是“**文字的初始数学表示”**。

下一步，CLIP 会把**每个词的位置也编码成一个向量**，然后加到词向量上：

$$
\vec x_i = \vec e_i + \vec p_i
$$

这样，“cat”出现在第 114 个词和第 514 个词就能被区分。

这些词向量进入 CLIP 的 Transformer 模型。
在这里，每个词会“关注”整个句子的其他词，通过自注意力机制计算它们的相关性。

数学上，每个词计算三个向量：

- $Q$：Query（查询）
- $K$：Key（键）
- $V$：Value（值）

对所有词两两计算注意力权重：

$$
W_{ij} = \text{softmax}\left(\frac {Q_i \cdot K_j} {\sqrt d} \right)
$$

再用这些权重去加权所有 Value 向量：

$$
\vec z_i = \sum_{j}{W_{ij} \cdot V_j}
$$

这个过程会让模型理解”**这个词应该关注哪些词**”。

经过若干层这种操作后，我们得到每个词新的**“上下文理解”向量**。

Transformer 最后输出的是一个序列的向量，比如每个词都有一个输出。

CLIP 取最后的特殊符号 `[EOS]`（end-of-sentence）位置的向量，作为整句话的表示：

$$
\vec t_{prompt} = TF_{output} \text{[EOS]}
$$

这个向量现在就是一个**图像语义控制器**，它总结了这句话的“意思”。

这个向量 $\vec t_{prompt}$ 会作为一个**条件**，输入给 UNet：

- 在采样的每一步（例如 DDIM、DPM 等），UNet 需要决定怎么还原一张清晰图
- CLIP 的语义向量会被注入到 UNet 的中间层（通过 **cross-attention**）

这样，UNet 才知道你是想要一只猫，而不是**大肌肌兽人的大包**。

## 1.3 注意力机制

### 1.3.1 Self-Attention

Self‑Attention 通过把图像（或特征图）上的每一个空间位置看作一个“查询”（Query）、一个“键”（Key）和一个“值”（Value），用 Q 与 K 做点积，经过缩放和 Softmax，得到一个表示“ $i$ 位置应该从 $j$  位置借多少信息”的权重矩阵 A。用 A 对 V 做加权求和，得到融合了全局信息的新特征，从而让网络能**够全局融合上下文信息**。

想像特征图上有 N 个人（空间位置），每个人拿着自己准备的问题（Query）和回答（Value）。

为了回答自己的问题，每个人会先把问题（Q）与所有人的“钥匙”（K）做匹配，打听哪些人最懂他的问法。

匹配程度决定了每个人从谁那里“借”多少回答（Value）。最后，每个人把“借”来的所有回答按权重加起来，作为自己的新答案。

从数学的角度拆解如下：

- 输入

$$
X \in \mathbb R ^{N \times d}, \quad N = H \times W
$$

- 线性映射

$$
Q=XW^Q, K=XW^K, V=XW^V, \quad W^Q,W^K,W^V\in\mathbb R^{d\times d}
$$

- 点积和缩放

$$
S = QK^\top, \quad \tilde{S} = \frac {S}{\sqrt{d}}
$$

- Softmax 得注意力矩阵

$$
A_{ij} = \frac{\text{exp}(\tilde S_{ij})}{\sum^{N}_{k=1}\text{exp}(\tilde S_{ik})}, \quad \sum_{j}A_{ij} =1
$$

- 加权求和

$$
\text{Attention}(X) = AV
$$

插入 Self‑Attention 可以补足纯卷积只能“看见小邻域”的不足。使特征既能保留局部细节（卷积擅长），又能建立跨远距离的全局语义关系，助力在各分辨率上生成连贯同时具有良好细节的图像。

### 1.3.2 Cross-Attention

Cross‑Attention 与 Self‑Attention 的公式几乎相同，但它从 **两个不同的序列** 中取信息：

- **Query** $Q$ 通常来自 UNet Decoder
- **Key/Value** $(K,V)$ 来自 Text Encoder

这样，模型在生成每个输出时，都能有针对性地“询问” Encoder 哪些位置最相关，并据此融合全局信息。

设源序列特征矩阵为 $X_{enc} \in \mathbb R^{N_1 \times d}$ ，目标序列特征矩阵为 $X_{dec} \in \mathbb R^{N_2 \times d}$。

- 线性映射

$$
Q=X_{dec}W^Q, K=X_{enc}W^K, V=X_{enc}W^V, \quad W^Q,W^K,W^V\in\mathbb R^{d\times d}
$$

- 点积和缩放

$$
S = QK^\top, \quad \tilde{S} = \frac {S}{\sqrt{d}}
$$

- Softmax 得注意力矩阵
    
    $$
    A_{ij} = \frac{\text{exp}(\tilde S_{ij})}{\sum^{N}_{k=1}\text{exp}(\tilde S_{ik})}, \quad \sum_{j}A_{ij} =1
    $$
    
- 加权求和

$$
\text{CrossAttention}(Q,K<V) = AV
$$

## 1.4 工作流程

通过上面的阅读，我们可以总结：

- 将输入图像通过 VAE 编码为**潜在表示**（latent representation）
    
    ※ *如果是 txt2img，我们直接从纯噪声开始，不需要原图。*
    
- 在潜在空间中**添加噪声**，形成初始的噪声图
- 使用 UNet 预测噪声，并逐步**去噪**，生成**清晰的潜在表示**
- 将去噪后的潜在表示通过 VAE 解码为**最终图像**

---

# 2. 各种参数

因为最常用的是 txt2img，这里主要介绍这里会涉及到的一些。

## 2.1 模型检查点（Checkpoint)

选择不同版本的 StableDiffusion 权重或者不同的训练的模型，会直接影响到生成图片的风格与能力。

## 2.2 生成图片参数

### 2.2.1 提示词（Prompt）

Prompt 由正向提示（positive prompt）和负向提示（negative prompt）组成，支持通过括号、方括号、冒号等符号来对关键词进行加权或减重。

Prompt 中的每个词默认权重为 1，使用 `(…)` 可以增加该词缀的注意力，使用 `[…]` 可以减弱；在括号内通过冒号指定数值可进行更精确的加权，比如 `(cat:1.5)` 表示将 “cat” 的权重设为 1.5；括号可以嵌套，多个括号效果会相乘。**方括号仅支持默认减弱系数（0.9），不支持数值指定。**

若要在 Prompt 中出现“(”或“)”等特殊字符，需要在前面加反斜杠转义。

**特别的**，reForge 继承了上述 A1111 语法，并额外集成了 LoRA 控制扩展：使用 `<lora:name:weight>` 可直接在 Prompt 中加载 LoRA 模型，并可通过逗号和“@”符号在不同步骤或不同分辨率（低分辨率/高分辨率）下动态调整 LoRA 权重，例如 `<lora:network:0@0.4,0.7@0.8:hr=0.7@0,0@0.5>`。

在 Prompt 权重计算时，系统会先对每个词缀提取分词，再按综合权重对各 token 进行注意力分配，最终影响图像生成。**所有权重调整都在推理阶段生效，且多词 Prompt 会按逗号顺序决定初步权重排序，逗号前的词缀优先级更高**。

### 2.2.2 采样步数（Inference Steps）

StableDiffusion 从一张完全随机的噪声图像开始，每一步通过模型去噪并朝向 prompt 描述的方向迭代一次。整个过程共执行 N 次去噪迭代，这个 N 即为 **采样步数（Inference Steps）。**

步数越多，模型对噪声的迭代越充分，能还原更多细节及纹理；太少则可能看起来模糊或缺乏清晰边缘。图像质量随步数增长呈现**对数递增**趋势，前 10–20 步质量提升最为显著，此后增益递减。

每一步都需执行一次前向推理，采样步数与总体推理时间**线性正相关**：双倍步数近乎双倍耗时；但对于质量提升却不是双倍，通常存在**边际递减。**

### 2.2.3 随机种子（Seed)

设定生成过程的随机初始状态。相同的 seed 与相同的参数组合，可多次生成完全一致的图像，便于对比实验与批量生成管理。

### 2.2.4 采样器（Sampler）

采样器本质上是对反向扩散方程进行数值积分的**不同算法实现**，它们在**收敛速度、随机性与图像质量**上各有侧重。

因为个人使用习惯，重点聚焦于 **Euler a**（Euler ancestral）和 **DPM++ 2Sa** 两种方法

- **Euler a**（Euler ancestral）是在经典 Euler 方法基础上，额外引入随机噪声以增加多样性；它适合在较少步数下保持结构连贯，同时呈现丰富变化
- **DPM++ 2Sa** 属于 DPM-Solver 的第二阶单步祖先采样器，通过二阶导数近似与随机重采样，在维持高质量细节的同时显著提升了在高 CFG scale 下的表现

采样器可分为三大类：

- **确定性方法**（如 Euler、DDIM）：不引入额外随机性，同一 seed 可复现相同结果
- **祖先采样**（带 “A” 的方法，如 Euler a、DPM++ 2Sa）：每步注入随机噪声，提高生成多样性，结果因噪声路径不同而异。
- **高阶求解器**（如 LMS、DPM++ 2M、DPM++ 3M）：利用多步或高阶误差校正，提高收敛速度和细节表现

**先从 Euler a 看起：**

Euler a 继承自经典 Euler Solver，但在每一步：

- **过量去噪**：按照噪声调度（noise schedule）计算并去除比 deterministic Euler 更多的噪声
- **随机重采样**：为补偿过量去噪，重新加入符合当前噪声水平的随机噪声
- **迭代进行**：在整个噪声调度周期内重复以上操作，直至降噪完成

特点：

- **输出多样性**：由于每步注入随机噪声，同一 seed 重复生成会得到不同结果
- **低步数连贯性**：在 20–30 步甚至更低步数时，Euler a 往往比纯 Euler 或 DDIM 保持更好结构和细节
- **成本**：与 Euler 类似，每步计算量相同，但因需生成随机噪声略微增加随机数开销，整体速度与 Euler 相近

在精度要求适中、迭代速度优先时，使用 20–30 步 Euler a 即可获得多样且连贯的初步效果。

**再来看 DPM++ 2Sa：**

DPM++ 2Sa 属于 **Diffusion Probabilistic Model (DPM) Solvers** 的二阶单步祖先采样器，其中：

1. **二阶近似**：基于 DPM-Solver 论文的二阶数值积分公式，对扩散微分方程进行更准确的离散化处理
2. **祖先采样**：在单步更新中加入随机噪声成分，使输出具有多样性
3. **一次更新完成**：不同于多步方法，DPM++ 2Sa 在每个迭代步都融合多阶信息，实现更快收敛

特点：

- **高保真度**：二阶算法在同等步数下能够提供比一阶或无祖先采样的 DPM-Solver 更清晰细节
- **步数效率**：通常在 20–30 步内收敛到极好的细节，较传统 DPM2M 或 Euler a 在相同步数下质量更优
- **算力需求**：每步计算相对比一阶方法稍高，但因步数更少，总体推理时间可与其他高阶方法持平

如果对图像细节和清晰度要求极高，推荐使用 DPM++ 2Sa 搭配 25–35 步。

### 2.2.5 调度器（Scheduler）

调度器负责决定在每一步采样过程中的**噪声水平（$σ$）或时间步长（$t$）**，从而影响去噪迭代的**轨迹与效果**。它是连接模型输出与扩散过程的核心组件，不同的调度策略会显著改变**图像的收敛速度、细节表现与多样性**。

每个 Scheduler 根据**预先定义的噪声计划或时间步表**，指导模型在去噪过程中的迭代路径。

调度器通过映射 $\text{timestep} \rarr \sigma$  来控制每一步的噪声强度，让模型从纯噪声逐步恢复到清晰图像。

在这里重点介绍两种常见调度策略：**Karras、Align Your Steps。**

**先是 Karras：**

Karras 源自 Karras et al. 在 2022 年提出的**指数或余弦噪声计划**，旨在为不同噪声阶段分配更合理的采样密度，从而提升高质量样本的生成能力。

与线性或简单余弦不同，Karras 计划在初期与末期阶段使用更密集的采样，使图像结构与细节均得到更充分的迭代。

部分模型（如 SDXL）在训练时即采用 Karras sigmas，故推荐配合使用；而其他模型（如 SD1.5）通常依赖默认调度器。

大的 $\sigma$ 值表示更激进的噪声添加/移除，根据上面两张图可见，一般策略是从较大的 $\sigma$ 值开始，并且随着 $\text{timestep}$ 的增加减小 $\sigma$ 来完善图片细节。

参数 $\rho$ 它控制噪声水平从最大值 `sigma_max` 到最小值 `sigma_min` 的过渡曲线形状，从而影响图像生成中的去噪过程。

**接着是 Align Your Steps:**

AYS 是 NVIDIA 团队提出的一种**优化噪声步长对齐**方法，通过解析性地推导出针对不同采样器和数据集的**最优时间步表**，以在极少步数下仍能保持高质量输出。

AYS 分为 AYS11, AYS32，即为 11 步和 32 步优化的调度器。

### 2.2.6 CFG

Classifier‑Free Guidance（CFG）是一种**无需额外分类器**、通过同时利用**条件与无条件扩散模型**来增强生成质量的引导技术。其核心在于在每一步去噪中，将模型在“**带文本条件**”与“**不带条件**”两种输出的线性插值作为最终值，从而在**保持创意多样性的同时大幅提高对文本提示的遵循度**。常用范围约为 7–13，但也有低至 1–5 或高至 20+ 的应用。

- **条件模型 $\epsilon_\theta(x_t,y)$：**在去噪过程中同时输入噪声图像 $x_t$ 和文本提示 $y$ 得到针对提示的去噪预测
- **无条件模型 $\epsilon_\theta(x_t)$：**仅输入噪声图像 $x_t$，忽略提示。

在第 $t$ 步，CFG 将两者按权重 $w$（即 CFG Scale）融合：

$$
\tilde \epsilon(x_t,y)=(1+w)\epsilon_\theta(x_t,y)-w\epsilon_\theta(x_t)
$$

其中，$w \ge 0$，$w$ 越大表示越忠实于 prompt，越小则保留更多无条件生成的随机性与多样性。

### 2.2.7 批量大小（Batch Size）

一次生成调用中并行生成的图像数量。增加 batch size 可提高 GPU 利用率，但显著增加显存需求；常见设置为 1–4 张。

### 2.2.8 分辨率

定义输出图像的宽度和高度。常见为 512×512，但也可根据硬件能力与场景需求调整，如 768×768、1024×768 等。

在 SDXL 中，小于 1024x1024 的分辨率大小会导致 *artifacts*。

### 2.2.9 HiRes Fix

HiRes Fix 即在初始低分辨率生成基础上，通过一次或两次 img2img 迭代，将图像“无缝”放大到目标分辨率并细化细节。先以原生（如 512×512）或自定义小于目标的分辨率生成图像，再对该图以“上采样→img2img denoise”方式放大，最后可选地再迭代第二次以进一步增强清晰度与纹理。该方案避免了直接高分辨率生成带来的**“构图畸变”或“多头”问题**，可在保证构图稳定的同时获得更高分辨率输出。

- **低分辨率初步生成**：先在模型原生分辨率（通常 512×512）或略低于目标的分辨率上完成基础合成，保证构图正常
- **上采样（Upscale）**：使用像素或潜空间上采样方法，将图像大小放大到目标分辨率（如 2×、4×等）
- **img2img 精细化**：对放大后的图像以一定的 **denoising strength**（去噪强度）和步数执行 img2img，再次去噪以补充细节

HiRes Fix 本质是两次采样，时间与显存消耗大约是常规 txt2img 的 1.8–3倍；可通过将 Hires steps 设为原始步数的 50% 左右来平衡速度和质量。

### 2.2.10 Refiner

Refiner 是一种专门针对扩散模型后期低噪声阶段的**图像微调去噪器**，它接收基础模型在中高噪声阶段输出的潜在表示，进一步去除剩余噪声并补充细节。

- **基础生成**：首先使用基础模型在 N₁ 步中将完全随机噪声映射为带有初步结构的潜在图像，但其依旧拥有噪声
- **传递**：将此潜在表示无缝移交给 Refiner 模型，Refiner 会在剩余 N₂ 步内继续迭代，以去除更细微的噪声成分并增强纹理细节

当同时加载基础与 Refiner 模型时，Diffusers 会在前半程调用基础模型、后半程自动切换到 Refiner，从而在一次调用中完成两段去噪，这种方式被称为 [*ensemble of expert denoisers*](https://research.nvidia.com/labs/dir/eDiff-I/)。

### 2.2.11 LoRA

LoRA（Low-Rank Adaptation）是一种**参数高效的微调技术**，通过在保持预训练模型权重不变的情况下**注入低秩（low-rank）适应矩阵**，实现对大规模模型（如Stable Diffusion）的快速、轻量级微调。

在 Stable Diffusion 中，LoRA 将额外的可训练矩阵插入到模型的关键层，如注意力（Attention）模块或卷积层，从而只需训练这些新增矩阵，而无需对原始模型权重进行更新。

相比于传统的全量微调，LoRA 显著降低了可训练参数量和显存消耗，使得在有限资源下**也能高效地对特定风格、人物或场景进行定制化训练**，同时生成的 LoRA 权重文件通常仅百兆字节级别，减小了存储和分享的代价。

通过向预训练模型的某些层（如 Transformer 的注意力层或 Stable Diffusion 的 U-Net 中间层）注入一对低秩矩阵（通常记作 $A$ 和 $B$），并保持原始权重矩阵 $W$ 不变，仅对这对新增矩阵进行优化训练。

具体而言，如果原始模型某一层的权重矩阵为 $W \in \mathbb{R}^{d \times k}$，LoRA 会构造两个小规模矩阵 $A \in \mathbb{R}^{d \times r}$ 和 $B \in \mathbb{R}^{r \times k}$（其中 $r \ll \min(d, k)$），则原模型在向前传播时实际使用的权重为：

$$
W{\prime} = W + \Delta W = W + \frac \alpha r \cdot A B
$$

其中 $\alpha$ 是缩放因子，用来控制 LoRA 更新的幅度；$AB$ 的矩阵秩为 $r$，显著低于对原始权重直接更新时的秩要求。此时  $\text{rank}(A B) = r$，因此新增的可训练参数量为 $d \times r + r \times k$，远小于 $d \times k$ 的规模。

LoRA 最常在 Cross-Attention 层插入低秩矩阵，因为文本条件化通常发生在这些层中，通过对这些层进行微调可有效改变生成图像的特定风格或主题，而不必干预到所有卷积核。

如果选取 LoRA 的秩 $r$ 远小于 $\min(d, k)$（如 $r=4$ 或 $r=8$），则新增矩阵的参数量为 $d \times r + r \times k$，仅为原始可训练参数量  $\frac{r(d + k)}{d k}$ 倍，显著降低了可训练参数数量和训练时显存开销。

此外，LoRA 仅保存矩阵 $A$、$B$，这意味着在推理的时候需要指定 $\alpha$，也就是**模型的权重**。

$\alpha$ 在训练中常被称为 *Network Alpha*， $r$ 常被称为 *Network Rank*。

### 2.2.12 「BREAK」

*本质上不是一个可控参数，但是 BREAK 在 prompt 中非常实用，遂介绍。*

BREAK 是 Stable Diffusion 提示语法中的一种特殊标记，用于在提示词中手动划分“断点”（chunk boundary），当提示词总 Token 数超过 CLIP 编码器支持的上限（75 Token）时，若提示中存在 BREAK，系统会将提示分割为两个子提示，各自取其靠近 BREAK 的 75 Token 进行单独编码，最后合并为一个完整的注意力条件。

若提示中有多个风格元素或场景叙事，直接连接可能导致模型对整体语义的 “混乱” 或 “串词”，通过 BREAK 可以将意图明确分段，让每一段相对独立地参与编码与视觉引导，从而减少不期望的内容交叉干扰。

例如：


> 柔和日落背景，几株盛开的樱花树
 BREAK
 侧面俯瞰视角，穿着和服的少女漫步

# 3. 实践

虽然 reForge 在 2025/04/13 已经暂缓更新，但是依旧是个人感觉功能最完善/速度最快的一个 fork。因此这段方法论将还在使用 reForge。
