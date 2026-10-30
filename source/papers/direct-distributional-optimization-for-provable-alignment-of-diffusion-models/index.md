---
title: "Direct Distributional Optimization for Provable Alignment of Diffusion Models"
layout: "paper"
paper_id: "p009"
description: "先在概率分布空间求想要的分布，再研究如何用扩散过程从中采样。"
date: "2026-10-30 10:00:00"
comments: false
---

## 一句话直觉

==先在概率分布空间求想要的分布，再研究如何用扩散过程从中采样。==

## 先理解问题

直接调整扩散网络参数时，难以追踪究竟在优化哪个分布，也难给出采样误差保证。把对齐拆成分布优化与采样两层，可以分别讨论目标是否下降和生成样本是否接近期望分布。

## 方法如何工作

论文将问题写成概率分布上的正则化损失最小化，用Dual Averaging更新目标分布，再借助Doob h-transform近似其score、从偏移后的分布采样。前者利用累计函数梯度构造势函数，后者把终端重加权转成沿轨迹的引导；“密度比势”是两层的连接点。

## 放回偏好对齐的地图

与通过轨迹似然代理做参数DPO不同，这是一种==分布空间框架==，可容纳DPO、RLHF与KTO等目标。它提供学习密度比或势函数的研究切入点，但并非表明任意神经估计误差都可忽略。

## 阅读边界

收敛与端到端采样界依赖score估计、近似精度和相应光滑性等条件；“不依赖等周条件”也不是无条件免费采样。应把理想分布更新误差与实现中的拟合、离散化误差分开。

## 自测与动手

1. 如果理想目标分布已经最优，但采样器不准，输出仍可能出现什么问题？
2. Doob变换连接的是终端权重与哪一个时间条件期望？

**小实验（自学设计）：**在一维高斯混合上选择可计算的奖励倾斜，数值求目标密度；分别测势函数拟合误差、采样分布距离和目标值，判断三类误差是否随训练同步下降。

## 来源与阅读范围

[论文原文](https://arxiv.org/abs/2502.02954)。已核对正式论文页面的题名与摘要；机制解释同时参照原研究清单，具体公式、证明与实验配置仍需阅读全文。

<details class="paper-source-excerpt">
<summary>原清单摘录与附图（保留原始表述）</summary>

以下内容来自原研究清单，可能包含旧标题、待验证的推测或尚未纠正的摘要。附图也可能是个人或 AI 辅助示意，未独立核验其出处与推导；阅读时以本页上方核验说明和论文原文为准。

**研究想法 #9**

**问题：**diffusion model alignment 的本质是优化一个分布：

$\min_{q\in \mathcal P}
\left\{
L(q)=F(q)+\beta D_{\mathrm{KL}}(q\|p_{\mathrm{ref}})
\right\}.$

**做法：**

1. 用 Dual Averaging 在分布空间优化 q

2. 用 Doob’s h\-transform 从 q 中采样

**总结：**

把 diffusion model alignment 从“调模型参数”提升到“优化生成分布”，先用 Dual Averaging 学到目标分布相对于 reference distribution 的 density\-ratio potential，再用 Doob’s h\-transform 把这个分布转化为可采样的 aligned diffusion process，并给出收敛与采样误差保证。（这篇文章实现成本高，且实验规模偏小）

**迁移到diffusion：**

1\.diffusion\-DPO 的统计量不一定要从 trajectory likelihood ratio 出发，也可以从 **density\-ratio potential** 出发。

**换句话说，如果从分布对齐的应用场景去找理论包装。**

</details>
