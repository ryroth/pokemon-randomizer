# Handoff — Pokémon Randomizer

Use this file at the start of a new chat before changing code.

Then read, in order:

1. `AGENTS.md` — persistent implementation rules
2. `ARCHITECTURE.md` — system design
3. `PROJECT_SPEC.md` — product requirements
4. `DATA_MODEL.md` — catalogs and classification
5. `ROADMAP.md` — phases
6. `TEST_PLAN.md` — testing bar

Do not rebuild the app from scratch. Do not re-run Phase 0 discovery unless architecture is actually wrong. Inspect existing `lib/`, `app/`, and `scripts/import/` first, then implement only the requested phase.

---

## Current status

| Item | Value |
| --- | --- |
| Phase complete | **Phase 1 — Foundation** |
| Next phase | **Phase 2 — Data layer** |
| Branch | `feat/phase-1-foundation` (tracks `origin/feat/phase-1-foundation`) |
| Latest commit | `05da8db` — `feat: replace Vite starter with Next.js foundation` |
| Base branch | `master` still has the original Vite starter only |
| Remote | https://github.com/ryroth/pokemon-randomizer |
| PR | Not created yet |

Phase 1 exit gates already passed on this branch: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

The UI is a navigable shell (`/`, `/randomizer`, `/builder`, `/recap`). It does **not** yet load Pokémon catalogs or randomize anything.

---

## Product (V1)

Consumer web app: randomize **one** Pokémon, build a Showdown-compatible set by hand, copy the set text.

Flow: Configure → Generate unique Pokémon → Select one → Build → Validate → Recap → Copy to Showdown.

- Pokémon: always randomized
- Abilities / moves / items: independently optional
- EVs, IVs, Nature, Tera type, gender (if mixed), level, shiny: never auto-assigned

Out of scope until explicitly requested: six-Pokémon teams, accounts, saved builds, share URLs, public seeds, learnset-only or competitive-only pools.

---

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS v4, shadcn/ui (`base-nova`), Lucide
- Vitest (unit), Playwright (e2e, config exists; smoke spec in `tests/e2e/home.spec.ts`)
- No database
- No live PokéAPI calls from the browser

Commands:

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run import:data  # stub in Phase 1; real snapshot is Phase 2
```

---

## Locked design decisions

These were approved after Phase 0. Do not silently reverse them.

| Topic | Decision |
| --- | --- |
| Randomizable unit | Pokémon **form**, unique by form id |
| Names | Store both `pokeApiSlug` and `showdownName`. Export Showdown names only |
| Legendaries | `isLegendary` = Showdown **Restricted Legendary**; `isSubLegendary` = **Sub-Legendary** |
| Mythical / Paradox / Ultra Beast | Showdown tags |
| Pseudo-legendary | Explicit list in `lib/data/classify.ts` (600 BST three-stage lines; not Archaludon) |
| Evolution stage | Chain depth: 0 basic, 1 stage1, 2+ stage2. Babies are basic + `isBaby` |
| Form generation | Form **introduction** gen (Alolan Raichu = Gen 7) |
| Form types | `base \| regional \| mega \| primal \| gmax \| other` |
| Dynamax | Not a form. Gigantamax **is** a form |
| Default form filter | **Base on.** Mega, regional, gmax, other **off** |
| Type filter | Default OR; advanced AND later |
| Specials default | All allowed (user unchecks to exclude) |
| Ability random ON | All standard abilities (legal-only is a future pool mode) |
| Move random ON | All standard moves; exclude Z/Max/CAP; learnset later |
| Item random ON | Showdown holdables + explicit None |
| Count | 1–12 Pokémon, default 6 |
| Insufficient pools | Typed error + user-facing explanation; never a silent short list |
| RNG | `lib/randomizer/randomUtils.ts` only. No `Math.random()` in product code |
| Tera / gender / level / shiny | In V1 UI, validation, recap, and export. Not auto-filled |
| EVs | Numerically 0 is legal only after `evsConfirmed` |
| IVs | Start unset; “set all to 31” must be an explicit user action |
| Export | `lib/showdown/exportSet.ts`. Tera always written. Level 100 omitted. IVs of 31 omitted. Zero EVs omitted. Gender omitted if genderless. Shiny line only if shiny |
| Data updates | Repeatable import scripts, not hand-edited catalogs |
| Git | Feature branches; conventional commits. Rename `master` → `main` still pending |

Defaults live in `lib/randomizer/defaults.ts`. There is a regression test that Mega is **not** in the default `formTypes`.

---

## Architecture

```text
PokéAPI + Showdown → scripts/import → data/generated/catalog.json
                                         ↓
                    filters → seeded randomizer → RandomizerSession
                                         ↓
                    builder → lib/validation → recap + exportShowdownSet
                                         ↓
                                        app/ UI
