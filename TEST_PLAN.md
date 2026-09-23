# Test plan

## Tools

- Vitest: unit tests for classification, RNG, validation, Showdown export, Pokémon filters, Pokémon rolls, ability rolls, move rolls, item rolls.
- Playwright: browser smoke of the app shell, the Pokémon generate flow, the ability generate flow, the move generate flow, and the item generate flow.

## Current coverage (Phase 4/5 Pokémon + Ability + Move + Item slices)

- EV total 510, EV total over 510, single-stat cap.
- Missing Nature, too few / too many moves, IV range.
- Required Tera / level / shiny.
- Full set validation, including unconfirmed EVs.
- Showdown golden text for Swampert, plus gender / level / shiny / Tera variants.
- Form type, evolution depth, pseudo-legendary list, seeded unique picks, insufficient pools.
- Showdown catalog filters (mega/Gmax kept, CAP/Z/Max excluded).
- Generated catalog integrity: dual ids, unique form ids, fixture species (Mewtwo, Articuno, Nihilego, Walking Wake, Dragonite, Pichu, Alolan Raichu, Mega Venusaur), numeric ability/move/item effects (Blaze 1.5×, Ember 10% burn, Metal Coat 20%, Punk Rock 1.3×, Leftovers 1/16) and latest Bulbasaur Pokédex flavor.
- Home → randomizer navigation.
- Pokémon filters: generation, type OR/AND, form type, evolution stage, special exclusions.
- Move category filters: Physical / Special / Status (all on by default; empty list matches nothing).
- Move type filters: the 18 Pokémon types (all on by default; empty list matches nothing). Category and type filters apply together.
- Item category filters: Showdown teambuilder groups Popular Items, Items, Pokémon-Specific Items, Usually Useless Items, and Useless Items (all on by default; empty list matches nothing).
- Filter combinations against the generated catalog (defaults, Alolan Raichu, Mega Venusaur, Charizard types, Primal Kyogre, Galarian Articuno).
- Pokémon randomizer: unique overlapping evolution paths, split-branch compatibility, seed reproducibility, default pool excludes Mega, insufficient pools, invalid counts.
- Catalog rolls: six unique base formes for a fixed seed; gen 1 + mega throws instead of a short list.
- Evolution targets: later Showdown evos only; Charmander → Charmeleon/Charizard; Pikachu includes Alolan Raichu; Silcoon does not include Dustox; Mega/Gmax skipped.
- Randomizer session helpers: keep earlier rolls, previous/next generation paging, select from history, ignore unknown ids, evolve the selected Pokémon or keep it.
- Randomizer flow: custom `randomizerOrder`; skip Ability/Move/Item when off; open Ability, Move, or Item after Pokémon when on; Ability-first, Move-first, and Item-first open without a selected Pokémon; `builderAbilityPool` uses usual `abilityIds` when skipped and rolled options when on; user-applied unique extras before Pokémon; Move-before applies `movesPerPokemon` unique moves (1–4, default 4). Order tiles drag and drop (keyboard: Space to pick up, Up/Down to move, Space to drop).
- Ability randomizer: unique ids, seed reproducibility, full catalog even when `abilityPoolMode` is `"legal"`, insufficient pools, invalid counts, catalog rolls of 3 unique abilities.
- Move randomizer: unique ids, seed reproducibility, full catalog even when `movePoolMode` is `"learnset"`, Physical / Special / Status category filters and 18-type filters (all default on; empty list matches nothing; combined), insufficient pools, invalid counts (outside 4–12), catalog rolls of `moveCount` unique standard moves (no Z/Max). Result cards show Power and Accuracy (`Accuracy 90%`, or Can't miss when there is no accuracy check).
- Randomizer session helpers for abilities: store a roll only for `battlePokemonId` when Ability is after Pokémon; Ability-first stores a pool, the user applies unique abilities onto Pokémon, selection requires an applied ability, evolve keeps it; clear Pokémon rolls keep the pre-Pokémon pool.
- Randomizer session helpers for moves: store a roll only for `battlePokemonId` when Move is after Pokémon, then pick four unique `draft.moveIds`; Move-first stores a pool, the user applies `movesPerPokemon` unique moves onto Pokémon, selection requires that many applied moves, evolve keeps applied moves, dropping below the chosen count clears selection; clear Pokémon rolls keep the pre-Pokémon pool; no auto-assign.
- Item randomizer: unique ids, seed reproducibility, catalog holdables only (None is extra selectable, not an RNG id), Showdown teambuilder category filters (Popular / Items / Pokémon-Specific / Usually Useless / Useless; all default on; empty list matches nothing), insufficient pools, invalid counts, catalog rolls of `itemCount` unique holdables.
- Randomizer session helpers for items: store a roll only for `battlePokemonId` when Item is after Pokémon, then pick one or None; Item-first stores a pool, the user applies unique items onto Pokémon (None allowed), selection requires an applied item, evolve keeps it; clear Pokémon rolls keep the pre-Pokémon pool; no auto-assign.
- Re-roll: `rerollUnique` / `rerollPokemon` / `rerollAbility` / `rerollMove` / `rerollItem` pick a different unused id from the remaining filtered pool; Pokémon still exclude overlapping evolution paths with kept forms; exhausted remaining pools throw `rerollEmptyMessage`. Session `replaceRolled*` edits the viewed generation in place, remaps applied extras and the draft, and does not prepend history.
- Playwright: typical path generate/select/Continue to Abilities then pick one, then Continue to Moves and pick four, then Continue to Items and pick one. Ability-first, Move-first, and Item-first apply-then-select. Item category dropdown follows Showdown teambuilder groups. Per-option Re-roll in place on Pokémon, Ability, Move, and Item; None has no Re-roll; exhausted remaining Pokémon pool keeps the current cards and shows the re-roll error. Move cards show Power and Accuracy percentages. Randomizer order tiles drag and drop, with keyboard Space/Arrow reorder.

## Upcoming

- Builder and recap end-to-end, clipboard export (Phases 6–7). Fill remaining move slots after a partial Move-before apply from original learnset or custom/rolled pool depending on format.

## Quality bar

A feature is done when implementation, tests, lint, typecheck, and relevant error/loading/accessibility behavior are in place. UI is not done from a screenshot alone.
