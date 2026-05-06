---
title: 日二节奏启用国服上传体验
date: 2026-05-06 21:07:49
tags: [中二节奏, 逆向工程]
excerpt: 手台网太好了怎么办
toc: true
title-number: true
---

## 概述

本文记录了如何定位并 patch 掉成绩上传函数 projClient::ClientUpload::sendUpsertUserAll，使游戏在一局结束后成绩上传直接失败。

所有分析基于 X-VERSE-X 的 chusanApp.exe（base address 0x400000）。

==仅供学习参考。==

## 发现过程

### Step 1：从 RTTI 字符串入手

第一步是在 IDA Pro 的 string window 里搜索已知的关键字。目标是找到和成绩上传相关的类和方法。搜 `upsertUserAll` 和 `ClientUpload`：

```
0x18B8B74: "upsertUserAll"
0x18B40BC: "clientUpload"
0x1C1C1BC: ".?AVUpsertUserAll@projClient@@"
0x1C1BC8C: ".?AVClientUpload@projClient@@"
```

RTTI 字符串暴露了 `projClient` 命名空间下的两个类：`UpsertUserAll` 和 `ClientUpload`。这说明游戏用的是 C++ 类继承体系，上传逻辑封装在 `ClientUpload` 类里。

### Step 2：跟踪字符串引用

对 `"upsertUserAll"`（`0x18B8B74`）做 xref 分析，找到它在 `0x9D7F00` 处被引用。反编译这个函数：

```cpp
unsigned int __thiscall sub_9D7F00(int this, int a2) {
    // ...
    sub_410D48("userId", 6u);
    sub_40EE12(this, v6);

    sub_410D48("segaIdAuthKey", 0xDu);
    sub_468688((void *)(this + 8), (int)v6);

    sub_410D48("upsertUserAll", 0xDu);
    sub_430134(this + 32, v4);
    // ...
}
```

这是一个 JSON 键值构建函数，往某个数据结构里写入 `userId`、`segaIdAuthKey`、`upsertUserAll` 三个字段。这很像是构建 HTTP 请求体的过程 —— `upsertUserAll` 是发送给服务端的 API 端点名或者 payload 键名。

### Step 3：定位 ClientUpload 类的虚表

对 `"clientUpload"`（`0x18B40BC`）做 xref，找到 `0x9989E0`。这个函数构建了包含 `clientUpload` 字段的请求体，它是上层调度逻辑，负责组装整个上传请求的元数据。

进一步对 `0x9989E0` 做 xref，发现它通过 thunk `0x45B6FE` 被调用，而 `0x45B6FE` 的调用者是 `0x99CE10`。`0x99CE10` 是一个较大的函数，它负责：

1. 把游戏数据分片（chunk size = 10240 字节）
2. 对每个分片调用 `sub_45B6FE`（即 `ClientUpload` 调度器）
3. 组装成带 `orderId`、`divNumber`、`divLength` 的上传包

这说明上传机制是**分片上传** —— 大的成绩数据被拆成多个 10KB 的 chunk 依次发送。

### Step 4：找到实际的发送函数

顺着 `0x99CE10` 的调用链往上追，经过 thunk `0x45FDA8`，找到 `0x99CC50`。这个函数是分片上传的协调器，它管理一个数据缓冲区（`this + 4` 指向 buffer，`this + 12` 是总大小，`this + 16` 是当前 chunk index），每次调用时读取下一片数据并发送。

而真正把序列化后的数据通过 HTTP 发送出去的函数，需要从 `ClientUpload` 的虚表里找。我注意到 `0x18B3EA0` 处有一个 vtable，其中第二个条目指向 `0x420AD6`，这是一个跳转到 `0x98C1D0` 的 thunk，而 `0x98C1D0` 又跳转到 `0x995050`。

反编译 `0x995050`：

```cpp
char __thiscall sub_995050(_DWORD *this, int a2, int a3) {
    sub_47007C(v8);                                    // 初始化某种缓冲区
    sub_42E5DC(v9, *(this + 24), *(this + 25), a2, a3); // 序列化 UserAll 数据
    v4 = sub_458E31();                                  // 获取 HTTP 客户端实例
    v5 = sub_461856(v4, v9, 0, 2);                     // 发送 HTTP 请求
    // ... cleanup ...
    return v5;
}
```

