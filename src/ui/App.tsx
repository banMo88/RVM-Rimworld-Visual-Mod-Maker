import React, { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

type Lang = "en" | "zh";
type Direction = "front" | "side" | "back" | "single";
type ItemKind = "hair" | "food" | "apparel" | "weapon" | "building" | "generic";
type WeaponMode = "melee" | "rangedAuto" | "rangedSingle" | "beamLaser";
type WeaponSoundPreset = "AssaultRifle" | "BoltActionRifle" | "SniperRifle" | "Revolver" | "Autopistol" | "HeavySMG" | "LMG" | "ChargeRifle" | "Minigun" | "BeamSilent" | "BeamFlamethrower";
type BeamVisualPreset = "safeNone" | "anomalyIncinerator" | "custom";
type TextureMode = "shared" | "gendered" | "bodyTypes";
type HeadTextureMode = "shared" | "gendered";
type TechLevel = "Neolithic" | "Medieval" | "Industrial" | "Spacer" | "Ultra" | "Archotech";
type ResearchTreeOwnership = "vanilla" | "independent";

type Asset = {
  id: string;
  label: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
};

type LogEntry = {
  id: string;
  timestamp: string;
  scope: string;
  action: string;
  detail: string;
};

type Dependency = {
  packageId: string;
  displayName: string;
  required: boolean;
  steamWorkshopUrl?: string;
  downloadUrl?: string;
};

type ModInfo = {
  name: string;
  packageId: string;
  author: string;
  description: string;
  supportedVersions: string[];
  supportedVersionsCsv?: string;
};

type RaceConfig = {
  enabled: boolean;
  defName: string;
  label: string;
  description: string;
  textureMode: TextureMode;
  headTextureMode: HeadTextureMode;
  healthScale: number;
  moveSpeed: number;
  meleeDamage: number;
  bodySize: number;
  lifeExpectancy: number;
  genes: string[];
  xenotypeDefName: string;
  xenotypeLabel: string;
  xenotypeDescription: string;
  preserveTextureColors: boolean;
};

type FactionConfig = {
  enabled: boolean;
  defName: string;
  label: string;
  fixedName: string;
  description: string;
  culture: string;
  categoryTag: "Outlander" | "Tribal" | "Pirate";
  techLevel: TechLevel;
  requiredCountAtGameStart: number;
  maxConfigurableAtWorldCreation: number;
};

type AddItem = {
  id: string;
  kind: ItemKind;
  defName: string;
  label: string;
  description: string;
  marketValue: number;
  mass: number;
  flammability: number;
  deteriorationRate: number;
  beauty: number;
  workToMake: number;
  steelCost: number;
  componentCost: number;
  stackLimit: number;
  weaponMode: WeaponMode;
  damage: number;
  cooldown: number;
  meleeArmorPenetration: number;
  range: number;
  warmupTime: number;
  burstShotCount: number;
  ticksBetweenBurstShots: number;
  armorPenetration: number;
  projectileSpeed: number;
  accuracyTouch: number;
  accuracyShort: number;
  accuracyMedium: number;
  accuracyLong: number;
  soundPreset: WeaponSoundPreset;
  damageDef: string;
  projectileGraphicPath: string;
  projectileExplosionRadius: number;
  projectileStoppingPower: number;
  projectileChanceToStartFire: number;
  beamWidth: number;
  beamFullWidthRange: number;
  beamVisualPreset?: BeamVisualPreset;
  beamGroundFleckDef?: string;
  beamLineFleckDef?: string;
  beamEndEffecterDef?: string;
  customBeamSoundDef?: string;
  weaponTagsCsv: string;
  tradeTagsCsv: string;
  thingCategoriesCsv: string;
  recipeUsersCsv: string;
  madeFromStuff: boolean;
  stuffCategoriesCsv: string;
  costStuffCount: number;
  buildingSizeX: number;
  buildingSizeY: number;
  buildingPassability: "Standable" | "PassThroughOnly" | "Impassable";
  buildingFillPercent: number;
  buildingDesignationCategory: string;
  buildingMaxHitPoints: number;
  researchPrerequisite: string;
};

type ResearchProject = {
  id: string;
  defName: string;
  label: string;
  description: string;
  baseCost: number;
  techLevel: TechLevel;
  prerequisites: string[];
  prerequisitesCsv?: string;
  techTreeOwnership?: ResearchTreeOwnership;
  researchTabDefName?: string;
  researchViewX?: number;
  researchViewY?: number;
};

type StorytellerConfig = {
  enabled: boolean;
  defName: string;
  label: string;
  description: string;
  baseProfile: "Cassandra" | "Phoebe" | "Randy";
  listOrder: number;
};

type PlayerFactionDef = "PlayerColony" | "PlayerTribe";
type StartingPawnRaceMode = "stableSelectedOnly" | "experimentalCandidatePool";

type ScenarioConfig = {
  enabled: boolean;
  defName: string;
  label: string;
  summary: string;
  description: string;
  playerFactionDef: PlayerFactionDef;
  forceCustomRaceStartingPawns: boolean;
  startingPawnRaceMode: StartingPawnRaceMode;
  startingPawnCount: number;
  chooseFromPawnCount: number;
  startWithSilver: number;
  startWithPackagedMeals: number;
  startWithMedicine: number;
  startWithComponents: number;
  startWithSteel: number;
};

type Project = {
  schemaVersion: string;
  language: Lang;
  mod: ModInfo;
  dependencies: Dependency[];
  race: RaceConfig;
  faction: FactionConfig;
  items: AddItem[];
  research: ResearchProject[];
  storyteller: StorytellerConfig;
  scenario: ScenarioConfig;
  assets: Record<string, Asset>;
  logs: LogEntry[];
};

const STORAGE_KEY = "rimworldVisualModMaker.v50.project";
const BODY_TYPES = ["Male", "Female", "Thin", "Hulk", "Fat"];

const WEAPON_SOUND_PRESETS: Record<WeaponSoundPreset, { label: string; soundCast?: string; soundCastTail?: string; beamSoundCast?: string; beamOnly?: boolean }> = {
  AssaultRifle: { label: "Assault rifle", soundCast: "Shot_AssaultRifle", soundCastTail: "GunTail_Medium" },
  BoltActionRifle: { label: "Bolt-action rifle", soundCast: "Shot_BoltActionRifle", soundCastTail: "GunTail_Medium" },
  SniperRifle: { label: "Sniper rifle", soundCast: "Shot_SniperRifle", soundCastTail: "GunTail_Heavy" },
  Revolver: { label: "Revolver", soundCast: "Shot_Revolver", soundCastTail: "GunTail_Light" },
  Autopistol: { label: "Autopistol", soundCast: "Shot_Autopistol", soundCastTail: "GunTail_Light" },
  HeavySMG: { label: "Heavy SMG", soundCast: "Shot_HeavySMG", soundCastTail: "GunTail_Medium" },
  LMG: { label: "LMG", soundCast: "Shot_LMG", soundCastTail: "GunTail_Medium" },
  ChargeRifle: { label: "Charge rifle", soundCast: "Shot_ChargeRifle", soundCastTail: "GunTail_Heavy" },
  Minigun: { label: "Minigun", soundCast: "Shot_Minigun", soundCastTail: "GunTail_Heavy" },
  BeamSilent: { label: "Beam weapon: silent safe default", beamOnly: true },
  BeamFlamethrower: { label: "Beam weapon: sustained flamethrower sound", beamSoundCast: "Flamethrower_Firing", soundCastTail: "GunTail_Medium", beamOnly: true }
};
const HAR_DEP: Dependency = {
  packageId: "erdelf.HumanoidAlienRaces",
  displayName: "Humanoid Alien Races",
  required: true,
  steamWorkshopUrl: "steam://url/CommunityFilePage/839005762"
};

const GENE_CATEGORIES: Array<{ title: string; genes: Array<{ defName: string; label: string; note: string }> }> = [
  {
    title: "Recommended / Common",
    genes: [
      { defName: "MeleeDamage_Strong", label: "Strong melee damage", note: "Higher melee damage." },
      { defName: "MeleeDamage_VeryStrong", label: "Very strong melee damage", note: "Much higher melee damage." },
      { defName: "MeleeDamage_Weak", label: "Weak melee damage", note: "Lower melee damage." },
      { defName: "Robust", label: "Robust", note: "Reduced incoming damage." },
      { defName: "Delicate", label: "Delicate", note: "Increased incoming damage." },
      { defName: "MoveSpeed_Quick", label: "Fast runner", note: "Higher movement speed." },
      { defName: "MoveSpeed_VeryQuick", label: "Very fast runner", note: "Much higher movement speed." },
      { defName: "MoveSpeed_Slow", label: "Slow runner", note: "Lower movement speed." },
      { defName: "MoveSpeed_VerySlow", label: "Very slow runner", note: "Much lower movement speed." },
      { defName: "Immunity_Strong", label: "Strong immunity", note: "Faster immunity gain." },
      { defName: "Immunity_SuperStrong", label: "Super immunity", note: "Much faster immunity gain." },
      { defName: "Immunity_Weak", label: "Weak immunity", note: "Slower immunity gain." },
      { defName: "Ageless", label: "Ageless", note: "Biological aging is greatly reduced." }
    ]
  },
  {
    title: "Psy / Mind",
    genes: [
      { defName: "PsychicAbility_Dull", label: "Psychically dull", note: "Reduced psychic sensitivity." },
      { defName: "PsychicAbility_Sensitive", label: "Psychically sensitive", note: "Increased psychic sensitivity." },
      { defName: "PsychicAbility_Hypersensitive", label: "Psychically hypersensitive", note: "Greatly increased psychic sensitivity." },
      { defName: "PsychicBonding", label: "Psychic bonding", note: "Psychic bonding related gene." },
      { defName: "ViolenceDisabled", label: "Violence disabled", note: "Cannot perform violent work." }
    ]
  },
  {
    title: "Body / Metabolism",
    genes: [
      { defName: "Nearsighted", label: "Nearsighted", note: "Reduced shooting accuracy." },
      { defName: "StrongStomach", label: "Strong stomach", note: "Can better tolerate unsafe food." },
      { defName: "NeverSleep", label: "Never sleep", note: "No sleep need." },
      { defName: "Sleepy", label: "Sleepy", note: "Higher sleep need." },
      { defName: "LowSleep", label: "Low sleep", note: "Lower sleep need." },
      { defName: "VeryLowSleep", label: "Very low sleep", note: "Much lower sleep need." },
      { defName: "FastWoundHealing", label: "Fast wound healing", note: "Wounds heal faster." },
      { defName: "SlowWoundHealing", label: "Slow wound healing", note: "Wounds heal slower." }
    ]
  },
  {
    title: "Appearance / Hair / Skin",
    genes: [
      { defName: "Hair_LongOnly", label: "Long hair only", note: "Restricts generated hair to long styles." },
      { defName: "Hair_Bald", label: "Bald", note: "No hair." },
      { defName: "Beard_Always", label: "Always beard", note: "Forces beard generation where supported." },
      { defName: "Skin_Light", label: "Light skin", note: "Light skin tone gene." },
      { defName: "Skin_Dark", label: "Dark skin", note: "Dark skin tone gene." },
      { defName: "HairColor_Blond", label: "Blond hair", note: "Hair color gene." },
      { defName: "HairColor_Dark", label: "Dark hair", note: "Hair color gene." },
      { defName: "HairColor_Red", label: "Red hair", note: "Hair color gene." }
    ]
  },
  {
    title: "Special / Archite",
    genes: [
      { defName: "Deathless", label: "Deathless", note: "Archite deathless style gene." },
      { defName: "Hemogenic", label: "Hemogenic", note: "Hemogen system related gene." },
      { defName: "FireResistant", label: "Fire resistant", note: "Better resistance to fire." },
      { defName: "ToxicResistance", label: "Toxic resistance", note: "Better resistance to toxins." },
      { defName: "ToxicWeakness", label: "Toxic weakness", note: "Worse toxin resistance." }
    ]
  }
];

const GENE_ALIAS: Record<string, string> = {
  StrongMeleeDamage: "MeleeDamage_Strong",
  FastRunner: "MoveSpeed_Quick",
  SuperImmune: "Immunity_SuperStrong",
  SlowAging: "Ageless",
  PsychicallyDull: "PsychicAbility_Dull"
};

const tDict: Record<string, string> = {
  "RimWorld Visual Mod Maker": "RimWorld 可视化 Mod 制作器",
  "Mod Basic Info": "Mod 基础信息",
  "Dependencies": "依赖项",
  "Custom Race": "自定义种族",
  "Genes": "基因",
  "Faction": "派系",
  "Add Item": "添加物品",
  "Tech Tree": "科技树",
  "Storyteller": "故事叙述者",
  "Scenario": "剧本",
  "Assets": "素材",
  "Export": "导出",
  "Interface language/UI Language": "界面语言/UI Language",
  "English": "英文",
  "Chinese": "中文",
  "Mod name": "Mod 名称",
  "Package ID": "Package ID",
  "Author": "作者",
  "Description": "描述",
  "Supported versions, English comma only": "支持版本，仅使用英文逗号 , 分隔",
  "Add dependency": "添加依赖",
  "Required": "必需",
  "Display name": "显示名称",
  "Steam Workshop URL": "Steam 创意工坊 URL",
  "Download URL": "下载 URL",
  "Enable Custom Race / HAR RaceDef": "启用自定义种族 / HAR RaceDef",
  "Enable FactionDef": "启用派系 FactionDef",
  "Enable custom StorytellerDef": "启用自定义 StorytellerDef",
  "Enable custom ScenarioDef": "启用自定义 ScenarioDef",
  "Player faction": "玩家开始派系",
  "New arrivals / Colony": "新移民 / 殖民地",
  "New tribe / Tribal": "新部落 / 部落",
  "Force starting pawns to use custom race": "强制开局角色使用自定义种族",
  "Strict custom race start": "严格自定义种族开局",
  "When Custom Race is enabled, this uses Biotech's ConfigurePawnsXenotypes scenPart to generate starting pawns from the custom PawnKind instead of vanilla Human pawns.": "启用自定义种族时，这会使用 Biotech 的 ConfigurePawnsXenotypes 剧本部件，让开局角色从自定义 PawnKind 生成，而不是原版 Human。",
  "Strict mode uses startingPawnCount as the actual pawnChoiceCount when exporting. This prevents reserve candidates and the Random button from falling back to vanilla Human graphics; chooseFromPawnCount is ignored while this option is enabled.": "严格模式导出时会用 startingPawnCount 作为实际 pawnChoiceCount。这样可以避免备选角色和随机按钮回退到原版 Human 贴图；启用此选项时 chooseFromPawnCount 会被忽略。",
  "chooseFromPawnCount is ignored while this option is enabled.": "启用此选项时 chooseFromPawnCount 会被忽略。",
  "Unique identifier defName": "唯一标识符 defName",
  "Label": "显示名 label",
  "Health scale": "生命倍率",
  "Move speed": "移动速度",
  "Melee damage": "近战伤害",
  "Body size": "身体大小",
  "Life expectancy": "寿命",
  "Texture mode": "贴图模式",
  "Shared one set": "通用一套",
  "Gendered male/female": "按性别区分",
  "Body types": "按体型区分",
  "Head texture mode": "头部贴图模式",
  "Preserve original texture colors": "保留原始贴图颜色",
  "Disable pawn skin tinting and use white skinColor in HAR graphicPaths.": "关闭 RimWorld/HAR 对身体贴图的肤色染色，并在 HAR graphicPaths 中使用白色 skinColor。",
  "Starting pawn race mode": "开局人物种族模式",
  "Stable custom race start": "稳定自定义种族开局",
  "Experimental candidate pool": "实验候选池",
  "Custom race start note": "RimWorld/HAR 纯 XML 无法稳定同时做到备选池和随机按钮都使用 HAR 自定义 RaceDef；稳定模式会让已选开局角色正确使用自定义种族，候选池可能显示 Human。",
  "Experimental candidate pool note": "实验模式会尝试把更多候选人绑定到自定义 Xenotype/PawnKind，但部分游戏版本可能把候选数量当作已选数量。",
  "Drop PNG here or click": "拖入 PNG 或点击上传",
  "Missing PNG": "缺少 PNG",
  "Uploaded": "已上传",
  "Add GeneDef": "添加 GeneDef",
  "Delete item": "删除物品",
  "Melee settings": "近战设置",
  "Ranged settings": "远程设置",
  "Recommended / Common": "推荐 / 常用",
  "Psy / Mind": "灵能 / 心智",
  "Body / Metabolism": "身体 / 代谢",
  "Appearance / Hair / Skin": "外观 / 头发 / 肤色",
  "Special / Archite": "特殊 / Archite",
  "Add typed GeneDef": "添加输入的 GeneDef",
  "Search GeneDef": "搜索 GeneDef",
  "Faction defName": "派系 defName",
  "Fixed world name": "地图固定名称",
  "Culture description": "文化描述",
  "Category": "派系类型",
  "Tech level": "科技水平",
  "Required count at game start": "开局必定生成数量",
  "Max configurable at world creation": "世界创建可添加上限",
  "New item": "新物品",
  "Item type": "物品类型",
  "Weapon mode": "武器模式",
  "Automatic ranged weapon": "自动远程武器",
  "Single-shot ranged weapon": "单发远程武器",
  "Laser / beam weapon": "激光 / 光束武器",
  "Beam settings": "光束设置",
  "Beam width": "光束宽度",
  "Beam full-width range": "光束最大宽度距离",
  "Beam weapons use Verb_ShootBeam and Beam-style damage; projectile texture and projectile speed are ignored.": "激光武器使用 Verb_ShootBeam 和 Beam 类伤害；弹丸贴图和弹速会被忽略。",
  "Vanilla sound preset": "原版声音模板",
  "Melee weapon": "近战武器",
  "Damage": "伤害",
  "Cooldown": "冷却",
  "Range": "射程",
  "Burst shots": "连发次数",
  "Ticks between burst shots": "连发间隔 ticks",
  "Research prerequisite": "前置科技",
  "New research": "新科技",
  "Base cost": "研究成本",
  "Prerequisites, English comma only": "前置科技，仅使用英文逗号 , 分隔",
  "Export project JSON": "导出项目 JSON",
  "Import project JSON / generated ZIP": "导入项目 JSON / 已生成 ZIP",
  "Export Mod ZIP": "导出 Mod ZIP",
  "Validation": "校验",
  "No blocking errors": "没有阻断错误",
  "Save status": "保存状态",
  "Autosaved locally": "已自动本地保存",
  "Clear local project": "清空本地项目",
  "Remote weapons now default to automatic fire; you can still switch to single-shot if needed.": "远程武器现在默认自动射击，也可以手动切换成单发。",
  "Custom Race automatically adds Humanoid Alien Races as a required dependency only when enabled.": "只有启用自定义种族时，才会自动添加 Humanoid Alien Races 依赖。",
  "Progress is autosaved to localStorage; export a project JSON before moving computers or clearing browser data.": "进度会自动保存到 localStorage；换电脑或清浏览器数据前请导出项目 JSON。",
  "Projects can be reloaded from exported project JSON in the editor source/ folder.": "可从编辑器 source/ 文件夹中的项目 JSON 重新导入继续编辑。",
  "Tech tree support creates ResearchProjectDef and can link items through researchPrerequisite.": "科技树会生成 ResearchProjectDef，并可通过 researchPrerequisite 绑定物品。",
  "Advanced item editor": "高级物品编辑器",
  "Base item stats": "物品基础数值",
  "Work to make": "制作工时",
  "Steel cost": "钢铁成本",
  "Component cost": "零部件成本",
  "Mass": "重量",
  "Flammability": "易燃性",
  "Deterioration rate": "老化速率",
  "Beauty": "美观度",
  "Melee armor penetration": "近战护甲穿透",
  "Ranged armor penetration": "远程护甲穿透",
  "Warmup time": "瞄准时间",
  "Projectile speed": "弹速",
  "Accuracy touch": "贴身精度",
  "Accuracy short": "近距离精度",
  "Accuracy medium": "中距离精度",
  "Accuracy long": "远距离精度",
  "This editor now writes an independent projectile for ranged weapons. The sound preset only changes soundCast/soundCastTail and never overwrites your weapon stats.": "当前编辑器会为远程武器生成独立弹丸。声音模板只改变 soundCast/soundCastTail，不会覆盖你的武器数值。",
  "Damage type damageDef": "伤害类型 damageDef",
  "Projectile texture path": "弹丸贴图路径",
  "Stopping power": "停止力",
  "Explosion radius": "爆炸半径",
  "Fire chance": "点燃概率",
  "Fire chance is currently UI-only for XML safety; use Flame damageDef with Explosion radius for fire-style explosions.": "为避免 XML 红字，点燃概率当前仅保留在项目数据中；可使用 Flame damageDef + 爆炸半径制作火焰爆炸。",
  "Crafting / Tags": "制作 / 标签",
  "Recipe users, English comma only": "制作工作台，仅使用英文逗号 , 分隔",
  "Weapon tags, English comma only": "武器标签，仅使用英文逗号 , 分隔",
  "Trade tags, English comma only": "交易标签，仅使用英文逗号 , 分隔",
  "Thing categories, English comma only": "物品分类，仅使用英文逗号 , 分隔",
  "Made from stuff": "使用材料系统 madeFromStuff",
  "Stuff categories, English comma only": "材料类别，仅使用英文逗号 , 分隔",
  "Stuff cost count": "材料消耗数量",
  "Expand all": "全部展开",
  "Collapse all": "全部收起",
  "Click header to expand or collapse this node.": "点击标题可展开或收起这个节点。",
  "Collapsed item": "已折叠物品",
  "Collapsed research": "已折叠科技",
  "Tech tree ownership": "科技树归属",
  "Merge into vanilla tech tree": "合并至原版科技树",
  "Create independent tech tree": "新建独立科技树",
  "ResearchTabDef for independent tree": "独立科技树 ResearchTabDef",
  "Research view X": "科技树坐标 X",
  "Research view Y": "科技树坐标 Y",
  "Independent tree note": "选择独立科技树时，导出会生成 ResearchTabDef 并让该科技指向它。",
  "Vanilla merge note": "选择合并至原版科技树时，该科技会写入原版 Main 科技页。",
  "Delete research": "删除科技",
  "No items yet. Click New item to add one.": "还没有物品。点击新物品添加。",
  "Chinese punctuation in comma fields will be converted to English commas before export.": "逗号分隔字段中的中文标点会在导出前转换为英文逗号。",
  "No research projects yet. Click New research to add one.": "还没有科技项目。点击新科技添加。",
  "Building": "可建造物",
  "Building settings": "可建造物设置",
  "Work to build": "建造工时",
  "Size X": "尺寸 X",
  "Size Y": "尺寸 Y",
  "Designation category": "建造分类",
  "Passability": "通行性",
  "Fill percent": "占用比例",
  "Max hit points": "最大耐久",
  "Buildable items export as safe standalone ThingDef and appear in Architect tabs.": "可建造物会导出为安全独立 ThingDef，并显示在建造菜单分类中。",
  "Beam sound preset": "光束声音模板",
  "Beam custom SoundDef optional": "自定义光束 SoundDef（可选）",
  "Beam sound note": "Verb_ShootBeam 需要可持续播放的 sustainer 声音；普通枪声会报错。默认不写 soundCastBeam，避免红字。",
};

function tr(language: Lang, text: string): string {
  return language === "zh" ? tDict[text] ?? text : text;
}

function defaultProject(): Project {
  return {
    schemaVersion: "rimworld-visual-mod-maker.project.v50",
    language: "en",
    mod: {
      name: "TestModName",
      packageId: "test.testmodname",
      author: "TestAuthor",
      description: "TestDescription",
      supportedVersions: ["1.6"],
      supportedVersionsCsv: "1.6"
    },
    dependencies: [],
    race: {
      enabled: false,
      defName: "TestUniqueIdentifierDefName",
      label: "test race",
      description: "TestRaceDescription",
      textureMode: "shared",
      headTextureMode: "shared",
      healthScale: 1,
      moveSpeed: 4.6,
      meleeDamage: 8,
      bodySize: 1,
      lifeExpectancy: 80,
      genes: [],
      xenotypeDefName: "TestXenotypeDefName",
      xenotypeLabel: "test xenotype",
      xenotypeDescription: "TestXenotypeDescription",
      preserveTextureColors: false
    },
    faction: {
      enabled: false,
      defName: "TestFactionDefName",
      label: "test faction",
      fixedName: "TestFactionFixedName",
      description: "TestFactionDescription",
      culture: "TestFactionCultureDescription",
      categoryTag: "Outlander",
      techLevel: "Industrial",
      requiredCountAtGameStart: 1,
      maxConfigurableAtWorldCreation: 20
    },
    items: [],
    research: [],
    storyteller: {
      enabled: false,
      defName: "TestStorytellerDefName",
      label: "TestStorytellerLabel",
      description: "TestStorytellerDescription",
      baseProfile: "Cassandra",
      listOrder: 95
    },
    scenario: {
      enabled: false,
      defName: "TestScenarioDefName",
      label: "TestScenarioLabel",
      summary: "TestScenarioSummary",
      description: "TestScenarioDescription",
      playerFactionDef: "PlayerColony",
      forceCustomRaceStartingPawns: true,
      startingPawnRaceMode: "stableSelectedOnly",
      startingPawnCount: 3,
      chooseFromPawnCount: 8,
      startWithSilver: 800,
      startWithPackagedMeals: 40,
      startWithMedicine: 30,
      startWithComponents: 30,
      startWithSteel: 450
    },
    assets: {},
    logs: []
  };
}

function hydrateProject(raw: Partial<Project>): Project {
  const base = defaultProject();
  const next: Project = {
    ...base,
    ...raw,
    mod: { ...base.mod, ...(raw.mod ?? {}) },
    race: { ...base.race, ...(raw.race ?? {}) },
    faction: { ...base.faction, ...(raw.faction ?? {}) },
    storyteller: { ...base.storyteller, ...(raw.storyteller ?? {}) },
    scenario: { ...base.scenario, ...(raw.scenario ?? {}) },
    dependencies: raw.dependencies ?? base.dependencies,
    items: raw.items ?? base.items,
    research: raw.research ?? base.research,
    assets: raw.assets ?? base.assets,
    logs: raw.logs ?? []
  };
  next.schemaVersion = "rimworld-visual-mod-maker.project.v50";
  next.language = next.language || "en";
  next.items = (next.items ?? []).map((item) => ({
    ...item,
    weaponMode: (item.weaponMode ?? "rangedAuto") as WeaponMode,
    beamWidth: itemNumber((item as AddItem).beamWidth, 1),
    beamFullWidthRange: itemNumber((item as AddItem).beamFullWidthRange, 18),
    customBeamSoundDef: (item as AddItem).customBeamSoundDef || ""
  }));
  next.scenario.startingPawnRaceMode = next.scenario.startingPawnRaceMode || "stableSelectedOnly";
  next.race.preserveTextureColors = Boolean(next.race.preserveTextureColors);
  return next;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function summarizeForLog(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length <= 8 && value.every((v) => ["string", "number", "boolean"].includes(typeof v))) return `[${value.join(", ")}]`;
    return `Array(${value.length})`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("fileName" in record) return `file:${String(record.fileName)}`;
    const keys = Object.keys(record).filter((k) => k !== "dataUrl");
    return `{${keys.slice(0, 6).join(", ")}${keys.length > 6 ? ", ..." : ""}}`;
  }
  return safeJson(value);
}

