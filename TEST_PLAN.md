# Test plan

## Tools

- Vitest: unit tests for classification, RNG, validation, Showdown export.
- Playwright: browser smoke of the app shell, later the full user flow.

## Current coverage (Phase 2)

- EV total 510, EV total over 510, single-stat cap.
- Missing Nature, too few / too many moves, IV range.
- Required Tera / level / shiny.
- Full set validation, including unconfirmed EVs.
- Showdown golden text for Swampert, plus gender / level / shiny / Tera variants.
- Form type, evolution depth, pseudo-legendary list, seeded unique picks, insufficient pools.
- Showdown catalog filters (mega/Gmax kept, CAP/Z/Max excluded).
- Generated catalog integrity: dual ids, unique form ids, fixture species (Mewtwo, Articuno, Nihilego, Walking Wake, Dragonite, Pichu, Alolan Raichu, Mega Venusaur).
- Home → randomizer navigation.

## Upcoming

- Filter combinations (Phase 3).
- Ability / move / item randomizer uniqueness (Phase 4).
- Builder and recap end-to-end, clipboard export (Phases 6–7).

## Quality bar

A feature is done when implementation, tests, lint, typecheck, and relevant error/loading/accessibility behavior are in place. UI is not done from a screenshot alone.
