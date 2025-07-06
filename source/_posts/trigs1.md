---
title: 高中数学碎碎念【三角函数】（Part1）
date: 2025-07-06 19:29:50
tags: [高中数学, 三角函数]
excerpt: 从一轮复习总结下来的各种零散小知识……
toc: true
title-number: true
---

## 对偶构造

>【例1】$ 2\sin\alpha - 3\cos\alpha = 2 $, 求 $ \sin\alpha $, $\cos\alpha $。

难度不大，但是如果用 $\sin^2\alpha + \cos^2\alpha = 1$ 换元会速度偏慢。现在给出一个简化的计算方法：

**构造：** $ 2\cos\alpha + \sin\alpha = t $，联立方程组：

$$
\begin{cases}
    \begin{alignedat}{2}
        2\sin\alpha - 3\cos\alpha &= 2  &\quad& \textcircled{1} \\
        2\cos\alpha + \sin\alpha &= t  &\quad& \textcircled{2}
    \end{alignedat}
\end{cases}
$$

把 $\textcircled{1}\textcircled{2}$ 式平方，

$$
\begin{cases}
    \begin{alignedat}{1}
        4\sin^2\alpha-12\sin\alpha \cos\alpha+9\cos^2\alpha &= 4 \\
        4\cos^2\alpha+12\sin\alpha \cos\alpha+9\sin^2\alpha &= t^2
    \end{alignedat}
\end{cases}
$$

两式相加就有，

$$
13 = 4 + t^2
$$

解得 $t = \pm 3$, 即 $\displaystyle \left(\sin\alpha, \cos\alpha\right) = \left(1, 0\right) \text{or} \left(-\frac{5}{13}, -\frac{12}{13}\right)$

## 三角互补正切关系

> 【例2】证明：$\tan x + \tan y + \tan z = \tan x \tan y \tan z \quad \left(x+y+z = k\pi, k \in \mathbf{Z}\right)$

证明不难，但是可以作为一个结论记忆，解三角形题目会用到。

$$
\begin{alignedat}{2}
    \text{LHS} &= \tan x + \tan y + \tan \left(k\pi - x - y\right) \\
               &= \tan x + \tan y - \tan \left(x+y\right) \\
               &= \tan x + \tan y - \frac{\tan x+\tan y}{1-\tan x\tan y} \quad &\textcircled{3}\\
               &= -\left(\tan x+\tan y\right)\frac{\tan x\tan y}{1-\tan x\tan y} \quad &\textcircled{4}\\
               &= - \tan \left(x+y\right)\tan x\tan y quad &\textcircled{5} \\
               &= \tan x \tan y \tan z
\end{alignedat}
$$

注意 3,4 步之间的提取公因式，以及 4,5 步之间再次利用正弦两角相加把分式收起来。

## 三倍角公式

> 【例3】用 $\sin \alpha$ 表示 $\sin 3\alpha$，用 $\cos \alpha$ 表示 $\cos 3\alpha$。

主要运用**拆角**的思想，即 $3\alpha = 2\alpha + \alpha$，这里只给出 $\sin 3\alpha$ 的解答过程，$\cos 3\alpha$ 是平凡的。

$$
\begin{alignedat}{1}
    \sin 3\alpha &= \sin \left(2\alpha+\alpha\right) \\
                 &= \sin 2\alpha \cos\alpha + \cos 2\alpha \sin\alpha \\
                 &= 2\sin\alpha\cos^2\alpha + \left(1-2\sin^2\alpha\right)\sin\alpha \\
                 &= 2\sin\alpha\left(1-\sin^2\alpha\right) + \sin\alpha - 2\sin^3\alpha \\
                 &= 3\sin\alpha -4\sin^3\alpha
\end{alignedat}
$$

$$
\begin{equation*}
    \cos3\alpha = 4\cos^3\alpha-3\cos\alpha = -3\cos\alpha + 4\cos^3\alpha
\end{equation*}
$$

## 正切二倍角定义域

> 【例4】求 $\displaystyle y=\frac{2\tan x}{1-\tan^2x}$ 的最小正周期。

**标准错误** be like：$y=\tan2x$，所以 $\displaystyle T = \frac{\pi}{2}$。

**正解**：

