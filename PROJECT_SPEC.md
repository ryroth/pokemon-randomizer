# Project spec

Consumer-facing web app for randomizing one Pokémon and building a Pokémon Showdown-compatible set.

## V1 flow

1. Configure Pokémon filters and optional ability / move / item randomizers.
2. Generate a requested number of unique Pokémon.
3. Select one result.
4. Build the set: item, ability, four moves, EVs, IVs, Nature, Tera type, gender, level, shiny.
5. Validate the set.
6. View a recap card.
7. Copy Showdown text.

Pokémon are always randomized. Abilities, moves, and items are independently optional.

## Filters

- Generations 1–9, multi-select, select all / clear all.
- Types, default OR, optional AND.
- Formes: base, regional, Mega, Primal, Gigantamax, other. **Base is on by default; Mega and the rest are off.**
- Evolution stages: basic, stage 1, stage 2 from the evolution chain.
- Special classifications, independently allowed: pseudo-legendary, sub-legendary, legendary (Restricted Legendary), mythical, paradox, ultra beast.

Dynamax is a battle mechanic, not a randomizable form. Gigantamax is a form.

## Builder rules

Do not auto-assign EVs, IVs, Nature, Tera type, mixed-gender, level, or shiny. A set cannot be finalized until those required fields are explicitly configured. Genderless Pokémon omit gender. Gender-locked species use their only legal gender.

## Export

Copy to Showdown copies only compatible set text. Tera type is always included. Gender, level, and shiny follow Showdown omission rules (no gender if genderless, no level line at 100, no shiny line when not shiny).

## Out of scope for V1

Six-Pokémon teams, saved builds, accounts, shareable URLs, public seeds, learnset-only pools, competitive-only pools.
