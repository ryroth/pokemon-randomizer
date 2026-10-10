# Handoff — Pokémon Randomizer

Use this file at the start of a new chat **before changing code**.

Then read, in order:

1. `AGENTS.md` — persistent implementation rules
2. `ARCHITECTURE.md` — system design
3. `PROJECT_SPEC.md` — product requirements
4. `DATA_MODEL.md` — catalogs and classification
5. `ROADMAP.md` — phases
6. `TEST_PLAN.md` — testing bar

Do not rebuild the app from scratch. Do not re-run Phase 0 discovery unless architecture is actually wrong. Inspect existing `lib/`, `app/`, `scripts/import/`, and `data/generated/` first, then implement only the requested phase.

---

## Current status

| Item | Value |
| --- | --- |
| Phase complete on `master` | **Phase 8 — Polish**, then the **Battle Laboratory overhaul** (design Phases 1–5, Round 2, and the follow-ups below), merged in one PR |
| Current work | None. Later features only if the user asks |
| Next phase | Later features only if the user asks (learnset-only pools, competitive pools, a six-Pokémon randomizer, accounts) |
| Current branch locally | `master` |
| Latest on `master` | See `git log`. The Battle Laboratory PR is the newest merge (PR number in the table below) |
| Remote | https://github.com/ryroth/pokemon-randomizer |
| Merged PRs | [#1](https://github.com/ryroth/pokemon-randomizer/pull/1) Phase 1, [#2](https://github.com/ryroth/pokemon-randomizer/pull/2) Phase 2, [#3](https://github.com/ryroth/pokemon-randomizer/pull/3) Phase 3, [#4](https://github.com/ryroth/pokemon-randomizer/pull/4) Phase 4/5, [#5](https://github.com/ryroth/pokemon-randomizer/pull/5) Phase 6, [#6](https://github.com/ryroth/pokemon-randomizer/pull/6) Phase 7, [#7](https://github.com/ryroth/pokemon-randomizer/pull/7) Phase 8, PR_BATTLE_LAB Battle Laboratory overhaul |
| Rename `master` → `main` | Still pending |

Phases 1–8 and the Battle Laboratory overhaul are on `master`. Do **not** rebuild them. Do **not** start learnset-only pools, competitive pools, accounts, or a six-Pokémon randomizer unless the user asks.

Start the next feature from up-to-date `master` on a new branch.

Quality gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Last full run on the overhaul branch: tsc clean, ESLint 0 errors, Vitest 405, Playwright 74, build passes. Playwright covers the randomizer, builder-through-teams, dock, Showdown, accessibility, and Round 2 flows (`npx playwright install` may still be needed). Catalog version **2.4.0**. Do not hand-edit `catalog.json`, `genera.json`, or `pokemon-model-index.json`. Learnsets and Hidden Abilities are separate generated files.

---

## First action for the next agent

1. Read this file and `AGENTS.md`. Stay on `master` until a new branch is asked for. Do **not** recreate or rebuild Phases 1–8 or the Battle Laboratory overhaul.
2. Phase 8 and the overhaul are merged. Do not start learnset-only pools, competitive pools, accounts, or a six-Pokémon randomizer unless asked.
3. Saved teams are in scope. Accounts, share URLs, a database, and a six-Pokémon randomizer are not.

Do not commit unless asked. Do not push unless asked.

---

## Product (V1)

Consumer web app: randomize **one** Pokémon, build a Showdown-compatible set by hand, copy that set, and save it onto a team of up to 6 that can be copied as a whole.

Flow: Configure → generate unique Pokémon → select one → optional evolve → optional ability / move / item randomizers → Build → Validate → Recap → Copy to Showdown and/or save to a team → Next Randomizer for another Pokémon.

Custom order can put Ability, Move, or Item **before** Pokémon. Then generate that extra pool first, apply extras to generated Pokémon (user choice, unique), then select. Ability-before requires an applied ability. Move-before uses a chosen 1–4 moves per Pokémon (default 4); empty slots are filled later in the Builder. Item-before requires one applied item, including None.

- Pokémon: always randomized
- Abilities / moves / items: independently optional
- EVs, Nature, Tera type, and gender (if mixed) are not auto-assigned. Shiny starts at No (`applyBuilderDefaults`) unless the Pokémon rolled shiny (see Shiny rolls below), in which case it starts at Yes. Applying the guessed spread is the exception: it fills those EVs and that Nature. Level starts at 50 (`DEFAULT_LEVEL`) and can be changed. IVs default to 31. Happiness defaults to 255 (0–255). Nickname is optional.
- A new Pokémon roll, a different selected Pokémon, or an evolution clears EVs, Nature, Tera type, gender, shiny, and nickname (`freshTraining` in `lib/randomizer/session.ts`), so the next build starts at the defaults. IVs stay at 31.

Out of scope until explicitly requested: accounts, share URLs, public seeds, learnset-only or competitive-only pools, and a database. A six-Pokémon **randomizer** is still out of scope. Saving finished builds onto local teams is implemented.

---

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS v4, shadcn/ui (`base-nova`), Lucide
- Vitest (unit), Playwright (e2e)
- `@pkmn/dex` is a **devDependency** used only by the importer — never import it from `app/` or client components
- No database
- No live PokéAPI calls from the browser

Commands (PowerShell: use `;`, not `&&`):

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run import:data              # PokéAPI + Showdown snapshot → data/generated/catalog.json
npm run import:learnsets         # data/generated/learnsets.json
npm run import:hidden-abilities  # data/generated/hidden-abilities.json
npm run import:models            # Pokemon-3D-api GLB index → data/generated/pokemon-model-index.json
npm run import:genera            # PokéAPI English genus → data/generated/genera.json
npm run import:dex-entries       # every English Pokédex entry by generation → data/generated/dex-entries.json
npm run import:type-chart        # Showdown type chart → data/generated/type-chart.json
```

Importer flags: `--fresh` (ignore HTTP cache), `--offline` (fail if cache miss), `--help`.

---

## Locked design decisions

Do not silently reverse these.

| Topic | Decision |
| --- | --- |
| Randomizable unit | Pokémon **form**. Each generated batch is unique along overlapping evolution paths; split branches may appear together |
| Names | Store both `pokeApiSlug` and `showdownName`. Export Showdown names only |
| IDs | Form / ability / move / item / nature `id` = Showdown id. Species `id` = PokéAPI slug |
| Legendaries | `isLegendary` = Showdown **Restricted Legendary**; `isSubLegendary` = **Sub-Legendary** |
| Mythical / Paradox / Ultra Beast | Showdown tags |
| Pseudo-legendary | Explicit list in `lib/data/classify.ts` (600 BST three-stage lines; not Archaludon) |
| Evolution stage | Chain depth: 0 basic, 1 stage1, 2+ stage2. Babies are basic + `isBaby` |
| Form generation | Form **introduction** gen (Alolan Raichu = Gen 7) |
| Form types | `base \| regional \| mega \| primal \| gmax \| other` |
| Dynamax | Not a form. Gigantamax **is** a form |
| Default form filter | **Base, regional, and other on.** Mega, primal, and gmax **off** |
| Type filter | Default OR; AND is already implemented in `lib/filters` |
| Specials default | All allowed (user unchecks to exclude) |
| Ability random ON | All standard abilities (`abilityPoolMode: "all"`). Legal-only is a future pool mode |
| Move random ON | All standard catalog moves (`movePoolMode: "all"`). Z/Max/CAP already excluded at import. Learnset-only is a future pool mode |
| Item random ON | Showdown holdables + explicit None, then selected teambuilder categories (Popular / Items / Pokémon-Specific / Usually Useless / Useless; all on by default) |
| Count | 1–12 Pokémon, default 6. Ability 1–12, default 3. Moves 4–12, default 8. Move-before `movesPerPokemon` 1–4, default 4. Items 1–12, default 3 |
| Insufficient pools | Typed error + user-facing explanation; never a silent short list |
| RNG | `lib/randomizer/randomUtils.ts` only. No `Math.random()` in product code |
| Re-roll | Replaces **one** option in the **viewed** generation. Not a new Generate. No Previous/Next history. None is not re-rollable |
| Tera / gender / level / shiny | In V1 UI, validation, recap, and export. Tera, mixed gender, and shiny are not auto-filled. Level defaults to 50 (the user can change it, 1–100) |
| Nickname | Optional, above the Pokémon, at most 18 characters. Spaces count. Blank uses the species name |
| Happiness | 0–255, default 255. Frustration is strongest at 0. Return is strongest at 255 |
| EVs | Blank slots count as 0 and the user does not type 0. Total cannot pass 508. Per-stat cap is 252. Sliders are always scaled 0–252 and still clamp to the remaining total. There is no EV confirmation checkbox, and the old EV preset buttons are gone. Four moves show a Showdown-style guessed spread; applying it sets those EVs and that Nature. |
| IVs | Start at 31 in every stat. The user can change any stat from 0 to 31, or pick one of the four Showdown "IV spreads" in a dropdown (`lib/builder/ivPresets.ts`: 31/0/31/31/31/31, 31/0/31/31/31/0, all 31, 31/31/31/31/31/0). A preset sets IVs only |
| Descriptions | Do not invent or paraphrase. Pokédex = every unique English PokéAPI flavor, grouped by generation in `data/generated/dex-entries.json` (the catalog keeps the latest as the fallback), and a stepper widget cycles through them. Ability/move/item `description` prefers PokéAPI English `short_effect`/`effect` when it includes numbers, then Showdown battling text with numbers, then flavor |
| Export | `exportShowdownSet` for one Pokémon. `exportShowdownTeam` joins sets with a blank line. Tera always written. Level 100 omitted. IVs of 31 omitted. Zero EVs omitted. Gender omitted if genderless. Shiny line only if shiny. Happiness omitted at 255 |
| Teams | Unlimited teams, 6 Pokémon each, stored in `localStorage` (`pokemon-randomizer.teams.v1`). Next Randomizer does not clear them. No species clause. Duplicates are allowed |
| Data updates | Repeatable import scripts, not hand-edited catalogs |
| Git | Feature branches; conventional commits. Rename `master` → `main` still pending |

Defaults live in `lib/randomizer/defaults.ts`. Mega is **not** in the default `formTypes`. `randomizeAbilities`, `randomizeMoves`, and `randomizeItems` default to **false**.

---

## Architecture

```text
PokéAPI + Showdown → scripts/import → data/generated/catalog.json
                                         ↓
                    filters → seeded randomizer → RandomizerSession
                                         ↓
                    builder → lib/validation → recap + exportShowdownSet
                                         ↓
                                        app/ UI
```

UI must not own randomization, filtering, classification, or validation. UI must not consume raw PokéAPI or Showdown objects.

Session type: `RandomizerSession` in `lib/types/session.ts` (serializable). A client provider keeps it across `/randomizer`, `/builder`, `/recap`, and `/teams`, and `sessionStorage` (`pokemon-randomizer.session.v1`) restores it after a refresh. Junk storage is ignored. Teams use a separate `TeamProvider` and `localStorage`, so a new randomizer does not wipe them.

---

## Key paths

```text
app/                         Home, randomizer, builder, recap, teams
app/randomizer/              Server page + loading/error (pass catalog Pokémon, abilities, moves, items)
components/layout/           Header, footer, page frame, route notice and error
components/randomizer/       Order list + tabs + Pokémon / Ability / Move / Item UI
components/recap/            Pokédex card, idle model, save-to-team
components/teams/            Team list, clear confirmation, slot sprites
components/builder/          Set builder, command palette, number input, Tera picker, portrait
components/dex/              Pokédex generation cycler
components/session/          Next Randomizer button
components/ui/               shadcn button + card
lib/analysis/                Type chart and team analysis (pure)
lib/showdown/                exportSet, parseSet, importTeam
lib/types/                   Normalized catalogs + session
lib/data/classify.ts         Form type, evolution depth, pseudo-legendaries
lib/data/evolution.ts        Later-stage targets + overlapping-path uniqueness
lib/data/genera.ts           English PokéAPI genus
lib/data/loadCatalog.ts      Node loader (mtime-aware cache) + slim Pokémon payload
lib/data/moveDisplay.ts      Power / Accuracy chip labels
lib/data/item-teambuilder.ts Showdown item category mapping
lib/filters/                 Pokémon, move, and item filters from RandomizerConfig
lib/randomizer/              defaults, RNG, engines, custom order, extras, session helpers
lib/builder/                Draft setters, pools, learnsets, move search/sort, item search, ability groups, Showdown EV guess, randomizer locks
lib/stats/battleStat.ts     Gen 3+ battle stat formula
lib/session/                 sessionStorage for RandomizerSession
lib/validation/              EV/IV/nature/ability/moves/item/tera/gender/level/shiny/happiness/set (`REQUIRED_MOVE_COUNT = 4`, `MAX_EV_TOTAL = 508`)
lib/showdown/exportSet.ts    One set, and a team paste with a blank line between sets
lib/recap/                   Recap entries, 3D model URLs, idle-clip choice, shiny texture pairing
lib/teams/                   Team box, localStorage, Showdown team paste, HOME sprite URLs
scripts/import/              Repeatable PokéAPI + @pkmn/dex snapshot, learnsets, Hidden Abilities, model index, genera
data/generated/              catalog.json (~4.7MB, version 2.4.0), learnsets.json, hidden-abilities.json, join-report.json, pokemon-model-index.json, genera.json
data/cache/pokeapi/          Gitignored HTTP cache
tests/unit/                  Domain tests (Vitest), including `tests/unit/ui/type-colors.test.ts`
tests/e2e/builder.spec.ts    Builder, recap, and saved-team flow (Playwright)
tests/e2e/randomizer.spec.ts Real randomizer flow, including back navigation (Playwright)
tests/e2e/polish.spec.ts     Header, not-found, and narrow viewport (Playwright)
```

---

## Catalog (do not rebuild, do not hand-edit)

`npm run import:data` already produced the catalog. Current version **2.4.0** includes `evolutionTargetIds`, Showdown item teambuilder categories, latest unique English Pokédex flavor, and numeric ability/move/item effects.

| Collection | Count |
| --- | --- |
| Pokémon forms | 1316 |
| Species | 1025 |
| Abilities | 310 |
| Moves | 850 (no Z/Max/CAP) |
| Items | 507 (16 Popular, 159 Items, 108 Pokémon-Specific, 29 Usually Useless, 195 Useless) |
| Natures | 25 |

Default **form** pool on `/randomizer` is **1230** base, regional, and other formes. Default **compatible** pool (overlapping-path uniqueness) is **590**. Generate and insufficient-pool errors use `matchingPokemonPoolSize`, not the raw form count.

Re-run `npm run import:data` only when PokéAPI or Showdown source data needs refreshing. After a catalog change, restart `next dev` if the UI still looks old.

Integrity fixtures: Mewtwo (Restricted Legendary), Articuno (Sub-Legendary), Nihilego (Ultra Beast), Walking Wake (Paradox, gen 9), Dragonite (pseudo, stage 2), Pichu (baby, basic), Alolan Raichu (`raichu-alola`, regional, gen 7), Mega Venusaur (`venusaur-mega`, mega, gen 6). Evolution: Charmander → Charmeleon/Charizard; Pikachu includes Alolan Raichu; Silcoon → Beautifly only; Honedge/Doublade/Aegislash overlap; Wurmple splits.

---

## What is already built (do not rebuild)

### Pokémon

- `randomizePokemon` in `lib/randomizer/pokemon.ts`: filter, then unique along overlapping evolution paths. Split branches may appear together (Cascoon with Silcoon or Beautifly, never with Wurmple or Dustox).
- History: `pokemonRolls` newest-first. UI shows **one** generation. Previous / Next walk history. Failed generate and filter changes do not drop stored rolls.
- Filters: per-dropdown Generations, Types, Formes, Evolution stages, Specials. Count 1–12, default 6. Live compatible pool size. Reset.
- Select → optional evolve (`evolvedPokemonId`). Mega / Primal / Gigantamax are not offered as evolve targets. `battlePokemonId` is the evolved form if set, else the selected form.
- Per-card **Re-roll** replaces one option in the viewed generation.

### Ability / Move / Item

Enable extras on the **Randomizer order** list, not the Pokémon tab. Typical order is Pokémon → Ability → Move → Item. Tiles are **drag-and-drop** (keyboard: Space to pick up, Up/Down, Space to drop, Escape to cancel). Use typical order restores the default.

| Extra | After Pokémon | Before Pokémon | Pool |
| --- | --- | --- | --- |
| Ability | Generate, pick one for `battlePokemonId` | Generate a pool; user applies unique abilities; select requires an applied ability | All 310 catalog abilities |
| Move | Generate, pick **four** unique moves | Generate a pool; apply `movesPerPokemon` (1–4, default 4); leftover unused; empty slots stay empty for the Builder | 850 standard moves, then Physical/Special/Status and 18 types |
| Item | Generate, pick one or None | Generate a pool; apply unique items (None allowed); select requires an applied item | 507 holdables by Showdown teambuilder category; None is extra, not RNG |

Do not auto-assign extras onto Pokémon in generate order. `builderAbilityPool` returns usual `abilityIds` when Ability is off, or rolled `abilityOptions` when on.

Move cards show type, category, **Power**, then **Accuracy** (`Accuracy 90%`, or Can't miss). Item cards show Showdown teambuilder category. Ability/move/item descriptions include numeric mechanics when a source has them (Punk Rock 1.3×, Metal Coat 20%).

### Session helpers (`lib/randomizer/session.ts`)

Reuse these. Do not rewrite the select / evolve / clear / re-roll path.

| Helper | Behavior |
| --- | --- |
| `createInitialSession` | Empty rolls; extras off; tab is the first enabled step |
| `applyPokemonRoll` | Prepends a roll; keeps selection if that form still exists in any roll; clears EVs, Nature, and EV confirmation; does not auto-assign extras |
| `selectRolledPokemon` | From any stored roll. After Pokémon, extras-after clear when `battlePokemonId` changes. Before Pokémon, requires applied extras and copies them onto the draft |
| `chooseEvolvedPokemon` | Keep or later stage. Before Pokémon, keep applied extras |
| `applyAbilityToRolledPokemon` / `applyMoveToRolledPokemon` / `applyItemToRolledPokemon` | Unique apply on a viewed-roll Pokémon |
| `replaceRolledPokemon` / `replaceRolledAbility` / `replaceRolledMove` / `replaceRolledItem` | In-place re-roll of the viewed generation |
| `clearPokemonRolls` | Drops Pokémon rolls; keeps pre-Pokémon extra pools |

`draft.itemId === null` means None. `undefined` on applied extras means not applied. `NONE_ITEM_SELECT_VALUE` (`__none__`) is UI-only.

Continue to builder opens `/builder` with the same session. The battle Pokémon, rolled extras, and draft come along. A valid Continue writes `finalizedSet` onto the session and opens `/recap`.

---

## Phase 6 Builder

`/builder` reads the persisted session. Domain updates live in `lib/builder`. UI is `components/builder/set-builder.tsx` plus the ability dropdown, move picker, item picker, and stat sheet.

- Ability: usual `abilityIds` when Ability was skipped, grouped in a dropdown as Abilities then Hidden Ability (`data/generated/hidden-abilities.json`). When the ability randomizer set one, that ability is locked and its effect stays visible.
- Moves: applied randomizer moves stay in that many slots and are locked. Empty slots use every standard move or that Pokémon's learnset (`data/generated/learnsets.json`: level-up, egg, TM, tutor, and transfer, including earlier stages). The list is not capped. Search matches letters the way a Showdown id does. Rows are single lines of aligned columns (name, type, category, power, accuracy, PP, how it is learned, effect) under a sticky header, and each column heading sorts the current list. In learnset mode, chips for Level-up, TM, Egg, and Tutor filter the list (`lib/builder/learnsets.ts`, compact `moveId:CODES` strings, codes L/M/E/T/V). A power of 1 is a variable-damage placeholder and displays as a dash; those dashes sort as the lowest power.
- Item: a categorized scrollable list matching the item randomizer (Popular items, Items, Pokémon-specific items, Usually useless items, Useless items), with search. Explicit None stays available. A randomizer-chosen item, including None, is locked and its effect stays visible.
- Stats: six rows like the Showdown teambuilder (base bar, EVs, slider, IVs, calculated stat). Formula is official Gen 3+ in `lib/stats/battleStat.ts`. Blank EVs preview as 0. Missing IVs preview as 31. Unset level previews at 100. Shedinja's base HP of 1 stays 1.
- A guessed spread appears once four moves are chosen (Ditto, Unown, and Last Resort can guess sooner). `guessEvSpread` in `lib/builder/suggestEvs.ts` follows the Pokémon Showdown teambuilder stat guesser (`BattleStatGuesser`) for Gen 9 with normal EV limits. The role comes from move categories and base stats, plus the ability, item, level, and IVs. It is not a published Smogon set. `data/smogon/gen9-analyses.json` is gone. "Use this spread" fills those EVs and the Nature that matches the plus and minus stats, and does not confirm.
- EVs, Nature, Tera, mixed gender, and shiny stay unset until the user sets them, except the guessed spread above. Level starts at 50. A new roll, a different Pokémon, or an evolution clears EVs and Nature. IVs start at 31, with a Showdown IV spreads dropdown. Happiness starts at 255 (0–255). Nickname is optional, max 18 including spaces, and sits above the Pokémon. Spaces stay while typing and count toward 18. A nickname of only spaces is blank. Leading and trailing spaces are removed when the set is saved. Internal spaces stay in the saved set and in the Showdown paste.
- Gender-locked and genderless species do not ask for a gender. `validateSet` fills the only legal gender.
- Live issues come from `validateSet`. Continue to recap stays disabled until the set is valid, then stores `finalizedSet`.

## Phase 7 Recap and saved teams

`/recap` shows one Pokédex-style card for the finalized set. The summary Name line is the nickname, or the species name when there is no nickname. The line under the species name on the 3D name plate is the official English genus from `genera.json` (`npm run import:genera`). There is no separate Species row. Copy to Showdown copies `exportShowdownSet`. Next Randomizer calls `startNextRandomizer()` (`createInitialSession()`) and opens `/randomizer`. It clears rolls, extras, the draft, and `finalizedSet`. It does not clear teams.

The 3D stage always animates the regular or form GLB from `data/generated/pokemon-model-index.json` (`npm run import:models`, Pokemon-3D-api commit `429de1288cea0d43f5b4f56305d2276e94239d65`). `preferredIdleAnimation` picks a clip whose name matches `/a?idle/i`, otherwise the first clip. `waitA` is not treated as idle. A shiny Pokémon is shown in this order in the Builder and Recap: shiny 3D model, then shiny sprite, then shiny artwork (`idleModelPlan` and `fallbackImage` in `lib/recap`). Shiny GLBs have no idle clip, so `lib/recap/shinyColors.ts` paints the shiny file's base-color textures onto the animated regular model. Pairing is all-or-nothing, and the model stays hidden until the paint lands. A shiny Pokémon with no distinct shiny GLB, or whose paint fails, drops to the shiny picture and is never shown in regular colors. The Recap card art (`cardImage`) is shiny artwork first, then the shiny sprite. Teams shows the HOME shiny sprite, then the shiny sprite, shiny artwork, regular artwork, and default sprite, based on the set's shiny choice. The page requests GLBs directly. It does not call the GitHub contents API or PokéAPI.

`/teams` lists every saved team. From the recap the user can copy the set, save it into the next open slot of the active team, or save it as slot 1 of a new team. Other teams stay intact. There is no limit on the number of teams. Each team holds 6 Pokémon, packed from the front.

On a team the user can:

- View recap: the same Pokédex card, including its Showdown set, without replacing the randomizer session
- Move to another filled slot
- Remove one slot
- Copy one set, or copy the team (`exportShowdownTeam`, blank line between sets)
- Clear team: a confirmation dialog first. Cancel does nothing. Confirm removes that team only
- See the latest sprite: Pokémon HOME, then official artwork, then the default sprite. Shiny sets use the shiny HOME sprite

Domain rules live in `lib/teams`. The UI calls them. Invalid stored JSON becomes an empty team box. Do not add a database for teams.

## Phase 8 Polish

Merged. Do not start learnset-only pools, competitive pools, accounts, or a six-Pokémon randomizer unless asked.

- Header: `aria-current="page"` plus semibold, underline, and a muted background. At phone width the brand is its own row and the four links are a two-column grid with 44px targets.
- `PageFrame` and `RouteNotice` share spacing. Randomizer, builder, recap, and teams each have a loading notice with a heading and `role="status"`, plus an `error.tsx` whose Try again calls Next's `retry`. `app/not-found.tsx` covers unknown URLs. `app/error.tsx` and `app/global-error.tsx` cover unexpected failures and do not show stack traces.
- Type chips live in `components/type-colors.ts` and meet 4.5:1. The Pokédex title bar uses dark text on the orange bar. A lowered Nature stat uses `#ffc4c4`. `prefers-reduced-motion` shortens CSS animation. The 3D idle already pauses for reduced motion. The font uses `display: "swap"`.
- Filter summaries use an explicit `role="button"` and `aria-expanded`. Current Chromium no longer exposes a plain `<summary>` as a button, and the randomizer tests open those filters by that role.
- Each randomizer tab except the first shows an outline **Back to …** button for the previous enabled tab, including Pokémon when an extra randomizer is ordered before it. Recap always links **Back to the builder** without clearing the session. Builder links **Back to the randomizer** at the top and bottom of the form.

Do not start the later features unless asked.

## Battle Laboratory design overhaul (merged)

Source: `Downloads/Final Master Design Overhaul Prompt.md`. Decisions: one phase at a time, light + dark themes, no new packages (`vaul` and `cmdk` are not added; use `@base-ui/react`), every type chip must stay at 4.5:1 or better.

- **Phase 1 done:** design tokens in `app/globals.css` (surfaces, accents, status, fluid spacing, `text-h1` / `text-h2`). The dark theme uses the new palette; light keeps the warm palette. Fonts are Geist Sans and Geist Mono. `TYPE_COLORS` uses the directive hues with the higher-contrast text color per chip. Live counters and stat cells use `font-mono tabular-nums`.
- **Phase 2 done:** root layout is a grid capped at 1800px. From `lg` the team dock (`TeamDockRail`, `components/teams/team-dock.tsx`) is a right rail of 300–360px. Below `lg`, `MobileDockBar` (`components/layout/mobile-dock-bar.tsx`) is a fixed bottom bar: phones get the four page links there (the header keeps only the brand), and every size under `lg` gets a Team button that opens the roster in a slide-up native `<dialog>`. The roster reads and writes the same `TeamProvider` storage as `/teams`: six slots, drag to reorder, Up/Down buttons as the keyboard path, active-team select, and Copy team. The dock gets names, types, and sprites from the server action `loadDockPokemon` and the paste from `exportTeamText` (`lib/data/dockPokemon.ts`), so the catalog is not sent to every page. Tests: `tests/e2e/dock.spec.ts`, `clampToFilledSlot` in `tests/unit/teams/teams.test.ts`.
- **Phase 3 done:** Build Lab. `StatSpreadSheet` shows an "EVs used n / 508" progress bar (`role="progressbar"`) and four presets plus Clear all EVs (`lib/builder/evPresets.ts`, `applyDraftEvPreset`, `clearDraftEvs`). Presets fill EVs only: they do not confirm and do not set a Nature. Moves, held item, and ability use one shared `components/builder/command-palette.tsx` (native modal `<dialog>`: centered on wide screens, slide-up sheet on phones; ARIA combobox search with Up/Down/Enter/Escape; no `cmdk`). Move rows show type badge, category icon, Pow, Acc, PP, and a STAB tag (`lib/builder/stab.ts`, own types only, not Tera). The old always-open move table and its column-sort headers became a Sort row inside the palette. Triggers are buttons named `Choose move N`, `Held item: …`, and `Ability: …`. Tera type is a radio group of elemental chips (`tera-type-picker.tsx`) with a check mark on the chosen one. Nature labels use Showdown stat names, for example `Jolly (+Spe, −SpA)`, plus a "Raises … lowers …" line. Tests: `tests/e2e/build-lab.spec.ts`, `evPresets.test.ts`, `stab-ability-search.test.ts`.
- **Not in Phase 2:** the sticky mobile action bar for Generate / Add to Team / Copy Showdown (needs the Phase 3–4 screen refactors), loading a saved set back into the builder, and the live Showdown text and coverage matrix in the rail (Phase 5). The tablet filter-left / preview-right layout and the ultrawide four-pane layout belong to Phases 3–4.
- **Phase 4 done:** randomizer pipeline. `randomizer-flow.tsx` renders stage cards (handle, order badge, icon, hint, On/Off pill, dashed when skipped, connector line); drag and keyboard reorder logic and accessible names are unchanged. The filter dropdowns are now always-open `FilterGroup`s (`filter-group.tsx`, renamed from `filter-dropdown.tsx`) with chips. `ToggleChip` has a transparent native checkbox over the whole chip and a check icon when selected; pass `type` for an elemental chip (Types and Move types). Generate buttons go through `components/randomizer/staged-generate.tsx`: three ~220ms steps of status text (`role="status"`), then the roll. This is cosmetic, since generation is synchronous. It is skipped under `prefers-reduced-motion`, and the buttons use `aria-disabled` so focus is kept. Pokémon result cards use `TypeBadge` and a radial type glow (`typeGlow` in `components/type-colors.ts`, alpha capped at 0.2). Playwright now runs with `reducedMotion: "reduce"` by default, and the staged-feedback tests opt back in.
- **Not in Phase 4:** Move/Item/Ability result cards have no type glow (only Pokémon cards do). Re-roll buttons stay instant.
- **Phase 5 done:** Showdown sync, analysis, and the a11y pass.
  - **Import:** `lib/showdown/parseSet.ts` (pure text parser, `showdownId`) and `lib/showdown/importTeam.ts` (`previewShowdownImport` resolves names to catalog ids and runs `validateSet`). A set is only accepted when the paste has Ability, Nature, Tera Type, exactly 4 moves, and (M)/(F) for species with both genders. This follows the "never auto-assign Nature, Tera, gender" rule, so many third-party pastes need a line or two added. The error list says which. Defaults are Showdown's own: no EVs line means 0 EVs, no IVs means 31, level 100, not shiny, happiness 255 (this app's default), no `@` means no item. EVs over 508 are rejected with the builder's message. Ability must be one of the Pokémon's abilities or its Hidden Ability. Moves are not checked against learnsets (the builder allows every move). Max 6 sets, 20,000 characters.
  - **Server functions:** `lib/data/teamTools.ts` (`"use server"`): `loadTeamDetails(sets)` returns each member's types and moves plus the Showdown text, and `readShowdownPaste(text)` returns the import preview. The catalog stays on the server.
  - **Dialog:** `components/teams/showdown-dialog.tsx` is a native modal `<dialog>`: export (live textarea plus Copy) next to import (paste, Read paste, per-Pokémon Ready/Needs changes list, Add to active team or Save as a new team). It is opened from `components/teams/team-tools.tsx`, which sits in `TeamRoster` (rail and phone sheet). Saving uses `importSetsToTeam` in `lib/teams/teams.ts` (all or nothing). Initial focus uses `data-autofocus`, because React's `autoFocus` runs while the dialog is still closed.
  - **Type chart:** `data/generated/type-chart.json` is generated from Pokémon Showdown (`npm run import:type-chart`, `scripts/import/type-chart.ts`). `lib/analysis/typeChart.ts` (`damageMultiplier`) and `lib/analysis/teamAnalysis.ts` (`analyzeTeam`) are pure. Defense counts weak/resist/immune per attacking type for each member. Offense lists the team's damaging moves that are super effective against each type, and reports gaps. It uses the Pokémon's own types and move types only: no abilities (Levitate, Flash Fire…), items, or Tera types. The panel says so. The tables are `components/teams/team-analysis.tsx`, and every cell has text, not just color. The "Type analysis" and "Showdown text" disclosures in the rail are native `<details>` and load as soon as the roster changes.
  - **A11y:** `tests/e2e/a11y.spec.ts` with `a11y-helpers.ts`. It checks landmarks and the skip link on every route, a real-browser contrast scan (4.5:1, 3:1 for large text) of the rendered text on `/`, `/randomizer`, `/teams`, `/recap`, the Build Lab with the move palette open, and the Showdown dialog, in light and dark. It also tabs through each page and requires an outline or ring on every stop, and checks that the dialog keeps focus and returns it. Findings fixed: the light-mode destructive text (Clear team, Remove) was 3.86:1 on its tinted background, so `--destructive` is now `oklch(0.505 0.2 27)`. The 18 type pills were already covered by `tests/unit/ui/type-colors.test.ts`. Not covered: text over gradients or images (the Pokémon card glow is capped at 20%), and no screen reader was run, since the checks are role and name based.
  - **Test notes:** Playwright's first team lookup compiles the server function on a cold dev server, so the first matrix assertions wait up to 20s. `tests/e2e/helpers.ts` has `waitForHydration` for clicking Generate before React attaches.
