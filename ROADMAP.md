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

## Phase 4 — Randomization engine (current, per randomizer)

Seeded unique draws and insufficient-pool errors, one randomizer at a time.

1. Pokémon — complete on `feat/phase-4-5-pokemon-randomizer` (uncommitted)
2. Ability — complete on the same branch (uncommitted)
3. Move — complete on the same branch (uncommitted); confirmed
4. Item — complete on the same branch (uncommitted); confirmed
5. Per-option re-roll on Pokémon, Ability, Move, and Item — complete on the same branch (uncommitted); stop for confirmation

Confirm each bullet before starting the next.

## Phase 5 — Randomizer UI (current, paired with Phase 4)

Configure → generate → select → optional evolve → Continue to the next **tab** in `randomizerOrder` (default Pokémon → Ability → Move → Item). Extras can also run before Pokémon; then the user applies unique extras from that pool onto Pokémon they choose. Unchecked randomizers are skipped. Pokémon, Ability, Move, and Item tabs are built. Generated options can be re-rolled in place any number of times. Stop for confirmation after re-roll.

## Phase 6 — Pokémon builder

Ability, moves, item, EVs, IVs, Nature, Tera, gender, level, shiny, live validation.

## Phase 7 — Recap and Showdown export

Recap card and Copy to Showdown.

## Phase 8 — Polish

Accessibility, responsive, loading/error, performance, visual consistency.

## Later, not now

Team builder, saved builds, accounts, share URLs, public seeds, learnset-only and competitive pool modes.
