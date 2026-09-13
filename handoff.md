# Handoff — Pokémon Randomizer

Use this file at the start of a new chat **before changing code**.

Then read, in order:

1. `AGENTS.md` — persistent implementation rules
2. `ARCHITECTURE.md` — system design
3. `PROJECT_SPEC.md` — product requirements
4. `DATA_MODEL.md` — catalogs and classification
5. `ROADMAP.md` — phases
6. `TEST_PLAN.md` — testing bar

Do not rebuild the app from scratch. Do not re-run Phase 0 discovery unless architecture is actually wrong. Inspect existing `lib/`, `app/`, `scripts/import/`, and `data/generated/` first, then implement only the requested phase.

---

## Current status

| Item | Value |
| --- | --- |
| Phase complete | **Phase 2 — Data layer** |
| Next phase | **Phase 3 — Filtering engine** |
| Branch | `feat/phase-2-data-layer` (local; **not pushed**) |
| Parent | `feat/phase-1-foundation` at `89caa89` (tracks `origin/feat/phase-1-foundation`) |
| Latest **committed** | `89caa89` — `docs: add handoff guide for continuing work in new chats` |
| Phase 2 code | **Uncommitted** on `feat/phase-2-data-layer` — commit only if the user asks |
| Base branch | `master` still has the original Vite starter only |
| Remote | https://github.com/ryroth/pokemon-randomizer |
| PR | Not created yet |

Phase 2 exit gates already passed on this working tree: `npm run lint`, `npm run typecheck`, `npm test` (36 tests), `npm run build`.

The UI is a navigable shell (`/`, `/randomizer`, `/builder`, `/recap`). It does **not** yet load the catalog, filter, or randomize. Do not polish the randomizer UI until Phase 5.

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
- `@pkmn/dex` is a **devDependency** used only by the importer — never import it from `app/` or client components
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
npm run import:data  # PokéAPI + Showdown snapshot → data/generated/catalog.json
```

Importer flags: `--fresh` (ignore HTTP cache), `--offline` (fail if cache miss), `--help`.

---

## Locked design decisions

These were approved after Phase 0. Do not silently reverse them.

| Topic | Decision |
| --- | --- |
| Randomizable unit | Pokémon **form**, unique by form id |
| Names | Store both `pokeApiSlug` and `showdownName`. Export Showdown names only |
| IDs | Form / ability / move / item / nature `id` = Showdown id. Species `id` = PokéAPI slug |
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
lib/data/loadCatalog.ts      Node loader for catalog.json (tests; not used by UI yet)
lib/randomizer/              defaults + seeded RNG (engine not built yet)
lib/validation/              EV/IV/nature/ability/moves/item/tera/gender/level/shiny/set
lib/showdown/exportSet.ts    Deterministic Showdown text
scripts/import/              Repeatable PokéAPI + @pkmn/dex snapshot
  mapping.ts                 Showdown ↔ PokéAPI name join
  pokeapi.ts                 Cached HTTP snapshot
  showdown.ts                @pkmn/dex filters (keep mega/gmax; drop CAP/Z/Max)
  normalize.ts               Build Catalog + join report
data/generated/              catalog.json (~4.7MB) + join-report.json
data/cache/pokeapi/          Gitignored HTTP cache
tests/unit/                  Classification, RNG, validation, export, defaults, catalog integrity
tests/e2e/home.spec.ts       Shell navigation smoke
```

---

## Phase 2 catalog (do not rebuild)

`npm run import:data` already produced:

| Collection | Count |
| --- | --- |
| Pokémon forms | 1316 |
| Species | 1025 |
| Abilities | 310 |
| Moves | 850 |
| Items | 507 |
| Natures | 25 |

Integrity fixtures that must keep working: Mewtwo (Restricted Legendary), Articuno (Sub-Legendary), Nihilego (Ultra Beast), Walking Wake (Paradox, gen 9), Dragonite (pseudo, stage 2), Pichu (baby, basic), Alolan Raichu (`raichu-alola`, regional, gen 7, stage 2), Mega Venusaur (`venusaur-mega`, mega, gen 6).

Join leftovers are expected in `data/generated/join-report.json`. Showdown-only rows still go into the catalog (empty dex/sprites) rather than being dropped. Typical unmatched Showdown formes are Arceus/Silvally plates, Genesect drives, Ogerpon Tera, and cosmetic/antique formes that PokéAPI stores as form records, not `/pokemon` varieties.

Re-run `npm run import:data` only when PokéAPI or Showdown source data needs refreshing. Do not hand-edit `catalog.json`.

---

## What Phase 3 must do

Implement the filtering engine in `lib/`. Do **not** polish the randomizer UI yet. Do not rebuild Phase 1 or 2.

1. Filter Pokémon forms by generation, type (default OR), form type, evolution stage, and special classifications.
2. Respect locked defaults from `lib/randomizer/defaults.ts` (base formes on; mega/regional/gmax/other off; all specials allowed).
3. Combination tests for those filters.
4. Insufficient-pool behavior can wait for Phase 4 unless the filter API naturally returns a pool size.
5. Keep pool logic out of UI components. Load `Catalog` / `PokemonForm` types, not raw PokéAPI or Showdown objects.

---

## Later phases (do not skip ahead unless asked)

- **4** Seeded Pokémon / ability / move / item randomizers + insufficient-pool errors
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
6. Update this file plus `DATA_MODEL.md` / `ROADMAP.md` / `TEST_PLAN.md` if architecture or decisions changed.
7. Do not commit unless asked. Do not push unless asked.

Definition of done: implementation + TypeScript + tests + lint + edge/error handling + a11y/responsive considered. UI is not done from a screenshot.

---

## Leftovers / watchouts

- Phase 2 is **uncommitted**. A new chat should keep working on `feat/phase-2-data-layer` (or commit first if the user asks) rather than branching from `feat/phase-1-foundation`.
- `data/generated/catalog.json` (~4.7MB) should be committed with Phase 2 so CI tests do not need network.
- `data/cache/pokeapi/` is gitignored. Safe to keep locally; do not commit.
- Untracked `public/*.svg` files are leftover create-next-app assets and were **intentionally not committed**.
- `node_modules.bak` (if present) is a leftover Vite install; gitignored; safe to delete.
- Next.js 16 may rewrite the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of `AGENTS.md`. Keep the Pokémon Randomizer rules below that block.
- `master` on GitHub is still the Vite starter. Merge/PR when the user asks. Renaming `master` → `main` is planned but not done.
- Playwright browsers may need `npx playwright install` before `npm run test:e2e`.
- Do not add the full `pokemon-showdown` simulator package to the client.
- Natures now have `pokeApiSlug` (dual-write rule). Do not remove it.

---

## Suggested first message in a continuation chat

> Continue the Pokémon Randomizer. Read `handoff.md` and `AGENTS.md`. Phase 2 (catalog import) is done but **uncommitted** on `feat/phase-2-data-layer`. We are starting Phase 3 (filtering engine). Do not rebuild Phase 1 or 2.
