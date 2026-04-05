---
title: 日二节奏跳过自检
date: 2026-04-05 22:46:58
tags: [中二节奏, 逆向工程]
excerpt: 通过一些 educated guess 和 vibe-coding 取得的结果
toc: true
title-number: true
---

## 概述

所有分析基于 X-VERSE-X 的 `chusanApp.exe`（base address `0x400000`）。

==仅供学习参考。==

## State Machine 架构

### 整体结构

CHUNITHM 用了一套层级式的 state machine 来管理启动流程：

```
Root StateMachine
├─ State 0: PowerOn
│  ├─ State 0: PowerOnLoad (XML asset loading)
│  └─ State 1: PowerOnTest (hardware diagnostics)
└─ State 1: Initialize  
   ├─ State 0: InitializeMecha (device tests)
   └─ State 1: InitializeCollab (network + dist server)
```

### State Machine Base Class

**函数**：`StateMachineBase_ctor` @ `0xA33E10`

反编译签名长这样：

```cpp
StateMachineBase* __thiscall StateMachineBase_ctor(
    StateMachineBase* this,
    int parentSM,
    int stateCount  // ← the key parameter
)
```

核心逻辑（反编译结果）：

```cpp
this->field_5 = parentSM;
this->field_6 = stateCount;  // Stored at this+0x18
// ... initialization of factory registry ...
```

从 xref 推断出的 state transition 逻辑：

```cpp
bool StateMachine::IsComplete() {
    return (this->currentState >= this->stateCount);
}
```

== 当 `currentState >= stateCount` 时，这个 SM 就会向它的 parent 发送完成信号，然后把控制权交出去。== 整个 bypass 的核心就建立在这个简单的判断上。

---

## 分析方法

### Step 1：字符串

第一步是在 IDA Pro 里搜索已知的 state 名称字符串，目的是找到 state machine 的 constructor 和 factory registration 的位置。搜出来的结果：

```
0x18E9B18: "PowerOnTest"
0x18E9BBC: "InitializeMecha"  
0x18E9BD0: "InitializeCollab"
0x1C3A200: ".?AV?$FactoryConstructor@VPowerOnTest@projGame@@..."
0x1C3A328: ".?AV?$FactoryConstructor@VInitializeMecha@projGame@@..."
0x1C3A398: ".?AV?$FactoryConstructor@VInitializeCollab@projGame@@..."
```

RTTI 字符串暴露了 `FactoryConstructor<StateClass>` 的 template 实例化，这些都是在 parent SM 构建时注册进去的。

### Step 2：xrefs 分析

对字符串 "PowerOnTest" 做 xref，在 `0xD9D5B3` 附近找到了用法：

```asm
d9d5b3  push    1              ; state index
d9d5b5  mov     ecx, esi       ; this = PowerOn SM
d9d5b7  call    sub_44C05A     ; factory registration function
```

`push <index>; mov ecx, <sm>; call <register_func>` 这个 pattern 就是 factory registration 的特征 —— 每个 child state 在构建期间都会把自己注册到 parent SM 里。

### Step 3：Constructor 追踪

从 `0xD9D5B3` 往上追，找到了 parent 函数 `PowerOnSM_ctor` @ `0xD9D440`。`0xD9D46A` 处的 constructor prologue：

```asm
d9d46a  push    2              ; ← stateCount = 2
d9d46c  push    [ebp+arg_0]    ; parentSM
d9d46f  call    j_StateMachineBase_ctor
```

反编译出来是这样：

