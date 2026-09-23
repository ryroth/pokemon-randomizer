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

Previous chats for this slice:

- [Phase 4 Pokémon randomizer](60252700-4c3f-4f3c-8377-3a9cd79c673b)
- [Evolve + unique-path uniqueness](80c6a0c3-9f7a-4485-b824-ec33984ff207)
- [Phase 4/5 Ability randomizer](d69943ba-3894-4d4a-b421-1949583c36f9)
- [Phase 4/5 Move randomizer](7bef258d-05f6-4cb9-bf56-edb3e1c13543)
- Phase 4/5 Item randomizer (this chat)
- Phase 4/5 per-option re-roll (this chat)

---

## Current status

| Item | Value |
| --- | --- |
| Phase complete on `master` | **Phase 3 — Filtering engine** |
| Current work | **Phase 4/5 randomizer PR** |
| Pokémon slice | **Done. Do not rebuild.** |
| Ability slice | **Done and confirmed. Do not rebuild.** |
| Move slice | **Done and confirmed. Do not rebuild.** |
| Item slice | **Done and confirmed. Do not rebuild.** |
| Re-roll | **Done. Do not rebuild.** |
| Current branch | `feat/phase-4-5-pokemon-randomizer` (from up-to-date `master`) |
| Latest on `master` | `f2cb48f` — Merge pull request #3 (`feat/phase-3-filtering-engine`) |
| Branch commit vs `master` | Phase 4/5 Pokémon + Ability + Move + Item randomizers |
| Remote | https://github.com/ryroth/pokemon-randomizer |
| Merged PRs | [#1](https://github.com/ryroth/pokemon-randomizer/pull/1) Phase 1, [#2](https://github.com/ryroth/pokemon-randomizer/pull/2) Phase 2, [#3](https://github.com/ryroth/pokemon-randomizer/pull/3) Phase 3 |
| Rename `master` → `main` | Still pending |

This slice is on `feat/phase-4-5-pokemon-randomizer`. Do not start the Builder unless asked.

The Pokémon, Ability, Move, Item, re-roll, and official flavor slices should pass `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` after this slice. Playwright browsers are **not** installed locally (`npx playwright install` still needed for `npm run test:e2e`). A `next dev` server may still be at `http://localhost:3000`.

---

## First action for the next agent

1. Read this file and `AGENTS.md`. Stay on `feat/phase-4-5-pokemon-randomizer`. Do **not** recreate the branch or rebuild Phases 1–3, the Pokémon randomizer, the Ability randomizer, the Move randomizer, the Item randomizer, or re-roll.
2. If the user confirms the PR, they may ask to start the Builder (Phase 6) or to tweak the randomizer.
3. If the user wants flavor, re-roll, Item, Move, Ability, or Pokémon tweaks instead, do those first.

Pokémon, Ability, Move, Item, re-roll, official flavor text, and drag-and-drop order tiles are built. **Do not start the Builder unless asked.**

---

## How we got here

The user asked to continue from Phases 1–3 on `master`, start Phase 4, and diverge by pairing Phase 4 (engine) with Phase 5 (UI) for **one randomizer at a time**. Pokémon was built and then extended in the same uncommitted slice:

1. **Keep previous rolls** with **Previous / Next**, not a stacked list. Failed generates and filter changes must not drop stored rolls.
2. **Per-filter dropdowns.** Generations, types, formes, evolution stages, and specials each have their own closed-by-default dropdown.
3. **Optional evolve after select.** Before any later randomizer, the user can keep the rolled form or pick a later stage in its Showdown line (`evolvedPokemonId`). Mega / Primal / Gigantamax are not offered. Default is keep.
4. **Batch uniqueness is by overlapping evolution path, not the whole family.** Honedge still excludes Doublade and Aegislash. Split branches may appear together: Cascoon can share a batch with Silcoon or Beautifly, but not with Wurmple or Dustox.

Ability was then added on the same branch:

5. Abilities are **not** generated on the Pokémon tab. Enable extras on the **Randomizer order** list. Typical order is Pokémon → Ability → Move → Item; any order is allowed.
6. Ability **after** Pokémon: Continue to the Abilities tab, generate, pick one for `battlePokemonId`.
7. Ability **before** Pokémon: generate a pool first. Do **not** auto-place abilities onto Pokémon in generate order. The user applies each unique ability to the Pokémon they choose, leftovers unused, then selects a Pokémon that has an ability applied.
8. The user confirmed Ability and asked the next agent to **start Move**. Move-before may apply a full four-move set **or** 1–3 moves; remaining slots are filled in the Builder from the original learnset or the custom/rolled pool depending on format.

Move was then added on the same branch, then confirmed:

9. Moves are **not** generated on the Pokémon tab. Enable extras on the **Randomizer order** list.
10. Move **after** Pokémon: Continue to the Moves tab, generate, pick four unique moves for `battlePokemonId`.
11. Move **before** Pokémon: generate a pool first. Do **not** auto-place moves onto Pokémon in generate order. The user chooses how many unique moves each Pokémon receives (`movesPerPokemon`: 1, 2, 3, or a full set of 4; default 4), applies that many to the Pokémon they choose (leftovers unused), then selects. Empty slots stay empty on `draft.moveIds` for the Builder. Select requires the chosen number of applied moves. If Ability is also before Pokémon, select still requires an applied ability.
12. Generated moves are limited to selected **Physical / Special / Status** categories (`moveCategories`, all three on by default).
13. Categories and **move types** (`moveTypes`, all 18 Pokémon types on by default) are dropdowns on the Moves tab, same pattern as Pokémon Generations/Types. Both filters apply together. Empty category or type list matches nothing.

The user confirmed Move and asked the next agent to **start Item**.

Item was then added on the same branch:

13. Items are **not** generated on the Pokémon tab. Enable extras on the **Randomizer order** list.
14. Item **after** Pokémon: Continue to the Items tab, generate, pick one for `battlePokemonId` or explicit None (`draft.itemId === null`).
15. Item **before** Pokémon: generate a pool first. Do **not** auto-place items onto Pokémon in generate order. The user applies each unique catalog item to the Pokémon they choose (leftovers unused). None is always a dropdown choice and does not consume a unique catalog id. Select requires an applied item, including None. If Ability-before and/or Move-before are also on, those gates still apply.
16. Generated items are limited to selected Showdown teambuilder categories (`itemCategories`: Popular Items, Items, Pokémon-Specific Items, Usually Useless Items, Useless Items; all five on by default). Empty list matches nothing. Categories follow pokemonshowdown.com's current-gen singles list.
17. The user asked for per-option **Re-roll** on every randomizer. Re-roll replaces one option in the viewed generation in place, any number of times, without creating Previous/Next history. None is not re-rollable. Exhausted remaining pools keep the current option and show an error.

Stop for confirmation after re-roll. Do not start the Builder.

---

## Product (V1)

Consumer web app: randomize **one** Pokémon, build a Showdown-compatible set by hand, copy the set text.

Flow: Configure → Generate unique Pokémon → Select one → optional evolve → optional ability / move / item randomizers → Build → Validate → Recap → Copy to Showdown.

Custom order can put Ability, Move, or Item **before** Pokémon. Then generate that extra pool first, apply extras to generated Pokémon (user choice, unique), then select. Ability-before still requires an applied ability. Move-before uses a chosen 1–4 moves per Pokémon (default 4); empty slots are filled later in the Builder. Item-before should require one applied item, matching Ability.

- Pokémon: always randomized
- Abilities / moves / items: independently optional
- EVs, IVs, Nature, Tera type, gender (if mixed), level, shiny: never auto-assigned

Out of scope until explicitly requested: six-Pokémon teams, accounts, saved builds, share URLs, public seeds, learnset-only or competitive-only pools.

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
npm run import:data  # PokéAPI + Showdown snapshot → data/generated/catalog.json
```

Importer flags: `--fresh` (ignore HTTP cache), `--offline` (fail if cache miss), `--help`.

---

## Locked design decisions

These were approved after Phase 0. Do not silently reverse them.

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
| Default form filter | **Base on.** Mega, regional, primal, gmax, other **off** |
| Type filter | Default OR; AND is already implemented in `lib/filters` |
| Specials default | All allowed (user unchecks to exclude) |
| Ability random ON | All standard abilities (`abilityPoolMode: "all"`). Legal-only is a future pool mode |
| Move random ON | All standard catalog moves (`movePoolMode: "all"`). Z/Max/CAP already excluded at import. Learnset-only is a future pool mode |
| Item random ON | Showdown holdables + explicit None, then selected teambuilder categories (Popular / Items / Pokémon-Specific / Usually Useless / Useless; all on by default) |
| Count | 1–12 Pokémon, default 6. Ability count 1–12, default 3. Move count already defaults to **8**. Move-before `movesPerPokemon` 1–4, default **4**. Item count already defaults to **3** (add min/max 1–12 with the Item engine) |
| Insufficient pools | Typed error + user-facing explanation; never a silent short list |
| RNG | `lib/randomizer/randomUtils.ts` only. No `Math.random()` in product code |
| Tera / gender / level / shiny | In V1 UI, validation, recap, and export. Not auto-filled |
| EVs | Numerically 0 is legal only after `evsConfirmed` |
| IVs | Start unset; “set all to 31” must be an explicit user action |
| Export | `lib/showdown/exportSet.ts`. Tera always written. Level 100 omitted. IVs of 31 omitted. Zero EVs omitted. Gender omitted if genderless. Shiny line only if shiny |
| Data updates | Repeatable import scripts, not hand-edited catalogs |
| Git | Feature branches; conventional commits. Rename `master` → `main` still pending |

Defaults live in `lib/randomizer/defaults.ts`. There is a regression test that Mega is **not** in the default `formTypes`. `randomizeAbilities`, `randomizeMoves`, and `randomizeItems` default to **false**. `abilityCount` defaults to **3**. `moveCount` defaults to **8**. `movesPerPokemon` defaults to **4**. `itemCount` defaults to **3**.

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

UI must not own randomization, filtering, classification, or validation. UI must not consume raw PokéAPI or Showdown objects. Calling `filterPokemonForms` / `randomizePokemon` / `matchingPokemonPoolSize` from the client for pool size and generate is the intended pattern; do not copy those rules into components. Ability, Move, and Item follow the same pattern (`matchingMovePoolSize` / `filterMoves` for move categories and types; `matchingItemPoolSize` / `filterItems` for Showdown teambuilder item categories).

Session type: `RandomizerSession` in `lib/types/session.ts` (serializable; later team/share/seed features should reuse it). Pokémon-slice fields in use: `config`, `step`, `tab`, `resultPokemonIds`, `pokemonRolls`, `viewedRollIndex`, `selectedPokemonId`, `evolvedPokemonId`. Ability-slice fields in use: `abilityOptions`, `draft.abilityId`, `PokemonRoll.appliedAbilityIds`. Move-slice fields in use: `moveOptions`, `draft.moveIds` (four slots with holes), `config.movesPerPokemon`, `config.moveCategories`, `config.moveTypes`, `PokemonRoll.appliedMoveIds` (`Array<Array<string | undefined>>`, four slots per Pokémon). Item-slice fields in use: `itemOptions`, `draft.itemId` (`string | null`; `null` = None), `PokemonRoll.appliedItemIds` (`Array<string | null | undefined>`; `null` = None, `undefined` = not applied).

**Session is React `useState` on `/randomizer` only.** Navigating away loses history and selection. Persist later only if the user asks (or when wiring the builder for real).

---

## Key paths

```text
app/                         Home, randomizer, builder, recap shells
app/randomizer/              Server page + loading/error (pass catalog.abilities, catalog.moves, and catalog.items)
components/layout/           Header, footer, phase placeholder
components/randomizer/       Order list + tabs; Pokémon tab (configure / generate / select / evolve / Ability-first, Move-first, and Item-first apply); Abilities tab (pool or pick); Moves tab (pool or pick four); Items tab (pool or pick one / None); skip-if-off
components/ui/               shadcn button + card
lib/types/                   Normalized catalogs + session
lib/data/classify.ts         Form type, evolution depth, pseudo-legendaries
lib/data/evolution.ts        Later-stage targets + overlapping-path uniqueness
lib/data/loadCatalog.ts      Node loader (mtime-aware cache) + slim Pokémon payload
lib/filters/                 Pokémon pool filters, move category/type filters, and Showdown item category filters from RandomizerConfig
lib/randomizer/              defaults, seeded RNG, Pokémon engine, ability engine, move engine, item engine, custom order, extra helpers, session helpers
lib/validation/              EV/IV/nature/ability/moves/item/tera/gender/level/shiny/set (`REQUIRED_MOVE_COUNT = 4`)
lib/showdown/exportSet.ts    Deterministic Showdown text
scripts/import/              Repeatable PokéAPI + @pkmn/dex snapshot
  mapping.ts                 Showdown ↔ PokéAPI name join
  pokeapi.ts                 Cached HTTP snapshot
  showdown.ts                @pkmn/dex filters (keep mega/gmax; drop CAP/Z/Max)
  normalize.ts               Build Catalog + join report (also writes evolutionTargetIds)
  evolutionTargets.ts        Showdown evo graph → evolutionTargetIds
  patch-evolution-targets.ts One-off catalog patch without a full PokéAPI reimport
data/generated/              catalog.json (~4.7MB, version 2.4.0) + join-report.json
data/cache/pokeapi/          Gitignored HTTP cache
tests/unit/                  Classification, RNG, validation, export, defaults, catalog integrity, filters, evolution paths, Pokémon rolls, ability rolls, move rolls, item rolls, session paging, custom order
tests/e2e/                   Shell navigation plus Pokémon generate / pager / evolve / insufficient-pool, Ability after / Ability-first apply-then-select, Move after pick-four / Move-first chosen-count apply-then-select, and Item after pick-one / Item-first apply-then-select
```

---

## Phase 2 catalog (do not rebuild)

`npm run import:data` already produced the catalog. A later patch (`scripts/import/patch-evolution-targets.ts`) wrote `evolutionTargetIds` onto every form and bumped the catalog to **version 2.1.0**. A later patch (`scripts/import/patch-item-categories.ts`) wrote Showdown teambuilder `category` plus mechanical `kind` onto every item and bumped the catalog to **version 2.2.0**. Later full reimports write latest unique English PokéAPI flavor for Pokédex entries and numeric ability/move/item effects (`mechanicalDescription` in `scripts/import/text.ts`) and bump the catalog to **version 2.4.0**. Do not hand-edit `catalog.json`.

| Collection | Count |
| --- | --- |
| Pokémon forms | 1316 |
| Species | 1025 |
| Abilities | 310 |
| Moves | 850 |
| Items | 507 (16 Popular, 159 Items, 108 Pokémon-Specific, 29 Usually Useless, 195 Useless) |
| Natures | 25 |

The 850 moves already exclude Z-Moves, Max/G-Max moves, and CAP/nonstandard via `isCatalogMove` in `scripts/import/showdown.ts`. The Move engine should draw from `catalog.moves` as-is. Do not re-filter Z/Max in product code unless a catalog row slipped through. Do not import learnsets.

Integrity fixtures that must keep working: Mewtwo (Restricted Legendary), Articuno (Sub-Legendary), Nihilego (Ultra Beast), Walking Wake (Paradox, gen 9), Dragonite (pseudo, stage 2), Pichu (baby, basic), Alolan Raichu (`raichu-alola`, regional, gen 7, stage 2), Mega Venusaur (`venusaur-mega`, mega, gen 6). Evolution fixtures: Charmander → Charmeleon/Charizard; Pikachu includes Alolan Raichu; Silcoon → Beautifly only; Honedge/Doublade/Aegislash overlap; Wurmple splits.

Join leftovers are expected in `data/generated/join-report.json`. Showdown-only rows still go into the catalog (empty dex/sprites) rather than being dropped.

Re-run `npm run import:data` only when PokéAPI or Showdown source data needs refreshing. After a catalog file change, `loadGeneratedCatalog` reloads when the file mtime changes; a stale `next dev` process can still serve an old in-memory module until restart.

Default **form** pool on `/randomizer` is **1023** base formes. Default **compatible** pool (overlapping-path uniqueness, split branches counted separately) is **575**. The Generate button and insufficient-pool errors use the compatible count (`matchingPokemonPoolSize`), not the raw form count.

---

## Phase 3 filtering (do not rebuild)

`filterPokemonForms` / `matchesPokemonFilters` in `lib/filters` apply `RandomizerConfig` to `PokemonForm[]`.

- Generation, form type, and evolution stage are membership checks.
- Type OR: the form has at least one selected type. Type AND: the form has every selected type.
- Special flags are independent exclusions (`allowLegendary: false` drops Restricted Legendaries only).
- Empty generation / type / form-type / evolution-stage lists return `[]`. This function still returns matching **forms**; uniqueness and insufficient-pool errors belong to the randomizer.
- Defaults: base formes only; mega / regional / primal / gmax / other off; all specials allowed.

Do not put this logic in UI components. Do not re-run the catalog importer.

---

## What the Pokémon slice does (done — do not rebuild)

### Engine

`randomizePokemon` in `lib/randomizer/pokemon.ts` filters with `filterPokemonForms`, then `pickCompatiblePokemon` using a caller-supplied seed. Two forms conflict when one is an ancestor/descendant of the other (`evolutionTargetIds`) or they are other formes of the same species that are **not** parallel split outcomes. Linear lines stay unique (Honedge / Doublade / Aegislash). Split branches may appear together (Cascoon with Silcoon or Beautifly, never with Wurmple or Dustox). `createSeed()` uses `crypto.getRandomValues`, never `Math.random()`. Insufficient pools throw `InsufficientPoolError` (counted by `maximumCompatiblePokemonCount`). Counts outside 1–12 throw `InvalidPokemonCountError`. `userFacingRandomizerMessage` maps those to plain language.

Helpers in `lib/data/evolution.ts`: `collectEvolutionTargetIds`, `evolutionChoices`, `evolutionConflictContext`, `evolutionFormsConflict`, `maximumCompatiblePokemonCount`.

### Session / history

Helpers in `lib/randomizer/session.ts`:

| Function | Behavior |
| --- | --- |
| `createInitialSession` | Empty rolls, `viewedRollIndex: 0`, later randomizers off, tab is the first enabled step in `randomizerOrder` |
| `applyPokemonRoll` | **Prepends** the new roll, sets `resultPokemonIds` to it, resets `viewedRollIndex` to `0` (current). Keeps `selectedPokemonId` if that form still exists in **any** stored roll. When extras are before Pokémon, does not auto-assign them. |
| `applyAbilityToRolledPokemon` | Ability-first: applies (or clears) one unique ability onto a generated Pokémon. Moving an ability off another Pokémon; clearing the selected Pokémon's ability also clears selection. |
| `abilityChoicesForPokemon` / `unassignedAbilityIds` | Remaining unique abilities for a Pokémon's dropdown, plus leftovers still unused on the viewed roll. |
| `showPreviousPokemonRoll` | Increments `viewedRollIndex` (older). No-op at the oldest roll |
| `showNextPokemonRoll` | Decrements `viewedRollIndex` toward `0`. No-op on current |
| `viewedPokemonRoll` | Roll at the clamped index |
| `selectRolledPokemon` | Allows selecting a form from **any** stored roll, not only the visible one. Resets `evolvedPokemonId` to that form. After Pokémon, clears extras if `battlePokemonId` changes. Before Pokémon, requires applied extras (ability and/or `movesPerPokemon` moves and/or item, including None) and copies them onto the draft. |
| `chooseEvolvedPokemon` | Sets `evolvedPokemonId` / `draft.pokemonId` to the selected form or one of its later-stage targets. After Pokémon, clears extras if `battlePokemonId` changes. Before Pokémon, keeps assigned extras. |
| `battlePokemonId` | `evolvedPokemonId` if set, otherwise `selectedPokemonId` |
| `applyAbilityRoll` | After Pokémon: stores ids only when `forPokemonId` matches `battlePokemonId`. Before Pokémon: stores the pool without a selected Pokémon. |
| `selectRolledAbility` | Sets `draft.abilityId` from `abilityOptions`. |
| `openRandomizerTab` | Switches `session.tab` if that tab is visible and allowed |
| `syncRandomizerTab` | Returns to the first enabled implemented tab if the current tab is no longer available |
| `clearPokemonRolls` | Drops rolls, selection, and evolution; returns to the Pokémon tab. Keeps pre-Pokémon extra pools; clears after-Pokémon extra rolls. |
| `rolledPokemonIds` | Flat list, newest roll first |
| `replaceRolledPokemon` | Swap one id in the **viewed** generation in place. Update `resultPokemonIds` only when `viewedRollIndex === 0`. If the replaced id was selected, reselect the replacement. Do not prepend a new roll. |
| `replaceRolledAbility` / `replaceRolledMove` / `replaceRolledItem` | Remap `*Options`, applied extras on stored rolls, and the matching draft field. No-op if the replacement is already in that option list. |

`pokemonRolls` is newest-first. Display “generation N of M” is `generationCount - viewedRollIndex` (oldest = 1, current = count).

### UI (`/randomizer`)

- Server Component loads `catalog.json` and passes `slimPokemonForClient` rows (at most one Pokédex entry) plus `catalog.abilities` to `PokemonRandomizer`.
- Filter form: count 1–12, Pokédex-entry toggle, live **compatible** pool size, and Reset stay visible. Generations, types, formes, evolution stages, and special classifications each have their own closed-by-default dropdown with a one-line summary of the current selection.
- Generate uses the engine; results show artwork, types, gen, form-type chip when not base, optional dex text.
- Selecting a card enables the **Evolution** step. Continue then goes to the next enabled implemented step in `randomizerOrder`. Ability generate/select is not on the Pokémon tab.
- Result cards in Ability-first mode show an ability dropdown per Pokémon, unused leftovers, and keep Select disabled until that Pokémon has an applied ability.
- If the selected form has later stages (`evolutionTargetIds`), the user can keep it or pick a later form in the line. Mega, Primal, and Gigantamax are not offered. Default is keep. That battle form is stored as `evolvedPokemonId` and is what later randomizer tabs will use.
- Fully evolved selections still show the Evolution section, with a plain-language note that they do not evolve further.
- Results show **one generation**. Previous / Next walk history. New generate scrolls to results and shows the current generation. **Re-roll** on a card replaces that one option in the viewed generation; it does not create a new Previous/Next entry.
- “View generated Pokémon” jump link appears once there is history.
- Insufficient-pool alert is cleared when filters change so a stale error does not linger after Reset.

Reuse, do not rewrite:

- `filterPokemonForms` from `lib/filters`
- `createRng`, `createSeed`, `pickUnique`, `shuffle`, `InsufficientPoolError` from `lib/randomizer/randomUtils.ts`
- `DEFAULT_RANDOMIZER_CONFIG` from `lib/randomizer/defaults.ts`
- Evolution helpers above
- `loadGeneratedCatalog()` / `slimPokemonForClient()` in `lib/data/loadCatalog.ts` (Node only for the loader)
- Session helpers above, especially `battlePokemonId` / `chooseEvolvedPokemon`
- Ability helpers above when Move or Item interacts with the same select/evolve/clear path

---

## Ability randomizer — done (do not rebuild)

Pair engine + UI is complete. The user confirmed this slice. Do not rebuild.

Locked product rule: when ability randomization is **on**, the pool is **all standard catalog abilities** (`abilityPoolMode: "all"`). Do not implement learnset/legal-only mode. `PokemonForm.abilityIds` exists for that future mode; ignore it for V1 Ability ON.

### Engine

`randomizeAbilities` in `lib/randomizer/abilities.ts` picks `abilityCount` unique abilities by id from `catalog.abilities` with `pickUnique` and a caller-supplied seed. Counts outside 1–12 throw `InvalidAbilityCountError`. Insufficient pools throw `InsufficientPoolError`. `"legal"` pool mode is ignored and still uses the full catalog.

### UI (keep this behavior)

- **Randomizer order** list: Pokémon / Ability / Move / Item as drag-and-drop tiles (keyboard: Space to pick up, Up/Down, Space to drop). Ability, Move, and Item enable work. Use typical order. Default order is Pokémon → Ability → Move → Item.
- Ability **count** lives on the Abilities tab (1–12, default 3, live pool 310).
- After Pokémon: Continue opens the Abilities tab; generate then pick one for `battlePokemonId`. Continue stays disabled until an ability is selected. Each ability card has Re-roll.
- Before Pokémon: Abilities tab builds a pool (not a single pick). After generating Pokémon, the user applies each ability to a Pokémon they choose (unique; leftovers unused). They can then select a Pokémon that has an ability applied. Pool cards still have Re-roll.
- If off: skip the Abilities tab. `builderAbilityPool` returns the battle Pokémon's usual `abilityIds` when skipped, or the rolled `abilityOptions` when on.
- Continue to builder stays a placeholder link. Session is not persisted to `/builder`.

Do not auto-assign the ability onto a finished set. Do not add a database.

---

## Move randomizer — done (do not rebuild)

Pair engine + UI is complete. The user confirmed this slice. Start Item.

Locked product rule: when move randomization is **on**, the source pool is the **850 standard catalog moves** (`movePoolMode: "all"`), then **Physical / Special / Status** (`moveCategories`, all three on by default) and **move types** (`moveTypes`, all 18 Pokémon types on by default). Do not implement learnset-only mode. `PokemonForm` has **no** `moveIds` / learnset field; do not add one and do not re-run the importer.

### Engine

`randomizeMoves` in `lib/randomizer/moves.ts` picks `moveCount` unique moves by id from `filterMoves(catalog.moves, config)` with `pickUnique` and a caller-supplied seed. `moveCategories` defaults to Physical, Special, and Status. `moveTypes` defaults to all 18 Pokémon types. Empty category list or empty type list matches nothing. Counts outside 4–12 throw `InvalidMoveCountError`. Insufficient pools throw `InsufficientPoolError`. `"learnset"` pool mode is ignored and still uses the standard catalog plus the category and type filters.

### Session

Helpers compose with Ability rather than rewriting it (`withExtraState` = `withMoveState(withAbilityState(...))`).

| Helper | Behavior |
| --- | --- |
| `applyMoveRoll(session, result, forPokemonId?)` | After Pokémon: store ids only when `forPokemonId === battlePokemonId(session)`. Before Pokémon: store the pool with no selected Pokémon required. Keep `draft.moveIds` values that are still in the new roll; prune `appliedMoveIds` that left the pool. |
| `selectRolledMove` | After Pokémon: toggle a unique id from `moveOptions` onto the first empty `draft.moveIds` slot. Clicking a selected move clears that slot. A fifth pick is a no-op. |
| `applyMoveToRolledPokemon` | Move-before: apply or clear one unique move onto a slot below `movesPerPokemon`. Uniqueness across the roll: taking a move that is already on another Pokémon or another slot moves it. Dropping below the chosen count clears selection. |
| `applySessionConfig` | Apply a new config, trim applied move slots above `movesPerPokemon`, and deselect if the pick no longer has enough moves. |
| `moveChoicesForPokemon` / `unassignedMoveIds` | Remaining unique moves for a Pokémon slot, plus leftovers still unused on the viewed roll. |
| `selectRolledPokemon` | Move-before requires `movesPerPokemon` applied moves (default 4). Copy those onto `draft.moveIds`, leaving holes for the Builder. If Ability is also before Pokémon, still require an applied ability. |
| `chooseEvolvedPokemon` | Before Pokémon: keep the applied moves. After Pokémon: clear `moveOptions` / `draft.moveIds` when `battlePokemonId` changes. |
| `clearPokemonRolls` | Keep a Move-first pool; clear after-Pokémon move rolls and reset `draft.moveIds`. |
| `applyPokemonRoll` | Do not auto-assign moves. |

`PokemonRoll.appliedMoveIds` is `Array<Array<string | undefined>>` (length 4 per Pokémon index).

### UI (keep this behavior)

- **Randomizer order** list: Move enable works.
- Move **count** lives on the Moves tab (4–12, default 8). Live pool size follows selected categories and types (850 when all categories and types are on).
- Move **categories** and **types** live on the Moves tab as dropdowns (same pattern as Pokémon Generations/Types). Physical / Special / Status and all 18 types are on by default. Select all / Clear inside each dropdown. Generate uses only selected categories **and** types.
- After Pokémon: Continue opens the Moves tab; generate then pick four for `battlePokemonId`. Cards show type / category / power. Continue stays disabled until four unique moves are selected. The moves-per-Pokémon radios are hidden. Each move card has Re-roll.
- Before Pokémon: Moves tab builds a pool and shows **Moves given to each Pokémon** radios (1 / 2 / 3 / 4 full moveset, default 4). After generating Pokémon, the user applies that many unique moves (that many dropdowns). Unused leftover line. Select stays disabled until that many are applied. Select still waits for an applied ability when Ability-before is also on. Remaining slots are for the Builder. Pool cards still have Re-roll.
- If off: skip the Moves tab. Continue goes to the next implemented destination (Item when on, otherwise builder).
- Continue to builder stays a placeholder link. Session is not persisted to `/builder`.

`builderMovePool` (Phase 6, do not build now): empty move slots after a partial Move-before apply are filled in the Builder from the original learnset or the custom/rolled `moveOptions`. There is no learnset on `PokemonForm` yet; do **not** invent learnsets or re-run the importer.

`assignUniqueFromPool` remains unused by `applyPokemonRoll`. `extraSlotsNeeded("move", pokemonCount, movesPerPokemon)` is `pokemonCount * movesPerPokemon` and is not a generate-time or select-time requirement.

Do not auto-assign moves onto a finished set. Do not add a database. Do not rebuild Move.

---

## Item randomizer — done (do not rebuild)

Pair engine + UI is complete, including Showdown teambuilder category filters. The user confirmed Item and asked for per-option re-roll. Do **not** start the Builder. Do not rebuild.

**Mirrors Ability, not Move.** One unique item per Pokémon (like one unique ability), not a four-slot moveset. `extraSlotsNeeded("item", pokemonCount)` is `pokemonCount`. `assignUniqueFromPool` is still unused by `applyPokemonRoll` (no auto-assign).

Locked product rule: when item randomization is **on**, the pool is **Showdown holdables + explicit None**, then selected **Showdown teambuilder categories** (`itemCategories`: Popular Items, Items, Pokémon-Specific Items, Usually Useless Items, Useless Items; all five on by default). Use `catalog.items` (**507** rows; Poké Balls / CAP / nonstandard already excluded at import via `isCatalogItem`), then `filterItems`. Empty category list matches nothing. Explicit None is not a catalog row: `draft.itemId === null` (`null` = None; validation already accepts that). None is always offered as an extra selectable choice and is **not** drawn by the RNG. `NONE_ITEM_ID` is `null`. `NONE_ITEM_SELECT_VALUE` (`__none__`) is UI-only and is never stored on the session. Do not re-run the full PokéAPI importer; item categories come from `scripts/import/patch-item-categories.ts` / `normalize.ts`.

### Engine

`randomizeItems` in `lib/randomizer/items.ts` picks `itemCount` unique items by id from `filterItems(catalog.items, config)` with `pickUnique` and a caller-supplied seed. `itemCategories` defaults to all five Showdown teambuilder groups. Empty category list matches nothing. Counts outside 1–12 throw `InvalidItemCountError`. Insufficient pools throw `InsufficientPoolError`. `matchingItemPoolSize` is the filtered holdable count; None is extra selectable, not part of the generated unique pool. `MIN_ITEM_COUNT` / `MAX_ITEM_COUNT` / `DEFAULT_ITEM_COUNT` live next to the ability constants (1–12, default 3).

### Session

Helpers compose with Move (`withItemState(withMoveState(withAbilityState(...)))`) rather than rewriting Ability/Move.

`itemOptions`, `PokemonRoll.appliedItemIds` (`Array<string | null | undefined>`), and `draft.itemId` are in use. `null` = None; `undefined` = not applied.

| Helper | Behavior (match Ability) |
| --- | --- |
| `applyItemRoll` | After Pokémon: store ids only when `forPokemonId === battlePokemonId(session)`. Before Pokémon: store the pool with no selected Pokémon required. Prune applied catalog items that left the pool; keep applied None. |
| `selectRolledItem` | After Pokémon: set `draft.itemId` from `itemOptions`, or `null` for None. |
| `applyItemToRolledPokemon` | Item-before: apply or clear one unique catalog item onto a generated Pokémon. Uniqueness across the roll. None does not steal from other Pokémon. Clearing the selected Pokémon's item also clears selection. |
| `itemChoicesForPokemon` / `unassignedItemIds` | Remaining unique catalog items for a Pokémon dropdown, plus leftovers still unused on the viewed roll. None is a UI extra, not in these lists. |
| `selectRolledPokemon` | Item-before requires an applied item (including None). Ability-before and Move-before gates still apply. |
| `chooseEvolvedPokemon` | Before Pokémon: keep the applied item. After Pokémon: clear `itemOptions` / `draft.itemId` when `battlePokemonId` changes. |
| `clearPokemonRolls` | Keep an Item-first pool; clear after-Pokémon item rolls. |
| `applyPokemonRoll` | Do not auto-assign items. |

### UI

- Item is enabled in the Randomizer order list (`IMPLEMENTED_TABS` includes `"item"`).
- Item **count** lives on the Items tab (1–12, default 3). Live pool size follows selected Showdown teambuilder categories (507 when all five are on).
- Item **categories** live on the Items tab as a dropdown (same pattern as Move categories). Popular Items, Items, Pokémon-Specific Items, Usually Useless Items, and Useless Items are on by default. Select all / Clear inside the dropdown. Generate uses only selected categories.
- After Pokémon: Continue opens the Items tab; generate then pick one for `battlePokemonId` (or None). Continue stays disabled until an item (or None) is selected. Each catalog item card has Re-roll; None does not.
- Before Pokémon: Items tab builds a pool. After generating Pokémon, the user applies each unique item to a Pokémon they choose (leftovers unused). None is always in the apply dropdown. Select stays disabled until that Pokémon has an applied item. Existing Ability-before and Move-before gates still apply. Pool cards still have Re-roll.
- If off: skip the Items tab. Continue goes to builder (still a placeholder link; session is not persisted to `/builder`).
- Do not auto-assign. Do not add a database. Do not start Phase 6 Builder.

---

## Per-option re-roll — done (stop for confirmation)

The user asked to re-roll any generated option any number of times on **all** randomizers. Pair engine + UI is complete. Stop for confirmation. Do **not** start the Builder. Do not rebuild Pokémon / Ability / Move / Item.

Locked product rule: Re-roll replaces **one** option in the **currently viewed** generation. It is not a new Generate and does not prepend Previous/Next history. The replacement must be a different id, unique against the remaining siblings, and drawn from the same filtered pool as Generate. Pokémon also stay unique along overlapping evolution paths with the **kept** forms. Explicit None is never re-rollable. If nothing else matches, keep the current option and show `rerollEmptyMessage`.

### Engine

- `rerollUnique` in `lib/randomizer/randomUtils.ts` — generic unique replacement.
- `rerollPokemon` / `rerollAbility` / `rerollMove` / `rerollItem` — one-id results from the matching filtered pool (`filterPokemonForms` / full ability catalog / `matchingMovePool` / `matchingItemPool`).
- `replaceRolledPokemon` edits `pokemonRolls[viewedIndex]` in place; `resultPokemonIds` only when viewing the current generation. If `selectedPokemonId === previousId`, call `selectRolledPokemon` on the replacement so extras-before stay on that slot and extras-after clear when `battlePokemonId` changes.
- `replaceRolledAbility` / `replaceRolledMove` / `replaceRolledItem` remap options, applied ids on stored rolls, and the draft.

### UI

- Shared `components/randomizer/reroll-button.tsx`: outline **Re-roll** with `aria-label={`Re-roll ${name}`}`.
- Pokémon, Ability, Move, and Item result cards show Re-roll under the select/apply area. None has no Re-roll.
- Errors use the existing per-tab alerts (`userFacingRandomizerMessage`).

Do not auto-assign. Do not add a database. Do not start Phase 6 Builder.

---

## Official flavor + numeric effects — done (stop for confirmation)

Pokédex entries stay official game flavor from PokéAPI. Ability, move, and item **cards need the battling numbers** (Punk Rock 1.3× / 30%, Metal Coat 20%).

- Pokédex: `uniqueEnglishFlavor` / `officialEnglishFlavor`, newest English first. Flavor only.
- Ability/move/item `description`: `mechanicalDescription` prefers PokéAPI English `short_effect`/`effect` when it includes digits, then Showdown `shortDesc`/`desc` (same multipliers Pokémon Database / Bulbapedia / Serebii list), then flavor. Do not invent numbers. Cap long encyclopedic effect text at 400 characters.
- Fixtures: Blaze 1.5× at 1/3 HP, Ember 10% burn, Metal Coat 20%, Punk Rock 1.3×, Leftovers 1/16, Bulbasaur Shield dex. Catalog **version 2.4.0**.

Move result chips: type, category, **Power**, then **Accuracy** (`Accuracy 90%`). Accuracy 0/null (no check) shows Can't miss. Formatter: `lib/data/moveDisplay.ts`.

---

## Files in this slice

Modified:

- `AGENTS.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `PROJECT_SPEC.md`, `README.md`, `ROADMAP.md`, `TEST_PLAN.md`, `handoff.md`
- `app/randomizer/page.tsx`
- `data/generated/catalog.json` (version 2.4.0 + numeric ability/move/item effects + official Pokédex flavor + `evolutionTargetIds` + item teambuilder categories — **must** travel with this slice)
- `lib/data/loadCatalog.ts`
- `lib/randomizer/defaults.ts`, `lib/randomizer/randomUtils.ts`
- `lib/types/index.ts`, `lib/types/pokemon.ts`, `lib/types/session.ts`, `lib/types/randomizer.ts`, `lib/types/catalog-entities.ts`
- `scripts/import/normalize.ts`, `scripts/import/text.ts`, `scripts/import/pokeapi-types.ts`
- `tests/unit/data/catalog-integrity.test.ts`
- `tests/unit/data/import-mapping.test.ts`
- `tests/unit/filters/pokemon.test.ts`
- `tests/unit/filters/moves.test.ts`
- `tests/unit/randomizer/defaults.test.ts`
- `tests/unit/validation/set.test.ts`

Added:

- `app/randomizer/error.tsx`, `app/randomizer/loading.tsx`
- `components/randomizer/` (`pokemon-randomizer.tsx`, `pokemon-filter-form.tsx`, `pokemon-filter-summary.ts`, `pokemon-evolution.tsx`, `pokemon-results.tsx`, `ability-config.tsx`, `ability-results.tsx`, `move-config.tsx`, `move-filter-summary.ts`, `move-results.tsx`, `item-config.tsx`, `item-filter-summary.ts`, `item-results.tsx`, `reroll-button.tsx`, `filter-dropdown.tsx`, `randomizer-tabs.tsx`, `randomizer-flow.tsx`)
- `lib/data/evolution.ts`, `lib/data/item-teambuilder.ts`, `lib/data/moveDisplay.ts`
- `lib/randomizer/index.ts`, `lib/randomizer/pokemon.ts`, `lib/randomizer/abilities.ts`, `lib/randomizer/moves.ts`, `lib/randomizer/items.ts`, `lib/randomizer/flow.ts`, `lib/randomizer/session.ts`, `lib/randomizer/applyExtras.ts`
- `lib/filters/moves.ts`, `lib/filters/items.ts`, `lib/filters/index.ts`
- `scripts/import/evolutionTargets.ts`, `scripts/import/patch-evolution-targets.ts`, `scripts/import/patch-item-categories.ts`
- `tests/e2e/randomizer.spec.ts`
- `tests/unit/data/evolution.test.ts`
- `tests/unit/data/moveDisplay.test.ts`
- `tests/unit/data/item-teambuilder.test.ts`
- `tests/unit/filters/items.test.ts`
- `tests/unit/randomizer/filter-summary.test.ts`
- `tests/unit/randomizer/pokemon-catalog.test.ts`
- `tests/unit/randomizer/pokemon.test.ts`
- `tests/unit/randomizer/abilities.test.ts`
- `tests/unit/randomizer/abilities-catalog.test.ts`
- `tests/unit/randomizer/moves.test.ts`
- `tests/unit/randomizer/moves-catalog.test.ts`
- `tests/unit/randomizer/items.test.ts`
- `tests/unit/randomizer/items-catalog.test.ts`
- `tests/unit/randomizer/flow.test.ts`
- `tests/unit/randomizer/applyExtras.test.ts`
- `tests/unit/randomizer/randomUtils.test.ts`
- `tests/unit/randomizer/session.test.ts`
- `tests/unit/randomizer/reroll.test.ts`

**Do not commit** untracked `public/*.svg` leftovers from create-next-app.

---

## Quality gates already run

- `npm run lint`
- `npm run typecheck`
- `npm test` — **211** unit tests
- `npm run build`

Playwright spec exists (`tests/e2e/randomizer.spec.ts`: generate, select, Evolution heading, evolve a later stage, Previous/Next, empty-generation pool error, typical ability generate/select, Ability-first apply-then-select, typical Pokémon → Ability → Move pick-four, Move-first chosen-count apply-then-select, Move categories and Move types dropdowns, typical Pokémon → Ability → Move → Item pick-one, Item-first apply-then-select, Item categories Showdown groups, per-option Re-roll on Pokémon/Ability/Move/Item, exhausted remaining Pokémon pool) but was **not** run locally because browsers are missing.

Browser-verified on `/randomizer`: Ability-first apply-then-select (earlier). Move typical path and Move-first (earlier). Item typical path and Item-first (earlier). Item **categories** (earlier). **Re-roll** (earlier). **Numeric effects** (earlier). **Move Accuracy chips** (earlier). **Randomizer order drag-and-drop**: Item tile dragged to first (Items tab enabled); keyboard Space/ArrowUp moved Ability to first; Use typical order restored Pokémon → Ability → Move → Item; checkboxes still toggle.

---

## Known issues / watchouts

- Next.js overlay “1 Issue” during Cursor browser verification was **`data-cursor-ref` hydration** (and similar DevTools noise), not app `Math.random()`. Do not “fix” RNG for that. Ability checkbox clicks were intercepted by that overlay; CDP `element.click()` worked when the pointer click did not.
- Filter `legend` markup was broken once (invalid HTML); filter groups use a real `<fieldset>` / `<legend>`. Filter dropdowns use native `<details>`.
- Playwright `getByRole("button", { name: "Clear generations" })` is the **filter toolbar** (“Clear generations”), not “Clear generated Pokémon”. Open the Generations dropdown first; the spec asserts that control is hidden until then.
- Aegislash’s catalog `id` is `aegislash` but `pokeApiSlug` is `aegislash-shield`. Look up by Showdown `id` for evolution-path tests.
- Header can feel tight on a 390px viewport; not requested as in-scope polish unless the user asks.
- Continue to builder does not pass session state.
- Do not add the full `pokemon-showdown` simulator package to the client.
- Natures have `pokeApiSlug` (dual-write rule). Do not remove it.
- Next.js 16 may rewrite the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of `AGENTS.md`. Keep the Pokémon Randomizer rules below that block.
- `data/generated/catalog.json` (~4.7MB) is on `master` and is **modified** on this branch (now version 2.4.0). CI tests do not need network.
- `data/cache/pokeapi/` is gitignored. Safe to keep locally; do not commit.
- `node_modules.bak` (if present) is a leftover Vite install; gitignored; safe to delete.
- Catalog patches while `next dev` is running can leave a stale module cache. `loadGeneratedCatalog` now keys on file mtime; if the UI still looks old, restart `next dev`.
- PowerShell: chain commands with `;`, not `&&`.

---

## Optional follow-ups (only if the user asks)

These are **not** required before confirming official flavor text:

- Persist `RandomizerSession` across `/builder` (and refresh).
- Wire the selected / evolved Pokémon into the builder instead of the placeholder.
- `npx playwright install` and run `npm run test:e2e`.
- Header / mobile density.

---

## Later phases (do not skip ahead unless asked)

- **4/5 Pokémon** — done (do not rebuild)
- **4/5 Ability** — done, confirmed (do not rebuild)
- **4/5 Move** — done, confirmed (do not rebuild)
- **4/5 Item** — done, confirmed (do not rebuild)
- **4/5 Re-roll** — done on this branch
- **Official flavor text** — Pokédex uses latest unique English PokéAPI flavor
- **Numeric ability/move/item effects** — PokéAPI `effect_entries` when they include numbers, else Showdown battling text (stop for confirmation)
- **6** Builder UI with live validation (Tera, gender, level, shiny included). Fill remaining move slots after a partial Move-before apply from original learnset or custom/rolled pool depending on format.
- **7** Recap card + Copy to Showdown
- **8** A11y, responsive, loading/error, performance polish

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

Definition of done: implementation + TypeScript + tests + lint + edge/error handling + a11y/responsive considered. UI is not done from a screenshot.

---

## Suggested first message in a continuation chat

> Continue the Pokémon Randomizer. Read `handoff.md` and `AGENTS.md`. Phases 1–3 are merged to `master`. The Phase 4/5 Pokémon, Ability, Move, Item, re-roll, and official flavor-text slices are done on `feat/phase-4-5-pokemon-randomizer` and are **uncommitted**. Do not rebuild Phases 1–3, Pokémon, Ability, Move, Item, or re-roll. Do not start the Builder unless I ask. Do not commit unless I ask.
