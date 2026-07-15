---
title: 巫女插件使用说明书
date: 2026-06-18 10:12:06
tags: [ 中二节奏, 逆向工程 ]
excerpt: 来自 kohaD 的馈赠
toc: true
title-number: true
---

==Codex 帮我写的，我懒死了==

本说明书按功能介绍插件的主要用途。界面内可通过 ==Function== 下拉菜单切换功能页，也可以勾选 ==Pinned== 将常用功能固定在顶部。

![](1.png)

## 启动与基础操作

首次打开插件时会显示免责声明页面。阅读后点击 ==I agree== 才会进入主界面。插件不会记住同意状态，每次启动都需要重新确认。==(但是会记住各个功能的状态！)==

![](2.png)

主界面左上角显示当前 FPS，并提供语言选择。按 ==HOME== 可以隐藏或显示插件窗口。

底部有几个全局设置：

- ==Scale==：调整插件窗口缩放。
- ==Opacity==：调整插件窗口透明度。
- ==Rounded corners==：切换圆角样式。
- ==Reset all settings==：重置插件设置。

![](3.png)

## Song Info

==Song Info== 用于查看当前歌曲和谱面的基础信息。

它会显示：

- 当前曲名。
- 当前难度。
- 歌曲 ID。
- 当前分数。
- 当前谱面 Rating。
- 总物量。
- 当前进度，例如 ==1234/2000 61.7%==。
- 谱面密度图。
- TAP 判定延迟。

谱面密度图会用不同颜色表示不同类型音符：

- TAP：红色。
- HOLD：黄色。
- SLIDE：深蓝色。
- AIR：绿色。
- FLICK：浅蓝色。

游玩中，密度图上会有当前位置指示线，方便观察当前段落的物量分布。

(如上图)

## Controls

==Controls== 放置游玩控制相关功能。

==SUPER MYSTERIOUS FUNCTION?! == 是自动游玩相关开关。启用后会让游戏自动处理谱面输入，适合测试判定、技能和视觉效果。

==SERVICE restart method== 用于选择 SERVICE 键触发重开的方式。不同方式适用于不同状态；如果某个方式在当前版本不可用，可以切换另一种。

==Restart now== 可以立即手动触发重开。该按钮主要用于测试，不建议在非游玩状态反复点击。

![](4.png)

## Mouse Touch Input

==Mouse Touch Input== 可以把鼠标点击映射成触摸板输入，适合没有实体触摸板时测试谱面。

主要选项：

- ==Enable mouse touch lanes==：启用鼠标触摸输入。
- ==Click both rows==：点击时同时触发上下两排。
- ==AIR tower input==：启用 AIR 区域输入。
- ==AIR with lane clicks==：点击普通面板时同时触发 AIR。
- ==AIR strip height==：调整 AIR 区域高度。
- ==Half width==：调整触摸区域从屏幕中心向左右展开的宽度。
- ==Panel height==：调整底部触摸面板高度。
- ==Default values==：恢复默认触摸区域。
- ==Clear touch==：清除当前触摸状态。

启用后，画面上会显示蓝色网格区域，方便确认点击范围。

![](5.png)

## Judgement Override

==Judgement Override== 用于替换游戏判定结果。

常用功能：

- ==Enable judgement substitution==：启用判定替换。
- ==Force every judgement==：强制所有判定使用指定结果。
- ==Critical -> Justice==：把 Justice Critical 替换为 Justice。
- ==Identity==：恢复默认映射。
- ==All Justice==：快速设置为全 Justice 风格。

下方表格可以针对不同判定类型设置替换规则。这个功能适合测试结算、技能和不同判定结果下的显示效果。

![](6.png)

## Custom Skill

==Custom Skill== 用于自定义技能槽的增长规则。

顶部的 ==Gauge loudness display== 是特殊显示模式。启用后，技能槽会变成音频响度显示，其他自定义技能规则会暂时失效。

==Base filled slots== 可以指定基础填充槽数。例如设置为 ==6== 时，显示会围绕第 6 槽附近变化。

![](7.png)

普通自定义技能模式包括：

- ==Preset==：选择预设规则。
- ==Enable Custom Skill==：启用自定义技能。
- ==Reset rules==：恢复规则。
- ==Base delta==：选择基础增减方式。
- ==Overall==：整体倍率。
- ==Scale negative deltas==：负增长也按倍率缩放。

当前预设：

- ==Normal==：整体 200%。
- ==Temperance==：只让最后 1/4 进度生效，并使用高倍率。
- ==Keyboard==：按音符类型分配不同倍率，更偏向键盘玩法测试。
- ==Fear of Heights==：整体提高，但 AIR 类音符会减少。

==Only selected note types give gauge== 可以让只有选中的音符类型提供技能槽。下面的表格可以分别调整 TAP、HOLD、SLIDE、AIR、FLICK 等类型。

==Use progress window== 可以限制只有歌曲某一段进度提供技能槽。例如只让后半段、最后 25% 或某个区间生效。

![](8.png)

## Display Rating

==Display Rating== 只修改画面上显示的 Rating，不修改真实玩家数据。

主要选项：

- ==Override display rating==：启用显示 Rating 覆盖。
- ==Force 99.99 rating==：强制显示 ==99.99==，同时禁用手动输入。
- ==Rating==：输入想显示的数值，允许负数和任意范围。

关闭覆盖后，显示会回到游戏真实数值。

![](9.png)

## Display Name

==Display Name== 用于覆盖画面中的玩家显示名称。

主要选项：

- ==Override display name==：启用显示名称覆盖。
- ==Name==：输入要显示的名称。

