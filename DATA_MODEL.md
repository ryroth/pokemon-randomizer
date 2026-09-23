# Data model

The randomizable unit is a **Pokémon form**, not a National Dex species. `venusaur` and `venusaurmega` are two catalog rows that share `speciesId`.

## Catalogs

Stored as generated JSON (`data/generated/catalog.json` after Phase 2):

- `PokemonForm`
- `PokemonSpecies`
- `Ability`
- `Move`
- `Item`
- `Nature`

Every entity keeps both `pokeApiSlug` and `showdownName`. Catalog `id` values are Showdown ids for Pokémon forms, abilities, moves, items, and natures. Species ids are PokéAPI slugs (`raichu` is shared by Kanto and Alolan Raichu).

## Import

`npm run import:data` snapshots PokéAPI over HTTP (cached in `data/cache/pokeapi/`, gitignored) and joins `@pkmn/dex` at import time.

- Pokémon rows start from Showdown teambuilder species (including Past mega/Gmax formes; excluding CAP, LGPE, and cosmetic-only formes).
- PokéAPI supplies dex text, official artwork URLs, evolution chains, gender, baby flags, and English ability/move/item flavor plus `effect_entries`. Pokédex cards use the latest unique English flavor (control characters and in-game line breaks collapsed to spaces). Ability, move, and item `description` prefers PokéAPI `short_effect`/`effect` when that text includes numeric mechanics (20%, 1/16, 1.5×), then Showdown `shortDesc`/`desc` when PokéAPI only has flavor (Punk Rock 1.3×). Do not invent multipliers. Do not scrape Pokémon Database, Bulbapedia, or Serebii.
- Showdown `evos` supply `evolutionTargetIds` on each form: later stages in that forme's line, excluding Mega, Primal, and Gigantamax.
- Unmatched records are written to `data/generated/join-report.json` instead of being dropped silently. Showdown-only Pokémon stay in the catalog with empty dex/sprite fields. Typical leftovers are plate/drive/Tera/cosmetic formes that PokéAPI stores as form records rather than `/pokemon` varieties.
- Sprites are stored as PokéAPI official-artwork URLs. Images are not vendored.
- The app must not call PokéAPI in the browser. Re-run the importer when source data changes.

## Classification

### Evolution stage

Walk the PokéAPI evolution chain:

- depth 0 → `basic` (includes unevolving species and babies)
- depth 1 → `stage1`
- depth 2 or more → `stage2`

Branching lines (Eevee) assign each species its own depth. Alolan Raichu stays stage 2 of the Pichu line; its `generation` is 7 and `formType` is `regional`.

### Form type

- `mega` — Mega Evolutions (available as a filter, off by default)
- `regional` — Alola, Galar, Hisui, Paldea
- `primal` — Primal Kyogre / Groudon
- `gmax` — Gigantamax
- `base` — default forme
- `other` — remaining named formes

Dynamax is not a form.

### Special flags

| App flag | Rule |
| --- | --- |
| `isLegendary` | Showdown tag `Restricted Legendary` |
| `isSubLegendary` | Showdown tag `Sub-Legendary` |
| `isMythical` | Showdown `Mythical`, cross-checked with PokéAPI |
| `isParadox` / `isUltraBeast` | Showdown tags |
| `isPseudoLegendary` | Explicit species list: Dragonite, Tyranitar, Salamence, Metagross, Garchomp, Hydreigon, Goodra, Kommo-o, Dragapult, Baxcalibur |

Generation on a form is the **form introduction generation**.

### Item teambuilder category

Each catalog item stores a mechanical `kind` (`held`, `berry`, `mega-stone`, `z-crystal`, `other`) and a Showdown teambuilder `category` used by the Item randomizer:

| Category | Showdown header |
| --- | --- |
| `popular` | Popular Items |
| `items` | Items |
| `pokemon-specific` | Pokémon-Specific Items |
| `usually-useless` | Usually Useless Items |
| `useless` | Useless Items |