- **Not done:** loading a saved set back into the builder, the sticky mobile action bar for Generate / Add to Team / Copy Showdown, the tablet and ultrawide multi-pane layouts, and the coverage matrix on the `/teams` page (it lives in the rail and phone sheet).
- **Design overhaul status:** Phases 1–5, Round 2, and the follow-ups are all merged.
- **Round 2 (after browser review, merged).** These supersede the matching Phase 3 and Phase 4 notes above (EV presets, EV confirmation, always-open filters, Tera radio group):
  - **Loading screen:** `components/layout/loading-sprites.tsx` runs seven pixel GIFs (`public/loading-sprites/*.gif`, shipped locally) across `RouteNotice`. Decoration only (`aria-hidden`); with reduced motion they stand in a row.
  - **Randomizer filters:** collapsible `FilterDropdown`s again (`components/randomizer/filter-dropdown.tsx`, native `<details>`), with `FilterToolbar`, `ToggleChip`, and `toggleFilterValue`. `openFilter` in `tests/e2e/helpers.ts` opens one.
  - **Pokéball reveal:** `lib/randomizer/ball.ts` (`ballForPokemon`): Master Ball for Restricted Legendary, Sub-Legendary, Mythical, Paradox, and Ultra Beast; Luxury Ball for pseudo-legendaries; otherwise BST ≥ 500 Ultra, ≥ 400 Great, else Poké Ball. `components/randomizer/pokeball.tsx` (`PokeballReveal`, `BallBadge`) plays a CSS-only throw, wiggle, and release (about 2 s per card, 70 ms stagger), once per card key (`playedKeys`), with the card `inert` until it opens. Reduced motion shows cards at once. Each card shows its BST and ball.
  - **Pokédex generations:** `npm run import:dex-entries` writes `data/generated/dex-entries.json` (`Record<speciesId, [generation, versions[], text][]>`). `loadDexEntries` (`lib/data/dexTools.ts`, a Server Function) feeds `useDexEntries`, and `components/dex/dex-entry-cycler.tsx` steps older/newer and jumps by generation. Used on randomizer cards and the recap card.
  - **Builder:** Abilities / Hidden Ability group headers are darker and bolder. Tera type is a dropdown. EV presets and the EV confirmation checkbox were removed (`evsConfirmed` no longer exists). The IV spreads dropdown matches Showdown. Level defaults to 50. The item picker's empty-item icon is fixed. The move picker is in columns with a learn-method filter (see Phase 6).
  - **Recap artwork fallback:** the 3D model is dropped for artwork (regular or shiny, `artworkShiny` in the catalog from PokéAPI `front_shiny`) when the model fails to load or has no animation clips (it would stand in a T-pose). Remember the viewer only starts loading when it scrolls into view.
  - **Shiny rolls:** `RandomizerConfig.shinyChance` is a percent from 0 to 100 (default 1, `MIN/MAX/DEFAULT_SHINY_CHANCE` in `defaults.ts`, a "Shiny chance" box in the Pokémon filters, restored to 1 by Reset filters). `rollShinyIds` (`lib/randomizer/shiny.ts`) rolls each Pokémon on its own, using a separate seeded stream (`${seed}:shiny`), so it never changes which Pokémon are picked. `randomizePokemon` and `rerollPokemon` return `shinyIds`. The roll is stored as `PokemonRoll.shinyPokemonIds` (missing in old sessions means not shiny), and `replaceRolledPokemon(session, prev, next, nextIsShiny)` re-rolls it for a replaced card. A shiny card shows the shiny artwork and a "Shiny" badge with a sparkle icon. Selecting it, evolving it, or keeping it selected through a new roll starts the draft with `shiny: true` (`freshTraining(draft, rolledShiny)`); the user can still change it in the builder. An out-of-range chance shows an inline alert, and `InvalidShinyChanceError` carries a plain-language message. `parseStoredSession` fills in defaults for config keys missing from an older saved session.
  - **Teams page:** has the same Next Randomizer button as the recap (`components/session/next-randomizer-button.tsx`).
  - **Tests:** `tests/e2e/battle-lab-round-two.spec.ts` (loading sprites with JS off, ball reveal with motion on, dex cycler on both pages, artwork fallback with a stubbed empty GLB, Teams button), plus `ivPresets`, `learnsets`, `ball`, `dex-entries`, and `fallback-image` unit tests.
  - **Follow-ups after Round 2:**
    - Level and Happiness use `components/builder/number-input.tsx` (local text state, so the box can be cleared and retyped; valid numbers commit as typed and the last good value returns on blur). A plain controlled input would snap back because `SessionProvider` applies `applyBuilderDefaults` on every render.
    - Regional and other formes are on by default (`formTypes`); Mega, Primal, and Gigantamax stay off.
    - Starting a build for a different Pokémon resets Tera type, gender, shiny, and nickname (`freshTraining`), see Shiny rolls.
    - **Shiny display order:** shiny 3D model, then shiny sprite, then shiny artwork, in the Builder and Recap (`idleModelPlan`, `pokemonShinyModelUrl` in `lib/recap/model.ts`; `fallbackImage` and `cardImage` in `lib/recap/entries.ts`; `RecapEntry.idleModel` replaced `modelUrl`/`regularModelUrl`). `components/recap/pokemon-idle-model.tsx` hides the model until `paintShiny` returns `"painted"`; `"failed"` calls `onUnavailable` so the picture shows. The shiny 3D paint is covered by unit tests of the plan, not by a browser test. Spot-check it with a Pokémon that has a shiny GLB.
    - Teams art for a shiny set: `lib/teams/sprites.ts` candidates are HOME shiny, shiny sprite, shiny artwork, artwork, sprite.

