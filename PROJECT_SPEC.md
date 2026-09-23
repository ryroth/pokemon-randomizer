# Project spec

Consumer-facing web app for randomizing one Pokémon and building a Pokémon Showdown-compatible set.

## V1 flow

1. Choose the order of Pokémon, Ability, Move, and Item. Typical order is Pokémon, then Ability, then Moves, then Items. Pokémon is always on; the others are independently optional and skipped when off.
2. Configure and generate each enabled randomizer in that order. After any generate, the user can re-roll an individual option in place any number of times. Re-roll keeps the rest of that generation, stays unique against the remaining options, and does not create a new Previous/Next generation. None is not re-rollable. If nothing else matches, keep the current option and show an error.
3. If Ability, Move, or Item runs **after** Pokémon: select a Pokémon (and optional evolution), then generate extras and pick for that battle Pokémon.
4. If an extra runs **before** Pokémon: generate that extra pool first, then generate Pokémon. The user applies extras to the Pokémon they choose (one unique ability or item each; `movesPerPokemon` unique moves each, 1–4, default 4). Leftovers stay unused. Then select a Pokémon (Ability-before still requires an applied ability; Move-before requires the chosen number of applied moves; Item-before requires an applied item, including None).
5. Build the set: item, ability, four moves, EVs, IVs, Nature, Tera type, gender, level, shiny. If ability randomization was skipped, the builder offers that Pokémon's usual abilities. Empty move slots after a partial Move-before apply are filled here from the original learnset or the custom/rolled pool, depending on format.
6. Validate the set.
7. View a recap card.
8. Copy Showdown text.

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