Classification follows pokemonshowdown.com's default teambuilder (current-gen singles, not Doubles or Metronome Battle) from the client `build-indexes` script. Species-specific rows use `itemUser` or `megaStone`. Mail and most Gems, which that list hides as Unreleased, are stored as Useless Items. Do not invent a sixth Unreleased filter unless asked.

## Pokémon filters

`filterPokemonForms(pokemon, config)` in `lib/filters` is the only pool builder. It reads `PokemonForm` fields and `RandomizerConfig` filter keys; it does not use raw PokéAPI or Showdown objects.

- Generation, form type, and evolution stage are membership checks.
- Type OR: at least one of the form's types is selected. Type AND: every selected type is on the form.
- Special classifications are independent exclusions. Unchecking legendary does not affect mythicals, and so on.
- Empty generation / type / form-type / evolution-stage selections yield an empty pool.

## Pokémon randomization

`randomizePokemon(pokemon, config, seed)` in `lib/randomizer` is the only Pokémon draw. It filters with `filterPokemonForms`, then picks `pokemonCount` forms that do not share an overlapping evolution path. Linear lines stay unique (Honedge excludes Doublade and Aegislash). Split branches may appear together: Cascoon can share a batch with Silcoon or Beautifly, but not with Wurmple or Dustox. Pool size is how many compatible Pokémon the filters can actually yield. The same seed and config reproduce the same ids. If the pool is smaller than the requested count, it throws `InsufficientPoolError` instead of returning a short list. Counts outside 1–12 throw `InvalidPokemonCountError`.

Each successful roll is stored on the session as `pokemonRolls` (newest first). `resultPokemonIds` is the latest roll. `viewedRollIndex` is which generation is on screen: 0 is current, higher values are older. Previous/Next steps through that history. Changing filters or the requested count does not drop earlier rolls, and a failed generate does not replace them. Users can select a Pokémon from any stored roll.

After a Pokémon is selected, `evolutionTargetIds` lists later stages in its Showdown evolution line (skipping Mega, Primal, and Gigantamax). The user may keep the rolled form or choose one of those later forms as `evolvedPokemonId` — the Pokémon they will use in battle. Default is to keep the selected form. The rolled pick stays on `selectedPokemonId`. Extras that run after Pokémon use `battlePokemonId` (`evolvedPokemonId` if set, otherwise `selectedPokemonId`). Extras assigned before Pokémon stay on the selected result when it evolves.

## Ability randomization

`randomizeAbilities(abilities, config, seed)` in `lib/randomizer` is the only ability draw. When randomization is on, it picks `abilityCount` unique abilities (1–12, default 3) from the full standard catalog by ability id. `abilityPoolMode: "legal"` is stored but not honored; V1 always uses `"all"`. The same seed and count reproduce the same ids. Insufficient pools throw `InsufficientPoolError`. Counts outside 1–12 throw `InvalidAbilityCountError`.

The user can put Pokémon, Ability, Move, and Item in any order (`randomizerOrder`). Default is Pokémon → Ability → Move → Item. Disabled extras are skipped. If Ability runs after Pokémon, generate/select happens on a separate Abilities tab for the current `battlePokemonId`. Changing the selected or evolved Pokémon then clears `abilityOptions` and `draft.abilityId`. If Ability runs before Pokémon, the pool is generated first; the user applies each ability to a generated Pokémon they choose (`applyAbilityToRolledPokemon`, unique per roll, leftovers unused). Selecting a Pokémon requires an applied ability and copies it onto `draft.abilityId`. Evolving that pick keeps the assignment. If `randomizeAbilities` is off, Continue skips that tab. `builderAbilityPool` returns the battle Pokémon's usual `abilityIds` when skipped, or the rolled `abilityOptions` when on.

## Move randomization

`randomizeMoves(moves, config, seed)` in `lib/randomizer` is the only move draw. When randomization is on, it picks `moveCount` unique moves (4–12, default 8) from the standard catalog by move id, limited to `moveCategories` (Physical / Special / Status; all three on by default) and `moveTypes` (all 18 Pokémon types on by default). An empty category list or empty type list matches nothing. `movePoolMode: "learnset"` is stored but not honored; V1 always uses `"all"` plus the category and type filters. The same seed, count, categories, and types reproduce the same ids. Insufficient pools throw `InsufficientPoolError`. Counts outside 4–12 throw `InvalidMoveCountError`. Z-Moves, Max/G-Max moves, and CAP/nonstandard are already excluded at import.