这就是 `sendUpsertUserAll` —— 它把完整的 UserAll 数据序列化后通过 HTTP 发送到服务端。函数返回一个 `char`（bool），表示上传成功或失败。

### Step 5：确认调用约定

`sendUpsertUserAll` 是一个 `__thiscall` 虚函数（通过 vtable 调用），`this` 指针在 `ecx` 中，另有 2 个显式参数在栈上（`a2`、`a3`）。因此 caller 通过栈传递了 8 字节的参数，函数退出时需要 `retn 8` 来清理。

这可以通过栈帧布局验证：

```
arg_0 @ offset 0x44 (a2)
arg_4 @ offset 0x48 (a3)
__return_address @ offset 0x40
__saved_registers @ offset 0x3c  (ebp push)
```

`this` 不在栈上（在 `ecx` 中），栈上只有 2 个 DWORD = 8 字节，确认 `retn 8` 正确。

## 代码逻辑结构

### 整体上传架构

CHUNITHM 的成绩上传采用**分片 JSON 上传**机制，整个流程可以分成 4 层：

```
Layer 1: 序列化层 (Serialization)
    UpsertUserAll::serialize() @ 0x9D6C40
    │  将 27+ 种玩家数据序列化为 JSON
    │
Layer 2: HTTP 请求构建层 (Request Builder)
    UpsertUserAll::buildRequest() @ 0x9D7F00
    │  写入 userId / segaIdAuthKey / upsertUserAll 字段
    │
Layer 3: 分片上传调度层 (Chunked Upload Dispatcher)
    ChunkedUpload::dispatchNext() @ 0x99CC50
    ChunkedUpload::sendChunk() @ 0x99CE10
    ClientUpload::buildMetadata() @ 0x9989E0
    │  把大数据拆成 10240 字节的分片
    │  为每片附加 orderId / divNumber / divLength 元数据
    │
Layer 4: HTTP 发送层 (Network Transport)
    ClientUpload::sendUpsertUserAll() @ 0x995050  ← 我们 patch 的目标
    HTTPClient::send() @ 0x996DC0
    │  通过 WinHTTP 发送 POST 请求
    │  返回 bool 表示成功/失败
```

### UpsertUserAll 的数据结构

`sub_9D6C40` @ `0x9D6C40` 是序列化函数，它把一个巨大的聚合数据对象拆成 27+ 个子字段逐个序列化。完整的字段列表：

| Index | 字段名 | 序列化函数 |
|-------|--------|-----------|
| 0 | `userData` | `sub_46B6F3` |
| 1 | `userGameOption` | `sub_41B81A` |
| 2 | `userCharacterList` | `sub_40AFC9` |
| 3 | `userItemList` | `sub_40ECFF` |
| 4 | `userMusicDetailList` | `sub_41FA46` |
| 5 | `userActivityList` | `sub_40E12E` |
| 6 | `userRecentRatingList` | `sub_42700C` |
| 7 | `userPlaylogList` | `sub_44493B` |
| 8 | `userChargeList` | `sub_43EF40` |
| 9 | `userCourseList` | `sub_42CFF7` |
| 10 | `userDuelList` | `sub_4625D5` |
| 11 | `userCMissionList` | `sub_424EEC` |
| 12 | `userTeamPoint` | `sub_462B3E` |
| 13 | `userRatingBaseHotList` | `sub_460BD1` |
| 14 | `userRatingBaseList` | `sub_460BD1` |
| 15 | `userRatingBaseNextList` | `sub_460BD1` |
| 16 | `userRatingBaseNewList` | `sub_460BD1` |
| 17 | `userRatingBaseNewNextList` | `sub_460BD1` |
| 18 | `userLoginBonusList` | `sub_449D6E` |
| 19 | `userMapAreaList` | `sub_44836F` |
| 20 | `userOverPowerList` | `sub_42C70F` |
| 21 | `userNetBattlelogList` | `sub_433DCA` |
| 22 | `userEmoneyList` | `sub_40C248` |
| 23 | `userNetBattleData` | `sub_417F2B` |
| 24 | `userFavoriteMusicList` | `sub_46A7BC` |
| 25 | `userUnlockChallengeList` | `sub_45FE98` |
| 26 | `userLinkedVerseList` | `sub_465AFF` |
| 27-31 | `isNewCharacterList` 等 | `sub_468688` |