function makeLogEntry(action: string, detail: string, scope = "project"): LogEntry {
  return { id: uid("log"), timestamp: new Date().toISOString(), scope, action, detail };
}

function valuesEqualForLog(a: unknown, b: unknown): boolean {
  return safeJson(a) === safeJson(b);
}

function diffLogEntries(scope: string, before: unknown, after: unknown): LogEntry[] {
  if (valuesEqualForLog(before, after)) return [];
  if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
    const beforeObj = before as Record<string, unknown>;
    const afterObj = after as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));
    const entries: LogEntry[] = [];
    for (const key of keys) {
      if (key === "logs" || key === "assets" || key === "dataUrl") continue;
      if (!valuesEqualForLog(beforeObj[key], afterObj[key])) {
        entries.push(makeLogEntry("Updated", `${scope}.${key}: ${summarizeForLog(beforeObj[key])} -> ${summarizeForLog(afterObj[key])}`, scope));
      }
    }
    return entries;
  }
  return [makeLogEntry("Updated", `${scope}: ${summarizeForLog(before)} -> ${summarizeForLog(after)}`, scope)];
}

function emitEditorLogs(entries: LogEntry[]) {
  if (!entries.length) return;
  for (const entry of entries) console.log(`[ModMaker][${entry.timestamp}][${entry.scope}] ${entry.action}: ${entry.detail}`);
  void fetch("/__modmaker/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries })
  }).catch(() => {});
}

function sanitizeLogFileName(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "modmaker_log";
}

function formatTimestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function formatProjectLog(project: Project, extraEntries: LogEntry[] = [], validation: string[] = [], generatedFiles: string[] = []): string {
  const entries = [...(project.logs ?? []), ...extraEntries];
  const features = [
    project.race.enabled ? "Custom Race" : null,
    project.faction.enabled ? "FactionDef" : null,
    project.storyteller.enabled ? "StorytellerDef" : null,
    project.scenario.enabled ? "ScenarioDef" : null,
    project.items.length ? `Add Item x${project.items.length}` : null,
    project.research.length ? `ResearchProjectDef x${project.research.length}` : null
  ].filter(Boolean).join(", ") || "About.xml only";
  return [
    "RimWorld Visual Mod Maker - Project Log",
    "============================================================",
    `Generated at: ${new Date().toISOString()}`,
    `Schema: ${project.schemaVersion}`,
    `Mod name: ${project.mod.name}`,
    `Package ID: ${project.mod.packageId}`,
    `Author: ${project.mod.author}`,
    `Enabled features: ${features}`,
    "",
    "Validation",
    "------------------------------------------------------------",
    validation.length ? validation.map((v) => `- ${v}`).join("\n") : "No blocking validation errors.",
    "",
    "Generated files",
    "------------------------------------------------------------",
    generatedFiles.length ? generatedFiles.map((f) => `- ${f}`).join("\n") : "No generated file list captured.",
    "",
    "Change log",
    "------------------------------------------------------------",
    entries.length ? entries.map((e) => `[${e.timestamp}] [${e.scope}] ${e.action}: ${e.detail}`).join("\n") : "No recorded edits in this session/project.",
    ""
  ].join("\n");
}

async function writeEditorLogFile(fileName: string, content: string) {
  await fetch("/__modmaker/export-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, content })
  }).catch(() => console.warn("Editor log folder endpoint unavailable; log could not be written to the editor logs/ folder."));
}

async function writeEditorSourceFile(fileName: string, content: string) {
  await fetch("/__modmaker/export-source", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, content })
  }).catch(() => console.warn("Editor source folder endpoint unavailable; project source could not be written to the editor source/ folder."));
}

function escapeXml(value: string | number | boolean | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeDefName(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_]/g, "");
  const safe = /^[A-Za-z]/.test(cleaned) ? cleaned : `Test${cleaned}`;
  return /\d$/.test(safe) ? `${safe}Def` : safe;
}

function packageIdFromName(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "testmod";
  return `test.${slug}`;
}

function assetKey(parts: string[]) {
  return parts.join(".");
}

async function fileToAsset(file: File, label: string): Promise<Asset> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return { id: uid("asset"), label, fileName: file.name, mimeType: file.type || "image/png", dataUrl };
}

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}

function textFile(path: string, content: string) {
  return { path, content, binary: false as const };
}

function binaryFile(path: string, content: Uint8Array) {
  return { path, content, binary: true as const };
}

type VirtualFile = ReturnType<typeof textFile> | ReturnType<typeof binaryFile>;

