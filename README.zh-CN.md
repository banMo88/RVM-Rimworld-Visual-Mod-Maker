# RVM - RimWorld Visual Mod Maker

[English README](README.en.md) | 中文说明

（本人只是个学生，第一次写这种项目，如果您觉得自述文件太长或不清楚，请将其交给AI，让他们逐步解释如何运行。）

RVM（RimWorld Visual Mod Maker）是一个面向非编程用户的 RimWorld Mod 可视化制作工具。它的目标是让用户尽量不写代码、不手写 XML，而是通过界面填写名称、数值、上传贴图并导出可用的 RimWorld Mod。

> **风险提示**  
> 本项目及本教程涉及的任何安装、下载和运行操作均由使用者自行承担风险。作者已自行测试过相关流程，但不提供任何担保，也不对可能产生的后果负责。

## 项目地址

GitHub: <https://github.com/banMo88/RVM-Rimworld-Visual-Mod-Maker>

## 目录

- [环境要求](#环境要求)
- [安装 Node.js](#安装-nodejs)
- [安装项目依赖](#安装项目依赖)
- [运行项目](#运行项目)
- [基本使用流程](#基本使用流程)
- [界面语言与命名注意事项](#界面语言与命名注意事项)
- [Mod 基础信息](#mod-基础信息)
- [依赖项](#依赖项)
- [主要功能](#主要功能)
- [导出与保存](#导出与保存)
- [测试 Mod](#测试-mod)
- [新手推荐学习顺序](#新手推荐学习顺序)
- [重要提醒](#重要提醒)
- [已知缺陷 / Bug](#已知缺陷--bug)

## 环境要求

- Windows 系统
- Node.js
- npm
- 推荐使用 Chrome 浏览器打开本地页面
- RimWorld 游戏本体
- 根据 Mod 内容，可能需要对应 DLC 或前置 Mod，例如：
  - Humanoid Alien Races
  - Biotech
  - Ideology
  - Anomaly
  - Odyssey

## 安装 Node.js

1. 前往 Node.js 官网下载安装包：
   - 官方下载页：<https://nodejs.org/en/download>
   - 中国大陆用户可考虑中文下载页：<https://nodejs.org/zh-cn/download/>
2. 下载完成后双击安装包。
3. 安装时通常一直点击 `Next`，然后点击 `Install`。
4. 如果安装器出现 `Add to PATH` 选项，请保持勾选。
5. 安装完成后，按 `Win + R`，输入 `cmd`，回车打开终端。
6. 在终端输入：

```bash
node -v
```

如果能显示版本号，说明 Node.js 安装成功。

## 安装项目依赖

1. 从 GitHub 下载本项目压缩包。
2. 解压到一个文件夹中。
3. 在项目文件夹中打开终端，或使用 `cd` 进入项目目录：

```bash
cd 你的项目文件夹路径
```

项目文件夹结构通常类似：

```text
project/
  src/
  index.html
  package.json
  tsconfig.json
  vite.config.js
```

有科学上网环境时，可以使用：

```bash
npm install --registry=https://registry.npmjs.org/ --no-audit --no-fund --ignore-scripts --verbose
```

中国大陆网络环境可尝试镜像源：

```bash
npm install --registry=https://registry.npmmirror.com/ --no-audit --no-fund --ignore-scripts --verbose
```

安装完成后，项目文件夹内通常会出现 `node_modules/` 文件夹。只要命令没有报错并正常结束，一般就表示依赖安装成功。

## 运行项目

在项目文件夹中打开终端，执行：

```bash
npm run web
```

如果浏览器没有自动弹出页面，请复制终端中显示的本地地址，并粘贴到浏览器中打开。推荐使用 Chrome。

常见地址类似：

```text
http://127.0.0.1:5173/
```

## 基本使用流程

通常按以下顺序制作 Mod：

1. 填写 Mod 基础信息。
2. 选择要制作的内容，例如种族、物品、科技、剧本、故事叙述者等。
3. 上传贴图。
4. 检查导出页面是否有报错。
5. 导出 Mod。
6. 将导出的 Mod 放入 RimWorld 的 `Mods` 文件夹。
7. 进入游戏测试。

第一次制作 Mod 时，建议先只做一个简单物品或简单种族，不要一开始就同时开启所有功能。

## 界面语言与命名注意事项

右上角可以切换界面语言：

- 中文
- English

即使界面切换为中文，部分 RimWorld 内部字段仍必须使用英文，例如：

- `defName`
- `packageId`
- `ThingDef`
- `ScenarioDef`
- `StorytellerDef`
- `FactionDef`
- `GeneDef`

这些是 RimWorld 内部识别用名称，不能翻译成中文。

## Mod 基础信息

每个 Mod 都需要填写基础信息。

### Mod 名称

显示在游戏 Mod 列表中的名称。

示例：

```text
My First Mod
```

### Package ID

`packageId` 是 RimWorld 用来判断两个 Mod 是否为同一个 Mod 的唯一编号。

推荐格式：

```text
作者名.mod名.功能名
```

示例：

```text
authorName.myfirstmod
```

每个 Mod 的 `packageId` 必须不同。如果两个 Mod 的 `packageId` 相同，RimWorld 可能会认为它们是重复 Mod，并隐藏其中一个。

### 作者、描述、支持版本

这些信息会写入：

```text
About/About.xml
```

用于 RimWorld 的 Mod 列表展示。

推荐支持版本填写：

```text
1.6
```

## 依赖项

如果你的 Mod 需要其他 Mod 或 DLC 才能运行，请在依赖项中添加。

自定义种族通常需要：

```text
Humanoid Alien Races
```

如果使用 DLC 内容，需要确认对应 DLC 已启用，例如：

- Biotech
- Ideology
- Anomaly
- Odyssey

新手可以先不手动修改依赖。当启用“自定义种族”时，编辑器会自动处理 HAR 相关依赖。

## 主要功能

### 自定义种族

用于制作新的可用种族。

注意：自定义种族依赖 `Humanoid Alien Races`。

启用选项：

```text
Enable Custom Race / HAR RaceDef
```

不做种族时不要勾选。

常见字段：

| 字段 | 说明 |
| --- | --- |
| `defName` | 种族内部名称，只能使用英文 |
| `label` | 游戏内显示名称 |
| `description` | 种族描述 |
| `health scale` | 生命倍率 |
| `move speed` | 移动速度 |
| `melee damage` | 近战伤害 |

示例：

```text
defName: Stonekin
label: stonekin
description: A stone-skinned humanoid race.
```

#### 贴图模式

自定义种族需要上传身体和头部贴图。

支持模式：

- `Shared one set`：男女共用一套贴图。
- `Male / Female`：男性和女性分别上传贴图。
- `Body type`：按体型上传，例如 Thin / Fat / Hulk 等。

每套身体或头部通常需要三张图：

- Front 正面
- Side 侧面
- Back 背面

编辑器会自动处理 RimWorld 需要的方向文件。

#### 保留原始贴图颜色

`Preserve original texture colors / 保留原始贴图颜色` 用于尽量避免游戏根据肤色随机染色贴图，使贴图更接近上传 PNG 的原色。

如果希望游戏自动生成不同肤色，可以不勾选。

### 基因 / GeneDef

如果安装了 Biotech，可以给自定义种族添加基因。

添加方式：

1. 在列表中勾选常见基因。
2. 手动输入 `GeneDef`。

示例：

```text
MeleeDamage_Strong
MoveSpeed_Quick
Robust
```

`GeneDef` 必须真实存在。如果拼写错误，游戏会报错。

### 派系

派系用于让你的种族在世界地图上作为势力出现。

示例：

```text
Stonekin Enclave
Machine Clan
Foxkin Tribe
```

常见字段：

| 字段 | 说明 |
| --- | --- |
| `Faction defName` | 派系内部名称 |
| `label` | 显示名 |
| `description` | 描述 |
| `techLevel` | 科技水平 |
| `leaderTitle` | 首领称号 |
| `requiredCountAtGameStart` | 开局必须生成几个 |
| `maxConfigurableAtWorldCreation` | 世界创建界面最多能添加几个 |

如果只是制作玩家使用的种族，不一定需要开启派系。

### 添加物品

点击：

```text
New item / 新物品
```

然后选择物品类型。

目前支持：

- Generic 普通物品
- Food 食物
- Hair 发型
- Apparel 衣物装备
- Weapon 武器
- Building 可建造物

每个物品卡片可以展开或收起，方便管理多个物品。

### 武器

支持类型：

- Melee weapon 近战武器
- Single-shot ranged weapon 单发远程武器
- Automatic ranged weapon 自动远程武器
- Laser / beam weapon 激光 / 光束武器

#### 近战武器

主要设置：

- `damage`：伤害
- `cooldown`：攻击间隔
- `melee armor penetration`：近战护甲穿透
- `market value`：价值
- `mass`：重量
- `work to make`：制作工时
- `cost`：材料成本

近战武器不会显示射程、弹速、爆炸半径等远程参数。

#### 普通远程武器

可设置：

- `damage`：伤害
- `range`：射程
- `warmup time`：瞄准时间
- `cooldown`：冷却
- `burst shots`：连发次数
- `ticks between burst shots`：连发间隔
- `ranged armor penetration`：远程护甲穿透
- `projectile speed`：弹速
- `accuracy`：不同距离精度
- `sound preset`：原版声音模板

远程武器会自动生成自己的弹丸，不再直接套用原版突击步枪的伤害。

#### 爆炸弹丸

如果要制作爆炸武器：

```text
damageDef = Bomb
explosionRadius = 6
```

要求：

- `Damage type damageDef` 设置为 `Bomb`
- `Explosion radius` 大于 0

#### 激光 / 光束武器

激光武器参考原版 Beam Repeater 类逻辑。

可设置：

- `beam width`：光束宽度
- `beam full-width range`：光束保持宽度的距离
- `beam visual preset`：光束视觉效果
- `beam sound preset`：光束声音
- `damageDef`：伤害类型，通常用 `Beam`

如果看不到明显光束，可以尝试不同的 Beam visual preset。

### 可建造物

v38 以后支持添加可建造物。

物品类型选择：

```text
Building
```

可以制作：

- 家具
- 装饰物
- 简单设施
- 静态建筑
- 普通可建造摆件

常见设置：

| 字段 | 说明 |
| --- | --- |
| `Size X / Size Y` | 占地大小 |
| `Max hit points` | 耐久 |
| `Fill percent` | 填充程度 |
| `Passability` | 是否能通过 |
| `Designation category` | 出现在建筑菜单哪个分类 |
| `Work to build` | 建造工时 |
| `Steel cost` | 钢铁成本 |
| `Component cost` | 零部件成本 |
| `Made from stuff` | 是否使用材料系统 |
| `Research prerequisite` | 前置科技 |

测试时建议：

```text
designationCategory = Furniture
researchPrerequisite 留空
madeFromStuff 先关闭
```

这样最容易在游戏里的建筑菜单找到。

### 科技树

科技树功能用于添加新的研究项目。

可填写：

- `Research defName`
- `label`
- `description`
- `baseCost`
- `techLevel`
- `prerequisites`
- `research view X`
- `research view Y`

科技树归属支持：

- 合并至原版科技树
- 新建独立科技树

如果选择“合并至原版科技树”，科技会进入主科技树。  
如果选择“新建独立科技树”，编辑器会生成新的 `ResearchTab`，让科技单独显示在新标签页中。

多个前置科技请用英文逗号分隔：

```text
Microelectronics,Smithing
```

不要使用中文逗号：

```text
Microelectronics，Smithing
```

### 故事叙述者

用于新增 AI Storyteller，而不是覆盖原版 Cassandra、Phoebe、Randy。

可设置：

- `defName`
- `label`
- `description`
- `baseProfile`
- `portraitLarge`
- `portraitTiny`
- `population targets`
- `event rhythm`

`baseProfile` 简单理解：

- Cassandra：经典节奏
- Phoebe：较平缓
- Randy：随机性强

不熟悉参数时，建议先使用 Cassandra 模板。

头像可上传：

- `portraitLarge`：大头像
- `portraitTiny`：小头像

如果头像太大，建议先压缩 PNG，否则浏览器可能变慢。

### 剧本

剧本决定玩家开局条件。

可设置：

- `startingPawnCount`：开始时已选择的角色数量
- `chooseFromPawnCount`：候选池人数
- `startWithSilver`：开局银
- `startWithPackagedMeals`：包装生存餐
- `startWithMedicine`：药品
- `startWithComponents`：零部件
- `startWithSteel`：钢铁
- `player faction`：玩家开始派系

玩家开始派系可选择：

- `New arrivals / PlayerColony`
- `New tribe / PlayerTribe`

如果开启了自定义种族，可以勾选：

```text
Force starting pawns to use custom race
```

v50 中该功能提供两种模式：

- Stable custom race start
- Experimental candidate pool

普通用户建议使用：

```text
Stable custom race start
```

它更稳定，但候选池可能仍然受到 RimWorld / HAR 机制限制。

### 素材管理

素材页面用于查看已上传的 PNG。

可检查：

- 哪些贴图已上传
- 哪些贴图缺失
- 贴图路径是否正确

建议所有贴图使用：

```text
.png
```

不要使用：

```text
.jpg
.webp
.bmp
```

## 导出与保存

### 导出 Mod

导出页面会生成可放入 RimWorld 的 Mod ZIP。

导出的可游玩 Mod 通常只包含：

```text
About/
Defs/
Textures/
```

从 v41 开始：

- `log`
- `source project json`

不会再放进 Mod 压缩包，而是保存到编辑器文件夹中，例如：

```text
rimworld-visual-mod-maker-v50/logs/
rimworld-visual-mod-maker-v50/source/
```

这样游戏使用的 Mod 包会更干净。

### 保存与继续编辑

编辑器会自动保存一部分项目状态。为了安全，建议经常手动导出：

```text
Export project JSON
```

下次可通过以下功能继续编辑：

```text
Import project JSON
```

如果长期制作一个 Mod，不要只依赖浏览器缓存。

## 测试 Mod

### 测试普通物品 / 武器

进入游戏后打开开发者模式：

```text
Options -> Development mode
```

然后使用：

```text
Spawn thing
```

搜索物品的 `defName`。

### 测试可建造物

进入建筑菜单：

```text
Architect -> Furniture / Production / Misc / Structure
```

查找建筑显示名。找不到时，用开发者模式搜索它的 `defName`。

### 测试种族

如果使用自定义种族，加载顺序要正确：

```text
Harmony
Core / DLC
Humanoid Alien Races
Your Mod
```

可使用开发者模式：

```text
Spawn pawn
```

搜索你的 `PawnKindDef`。

### 测试剧本

新建游戏时选择你的自定义 `Scenario`。

如果开启了强制自定义种族，建议检查开局人物贴图是否正确。

## 新手推荐学习顺序

第一次使用建议按以下顺序学习：

1. 做一个普通物品。
2. 做一个武器。
3. 做一个可建造物。
4. 做一个科技。
5. 做一个剧本。
6. 做一个故事叙述者。
7. 最后再尝试自定义种族和派系。

不要第一次就把所有功能都打开。这样如果游戏报错，会更容易定位是哪一部分导致的问题。

## 重要提醒

1. `defName` 尽量只使用英文、数字和下划线。
2. 每个 Mod 的 `packageId` 必须唯一。
3. 多个项目请用英文逗号分隔。
4. 测试新版前，删除旧导出的 Mod 文件夹。
5. 自定义种族必须启用 `Humanoid Alien Races`。
6. 使用 Biotech 基因或 Xenotype，需要启用 Biotech DLC。
7. 使用 Anomaly / Odyssey 特效或武器逻辑时，需要确认对应 DLC 已启用。
8. 遇到红字时，优先查看日志里是否出现你的 `packageId`、`defName` 或 Mod 名称。

## 已知缺陷 / Bug

1. 暂时不支持编辑事件。
2. 暂时不支持编辑动物、植物、机械体、异象生物。
3. 新剧本选人界面只有一开始被选中的是自定义种族，备选角色仍是普通人类；点击“随机”后角色人种会变回普通人类。
4. 暂时不支持创建种族的动态表情。
5. 即使勾选“保留贴图原本的颜色”，进入游戏后仍可能被随机修改肤色。
6. 暂时不支持编辑文化和意识形态。
7. 暂时不支持导入非本制作器制作的现有 Mod。
8. 开局角色的头发、纹身、名字、胡须等仍继承自普通人类，暂时不支持修改。
