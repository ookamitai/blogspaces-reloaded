---
title: 日二节奏 Freecam Patch
date: 2026-06-18 10:12:06
tags: [ 中二节奏, 逆向工程 ]
excerpt: 更自由的 CHUNITHM
toc: true
title-number: true
---

## 概述

本文记录了如何在 CHUNITHM X-VERSE-X 游戏里定位并实现 Freecam 摄像机补丁。

目标：在游戏运行时修改画面使用的摄像机位置和朝向，让插件可以通过 ImGui 控制摄像机的 `Position`、`Yaw`、`Pitch`、`Roll`。

所有地址以当前 IDA 数据库和插件代码里的地址为准：

```c
0x123D310 SpkCamera_buildViewMatrix_LookAt
0x123C4C0 SpkCamera_getViewMatrix
0x123C530 SpkCamera_copyViewMatrix
```

==仅供学习和参考。==


咕咕咕！