function buildAboutXml(project: Project): string {
  const deps = [...project.dependencies];
  if (project.race.enabled && !deps.some((d) => d.packageId === HAR_DEP.packageId)) deps.push(HAR_DEP);
  const modDependencies = deps.filter((d) => d.required).map((d) => `    <li>\n      <packageId>${escapeXml(d.packageId)}</packageId>\n      <displayName>${escapeXml(d.displayName)}</displayName>${d.steamWorkshopUrl ? `\n      <steamWorkshopUrl>${escapeXml(d.steamWorkshopUrl)}</steamWorkshopUrl>` : ""}${d.downloadUrl ? `\n      <downloadUrl>${escapeXml(d.downloadUrl)}</downloadUrl>` : ""}\n    </li>`).join("\n");
  const loadAfter = deps.map((d) => `    <li>${escapeXml(d.packageId)}</li>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>\n<ModMetaData>\n  <packageId>${escapeXml(project.mod.packageId)}</packageId>\n  <name>${escapeXml(project.mod.name)}</name>\n  <author>${escapeXml(project.mod.author)}</author>\n  <description>${escapeXml(project.mod.description)}</description>\n  <supportedVersions>\n${csvList(project.mod.supportedVersionsCsv ?? project.mod.supportedVersions.join(",")).map((v) => `    <li>${escapeXml(v)}</li>`).join("\n")}\n  </supportedVersions>${modDependencies ? `\n  <modDependencies>\n${modDependencies}\n  </modDependencies>\n  <loadAfter>\n${loadAfter}\n  </loadAfter>` : ""}\n</ModMetaData>\n`;
}

function textureBase(project: Project, folder: string, relativePath: string) {
  return `${project.mod.packageId}/${folder}/${relativePath}`;
}

function directionSuffix(direction: Direction) {
  if (direction === "front") return "south";
  if (direction === "side") return "east";
  if (direction === "back") return "north";
  return "single";
}

function getAsset(project: Project, key: string) {
  return project.assets[key];
}

async function addDirectionalTextures(files: VirtualFile[], project: Project, keyBase: string, exportBase: string, filePrefix: string) {
  const directions: Direction[] = ["front", "side", "back"];
  for (const dir of directions) {
    const asset = getAsset(project, assetKey([keyBase, dir]));
    if (!asset) continue;
    const suffix = directionSuffix(dir);
    const bytes = await dataUrlToBytes(asset.dataUrl);
    files.push(binaryFile(`${exportBase}/${filePrefix}_${suffix}.png`, bytes));
    if (dir === "side") files.push(binaryFile(`${exportBase}/${filePrefix}_west.png`, bytes));
  }
}

function buildRaceXml(project: Project): string {
  const r = project.race;
  const bodyBase = textureBase(project, "Races", `${r.defName}/Bodies/${r.defName}_Body`);
  const headBase = textureBase(project, "Races", `${r.defName}/Heads/${r.defName}_Head`);
  const femaleBodyBase = textureBase(project, "Races", `${r.defName}/Bodies/${r.defName}_Female_Body`);
  const maleHeadBase = textureBase(project, "Races", `${r.defName}/Heads/${r.defName}_Male_Head`);
  const femaleHeadBase = textureBase(project, "Races", `${r.defName}/Heads/${r.defName}_Female_Head`);
  const headMale = r.headTextureMode === "gendered" ? maleHeadBase : headBase;
  const headFemale = r.headTextureMode === "gendered" ? femaleHeadBase : headBase;
  const cleanGenes = Array.from(new Set(r.genes.map((g) => GENE_ALIAS[g] ?? g)));
  const genes = cleanGenes.map((g) => `          <li>${escapeXml(g)}</li>`).join("\n");
  const bodyPaths = r.textureMode === "gendered" ? `\n          <path>${escapeXml(bodyBase)}</path>\n          <female>\n            <path>${escapeXml(femaleBodyBase)}</path>\n          </female>` : `\n          <path>${escapeXml(bodyBase)}</path>`;

  return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <HeadTypeDef>\n    <defName>${escapeXml(r.defName)}_Head_Male</defName>\n    <graphicPath>${escapeXml(headMale)}</graphicPath>\n    <gender>Male</gender>\n  </HeadTypeDef>\n  <HeadTypeDef>\n    <defName>${escapeXml(r.defName)}_Head_Female</defName>\n    <graphicPath>${escapeXml(headFemale)}</graphicPath>\n    <gender>Female</gender>\n  </HeadTypeDef>\n  <AlienRace.ThingDef_AlienRace ParentName="Human">\n    <defName>${escapeXml(r.defName)}</defName>\n    <label>${escapeXml(r.label)}</label>\n    <description>${escapeXml(r.description)}</description>\n    <race>\n      <body>Human</body>\n      <intelligence>Humanlike</intelligence>\n      <foodType>OmnivoreHuman</foodType>\n      <baseBodySize>${r.bodySize}</baseBodySize>\n      <baseHealthScale>${r.healthScale}</baseHealthScale>\n      <lifeExpectancy>${r.lifeExpectancy}</lifeExpectancy>\n      <hasGenders>true</hasGenders>\n    </race>\n    <statBases>\n      <MoveSpeed>${r.moveSpeed}</MoveSpeed>\n    </statBases>\n    <tools>\n      <li>\n        <label>${escapeXml(r.label)} strike</label>\n        <capacities><li>Blunt</li></capacities>\n        <power>${r.meleeDamage}</power>\n        <cooldownTime>2</cooldownTime>\n      </li>\n    </tools>\n    <alienRace>\n      <generalSettings>\n        <alienPartGenerator Inherit="False">\n          <headTypes>\n            <li>${escapeXml(r.defName)}_Head_Male</li>\n            <li>${escapeXml(r.defName)}_Head_Female</li>\n          </headTypes>\n        </alienPartGenerator>${genes ? `\n        <raceGenes>\n${genes}\n        </raceGenes>` : ""}\n      </generalSettings>\n      <graphicPaths>\n        <body>${bodyPaths}\n        </body>\n      </graphicPaths>\n    </alienRace>\n  </AlienRace.ThingDef_AlienRace>\n  <XenotypeDef MayRequire="Ludeon.RimWorld.Biotech">\n    <defName>${escapeXml(r.xenotypeDefName)}</defName>\n    <label>${escapeXml(r.xenotypeLabel)}</label>\n    <description>${escapeXml(r.xenotypeDescription)}</description>\n    <iconPath>UI/Icons/Xenotypes/Baseliner</iconPath>\n    <inheritable>true</inheritable>${genes ? `\n    <genes>\n${cleanGenes.map((g) => `      <li>${escapeXml(g)}</li>`).join("\n")}\n    </genes>` : ""}\n  </XenotypeDef>\n</Defs>\n`;
}

function pawnKindXmlBlock(defName: string, label: string, raceDef: string, xenotypeDef: string, combatPower: number, defaultFactionType?: string) {
  return `  <PawnKindDef ParentName="BasePlayerPawnKind">
    <defName>${escapeXml(defName)}</defName>
    <label>${escapeXml(label)}</label>
    <race>${escapeXml(raceDef)}</race>${defaultFactionType ? `
    <defaultFactionType>${escapeXml(defaultFactionType)}</defaultFactionType>` : ""}
    <combatPower>${combatPower}</combatPower>
    <initialResistanceRange>13~21</initialResistanceRange>
    <initialWillRange>3~6</initialWillRange>
    <xenotypeSet>
      <xenotypeChances>
        <${escapeXml(xenotypeDef)} MayRequire="Ludeon.RimWorld.Biotech">999</${escapeXml(xenotypeDef)}>
      </xenotypeChances>
    </xenotypeSet>
  </PawnKindDef>`;
}

function buildPawnKindXml(project: Project): string {
  const r = project.race;
  const blocks = [
    // Some in-game tools and Character Editor pages list PawnKindDef entries rather than only Race ThingDefs.
    // Provide a plain alias named exactly like the race defName so the custom race is easy to find.
    pawnKindXmlBlock(r.defName, r.label, r.defName, r.xenotypeDefName, 45, "PlayerColony"),
    pawnKindXmlBlock(`${r.defName}_Colonist`, r.label, r.defName, r.xenotypeDefName, 45, "PlayerColony")
  ];
  return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n${blocks.join("\n")}\n</Defs>\n`;
}

function buildFactionXml(project: Project): string {
  const f = project.faction;
  const r = project.race;
  return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <FactionDef ParentName="OutlanderFactionBase">\n    <defName>${escapeXml(f.defName)}</defName>\n    <label>${escapeXml(f.label)}</label>\n    <fixedName>${escapeXml(f.fixedName)}</fixedName>\n    <description>${escapeXml(f.description)} ${escapeXml(f.culture)}</description>\n    <categoryTag>${escapeXml(f.categoryTag)}</categoryTag>\n    <techLevel>${escapeXml(f.techLevel)}</techLevel>\n    <requiredCountAtGameStart>${f.requiredCountAtGameStart}</requiredCountAtGameStart>\n    <maxConfigurableAtWorldCreation>${f.maxConfigurableAtWorldCreation}</maxConfigurableAtWorldCreation>\n    <canMakeRandomly>true</canMakeRandomly>\n    <basicMemberKind>${escapeXml(r.defName)}_FactionMember</basicMemberKind>\n    <xenotypeSet Inherit="False">\n      <xenotypeChances>\n        <${escapeXml(r.xenotypeDefName)} MayRequire="Ludeon.RimWorld.Biotech">999</${escapeXml(r.xenotypeDefName)}>\n      </xenotypeChances>\n    </xenotypeSet>\n  </FactionDef>\n  <PawnKindDef ParentName="BasePlayerPawnKind">\n    <defName>${escapeXml(r.defName)}_FactionMember</defName>\n    <label>${escapeXml(r.label)}</label>\n    <race>${escapeXml(r.defName)}</race>\n    <combatPower>55</combatPower>\n    <initialResistanceRange>13~21</initialResistanceRange>\n    <initialWillRange>3~6</initialWillRange>\n    <xenotypeSet>\n      <xenotypeChances>\n        <${escapeXml(r.xenotypeDefName)} MayRequire="Ludeon.RimWorld.Biotech">999</${escapeXml(r.xenotypeDefName)}>\n      </xenotypeChances>\n    </xenotypeSet>\n  </PawnKindDef>\n</Defs>\n`;
}

function itemNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value as number) ? Number(value) : fallback;
}

function statLine(name: string, value: number | undefined, fallback: number) {
  return `      <${name}>${itemNumber(value, fallback)}</${name}>`;
}

function defaultExplosionRadiusForDamageDef(damageDef: string): number {
  switch ((damageDef || "").toLowerCase()) {
    case "bomb": return 2;
    case "emp": return 2;
    case "smoke": return 3;
    case "flame": return 1.5;
    default: return 0;
  }
}

function defaultProjectileTextureForDamageDef(damageDef: string): string {
  // Stable vanilla projectile textures. Do not use Projectile_Explosive/Projectile_EMP;
  // those are class-like names and are not valid vanilla texture paths.
  switch ((damageDef || "").toLowerCase()) {
    case "bomb": return "Things/Projectile/Grenade";
    case "flame": return "Things/Projectile/Grenade";
    case "smoke": return "Things/Projectile/Grenade";
    case "emp": return "Things/Projectile/Bullet_Big";
    case "stun": return "Things/Projectile/Bullet_Big";
    default: return "Things/Projectile/Bullet_Small";
  }
}

function isExplosiveProjectileDamageDef(damageDef: string): boolean {
  const normalized = (damageDef || "").toLowerCase();
  return ["bomb", "flame", "emp", "smoke", "stun"].includes(normalized);
}

function projectileThingClassXml(damageDef: string, explosionRadius: number): string {
  // Bomb/EMP/Flame/Smoke projectiles with a radius must use Projectile_Explosive.
  // Otherwise the radius may show in targeting UI while the fired projectile behaves like a normal bullet.
  return isExplosiveProjectileDamageDef(damageDef) && explosionRadius > 0
    ? `
    <thingClass>Projectile_Explosive</thingClass>`
    : "";
}

function projectileFireSpawnXml(_damageDef: string, _chance: number): string {
  // RimWorld 1.6 ProjectileProperties rejects chanceToStartFire and explosionSpawnChance in user logs.
  // Keep the UI field in project data for future expansion, but export no fire-spawn XML here.
  return "";
}


function normalizeCommaText(value: string | undefined): string {
  // UI input must stay fluid. We normalize Chinese punctuation to ASCII commas while typing,
  // but do not strip leading/trailing commas here. This lets users type `tech1,`
  // and continue typing the next token without the controlled input fighting the cursor.
  return String(value ?? "")
    .replace(/[，、；;\n\r]+/g, ",")
    .replace(/\s*,\s*/g, ",")
    .replace(/,+/g, ",");
}

function csvList(value: string | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of normalizeCommaText(value).split(",")) {
    const token = raw.trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    result.push(token);
  }
  return result;
}

function csvArrayList(values: string[] | undefined): string[] {
  return csvList((values ?? []).join(","));
}

function researchOwnership(r: ResearchProject): ResearchTreeOwnership {
  return r.techTreeOwnership ?? "vanilla";
}

function projectDefaultResearchTab(project: Project): string {
  return sanitizeDefName(`${project.mod.name || "TestModName"}ResearchTab`);
}

function researchTabDefName(project: Project, r: ResearchProject): string {
  return sanitizeDefName(r.researchTabDefName || projectDefaultResearchTab(project));
}

function xmlList(tag: string, values: string[]): string {
  if (!values.length) return "";
  return `\n    <${tag}>\n${values.map((v) => `      <li>${escapeXml(v)}</li>`).join("\n")}\n    </${tag}>`;
}

function boolXml(value: boolean | undefined): string {
  return value ? "true" : "false";
}

function researchPrerequisiteListXml(single: string | undefined): string {
  const values = csvList(single);
  if (!values.length) return "";
  return `
    <researchPrerequisites>
${values.map((v) => `      <li>${escapeXml(v)}</li>`).join("\n")}
    </researchPrerequisites>`;
}

function buildingCostXml(item: AddItem, steelCost: number, componentCost: number): string {
  const stuffCategories = csvList(item.stuffCategoriesCsv || "Metallic");
  if (item.madeFromStuff) {
    return `
    <stuffCategories>
${stuffCategories.map((v) => `      <li>${escapeXml(v)}</li>`).join("\n")}
    </stuffCategories>
    <costStuffCount>${Math.max(1, Math.round(itemNumber(item.costStuffCount, 50)))}</costStuffCount>`;
  }
  const costEntries = [steelCost > 0 ? `      <Steel>${steelCost}</Steel>` : "", componentCost > 0 ? `      <ComponentIndustrial>${componentCost}</ComponentIndustrial>` : ""].filter(Boolean).join("\n") || "      <Steel>1</Steel>";
  return `
    <costList>
${costEntries}
    </costList>`;
}

function buildItemXml(project: Project, item: AddItem): string {
  const pathBase = `${project.mod.packageId}/Items/${item.kind}/${item.defName}/${item.defName}`;
  const marketValue = itemNumber(item.marketValue, 100);
  const mass = itemNumber(item.mass, 1);
  const flammability = itemNumber(item.flammability, 0.5);
  const deteriorationRate = itemNumber(item.deteriorationRate, 2);
  const beauty = itemNumber(item.beauty, -3);
  const workToMake = itemNumber(item.workToMake, 2000);
  const steelCost = Math.max(0, Math.round(itemNumber(item.steelCost, 50)));
  const componentCost = Math.max(0, Math.round(itemNumber(item.componentCost, 0)));
  const thingCategories = xmlList("thingCategories", csvList(item.thingCategoriesCsv));
  const tradeTags = xmlList("tradeTags", csvList(item.tradeTagsCsv));
  const common = `    <defName>${escapeXml(item.defName)}</defName>\n    <label>${escapeXml(item.label)}</label>\n    <description>${escapeXml(item.description)}</description>\n    <graphicData>\n      <texPath>${escapeXml(pathBase)}</texPath>\n      <graphicClass>Graphic_Single</graphicClass>\n      <drawSize>(1,1)</drawSize>\n    </graphicData>\n    <statBases>\n      <MarketValue>${marketValue}</MarketValue>\n      <Mass>${mass}</Mass>\n      <Flammability>${flammability}</Flammability>\n      <DeteriorationRate>${deteriorationRate}</DeteriorationRate>\n      <Beauty>${beauty}</Beauty>${item.kind === "weapon" ? `\n      <WorkToMake>${workToMake}</WorkToMake>` : ""}\n    </statBases>${thingCategories}${tradeTags}`;
  if (item.kind === "food") {
    return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <ThingDef ParentName="MealBase">\n${common}\n    <stackLimit>${item.stackLimit}</stackLimit>\n    <ingestible>\n      <foodType>Meal</foodType>\n      <nutrition>0.9</nutrition>\n    </ingestible>\n  </ThingDef>\n</Defs>\n`;
  }
  if (item.kind === "building") {
    const sizeX = Math.max(1, Math.round(itemNumber(item.buildingSizeX, 1)));
    const sizeY = Math.max(1, Math.round(itemNumber(item.buildingSizeY, 1)));
    const fillPercent = Math.max(0, Math.min(1, itemNumber(item.buildingFillPercent, 0.4)));
    const maxHitPoints = Math.max(1, Math.round(itemNumber(item.buildingMaxHitPoints, 100)));
    const designationCategory = sanitizeDefName(item.buildingDesignationCategory || "Furniture");
    const passability = item.buildingPassability || "PassThroughOnly";
    const costXml = buildingCostXml(item, steelCost, componentCost);
    return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <ThingDef>\n    <defName>${escapeXml(item.defName)}</defName>\n    <label>${escapeXml(item.label)}</label>\n    <description>${escapeXml(item.description)}</description>\n    <thingClass>Building</thingClass>\n    <category>Building</category>\n    <drawerType>MapMeshOnly</drawerType>\n    <altitudeLayer>Building</altitudeLayer>\n    <graphicData>\n      <texPath>${escapeXml(pathBase)}</texPath>\n      <graphicClass>Graphic_Single</graphicClass>\n      <drawSize>(${sizeX},${sizeY})</drawSize>\n      <shaderType>Cutout</shaderType>\n    </graphicData>\n    <size>(${sizeX},${sizeY})</size>\n    <passability>${escapeXml(passability)}</passability>\n    <pathCost>${passability === "Standable" ? 0 : 50}</pathCost>\n    <fillPercent>${fillPercent}</fillPercent>\n    <rotatable>true</rotatable>\n    <selectable>true</selectable>\n    <useHitPoints>true</useHitPoints>\n    <designationCategory>${escapeXml(designationCategory)}</designationCategory>\n    <terrainAffordanceNeeded>Light</terrainAffordanceNeeded>\n    <statBases>\n      <MaxHitPoints>${maxHitPoints}</MaxHitPoints>\n      <MarketValue>${marketValue}</MarketValue>\n      <WorkToBuild>${workToMake}</WorkToBuild>\n      <Flammability>${flammability}</Flammability>\n      <Beauty>${beauty}</Beauty>\n    </statBases>${costXml}${researchPrerequisiteListXml(item.researchPrerequisite)}\n  </ThingDef>\n</Defs>\n`;
  }
  if (item.kind === "weapon") {
    const isMelee = item.weaponMode === "melee";
    const isBeam = item.weaponMode === "beamLaser";
    const parent = isMelee ? "BaseMeleeWeapon_Sharp" : "BaseHumanMakeableGun";
    const sound = WEAPON_SOUND_PRESETS[item.soundPreset] ?? (isBeam ? WEAPON_SOUND_PRESETS.BeamSilent : WEAPON_SOUND_PRESETS.AssaultRifle);
    const damage = itemNumber(item.damage, 10);
    const cooldown = itemNumber(item.cooldown, 1.5);
    const meleeArmor = itemNumber(item.meleeArmorPenetration, 0.25);
    const rangedArmor = itemNumber(item.armorPenetration, 0.16);
    const range = itemNumber(item.range, 28);
    const warmupTime = itemNumber(item.warmupTime, 1.2);
    const burstShotCount = (item.weaponMode === "rangedAuto" || item.weaponMode === "beamLaser") ? Math.max(1, Math.round(itemNumber(item.burstShotCount, item.weaponMode === "beamLaser" ? 30 : 6))) : 1;
    const ticksBetweenBurstShots = (item.weaponMode === "rangedAuto" || item.weaponMode === "beamLaser") ? Math.max(1, Math.round(itemNumber(item.ticksBetweenBurstShots, item.weaponMode === "beamLaser" ? 2 : 8))) : 10;
    const projectileSpeed = itemNumber(item.projectileSpeed, 70);
    const accuracyTouch = itemNumber(item.accuracyTouch, 0.6);
    const accuracyShort = itemNumber(item.accuracyShort, 0.8);
    const accuracyMedium = itemNumber(item.accuracyMedium, 0.65);
    const accuracyLong = itemNumber(item.accuracyLong, 0.45);
    const projectileDef = `${item.defName}_Projectile`;
    const damageDef = isBeam ? (item.damageDef && item.damageDef !== "Bullet" ? item.damageDef : "Beam") : (item.damageDef || "Bullet");
    const defaultProjectileTexPath = defaultProjectileTextureForDamageDef(damageDef);
    const legacyInvalidProjectilePaths = ["Things/Projectile/Projectile_Explosive", "Things/Projectile/Projectile_EMP", "Things/Projectile/Projectile_Smoke"];
    const hasCustomProjectileTexture = Boolean(item.projectileGraphicPath && item.projectileGraphicPath !== "Things/Projectile/Bullet_Small" && item.projectileGraphicPath !== defaultProjectileTexPath && !legacyInvalidProjectilePaths.includes(item.projectileGraphicPath));
    const projectileTexPath = hasCustomProjectileTexture ? item.projectileGraphicPath : defaultProjectileTexPath;
    const explosionRadiusInput = Math.max(0, itemNumber(item.projectileExplosionRadius, 0));
    const explosionRadius = explosionRadiusInput > 0 ? explosionRadiusInput : defaultExplosionRadiusForDamageDef(damageDef);
    const stoppingPower = Math.max(0, itemNumber(item.projectileStoppingPower, 0.5));
    const chanceToStartFire = Math.max(0, itemNumber(item.projectileChanceToStartFire, 0));
    const projectileIsExplosive = isExplosiveProjectileDamageDef(damageDef) && explosionRadius > 0;
    const explosiveVerbXml = projectileIsExplosive ? `
        <forcedMissRadius>${Math.max(0.5, Math.min(3, explosionRadius * 0.5)).toFixed(1)}</forcedMissRadius>
        <ai_AvoidFriendlyFireRadius>${Math.ceil(explosionRadius + 2)}</ai_AvoidFriendlyFireRadius>
        <targetParams>
          <canTargetLocations>true</canTargetLocations>
        </targetParams>` : "";
    const weaponTags = xmlList("weaponTags", csvList(item.weaponTagsCsv));
    const recipeUsers = csvList(item.recipeUsersCsv || "FueledSmithy,ElectricSmithy");
    const recipeUsersXml = recipeUsers.length ? `<recipeUsers>${recipeUsers.map((v) => `<li>${escapeXml(v)}</li>`).join("")}</recipeUsers>` : "";
    const stuffCategories = csvList(item.stuffCategoriesCsv || "Metallic");
    const stuffXml = item.madeFromStuff ? `\n    <stuffCategories>\n${stuffCategories.map((v) => `      <li>${escapeXml(v)}</li>`).join("\n")}\n    </stuffCategories>\n    <costStuffCount>${Math.max(1, Math.round(itemNumber(item.costStuffCount, 50)))}</costStuffCount>` : "";
    const costEntries = [steelCost > 0 ? `      <Steel>${steelCost}</Steel>` : "", componentCost > 0 ? `      <ComponentIndustrial>${componentCost}</ComponentIndustrial>` : ""].filter(Boolean).join("\n") || "      <Steel>1</Steel>";
    const costXml = item.madeFromStuff ? stuffXml : `\n    <costList>\n${costEntries}\n    </costList>`;
    const rangedStats = isMelee ? "" : `\n      <AccuracyTouch>${accuracyTouch}</AccuracyTouch>\n      <AccuracyShort>${accuracyShort}</AccuracyShort>\n      <AccuracyMedium>${accuracyMedium}</AccuracyMedium>\n      <AccuracyLong>${accuracyLong}</AccuracyLong>\n      <RangedWeapon_Cooldown>${cooldown}</RangedWeapon_Cooldown>`;
    const weaponStatBases = `    <statBases>\n      <MarketValue>${marketValue}</MarketValue>\n      <Mass>${mass}</Mass>\n      <Flammability>${flammability}</Flammability>\n      <DeteriorationRate>${deteriorationRate}</DeteriorationRate>\n      <Beauty>${beauty}</Beauty>\n      <WorkToMake>${workToMake}</WorkToMake>${rangedStats}\n    </statBases>`;
    const meleeTool = `\n    <tools>\n      <li>\n        <label>${escapeXml(item.label)} attack</label>\n        <capacities><li>${isMelee ? "Cut" : "Blunt"}</li></capacities>\n        <power>${isMelee ? damage : Math.max(1, Math.round(damage * 0.35))}</power>\n        <armorPenetration>${meleeArmor}</armorPenetration>\n        <cooldownTime>${isMelee ? cooldown : 2}</cooldownTime>\n      </li>\n    </tools>`;
    const beamWidth = Math.max(0.1, itemNumber(item.beamWidth, 1));
    const beamFullWidthRange = Math.max(0.1, itemNumber(item.beamFullWidthRange, Math.max(1, range * 0.65)));
    const beamSoundDef = sanitizeDefName(item.customBeamSoundDef || sound.beamSoundCast || "");
    const beamSoundXml = beamSoundDef ? `
        <soundCastBeam>${escapeXml(beamSoundDef)}</soundCastBeam>` : "";
    const beamTailXml = sound.soundCastTail ? `
        <soundCastTail>${escapeXml(sound.soundCastTail)}</soundCastTail>` : "";
    const beamVisualPreset = item.beamVisualPreset || "anomalyIncinerator";
    const beamGroundFleckDef = sanitizeDefName(item.beamGroundFleckDef || "Fleck_IncineratorBeamBurn");
    const beamLineFleckDef = sanitizeDefName(item.beamLineFleckDef || "Fleck_IncineratorBeamSmoke");
    const beamEndEffecterDef = sanitizeDefName(item.beamEndEffecterDef || "IncineratorBeam_End");
    const beamVisualXml = (() => {
      if (beamVisualPreset === "safeNone") return "";
      const mayRequire = beamVisualPreset === "anomalyIncinerator" ? ' MayRequire="Ludeon.RimWorld.Anomaly"' : "";
      const ground = beamGroundFleckDef ? `
        <beamGroundFleckDef${mayRequire}>${escapeXml(beamGroundFleckDef)}</beamGroundFleckDef>
        <beamFleckChancePerTick>0.35</beamFleckChancePerTick>` : "";
      const line = beamLineFleckDef ? `
        <beamLineFleckDef${mayRequire}>${escapeXml(beamLineFleckDef)}</beamLineFleckDef>
        <beamLineFleckChanceCurve>
          <points>
            <li>(0, 0)</li>
            <li>(0.65, 0.04)</li>
            <li>(1, 0.45)</li>
          </points>
        </beamLineFleckChanceCurve>` : "";
      const end = beamEndEffecterDef ? `
        <beamEndEffecterDef${mayRequire}>${escapeXml(beamEndEffecterDef)}</beamEndEffecterDef>` : "";
      return `${ground}${line}${end}`;
    })();
    // Verb_ShootBeam uses highlightColor / secondaryHighlightColor for the visible beam core.
    // Fleck/effecter fields only create hit smoke/burn particles, so without these colors the weapon
    // can deal Beam damage while appearing to have no laser line.
    const beamColorXml = isBeam ? `
        <highlightColor>(80, 195, 255)</highlightColor>
        <secondaryHighlightColor>(10, 210, 220)</secondaryHighlightColor>` : "";
    const regularSoundCast = sound.soundCast || WEAPON_SOUND_PRESETS.AssaultRifle.soundCast || "Shot_AssaultRifle";
    const regularSoundTail = sound.soundCastTail || WEAPON_SOUND_PRESETS.AssaultRifle.soundCastTail || "GunTail_Medium";
    const verbs = isMelee ? "" : (isBeam ? `
    <verbs>
      <li>
        <verbClass>Verb_ShootBeam</verbClass>
        <hasStandardCommand>true</hasStandardCommand>
        <warmupTime>${warmupTime}</warmupTime>
        <range>${range}</range>
        <beamFullWidthRange>${beamFullWidthRange}</beamFullWidthRange>
        <beamWidth>${beamWidth}</beamWidth>
        <burstShotCount>${burstShotCount}</burstShotCount>
        <ticksBetweenBurstShots>${ticksBetweenBurstShots}</ticksBetweenBurstShots>
        <showBurstShotStats>false</showBurstShotStats>
        <requireLineOfSight>true</requireLineOfSight>
        <beamDamageDef>${escapeXml(damageDef)}</beamDamageDef>${beamSoundXml}${beamTailXml}${beamVisualXml}${beamColorXml}
        <muzzleFlashScale>9</muzzleFlashScale>
        <beamMaxDeviation>0.5</beamMaxDeviation>
        <beamCurvature>0</beamCurvature>
        <beamStartOffset>0.5</beamStartOffset>
        <beamHitsNeighborCells>true</beamHitsNeighborCells>
        <beamHitsNeighborCellsRequiresLOS>true</beamHitsNeighborCellsRequiresLOS>
        <targetParams>
          <canTargetLocations>true</canTargetLocations>
        </targetParams>
        <rangedFireRulepack>Combat_RangedFire</rangedFireRulepack>
      </li>
    </verbs>` : `
    <verbs>
      <li>
        <verbClass>Verb_Shoot</verbClass>
        <hasStandardCommand>true</hasStandardCommand>
        <defaultProjectile>${escapeXml(projectileDef)}</defaultProjectile>
        <warmupTime>${warmupTime}</warmupTime>
        <range>${range}</range>
        <burstShotCount>${burstShotCount}</burstShotCount>
        <ticksBetweenBurstShots>${ticksBetweenBurstShots}</ticksBetweenBurstShots>${explosiveVerbXml}
        <soundCast>${escapeXml(regularSoundCast)}</soundCast>
        <soundCastTail>${escapeXml(regularSoundTail)}</soundCastTail>
        <muzzleFlashScale>${item.soundPreset === "Minigun" ? 12 : 9}</muzzleFlashScale>
      </li>
    </verbs>`);
    const projectileExtra = `${explosionRadius > 0 ? `
      <explosionRadius>${explosionRadius}</explosionRadius>` : ""}${projectileFireSpawnXml(damageDef, chanceToStartFire)}`;
    const projectileThingClass = projectileThingClassXml(damageDef, explosionRadius);
    const projectileGraphicShader = isExplosiveProjectileDamageDef(damageDef) ? "\n      <shaderType>TransparentPostLight</shaderType>" : "";
    const projectileXml = (isMelee || isBeam) ? "" : `
  <ThingDef ParentName="BaseBullet">
    <defName>${escapeXml(projectileDef)}</defName>
    <label>${escapeXml(item.label)} projectile</label>${projectileThingClass}
    <graphicData>
      <texPath>${escapeXml(projectileTexPath)}</texPath>
      <graphicClass>Graphic_Single</graphicClass>${projectileGraphicShader}
    </graphicData>
    <projectile>
      <damageDef>${escapeXml(damageDef)}</damageDef>
      <damageAmountBase>${damage}</damageAmountBase>
      <armorPenetrationBase>${rangedArmor}</armorPenetrationBase>
      <speed>${projectileSpeed}</speed>
      <stoppingPower>${stoppingPower}</stoppingPower>${projectileExtra}
    </projectile>
  </ThingDef>`;
    return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <ThingDef ParentName="${parent}">\n    <defName>${escapeXml(item.defName)}</defName>\n    <label>${escapeXml(item.label)}</label>\n    <description>${escapeXml(item.description)}</description>\n    <graphicData>\n      <texPath>${escapeXml(pathBase)}</texPath>\n      <graphicClass>Graphic_Single</graphicClass>\n      <drawSize>(1,1)</drawSize>\n    </graphicData>\n${weaponStatBases}${xmlList("thingCategories", csvList(item.thingCategoriesCsv))}${xmlList("tradeTags", csvList(item.tradeTagsCsv))}${weaponTags}${meleeTool}${verbs}${costXml}\n    <recipeMaker>\n      ${recipeUsersXml}${item.researchPrerequisite ? `\n      <researchPrerequisite>${escapeXml(item.researchPrerequisite)}</researchPrerequisite>` : ""}\n      <workAmount>${workToMake}</workAmount>\n    </recipeMaker>\n  </ThingDef>${projectileXml}\n</Defs>\n`;
  }
  if (item.kind === "apparel") {
    return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <ThingDef ParentName="BaseApparel">\n${common}\n    <apparel>\n      <bodyPartGroups><li>Torso</li></bodyPartGroups>\n      <wornGraphicPath>${escapeXml(pathBase)}</wornGraphicPath>\n      <layers><li>Shell</li></layers>\n    </apparel>\n  </ThingDef>\n</Defs>\n`;
  }
  if (item.kind === "hair") {
    return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <HairDef>\n    <defName>${escapeXml(item.defName)}</defName>\n    <label>${escapeXml(item.label)}</label>\n    <description>${escapeXml(item.description)}</description>\n    <texPath>${escapeXml(pathBase)}</texPath>\n    <hairTags><li>Urban</li></hairTags>\n  </HairDef>\n</Defs>\n`;
  }
  return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <ThingDef ParentName="ResourceBase">\n${common}\n    <stackLimit>${item.stackLimit}</stackLimit>\n  </ThingDef>\n</Defs>\n`;
}

function buildResearchXml(project: Project): string {
  if (project.research.length === 0) return "";
  const independentTabs = Array.from(new Map(project.research
    .filter((r) => researchOwnership(r) === "independent")
    .map((r) => {
      const tabDef = researchTabDefName(project, r);
      return [tabDef, { defName: tabDef, label: r.researchTabDefName ? r.researchTabDefName : `${project.mod.name} research` }];
    })).values());
  const tabsXml = independentTabs.map((tab) => `  <ResearchTabDef>
    <defName>${escapeXml(tab.defName)}</defName>
    <label>${escapeXml(tab.label)}</label>
  </ResearchTabDef>`).join("\n");
  const researchXml = project.research.map((r, index) => {
    const ownership = researchOwnership(r);
    const tab = ownership === "independent" ? researchTabDefName(project, r) : "Main";
    const x = itemNumber(r.researchViewX, index + 1);
    const y = itemNumber(r.researchViewY, 1);
    const prereqs = csvList(r.prerequisitesCsv ?? r.prerequisites.join(","));
    return `  <ResearchProjectDef>
    <defName>${escapeXml(r.defName)}</defName>
    <label>${escapeXml(r.label)}</label>
    <description>${escapeXml(r.description)}</description>
    <baseCost>${r.baseCost}</baseCost>
    <techLevel>${r.techLevel}</techLevel>
    <tab>${escapeXml(tab)}</tab>
    <researchViewX>${x}</researchViewX>
    <researchViewY>${y}</researchViewY>${prereqs.length ? `
    <prerequisites>
${prereqs.map((p) => `      <li>${escapeXml(p)}</li>`).join("\n")}
    </prerequisites>` : ""}
  </ResearchProjectDef>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<Defs>
${tabsXml ? `${tabsXml}\n` : ""}${researchXml}
</Defs>
`;
}

function buildStorytellerXml(project: Project): string {
  const s = project.storyteller;
  const portraitLarge = project.assets["storyteller.large"] ? `\n    <portraitLarge>${escapeXml(project.mod.packageId)}/Storytellers/${escapeXml(s.defName)}</portraitLarge>` : "";
  const portraitTiny = project.assets["storyteller.tiny"] ? `\n    <portraitTiny>${escapeXml(project.mod.packageId)}/Storytellers/${escapeXml(s.defName)}_Tiny</portraitTiny>` : "";
  return `<?xml version="1.0" encoding="utf-8"?>\n<Defs>\n  <StorytellerDef ParentName="BaseStoryteller">\n    <defName>${escapeXml(s.defName)}</defName>\n    <label>${escapeXml(s.label)}</label>\n    <description>${escapeXml(s.description)}</description>\n    <listOrder>${s.listOrder}</listOrder>${portraitLarge}${portraitTiny}\n  </StorytellerDef>\n</Defs>\n`;
}

function buildScenarioXml(project: Project): string {
  const s = project.scenario;
  const playerFactionDef = s.playerFactionDef || "PlayerColony";
  const startingPawnPart = buildStartingPawnScenarioPart(project);
  return `<?xml version="1.0" encoding="utf-8"?>
<Defs>
  <ScenarioDef ParentName="ScenarioBase">
    <defName>${escapeXml(s.defName)}</defName>
    <label>${escapeXml(s.label)}</label>
    <description>${escapeXml(s.description)}</description>
    <scenario>
      <summary>${escapeXml(s.summary)}</summary>
      <playerFaction>
        <def>PlayerFaction</def>
        <factionDef>${escapeXml(playerFactionDef)}</factionDef>
      </playerFaction>
      <surfaceLayer>
        <def>SurfaceLayerFixed</def>
        <tag>Surface</tag>
        <layer>Surface</layer>
        <settingsDef>Surface</settingsDef>
        <hide>true</hide>
        <connections>
          <Orbit MayRequire="Ludeon.RimWorld.Odyssey">
            <zoomMode>ZoomOut</zoomMode>
          </Orbit>
        </connections>
      </surfaceLayer>
      <parts>
        <li MayRequire="Ludeon.RimWorld.Odyssey" Class="ScenPart_PlanetLayer">
          <def>PlanetLayer</def>
          <tag>Orbit</tag>
          <layer>Orbit</layer>
          <settingsDef>Orbit</settingsDef>
          <hide>true</hide>
          <connections>
            <Surface><zoomMode>ZoomIn</zoomMode></Surface>
          </connections>
        </li>
${startingPawnPart}
        <li Class="ScenPart_PlayerPawnsArriveMethod">
          <def>PlayerPawnsArriveMethod</def>
          <method>Standing</method>
        </li>
        ${scenarioThing("Silver", s.startWithSilver)}
        ${scenarioThing("MealSurvivalPack", s.startWithPackagedMeals)}
        ${scenarioThing("MedicineIndustrial", s.startWithMedicine)}
        ${scenarioThing("ComponentIndustrial", s.startWithComponents)}
        ${scenarioThing("Steel", s.startWithSteel)}
      </parts>
    </scenario>
  </ScenarioDef>
</Defs>
`;
}

function buildStartingPawnScenarioPart(project: Project): string {
  const s = project.scenario;
  const forceCustomRace = Boolean(project.race.enabled && (s.forceCustomRaceStartingPawns ?? true));
  if (!forceCustomRace) {
    return `        <li Class="ScenPart_ConfigPage_ConfigureStartingPawns">
          <def>ConfigPage_ConfigureStartingPawns</def>
          <pawnCount>${s.startingPawnCount}</pawnCount>
          <pawnChoiceCount>${s.chooseFromPawnCount}</pawnChoiceCount>
        </li>`;
  }
  const r = project.race;
  const pawnKind = `${r.defName}_Colonist`;
  const pawnCount = Math.max(1, Math.floor(Number(s.startingPawnCount) || 1));
  const choiceCount = Math.max(pawnCount, Math.floor(Number(s.chooseFromPawnCount) || pawnCount));
  const mode = s.startingPawnRaceMode || "stableSelectedOnly";
  const xenotypeCount = mode === "experimentalCandidatePool" ? choiceCount : pawnCount;
  const actualChoiceCount = mode === "experimentalCandidatePool" ? choiceCount : Math.max(pawnCount, choiceCount);
  // Important limitation: RimWorld's ScenPart_ConfigPage_ConfigureStartingPawns_Xenotypes only exposes
  // pawnChoiceCount plus xenotypeCounts. Its count field controls how many pawns the scenario forces for
  // that xenotype, not a separate hidden reserve pool. Keeping count=startingPawnCount is the safest XML-only
  // behavior: selected starting pawns use the custom PawnKind; reserve pawns may still be generated as Human.
  // The experimental mode intentionally uses count=chooseFromPawnCount for users who want to test full-pool forcing.
  return `        <li MayRequire="Ludeon.RimWorld.Biotech" Class="ScenPart_ConfigPage_ConfigureStartingPawns_Xenotypes">
          <def>ConfigurePawnsXenotypes</def>
          <pawnChoiceCount>${actualChoiceCount}</pawnChoiceCount>
          <customSummary>${escapeXml(s.summary)}</customSummary>
          <overrideKinds>
            <li>
              <xenotype>${escapeXml(r.xenotypeDefName)}</xenotype>
              <pawnKind>${escapeXml(pawnKind)}</pawnKind>
            </li>
          </overrideKinds>
          <xenotypeCounts>
            <li>
              <xenotype>${escapeXml(r.xenotypeDefName)}</xenotype>
              <count>${xenotypeCount}</count>
              <description>${escapeXml(r.xenotypeLabel || r.label)}</description>
              <allowedDevelopmentalStages>Adult</allowedDevelopmentalStages>
            </li>
          </xenotypeCounts>
        </li>`;
}

function scenarioThing(thingDef: string, count: number) {
  return `<li Class="ScenPart_StartingThing_Defined">\n        <def>StartingThing_Defined</def>\n        <thingDef>${thingDef}</thingDef>\n        <count>${count}</count>\n      </li>`;
}

function buildValidation(project: Project): string[] {
  const errors: string[] = [];
  if (!project.mod.packageId.includes(".")) errors.push("Package ID should contain dots, for example test.examplemod.");
  if (project.race.enabled) {
    const bodyKeys = project.race.textureMode === "gendered" ? ["race.body.male", "race.body.female"] : ["race.body.shared"];
    const headKeys = project.race.headTextureMode === "gendered" ? ["race.head.male", "race.head.female"] : ["race.head.shared"];
    for (const key of [...bodyKeys, ...headKeys]) for (const d of ["front", "side", "back"]) if (!project.assets[`${key}.${d}`]) errors.push(`Missing ${key} ${d} PNG.`);
  }
  if (project.faction.enabled && !project.race.enabled) errors.push("FactionDef requires Custom Race to be enabled in this beta.");
  for (const item of project.items) {
    if (item.kind === "apparel" || item.kind === "hair") {
      for (const d of ["front", "side", "back"]) if (!project.assets[`item.${item.id}.${d}`]) errors.push(`Missing ${item.defName} ${d} PNG.`);
    } else if (!project.assets[`item.${item.id}.single`]) {
      errors.push(`Missing ${item.defName} single PNG.`);
    }
  }
  return errors;
}

function itemHasRequiredTextures(project: Project, item: AddItem) {
  if (item.kind === "apparel" || item.kind === "hair") return ["front", "side", "back"].every((d) => project.assets[`item.${item.id}.${d}`]);
  return Boolean(project.assets[`item.${item.id}.single`]);
}

async function compileProject(project: Project): Promise<VirtualFile[]> {
  const files: VirtualFile[] = [];
  const root = project.mod.name.replace(/[\\/:*?"<>|]/g, "_");
  const push = (file: VirtualFile) => files.push(textFile(`${root}/${file.path}`, typeof file.content === "string" ? file.content : ""));
  files.push(textFile(`${root}/About/About.xml`, buildAboutXml(project)));
  // Source/ModMakerProject.json is intentionally not packaged into the playable Mod ZIP.
  // It is written separately to the editor source/ folder during export.

  if (project.race.enabled) {
    files.push(textFile(`${root}/Defs/ThingDefs/Races/${project.race.defName}.xml`, buildRaceXml(project)));
    files.push(textFile(`${root}/Defs/PawnKindDefs/${project.race.defName}_PawnKind.xml`, buildPawnKindXml(project)));
    const raceBase = `${root}/Textures/${project.mod.packageId}/Races/${project.race.defName}`;
    await addDirectionalTextures(files, project, "race.body.shared", `${raceBase}/Bodies`, `${project.race.defName}_Body`);
    await addDirectionalTextures(files, project, "race.body.male", `${raceBase}/Bodies`, `${project.race.defName}_Body`);
    await addDirectionalTextures(files, project, "race.body.female", `${raceBase}/Bodies`, `${project.race.defName}_Female_Body`);
    for (const bt of BODY_TYPES) await addDirectionalTextures(files, project, `race.bodytype.${bt}`, `${raceBase}/Bodies`, `${project.race.defName}_${bt}_Body`);
    await addDirectionalTextures(files, project, "race.head.shared", `${raceBase}/Heads`, `${project.race.defName}_Head`);
    await addDirectionalTextures(files, project, "race.head.male", `${raceBase}/Heads`, `${project.race.defName}_Male_Head`);
    await addDirectionalTextures(files, project, "race.head.female", `${raceBase}/Heads`, `${project.race.defName}_Female_Head`);
  }
  if (project.faction.enabled && project.race.enabled) files.push(textFile(`${root}/Defs/FactionDefs/${project.faction.defName}.xml`, buildFactionXml(project)));
  if (project.research.length) files.push(textFile(`${root}/Defs/ResearchProjectDefs/ResearchProjects.xml`, buildResearchXml(project)));
  if (project.storyteller.enabled) {
    files.push(textFile(`${root}/Defs/StorytellerDefs/${project.storyteller.defName}.xml`, buildStorytellerXml(project)));
    for (const key of ["storyteller.large", "storyteller.tiny"]) {
      const asset = project.assets[key];
      if (asset) files.push(binaryFile(`${root}/Textures/${project.mod.packageId}/Storytellers/${project.storyteller.defName}${key.endsWith("tiny") ? "_Tiny" : ""}.png`, await dataUrlToBytes(asset.dataUrl)));
    }
  }
  if (project.scenario.enabled) files.push(textFile(`${root}/Defs/ScenarioDefs/${project.scenario.defName}.xml`, buildScenarioXml(project)));

  for (const item of project.items) {
    if (!itemHasRequiredTextures(project, item)) continue;
    files.push(textFile(`${root}/Defs/AddItems/${item.defName}.xml`, buildItemXml(project, item)));
    const base = `${root}/Textures/${project.mod.packageId}/Items/${item.kind}/${item.defName}`;
    if (item.kind === "apparel" || item.kind === "hair") {
      await addDirectionalTextures(files, project, `item.${item.id}`, base, item.defName);
    } else {
      const asset = project.assets[`item.${item.id}.single`];
      if (asset) files.push(binaryFile(`${base}/${item.defName}.png`, await dataUrlToBytes(asset.dataUrl)));
      const projectileAsset = project.assets[`item.${item.id}.projectile`];
      if (item.kind === "weapon" && projectileAsset) files.push(binaryFile(`${root}/Textures/${project.mod.packageId}/Items/projectiles/${item.defName}_Projectile.png`, await dataUrlToBytes(projectileAsset.dataUrl)));
    }
  }
  return files;
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return <label className="field"><span>{props.label}</span>{props.textarea ? <textarea value={props.value} onChange={(e) => props.onChange(e.target.value)} /> : <input value={props.value} onChange={(e) => props.onChange(e.target.value)} />}</label>;
}

function NumField(props: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return <label className="field"><span>{props.label}</span><input type="number" min={props.min} max={props.max} step={props.step ?? 1} value={props.value} onChange={(e) => props.onChange(Number(e.target.value))} /></label>;
}

function PngDrop(props: { language: Lang; asset?: Asset; label: string; onAsset: (a: Asset) => void }) {
  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".png")) return alert("PNG only");
    props.onAsset(await fileToAsset(file, props.label));
  }
  function drop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.currentTarget.classList.remove("dragOver");
    handleFiles(e.dataTransfer.files);
  }
  return <label className="drop" onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dragOver"); }} onDragLeave={(e) => e.currentTarget.classList.remove("dragOver")} onDrop={drop}>
    <input type="file" accept="image/png" onChange={(e) => handleFiles(e.target.files)} />
    <strong>{props.label}</strong>
    <span>{props.asset ? `${tr(props.language, "Uploaded")}: ${props.asset.fileName}` : tr(props.language, "Drop PNG here or click")}</span>
  </label>;
}

function App() {
  const [project, setProject] = useState<Project>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return hydrateProject(parsed);
      }
    } catch {}
    return defaultProject();
  });
  const [tab, setTab] = useState("mod");
  const fileRef = useRef<HTMLInputElement>(null);
  const L = project.language;
  const T = (s: string) => tr(L, s);

  useEffect(() => {
    try {
      const autosaveProject = { ...project, assets: {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(autosaveProject));
    } catch (error) {
      console.warn("Autosave skipped:", error);
    }
  }, [project]);

  function update<K extends keyof Project>(key: K, value: Project[K]) {
    setProject((p) => {
      const entries = key === "logs" ? [] : diffLogEntries(String(key), p[key], value);
      emitEditorLogs(entries);
      return { ...p, [key]: value, logs: [...(p.logs ?? []), ...entries] };
    });
  }
  function patchMod(value: Partial<ModInfo>) { update("mod", { ...project.mod, ...value }); }
  function patchRace(value: Partial<RaceConfig>) { update("race", { ...project.race, ...value }); }
  function patchFaction(value: Partial<FactionConfig>) { update("faction", { ...project.faction, ...value }); }
  function patchStoryteller(value: Partial<StorytellerConfig>) { update("storyteller", { ...project.storyteller, ...value }); }
  function patchScenario(value: Partial<ScenarioConfig>) { update("scenario", { ...project.scenario, ...value }); }
  function setAsset(key: string, asset: Asset) {
    const entry = makeLogEntry("Asset uploaded", `${key}: ${asset.fileName}`, "assets");
    emitEditorLogs([entry]);
    setProject((p) => ({ ...p, assets: { ...p.assets, [key]: asset }, logs: [...(p.logs ?? []), entry] }));
  }

  function setRaceEnabled(enabled: boolean) {
    const nextDeps = enabled ? project.dependencies : project.dependencies.filter((d) => d.packageId !== HAR_DEP.packageId);
    update("dependencies", nextDeps);
    patchRace({ enabled });
  }

  function addItem() {
    const id = uid("item");
    const newItem: AddItem = {
      id,
      kind: "weapon",
      defName: sanitizeDefName(`TestAddItemDefName${project.items.length + 1}Alpha`),
      label: "test item",
      description: "TestItemDescription",
      marketValue: 100,
      mass: 1,
      flammability: 0.5,
      deteriorationRate: 2,
      beauty: -3,
      workToMake: 2000,
      steelCost: 50,
      componentCost: 0,
      stackLimit: 75,
      weaponMode: "rangedAuto",
      damage: 10,
      cooldown: 1.5,
      meleeArmorPenetration: 0.25,
      range: 28,
      warmupTime: 1.2,
      burstShotCount: 6,
      ticksBetweenBurstShots: 8,
      armorPenetration: 0.16,
      projectileSpeed: 70,
      accuracyTouch: 0.6,
      accuracyShort: 0.8,
      accuracyMedium: 0.65,
      accuracyLong: 0.45,
      soundPreset: "AssaultRifle",
      damageDef: "Bullet",
      projectileGraphicPath: "Things/Projectile/Bullet_Small",
      projectileExplosionRadius: 0,
      projectileStoppingPower: 0.5,
      projectileChanceToStartFire: 0,
      beamWidth: 1,
      beamFullWidthRange: 18,
      beamVisualPreset: "anomalyIncinerator",
      beamGroundFleckDef: "Fleck_IncineratorBeamBurn",
      beamLineFleckDef: "Fleck_IncineratorBeamSmoke",
      beamEndEffecterDef: "IncineratorBeam_End",
      customBeamSoundDef: "",
      weaponTagsCsv: "Gun",
      tradeTagsCsv: "WeaponRanged",
      thingCategoriesCsv: "",
      recipeUsersCsv: "FueledSmithy,ElectricSmithy",
      madeFromStuff: false,
      stuffCategoriesCsv: "Metallic",
      costStuffCount: 50,
      buildingSizeX: 1,
      buildingSizeY: 1,
      buildingPassability: "PassThroughOnly",
      buildingFillPercent: 0.4,
      buildingDesignationCategory: "Furniture",
      buildingMaxHitPoints: 100,
      researchPrerequisite: ""
    };
    const entry = makeLogEntry("Item added", `${newItem.defName} (${newItem.kind})`, "items");
    emitEditorLogs([entry]);
    setProject((p) => ({ ...p, items: [...p.items, newItem], logs: [...(p.logs ?? []), entry] }));
  }

  function patchItem(id: string, value: Partial<AddItem>) {
    setProject((p) => {
      const before = p.items.find((item) => item.id === id);
      const items = p.items.map((item) => item.id === id ? { ...item, ...value } : item);
      const after = items.find((item) => item.id === id);
      const entries = before && after ? diffLogEntries(`item.${before.defName}`, before, after) : [];
      emitEditorLogs(entries);
      return { ...p, items, logs: [...(p.logs ?? []), ...entries] };
    });
  }

  function deleteItem(id: string) {
    setProject((p) => {
      const removed = p.items.find((item) => item.id === id);
      const assets = Object.fromEntries(Object.entries(p.assets).filter(([key]) => !key.startsWith(`item.${id}.`)));
      const entry = makeLogEntry("Item deleted", removed ? `${removed.defName} (${removed.kind})` : id, "items");
      emitEditorLogs([entry]);
      return { ...p, assets, items: p.items.filter((item) => item.id !== id), logs: [...(p.logs ?? []), entry] };
    });
  }

  function addResearch() {
    const id = uid("research");
    const research: ResearchProject = { id, defName: `TestResearchProjectDefName${project.research.length + 1}`, label: "test research", description: "TestResearchDescription", baseCost: 500, techLevel: "Industrial" as TechLevel, prerequisites: [] as string[], prerequisitesCsv: "", techTreeOwnership: "vanilla", researchTabDefName: projectDefaultResearchTab(project), researchViewX: 1 + project.research.length, researchViewY: 1 };
    const entry = makeLogEntry("Research added", research.defName, "research");
    emitEditorLogs([entry]);
    setProject((p) => ({ ...p, research: [...p.research, research], logs: [...(p.logs ?? []), entry] }));
  }

  function patchResearch(id: string, value: Partial<ResearchProject>) {
    setProject((p) => {
      const before = p.research.find((r) => r.id === id);
      const research = p.research.map((r) => r.id === id ? { ...r, ...value } : r);
      const after = research.find((r) => r.id === id);
      const entries = before && after ? diffLogEntries(`research.${before.defName}`, before, after) : [];
      emitEditorLogs(entries);
      return { ...p, research, logs: [...(p.logs ?? []), ...entries] };
    });
  }

  function deleteResearch(id: string) {
    setProject((p) => {
      const removed = p.research.find((r) => r.id === id);
      const entry = makeLogEntry("Research deleted", removed ? removed.defName : id, "research");
      emitEditorLogs([entry]);
      return { ...p, research: p.research.filter((r) => r.id !== id), logs: [...(p.logs ?? []), entry] };
    });
  }

  async function exportZip() {
    const errors = buildValidation(project);
    if (errors.length && !confirm(`Validation warnings:
${errors.join("\n")}

Export anyway?`)) return;
    const started = makeLogEntry("Export started", `${project.mod.name} (${project.mod.packageId})`, "export");
    emitEditorLogs([started]);
    const snapshot: Project = { ...project, logs: [...(project.logs ?? []), started] };
    const files = await compileProject(snapshot);
    const generatedPaths = files.map((f) => f.path);
    const finished = makeLogEntry("Export completed", `${project.mod.name}: ${files.length} generated files before log attachment`, "export");
    const logFileName = `${sanitizeLogFileName(project.mod.packageId)}_${formatTimestampForFile()}_modmaker_log.txt`;
    const logText = formatProjectLog(snapshot, [finished], errors, generatedPaths);
    const sourceFileName = `${sanitizeLogFileName(project.mod.packageId)}_${formatTimestampForFile()}_ModMakerProject.json`;
    await writeEditorLogFile(logFileName, logText);
    await writeEditorSourceFile(sourceFileName, JSON.stringify({ ...snapshot, logs: [...(snapshot.logs ?? []), finished] }, null, 2));
    emitEditorLogs([finished]);
    setProject((p) => ({ ...p, logs: [...(p.logs ?? []), started, finished] }));
    const zip = new JSZip();
    for (const f of files) zip.file(f.path, f.content as any);
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    downloadBlob(blob, `${project.mod.name.replace(/[\/:*?"<>|]/g, "_")}.zip`);
  }

  function exportProjectJson() {
    const entry = makeLogEntry("Project JSON exported", `${project.mod.name}_ModMakerProject.json`, "export");
    emitEditorLogs([entry]);
    setProject((p) => ({ ...p, logs: [...(p.logs ?? []), entry] }));
    const sourceFileName = `${sanitizeLogFileName(project.mod.packageId)}_${formatTimestampForFile()}_ModMakerProject.json`;
    void writeEditorSourceFile(sourceFileName, JSON.stringify({ ...project, logs: [...(project.logs ?? []), entry] }, null, 2));
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }), `${project.mod.name}_ModMakerProject.json`);
  }

  async function importProject(file: File) {
    const entryLog = makeLogEntry("Project imported", file.name, "import");
    if (file.name.toLowerCase().endsWith(".zip")) {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const entry = Object.values(zip.files).find((f) => f.name.endsWith("Source/ModMakerProject.json"));
      if (!entry) return alert("This ZIP does not contain Source/ModMakerProject.json.");
      const parsed = JSON.parse(await entry.async("string"));
      const imported = { ...defaultProject(), ...parsed, logs: [...(parsed.logs ?? []), entryLog] };
      emitEditorLogs([entryLog]);
      setProject(imported);
      return;
    }
    const parsed = JSON.parse(await file.text());
    const imported = { ...defaultProject(), ...parsed, logs: [...(parsed.logs ?? []), entryLog] };
    emitEditorLogs([entryLog]);
    setProject(imported);
  }

  function downloadBlob(blob: Blob, name: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const validation = useMemo(() => buildValidation(project), [project]);

  return <div className="app">
    <header>
      <div><h1>{project.mod.name}</h1><p><code>{project.mod.packageId}</code></p></div>
      <div className="toolbar">
        <label>界面语言/UI Language <select value={L} onChange={(e) => update("language", e.target.value as Lang)}><option value="en">English</option><option value="zh">中文</option></select></label>
        <button onClick={exportProjectJson}>{T("Export project JSON")}</button>
        <button onClick={() => fileRef.current?.click()}>{T("Import project JSON / generated ZIP")}</button>
        <input ref={fileRef} hidden type="file" accept=".json,.zip" onChange={(e) => e.target.files?.[0] && importProject(e.target.files[0])} />
      </div>
    </header>
    <main>
      <nav>{[
        ["mod", "Mod Basic Info"], ["deps", "Dependencies"], ["race", "Custom Race"], ["faction", "Faction"], ["items", "Add Item"], ["research", "Tech Tree"], ["story", "Storyteller"], ["scenario", "Scenario"], ["assets", "Assets"], ["export", "Export"]
      ].map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{T(label)}</button>)}</nav>
      <section>
        {tab === "mod" && <div className="grid"><div className="card"><h2>{T("Mod Basic Info")}</h2><Field label={T("Mod name")} value={project.mod.name} onChange={(name) => patchMod({ name })} /><Field label={T("Package ID")} value={project.mod.packageId} onChange={(packageId) => patchMod({ packageId })} /><button onClick={() => patchMod({ packageId: packageIdFromName(project.mod.name) })}>Generate unique Package ID from Mod name</button><Field label={T("Author")} value={project.mod.author} onChange={(author) => patchMod({ author })} /><Field label={T("Description")} value={project.mod.description} onChange={(description) => patchMod({ description })} textarea /><Field label={T("Supported versions, English comma only")} value={project.mod.supportedVersionsCsv ?? csvArrayList(project.mod.supportedVersions).join(",")} onChange={(v) => patchMod({ supportedVersionsCsv: normalizeCommaText(v), supportedVersions: csvList(v) })} /></div><InfoCard T={T} /></div>}
        {tab === "deps" && <Dependencies project={project} update={update} T={T} />}
        {tab === "race" && <RacePanel project={project} T={T} patchRace={patchRace} setRaceEnabled={setRaceEnabled} setAsset={setAsset} />}
        {tab === "faction" && <FactionPanel project={project} T={T} patchFaction={patchFaction} />}
        {tab === "items" && <ItemsPanel project={project} T={T} addItem={addItem} deleteItem={deleteItem} patchItem={patchItem} setAsset={setAsset} />}
        {tab === "research" && <ResearchPanel project={project} T={T} addResearch={addResearch} patchResearch={patchResearch} deleteResearch={deleteResearch} />}
        {tab === "story" && <StoryPanel project={project} T={T} patchStoryteller={patchStoryteller} setAsset={setAsset} />}
        {tab === "scenario" && <ScenarioPanel project={project} T={T} patchScenario={patchScenario} />}
        {tab === "assets" && <AssetsPanel project={project} T={T} />}
        {tab === "export" && <ExportPanel project={project} T={T} validation={validation} exportZip={exportZip} />}
      </section>
    </main>
  </div>;
}

