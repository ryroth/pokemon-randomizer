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
- PokéAPI supplies dex text, official artwork URLs, evolution chains, gender, and baby flags.
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

## Set draft vs finalized set

`PokemonSetDraft` allows unset fields. `PokemonSet` is only produced by `validateSet`. Required builder fields: ability, four unique moves, item or explicit none, confirmed EVs, IVs, Nature, Tera type, gender when mixed, level, shiny.
