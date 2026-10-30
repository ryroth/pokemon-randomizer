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

## Phase 7 — Recap, Showdown export, and saved teams

A Pokédex-style card for the finalized Pokémon, with still official artwork (regular or shiny), a link from each part back to the Builder, Copy to Showdown, and Next Randomizer. Finished sets can be saved to local teams of 6, reordered, removed, cleared after confirmation, and copied as one Showdown team. Complete on `master` (PR #6). The randomizer is still one Pokémon at a time. There is no database.

## Phase 8 — Polish

Accessibility, responsive layout, loading and error pages, and visual consistency. Complete on `master` (PR #7). Also on `master`: back navigation between randomizer tabs, Recap, and Builder; nicknames that keep spaces; and a Showdown-style EV guess.

- The header names the current page and fits a 390px screen: the brand sits above a two-column nav with 44px targets.
- Randomizer, builder, recap, and teams share one page frame. Each has a loading notice and an error page with Try again. Unknown URLs show a not-found page.
- Type chips, the Pokédex title bar, and a lowered Nature stat stay readable. Reduced motion shortens CSS animation. 
- Narrow screens wrap the builder portrait and locked ability or item rows. Wide stat and move tables can be scrolled from the keyboard.

## Phase 9 — Formats, custom Pokémon, and a damage check

In progress on the working tree. The Randomizer, Builder, Recap, and Teams flows stay. New routes: `/formats` and `/battle`.

Done in this slice:

- Format Explorer for the transcribed Showdown presets plus the app preset Open lab. Cards show generation, structure, audience, clauses, and the banlist, and they say which of those this app actually checks.
- A format copy can change shiny availability, typing policy, base-stat policy, team size, clauses this app checks, and an optional base-stat budget. Saving writes a new format. Reset restores a field or the whole preset. One previous save can be restored. Presets stay locked.
- Builder fields for custom typing and custom base stats. They are stored on the set. The species catalog is not edited. Showdown paste omits them and the recap says so.
- Shiny can be chosen on any set. `shinyChance` only affects new rolls. A format may forbid shinies.
- A generation 9 single-target damage check. Custom types affect same-type bonus, weaknesses, and immunities. Custom base stats go through Showdown's stat formula. Each check copies those values onto its own snapshot.

Not in this slice, and not claimed in the UI:

- AI, online multiplayer, and replays. A singles battle is Phase 10.
- Enforcing Smogon banlists, Sleep Clause, OHKO Clause, evasion clauses, or Same Type Clause.
- Randomized typing or randomized base stats.
- Showdown's random-battle team generator, level 9999, or teams larger than 6.
- Mega Evolution and other past-generation battle mechanics inside the damage check.

## Phase 10 — A minimal singles battle

In progress on the working tree. It uses the Phase 9 snapshot. Both players choose on one screen.

Done in this slice:

- Turns, speed order, switching, fainting, a winner, and a draw.
- Levitate, Huge Power, Pure Power, Choice Band, Choice Specs, Choice Scarf, and Life Orb.
- A critical hit is 1 in 24 and uses Showdown's 1.5× before the damage roll. Moves that crit more often in the games use that same rate.
- The battle copies types and base stats. Two battles do not share HP.

Still left out:

- Weather, status moves, stat stages, higher critical-hit rates, and every other ability or item.
- AI, online play, replays, banlists, and doubles.

## Later, not now

A single Generate of six Pokémon, accounts, share URLs, public seeds, learnset-only and competitive pool modes. Drafting one Pokémon at a time onto a team of six, then building each slot, is implemented. Saving finished sets onto local teams is part of Phase 7.
