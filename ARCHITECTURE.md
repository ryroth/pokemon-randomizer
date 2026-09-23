# Architecture

## Layers

```text
PokéAPI + Showdown → import scripts → generated JSON catalogs
                                         ↓
                    filters → seeded randomizer → session
                                         ↓
                    builder → validators → recap + Showdown export
                                         ↓
                                        UI
```

The UI never owns pool logic, classification, or validation. Session state is a serializable `RandomizerSession` so later team, seed, and share features can reuse it.

## Stack

- Next.js App Router, React, strict TypeScript
- Tailwind CSS and shadcn/ui
- Vitest for unit tests, Playwright for browser tests
- No database in V1
- No live PokéAPI requests from the browser

## Key modules

| Path | Responsibility |
| --- | --- |
| `lib/types` | Normalized catalogs and session types |
| `lib/data/classify.ts` | Form type, evolution stage, pseudo-legendary |
| `lib/data/evolution.ts` | Later-stage battle evolution targets from the Showdown evo graph |
| `lib/filters` | Pokémon pool filters and move/item category filters from `RandomizerConfig` |
| `lib/randomizer` | Seeded RNG, defaults, Pokémon / ability / move / item engines, session helpers |
| `lib/data/loadCatalog.ts` | Node catalog loader; slims Pokémon rows for the client |
| `lib/validation` | EV/IV/set rules and user-facing errors |
| `lib/showdown/exportSet.ts` | Deterministic Showdown text |
| `scripts/import` | Repeatable PokéAPI + `@pkmn/dex` snapshot into `data/generated/catalog.json` |

## Data sources

- **PokéAPI:** National Dex, dex entries, sprites/artwork, evolution chains, official `is_legendary` / `is_mythical` / `is_baby`, latest unique English flavor text, ability/move/item `effect_entries`, move metadata.
- **Showdown:** teambuilder names, formes, tags for Restricted Legendary, Sub-Legendary, Mythical, Paradox, Ultra Beast, and battling `shortDesc`/`desc` when PokéAPI effect text omits numeric mechanics.
- **Showdown:** teambuilder names, formes, tags for Restricted Legendary, Sub-Legendary, Mythical, Paradox, Ultra Beast.
- **Derived:** evolution stage from chain depth; pseudo-legendaries from a documented list; form type from Mega / regional / Gmax flags.

## Defaults

- Pokémon count 1–12, default 6.
- Type match mode OR (form has at least one selected type). AND requires every selected type.
- Form types: base on; Mega, regional, Primal, Gmax, and other off.
- All special classifications allowed.
- Ability/move/item randomization off until the user enables them.

`filterPokemonForms` in `lib/filters` applies those rules to `PokemonForm[]`. Empty generation, type, form-type, or evolution-stage lists match nothing. Special flags are exclusions (`allowLegendary: false` drops Restricted Legendaries); they do not require those classifications. The function returns the matching pool (possibly empty); insufficient-pool errors belong to the randomizer.

`randomizePokemon` draws forms that do not share an overlapping evolution path, with a caller-supplied seed. Split branches may appear in the same generation. Successful rolls are kept on `RandomizerSession.pokemonRolls`. The UI shows one generation at a time and Previous/Next walk that history. After a Pokémon is selected, the user can keep it or evolve to a later stage in its line (`evolvedPokemonId`) before extras that run **after** Pokémon. `randomizeAbilities` draws `abilityCount` unique abilities from the full standard catalog (`abilityPoolMode: "all"`). Legal-only mode is not implemented. `randomizeMoves` draws `moveCount` unique moves from the standard catalog, filtered by selected Physical / Special / Status categories and move types (`movePoolMode: "all"`). Learnset-only mode is not implemented. `randomizeItems` draws `itemCount` unique holdables from `catalog.items`, filtered by selected Showdown teambuilder categories (`itemCategories`: Popular Items, Items, Pokémon-Specific Items, Usually Useless Items, Useless Items; all five on by default). Explicit None is always an extra selectable choice (`draft.itemId === null`) and is not a catalog id. `rerollPokemon`, `rerollAbility`, `rerollMove`, and `rerollItem` replace one option in the currently viewed generation without appending history. Replacements stay unique against remaining siblings; Pokémon still use overlapping-path uniqueness. Exhausted remaining pools throw `InsufficientPoolError` with a re-roll-specific message.

The four randomizers can run in any order (`randomizerOrder`, default Pokémon → Ability → Move → Item). Enable toggles live on the order list, not the Pokémon tab. If Ability, Move, or Item runs after Pokémon, generate/select happens on that extra's tab for `battlePokemonId`. If an extra runs before Pokémon, its tab builds a pool; the user then applies extras to a generated Pokémon they choose. Ability-before requires an applied ability to select. Move-before uses `movesPerPokemon` (1–4, default 4); leftover generated moves stay unused; empty slots stay empty for the Builder. Item-before requires one applied item, including None. If a checkbox is off, that tab is skipped. The builder later offers `PokemonForm.abilityIds` when Ability is off.

## Showdown export

`exportShowdownSet` maps a validated `PokemonSet` plus display names into teambuilder text. IVs of 31 and 0 EVs are omitted. Level 100 is omitted. Tera type is always written.