function InfoCard({ T }: { T: (s: string) => string }) {
  return <div className="card"><h2>v50 custom race start options</h2><ul><li>{T("Remote weapons now default to automatic fire; you can still switch to single-shot if needed.")}</li><li>{T("Custom Race automatically adds Humanoid Alien Races as a required dependency only when enabled.")}</li><li>{T("Progress is autosaved to localStorage; export a project JSON before moving computers or clearing browser data.")}</li><li>{T("Projects can be reloaded from exported project JSON in the editor source/ folder.")}</li><li>{T("Tech tree support creates ResearchProjectDef and can link items through researchPrerequisite.")}</li></ul></div>;
}

function Dependencies({ project, update, T }: { project: Project; update: <K extends keyof Project>(k: K, v: Project[K]) => void; T: (s: string) => string }) {
  const deps = project.race.enabled && !project.dependencies.some((d) => d.packageId === HAR_DEP.packageId) ? [HAR_DEP, ...project.dependencies] : project.dependencies;
  return <div className="card"><h2>{T("Dependencies")}</h2><p>{T("Custom Race automatically adds Humanoid Alien Races as a required dependency only when enabled.")}</p><button onClick={() => update("dependencies", [...project.dependencies, { packageId: "test.dependency.packageid", displayName: "TestDependencyDisplayName", required: true }])}>{T("Add dependency")}</button>{deps.map((d, i) => <div className="rowCard" key={`${d.packageId}-${i}`}><Field label="packageId" value={d.packageId} onChange={(packageId) => update("dependencies", project.dependencies.map((x) => x === d ? { ...x, packageId } : x))} /><Field label={T("Display name")} value={d.displayName} onChange={(displayName) => update("dependencies", project.dependencies.map((x) => x === d ? { ...x, displayName } : x))} /><label><input type="checkbox" checked={d.required} onChange={(e) => update("dependencies", project.dependencies.map((x) => x === d ? { ...x, required: e.target.checked } : x))} /> {T("Required")}</label></div>)}</div>;
}