```cpp
int __thiscall PowerOnSM_ctor(int this, int a2, int a3) {
    j_StateMachineBase_ctor(a2, 2);  // ← stateCount hardcoded as immediate
    *this = &earth::StateMachine<projGame::PowerOn>::`vftable';
    // ... vtable setup, member initialization ...
    return this;
}
```

== state count 是以 immediate value 的形式 push 进去的（`push 2`）。直接改这一个字节，就能在不碰任何逻辑的情况下改变 SM 的终止条件。== 这是整个方案的基础发现。

### Step 4：Copyright 定位

其实这个自己并没有找到，而是参照了 tangent90 大佬的 X-VERSE 的跳过版权 patch，然后 sigscan 了一下来找到了 X-VERSE-X 对应的上一层 xref 和上下文。

反编译上下文：

```cpp
char __thiscall InitializeCollab_Execute(_DWORD* this) {
    // ... device checks ...
    if (!IsCopyrightWarningAcknowledged_thunk()) {
        return 0;  // Block progression
    }
    // ... proceed with initialization ...
    this[5] = 2;  // Transition to next state
    return 1;
}
```

顺着 thunk 找到目标函数 @ `0x7D4CA0`：

```asm
7d4ca0  xor     al, al    ; return 0
7d4ca2  retn
```

```cpp
char IsCopyrightWarningAcknowledged() {
    return 0;  // Always returns "not acknowledged"
}
```

==这是个永远返回 false 的 stub，强制让对话框显示出来。== 直接 patch 它就行。

---

## Patch 分析

### Patch 1：PowerOn State Count

**Patch**：`0xD9D46B`（在 `PowerOnSM_ctor` 里），原始字节 `6A 02`（`push 2`），改成 `6A 01`（`push 1`）。

```asm
; BEFORE:
d9d46a  push    2              ; stateCount = 2 (PowerOnLoad, PowerOnTest)
d9d46c  push    [ebp+arg_0]
d9d46f  call    j_StateMachineBase_ctor

; AFTER:
d9d46a  push    1              ; stateCount = 1 (PowerOnLoad only)
d9d46c  push    [ebp+arg_0]
d9d46f  call    j_StateMachineBase_ctor
```

PowerOnLoad（state 0）执行完后，`currentState` 自增到 1，条件 `1 >= 1` 成立，SM 发出完成信号，PowerOnTest（state 1）永远不会执行。== state transition 逻辑检查的是 `>=` 而不是 `==`，所以把 count 设成 1，state 1 就直接不可达了。==

---

### Patch 2：PowerOnTest Factory Registration NOP

**Patch**：`0xD9D5B3`（在 `PowerOn_ctor` 里），原始 9 字节 `6A 01 8B CE E8 9E EA 6A FF` 全替换成 NOP。

```asm
; BEFORE:
d9d5b3  push    1              ; state index = 1
d9d5b5  mov     ecx, esi       ; this = PowerOn SM
d9d5b7  call    sub_44C05A     ; RegisterStateFactory(1, PowerOnTest)
d9d5bc  mov     eax, esi

; AFTER:
d9d5b3  nop                    ; 9 bytes of NOP
d9d5bc  mov     eax, esi
```

这个 patch 和 Patch 1 是冗余的，但作为 defense-in-depth 存在 —— 万一 state count 检查失效，缺失的 factory 也能阻止执行。

---

### Patch 3：Initialize State Count

**Patch**：`0xD9DF5B`（在 `InitializeSM_ctor` 里），`6A 02` 改成 `6A 00`。

```asm
; BEFORE:
d9df5a  push    2              ; stateCount = 2 (InitializeMecha, InitializeCollab)
d9df5c  push    [ebp+arg_0]
d9df5f  call    j_StateMachineBase_ctor

; AFTER:
d9df5a  push    0              ; stateCount = 0 (no states)
d9df5c  push    [ebp+arg_0]
d9df5f  call    j_StateMachineBase_ctor
```

==`stateCount = 0` 的时候，初始 `currentState = 0`，条件 `0 >= 0` 立刻成立，SM 不执行任何 state 直接发出完成信号。== InitializeMecha 和 InitializeCollab 全部跳过。这里用 0 而不是 1，是因为设成 0 连 state 0 都不进，连第一个 state 的初始化开销都省了。

---

### Patch 4：Initialize Factory Registrations NOP

**Patch**：`0xD9E0A8`（在 `Initialize_ctor` 里），连续 18 字节全 NOP。

```asm
; BEFORE:
d9e0a8  push    0              ; state index = 0
d9e0aa  mov     ecx, esi
d9e0ac  call    j_InitializeMecha_factoryReg    ; 9 bytes total
d9e0b1  push    1              ; state index = 1
d9e0b3  mov     ecx, esi
d9e0b5  call    j_InitializeCollab_factoryReg   ; 9 bytes total
d9e0ba  mov     eax, esi

