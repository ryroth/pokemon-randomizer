# Roadmap

## Phase 0 — Discovery

Architecture review. Complete.

## Phase 1 — Foundation

Next.js, TypeScript, Tailwind, shadcn/ui, docs, data model, validation, export formatting, import scaffolding, tests.

Exit gate: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Complete.

## Phase 2 — Data layer

Full PokéAPI + Showdown snapshot into `data/generated/catalog.json`, unmatched-join report, and integrity tests. Complete.

## Phase 3 — Filtering engine

All Pokémon filters, including combinations. Complete.

## Phase 4 — Randomization engine

Seeded unique draws and insufficient-pool errors. Complete on `master` (PR #4).

1. Pokémon — overlapping-path uniqueness, optional evolve, Previous/Next history
2. Ability — full catalog pool; after-Pokémon pick or before-Pokémon apply
3. Move — category/type filters; after-Pokémon pick four or before-Pokémon `movesPerPokemon`
4. Item — Showdown teambuilder categories; after-Pokémon pick one/None or before-Pokémon apply
5. Per-option re-roll on Pokémon, Ability, Move, and Item

## Phase 5 — Randomizer UI

Configure → generate → select → optional evolve → Continue to the next **tab** in `randomizerOrder` (default Pokémon → Ability → Move → Item). Extras can run before Pokémon. Unchecked randomizers are skipped. Order tiles are drag-and-drop. Complete on `master` (PR #4).

## Phase 6 — Pokémon builder

Ability, moves, item, EVs, IVs, Nature, Tera, gender, level, shiny, and live validation. Complete on `master` (PR #5). The session is shared with `/randomizer` and restored from `sessionStorage`.

## Phase 7 — Recap, Showdown export, and saved teams (current)

A Pokédex-style card for the finalized Pokémon, with the regular 3D idle model, shiny colors painted on when the materials match, Copy to Showdown, and Next Randomizer. Finished sets can be saved to local teams of 6, reordered, removed, cleared after confirmation, and copied as one Showdown team. Implemented on `feat/phase-7-recap`. The randomizer is still one Pokémon at a time. There is no database.

## Phase 8 — Polish

Accessibility, responsive, loading/error, performance, visual consistency.

## Later, not now

Team builder of six **randomized** Pokémon, accounts, share URLs, public seeds, learnset-only and competitive pool modes. Saving finished sets onto local teams is part of Phase 7.
