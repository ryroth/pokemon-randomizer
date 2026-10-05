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
| Phase complete on `master` | **Phase 6 — Pokémon builder** |
| Current work | **Phase 7 — Recap, Showdown copy, and saved teams** (implemented on `feat/phase-7-recap`) |
| Next phase | **Phase 8 — Polish** |
| Current branch locally | `feat/phase-7-recap` (from `master` at `c55218b`) |
| Latest on `master` | `c55218b` — feat: add the Pokémon set builder |
| Remote | https://github.com/ryroth/pokemon-randomizer |
| Merged PRs | [#1](https://github.com/ryroth/pokemon-randomizer/pull/1) Phase 1, [#2](https://github.com/ryroth/pokemon-randomizer/pull/2) Phase 2, [#3](https://github.com/ryroth/pokemon-randomizer/pull/3) Phase 3, [#4](https://github.com/ryroth/pokemon-randomizer/pull/4) Phase 4/5, [#5](https://github.com/ryroth/pokemon-randomizer/pull/5) Phase 6 |
| Rename `master` → `main` | Still pending |

Phases 1–6 are on `master`. Do **not** rebuild them. Phase 7 is implemented on this branch and is not merged yet. Do **not** start Phase 8 polish unless the user asks.

Work continues on `feat/phase-7-recap`, branched from up-to-date `master`. Do not stack new work on `feat/phase-6-builder`.

Quality gates for this branch: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Playwright covers the randomizer and the builder-through-teams flow at `tests/e2e/builder.spec.ts` (`npx playwright install` may still be needed). Catalog version **2.4.0**. Do not hand-edit `catalog.json`, `genera.json`, or `pokemon-model-index.json`. Learnsets and Hidden Abilities are separate generated files.

---

## First action for the next agent

1. Read this file and `AGENTS.md`. Stay on `feat/phase-7-recap` until its pull request has merged. Do **not** recreate or rebuild Phases 1–6.
2. Phase 7 (recap, copy, and saved teams) is implemented. Phase 8 is polish. Do not start polish unless asked.
3. Saved teams are in scope. Accounts, share URLs, a database, and a six-Pokémon randomizer are not.

Do not commit unless asked. Do not push unless asked.

---

## Product (V1)

Consumer web app: randomize **one** Pokémon, build a Showdown-compatible set by hand, copy that set, and save it onto a team of up to 6 that can be copied as a whole.

Flow: Configure → generate unique Pokémon → select one → optional evolve → optional ability / move / item randomizers → Build → Validate → Recap → Copy to Showdown and/or save to a team → Next Randomizer for another Pokémon.

Custom order can put Ability, Move, or Item **before** Pokémon. Then generate that extra pool first, apply extras to generated Pokémon (user choice, unique), then select. Ability-before requires an applied ability. Move-before uses a chosen 1–4 moves per Pokémon (default 4); empty slots are filled later in the Builder. Item-before requires one applied item, including None.

- Pokémon: always randomized
- Abilities / moves / items: independently optional
- EVs, Nature, Tera type, gender (if mixed), level, and shiny are not auto-assigned. Applying a Smogon guess is the exception: it fills that analysis's EVs and Nature and still requires EV confirmation. IVs default to 31. Happiness defaults to 255 (0–255). Nickname is optional.
- A new Pokémon roll, a different selected Pokémon, or an evolution clears EVs, Nature, and EV confirmation. IVs stay at 31.

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
| Default form filter | **Base on.** Mega, regional, primal, gmax, other **off** |
| Type filter | Default OR; AND is already implemented in `lib/filters` |
| Specials default | All allowed (user unchecks to exclude) |
| Ability random ON | All standard abilities (`abilityPoolMode: "all"`). Legal-only is a future pool mode |
| Move random ON | All standard catalog moves (`movePoolMode: "all"`). Z/Max/CAP already excluded at import. Learnset-only is a future pool mode |
| Item random ON | Showdown holdables + explicit None, then selected teambuilder categories (Popular / Items / Pokémon-Specific / Usually Useless / Useless; all on by default) |
| Count | 1–12 Pokémon, default 6. Ability 1–12, default 3. Moves 4–12, default 8. Move-before `movesPerPokemon` 1–4, default 4. Items 1–12, default 3 |
| Insufficient pools | Typed error + user-facing explanation; never a silent short list |
| RNG | `lib/randomizer/randomUtils.ts` only. No `Math.random()` in product code |
| Re-roll | Replaces **one** option in the **viewed** generation. Not a new Generate. No Previous/Next history. None is not re-rollable |
| Tera / gender / level / shiny | In V1 UI, validation, recap, and export. Not auto-filled |
| Nickname | Optional, above the Pokémon, at most 18 characters. Blank uses the species name |
| Happiness | 0–255, default 255. Frustration is strongest at 0. Return is strongest at 255 |
| EVs | Blank slots count as 0 and the user does not type 0. Total cannot pass 508. Per-stat cap is 252. Sliders are always scaled 0–252 and still clamp to the remaining total. Confirm with `evsConfirmed`. Four moves show a Smogon guess; applying it sets those EVs and that Nature and does not confirm. |
| IVs | Start at 31 in every stat. The user can change any stat from 0 to 31 |
| Descriptions | Do not invent or paraphrase. Pokédex = latest unique English PokéAPI flavor. Ability/move/item `description` prefers PokéAPI English `short_effect`/`effect` when it includes numbers, then Showdown battling text with numbers, then flavor |
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
components/layout/           Header, footer, phase placeholder
components/randomizer/       Order list + tabs + Pokémon / Ability / Move / Item UI
components/recap/            Pokédex card, idle model, save-to-team
components/teams/            Team list, clear confirmation, slot sprites
components/ui/               shadcn button + card
lib/types/                   Normalized catalogs + session
lib/data/classify.ts         Form type, evolution depth, pseudo-legendaries
lib/data/evolution.ts        Later-stage targets + overlapping-path uniqueness
lib/data/genera.ts           English PokéAPI genus
lib/data/loadCatalog.ts      Node loader (mtime-aware cache) + slim Pokémon payload
lib/data/moveDisplay.ts      Power / Accuracy chip labels
lib/data/item-teambuilder.ts Showdown item category mapping
lib/filters/                 Pokémon, move, and item filters from RandomizerConfig
lib/randomizer/              defaults, RNG, engines, custom order, extras, session helpers
lib/builder/                Draft setters, pools, learnsets, move search/sort, item search, ability groups, Smogon EV guess, randomizer locks
lib/stats/battleStat.ts     Gen 3+ battle stat formula
lib/session/                 sessionStorage for RandomizerSession
lib/validation/              EV/IV/nature/ability/moves/item/tera/gender/level/shiny/happiness/set (`REQUIRED_MOVE_COUNT = 4`, `MAX_EV_TOTAL = 508`)
lib/showdown/exportSet.ts    One set, and a team paste with a blank line between sets
lib/recap/                   Recap entries, 3D model URLs, idle-clip choice, shiny texture pairing
lib/teams/                   Team box, localStorage, Showdown team paste, HOME sprite URLs
scripts/import/              Repeatable PokéAPI + @pkmn/dex snapshot, learnsets, Hidden Abilities, model index, genera
data/generated/              catalog.json (~4.7MB, version 2.4.0), learnsets.json, hidden-abilities.json, join-report.json, pokemon-model-index.json, genera.json
data/smogon/                 Gen 9 analyses used for the EV guess. Do not hand-edit.
data/cache/pokeapi/          Gitignored HTTP cache
tests/unit/                  Domain tests (Vitest)
tests/e2e/builder.spec.ts    Builder, recap, and saved-team flow (Playwright)
tests/e2e/randomizer.spec.ts Real randomizer flow (Playwright)
data/smogon/                 Gen 9 analyses used for the EV guess. Do not hand-edit.
data/cache/pokeapi/          Gitignored HTTP cache
tests/unit/                  Domain tests (Vitest)
tests/e2e/builder.spec.ts    Builder fill-in (Playwright)
tests/e2e/randomizer.spec.ts Real randomizer flow (Playwright)
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

Default **form** pool on `/randomizer` is **1023** base formes. Default **compatible** pool (overlapping-path uniqueness) is **575**. Generate and insufficient-pool errors use `matchingPokemonPoolSize`, not the raw form count.

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
- Moves: applied randomizer moves stay in that many slots and are locked. Empty slots use every standard move or that Pokémon's learnset (`data/generated/learnsets.json`: level-up, egg, TM, tutor, and transfer, including earlier stages). The list is not capped. Search matches letters the way a Showdown id does. Column headers sort the current list. A power of 1 is a variable-damage placeholder and displays as a dash; those dashes sort as the lowest power.
- Item: a categorized scrollable list matching the item randomizer (Popular items, Items, Pokémon-specific items, Usually useless items, Useless items), with search. Explicit None stays available. A randomizer-chosen item, including None, is locked and its effect stays visible.
- Stats: six rows like the Showdown teambuilder (base bar, EVs, slider, IVs, calculated stat). Formula is official Gen 3+ in `lib/stats/battleStat.ts`. Blank EVs preview as 0. Missing IVs preview as 31. Unset level previews at 100. Shedinja's base HP of 1 stays 1.
- Smogon guess appears when all four moves are chosen (`data/smogon/gen9-analyses.json`). "Use this spread" fills those EVs and that analysis Nature and does not confirm.
- EVs, Nature, Tera, mixed gender, level, and shiny stay unset until the user sets them, except the Smogon apply above. A new roll, a different Pokémon, or an evolution clears EVs, Nature, and confirmation. IVs start at 31. Happiness starts at 255 (0–255). Nickname is optional, max 18, and sits above the Pokémon.
- Gender-locked and genderless species do not ask for a gender. `validateSet` fills the only legal gender.
- Live issues come from `validateSet`. Continue to recap stays disabled until the set is valid, then stores `finalizedSet`.

## Phase 7 Recap and saved teams

`/recap` shows one Pokédex-style card for the finalized set. The summary Name line is the nickname, or the species name when there is no nickname. The line under the species name on the 3D name plate is the official English genus from `genera.json` (`npm run import:genera`). There is no separate Species row. Copy to Showdown copies `exportShowdownSet`. Next Randomizer calls `startNextRandomizer()` (`createInitialSession()`) and opens `/randomizer`. It clears rolls, extras, the draft, and `finalizedSet`. It does not clear teams.

The 3D stage always animates the regular or form GLB from `data/generated/pokemon-model-index.json` (`npm run import:models`, Pokemon-3D-api commit `429de1288cea0d43f5b4f56305d2276e94239d65`). `preferredIdleAnimation` picks a clip whose name matches `/a?idle/i`, otherwise the first clip. `waitA` is not treated as idle. When the set is shiny and a distinct shiny GLB exists, `lib/recap/shinyColors.ts` paints that file's base-color textures onto the animated model only when every material pairs by normalized name or body/eye role. Pairing is all-or-nothing. No shiny file means regular colors and the idle still plays. The page requests GLBs directly. It does not call the GitHub contents API or PokéAPI.

`/teams` lists every saved team. From the recap the user can copy the set, save it into the next open slot of the active team, or save it as slot 1 of a new team. Other teams stay intact. There is no limit on the number of teams. Each team holds 6 Pokémon, packed from the front.

On a team the user can:

- View recap: the same Pokédex card, including its Showdown set, without replacing the randomizer session
- Move to another filled slot
- Remove one slot
- Copy one set, or copy the team (`exportShowdownTeam`, blank line between sets)
- Clear team: a confirmation dialog first. Cancel does nothing. Confirm removes that team only
- See the latest sprite: Pokémon HOME, then official artwork, then the default sprite. Shiny sets use the shiny HOME sprite

Domain rules live in `lib/teams`. The UI calls them. Invalid stored JSON becomes an empty team box. Do not add a database for teams.

Phase 8 is polish. Do not start it unless asked.

---

## Known issues / watchouts

- Next.js overlay “1 Issue” during Cursor browser verification is often **`data-cursor-ref` hydration**, not app `Math.random()`. Do not “fix” RNG for that.
- Filter groups use a real `<fieldset>` / `<legend>`. Filter dropdowns use native `<details>`.
- Playwright `getByRole("button", { name: "Clear generations" })` is the **filter toolbar**, not “Clear generated Pokémon”. Open the Generations dropdown first.
- Aegislash catalog `id` is `aegislash`; `pokeApiSlug` is `aegislash-shield`. Look up by Showdown `id` for evolution-path tests.
- Header can feel tight on a 390px viewport; not in-scope unless asked.
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

> Continue the Pokémon Randomizer. Read `handoff.md` and `AGENTS.md`. You are on `feat/phase-7-recap`. Phases 1–6 are on `master`. Phase 7 recap and saved teams are implemented and not merged. Do not start polish unless I ask. Do not commit unless I ask.