; AFTER:
d9e0a8  nop                    ; 18 bytes of NOP
d9e0ba  mov     eax, esi
```

两个 factory registration 恰好相邻，所以一次性 NOP 掉 18 字节就能同时搞定 InitializeMecha 和 InitializeCollab。同样是和 Patch 3 冗余的 defense-in-depth。

---

### Patch 5：Copyright Bypass

**Patch**：`0x7D4CA0`（函数 `IsCopyrightWarningAcknowledged`），`32 C0`（`xor al, al`）改成 `B0 01`（`mov al, 1`），就 2 字节。

```asm
; BEFORE:
7d4ca0  xor     al, al         ; AL = 0 (false)
7d4ca2  retn

; AFTER:
7d4ca0  mov     al, 1          ; AL = 1 (true)
7d4ca2  retn
```
---

## 验证与测试

### 静态验证

指令长度合计：

```
Patch 1:  1 字节  (0xD9D46B: 02 → 01)
Patch 2:  9 字节  (0xD9D5B3: push+mov+call → NOP×9)
Patch 3:  1 字节  (0xD9DF5B: 02 → 00)
Patch 4: 18 字节  (0xD9E0A8: 2×(push+mov+call) → NOP×18)
Patch 5:  2 字节  (0x7D4CA0: xor al,al → mov al,1)
```

所有被 NOP 掉的区域都包含完整的 `call` 指令，因为整条指令都被替换了，不需要另外修 relative offset。所有 patch 也都是自然对齐的，没有指令跨越 patch 边界的情况。

### 动态测试

结果：PowerOn SM 在 PowerOnLoad（state 0）完成后直接结束，Initialize SM 立刻完成，没有硬件测试对话框，没有版权对话框，游戏直接跳到主菜单。==没有观察到任何 crash，state machine 逻辑对 `stateCount = 0` 和 `stateCount = 1` 的情况都能优雅地处理。==

---

## 技术附录

### A. Patch 数据

```
Patch 1 @ 0xD9D46B:
  Original: 02
  Patched:  01

Patch 2 @ 0xD9D5B3:
  Original: 6A 01 8B CE E8 9E EA 6A FF
  Patched:  90 90 90 90 90 90 90 90 90

Patch 3 @ 0xD9DF5B:
  Original: 02
  Patched:  00

Patch 4 @ 0xD9E0A8:
  Original: 6A 00 8B CE E8 DC C5 6A FF 6A 01 8B CE E8 B3 BB 67 FF
  Patched:  90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90

Patch 5 @ 0x7D4CA0:
  Original: 32 C0
  Patched:  B0 01
