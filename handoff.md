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
| Phase complete on `master` | **Phase 8 — Polish**, the **Battle Laboratory overhaul** (design Phases 1–5, Round 2, and the follow-ups below), the **Pokémon world theme** (backdrops and logo titles), the **tester feedback round** (PR #10) and its follow-ups through the **Ditto tab icon** (PR #13), **tester feedback part 2** (PR #14), **form learnsets and required held items** (PR #15), **battle-only forms and restored moves** (PR #16), **Hidden Power typecheck** (PR #17), then two direct commits: **Struggle stays out of move pools** (`b49faff`) and **before-Pokémon pools generate once** (`2d7edc2`), then **draft a team of six, level 100, and custom typing** (PR #18) |
| Current work | None. Those features are on `master`. See Draft team of six, and Formats, custom Pokémon, and the damage check, below |
| Next phase | Later features only if the user asks (learnset-only pools, competitive pools, a six-Pokémon randomizer, accounts, weather, status, stat stages, AI, online play, doubles) |
| Current branch locally | `master` |
| Latest on `master` | PR #18 — draft a team of six, start sets at level 100, and opt in to custom typing and base stats. Run `git log -1` to confirm |
| Remote | https://github.com/ryroth/pokemon-randomizer |
| Merged PRs | [#1](https://github.com/ryroth/pokemon-randomizer/pull/1) Phase 1, [#2](https://github.com/ryroth/pokemon-randomizer/pull/2) Phase 2, [#3](https://github.com/ryroth/pokemon-randomizer/pull/3) Phase 3, [#4](https://github.com/ryroth/pokemon-randomizer/pull/4) Phase 4/5, [#5](https://github.com/ryroth/pokemon-randomizer/pull/5) Phase 6, [#6](https://github.com/ryroth/pokemon-randomizer/pull/6) Phase 7, [#7](https://github.com/ryroth/pokemon-randomizer/pull/7) Phase 8, [#8](https://github.com/ryroth/pokemon-randomizer/pull/8) Battle Laboratory overhaul, [#9](https://github.com/ryroth/pokemon-randomizer/pull/9) Pokémon world theme, [#10](https://github.com/ryroth/pokemon-randomizer/pull/10) Tester feedback (builder, recap links, still art, locks, evolution stages), [#11](https://github.com/ryroth/pokemon-randomizer/pull/11) scroll, evolution stages, and lock scope, [#12](https://github.com/ryroth/pokemon-randomizer/pull/12) drop moves removed from the games, [#13](https://github.com/ryroth/pokemon-randomizer/pull/13) Ditto tab icon, [#14](https://github.com/ryroth/pokemon-randomizer/pull/14) Tester feedback part 2, [#15](https://github.com/ryroth/pokemon-randomizer/pull/15) Form learnsets and required held items, [#16](https://github.com/ryroth/pokemon-randomizer/pull/16) Battle-only forms and restored moves, [#17](https://github.com/ryroth/pokemon-randomizer/pull/17) Hidden Power typecheck, [#18](https://github.com/ryroth/pokemon-randomizer/pull/18) Draft team of six, level 100, and custom typing |
| Rename `master` → `main` | Still pending |

Phases 1–8, the Battle Laboratory overhaul, the Pokémon world theme, the tester feedback round (PR #10) through the Ditto tab icon (PR #13), tester feedback part 2 (PR #14), form learnsets with required held items (PR #15), battle-only forms with restored moves (PR #16), and the Hidden Power production-build fix (PR #17) are on `master`. Two later commits are also on `master`: Struggle stays out of the move randomizer (`b49faff`), and a before-Pokémon ability, move, or item pool is generated once and can be cleared only before the user leaves that step (`2d7edc2`). PR #18 adds the draft team of six, level 100, custom typing and base stats, the Format Explorer, the damage check, and the minimal singles battle. Do **not** rebuild them. Do **not** start learnset-only pools, competitive pools, accounts, a six-Pokémon randomizer, weather, status, stat stages, AI, online play, or doubles unless the user asks.

Start the next feature from up-to-date `master` on a new branch.

Quality gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Last full run on the tester-feedback branch (merged as #10): tsc clean, ESLint 0 errors, Vitest 422, Playwright 92 (one a11y Showdown dialog test flaked once under load and passed alone), build passes. The keyboard tab-stop audits in `a11y.spec.ts` and a few Showdown tests can flake when many workers share one cold dev server (a different one each run); re-run the named test alone before treating it as a regression. Playwright covers the randomizer, builder-through-teams, dock, Showdown, accessibility, Round 2, and tester-feedback flows (`npx playwright install` may still be needed). Catalog version **2.5.0**. Do not hand-edit `catalog.json`, `genera.json`, `pokemon-art.json`, or `item-icons.json`. Learnsets and Hidden Abilities are separate generated files.

---

## First action for the next agent

1. Read this file and `AGENTS.md`. Stay on `master` until a new branch is asked for. Do **not** recreate or rebuild Phases 1–8 or the Battle Laboratory overhaul.
2. Phase 8 and the overhaul are merged. Do not start learnset-only pools, competitive pools, accounts, or a six-Pokémon randomizer (one Generate that returns six) unless asked. Drafting one Pokémon at a time onto a team of six, then building each slot, is implemented.
3. Saved teams are in scope, including that draft roster. Accounts, share URLs, a database, and a six-Pokémon randomizer are not.
4. A minimal generation 9 damage check and singles battle are already on `master`. Do not expand them unless the user asks. `reference/pokemon-showdown/` is a local reference clone. Do not import it.

Do not commit unless asked. Do not push unless asked.

---

## Product (V1)

Consumer web app: randomize **one** Pokémon, build a Showdown-compatible set by hand, copy that set, and save it onto a team of up to 6 that can be copied as a whole.

Flow: Configure → generate unique Pokémon → select one → optional evolve → optional ability / move / item randomizers → Build → Validate → Recap → Copy to Showdown and/or save to a team → Next Randomizer for another Pokémon.

Alternate path: on the last randomizer step, **Add to the team and roll the next** saves that Pokémon onto one draft roster (species, form, shiny roll, and any locked ability, moves, or item) and keeps the randomizer settings for the next roll. The sixth Pokémon opens the Builder at slot 1. Each finished set is written onto that slot. After slot 6 the roster becomes a normal team. **Continue to builder** still builds one Pokémon and does not add it to the roster. **Next Randomizer** on the recap still resets settings to the defaults. A draft slot can be removed until the first one is built.

The Builder shows the typing picker and the base-stat picker only after the user turns that change on for the Pokémon being built. Turning it off clears the override. A set that already has custom types or custom base stats opens with that picker on. The species catalog is not edited. A format decides whether a battle may use those overrides.

Custom order can put Ability, Move, or Item **before** Pokémon. Then generate that extra pool first, apply extras to generated Pokémon (user choice, unique), then select. That before-Pokémon pool is generated once: a later Generate does not replace it. Re-roll still replaces one result. Clear generated abilities, moves, or items removes that pool only while the user is still on that step. Moving to a later randomizer or the builder records the step in `passedExtras`, and Clear stays unavailable if they go back. A step that runs after Pokémon can be generated again for the current Pokémon. Ability-before requires an applied ability. Move-before uses a chosen 1–4 moves per Pokémon (default 4); empty slots are filled later in the Builder. Item-before requires one applied item, including None.

- Pokémon: always randomized
- Abilities / moves / items: independently optional
- EVs and Nature are not auto-assigned. Tera type and gender may be left blank: blank Tera becomes the primary type and blank gender is a 50/50 roll when continuing to the recap (`finalizeBuilderSet`, `lib/randomizer/gender.ts`, written back to the draft so it does not re-roll). A set needs one to four moves (`MIN_MOVE_COUNT`, `MAX_MOVE_COUNT`). Shiny starts at No (`applyBuilderDefaults`) unless the Pokémon rolled shiny (see Shiny rolls below), in which case it starts at Yes. Applying the suggested spread is the exception: it fills those EVs and that Nature. Level starts at 100 (`DEFAULT_LEVEL`) and can be changed. IVs default to 31. Happiness defaults to 255 (0–255). Nickname is optional.
- A new Pokémon roll, a different selected Pokémon, or an evolution clears EVs, Nature, Tera type, gender, shiny, and nickname (`freshTraining` in `lib/randomizer/session.ts`), so the next build starts at the defaults. IVs stay at 31.

Out of scope until explicitly requested: accounts, share URLs, public seeds, learnset-only or competitive-only pools, and a database. A six-Pokémon **randomizer** (one Generate that returns six Pokémon) is still out of scope. The draft-then-build team rolls one Pokémon at a time. Saving finished builds onto local teams is implemented.

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
npm run import:form-items        # data/generated/form-items.json — item an Other form or Mega must hold
npm run import:hidden-abilities  # data/generated/hidden-abilities.json
npm run import:art               # still artwork and held-item icons for anything the catalog lacks: pokemon-art.json, item-icons.json
npm run import:genera            # PokéAPI English genus → data/generated/genera.json
npm run import:dex-entries       # every English Pokédex entry by generation → data/generated/dex-entries.json
npm run import:type-chart        # Showdown type chart → data/generated/type-chart.json
npm run import:world-art         # official Z-A / Scarlet-Violet backdrops → public/world/*.webp
```

Importer flags: `--fresh` (ignore HTTP cache), `--offline` (fail if cache miss), `--help`.

---

## Pokémon Showdown reference checkout

Local only, gitignored, not a dependency. Snapshot `7244fe8e28fa8bc4d0809ae30d183c608b62bb2b` (2026-10-16, “Add Peat Block and PLA plates”) of https://github.com/smogon/pokemon-showdown at `reference/pokemon-showdown/`. MIT license, copyright 2011–2026 Guangcong Luo and contributors. Read it when building our own battle simulator. Do not import it, npm-install `pokemon-showdown`, or copy it into `app/` or `lib/`. Write our own code. If a substantial portion is copied, keep the MIT copyright and permission notice with it.

| Path | What it is |
| --- | --- |
| `sim/battle.ts`, `side.ts`, `pokemon.ts`, `field.ts`, `battle-actions.ts`, `battle-queue.ts` | Battle engine |
| `sim/SIMULATOR.md`, `sim/SIM-PROTOCOL.md` | How a battle runs, and the battle message protocol |
| `sim/team-validator.ts`, `sim/TEAMS.md` | Team validation |
| `sim/dex.ts` and `sim/dex-*.ts` | Dex access |
| `data/pokedex.ts`, `moves.ts`, `abilities.ts`, `items.ts`, `typechart.ts`, `learnsets.ts`, `natures.ts` | Game data |
| `ARCHITECTURE.md`, `PROTOCOL.md` | Server, client, and login split; client/server messages |

The client is a different repo (`smogon/pokemon-showdown-client`) and is not cloned. Refresh this checkout only when asked: `git -C reference/pokemon-showdown pull`.

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
| Not generated | Costume Pikachu, Castform weather forms, Darmanitan Zen (including Galarian), Meloetta Pirouette, Vivillon patterns other than Meadow, Fancy, and Poké Ball, Wishiwashi School, Mimikyu Busted, Cramorant Gorging and Gulping, Eiscue Noice, Morpeko Hangry, Eternatus Eternamax, Palafin Hero. They stay in the catalog (`isGeneratablePokemon`). The base form is rolled; the battle ability or move still causes the form in a battle |
| Type filter | Default OR; AND is already implemented in `lib/filters` |
| Specials default | All allowed (user unchecks to exclude) |
| Ability random ON | All standard abilities (`abilityPoolMode: "all"`). Legal-only is a future pool mode |
| Move random ON | All catalog moves (`movePoolMode: "all"`), including moves Showdown marks `Past` (removed from the current games, e.g. Return, Hidden Power, Spider Web). Struggle is never offered (`isLearnableMove`). Z/Max/CAP/Let's Go stay excluded at import. Learnset-only is a future pool mode |
| Item random ON | Showdown holdables + explicit None, then selected teambuilder categories (Popular / Items / Pokémon-Specific / Usually Useless / Useless; all on by default) |
| Count | 1–12 Pokémon, default 6. Ability 1–12, default 3. Moves 4–12, default 8. Move-before `movesPerPokemon` 1–4, default 4. Items 1–12, default 3 |
| Insufficient pools | Typed error + user-facing explanation; never a silent short list |
| RNG | `lib/randomizer/randomUtils.ts` only. No `Math.random()` in product code |
| Re-roll | Replaces **one** option in the **viewed** generation. Not a new Generate. No Previous/Next history. None is not re-rollable. This is how one result in a before-Pokémon pool changes after the first Generate |
| Before-Pokémon extra pool | Generated once (`canGenerateExtraPool`). Clear (`clearAbilityPool`, `clearMovePool`, `clearItemPool`) only while the user is still on that step. `passReachedRandomizer` writes `passedExtras` when they open a later step or the builder, and going back does not restore Clear. After-Pokémon extras can be generated again for the current Pokémon |
| Tera / gender / level / shiny | In V1 UI, validation, recap, and export. Shiny is not auto-filled. A blank Tera type uses the primary type and a blank gender is rolled at random. Level defaults to 100 (the user can change it, 1–100) |
| Nickname | Optional, above the Pokémon, at most 18 characters. Spaces count. Blank uses the species name |
| Happiness | 0–255, default 255. Frustration is strongest at 0. Return is strongest at 255 |
| EVs | Blank slots count as 0 and the user does not type 0. Total cannot pass 508. Per-stat cap is 252. Sliders are always scaled 0–252 and still clamp to the remaining total. There is no EV confirmation checkbox, and the old EV preset buttons are gone. Four moves show a Showdown-style suggested spread; applying it sets those EVs and that Nature. |
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
components/recap/            Pokédex card (still artwork, Edit links), save-to-team
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
lib/data/generatableForms.ts  Forms that stay in the catalog but are never rolled
lib/filters/                 Pokémon, move, and item filters from RandomizerConfig
lib/randomizer/              defaults, RNG, engines, custom order, extras, session helpers
lib/builder/                Draft setters, pools, learnsets, move search/sort, item search, ability groups, Showdown EV suggestion, randomizer locks
lib/stats/battleStat.ts     Gen 3+ battle stat formula
lib/session/                 sessionStorage for RandomizerSession
lib/validation/              EV/IV/nature/ability/moves/item/tera/gender/level/shiny/happiness/set (`REQUIRED_MOVE_COUNT = 4`, `MAX_EV_TOTAL = 508`)
lib/showdown/exportSet.ts    One set, and a team paste with a blank line between sets
lib/recap/                   Recap entries (still artwork, item icon, Showdown text)
lib/art/                     pokemonImage: newest still artwork, shiny artwork for shiny Pokémon
lib/teams/                   Team box, localStorage, Showdown team paste, HOME sprite URLs
scripts/import/              Repeatable PokéAPI + @pkmn/dex snapshot, learnsets, form items, Hidden Abilities, model index, genera, and `world-art.ts` (backdrops)
lib/world/                   Which backdrop each route shows (`sceneForPath`, `sceneImages`)
components/layout/scene-backdrop.tsx  The two decorative backdrop layers
public/world/                Compressed official backdrops and `sources.json` (generated, committed)
app/fonts/                   pokemon-solid.ttf (fan-made logo lettering, see the world-theme section)
data/generated/              catalog.json (~4.7MB, version 2.5.0), learnsets.json, form-items.json, hidden-abilities.json, join-report.json, pokemon-art.json, item-icons.json, genera.json
data/cache/pokeapi/          Gitignored HTTP cache
tests/unit/                  Domain tests (Vitest), including `tests/unit/ui/type-colors.test.ts`
tests/e2e/builder.spec.ts    Builder, recap, and saved-team flow (Playwright)
tests/e2e/randomizer.spec.ts Real randomizer flow, including back navigation (Playwright)
tests/e2e/polish.spec.ts     Header, not-found, and narrow viewport (Playwright)
tests/e2e/world.spec.ts      Backdrops, logo titles, Kanit headings, title never covers links (Playwright)
tests/unit/world/            Scene mapping, shipped backdrop files, credits (Vitest)
```

---

## Catalog (do not rebuild, do not hand-edit)

`npm run import:data` already produced the catalog. Current version **2.5.0** includes `evolutionTargetIds`, Showdown item teambuilder categories, latest unique English Pokédex flavor, numeric ability/move/item effects, and moves Showdown marks `Past`.

| Collection | Count |
| --- | --- |
| Pokémon forms | 1316 |
| Species | 1025 |
| Abilities | 310 |
| Moves | 850 (no Z/Max/CAP) |
| Items | 507 (16 Popular, 159 Items, 108 Pokémon-Specific, 29 Usually Useless, 195 Useless) |
| Natures | 25 |

Default **form** pool on `/randomizer` is every base, regional, and other form (about **1230**, plus Meganium and Yanmega once their names are no longer treated as Mega). The on-screen “Pokémon match these filters” count is `matchingPokemonFormCount` (that full list). `matchingPokemonPoolSize` is only how many of those forms can share one roll (about **590**, because overlapping evolution lines count once). Generate and insufficient-pool errors still use `matchingPokemonPoolSize`. Meganium and Yanmega are base forms: `nameImpliesMega` ignores those species names, and `loadGeneratedCatalog` repairs a catalog that stored them as mega.

Re-run `npm run import:data` only when PokéAPI or Showdown source data needs refreshing. After a catalog change, restart `next dev` if the UI still looks old.

Integrity fixtures: Mewtwo (Restricted Legendary), Articuno (Sub-Legendary), Nihilego (Ultra Beast), Walking Wake (Paradox, gen 9), Dragonite (pseudo, stage 2), Pichu (baby, basic), Alolan Raichu (`raichu-alola`, regional, gen 7), Mega Venusaur (`venusaur-mega`, mega, gen 6). Evolution: Charmander → Charmeleon/Charizard; Pikachu includes Alolan Raichu; Silcoon → Beautifly only; Honedge/Doublade/Aegislash overlap; Wurmple splits.

---

## What is already built (do not rebuild)

### Pokémon

- `randomizePokemon` in `lib/randomizer/pokemon.ts`: filter, then unique along overlapping evolution paths. Split branches may appear together (Cascoon with Silcoon or Beautifly, never with Wurmple or Dustox).
- History: `pokemonRolls` newest-first. UI shows **one** generation. Previous / Next walk history. Failed generate and filter changes do not drop stored rolls.
- Filters: per-dropdown Generations, Types, Forms, Evolution stages, Specials. Count 1–12, default 6. Live compatible pool size. Reset.
- Select → optional evolve (`evolvedPokemonId`). Mega / Primal / Gigantamax are not offered as evolve targets. `battlePokemonId` is the evolved form if set, else the selected form.
- Per-card **Re-roll** replaces one option in the viewed generation.

### Ability / Move / Item

Enable extras on the **Randomizer order** list, not the Pokémon tab. Typical order is Pokémon → Ability → Move → Item. Tiles are **drag-and-drop** (keyboard: Space to pick up, Up/Down, Space to drop, Escape to cancel). Use typical order restores the default.

| Extra | After Pokémon | Before Pokémon | Pool |
| --- | --- | --- | --- |
| Ability | Generate, pick one for `battlePokemonId` | Generate a pool; user applies unique abilities; select requires an applied ability | All 310 catalog abilities |
| Move | Generate, pick **four** unique moves | Generate a pool once; apply `movesPerPokemon` (1–4, default 4); leftover unused; empty slots stay empty for the Builder | 849 learnable moves (Struggle stays in the catalog and is excluded by `isLearnableMove`), then Physical/Special/Status and 18 types |
| Item | Generate, pick one or None | Generate a pool; apply unique items (None allowed); select requires an applied item | 507 holdables by Showdown teambuilder category; None is extra, not RNG |

Do not auto-assign extras onto Pokémon in generate order. A before-Pokémon Generate is hidden after the first pool. The ghost button “Clear generated abilities”, “Clear generated moves”, or “Clear generated items” shows only on that step. After the user moves on, the copy is “These abilities/moves/items are already set. Re-roll one to replace it.” `builderAbilityPool` returns usual `abilityIds` when Ability is off, or rolled `abilityOptions` when on.

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
| `canGenerateExtraPool` | Before Pokémon: true only when that options array is empty. After Pokémon: true even when a pool exists |
| `applyAbilityRoll` / `applyMoveRoll` / `applyItemRoll` | Return the same session when a before-Pokémon pool already exists, so a second Generate cannot replace it |
| `clearAbilityPool` / `clearMovePool` / `clearItemPool` | No-op unless `canClearExtraPool`. Before Pokémon: drop the pool, applied ids, and the draft field, then unselect a Pokémon that no longer qualifies. After Pokémon: empty that pool and draft field only. Item clears call `withRequiredFormItem` |
| `passReachedRandomizer` | Seals every enabled extra strictly before the furthest of the current tab and the destination. `"builder"` is after every step. `openRandomizerTab` and `openBuilder` both call it |
| `passedExtras` | Optional on `RandomizerSession` so older `sessionStorage` still parses. New sessions set `[]`. Listed steps cannot be cleared, including after going back |

`draft.itemId === null` means None. `undefined` on applied extras means not applied. `NONE_ITEM_SELECT_VALUE` (`__none__`) is UI-only.

Continue to builder opens `/builder` with the same session. The battle Pokémon, rolled extras, and draft come along. A valid Continue writes `finalizedSet` onto the session and opens `/recap`.

---

## Phase 6 Builder

`/builder` reads the persisted session. Domain updates live in `lib/builder`. UI is `components/builder/set-builder.tsx` plus the ability dropdown, move picker, item picker, and stat sheet.

- Ability: usual `abilityIds` when Ability was skipped, grouped in a dropdown as Abilities then Hidden Ability (`data/generated/hidden-abilities.json`). When the ability randomizer set one, that ability is locked and its effect stays visible.
- Moves: applied randomizer moves stay in that many slots and are locked. Empty slots use every standard move or that Pokémon's learnset (`data/generated/learnsets.json`: level-up, egg, TM, tutor, transfer, and form-change moves, including earlier stages and the form a Pokémon changes from). A form with no learnset of its own uses that form's moves, so Giratina-Origin has Giratina's moves. Rotom-Heat, Zacian-Crowned, and similar forms keep their own move and the rest of the form they change from. Kyurem-Black and Kyurem-White do not inherit Glaciate. The list is not capped. Search matches letters the way a Showdown id does. Rows are single lines of aligned columns (name, type, category, power, accuracy, PP, how it is learned, effect) under a sticky header, and each column heading sorts the current list. In learnset mode, chips for Level-up, TM, Egg, Tutor, and Form filter the list (`lib/builder/learnsets.ts`, compact `moveId:CODES` strings, codes L/M/E/T/V/R). A power of 1 is a variable-damage placeholder and displays as a dash; those dashes sort as the lowest power. Unown's only move is Hidden Power, which is not in the current games, so its learnset is empty.
- Item: a categorized scrollable list matching the item randomizer (Popular items, Items, Pokémon-specific items, Usually useless items, Useless items), with search. Explicit None stays available. A randomizer-chosen item, including None, is locked and its effect stays visible.
- Stats: six rows like the Showdown teambuilder (base bar, EVs, slider, IVs, calculated stat). Formula is official Gen 3+ in `lib/stats/battleStat.ts`. Blank EVs preview as 0. Missing IVs preview as 31. Unset level previews at 100. Shedinja's base HP of 1 stays 1.
- A suggested spread appears once four moves are chosen (Ditto, Unown, and Last Resort can suggest sooner). `suggestEvSpread` in `lib/builder/suggestEvs.ts` follows the Pokémon Showdown teambuilder stat guesser (`BattleStatGuesser`) for Gen 9 with normal EV limits. The role comes from move categories and base stats, plus the ability, item, level, and IVs. It is not a published Smogon set. `data/smogon/gen9-analyses.json` is gone. "Use this spread" fills those EVs and the Nature that matches the plus and minus stats, and does not confirm.
- EVs, Nature, and shiny stay unset until the user sets them, except the suggested spread above. Tera type and mixed gender may stay blank (primary type, random gender). Level starts at 100. A new roll, a different Pokémon, or an evolution clears EVs and Nature. IVs start at 31, with a Showdown IV spreads dropdown. Happiness starts at 255 (0–255). Nickname is optional, max 18 including spaces, and sits above the Pokémon. Spaces stay while typing and count toward 18. A nickname of only spaces is blank. Leading and trailing spaces are removed when the set is saved. Internal spaces stay in the saved set and in the Showdown paste.
- Gender-locked and genderless species do not ask for a gender. `validateSet` fills the only legal gender.
- Live issues come from `validateSet`. Continue to recap stays disabled until the set is valid, then stores `finalizedSet`.

## Phase 7 Recap and saved teams

`/recap` shows one Pokédex-style card for the finalized set. The summary Name line is the nickname, or the species name when there is no nickname. The line under the species name on the 3D name plate is the official English genus from `genera.json` (`npm run import:genera`). There is no separate Species row. Copy to Showdown copies `exportShowdownSet`. Next Randomizer calls `startNextRandomizer()` (`createInitialSession()`) and opens `/randomizer`. It clears rolls, extras, the draft, and `finalizedSet`. It does not clear teams.

**Art is still. There are no 3D models, GLBs, sprite animations, or GIFs for Pokémon anywhere.** `pokemonImage(pokemon, shiny)` in `lib/art/pokemonImage.ts` returns the newest official artwork (shiny artwork for a shiny Pokémon, never regular colors), then HOME, then a sprite as a last resort. The Builder portrait, Recap, Teams, result cards, and evolution choices all use it. `npm run import:art` (`scripts/import/art.ts`) fills every form that the main import left without artwork or shiny artwork (PokéAPI official-artwork or HOME, then Pokémon Showdown `home`/`home-shiny`, then the base form) into `data/generated/pokemon-art.json`, and finds held-item icons (PokéAPI, then Serebii `itemdex/sprites`) into `data/generated/item-icons.json`. `loadGeneratedCatalog` overlays both, and `Item.iconUrl` feeds `ItemIcon`. 494 of 507 items have an icon. The 13 old Gen 2 items without one (berry, bitterberry, burntberry, goldberry, iceberry, mail, mintberry, miracleberry, mysteryberry, pinkbow, polkadotbow, przcureberry, psncureberry) show a generic package icon. The loading screen's pixel sprites and the CSS Pokéball reveal are page chrome, not Pokémon art, and were kept.

`/teams` lists every saved team. From the recap the user can copy the set, save it into the next open slot of the team being viewed, or save it as slot 1 of a new team. The name field in that section is the team on screen (`Team name`, committed on blur or when saving onto that team via `saveSetToActiveTeam`). It is not a name for the next team that does not exist yet. “Save to a new team” still creates the next team under the default name when a team is already open. With no teams yet, the field is “New team name” and that button uses it. Other teams stay intact. There is no limit on the number of teams. Each team holds 6 Pokémon, packed from the front. A team name is at most 24 characters. The Teams page and the line under the dock heading show it. The dock landmark stays “Team”. A Pokémon can be copied onto another team by dragging (`text/plain` is `teamId:index`) or “Copy to a team”. Copying onto the same team is refused. A drag that is only a slot index is not a cross-team drop. Edit on a slot, or Edit on a part of that slot’s recap, opens the Builder for that saved set and writes valid changes back onto the slot.

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
- Type chips live in `components/type-colors.ts` and meet 4.5:1. The Pokédex title bar uses dark text on the orange bar. A lowered Nature stat uses `#ffc4c4`. `prefers-reduced-motion` shortens CSS animation. The font uses `display: "swap"`.
- Filter summaries use an explicit `role="button"` and `aria-expanded`. Current Chromium no longer exposes a plain `<summary>` as a button, and the randomizer tests open those filters by that role.
- Each randomizer tab except the first shows an outline **Back to …** button for the previous enabled tab, including Pokémon when an extra randomizer is ordered before it. Recap always links **Back to the builder** without clearing the session. Builder links **Back to the randomizer** at the top and bottom of the form.

Do not start the later features unless asked.

## Battle Laboratory design overhaul (merged)

Source: `Downloads/Final Master Design Overhaul Prompt.md`. Decisions: one phase at a time, light + dark themes, no new packages (`vaul` and `cmdk` are not added; use `@base-ui/react`), every type chip must stay at 4.5:1 or better.

- **Phase 1 done:** design tokens in `app/globals.css` (surfaces, accents, status, fluid spacing, `text-h1` / `text-h2`). The dark theme uses the new palette; light keeps the warm palette. Fonts are Geist Sans and Geist Mono. `TYPE_COLORS` uses the directive hues with the higher-contrast text color per chip. Live counters and stat cells use `font-mono tabular-nums`.
- **Phase 2 done:** root layout is a grid capped at 1800px. From `lg` the team dock (`TeamDockRail`, `components/teams/team-dock.tsx`) is a right rail of 300–360px. Below `lg`, `MobileDockBar` (`components/layout/mobile-dock-bar.tsx`) is a fixed bottom bar: phones get the four page links there (the header keeps only the brand), and every size under `lg` gets a Team button that opens the roster in a slide-up native `<dialog>`. The roster reads and writes the same `TeamProvider` storage as `/teams`: six slots, drag to reorder, Up/Down buttons as the keyboard path, active-team select, and Copy team. The dock gets names, types, and sprites from the server action `loadDockPokemon` and the paste from `exportTeamText` (`lib/data/dockPokemon.ts`), so the catalog is not sent to every page. Tests: `tests/e2e/dock.spec.ts`, `clampToFilledSlot` in `tests/unit/teams/teams.test.ts`.
- **Phase 3 done:** Build Lab. `StatSpreadSheet` shows an "EVs used n / 508" progress bar (`role="progressbar"`) and four presets plus Clear all EVs (`lib/builder/evPresets.ts`, `applyDraftEvPreset`, `clearDraftEvs`). Presets fill EVs only: they do not confirm and do not set a Nature. Moves, held item, and ability use one shared `components/builder/command-palette.tsx` (native modal `<dialog>`: centered on wide screens, full-height sheet on phones; ARIA combobox search with Up/Down/Enter/Escape; no `cmdk`). On a phone the sheet is the height of the visible viewport (`phoneSheetFrame` in `components/builder/phone-sheet.ts`), including the space above the keyboard, so the choices stay on screen. The search box is focused on wide screens and waits for a tap on a phone. Move rows show type badge, category icon, Pow, Acc, PP, and a STAB tag (`lib/builder/stab.ts`, own types only, not Tera). The old always-open move table and its column-sort headers became a Sort row inside the palette. Triggers are buttons named `Choose move N`, `Held item: …`, and `Ability: …`. Tera type is a radio group of elemental chips (`tera-type-picker.tsx`) with a check mark on the chosen one. Nature labels use Showdown stat names, for example `Jolly (+Spe, −SpA)`, plus a "Raises … lowers …" line. Tests: `tests/e2e/build-lab.spec.ts`, `evPresets.test.ts`, `stab-ability-search.test.ts`.
- **Not in Phase 2:** the sticky mobile action bar for Generate / Add to Team / Copy Showdown (needs the Phase 3–4 screen refactors), loading a saved set back into the builder, and the live Showdown text and coverage matrix in the rail (Phase 5). The tablet filter-left / preview-right layout and the ultrawide four-pane layout belong to Phases 3–4.
- **Phase 4 done:** randomizer pipeline. `randomizer-flow.tsx` renders stage cards (handle, order badge, icon, hint, On/Off pill, dashed when skipped, connector line); drag and keyboard reorder logic and accessible names are unchanged. The filter dropdowns are now always-open `FilterGroup`s (`filter-group.tsx`, renamed from `filter-dropdown.tsx`) with chips. `ToggleChip` has a transparent native checkbox over the whole chip and a check icon when selected; pass `type` for an elemental chip (Types and Move types). Generate buttons go through `components/randomizer/staged-generate.tsx`: three ~220ms steps of status text (`role="status"`), then the roll. This is cosmetic, since generation is synchronous. It is skipped under `prefers-reduced-motion`, and the buttons use `aria-disabled` so focus is kept. Pokémon result cards use `TypeBadge` and a radial type glow (`typeGlow` in `components/type-colors.ts`, alpha capped at 0.2). Playwright now runs with `reducedMotion: "reduce"` by default, and the staged-feedback tests opt back in.
- **Not in Phase 4:** Move/Item/Ability result cards have no type glow (only Pokémon cards do). Re-roll buttons stay instant.
- **Phase 5 done:** Showdown sync, analysis, and the a11y pass.
  - **Import:** `lib/showdown/parseSet.ts` (pure text parser, `showdownId`) and `lib/showdown/importTeam.ts` (`previewShowdownImport` resolves names to catalog ids and runs `validateSet`). A set is only accepted when the paste has Ability, Nature, Tera Type, one to four moves, and (M)/(F) for species with both genders. The import is stricter than the Builder on Tera and gender on purpose: a paste is never auto-filled. This follows the "never auto-assign Nature, Tera, gender" rule, so many third-party pastes need a line or two added. The error list says which. Defaults are Showdown's own: no EVs line means 0 EVs, no IVs means 31, level 100, not shiny, happiness 255 (this app's default), no `@` means no item. EVs over 508 are rejected with the builder's message. Ability must be one of the Pokémon's abilities or its Hidden Ability. Moves are not checked against learnsets (the builder allows every move). Max 6 sets, 20,000 characters.
  - **Server functions:** `lib/data/teamTools.ts` (`"use server"`): `loadTeamDetails(sets)` returns each member's types and moves plus the Showdown text, and `readShowdownPaste(text)` returns the import preview. The catalog stays on the server.
  - **Dialog:** `components/teams/showdown-dialog.tsx` is a native modal `<dialog>`: export (live textarea plus Copy) next to import (paste, Read paste, per-Pokémon Ready/Needs changes list, Add to active team or Save as a new team). It is opened from `components/teams/team-tools.tsx`, which sits in `TeamRoster` (rail and phone sheet). Saving uses `importSetsToTeam` in `lib/teams/teams.ts` (all or nothing). Initial focus uses `data-autofocus`, because React's `autoFocus` runs while the dialog is still closed.
  - **Type chart:** `data/generated/type-chart.json` is generated from Pokémon Showdown (`npm run import:type-chart`, `scripts/import/type-chart.ts`). `lib/analysis/typeChart.ts` (`damageMultiplier`) and `lib/analysis/teamAnalysis.ts` (`analyzeTeam`) are pure. Defense counts weak/resist/immune per attacking type for each member. Offense lists the team's damaging moves that are super effective against each type, and reports gaps. It uses the Pokémon's own types and move types only: no abilities (Levitate, Flash Fire…), items, or Tera types. The panel says so. The tables are `components/teams/team-analysis.tsx`, and every cell has text, not just color. The "Type analysis" and "Showdown text" disclosures in the rail are native `<details>` and load as soon as the roster changes.
  - **A11y:** `tests/e2e/a11y.spec.ts` with `a11y-helpers.ts`. It checks landmarks and the skip link on every route, a real-browser contrast scan (4.5:1, 3:1 for large text) of the rendered text on `/`, `/randomizer`, `/teams`, `/recap`, the Build Lab with the move palette open, and the Showdown dialog, in light and dark. It also tabs through each page and requires an outline or ring on every stop, and checks that the dialog keeps focus and returns it. Findings fixed: the light-mode destructive text (Clear team, Remove) was 3.86:1 on its tinted background, so `--destructive` is now `oklch(0.505 0.2 27)`. The 18 type pills were already covered by `tests/unit/ui/type-colors.test.ts`. Not covered: text over gradients or images (the Pokémon card glow is capped at 20%), and no screen reader was run, since the checks are role and name based.
  - **Test notes:** Playwright's first team lookup compiles the server function on a cold dev server, so the first matrix assertions wait up to 20s. `tests/e2e/helpers.ts` has `waitForHydration` for clicking Generate before React attaches.
- **Not done:** the sticky mobile action bar for Generate / Add to Team / Copy Showdown, the tablet and ultrawide multi-pane layouts, and the coverage matrix on the `/teams` page (it lives in the rail and phone sheet). Loading a saved set back into the Builder is done (see tester feedback part 2).
- **Design overhaul status:** Phases 1–5, Round 2, and the follow-ups are all merged.
- **Round 2 (after browser review, merged).** These supersede the matching Phase 3 and Phase 4 notes above (EV presets, EV confirmation, always-open filters, Tera radio group):
  - **Loading screen:** `components/layout/loading-sprites.tsx` runs seven pixel GIFs (`public/loading-sprites/*.gif`, shipped locally) across `RouteNotice`. Decoration only (`aria-hidden`); with reduced motion they stand in a row.
  - **Randomizer filters:** collapsible `FilterDropdown`s again (`components/randomizer/filter-dropdown.tsx`, native `<details>`), with `FilterToolbar`, `ToggleChip`, and `toggleFilterValue`. `openFilter` in `tests/e2e/helpers.ts` opens one.
  - **Pokéball reveal:** `lib/randomizer/ball.ts` (`ballForPokemon`): Master Ball for Restricted Legendary, Sub-Legendary, Mythical, Paradox, and Ultra Beast; Luxury Ball for pseudo-legendaries; otherwise BST ≥ 500 Ultra, ≥ 400 Great, else Poké Ball. `components/randomizer/pokeball.tsx` (`PokeballReveal`, `BallBadge`) plays a CSS-only throw, wiggle, and release (about 2 s per card, 70 ms stagger), once per card key (`playedKeys`), with the card `inert` until it opens. Reduced motion shows cards at once. Each card shows its BST and ball.
  - **Pokédex generations:** `npm run import:dex-entries` writes `data/generated/dex-entries.json` (`Record<speciesId, [generation, versions[], text][]>`). `loadDexEntries` (`lib/data/dexTools.ts`, a Server Function) feeds `useDexEntries`, and `components/dex/dex-entry-cycler.tsx` steps older/newer and jumps by generation. Used on randomizer cards and the recap card.
  - **Builder:** Abilities / Hidden Ability group headers are darker and bolder. Tera type is a dropdown. EV presets and the EV confirmation checkbox were removed (`evsConfirmed` no longer exists). The IV spreads dropdown matches Showdown. Level defaults to 100. The item picker's empty-item icon is fixed. The move picker is in columns with a learn-method filter (see Phase 6).
  - **Recap artwork (replaced):** the 3D model and its still artwork were removed. The recap always shows still artwork.
  - **Shiny rolls:** `RandomizerConfig.shinyChance` is a percent from 0 to 100 (default 1, `MIN/MAX/DEFAULT_SHINY_CHANCE` in `defaults.ts`, a "Shiny chance" box in the Pokémon filters, restored to 1 by Reset filters). `rollShinyIds` (`lib/randomizer/shiny.ts`) rolls each Pokémon on its own, using a separate seeded stream (`${seed}:shiny`), so it never changes which Pokémon are picked. `randomizePokemon` and `rerollPokemon` return `shinyIds`. The roll is stored as `PokemonRoll.shinyPokemonIds` (missing in old sessions means not shiny), and `replaceRolledPokemon(session, prev, next, nextIsShiny)` re-rolls it for a replaced card. A shiny card shows the shiny artwork and a "Shiny" badge with a sparkle icon. Selecting it, evolving it, or keeping it selected through a new roll starts the draft with `shiny: true` (`freshTraining(draft, rolledShiny)`); the user can still change it in the builder. An out-of-range chance shows an inline alert, and `InvalidShinyChanceError` carries a plain-language message. `parseStoredSession` fills in defaults for config keys missing from an older saved session.
  - **Teams page:** has the same Next Randomizer button as the recap (`components/session/next-randomizer-button.tsx`).
  - **Tests:** `tests/e2e/battle-lab-round-two.spec.ts` (loading sprites with JS off, ball reveal with motion on, dex cycler on both pages, still artwork with a stubbed empty GLB, Teams button), plus `ivPresets`, `learnsets`, `ball`, `dex-entries`, and `fallback-image` unit tests.
  - **Follow-ups after Round 2:**
    - Level and Happiness use `components/builder/number-input.tsx` (local text state, so the box can be cleared and retyped; valid numbers commit as typed and the last good value returns on blur). A plain controlled input would snap back because `SessionProvider` applies `applyBuilderDefaults` on every render.
    - Regional and other forms are on by default (`formTypes`); Mega, Primal, and Gigantamax stay off.
    - Starting a build for a different Pokémon resets Tera type, gender, shiny, and nickname (`freshTraining`), see Shiny rolls.
    - **Shiny display:** every picture uses `pokemonImage(pokemon, shiny)`: shiny artwork first for a shiny Pokémon, so Basculegion and every other form show the right colors (`tests/unit/art/pokemonImage.test.ts`).
    - Teams art for a shiny set: `lib/teams/sprites.ts` candidates are HOME shiny, shiny sprite, shiny artwork, artwork, sprite.

## Pokémon world theme (merged, PR #9)

Look-and-feel only. No behavior, data, or route changed.

- **Backdrops:** official art and screenshots from Pokémon Legends: Z-A and Pokémon Scarlet / Violet, taken from Bulbagarden Archives. No fan-made art. `npm run import:world-art` (`scripts/import/world-art.ts`, uses `sharp`, now a devDependency because Next already installs it) downloads each file, caches the originals in `data/cache/world-art/` (gitignored), and writes compressed WebP to `public/world/` with `sources.json` crediting each file. The browser only loads these local files.
- **Scene per route:** `lib/world/scenes.ts` (`sceneForPath`, `sceneImages`): `/` home, `/randomizer`, `/builder`, `/recap`, `/teams`, and any unknown URL uses the `lost` scene. Light and dark themes each have an image (light = daytime art, dark = night art) chosen by `prefers-color-scheme` in `app/globals.css`. Change which art a page uses in `SCENES` in the importer and the matching `.scene-*` rules, then re-run the import.
- **Layers:** `components/layout/scene-backdrop.tsx` renders two decorative (`aria-hidden`) layers from one image. `.scene-world` is a fixed layer under an 89% page-color scrim. `.scene-banner` is a vivid strip at the top, masked to fade out before the content, with a per-scene `--banner-height`. The body is `relative` for it. The dock rail, mobile bar, header, and footer are frosted (`bg-card/85–90 backdrop-blur`).
- **Title panels:** `.hero-panel` (frosted card with a red, gold, and blue top stripe) holds each page's title block and every `RouteNotice`, so headings and intro text never sit directly on art. Put new page titles in one.
- **Type:** two display faces, no new package.
  - **Page titles (`h1`) and the header brand** use **Pokémon Solid** (`app/fonts/pokemon-solid.ttf`, `next/font/local`, `--font-logo`), set as yellow `#ffcb05` letters with a blue `#3b4cca` outline (`-webkit-text-stroke`, `paint-order: stroke fill`) through the unlayered `h1, .logo-type` rule in `globals.css`. The user chose this on purpose. It is a **fan-made** copy of the Pokémon logo lettering (the logo is custom artwork, not a font). It came from dafont.com, whose page shows no clear licence, so treat it as unlicensed: to drop it, delete the font file, the `localFont` block in `app/layout.tsx`, and the `h1, .logo-type` rule; titles then fall back to Kanit. It has one weight (never ask for bold; `font-synthesis: none`), and the `ascent/descent-override` declarations in `layout.tsx` are required: its Windows metrics are about 2.9× the letter height and otherwise each title's click area covers the link above it (see `a page title never covers the link above it` in `world.spec.ts`).
  - **Smaller headings (`h2`–`h4`), tabs (`[role="tab"]`), and the primary navigation** use Kanit (`--font-display`, `next/font/google`). Body text and numbers keep Geist. `font-heading` maps to Kanit.
  - The contrast scan in `tests/e2e/a11y-helpers.ts` accepts either the fill or the outline of outlined text, because the outline carries the contrast on light panels and the fill on dark ones.
- **Brand:** the header shows the existing `PokeballIcon` beside the name and a red bottom border. The footer credits the art to Nintendo, Creatures Inc., and GAME FREAK inc.
- **Tests:** `tests/unit/world/scenes.test.ts` (mapping, every image shipped and under 400 KB, stylesheet points at the same files, every source is an official game on Bulbagarden Archives) and `tests/e2e/world.spec.ts` (scene per route, hidden from assistive tech, light and dark images, local origin only, Kanit on headings and nav). The existing contrast scans in `a11y.spec.ts` still pass.
- **Small page changes in the same PR:** the recap title is "Pokémon Recap" (capital R), and the Teams page has a **Back to the recap** outline button at the top of its title panel (tests in `tests/e2e/builder.spec.ts`).
- **Not done:** the Pokémon cards are unchanged. No type-themed backdrop for the selected Pokémon, no sound, no animated art.

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
- Do not add the full `pokemon-showdown` simulator package to the client. The gitignored clone in `reference/pokemon-showdown/` is the reference copy.
- Natures have `pokeApiSlug` (dual-write rule). Do not remove it.
- Next.js 16 may rewrite the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of `AGENTS.md`. Keep the Pokémon Randomizer rules below that block.
- `data/cache/pokeapi/` is gitignored. Safe to keep locally; do not commit.
- `node_modules.bak` (if present) is a leftover Vite install; gitignored; safe to delete.
- PowerShell: chain commands with `;`, not `&&`. A git commit message cannot use a bash heredoc here; write a message file and use `git commit -F`.
- The fixed Team button on the mobile dock can cover Generate, Continue, and the randomizer tabs. Scroll the control into view before clicking it.

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

> Continue the Pokémon Randomizer. Read `handoff.md` and `AGENTS.md`. You are on `master`. Phases 1–8, the Battle Laboratory overhaul, tester feedback through part 2, form learnsets with required held items, battle-only forms with restored moves, the Struggle exclusion, and the before-Pokémon pool lock are on `master`. The format, custom-type, and singles-battle work is still uncommitted. Do not start learnset-only pools, competitive pools, accounts, or a six-Pokémon randomizer unless I ask. Do not commit unless I ask.

## Tester feedback round (merged in PR #10)

- **Builder order:** Nickname, Shiny, portrait, Ability, Moves, Held item, Stats, then Tera type / Gender / Level / Happiness. Each section has an id (`nickname`, `shiny`, `ability`, `moves`, `move-N`, `item`, `stats`, `nature`, `tera-type`, `gender`, `level`, `happiness`).
- **Recap to Builder links:** see the `/recap` paragraph above.
- **Moves:** one to four. `validateMoves`, `MIN_MOVE_COUNT`, `MAX_MOVE_COUNT`, `PokemonSet.moveIds: string[]`, team storage, and Showdown import/export all follow.
- **Locks:** `lib/builder/locks.ts`. Applied moves, abilities, and items are locked in the Builder. `pendingRandomizerSteps` lists enabled steps that have not given this Pokémon its part. While any is pending the Builder shows "Finish the randomizer first" with a link, hides the pickers for those parts, and disables Continue to recap.
- **Evolution:** `evolutionChoices(selected, formById, allowedStages)` only offers selected stages. Evolutions are offered only when Basic, Stage 1, and Stage 2 are all selected (evolutionChoiceAllowed). Otherwise nothing is offered and the Evolution panel says so. `resetDisallowedEvolution` runs when the Evolution stages filter changes.
- **Order change:** `applySessionConfig` moves `tab` to `firstOpenRandomizerTab` when the first step changes.
- **Wording:** "forms" everywhere (the importer's singular `forme` keys are unchanged), "suggested spread" instead of "guessed spread".
- **Tests added:** `tests/unit/builder/blank-fields.test.ts`, `tests/unit/randomizer/order-and-evolution.test.ts`, `tests/unit/art/pokemonImage.test.ts`, more cases in the recap, validation, import, teams, and catalog-integrity tests, and `tests/e2e/tester-feedback.spec.ts`.

### Follow-up round (merged, PR #11)

- **Scroll:** reordering randomizers no longer scrolls to the top. pokemon-randomizer.tsx sets keepScrollRef for config-driven tab changes and the scroll effects skip once.
- **Evolution:** needs all three stages selected (Basic + Stage 2 alone does not unlock it).
- **Move locks:** moveSlotLockedByRandomizer compares each draft slot with the applied move for the selected Pokémon, so hand-picked moves stay editable after a Recap round trip.
- **Recap:** `recapEditAccess(session)` gives PokedexCard which parts are editable. Randomizer-set ability, item, and moves show no Edit link (moves say Set by randomizer). Move Edit links use the real Builder slot number.
- **Tests:** new cases in `tests/unit/randomizer/order-and-evolution.test.ts`, `tests/unit/builder/blank-fields.test.ts`, and `tests/e2e/tester-feedback.spec.ts`.

### Move pool follows the current games (merged, PR #12)

- `isCatalogMove` (`scripts/import/showdown.ts`) keeps moves Showdown marks `Past` (removed from the current games, e.g. Spider Web, Hidden Power, Return, Hail). Z-Moves, Max moves, CAP, Custom, Future, and Let's Go moves stay out. After changing this filter run `npm run import:data` then `npm run import:learnsets`.
- Moves Showdown marks `Unobtainable` (Power Shift, Cut, the Torque moves, and so on) are still in the catalog. Say so if they should go too.

### Ditto tab icon (merged, PR #13)

- `app/icon.png` is the still icon: Ditto's official Pokémon HOME picture as a face icon (outline, Ditto's dot eyes and flat mouth). Regenerate with `npm run import:ditto-icon` (uses `sharp`, needs the network and `data/generated/catalog.json`).
- When the user selects a Pokémon on `/randomizer` (not when they generate), `DittoFavicon` (`components/randomizer/ditto-favicon.tsx`, `selectionKey` is the selected id) loads Ditto's HOME picture (`faceIconImageCandidates`) and that Pokémon's official artwork (`pokemonImageCandidates`) through `/_next/image` (same origin, so the canvas can read it). Ditto is the face icon; the Pokémon is `fitStillPicture` (whole artwork, contain-fitted, no head crop). It swaps the `<link rel=icon>` href every 80 ms, melts Ditto into the artwork and back, then restores the original href. A selection already present on page load does not animate.
- `lib/art/faceIcon.ts` still builds the still Ditto icon (`buildFaceIcon` whole + `paintOut` / `drawFace`). `lib/art/dittoMorph.ts` has the timeline and the blending. Nothing about a Pokémon is invented. Trozei / Battle Trozei badge sprites are not used.
- Tests: `tests/unit/art/faceIcon.test.ts`, `tests/unit/art/dittoMorph.test.ts`, `tests/e2e/ditto-favicon.spec.ts`. Playwright config sets `reducedMotion: reduce`, which turns the animation off, so animation tests call `page.emulateMedia({ reducedMotion: "no-preference" })`.
- Ideas not built: blink, animate on single re-rolls.

### Tester feedback, part 2 (merged, PR #14)

- **Filter count:** The line uses `matchingPokemonFormCount` (every matching form). With the default filters that is the base, regional, and other forms, including Meganium and Yanmega. `matchingPokemonPoolSize` (about 590) is only how many of those forms can share one roll, and the UI mentions it when the requested count is larger than that ceiling. `nameImpliesMega` does not treat Meganium or Yanmega as Mega. `loadGeneratedCatalog` repairs a catalog that stored them as mega. Do not rewrite `catalog.json` for that.
- **Off randomizers:** An off step ordered before Pokémon shows no dropdown and does not block the Builder. Turning a randomizer off mid-session hides its dropdown and keeps the generated pool. Turning it back on shows that pool. Before-Pokémon ability, move, and item controls also render on the Pokémon page. Their tabs stay. Generate again in the same session does not wipe filters.
- **Stats:** Each result card and each evolution choice shows HP, Attack, Defense, Special Attack, Special Defense, and Speed (`components/randomizer/base-stat-line.tsx`). Evolution choices also show BST.
- **Pokédex chips:** Labeled “Pokédex” / “Pokédex entry from generation N”.
- **Team names and copying:** See the `/teams` paragraph above. `renameTeam` refuses a blank name.
- **Edit a saved Pokémon:** `openSavedSetInBuilder` (`lib/builder/saved-set.ts`) loads that set into the Builder and sets `RandomizerSession.editingTeamSlot` (`{ teamId, index }`, 0-based). While it is set, ability, item, and move locks from the randomizer are off and `pendingRandomizerSteps` is empty, so a finished set stays editable even when randomizers are on. A form that must hold one item is the exception: that item stays locked (`itemLockedByForm`, `savedSetEditAccess.item`). `savedSetEditAccess` turns on Edit for the ability, the item (unless the form requires it), and each saved move. Ability choices are the species’ usual abilities plus the current ability when it is outside that list. Item choices are the full catalog plus the current item when it is missing. A valid `validateSet` result is written back with `replaceSetOnTeam` when the set actually changed. Blank gender is not invented during that sync. A new roll, a different selected Pokémon, an evolution, Clear generated Pokémon, or Next Randomizer clears `editingTeamSlot`, so a new roll cannot overwrite the team.
- **Recap name field:** On “Save to a team”, the field names the team being viewed. `saveSetToActiveTeam` renames that team and then fills its next slot. “Save to a new team” does not reuse that field once a team exists.
- **Phone picker:** `phoneSheetFrame` (`components/builder/phone-sheet.ts`) sizes the ability, move, and item dialog to the visible viewport at `max-width: 639px`, including the space above the keyboard. Search is focused on a wide screen and waits for a tap on a phone.
- **Reset and presets:** “Reset to defaults” and Next Randomizer call `createInitialSession()`. Presets (`lib/randomizer/presets.ts`, `localStorage` key `pokemon-randomizer.presets.v1`, at most 20, name at most 24) save randomizer config and filters with the seed removed. Applying one uses `applySessionConfig` and does not restore generated pools.
- **Tests:** `tests/unit/randomizer/presets.test.ts`, `tests/unit/builder/phone-sheet.test.ts`, `tests/unit/builder/saved-set.test.ts`, plus cases in the teams, session, classify, and catalog tests. `tests/e2e/tester-feedback.spec.ts` includes a phone-width picker check.

### Form learnsets and required items (merged, PR #15)

- **Learnsets:** `scripts/import/learnsets.ts` follows Showdown's learnset chain. A form with an empty learnset (Giratina-Origin, Dialga-Origin, Palkia-Origin, the Arceus plates, Shaymin-Sky, the Forces of Nature Therian forms, and the rest of that list) uses the form it changes from, including earlier stages. A form that only adds a move (Rotom-Heat's Overheat, Zacian-Crowned's Behemoth Blade, code `R`) keeps that move and the rest of the parent learnset. Kyurem-Black and Kyurem-White do not inherit Glaciate. Re-run `npm run import:learnsets` after changing this. Unown's learnset is Hidden Power.
- **Held item:** `npm run import:form-items` writes `data/generated/form-items.json`. Selecting an Other form or Mega Evolution that must hold an item sets that item on the draft and locks it (`withRequiredFormItem`, `itemLockedByForm`) until a different Pokémon is selected. The builder, the recap Edit link, and the item randomizer all respect the lock. Plates, orbs, masks, drives, and memories win over a Z-Crystal when both are listed. A Mega uses its Mega Stone. Mega Rayquaza has no stone. 97 forms are in the file, including Giratina-Origin → Griseous Core and Venusaur-Mega → Venusaurite.

### Battle-only forms and restored moves (merged, PR #16)

- **Not generated:** `isGeneratablePokemon` (`lib/data/generatableForms.ts`) is applied inside `filterPokemonForms`, so the match count and the roll use the same pool. The forms stay in the catalog. A roll never returns Cosplay Pikachu or a Pikachu with a cap (including the Alola cap), Castform Sunny, Rainy, or Snowy, Darmanitan Zen Mode, Galarian Darmanitan Zen Mode, Meloetta Pirouette, Wishiwashi School, Mimikyu Busted, Cramorant Gorging, Cramorant Gulping, Eiscue Noice, Morpeko Hangry, Eternatus Eternamax, or Palafin Hero. The base form still can be rolled. Zen Mode, Relic Song, Hunger Switch, Zero to Hero, Forecast, Schooling, Disguise, Gulp Missile, and Ice Face still change that Pokémon during a battle. Vivillon rolls are Meadow, Fancy, and Poké Ball. Other Vivillon patterns are cosmetic and are already left out of the catalog; any other Vivillon id is blocked too. Pikachu, Pikachu-Gmax, and Alolan Raichu still roll.
- **Past moves:** `isCatalogMove` keeps moves Showdown marks `Past` (removed from the current games). Catalog version **2.5.0** has 850 moves. Z-Moves, Max moves, CAP, Custom, Future, and Let's Go moves stay out. Hidden Power's type entries share Showdown's id `hiddenpower`, so each catalog id is the name (`hiddenpowerfire`) and `showdownName` stays `Hidden Power Fire`. A Pokémon that learns Hidden Power also gets each type on its learnset, with the same learn methods. Unown's learnset is Hidden Power. The type entries have no English effect text, so their description is empty; type, power, accuracy, and PP come from Showdown. After changing this filter, run `npm run import:data` then `npm run import:learnsets`.

## Struggle and before-Pokémon pools (on `master`)

Direct commits after pull request #17. Do not rebuild them. The same rules are in `AGENTS.md` and `DATA_MODEL.md`.

### Struggle (`b49faff`)

Struggle stays in `catalog.json` (`id` `struggle`). `isLearnableMove` (`lib/filters/moves.ts`) keeps it out of the move randomizer, All Moves, and each Pokémon's moveset. `builderMovePool` and `validateMoves` use that check. The validation code is `moves.struggle`, and the message is “Struggle is used when a Pokémon is out of PP. It cannot be one of its moves.” The default move pool is 849. The catalog count stays 850. `{ kind: "struggle" }` in `lib/battle/singles.ts` is the choice used when a Pokémon is out of PP. Leave that choice in place.

### Generate once, then clear only on that step (`2d7edc2`)

If Ability, Move, or Item runs before Pokémon, the first Generate creates the pool and later Generate does not replace it. `canGenerateExtraPool` (`lib/randomizer/flow.ts`) is true for a before-Pokémon step only when that options array is empty. `applyAbilityRoll`, `applyMoveRoll`, and `applyItemRoll` return the same session when that pool already exists. Re-roll still replaces one result through `replaceRolledAbility`, `replaceRolledMove`, and `replaceRolledItem`. A step that runs after Pokémon can be generated again for the current Pokémon.

“Clear generated abilities”, “Clear generated moves”, and “Clear generated items” match “Clear generated Pokémon”, and they appear on the step’s own tab and on the copy embedded in the Pokémon page. `canClearExtraPool` is false when `passedExtras` already lists the step, when the step is disabled, when that step comes before the current tab, or when the pool is empty. `passReachedRandomizer` seals every enabled extra strictly before the furthest of the current tab and the destination. `openRandomizerTab` calls it, then sets the tab. Opening the same tab, or a tab that cannot be opened, returns the original session and does not seal anything. `openBuilder` (`lib/builder/draft.ts`) calls it with `"builder"`, which counts as after every step, so every enabled extra is sealed. Going back does not restore Clear. “Clear generated Pokémon” is unchanged and still keeps before-Pokémon pools.

Clearing a before-Pokémon pool drops that options array, clears the applied ids on stored rolls, clears the matching draft field, and unselects a Pokémon that required those extras (`withSelectionMatchingAppliedAbility`, `withSelectionMatchingAppliedMoves`, `withSelectionMatchingAppliedItem`). Unselecting for a missing ability also clears the draft item. Unselecting for missing moves also clears the draft ability and item. The item matcher clears the selection and the draft item. Clearing an after-Pokémon pool empties that options array and draft field only, and the selected Pokémon stays. Item clears go through `withRequiredFormItem`.

`passedExtras` is an optional `Array<Exclude<RandomizerTab, "pokemon">>` on `RandomizerSession`, so a session saved before this field existed still loads. `createInitialSession` sets `passedExtras: []`. The storage key is still `pokemon-randomizer.session.v1`.

`AbilityResults`, `MoveResults`, and `ItemResults` take `canGenerate`, `canClear`, and `onClear`. While the pool is set and Clear is still allowed, the message says the results are already set and mentions Clear. After the user has moved on, Generate and Clear are both hidden and the message is “These abilities/moves/items are already set. Re-roll one to replace it.” The Generate handlers also return early when `canGenerateExtraPool` is false.

Tests: `tests/unit/randomizer/flow.test.ts`, `tests/unit/randomizer/session.test.ts`, and the ability-first, move-first, and item-first cases in `tests/e2e/randomizer.spec.ts`. Struggle is covered in `tests/unit/filters/moves.test.ts`, `tests/unit/builder/draft.test.ts`, `tests/unit/randomizer/moves-catalog.test.ts`, and `tests/unit/validation/set.test.ts`.

## Draft team of six

One roster lives on `TeamBox.draftRoster` in the same `pokemon-randomizer.teams.v1` save. It is not part of `SavedTeam.sets`, because export, the battle lab, and team analysis need a finished `PokemonSet`. Each slot is a `DraftedPokemon` (the snapshot plus the lock record from the moment it was added) or a finished set. When all six slots are finished sets, the roster is promoted to a normal team with the same id and name, and `draftRoster` is removed. Invalid roster data is dropped. Finished teams in the same save are kept.

`draftedPokemonFromSession` refuses the add when there is no battle Pokémon or `pendingRandomizerSteps` is not empty. It stores the species, the ability if one is set, the item including explicit none, shiny only when true, four move slots, and the lock flags. `addDraftToRoster` refuses a seventh Pokémon and refuses an add after any slot is already built. The team name is the first unused `Team N`. `removeDraftFromRoster` works only while every slot is still a draft. `writeBuiltDraft` replaces one slot. If the roster is already gone, a later save goes through `replaceSetOnTeam`.

`RandomizerSession.buildingDraft` points at the open slot. `draftLocks` is the stored lock record. `pendingRandomizerSteps` returns nothing while `buildingDraft` is set, so a missing ability does not look unfinished if abilities were turned on later. `openDraftInBuilder` clears rolls and option pools, loads the snapshot, and applies builder defaults. `editingTeamSlot` is a different path: editing a finished saved set still turns locks off. Opening the builder for a new one-off build, rolling a new Pokémon, or opening a saved set clears `buildingDraft` and `draftLocks`.

`nextRollKeepingConfig` keeps filters, enabled steps, order, and shiny chance, and clears the roll. Recap **Next Randomizer** still calls `startNextRandomizer()` and resets settings. Duplicate species are allowed. Evolution-path uniqueness stays per roll.

The phone Team button counts roster slots while a roster exists. The dock shows the roster until the user pins a finished team. Any roster change drops that pin. Copy uses the built slots only.

Tests: `tests/unit/teams/draftRoster.test.ts` and `tests/e2e/draft-team.spec.ts`.

## Formats, custom Pokémon, and the damage check

This is on `master` with the draft team and the level-100 default. The Randomizer flow is unchanged. `/formats` explains presets transcribed from Showdown `config/formats.ts` and `data/rulesets.ts` at snapshot `7244fe8e28fa8bc4d0809ae30d183c608b62bb2b`. `/battle` edits a copy and previews one hit. Presets are locked. User formats are in `localStorage` (`pokemon-randomizer.formats.v1`).

Custom types and custom base stats live on `PokemonSet`. The catalog species is not edited. A battle snapshot copies the effective values, so two checks can disagree about the same species. The format allows or rejects those overrides. It does not rewrite them.

Shiny is still cosmetic. `shinyChance` only affects rolls. The Builder can mark any set shiny. A format's shiny policy is a separate allow or forbid. The Builder hides the typing picker and the base-stat picker until the user turns that change on for the Pokémon being built. A set that already has custom types or custom base stats opens with that picker on. Turning it off clears the override.

The damage check follows Showdown's generation 9 order for base damage, the 85–100 roll, the 4096 same-type modifier, and type effectiveness. Immunity stays 0. That preview still omits abilities and items.

`/battle` can also play a generation 9 singles battle from those same copied stats. Turns, switching, fainting, Choice lock, Levitate, Huge Power, Pure Power, Choice Band, Choice Specs, Choice Scarf, and Life Orb are applied. A critical hit is 1 in 24 and uses Showdown's `trunc(base * 1.5)` before the damage roll. The damage preview still leaves critical hits out. Moves that crit more often in the games use the same 1-in-24 rate, because the catalog does not store a critical-hit ratio. Weather, status, stat stages, other abilities and items, AI, online play, replays, banlists, and doubles are not. The log says which of a Pokémon's abilities and items were left out.

Showdown's paste has no fields for custom types or base stats. `exportShowdownSet` leaves them out. `customAttributeNote` explains that on the recap.

Do not import `reference/pokemon-showdown`. Do not describe this singles battle as a full simulator.