function RacePanel({ project, T, patchRace, setRaceEnabled, setAsset }: { project: Project; T: (s: string) => string; patchRace: (v: Partial<RaceConfig>) => void; setRaceEnabled: (v: boolean) => void; setAsset: (key: string, asset: Asset) => void }) {
  const r = project.race;
  return <div className="grid">
    <div className="card"><h2>{T("Custom Race")}</h2>
      <label className="check"><input type="checkbox" checked={r.enabled} onChange={(e) => setRaceEnabled(e.target.checked)} /> {T("Enable Custom Race / HAR RaceDef")}</label>
      <Field label={T("Unique identifier defName")} value={r.defName} onChange={(defName) => patchRace({ defName: sanitizeDefName(defName) })} />
      <Field label={T("Label")} value={r.label} onChange={(label) => patchRace({ label })} />
      <Field label={T("Description")} value={r.description} onChange={(description) => patchRace({ description })} textarea />
      <NumField label={T("Health scale")} value={r.healthScale} onChange={(healthScale) => patchRace({ healthScale })} step={0.05} />
      <NumField label={T("Move speed")} value={r.moveSpeed} onChange={(moveSpeed) => patchRace({ moveSpeed })} step={0.1} />
      <NumField label={T("Melee damage")} value={r.meleeDamage} onChange={(meleeDamage) => patchRace({ meleeDamage })} />
    </div>
    <div className="card"><h2>Textures</h2>
      <label className="field"><span>{T("Texture mode")}</span><select value={r.textureMode} onChange={(e) => patchRace({ textureMode: e.target.value as TextureMode })}><option value="shared">{T("Shared one set")}</option><option value="gendered">{T("Gendered male/female")}</option><option value="bodyTypes">{T("Body types")}</option></select></label>
      <label className="field"><span>{T("Head texture mode")}</span><select value={r.headTextureMode} onChange={(e) => patchRace({ headTextureMode: e.target.value as HeadTextureMode })}><option value="shared">{T("Shared one set")}</option><option value="gendered">{T("Gendered male/female")}</option></select></label>
      <label className="check"><input type="checkbox" checked={Boolean(r.preserveTextureColors)} onChange={(e) => patchRace({ preserveTextureColors: e.target.checked })} /> {T("Preserve original texture colors")}</label>
      <p className="hint">{T("Disable pawn skin tinting and use white skinColor in HAR graphicPaths.")}</p>
      {renderTextureGroup(project, T, setAsset, "race.body.shared", "Body shared", r.textureMode === "shared" || r.textureMode === "bodyTypes")}
      {renderTextureGroup(project, T, setAsset, "race.body.male", "Male body", r.textureMode === "gendered")}
      {renderTextureGroup(project, T, setAsset, "race.body.female", "Female body", r.textureMode === "gendered")}
      {r.textureMode === "bodyTypes" && BODY_TYPES.map((bt) => renderTextureGroup(project, T, setAsset, `race.bodytype.${bt}`, `${bt} body`, true))}
      {renderTextureGroup(project, T, setAsset, "race.head.shared", "Head shared", r.headTextureMode === "shared")}
      {renderTextureGroup(project, T, setAsset, "race.head.male", "Male head", r.headTextureMode === "gendered")}
      {renderTextureGroup(project, T, setAsset, "race.head.female", "Female head", r.headTextureMode === "gendered")}
    </div>
    <GenePanel project={project} T={T} genes={r.genes} patchRace={patchRace} />
  </div>;
}