其中 `userMusicDetailList` 包含每首歌的成绩记录（每条含 score、judge、maxCombo 等），`userPlaylogList` 包含游玩日志，`userRatingBase*List` 包含 Rating 计算所需的 Hot/Best/New 列表。

#### 增量 vs 全量上传

序列化函数有两条路径：

- **增量路径**（`this[n] != this[n+1]`）：检查每个子列表的脏标记，只序列化变化过的数据。每个子对象用一对指针表示范围（begin/end），如果 `begin == end` 说明没有变化，跳过。
- **全量路径**（`byte at a2+52 == 0`）：无条件序列化所有 27+ 个字段，用于首次上传或强制同步。

### 分片上传机制

`sub_99CC50` @ `0x99CC50` 是分片协调器，推断出来的对象布局：

```cpp
struct ChunkedUpload {
    /* +0  */ byte  enabled;        // 是否启用上传
    /* +4  */ void* buffer;         // 序列化后的数据 buffer
    /* +8  */ int   bufferSize;     // buffer 总大小
    /* +12 */ int   totalChunks;    // 总分片数 (bufferSize / 10240)
    /* +16 */ int   currentChunk;   // 当前分片 index
    // ...
};
```

核心逻辑：

```cpp
if (!this->enabled) {
    // 返回空字符串，跳过上传
    return empty_response;
}

if (this->buffer && this->currentChunk < this->totalChunks) {
    offset = 10240 * this->currentChunk;
    remaining = this->bufferSize - offset;
    chunkSize = min(10240, remaining);

    chunk = make_slice(this->buffer + offset, chunkSize);
    result = SendChunk(this, chunk);  // -> 0x99CE10
    this->currentChunk++;
    return result;
} else {
    return empty_string;  // 所有分片发送完毕
}
```

每次调用处理一个 10KB 分片，由上层循环驱动直到所有分片发完。

### sendUpsertUserAll 内部逻辑

**函数**：`projClient::ClientUpload::sendUpsertUserAll` @ `0x995050`

原始反编译结果（patch 前）：

```cpp
char __thiscall sendUpsertUserAll(_DWORD *this, int a2, int a3) {
    int v4;
    char v5;

    sub_47007C(v8);                                         // 初始化局部缓冲区
    sub_42E5DC(v9, *(this + 24), *(this + 25), a2, a3);    // 序列化完整 UserAll 数据
    v4 = sub_458E31();                                      // 获取全局 HTTP 客户端单例
    v5 = sub_461856(v4, v9, 0, 2);                         // 发送 HTTP POST 请求
    // ... cleanup SSO strings ...
    return v5;                                              // 返回 true/false
}
```

关键子调用：

| 函数 | 地址 | 作用 |
|------|------|------|
| `sub_47007C` | `0x47007C` | 初始化一个 std::string 或 buffer |
| `sub_42E5DC` | `0x42E5DC` | 核心序列化：调用 `0x9E3D50`，把 UserAll 聚合对象序列化为 JSON 字符串 |
| `sub_458E31` | `0x458E31` | 返回全局 HTTP 客户端单例（`&dword_1C7462C`） |
| `sub_461856` | `0x461856` | HTTP 发送 thunk，跳转到 `0x996DC0` |

`sub_996DC0` @ `0x996DC0` 是实际的 HTTP 传输函数（约 1098 字节），它：

1. 检查连接状态（`this + 64` 处的 flag，如果为 1 直接返回 0）
2. 序列化请求体（带 `#` 分隔符）
3. 计算 HMAC 或签名（`sub_45B717`，使用 `this + 96` 和 `this + 100` 处的密钥）
4. 通过 WinHTTP 发送请求
5. 返回成功/失败标志

### 调用链总览

从游戏结束到成绩上传的完整调用链：

```
游戏结束
  → PlaySM::postResultDecision()
    → ChunkedUpload::dispatchNext() @ 0x99CC50
      → ChunkedUpload::sendChunk() @ 0x99CE10
        → ClientUpload::buildMetadata() @ 0x9989E0
          → [构建 orderId / divNumber / divLength / clientUpload 元数据]
        → ClientUpload vtable[1]() @ 0x995050  (sendUpsertUserAll)
          → UpsertUserAll::serialize() @ 0x9E3D50 → 0x9D6C40
            → [序列化 27+ 种玩家数据为 JSON]
          → HTTPClient::getInstance() @ 0x9E3530
          → HTTPClient::send() @ 0x996DC0
            → [签名 → WinHTTP POST → 返回结果]
```

