# RVM - RimWorld Visual Mod Maker

English README | [中文说明](README.zh-CN.md)

(I'm just a student, and this is my first time writing a project like this. If you find the readme file too long or unclear, please let the AI ​​explain how it works step by step.)

RVM (RimWorld Visual Mod Maker) is a visual RimWorld mod-making tool for users who are not familiar with programming. Its goal is to let users create RimWorld mods through a UI instead of writing code or XML by hand. You fill in names and values, upload textures, and export a playable mod.

> **Disclaimer**  
> Any installation, download, or use of this project is at your own risk. The author has personally tested the workflow, but does not provide any guarantee and is not responsible for any consequences.

## Project Link

GitHub: <https://github.com/banMo88/RVM-Rimworld-Visual-Mod-Maker>

## Table of Contents

- [Requirements](#requirements)
- [Install Node.js](#install-nodejs)
- [Install Project Dependencies](#install-project-dependencies)
- [Run the Project](#run-the-project)
- [Basic Workflow](#basic-workflow)
- [UI Language and Naming Notes](#ui-language-and-naming-notes)
- [Mod Basic Information](#mod-basic-information)
- [Dependencies](#dependencies)
- [Main Features](#main-features)
- [Exporting and Saving](#exporting-and-saving)
- [Testing Mods](#testing-mods)
- [Recommended Learning Order for Beginners](#recommended-learning-order-for-beginners)
- [Important Reminders](#important-reminders)
- [Known Defects / Bugs](#known-defects--bugs)

## Requirements

- Windows
- Node.js
- npm
- Chrome is recommended for opening the local web app
- RimWorld
- Depending on the mod content, you may also need related DLCs or required mods, such as:
  - Humanoid Alien Races
  - Biotech
  - Ideology
  - Anomaly
  - Odyssey

## Install Node.js

1. Download Node.js from the official website:
   - Official download page: <https://nodejs.org/en/download>
   - Mainland China users may also use: <https://nodejs.org/zh-cn/download/>
2. Double-click the installer after downloading it.
3. During installation, you can usually keep clicking `Next`, then click `Install`.
4. If you see an option like `Add to PATH`, keep it checked.
5. After installation, press `Win + R`, type `cmd`, and press Enter to open the terminal.
6. In the terminal, run:

```bash
node -v
```

If a version number is displayed, Node.js has been installed successfully.

## Install Project Dependencies

1. Download the project ZIP from GitHub.
2. Extract it to a folder.
3. Open a terminal in the project folder, or use `cd` to enter the project directory:

```bash
cd your-project-folder-path
```

The project folder usually looks like this:

```text
project/
  src/
  index.html
  package.json
  tsconfig.json
  vite.config.js
```

If you can access the official npm registry, run:

```bash
npm install --registry=https://registry.npmjs.org/ --no-audit --no-fund --ignore-scripts --verbose
```

For mainland China network environments, you can try the npm mirror:

```bash
npm install --registry=https://registry.npmmirror.com/ --no-audit --no-fund --ignore-scripts --verbose
```

After installation, the project folder should contain a `node_modules/` folder. If the command finishes without errors, the dependencies are usually installed successfully.

## Run the Project

Open a terminal in the project folder and run:

```bash
npm run web
```

If the browser does not open automatically, copy the local URL shown in the terminal and paste it into your browser. Chrome is recommended.

The local URL often looks like this:

```text
http://127.0.0.1:5173/
```

## Basic Workflow

A typical workflow is:

1. Fill in the basic mod information.
2. Choose what you want to create, such as a race, item, research project, scenario, storyteller, and so on.
3. Upload textures.
4. Check the export page for errors.
5. Export the mod.
6. Put the exported mod into RimWorld's `Mods` folder.
7. Start the game and test it.

If this is your first mod, start with a simple item or a simple race. Do not enable every feature at the beginning.

## UI Language and Naming Notes

The top-right corner lets you switch the interface language:

- Chinese
- English

Even when the interface is in Chinese, some RimWorld internal fields must still be written in English, for example:

- `defName`
- `packageId`
- `ThingDef`
- `ScenarioDef`
- `StorytellerDef`
- `FactionDef`
- `GeneDef`

These are internal RimWorld identifiers and must not be translated into Chinese.

## Mod Basic Information

Every mod needs basic information.

### Mod Name

This is the name displayed in the in-game mod list.

Example:

```text
My First Mod
```

### Package ID

`packageId` is the unique ID RimWorld uses to determine whether two mods are the same mod.

Recommended format:

```text
authorName.modName.featureName
```

Example:

```text
authorName.myfirstmod
```

Every mod must have a unique `packageId`. If two mods use the same `packageId`, RimWorld may treat them as duplicate mods and hide one of them.

### Author, Description, and Supported Versions

These fields are written to:

```text
About/About.xml
```

They are displayed in RimWorld's mod list.

Recommended supported version:

```text
1.6
```

## Dependencies

If your mod requires other mods or DLCs, add them as dependencies.

Custom races usually require:

```text
Humanoid Alien Races
```

If you use DLC content, make sure the corresponding DLC is enabled, for example:

- Biotech
- Ideology
- Anomaly
- Odyssey

Beginners can avoid manually changing dependencies at first. When you enable Custom Race, the editor automatically handles HAR-related dependencies.

## Main Features

### Custom Race

This feature creates a new playable race.

Custom races require `Humanoid Alien Races`.

Enable this option:

```text
Enable Custom Race / HAR RaceDef
```

Do not enable it if you are not making a race.

Common fields:

| Field | Description |
| --- | --- |
| `defName` | Internal race name; English only |
| `label` | In-game display name |
| `description` | Race description |
| `health scale` | Health multiplier |
| `move speed` | Movement speed |
| `melee damage` | Melee damage |

Example:

```text
defName: Stonekin
label: stonekin
description: A stone-skinned humanoid race.
```

#### Texture Modes

Custom races require body and head textures.

Supported modes:

- `Shared one set`: one shared texture set for both male and female pawns.
- `Male / Female`: separate textures for male and female pawns.
- `Body type`: textures by body type, such as Thin, Fat, Hulk, and so on.

Each body or head set usually needs three images:

- Front
- Side
- Back

The editor automatically handles the direction files required by RimWorld.

#### Preserve Original Texture Colors

`Preserve original texture colors` tries to prevent the game from randomly tinting your body textures based on skin color, keeping them closer to the original uploaded PNG colors.

Leave it unchecked if you want the game to generate different skin tones automatically.

### Genes / GeneDef

If Biotech is installed, you can add genes to custom races.

There are two ways to add genes:

1. Select common genes from the list.
2. Manually enter `GeneDef` values.

Examples:

```text
MeleeDamage_Strong
MoveSpeed_Quick
Robust
```

`GeneDef` values must actually exist. If they are misspelled, the game will report errors.

### Factions

Factions let your race appear as a force on the world map.

Examples:

```text
Stonekin Enclave
Machine Clan
Foxkin Tribe
```

Common fields:

| Field | Description |
| --- | --- |
| `Faction defName` | Internal faction name |
| `label` | Display name |
| `description` | Description |
| `techLevel` | Tech level |
| `leaderTitle` | Leader title |
| `requiredCountAtGameStart` | Required number at game start |
| `maxConfigurableAtWorldCreation` | Maximum number configurable during world creation |

If you only want to make a player-usable race, you do not necessarily need to enable factions.

### Adding Items

Click:

```text
New item
```

Then select the item type.

Currently supported types:

- Generic
- Food
- Hair
- Apparel
- Weapon
- Building

Each item card can be expanded or collapsed, making it easier to manage many items.

### Weapons

Supported weapon types:

- Melee weapon
- Single-shot ranged weapon
- Automatic ranged weapon
- Laser / beam weapon

#### Melee Weapons

Main settings:

- `damage`: damage
- `cooldown`: attack interval
- `melee armor penetration`: melee armor penetration
- `market value`: value
- `mass`: weight
- `work to make`: crafting work
- `cost`: material cost

Melee weapons do not show ranged parameters such as range, projectile speed, or explosion radius.

#### Standard Ranged Weapons

Available settings:

- `damage`: damage
- `range`: range
- `warmup time`: aiming time
- `cooldown`: cooldown
- `burst shots`: number of burst shots
- `ticks between burst shots`: interval between burst shots
- `ranged armor penetration`: ranged armor penetration
- `projectile speed`: projectile speed
- `accuracy`: accuracy at different distances
- `sound preset`: vanilla sound preset

Ranged weapons automatically generate their own projectiles instead of directly reusing vanilla assault rifle damage.

#### Explosive Projectiles

For explosive weapons:

```text
damageDef = Bomb
explosionRadius = 6
```

Requirements:

- Set `Damage type damageDef` to `Bomb`.
- Set `Explosion radius` to a value greater than 0.

#### Laser / Beam Weapons

Laser weapons are based on logic similar to the vanilla Beam Repeater.

Available settings:

- `beam width`: beam width
- `beam full-width range`: distance at which the beam keeps full width
- `beam visual preset`: beam visual effect
- `beam sound preset`: beam sound
- `damageDef`: damage type, usually `Beam`

If the beam is not clearly visible, try different Beam visual presets.

### Buildings

Version 38 and later support buildable objects.

Select item type:

```text
Building
```

You can make:

- Furniture
- Decorations
- Simple facilities
- Static buildings
- Common buildable decorative objects

Common settings:

| Field | Description |
| --- | --- |
| `Size X / Size Y` | Occupied size |
| `Max hit points` | Durability |
| `Fill percent` | Fill amount |
| `Passability` | Whether it can be passed through |
| `Designation category` | Which architect menu category it appears in |
| `Work to build` | Construction work |
| `Steel cost` | Steel cost |
| `Component cost` | Component cost |
| `Made from stuff` | Whether the stuff system is used |
| `Research prerequisite` | Required research |

Recommended testing settings:

```text
designationCategory = Furniture
researchPrerequisite empty
madeFromStuff disabled
```

This makes the building easier to find in the in-game building menu.

### Research Tree

The research tree feature adds new research projects.

Available fields:

- `Research defName`
- `label`
- `description`
- `baseCost`
- `techLevel`
- `prerequisites`
- `research view X`
- `research view Y`

Research ownership supports:

- Merge into the vanilla research tree
- Create a new independent research tree

If you select Merge into the vanilla research tree, the research project will appear in the main research tree.  
If you select Create a new independent research tree, the editor generates a new `ResearchTab` so your research appears in a separate tab.

Separate multiple prerequisites with English commas:

```text
Microelectronics,Smithing
```

Do not use Chinese commas:

```text
Microelectronics，Smithing
```

### Storyteller

This feature adds a new AI Storyteller instead of overwriting vanilla Cassandra, Phoebe, or Randy.

Available settings:

- `defName`
- `label`
- `description`
- `baseProfile`
- `portraitLarge`
- `portraitTiny`
- `population targets`
- `event rhythm`

Simple `baseProfile` guide:

- Cassandra: classic pacing
- Phoebe: calmer pacing
- Randy: highly random

If you are not familiar with these parameters, start with the Cassandra template.

Portrait uploads:

- `portraitLarge`: large portrait
- `portraitTiny`: small portrait

If the portrait image is too large, compress it as a PNG first; otherwise, the browser may slow down.

### Scenario

Scenarios define the player's starting conditions.

Available settings:

- `startingPawnCount`: number of selected starting pawns
- `chooseFromPawnCount`: number of candidate pawns
- `startWithSilver`: starting silver
- `startWithPackagedMeals`: packaged survival meals
- `startWithMedicine`: medicine
- `startWithComponents`: components
- `startWithSteel`: steel
- `player faction`: starting player faction

Player faction options:

- `New arrivals / PlayerColony`
- `New tribe / PlayerTribe`

If custom race is enabled, you can check:

```text
Force starting pawns to use custom race
```

In v50, this feature provides two modes:

- Stable custom race start
- Experimental candidate pool

Recommended for normal users:

```text
Stable custom race start
```

It is more stable, but the candidate pool may still be limited by RimWorld / HAR mechanics.

### Asset Management

The asset page lets you review uploaded PNG files.

You can check:

- Which textures have been uploaded
- Which textures are missing
- Whether texture paths are correct

Use:

```text
.png
```

Avoid:

```text
.jpg
.webp
.bmp
```

## Exporting and Saving

### Export Mod

The export page generates a mod ZIP that can be placed into RimWorld.

Playable exported mods usually contain only:

```text
About/
Defs/
Textures/
```

Starting with v41:

- `log`
- `source project json`

are no longer placed inside the mod archive. They are saved in the editor folder instead, for example:

```text
rimworld-visual-mod-maker-v50/logs/
rimworld-visual-mod-maker-v50/source/
```

This keeps the in-game mod package cleaner.

### Save and Continue Editing

The editor automatically saves part of the project state. For safety, export manually often:

```text
Export project JSON
```

Next time, continue editing with:

```text
Import project JSON
```

If you are making a long-term mod, do not rely only on browser cache.

## Testing Mods

### Test Generic Items / Weapons

After entering the game, enable developer mode:

```text
Options -> Development mode
```

Then use:

```text
Spawn thing
```

Search for your item's `defName`.

### Test Buildings

Open the architect menu:

```text
Architect -> Furniture / Production / Misc / Structure
```

Find the building's display name. If you cannot find it, search its `defName` in developer mode.

### Test Races

If you use a custom race, load order must be correct:

```text
Harmony
Core / DLC
Humanoid Alien Races
Your Mod
```

You can use developer mode:

```text
Spawn pawn
```

Search for your `PawnKindDef`.

### Test Scenarios

When starting a new game, select your custom `Scenario`.

If forced custom race is enabled, check whether the starting pawn textures are correct.

## Recommended Learning Order for Beginners

For first-time users, learn in this order:

1. Make a generic item.
2. Make a weapon.
3. Make a buildable object.
4. Make a research project.
5. Make a scenario.
6. Make a storyteller.
7. Finally, try custom races and factions.

Do not enable all features the first time. If the game reports an error, this makes it easier to identify which part caused the problem.

## Important Reminders

1. Use only English letters, numbers, and underscores in `defName` whenever possible.
2. Every mod must have a unique `packageId`.
3. Separate multiple items with English commas.
4. Before testing a new version, delete the old exported mod folder.
5. Custom races require `Humanoid Alien Races`.
6. Biotech genes or Xenotype require the Biotech DLC.
7. Anomaly / Odyssey effects or weapon logic require the corresponding DLC to be enabled.
8. When red errors appear, first check whether the log contains your `packageId`, `defName`, or mod name.

## Known Defects / Bugs

1. Event editing is not currently supported.
2. Editing animals, plants, mechanoids, and anomaly creatures is not currently supported.
3. In the new scenario character selection screen, only the initially selected pawn is the custom race; candidates are ordinary humans, and clicking Random may revert the pawn race back to ordinary human.
4. Animated race expressions are not currently supported.
5. Even when Preserve original texture colors is checked, skin color may still be randomly changed after entering the game.
6. Culture and ideology editing is not currently supported.
7. Importing existing mods not created by this maker is not currently supported.
8. Starting pawns still inherit hair, tattoos, names, beards, and other details from ordinary humans, and these cannot currently be modified.