If Move runs after Pokémon, generate then pick four unique ids from `moveOptions` onto `draft.moveIds` for `battlePokemonId`. Changing the selected or evolved Pokémon then clears `moveOptions` and `draft.moveIds`. If Move runs before Pokémon, the pool is generated first. `movesPerPokemon` (1–4, default 4) is how many unique moves the user must apply to the Pokémon they choose (`applyMoveToRolledPokemon`, unique across the roll, leftovers unused). Remaining slots stay empty for the Builder. Selecting that Pokémon requires that many applied moves and copies them onto `draft.moveIds`, leaving holes. Empty slots are filled later in the Builder from the original learnset or the custom/rolled pool, depending on format. Clearing an applied move below the chosen count clears the Pokémon selection. If Ability is also before Pokémon, select still requires an applied ability. Moves are not auto-assigned in generate order. If `randomizeMoves` is off, Continue skips that tab.

## Item randomization

`randomizeItems(items, config, seed)` in `lib/randomizer` is the only item draw. When randomization is on, it picks `itemCount` unique holdables (1–12, default 3) from `catalog.items` by item id, limited to `itemCategories` (Popular Items, Items, Pokémon-Specific Items, Usually Useless Items, Useless Items; all five on by default). An empty category list matches nothing. Explicit None is not a catalog row and is not drawn by the RNG; it is always offered as an extra selectable choice and stored as `draft.itemId === null` or `appliedItemIds` `null`. The same seed, count, and categories reproduce the same ids. Insufficient pools throw `InsufficientPoolError`. Counts outside 1–12 throw `InvalidItemCountError`. Poké Balls / CAP / nonstandard are already excluded at import. Categories follow pokemonshowdown.com's default teambuilder (current-gen singles). Mail and most Gems, which Showdown hides under Unreleased, are stored as Useless Items.

If Item runs after Pokémon, generate then pick one id from `itemOptions` (or None) for `battlePokemonId`. Changing the selected or evolved Pokémon then clears `itemOptions` and `draft.itemId`. If Item runs before Pokémon, the pool is generated first; the user applies each unique item to a generated Pokémon they choose (`applyItemToRolledPokemon`, unique catalog ids per roll, leftovers unused). None can be applied without consuming a catalog item. Selecting a Pokémon requires an applied item, including None, and copies it onto `draft.itemId`. Evolving that pick keeps the assignment. If Ability-before and/or Move-before are also on, those existing gates still apply. Items are not auto-assigned in generate order. If `randomizeItems` is off, Continue skips that tab.

## Re-roll

Each generated option can be replaced in place any number of times. `rerollPokemon` / `rerollAbility` / `rerollMove` / `rerollItem` pick one new id from the same filtered pool used to generate, excluding the current id and any id still shown in that generation. Pokémon replacements also exclude overlapping evolution paths with the **kept** forms. `replaceRolledPokemon` edits the viewed `pokemonRolls` entry (and `resultPokemonIds` when that entry is current) instead of prepending a new generation. If the replaced id was selected, the session reselects the replacement so extras applied before Pokémon stay on that slot and extras rolled after Pokémon clear when `battlePokemonId` changes. `replaceRolledAbility` / `replaceRolledMove` / `replaceRolledItem` remap `*Options`, applied extras on stored rolls, and the draft. Explicit None is not re-rollable. If the remaining pool is empty, throw `InsufficientPoolError` with `rerollEmptyMessage` and leave the current option.

## Set draft vs finalized set

`PokemonSetDraft` allows unset fields. `PokemonSet` is only produced by `validateSet`. Required builder fields: ability, four unique moves, item or explicit none, confirmed EVs, IVs, Nature, Tera type, gender when mixed, level, shiny.