## Patch 分析

### Patch 目标

**函数**：`projClient::ClientUpload::sendUpsertUserAll` @ `0x995050`

这是成绩上传流程中最关键的一环 —— 它是虚表中唯一负责把完整 UserAll 数据通过网络发出去的入口。在它之上是分片调度和元数据构建，在它之下是 WinHTTP 传输层。patch 掉这一层，上面的所有逻辑都变成了无用功。

### 为什么选这个函数

它是 `ClientUpload` 虚表的第 2 个条目（vtable slot 1），所有成绩上传请求最终都经过这个函数。不存在绕过它的旁路。

并且它只影响 `UpsertUserAll` 这个请求类型。其他网络功能（认证、匹配、下载等）走的是不同的 vtable slot 或完全不同的类，不受影响。

### Patch 内容

#### 原始字节

```
995050: 55                 push    ebp
995051: 8B EC              mov     ebp, esp
995053: 6A FF              push    0FFFFFFFFh
995055: 68 70 C1 59 01     push    offset SEH_995050
99505a: 64 A1 00 00 00 00  mov     eax, large fs:0
...
```

原始函数有完整的 SEH prologue、局部变量初始化、序列化调用、HTTP 发送、cleanup 等等。

#### Patched 字节

```
995050: 33 C0              xor     eax, eax
995052: C2 08 00           retn    8
```

```
原始: 55 8B EC 6A FF ...
补丁: 33 C0 C2 08 00 ...
```

只有 5 字节，前两条原始指令（`push ebp` + `mov ebp, esp`）共 3 字节被覆盖，外加第 3 条指令 `push -1` 的前 2 字节。

#### 反编译对比

```cpp
// BEFORE:
char __thiscall sendUpsertUserAll(_DWORD *this, int a2, int a3) {
    sub_47007C(v8);                                         // 初始化缓冲区
    sub_42E5DC(v9, *(this + 24), *(this + 25), a2, a3);    // 序列化 UserAll
    v4 = sub_458E31();                                      // 获取 HTTP 客户端
    v5 = sub_461856(v4, v9, 0, 2);                         // 发送请求
    // ... cleanup ...
    return v5;
}

// AFTER:
int __stdcall sendUpsertUserAll(int a1, int a2) {
    return 0;
}
```

函数入口直接返回 0（false），不做任何操作。

#### 为什么是 `retn 8` 而不是 `retn`

`sendUpsertUserAll` 是通过虚表调用的 `__thiscall` 方法：

- `this` 在 `ecx` 中（不需要栈清理）
- 2 个显式参数 `a2`、`a3` 在栈上，各 4 字节 = 8 字节

栈帧验证：

```
__saved_registers @ ebp+0x3c   (pushed ebp)
__return_address @ ebp+0x40    (return address)
arg_0            @ ebp+0x44    (a2, 4 bytes)
arg_4            @ ebp+0x48    (a3, 4 bytes)
```

调用者 push 了 8 字节，callee 必须通过 `retn 8` 来清理。如果用裸 `retn`（`C3`），栈会不平衡，调用者会崩溃。

#### 残留字节处理

`0x995055` 之后的原始字节（`68 70 C1 59 01 ...`）在 patch 后变成不可达的死代码。不需要 NOP 它们 —— 执行流从 `0x995052` 的 `retn 8` 直接返回，永远不会碰到那些字节。

IDA 的分析可能会对残留的 `SEH_995050` 引用报警告（因为 SEH setup 被跳过了但 `.pdata` 里还有条目），这纯粹是外观问题，运行时没有任何影响 —— SEH handler 只在异常发生时才会被查找，而这个函数根本不会触发异常。

## 总结

这个 patch 的核心思路极其简单：在成绩上传函数的入口处放一个 `return false`。

最终结果是 5 字节的 patch，精确阻断单个 API，不影响任何其他功能。

和之前的自检跳过 patch 一样，修改函数入口比修改中间逻辑更可靠 —— 你不需要理解函数内部做了什么，只需要知道它返回什么、调用者如何处理返回值。`xor eax, eax; retn N` 是最通用的 "kill switch" 模式。
