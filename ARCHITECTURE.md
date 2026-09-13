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
| `lib/randomizer` | Seeded RNG, defaults, later engine |
| `lib/validation` | EV/IV/set rules and user-facing errors |
| `lib/showdown/exportSet.ts` | Deterministic Showdown text |
| `scripts/import` | Repeatable PokéAPI + `@pkmn/dex` snapshot into `data/generated/catalog.json` |

## Data sources

- **PokéAPI:** National Dex, dex entries, sprites/artwork, evolution chains, official `is_legendary` / `is_mythical` / `is_baby`, flavor text, move metadata.
- **Showdown:** teambuilder names, formes, tags for Restricted Legendary, Sub-Legendary, Mythical, Paradox, Ultra Beast.
- **Derived:** evolution stage from chain depth; pseudo-legendaries from a documented list; form type from Mega / regional / Gmax flags.

## Defaults

- Pokémon count 1–12, default 6.
- Type match mode OR.
- Form types: base on; Mega, regional, Gmax, and other off.
- All special classifications allowed.
- Ability/move/item randomization off until the user enables them.

## Showdown export

`exportShowdownSet` maps a validated `PokemonSet` plus display names into teambuilder text. IVs of 31 and 0 EVs are omitted. Level 100 is omitted. Tera type is always written.
