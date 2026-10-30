---
title: "BPO: Revisiting Preference Modeling in Direct Preference Optimization"
layout: "paper"
paper_id: "p114"
description: "只确保赢家比输家更高还不够，还要防止赢家本身一起退化；优化力度应在两侧动态平衡。"
date: "2026-10-30 10:00:00"
comments: false
---

## 一句话直觉

只确保赢家比输家更高还不够，还要防止赢家本身一起退化；优化力度应在两侧动态平衡。

## 要解决什么，怎样做

Balanced Preference Optimization针对Degraded Chosen Responses：DPO的相对间隔可在chosen==绝对似然==下降时继续改善。BPO设计==平衡奖励间隔==和gap adaptor，动态协调chosen与rejected的优化。自学时先设想赢家从0.4降到0.3、输家从0.3降到0.1：相对比率改善，但赢家更难被生成，便能理解问题。

## 和已有方法的区别

它试图通过偏好建模本身缓解失衡，而不只是额外添加一项SFT约束。注意这里BPO指Balanced，和密度比论文的Bregman Preference Optimization同名缩写，引用时必须展开。

## 阅读边界与局限

摘要对其测试任务报告收益，不能推广为任何参数化策略都不会发生概率迁移。实现时要核对奖励定义、长度处理和gap尺度；特别要用独立任务指标验证chosen似然提升是否真的有用。

## 自测

1. 用两个具体概率例子说明间隔变大不保证chosen变好。
2. 加强chosen的绝对似然，是否可能降低输出多样性？

## 小实验（自学设计）

在三候选离散策略上做标准DPO和一个平衡两侧的教学目标，记录每个候选的概率质量流向。再对小语言模型同步画chosen、rejected与未参与训练响应的似然，判断信号是否只是转移到第三类。

## 来源与核验

已核验原始论文摘要或官方论文记录，以上是导读级自学笔记，尚未逐节复核全文证明与实验。

[原论文或作者官方来源](https://arxiv.org/abs/2506.03557)。本地研究清单提供了补充摘录；自测、小实验及分析性提醒为学习设计，不是论文报告的结果。

<details class="paper-source-excerpt">
<summary>原清单摘录与附图（保留原始表述）</summary>

以下内容来自原研究清单，可能包含旧标题、待验证的推测或尚未纠正的摘要。附图也可能是个人或 AI 辅助示意，未独立核验其出处与推导；阅读时以本页上方核验说明和论文原文为准。

**对齐论文表 #31**

提出平衡偏好优化\(BPO\)，解决DPO中chosen响应奖励下降\(DCR\)问题。核心创新：\(1\)将传统DPO的相对奖励边际r\(x1\)\-r\(x2\)替换为平衡奖励边际min\(r\(x1\),   \-r\(x2\)\)，动态选择更关键的一项进行优化，均衡chosen和rejected的优化力度；\(2\)引入Gap   Adaptor超参数（默认0\.3）控制边际的严格程度；\(3\)与多种损失函数兼容（logistic、hinge、squared、exponential等）。仅需一行代码修改即可集成到现有DPO流程中。

</details>
