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

Ability, moves, item, EVs, IVs, Nature, Tera, gender, level, shiny, and live validation. Implemented on `feat/phase-6-builder`. The session is shared with `/randomizer` and restored from `sessionStorage`. `/recap` is still a placeholder.

## Phase 7 — Recap and Showdown export (next)

Recap card and Copy to Showdown. Not started. `finalizedSet` is written when the builder validates.

## Phase 8 — Polish

Accessibility, responsive, loading/error, performance, visual consistency.

## Later, not now

Team builder, saved builds, accounts, share URLs, public seeds, learnset-only and competitive pool modes.
