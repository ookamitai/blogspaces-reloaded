---
title: "Convex Optimization for Alignment and Preference Learning on a Single GPU"
layout: "paper"
paper_id: "p006"
description: "冻结大模型，把可训练部分限制成有凸结构的偏好模块，换取便宜而可分析的优化。"
date: "2026-10-30 10:00:00"
comments: false
---

## 一句话直觉

==冻结大模型，把可训练部分限制成有凸结构的偏好模块，换取便宜而可分析的优化。==

## 先理解问题

全模型偏好微调昂贵且非凸，优化不稳定时很难区分模型表达能力、学习率和训练噪声的影响。“单GPU对齐”需要同时考虑参考模型、反向传播与可训练参数带来的资源占用。

## 方法如何工作

COALA利用冻结LLM特征上的凸神经网络重构来学习偏好。作者公开代码将其描述为两阶段过程：先利用凸重构与ADMM求解网络，再固定一部分参数进行凸偏好训练；因此==理论保证针对受限优化变量与假设==，而非证明整个LLM从头训练是凸的。参考模型需求也被移除。

## 放回偏好对齐的地图

与LoRA只是降低参数量不同，重点是改变优化问题的结构；与标准DPO相比，需要检查该偏好模块如何作用于生成，而不是把排序分类成绩直接当成模型生成能力提升。冻结特征的表达边界依然存在。

## 阅读边界

原清单关于迁移到扩散模型的“冻结骨干+凸head+guidance”仅是自学假设。是否保留凸性、如何使用head以及能否改善生成，都必须重新设计和验证；不应直接搬用LLM定理。

## 自测与动手

1. 为什么冻结骨干后，并非任意加一个MLP就能保证凸优化？
2. 参考模型省掉后，如何评估模型行为偏离与生成质量？

**小实验（自学设计）：**用同一冻结特征训练线性head、普通MLP和可复现的凸模块，比较多随机初始值下的收敛、偏好准确率和资源；另做生成评价，检验排序改善能否传递到输出。

## 来源与阅读范围

[论文原文](https://arxiv.org/abs/2605.23244)。已核对正式论文页面的题名与摘要；机制解释同时参照原研究清单，具体公式、证明与实验配置仍需阅读全文。

**核验补充：**正文机制同时核对作者代码仓库 https://github.com/pilancilab/COALA ；不把对受限模块的凸保证推广到完整LLM。

<details class="paper-source-excerpt">
<summary>原清单摘录与附图（保留原始表述）</summary>

以下内容来自原研究清单，可能包含旧标题、待验证的推测或尚未纠正的摘要。附图也可能是个人或 AI 辅助示意，未独立核验其出处与推导；阅读时以本页上方核验说明和论文原文为准。

**研究想法 #6**

**问题：**LLM preference alignment 的高成本训练

**做法：**不再对整个 LLM 做非凸 preference fine\-tuning，而是在冻结的预训练 LLM 表征上叠加一个 convex neural network head，把 preference alignment 转化为一个凸优化问题。**冻结 base LLM，用它提取 hidden features；在这些 features 上训练一个凸神经网络 preference head；再用这个 head 指导偏好对齐与生成。**

**总结：**

1\.提出COALA\(Convex Optimization for Alignment and Preference Learning Algorithm\)：利用神经网络凸优化重构消除参考模型需求，大幅降低训练时间和显存消耗，实现单GPU高效对齐训练。

2\.DPO/ORPO 优化的是大模型参数，整体非凸，通常没有全局收敛保证。

3\.把 preference alignment 重新表述为凸优化问题。

4\.COALA 不是 DPO 的简单替代，而是一种“凸优化 preference head \+ frozen LLM \+ guided inference”的轻量 alignment 框架。它牺牲一部分全模型表达能力，换取稳定性、可解释性、低显存和理论收敛保证。

**迁移diffusion：**

1\.COALA 的做法是：不强行证明整个 LLM/Diffusion model 的 alignment loss 是凸的，而是把可优化部分限制为一个凸模块。对于diffusion alignment 来说，类似思路可以是：

1. 冻结 diffusion backbone；

2. 提取 denoising feature、score feature 或 U\-Net intermediate representation；

3. 在其上训练 convex preference head；

4. 用这个 head 作为 guidance signal 或 reward shaping；

5. 从而得到一个“convex preference steering for diffusion”的框架。

</details>