function renderTextureGroup(project: Project, T: (s: string) => string, setAsset: (key: string, asset: Asset) => void, key: string, label: string, show: boolean) {
  if (!show) return null;
  return <div className="textureGroup"><h3>{label}</h3>{(["front", "side", "back"] as Direction[]).map((d) => <PngDrop key={`${key}.${d}`} language={project.language} label={`${label} ${d}`} asset={project.assets[`${key}.${d}`]} onAsset={(asset) => setAsset(`${key}.${d}`, asset)} />)}</div>;
}

function GenePanel({ project, T, genes, patchRace }: { project: Project; T: (s: string) => string; genes: string[]; patchRace: (v: Partial<RaceConfig>) => void }) {
  const [geneInput, setGeneInput] = useState("");
  const [geneSearch, setGeneSearch] = useState("");
  const normalizedGenes = genes.map((g) => GENE_ALIAS[g] ?? g);
  const uniqueGenes = Array.from(new Set(normalizedGenes));
  function setGene(defName: string, enabled: boolean) {
    const clean = GENE_ALIAS[defName.trim()] ?? defName.trim();
    if (!clean) return;
    const next = enabled ? Array.from(new Set([...uniqueGenes, clean])) : uniqueGenes.filter((g) => g !== clean);
    patchRace({ genes: next });
  }
  function addTypedGene() {
    setGene(geneInput, true);
    setGeneInput("");
  }
  const query = geneSearch.trim().toLowerCase();
  return <div className="card"><h2>{T("Genes")}</h2>
    <Field label={T("Search GeneDef")} value={geneSearch} onChange={setGeneSearch} />
    <div className="rowLine"><Field label={T("Add GeneDef")} value={geneInput} onChange={setGeneInput} /><button onClick={addTypedGene}>{T("Add typed GeneDef")}</button></div>
    <div className="chips selectedGenes">{uniqueGenes.map((g) => <span className="chip" key={g}>{g} <button onClick={() => setGene(g, false)}>×</button></span>)}</div>
    {GENE_CATEGORIES.map((category) => {
      const visible = category.genes.filter((g) => !query || g.defName.toLowerCase().includes(query) || g.label.toLowerCase().includes(query) || g.note.toLowerCase().includes(query));
      if (visible.length === 0) return null;
      return <div className="geneCategory" key={category.title}>
        <h3>{T(category.title)} <small>{visible.length}</small></h3>
        <div className="chips">{visible.map((gene) => <label key={gene.defName} className="geneOption">
          <input type="checkbox" checked={uniqueGenes.includes(gene.defName)} onChange={(e) => setGene(gene.defName, e.target.checked)} />
          <span><strong>{gene.label}</strong><code>{gene.defName}</code><em>{gene.note}</em></span>
        </label>)}</div>
      </div>;
    })}
  </div>;
}