---

## Known issues / watchouts

- Next.js overlay “1 Issue” during Cursor browser verification is often **`data-cursor-ref` hydration**, not app `Math.random()`. Do not “fix” RNG for that.
- Filter groups use a real `<fieldset>` / `<legend>`. Filter dropdowns use native `<details>`.
- Playwright `getByRole("button", { name: "Clear generations" })` is the **filter toolbar**, not “Clear generated Pokémon”. Open the Generations dropdown first.
- Aegislash catalog `id` is `aegislash`; `pokeApiSlug` is `aegislash-shield`. Look up by Showdown `id` for evolution-path tests.
- Header fits a 390px viewport: the brand is on its own row and the four links are a two-column grid with 44px targets. The current page uses `aria-current="page"`, semibold type, an underline, and a muted background.
- Continue to builder writes the session before leaving `/randomizer`. Continue to recap writes `finalizedSet` before leaving `/builder`.
- Editing a draft field clears `finalizedSet`. Do not toggle shiny on a finished set unless the user submits the builder again.
- Untracked `public/*.svg` leftovers from create-next-app should not be committed. `.next/` must not be committed.
- Do not add the full `pokemon-showdown` simulator package to the client.
- Natures have `pokeApiSlug` (dual-write rule). Do not remove it.
- Next.js 16 may rewrite the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of `AGENTS.md`. Keep the Pokémon Randomizer rules below that block.
- `data/cache/pokeapi/` is gitignored. Safe to keep locally; do not commit.
- `node_modules.bak` (if present) is a leftover Vite install; gitignored; safe to delete.
- PowerShell: chain commands with `;`, not `&&`.

---

## Working rules for new chats

When asked to implement something:

1. Inspect existing architecture and docs.
2. State a short plan.
3. Implement only that scope.
4. Add/update tests.
5. Run lint, typecheck, tests, and build when the app could break.
6. Update this file plus `DATA_MODEL.md` / `ROADMAP.md` / `TEST_PLAN.md` if architecture or decisions changed.
7. Do not commit unless asked. Do not push unless asked.

Definition of done: implementation + TypeScript + tests + lint + edge/error handling + a11y/responsive considered. UI is not done from a screenshot; exercise the changed flow in the browser.

---

## Suggested first message in a continuation chat

> Continue the Pokémon Randomizer. Read `handoff.md` and `AGENTS.md`. You are on `master`. Phases 1–8 are merged. Do not start learnset-only pools, competitive pools, accounts, or a six-Pokémon randomizer unless I ask. Do not commit unless I ask.