```

UI must not own randomization, filtering, classification, or validation. UI must not consume raw PokéAPI or Showdown objects.

Session type: `RandomizerSession` in `lib/types/session.ts` (serializable; later team/share/seed features should reuse it).

---

## Key paths

```text
app/                         Home, randomizer, builder, recap shells
components/layout/           Header, footer, phase placeholder
components/ui/               shadcn button + card
lib/types/                   Normalized catalogs + session
lib/data/classify.ts         Form type, evolution depth, pseudo-legendaries
lib/randomizer/              defaults + seeded RNG (engine not built yet)
lib/validation/              EV/IV/nature/ability/moves/item/tera/gender/level/shiny/set
lib/showdown/exportSet.ts    Deterministic Showdown text
scripts/import/              Phase 1 stub; Phase 2 fills catalog.json
data/generated/              Empty until Phase 2
tests/unit/                  Classification, RNG, validation, export, defaults
tests/e2e/home.spec.ts       Shell navigation smoke
```

---

## What Phase 2 must do

Implement a repeatable catalog importer. Do **not** polish the randomizer UI yet.

1. Snapshot PokéAPI (species, pokemon, forms, abilities, moves, items, natures, evolution chains, English flavor text, official artwork URLs).
2. Join Showdown / `@pkmn/dex` at import time for `showdownName` and tags (Restricted Legendary, Sub-Legendary, Mythical, Paradox, Ultra Beast, mega/gmax).
3. Run classifiers in `lib/data/classify.ts`; write `data/generated/catalog.json` matching `Catalog` in `lib/types/catalog.ts`.
4. Dual IDs on every entity. Emit an unmatched-join report rather than silently dropping records.
5. Integrity tests: required fields present; fixture species (Mewtwo, Articuno, Nihilego, Walking Wake, Dragonite, Pichu, Alolan Raichu, Mega Venusaur); name mapping; evolution stages.
6. `npm run import:data` should produce the catalog. The app still should not fetch PokéAPI at click time.
7. Update `DATA_MODEL.md` / `ROADMAP.md` if the import contract changes.

Sprites: store PokéAPI official-artwork URLs in JSON (`next.config.ts` already allows `raw.githubusercontent.com/PokeAPI/sprites/**`). Do not vendor thousands of images.

---

## Later phases (do not skip ahead unless asked)

- **3** Filtering engine + combination tests
- **4** Seeded Pokémon/ability/move/item randomizers + insufficient-pool errors
- **5** Polished randomizer UI
- **6** Builder UI with live validation (Tera, gender, level, shiny included)
- **7** Recap card + Copy to Showdown
- **8** A11y, responsive, loading/error, performance polish

---

## Working rules for new chats

When asked to implement something:

1. Inspect existing architecture and docs.
2. State a short plan.
3. Implement only that scope.
4. Add/update tests.
5. Run lint, typecheck, tests, and build when the app could break.
6. Update docs if architecture or decisions changed.
7. Do not commit unless asked. Do not push unless asked.

Definition of done: implementation + TypeScript + tests + lint + edge/error handling + a11y/responsive considered. UI is not done from a screenshot.

---

## Leftovers / watchouts

- Untracked `public/*.svg` files are leftover create-next-app assets and were **intentionally not committed**.
- `node_modules.bak` (if present) is a leftover Vite install; gitignored; safe to delete.
- Next.js 16 may rewrite the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of `AGENTS.md`. Keep the Pokémon Randomizer rules below that block.
- `master` on GitHub is still the Vite starter. Merge/PR when the user asks. Renaming `master` → `main` is planned but not done.
- Playwright browsers may need `npx playwright install` before `npm run test:e2e`.
- Do not add the full `pokemon-showdown` simulator package to the client.

---

## Suggested first message in a continuation chat

> Continue the Pokémon Randomizer. Read `handoff.md` and `AGENTS.md`. We are starting Phase 2 (data import / normalized catalog). Do not rebuild Phase 1.