```

### B. State Machine Vtable 结构

**PowerOn SM vtable** @ `0x18D3xxx`：

```cpp
struct StateMachine_PowerOn_vtable {
    void* dtor;
    void* Execute;
    void* OnEnter;
    void* OnExit;
    void* GetStateName;
    // ... additional virtual methods ...
};
```

State 执行流：

```cpp
while (!sm->IsComplete()) {
    sm->vtable->Execute(sm);
    sm->currentState++;
}
```

### C. Factory Registration 机制

`sub_44C05A`（thunk to `sub_D9D190`）负责把一个 state factory 注册到 parent SM 的 factory registry 里，推断出来的签名：

```cpp
void __thiscall RegisterStateFactory(
    StateMachine* parentSM,
    int stateIndex,
    FactoryConstructor* factory
);
```

效果是在 `parentSM->factoryRegistry[stateIndex]` 里添加一个条目，用于按需实例化 child state。


### D. Patch 应用代码

```cpp
void ApplyEarlyPatches() {
    DWORD oldProtect;
    
    // Patch 1: PowerOn state count 2 → 1
    VirtualProtect((void*)0xD9D46B, 1, PAGE_EXECUTE_READWRITE, &oldProtect);
    *(BYTE*)0xD9D46B = 0x01;
    VirtualProtect((void*)0xD9D46B, 1, oldProtect, &oldProtect);
    
    // Patch 2: NOP PowerOnTest factory registration
    VirtualProtect((void*)0xD9D5B3, 9, PAGE_EXECUTE_READWRITE, &oldProtect);
    memset((void*)0xD9D5B3, 0x90, 9);
    VirtualProtect((void*)0xD9D5B3, 9, oldProtect, &oldProtect);
    
    // Patch 3: Initialize state count 2 → 0
    VirtualProtect((void*)0xD9DF5B, 1, PAGE_EXECUTE_READWRITE, &oldProtect);
    *(BYTE*)0xD9DF5B = 0x00;
    VirtualProtect((void*)0xD9DF5B, 1, oldProtect, &oldProtect);
    
    // Patch 4: NOP both Initialize factory registrations
    VirtualProtect((void*)0xD9E0A8, 18, PAGE_EXECUTE_READWRITE, &oldProtect);
    memset((void*)0xD9E0A8, 0x90, 18);
    VirtualProtect((void*)0xD9E0A8, 18, oldProtect, &oldProtect);
    
    // Patch 5: Copyright check xor al,al → mov al,1
    VirtualProtect((void*)0x7D4CA0, 2, PAGE_EXECUTE_READWRITE, &oldProtect);
    *(BYTE*)0x7D4CA0 = 0xB0;
    *(BYTE*)0x7D4CA1 = 0x01;
    VirtualProtect((void*)0x7D4CA0, 2, oldProtect, &oldProtect);
}
```

在 `DllMain` 的 `DLL_PROCESS_ATTACH` 里调用，在任何游戏代码执行之前。用 `VirtualProtect` 临时把内存页标记为可写，操作完再还原原来的保护属性，符合 DEP 的要求。

### E. 版本可移植性

对于未来版本，有三种移植思路：基于字符串的 AOB scan、基于 pattern 的 scan、以及 signature 验证。

```cpp
DWORD FindPowerOnCtor() {
    // Search for "PowerOn" string
    DWORD strAddr = FindString("PowerOn");
    // Find xrefs to string
    DWORD* xrefs = GetXrefs(strAddr);
    // Locate constructor via xref analysis
    return LocateConstructor(xrefs);
}
```

```cpp
// Pattern: push 2; push [ebp+arg]; call <ctor>
BYTE pattern[] = {0x6A, 0x02, 0xFF, 0x75, '?', 0xE8, '?', '?', '?', '?'};
DWORD addr = AOBScan(pattern, sizeof(pattern));
```

```cpp
bool ValidatePowerOnCtor(DWORD addr) {
    // Verify vtable assignment follows constructor call
    if (*(BYTE*)(addr + 5) != 0x8B) return false;  // mov ecx, esi
    if (*(BYTE*)(addr + 10) != 0xC7) return false; // mov [esi], vtable
    return true;
}
```

### F. 已知局限性

所有 patch 用的都是硬编码的绝对地址，游戏更新后需要重新分析。Patch 假设启动流程正常进行，如果游戏在运行时尝试重新进入启动 state（比如按 TEST），行为是 undefined 的。

此外，跳过的硬件测试==可能会掩盖真实的硬件问题==。

另外，NOP 掉 factory registration 会阻止 state 实例化，但不会阻止 constructor 里其他初始化代码的执行，如果 constructor 在 factory registration 之外还有 side effect，那些 side effect 仍然会发生。

---

## 总结

==修改 control flow 的 metadata（state count）比 patch control flow 逻辑本身（jump、call）更可靠。State machine 自己的 completion check 反而成了 bypass 的工具。==

## 鸣谢

- **tangent90** 协助我了很多前备知识。
- **CaochengQWQ** 协助了很多测试和游戏知识，以及出给我了他的 chupico 手台。
- 所有的群 u 们。
---