该功能只影响显示层，不用于修改实际账号资料。

![](10.png)

## Atom Sound

==Atom Sound== 用于查看和控制游戏音频通道。

常用操作：

- ==Apply master volume to all channels==：启用全局音量倍率。
- ==Master volume==：调整总音量倍率。
- ==Mute all==：一键静音。
- ==Restore volumes==：恢复音量。
- ==Stop all channels==：停止所有通道。
- ==Channel==：选择单个通道。
- ==Override selected==：启用当前通道覆盖。
- ==Selected volume==：调整当前通道音量。
- ==Apply selected now==：立即应用当前通道设置。
- ==Reset selected==：重置当前通道。

==Channel Overrides== 表格可以一次查看多个通道的状态和音量。常见用途是降低 BGM、保留打击音，或单独测试某个声音通道。

![](11.png)

![](12.png)
![](13.png)

## Visuals

==Visuals== 用于改变音符和部分游戏画面元素的视觉表现。

==Bounce== 可以让目标元素在 XYZ 方向上偏移或弹跳：

- 关闭 ==Continuous== 时，设置的是固定偏移。
- 开启 ==Continuous== 时，元素会持续弹跳。
- ==Bounce speed== 控制弹跳速度。
- ==Bounce extra UI== 会让更多 UI 元素也参与弹跳。

==Rotate== 可以让目标元素旋转：

- 关闭 ==Continuous== 时，设置的是固定角度。
- 开启 ==Continuous== 时，设置的是旋转速度。
- ==Rotate extra UI== 会让更多 UI 元素参与旋转。

==Restore default== 可以恢复视觉参数。

![](14.png)

## Freecam

==Freecam== 用于调整游戏摄像机视角。

主要选项：

- ==Enable freecam==：启用自由摄像机。
- ==Position==：调整摄像机位置。
- ==Yaw==：左右旋转。
- ==Pitch==：上下俯仰，范围为 ==-90°== 到 ==90°==。
- ==Roll==：画面横滚。

Freecam 适合观察谱面、场景和特效。恢复默认视角时，请先关闭 Freecam 或使用页面内的默认恢复功能。

![](15.png)

## Field Wall

==Field Wall== 用于调整游戏场地墙体的位置和拉伸。

主要选项：

- ==Enable transform==：启用墙体变换。
- ==XYZ offset==：调整墙体在 X、Y、Z 方向的位置。
- ==XYZ stretch==：调整墙体在 X、Y、Z 方向的缩放。
- ==Restore default==：恢复默认墙体参数。

该功能主要用于画面效果测试。数值过大可能导致画面元素跑出可见范围。

![](16.png)

## Text / Font

==Text / Font== 用于把游戏内文字随机打乱成无意义文本。

==Shuffle game text into nonsense== 开启后，部分游戏文字会变成随机内容。适合娱乐或测试字体渲染，不建议在正常游玩时开启。

![](17.png)

## Fumen Randomizer

==Fumen Randomizer== 用于在谱面加载时随机修改谱面表现和音符属性。

主要功能：

- ==Randomize note positions==：随机音符位置。
- ==Randomly replace tap/chara/flick with damage==：按概率把 TAP、角色音符、FLICK 替换为伤害音符。
- ==Damage chance==：伤害音符替换概率。
- ==Randomize note size==：随机音符大小。
- ==Override AIR height==：覆盖 AIR 高度。
- ==Height==：指定 AIR 高度。
- ==Use out-of-range lanes (-16..31)==：允许使用正常 16 键以外的左右扩展区域。
- ==Avoid tap/chara/flick overlap==：避免 TAP、exTAP、FLICK 互相重叠。
- ==Randomize slide notes and paths==：随机 SLIDE 的头尾和路径。
- ==Reseed==：重新生成随机种子。

![](18.png)

## Patches

==Patches== 是独立补丁开关页面。

常见补丁包括：

- ==Skip PowerOnTest==：跳过部分开机测试。
- ==Skip Initialize==：跳过部分初始化流程。
- ==Skip Copyright Warning==：跳过版权提示。
- ==Experimental 240Hz chart/UI timing==：实验性 240Hz 相关补丁。
- ==Force Rainbow Song Jackets==：强制歌曲封面显示彩虹效果。
- ==Block UpsertUserAll==：阻止用户数据上传。
- ==Block BS1/AllNet ban==：阻止特定 AllNet/BS1 请求。
- ==Unlock MASTER/ULTIMA select gate==：绕过 MASTER/ULTIMA 选择门槛。

部分补丁关闭后可能需要重启游戏才能完全恢复。建议只开启自己明确需要的补丁。

![](19.png)

## Sigscan Report

==Sigscan Report== 用于查看插件是否成功找到各项功能需要的位置。

状态含义：

- ==OK==：已成功匹配。
- ==fallback==：使用了备用地址。
- ==failed==：没有找到，相关功能会不可用或被禁用。

==Export txt== 可以导出报告文本，便于排查不同游戏版本的兼容性问题。

![](20.png)


## 注意事项

- 这个插件包含大量实验性功能，建议一次只改一个功能，确认效果后再继续。
- 谱面随机、视觉变换、判定替换、技能规则等功能会明显改变游玩体验。
- 显示 Rating 和显示名称只影响画面显示，不用于修改真实账号资料。
- 如果某个功能显示不可用，通常是当前游戏版本没有匹配到对应位置，可以查看 ==Sigscan Report==。
- 使用前建议保留一份可用配置，出现问题时优先重置设置或关闭最近启用的功能。