$\textcircled{1}$： $\displaystyle \tan x \quad \mathbf{D}_f \Rightarrow x \neq \frac{\pi}{2} + k\pi$

$\textcircled{2}$：分母 $\neq 0$，即 $\displaystyle \tan x \neq \pm 1 \Rightarrow x \neq \frac{\pi}{4} + k\pi \land x \neq \frac{3\pi}{4} + k\pi$

结合 $\textcircled{1}\textcircled{2}$ 可知，$T$ 应该等于 $\pi$。

## n 倍角

$$
\begin{alignedat}{2}
    \left(\cos x+i\sin x\right)^n &= \cos nx + i\sin nx \quad &\textcircled{1} \\
                                  &= \sum^{n}_{j=0}{\binom{n}{j}\cdot\cos^{n-j}x\cdot i^j\sin^jx} \quad &\textcircled{2} \\
                                  &= \left(\binom{0}{n}\cos^nx-\binom{2}{n}cos^{n-2}x\sin^2x+\binom{4}{n}\cos^{n-4}x\sin^4x-\cdots\right) \\
                                  &+ i\left(\binom{1}{n}\cos^{n-1}x\sin x-\binom{3}{n}\cos^{n-3}sin^3x+\binom{5}{n}cos^{n-5}\sin^5x-\cdots\right)
\end{alignedat}
$$

其中 $\textcircled{1}$ 运用了 **棣莫弗定理 (de Moivre's formula)** (也可以看成复数的几何意义), $\textcircled{2}$ 运用了**二项式定理**。

因为 $\sin^{2k}x \left(k\in\mathbf{N}_+\right)$ 都可以用 $\cos x$ 表示出来，因此 $\cos nx$ 都可以只用 $\cos x$ 表示，而 $\sin nx$ 不可。

## 给角化简观察次数

> 【例5.1】化简： $\displaystyle \frac{\left(\sin 50\degree + \sin 70\degree\right)^2}{1+\cos20\degree} (\ast)$

观察分子是 **2 次**，分母是 **1 次**，且观察 $50\degree$、$70\degree$、$20\degree$，考虑使用**二倍角**把分母变成 2 次，且 $20\degree$ 变成 $10\degree$，分子 $50\degree$、$70\degree$ 变成 $60\degree-10\degree$、$60\degree+10\degree$。

$$
\begin{alignedat}{1}
    (\ast) &= \frac{\left(2\sin 60\degree\cos10\degree\right)^2}{2\cos10\degree} \\
           &= \frac{3\cos^2 10\degree}{2\cos^2 10\degree} \\ 
           &= \frac{3}{2}
\end{alignedat}
$$

> 【例5.2】化简： $\displaystyle \frac{\sqrt{3}\sin10\degree}{\sin40\degree}+4\cos^2 20\degree (\ast)$

观察原多项式是 **0次 + 2次**，使用**二倍角**变成**0次 + 1次**，

$$
\begin{equation*}
    (\ast) = \frac{\sqrt{3}\sin10\degree}{\sin40\degree}+2\cos40\degree+2
\end{equation*}
$$

观察到分母和外面的 $\cos$ 可以构成 $\sin2\alpha$ 的形式，进行通分，

$$
\begin{alignedat}{1}
    (\ast) &= \frac{\sqrt{3}\sin10\degree+2\cos40\degree\sin40\degree}{\sin40\degree}+2 \\
           &= \frac{\sqrt{3}\sin10\degree+\sin80\degree}{\sin40\degree}+2 \\
           &= \frac{\sqrt{3}\sin10\degree+\cos10\degree}{\sin40\degree}+2 \\
           &= 4+2 = 6
\end{alignedat}
$$

我们可以总结出来**1次项的处理方法**：
- 用 $\tan$ / 原有的分式通分
- 出现 **2次** $\div$ **1次**的形式
- 使用**二倍角** etc. 公式降次
- 出现 **1次** $\div$ **1次** $\Rightarrow$ 常数 

> 【变式 5.1】$\displaystyle \frac{\sin10\degree}{1-\sqrt{3}\tan10\degree}$

> 【变式 5.2】$\sin40\degree\left(\tan10\degree-\sqrt{3}\right)$

可以看看这两个式子，找到思路。

---

Part 1 先在这里草草结束了，速等我更新（bushi。