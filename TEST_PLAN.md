# Test plan

## Tools

- Vitest: unit tests for classification, RNG, validation, Showdown export, Pokémon filters, Pokémon rolls, ability rolls, move rolls, item rolls.
- Playwright: browser smoke of the app shell, the Pokémon generate flow, the ability generate flow, the move generate flow, and the item generate flow.

## Current coverage (through Phase 8)

- EV total 508, EV total over 508, single-stat cap. Blank EV slots count as 0.
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
- Catalog rolls: six unique base, regional, or other forms for a fixed seed; gen 1 + mega throws instead of a short list.
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
- Playwright: typical path generate/select/Continue to Abilities then pick one, then Continue to Moves and pick four, then Continue to Items and pick one. Ability-first, Move-first, and Item-first apply-then-select. Back returns to the previous enabled tab. The first tab has no back button. Item category dropdown follows Showdown teambuilder groups. Per-option Re-roll in place on Pokémon, Ability, Move, and Item; None has no Re-roll; exhausted remaining Pokémon pool keeps the current cards and shows the re-roll error. Move cards show Power and Accuracy percentages. Randomizer order tiles drag and drop, with keyboard Space/Arrow reorder.

- Builder draft: no auto EVs, Nature, Tera, gender, level, or shiny; IVs default to 31; happiness defaults to 255; nickname is optional and spaces count toward 18; ability and moves stay inside their pools; duplicate moves rejected; EV edits clear confirmation; gender-locked species stay unset; finalize requires `validateSet`.
- Suggested spread: four moves produce a Showdown-style role, EVs, and Nature (`suggestEvSpread`). Fewer than four moves produce nothing, except Ditto, Unown, and Last Resort. Applying the suggestion sets those EVs and that Nature and does not confirm.
- Builder pools: rolled moves or items when that randomizer is on; standard catalog when it is off; None is always in the item pool. Partial EV spreads name the blank stats.
- Playwright: generate, select, continue to the builder, confirm unset EVs/IVs/Nature/Tera/level/shiny, fill a set, continue to `/recap`.

- Recap: still artwork (shiny artwork for a shiny Pokémon, never regular colors), held-item icon, genus text, one export card per finalized set, a set with one move, Showdown text matches `exportShowdownSet`. Art: `pokemonImage` order, no animated URLs, every form has artwork and shiny artwork.
- Teams: a new team leaves earlier teams unchanged, the next slot fills until 6, one slot can be removed or moved, clearing one team leaves the others, a team paste separates sets with a blank line, broken storage becomes an empty box, HOME sprites are preferred.
- Draft team: one roster beside finished teams. Adding captures species, shiny, and randomizer locks. The next roll keeps settings and clears the roll. A seventh Pokémon is refused. Removing a slot is allowed until a slot is built. The sixth finished set becomes a normal team. A broken roster is dropped and the finished teams stay. The Builder for a drafted Pokémon uses those stored locks.
- Playwright: after the builder fill-in, the recap shows that Pokémon and its Showdown text, Copy to Showdown writes the clipboard, save to a new team survives Next Randomizer, the team recap opens, and removing the slot empties it.
- Polish: the header marks the current page, fits a 390px viewport without sideways scrolling, and an unknown URL shows Page not found. Type chip text meets a 4.5:1 contrast ratio.

## Formats and the damage check

- Presets stay valid and locked. Customizing one does not change the original. A user format can be saved, renamed, duplicated, restored to its previous save, and deleted. A stat budget is rejected when custom stats are off.
- Custom types reject duplicates. Custom base stats reject non-integers and a total over the format budget.
- OU allows a shiny set and rejects custom types. Open lab allows custom types. A format can forbid shinies without involving `shinyChance`.
- Generation 9 damage: Flamethrower from a neutral level 100 Charizard into a neutral level 100 Venusaur is 210–248, Thunderbolt into a Ground type is 0, and two snapshots can type the same species differently.
- The Showdown paste still writes `Shiny: Yes` and does not write custom types or base stats.
- Playwright: Format Explorer search, customize a preset, see the diff, save, and the original preset still says species typing only.
- A singles battle copies its fighters, the faster Pokémon moves first, a faint asks for a replacement, Choice Band locks a move until a switch, and Levitate, Huge Power, and Life Orb change the result. A critical hit is 1 in 24 and is announced only when that roll lands. Two battles do not share HP. A doubles format says doubles is not played.
- Playwright: Pikachu's Thunderbolt into Sandshrew is immune, and Sandshrew's Scratch still lands.

## Upcoming

- Learnset-only and competitive pool modes. A single Generate of six Pokémon is not started. Drafting one Pokémon at a time until a team has six, then building each slot, is covered above.

## Quality bar

A feature is done when implementation, tests, lint, typecheck, and relevant error/loading/accessibility behavior are in place. UI is not done from a screenshot alone.