function FactionPanel({ project, T, patchFaction }: { project: Project; T: (s: string) => string; patchFaction: (v: Partial<FactionConfig>) => void }) {
  const f = project.faction;
  return <div className="grid"><div className="card"><h2>{T("Faction")}</h2><label className="check"><input type="checkbox" checked={f.enabled} onChange={(e) => patchFaction({ enabled: e.target.checked })} /> {T("Enable FactionDef")}</label><Field label={T("Faction defName")} value={f.defName} onChange={(defName) => patchFaction({ defName: sanitizeDefName(defName) })} /><Field label={T("Label")} value={f.label} onChange={(label) => patchFaction({ label })} /><Field label={T("Fixed world name")} value={f.fixedName} onChange={(fixedName) => patchFaction({ fixedName })} /><Field label={T("Description")} value={f.description} onChange={(description) => patchFaction({ description })} textarea /><Field label={T("Culture description")} value={f.culture} onChange={(culture) => patchFaction({ culture })} textarea /></div><div className="card"><label className="field"><span>{T("Category")}</span><select value={f.categoryTag} onChange={(e) => patchFaction({ categoryTag: e.target.value as any })}><option>Outlander</option><option>Tribal</option><option>Pirate</option></select></label><label className="field"><span>{T("Tech level")}</span><select value={f.techLevel} onChange={(e) => patchFaction({ techLevel: e.target.value as TechLevel })}><option>Neolithic</option><option>Medieval</option><option>Industrial</option><option>Spacer</option><option>Ultra</option></select></label><NumField label={T("Required count at game start")} value={f.requiredCountAtGameStart} onChange={(requiredCountAtGameStart) => patchFaction({ requiredCountAtGameStart })} /><NumField label={T("Max configurable at world creation")} value={f.maxConfigurableAtWorldCreation} onChange={(maxConfigurableAtWorldCreation) => patchFaction({ maxConfigurableAtWorldCreation })} /></div></div>;
}

function ItemsPanel({ project, T, addItem, deleteItem, patchItem, setAsset }: { project: Project; T: (s: string) => string; addItem: () => void; deleteItem: (id: string) => void; patchItem: (id: string, v: Partial<AddItem>) => void; setAsset: (key: string, asset: Asset) => void }) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const isExpanded = (id: string) => expandedItems[id] ?? true;
  const setAll = (expanded: boolean) => setExpandedItems(Object.fromEntries(project.items.map((item) => [item.id, expanded])));
  const toggle = (id: string) => setExpandedItems((current) => ({ ...current, [id]: !isExpanded(id) }));
  return <div className="card"><h2>{T("Add Item")}</h2><p className="hint">{T("Click header to expand or collapse this node.")}</p><div className="rowHeader"><button onClick={addItem}>{T("New item")}</button><span className="toolbarInline"><button type="button" onClick={() => setAll(true)}>{T("Expand all")}</button><button type="button" onClick={() => setAll(false)}>{T("Collapse all")}</button></span></div>{project.items.length === 0 && <p>{T("No items yet. Click New item to add one.")}</p>}{project.items.map((item) => {
    const open = isExpanded(item.id);
    return <div className="rowCard accordionCard" key={item.id}>
      <div className="accordionHeader" onClick={() => toggle(item.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(item.id); }}>
        <div><h3>{open ? "▾" : "▸"} {item.defName}</h3><p>{item.kind} · {item.weaponMode} · {item.label}</p></div>
        <button className="danger" type="button" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete item ${item.defName}?`)) deleteItem(item.id); }}>{T("Delete item")}</button>
      </div>
      {!open ? <p className="hint">{T("Collapsed item")}: <code>{item.defName}</code></p> : <div className="accordionBody">
        <label className="field"><span>{T("Item type")}</span><select value={item.kind} onChange={(e) => patchItem(item.id, { kind: e.target.value as ItemKind })}><option value="hair">Hair</option><option value="food">Food</option><option value="apparel">Apparel</option><option value="weapon">Weapon</option><option value="building">{T("Building")}</option><option value="generic">Generic</option></select></label>
        <Field label={T("Unique identifier defName")} value={item.defName} onChange={(defName) => patchItem(item.id, { defName: sanitizeDefName(defName) })} />
        <Field label={T("Label")} value={item.label} onChange={(label) => patchItem(item.id, { label })} />
        <Field label={T("Description")} value={item.description} onChange={(description) => patchItem(item.id, { description })} textarea />
        <h3>{T("Base item stats")}</h3>
        <NumField label={T("Market value")} value={itemNumber(item.marketValue, 100)} onChange={(marketValue) => patchItem(item.id, { marketValue })} />
        <NumField label={T("Mass")} value={itemNumber(item.mass, 1)} onChange={(mass) => patchItem(item.id, { mass })} step={0.1} />
        <NumField label={T("Flammability")} value={itemNumber(item.flammability, 0.5)} onChange={(flammability) => patchItem(item.id, { flammability })} step={0.05} />
        <NumField label={T("Deterioration rate")} value={itemNumber(item.deteriorationRate, 2)} onChange={(deteriorationRate) => patchItem(item.id, { deteriorationRate })} step={0.1} />
        <NumField label={T("Beauty")} value={itemNumber(item.beauty, -3)} onChange={(beauty) => patchItem(item.id, { beauty })} />
        {item.kind !== "weapon" && item.kind !== "building" && <NumField label={T("Stack limit")} value={itemNumber(item.stackLimit, 75)} onChange={(stackLimit) => patchItem(item.id, { stackLimit })} />}
        {item.kind === "building" && <>
          <h3>{T("Building settings")}</h3>
          <p className="hint">{T("Buildable items export as safe standalone ThingDef and appear in Architect tabs.")}</p>
          <NumField label={T("Size X")} value={itemNumber(item.buildingSizeX, 1)} onChange={(buildingSizeX) => patchItem(item.id, { buildingSizeX })} />
          <NumField label={T("Size Y")} value={itemNumber(item.buildingSizeY, 1)} onChange={(buildingSizeY) => patchItem(item.id, { buildingSizeY })} />
          <NumField label={T("Max hit points")} value={itemNumber(item.buildingMaxHitPoints, 100)} onChange={(buildingMaxHitPoints) => patchItem(item.id, { buildingMaxHitPoints })} />
          <NumField label={T("Fill percent")} value={itemNumber(item.buildingFillPercent, 0.4)} onChange={(buildingFillPercent) => patchItem(item.id, { buildingFillPercent })} step={0.05} />
          <label className="field"><span>{T("Passability")}</span><select value={item.buildingPassability || "PassThroughOnly"} onChange={(e) => patchItem(item.id, { buildingPassability: e.target.value as AddItem["buildingPassability"] })}><option>Standable</option><option>PassThroughOnly</option><option>Impassable</option></select></label>
          <Field label={T("Designation category")} value={item.buildingDesignationCategory || "Furniture"} onChange={(buildingDesignationCategory) => patchItem(item.id, { buildingDesignationCategory: sanitizeDefName(buildingDesignationCategory) })} />
          <NumField label={T("Work to build")} value={itemNumber(item.workToMake, 2000)} onChange={(workToMake) => patchItem(item.id, { workToMake })} />
          <NumField label={T("Steel cost")} value={itemNumber(item.steelCost, 50)} onChange={(steelCost) => patchItem(item.id, { steelCost })} />
          <NumField label={T("Component cost")} value={itemNumber(item.componentCost, 0)} onChange={(componentCost) => patchItem(item.id, { componentCost })} />
          <label className="check"><input type="checkbox" checked={Boolean(item.madeFromStuff)} onChange={(e) => patchItem(item.id, { madeFromStuff: e.target.checked })} /> {T("Made from stuff")}</label>
          {item.madeFromStuff && <>
            <Field label={T("Stuff categories, English comma only")} value={item.stuffCategoriesCsv || "Metallic"} onChange={(stuffCategoriesCsv) => patchItem(item.id, { stuffCategoriesCsv: normalizeCommaText(stuffCategoriesCsv) })} />
            <NumField label={T("Stuff cost count")} value={itemNumber(item.costStuffCount, 50)} onChange={(costStuffCount) => patchItem(item.id, { costStuffCount })} />
          </>}
        </>}
        {item.kind === "weapon" && <>
          <label className="field"><span>{T("Weapon mode")}</span><select value={item.weaponMode} onChange={(e) => {
            const weaponMode = e.target.value as WeaponMode;
            patchItem(item.id, {
              weaponMode,
              soundPreset: weaponMode === "beamLaser" ? "BeamSilent" : ((WEAPON_SOUND_PRESETS[item.soundPreset]?.beamOnly) ? "AssaultRifle" : item.soundPreset),
              damageDef: weaponMode === "beamLaser" ? (item.damageDef && item.damageDef !== "Bullet" ? item.damageDef : "Beam") : item.damageDef
            });
          }}><option value="rangedAuto">{T("Automatic ranged weapon")}</option><option value="rangedSingle">{T("Single-shot ranged weapon")}</option><option value="beamLaser">{T("Laser / beam weapon")}</option><option value="melee">{T("Melee weapon")}</option></select></label>
          <h3>{item.weaponMode === "melee" ? T("Melee settings") : item.weaponMode === "beamLaser" ? T("Beam settings") : T("Ranged settings")}</h3>
          <p className="hint">{T("This editor now writes an independent projectile for ranged weapons. The sound preset only changes soundCast/soundCastTail and never overwrites your weapon stats.")}</p>
          <NumField label={T("Damage")} value={itemNumber(item.damage, 10)} onChange={(damage) => patchItem(item.id, { damage })} />
          <NumField label={T("Cooldown")} value={itemNumber(item.cooldown, 1.5)} onChange={(cooldown) => patchItem(item.id, { cooldown })} step={0.1} />
          <NumField label={T("Melee armor penetration")} value={itemNumber(item.meleeArmorPenetration, 0.25)} onChange={(meleeArmorPenetration) => patchItem(item.id, { meleeArmorPenetration })} step={0.01} />
          <NumField label={T("Work to make")} value={itemNumber(item.workToMake, 2000)} onChange={(workToMake) => patchItem(item.id, { workToMake })} />
          <NumField label={T("Steel cost")} value={itemNumber(item.steelCost, 50)} onChange={(steelCost) => patchItem(item.id, { steelCost })} />
          <NumField label={T("Component cost")} value={itemNumber(item.componentCost, 0)} onChange={(componentCost) => patchItem(item.id, { componentCost })} />
          <h3>{T("Crafting / Tags")}</h3><p className="hint">{T("Chinese punctuation in comma fields will be converted to English commas before export.")}</p>
          <Field label={T("Recipe users, English comma only")} value={item.recipeUsersCsv || "FueledSmithy,ElectricSmithy"} onChange={(recipeUsersCsv) => patchItem(item.id, { recipeUsersCsv: normalizeCommaText(recipeUsersCsv) })} />
          <Field label={T("Weapon tags, English comma only")} value={item.weaponTagsCsv || ""} onChange={(weaponTagsCsv) => patchItem(item.id, { weaponTagsCsv: normalizeCommaText(weaponTagsCsv) })} />
          <Field label={T("Trade tags, English comma only")} value={item.tradeTagsCsv || ""} onChange={(tradeTagsCsv) => patchItem(item.id, { tradeTagsCsv: normalizeCommaText(tradeTagsCsv) })} />
          <Field label={T("Thing categories, English comma only")} value={item.thingCategoriesCsv || ""} onChange={(thingCategoriesCsv) => patchItem(item.id, { thingCategoriesCsv: normalizeCommaText(thingCategoriesCsv) })} />
          <label className="check"><input type="checkbox" checked={Boolean(item.madeFromStuff)} onChange={(e) => patchItem(item.id, { madeFromStuff: e.target.checked })} /> {T("Made from stuff")}</label>
          {item.madeFromStuff && <>
            <Field label={T("Stuff categories, English comma only")} value={item.stuffCategoriesCsv || "Metallic"} onChange={(stuffCategoriesCsv) => patchItem(item.id, { stuffCategoriesCsv: normalizeCommaText(stuffCategoriesCsv) })} />
            <NumField label={T("Stuff cost count")} value={itemNumber(item.costStuffCount, 50)} onChange={(costStuffCount) => patchItem(item.id, { costStuffCount })} />
          </>}
          {item.weaponMode !== "melee" && <>
            <label className="field"><span>{item.weaponMode === "beamLaser" ? T("Beam sound preset") : T("Vanilla sound preset")}</span><select value={item.soundPreset ?? (item.weaponMode === "beamLaser" ? "BeamSilent" : "AssaultRifle")} onChange={(e) => patchItem(item.id, { soundPreset: e.target.value as WeaponSoundPreset })}>{(Object.keys(WEAPON_SOUND_PRESETS) as WeaponSoundPreset[]).filter((key) => item.weaponMode === "beamLaser" ? Boolean(WEAPON_SOUND_PRESETS[key].beamOnly) : !WEAPON_SOUND_PRESETS[key].beamOnly).map((key) => <option key={key} value={key}>{WEAPON_SOUND_PRESETS[key].label}</option>)}</select></label>
            {item.weaponMode === "beamLaser" && <><p className="hint">{T("Beam sound note")}</p><Field label={T("Beam custom SoundDef optional")} value={item.customBeamSoundDef || ""} onChange={(customBeamSoundDef) => patchItem(item.id, { customBeamSoundDef })} /></>}
            <label className="field"><span>{T("Damage type damageDef")}</span><select value={item.damageDef || "Bullet"} onChange={(e) => {
              const damageDef = e.target.value;
              const currentPath = item.projectileGraphicPath || "Things/Projectile/Bullet_Small";
              const oldDefaultPath = defaultProjectileTextureForDamageDef(item.damageDef || "Bullet");
              const shouldUseNewDefaultPath = currentPath === "Things/Projectile/Bullet_Small" || currentPath === oldDefaultPath || currentPath === "Things/Projectile/Projectile_Explosive" || currentPath === "Things/Projectile/Projectile_EMP" || currentPath === "Things/Projectile/Projectile_Smoke";
              patchItem(item.id, {
                damageDef,
                projectileGraphicPath: shouldUseNewDefaultPath ? defaultProjectileTextureForDamageDef(damageDef) : currentPath,
                projectileExplosionRadius: itemNumber(item.projectileExplosionRadius, 0) > 0 ? item.projectileExplosionRadius : defaultExplosionRadiusForDamageDef(damageDef)
              });
            }}><option>Bullet</option><option>Beam</option><option>Burn</option><option>Flame</option><option>Bomb</option><option>Stun</option><option>EMP</option><option>Smoke</option></select></label>
            {item.weaponMode === "beamLaser" && <>
              <p className="hint">{T("Beam weapons use Verb_ShootBeam and Beam-style damage; projectile texture and projectile speed are ignored.")}</p>
              <NumField label={T("Beam width")} value={itemNumber(item.beamWidth, 1)} onChange={(beamWidth) => patchItem(item.id, { beamWidth })} step={0.1} />
              <NumField label={T("Beam full-width range")} value={itemNumber(item.beamFullWidthRange, Math.max(1, itemNumber(item.range, 28) * 0.65))} onChange={(beamFullWidthRange) => patchItem(item.id, { beamFullWidthRange })} step={0.1} />
              <label className="field"><span>{T("Beam visual preset")}</span><select value={item.beamVisualPreset || "anomalyIncinerator"} onChange={(e) => patchItem(item.id, { beamVisualPreset: e.target.value as BeamVisualPreset })}>
                <option value="anomalyIncinerator">{T("Anomaly incinerator beam visuals")}</option>
                <option value="safeNone">{T("Safe: no beam flecks")}</option>
                <option value="custom">{T("Custom beam visuals")}</option>
              </select></label>
              <p className="hint">{T("Beam visual note")}</p>
              {(item.beamVisualPreset || "anomalyIncinerator") === "custom" && <>
                <Field label={T("Beam ground FleckDef optional")} value={item.beamGroundFleckDef || ""} onChange={(beamGroundFleckDef) => patchItem(item.id, { beamGroundFleckDef })} />
                <Field label={T("Beam line FleckDef optional")} value={item.beamLineFleckDef || ""} onChange={(beamLineFleckDef) => patchItem(item.id, { beamLineFleckDef })} />
                <Field label={T("Beam end EffecterDef optional")} value={item.beamEndEffecterDef || ""} onChange={(beamEndEffecterDef) => patchItem(item.id, { beamEndEffecterDef })} />
              </>}
            </>}
            {item.weaponMode !== "beamLaser" && <>
            <Field label={T("Projectile texture path")} value={item.projectileGraphicPath || "Things/Projectile/Bullet_Small"} onChange={(projectileGraphicPath) => patchItem(item.id, { projectileGraphicPath })} />
            <PngDrop language={project.language} label={`${item.label} projectile optional`} asset={project.assets[`item.${item.id}.projectile`]} onAsset={(asset) => { setAsset(`item.${item.id}.projectile`, asset); patchItem(item.id, { projectileGraphicPath: `${project.mod.packageId}/Items/projectiles/${item.defName}_Projectile` }); }} />
            <NumField label={T("Range")} value={itemNumber(item.range, 28)} onChange={(range) => patchItem(item.id, { range })} />
            <NumField label={T("Warmup time")} value={itemNumber(item.warmupTime, 1.2)} onChange={(warmupTime) => patchItem(item.id, { warmupTime })} step={0.1} />
            <NumField label={T("Ranged armor penetration")} value={itemNumber(item.armorPenetration, 0.16)} onChange={(armorPenetration) => patchItem(item.id, { armorPenetration })} step={0.01} />
            <NumField label={T("Projectile speed")} value={itemNumber(item.projectileSpeed, 70)} onChange={(projectileSpeed) => patchItem(item.id, { projectileSpeed })} />
            <NumField label={T("Stopping power")} value={itemNumber(item.projectileStoppingPower, 0.5)} onChange={(projectileStoppingPower) => patchItem(item.id, { projectileStoppingPower })} step={0.1} />
            <NumField label={T("Explosion radius") } value={itemNumber(item.projectileExplosionRadius, 0)} onChange={(projectileExplosionRadius) => patchItem(item.id, { projectileExplosionRadius })} step={0.1} />
            <NumField label={T("Fire chance") } value={itemNumber(item.projectileChanceToStartFire, 0)} onChange={(projectileChanceToStartFire) => patchItem(item.id, { projectileChanceToStartFire })} step={0.01} />
            <p className="hint">{T("Fire chance is currently UI-only for XML safety; use Flame damageDef with Explosion radius for fire-style explosions.")}</p>
            </>}
            <NumField label={T("Accuracy touch")} value={itemNumber(item.accuracyTouch, 0.6)} onChange={(accuracyTouch) => patchItem(item.id, { accuracyTouch })} step={0.01} />
            <NumField label={T("Accuracy short")} value={itemNumber(item.accuracyShort, 0.8)} onChange={(accuracyShort) => patchItem(item.id, { accuracyShort })} step={0.01} />
            <NumField label={T("Accuracy medium")} value={itemNumber(item.accuracyMedium, 0.65)} onChange={(accuracyMedium) => patchItem(item.id, { accuracyMedium })} step={0.01} />
            <NumField label={T("Accuracy long")} value={itemNumber(item.accuracyLong, 0.45)} onChange={(accuracyLong) => patchItem(item.id, { accuracyLong })} step={0.01} />
            {(item.weaponMode === "rangedAuto" || item.weaponMode === "beamLaser") && <>
              <NumField label={T("Burst shots")} value={itemNumber(item.burstShotCount, 6)} onChange={(burstShotCount) => patchItem(item.id, { burstShotCount })} />
              <NumField label={T("Ticks between burst shots")} value={itemNumber(item.ticksBetweenBurstShots, 8)} onChange={(ticksBetweenBurstShots) => patchItem(item.id, { ticksBetweenBurstShots })} />
            </>}
          </>}
        </>}
        <Field label={T("Research prerequisite")} value={item.researchPrerequisite} onChange={(researchPrerequisite) => patchItem(item.id, { researchPrerequisite })} />
        {(item.kind === "hair" || item.kind === "apparel") ? (["front", "side", "back"] as Direction[]).map((d) => <PngDrop key={d} language={project.language} label={`${item.label} ${d}`} asset={project.assets[`item.${item.id}.${d}`]} onAsset={(asset) => setAsset(`item.${item.id}.${d}`, asset)} />) : <PngDrop language={project.language} label={`${item.label} single`} asset={project.assets[`item.${item.id}.single`]} onAsset={(asset) => setAsset(`item.${item.id}.single`, asset)} />}
      </div>}
    </div>;
  })}</div>;
}

function ResearchPanel({ project, T, addResearch, patchResearch, deleteResearch }: { project: Project; T: (s: string) => string; addResearch: () => void; patchResearch: (id: string, v: Partial<ResearchProject>) => void; deleteResearch: (id: string) => void }) {
  const [expandedResearch, setExpandedResearch] = useState<Record<string, boolean>>({});
  const isExpanded = (id: string) => expandedResearch[id] ?? true;
  const setAll = (expanded: boolean) => setExpandedResearch(Object.fromEntries(project.research.map((r) => [r.id, expanded])));
  const toggle = (id: string) => setExpandedResearch((current) => ({ ...current, [id]: !isExpanded(id) }));
  return <div className="card"><h2>{T("Tech Tree")}</h2><p>{T("Tech tree support creates ResearchProjectDef and can link items through researchPrerequisite.")}</p><p className="hint">{T("Chinese punctuation in comma fields will be converted to English commas before export.")}</p><div className="rowHeader"><button onClick={addResearch}>{T("New research")}</button><span className="toolbarInline"><button type="button" onClick={() => setAll(true)}>{T("Expand all")}</button><button type="button" onClick={() => setAll(false)}>{T("Collapse all")}</button></span></div>{project.research.length === 0 && <p>{T("No research projects yet. Click New research to add one.")}</p>}{project.research.map((r) => {
    const open = isExpanded(r.id);
    const ownership = researchOwnership(r);
    return <div className="rowCard accordionCard" key={r.id}>
      <div className="accordionHeader" onClick={() => toggle(r.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(r.id); }}>
        <div><h3>{open ? "▾" : "▸"} {r.defName}</h3><p>{ownership === "independent" ? T("Create independent tech tree") : T("Merge into vanilla tech tree")} · {r.techLevel} · {r.baseCost}</p></div>
        <button className="danger" type="button" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete research ${r.defName}?`)) deleteResearch(r.id); }}>{T("Delete research")}</button>
      </div>
      {!open ? <p className="hint">{T("Collapsed research")}: <code>{r.defName}</code></p> : <div className="accordionBody">
        <Field label={T("Unique identifier defName")} value={r.defName} onChange={(defName) => patchResearch(r.id, { defName: sanitizeDefName(defName) })} />
        <Field label={T("Label")} value={r.label} onChange={(label) => patchResearch(r.id, { label })} />
        <Field label={T("Description")} value={r.description} onChange={(description) => patchResearch(r.id, { description })} />
        <label className="field"><span>{T("Tech tree ownership")}</span><select value={ownership} onChange={(e) => patchResearch(r.id, { techTreeOwnership: e.target.value as ResearchTreeOwnership })}><option value="vanilla">{T("Merge into vanilla tech tree")}</option><option value="independent">{T("Create independent tech tree")}</option></select></label>
        <p className="hint">{ownership === "independent" ? T("Independent tree note") : T("Vanilla merge note")}</p>
        {ownership === "independent" && <Field label={T("ResearchTabDef for independent tree")} value={r.researchTabDefName || projectDefaultResearchTab(project)} onChange={(researchTabDefName) => patchResearch(r.id, { researchTabDefName: sanitizeDefName(researchTabDefName) })} />}
        <NumField label={T("Base cost")} value={r.baseCost} onChange={(baseCost) => patchResearch(r.id, { baseCost })} />
        <label className="field"><span>{T("Tech level")}</span><select value={r.techLevel} onChange={(e) => patchResearch(r.id, { techLevel: e.target.value as TechLevel })}><option>Neolithic</option><option>Medieval</option><option>Industrial</option><option>Spacer</option><option>Ultra</option></select></label>
        <NumField label={T("Research view X")} value={itemNumber(r.researchViewX, 1)} onChange={(researchViewX) => patchResearch(r.id, { researchViewX })} step={0.5} />
        <NumField label={T("Research view Y")} value={itemNumber(r.researchViewY, 1)} onChange={(researchViewY) => patchResearch(r.id, { researchViewY })} step={0.5} />
        <Field label={T("Prerequisites, English comma only")} value={r.prerequisitesCsv ?? csvArrayList(r.prerequisites).join(",")} onChange={(v) => patchResearch(r.id, { prerequisitesCsv: normalizeCommaText(v), prerequisites: csvList(v) })} />
      </div>}
    </div>;
  })}</div>;
}

