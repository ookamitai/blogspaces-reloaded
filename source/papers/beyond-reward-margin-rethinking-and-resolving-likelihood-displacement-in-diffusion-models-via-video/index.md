---
title: "Beyond Reward Margin: Rethinking and Resolving Likelihood Displacement in Diffusion Models via Video Generation"
layout: "paper"
paper_id: "p003"
description: "小间隔时避免负样本误伤，大间隔时继续给好样本学习信号。"
date: "2026-10-30 10:00:00"
comments: false
---

## 一句话直觉

==小间隔时避免负样本误伤，大间隔时继续给好样本学习信号。==

## 先理解问题

在扩散视频生成里，chosen与rejected的更新方向可能相近，降低坏样本的代理似然会连带损害好样本；另一端，大间隔让DPO的sigmoid梯度饱和，模型已会区分却未继续提高好样本质量。两种现象需要分别诊断。

## 方法如何工作

PG-DPO通过更新动态分析区分Optimization Conflict与Suboptimal Maximization。==ARS自适应减小拒绝项影响==，缓解小间隔下的方向冲突；IPR对chosen的策略/参考相对概率施加隐式偏好正则，在大间隔区域继续提供信号。学习时把间隔大小与两种机制对应起来，而不是笼统理解为“增加一个正则项”。

## 放回偏好对齐的地图

与Gate-DPO都关注负梯度误伤，但这里的分析对象是扩散更新和不同间隔区间；ARS与IPR分别处理冲突和饱和。扩散训练中常用去噪代理表示似然，应明确代理改善与真实生成质量并非同一个量。

## 阅读边界

视频实验不自动证明适用于所有图像、流匹配或一步模型。应检查间隔定义、不同时间步权重和chosen正则是否引入额外偏移，并在相同训练预算下比较。

## 自测与动手

1. 为什么间隔已经很大，仍可能需要对chosen提供额外监督？
2. 如果正负样本梯度夹角接近零，单纯加大拒绝项会发生什么？

**小实验（自学设计）：**在固定偏好数据上按初始间隔分桶，分别记录chosen去噪误差、rejected去噪误差和梯度余弦；做仅ARS、仅IPR、两者联合的消融，检验两种机制是否各改善相应分桶。

## 来源与阅读范围

[论文原文](https://arxiv.org/abs/2511.19049)。已核对正式论文页面的题名与摘要；机制解释同时参照原研究清单，具体公式、证明与实验配置仍需阅读全文。

<details class="paper-source-excerpt">
<summary>原清单摘录与附图（保留原始表述）</summary>

以下内容来自原研究清单，可能包含旧标题、待验证的推测或尚未纠正的摘要。附图也可能是个人或 AI 辅助示意，未独立核验其出处与推导；阅读时以本页上方核验说明和论文原文为准。

**研究想法 #3**

**问题：**DPO 本来希望提高 preferred/chosen 样本的概率，降低 rejected 样本的概率。但在训练中，chosen 样本的概率有时反而下降，甚至 chosen 和 rejected 的概率一起下降。扩散模型中的 DPO 失败主要来自两类 reward margin 场景：

1. 小 margin：Optimization Conflict
**chosen 和 rejected 的隐式奖励差距很小，说明模型很难区分二者。此时 DPO 会强力拉开两者，但在扩散模型的更新动态里，两个样本的更新方向可能非常相似。结果是：模型在压低 rejected 样本概率时，也误伤 chosen 样本，导致 chosen likelihood 下降。**

2. 大 margin：Suboptimal Maximization
**chosen 已经明显优于 rejected，reward margin 很大。此时 DPO 的 sigmoid 梯度趋近于 0，训练信号消失。模型虽然已经会区分这对样本，但不会继续提高高质量 chosen 样本的概率，导致优化停滞在次优状态。**

**方法：**

1\.不只是看 loss 的梯度大小，而是分析一次梯度更新之后，模型对任意样本的预测概率会怎样变化。

2\.ARS：Adaptive Rejection Scaling用来解决小 margin 下的 optimization conflict。

ARS 的思想是：**当 chosen 和 rejected 很接近时，不要过度惩罚 rejected**。因为惩罚 rejected 的梯度可能会泄漏到 chosen 上，造成误伤。

因此，ARS **给 rejected 样本的奖励项加了一个自适应权重 α。当 reward margin 小时，α 会降低 rejected 项的影响，让训练更偏向“拉高 chosen”，而不是猛烈“压低 rejected”。**

3\.IPR：Implicit Preference Regularization

用来解决大 margin 下的 suboptimal maximization。

当 chosen 已经明显好于 rejected 时，标准 DPO 的梯度会消失。IPR 此时引入一个只针对 chosen 样本的正则化目标，继续提升 chosen 的隐式奖励：log\(pθ / pref\)，也就是说，它不是简单做 SFT，而是在参考模型约束下继续提高 chosen 样本的相对概率，避免模型过早停止学习。

根据 reward margin 在两种模式之间平滑切换：

- margin 小：主要使用 ARS 修正后的 DPO，减轻 rejected 的惩罚，避免误伤 chosen。

- margin 大：逐渐转向 IPR，继续增强 chosen 样本概率，避免优化停滞。

**总结：**

- likelihood displacement 并不是单一问题，而是由小 margin 下的“优化冲突”和大 margin 下的“优化停滞”共同造成的。

- 小 margin 时少惩罚 rejected，保护 chosen；大 margin 时继续奖励 chosen，避免梯度消失。

- **偏好对的“差距大小”会决定训练信号是否健康，因此 alignment 方法不能只追求拉大 reward margin，还要关注 chosen 样本本身的概率是否真的被提高。**

</details>