function StoryPanel({ project, T, patchStoryteller, setAsset }: { project: Project; T: (s: string) => string; patchStoryteller: (v: Partial<StorytellerConfig>) => void; setAsset: (key: string, asset: Asset) => void }) {
  const s = project.storyteller;
  return <div className="grid"><div className="card"><h2>{T("Storyteller")}</h2><label className="check"><input type="checkbox" checked={s.enabled} onChange={(e) => patchStoryteller({ enabled: e.target.checked })} /> {T("Enable custom StorytellerDef")}</label><Field label={T("Unique identifier defName")} value={s.defName} onChange={(defName) => patchStoryteller({ defName: sanitizeDefName(defName) })} /><Field label={T("Label")} value={s.label} onChange={(label) => patchStoryteller({ label })} /><Field label={T("Description")} value={s.description} onChange={(description) => patchStoryteller({ description })} textarea /><label className="field"><span>baseProfile</span><select value={s.baseProfile} onChange={(e) => patchStoryteller({ baseProfile: e.target.value as any })}><option>Cassandra</option><option>Phoebe</option><option>Randy</option></select></label><NumField label="listOrder" value={s.listOrder} onChange={(listOrder) => patchStoryteller({ listOrder })} /></div><div className="card"><PngDrop language={project.language} label="portraitLarge" asset={project.assets["storyteller.large"]} onAsset={(a) => setAsset("storyteller.large", a)} /><PngDrop language={project.language} label="portraitTiny" asset={project.assets["storyteller.tiny"]} onAsset={(a) => setAsset("storyteller.tiny", a)} /></div></div>;
}

function ScenarioPanel({ project, T, patchScenario }: { project: Project; T: (s: string) => string; patchScenario: (v: Partial<ScenarioConfig>) => void }) {
  const s = project.scenario;
  return <div className="grid"><div className="card"><h2>{T("Scenario")}</h2>
    <label className="check"><input type="checkbox" checked={s.enabled} onChange={(e) => patchScenario({ enabled: e.target.checked })} /> {T("Enable custom ScenarioDef")}</label>
    <Field label={T("Unique identifier defName")} value={s.defName} onChange={(defName) => patchScenario({ defName: sanitizeDefName(defName) })} />
    <Field label={T("Label")} value={s.label} onChange={(label) => patchScenario({ label })} />
    <Field label="summary" value={s.summary} onChange={(summary) => patchScenario({ summary })} />
    <Field label={T("Description")} value={s.description} onChange={(description) => patchScenario({ description })} textarea />
    <label className="field"><span>{T("Player faction")}</span><select value={s.playerFactionDef || "PlayerColony"} onChange={(e) => patchScenario({ playerFactionDef: e.target.value as PlayerFactionDef })}>
      <option value="PlayerColony">{T("New arrivals / Colony")} (PlayerColony)</option>
      <option value="PlayerTribe">{T("New tribe / Tribal")} (PlayerTribe)</option>
    </select></label>
    <label className="check"><input type="checkbox" checked={s.forceCustomRaceStartingPawns ?? true} onChange={(e) => patchScenario({ forceCustomRaceStartingPawns: e.target.checked })} /> {T("Force starting pawns to use custom race")}</label>
    {project.race.enabled && (s.forceCustomRaceStartingPawns ?? true) && <label className="field"><span>{T("Starting pawn race mode")}</span><select value={s.startingPawnRaceMode || "stableSelectedOnly"} onChange={(e) => patchScenario({ startingPawnRaceMode: e.target.value as StartingPawnRaceMode })}>
      <option value="stableSelectedOnly">{T("Stable custom race start")}</option>
      <option value="experimentalCandidatePool">{T("Experimental candidate pool")}</option>
    </select></label>}
    <p className="hint">{T("When Custom Race is enabled, this uses Biotech's ConfigurePawnsXenotypes scenPart to generate starting pawns from the custom PawnKind instead of vanilla Human pawns.")}</p>
    <p className="hint"><b>{T("Custom race candidate pool")}:</b> {s.startingPawnRaceMode === "experimentalCandidatePool" ? T("Experimental candidate pool note") : T("Custom race start note")}</p>
  </div><div className="card">
    <NumField label="startingPawnCount" value={s.startingPawnCount} onChange={(startingPawnCount) => patchScenario({ startingPawnCount })} />
    <NumField label="chooseFromPawnCount" value={s.chooseFromPawnCount} onChange={(chooseFromPawnCount) => patchScenario({ chooseFromPawnCount })} />
    {project.race.enabled && (s.forceCustomRaceStartingPawns ?? true) && <p className="hint">{T("Custom race candidate pool")}: {s.startingPawnRaceMode === "experimentalCandidatePool" ? T("Experimental candidate pool note") : T("Custom race start note")}</p>}
    <NumField label="startWithSilver" value={s.startWithSilver} onChange={(startWithSilver) => patchScenario({ startWithSilver })} />
    <NumField label="startWithPackagedMeals" value={s.startWithPackagedMeals} onChange={(startWithPackagedMeals) => patchScenario({ startWithPackagedMeals })} />
    <NumField label="startWithMedicine" value={s.startWithMedicine} onChange={(startWithMedicine) => patchScenario({ startWithMedicine })} />
    <NumField label="startWithComponents" value={s.startWithComponents} onChange={(startWithComponents) => patchScenario({ startWithComponents })} />
    <NumField label="startWithSteel" value={s.startWithSteel} onChange={(startWithSteel) => patchScenario({ startWithSteel })} />
  </div></div>;
}

function AssetsPanel({ project, T }: { project: Project; T: (s: string) => string }) {
  return <div className="card"><h2>{T("Assets")}</h2>{Object.entries(project.assets).length === 0 ? <p>No assets uploaded.</p> : Object.entries(project.assets).map(([key, asset]) => <div className="asset" key={key}><code>{key}</code><span>{asset.fileName}</span></div>)}</div>;
}

function ExportPanel({ project, T, validation, exportZip }: { project: Project; T: (s: string) => string; validation: string[]; exportZip: () => void }) {
  return <div className="grid"><div className="card"><h2>{T("Validation")}</h2>{validation.length ? <ul className="errors">{validation.map((e) => <li key={e}>{e}</li>)}</ul> : <p>{T("No blocking errors")}</p>}<button className="primary" onClick={exportZip}>{T("Export Mod ZIP")}</button><p>{T("Save status")}: {T("Autosaved locally")}</p><button onClick={() => { if (confirm("Clear local project?")) { localStorage.removeItem(STORAGE_KEY); location.reload(); } }}>{T("Clear local project")}</button></div><div className="card"><h2>Output notes</h2><pre>{`Playable Mod ZIP contains only:
About/About.xml
Defs/...
Textures/...

Editor folder receives:
logs/*_modmaker_log.txt
source/*_ModMakerProject.json`}</pre><p>Log and source project files are not packaged into the playable Mod ZIP. They are written beside the editor instead: <code>logs/</code> and <code>source/</code>.</p></div></div>;
}

export default App;
