<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pokémon Randomizer — agent instructions

Cursor should follow these rules on every change.

## TypeScript

- Use strict TypeScript.
- Do not use `any` unless there is a documented, justified reason in a nearby comment.
- Prefer named exports from domain modules. UI may default-export route pages.

## Architectural boundaries

- UI components must not contain randomization, filtering, classification, or set-validation rules.
- UI must never depend on raw PokéAPI or Showdown objects.
- Put domain logic in `lib/`. Put import scripts in `scripts/import/`.
- Do not call PokéAPI from the browser. Catalog data is generated at import time.

## Data sources

- PokéAPI: dex text, sprites/artwork, evolution chains, official species flags, and English move/ability/item flavor plus `effect_entries` (the same official wording Pokémon Database, Bulbapedia, and Serebii reprint).
- Pokémon Showdown: teambuilder names, forme identity, Restricted Legendary / Sub-Legendary / Mythical / Paradox / Ultra Beast tags, and battling `shortDesc`/`desc` when PokéAPI effect text omits numeric mechanics (for example Punk Rock’s 1.3× sound boost).
- Dual-write `pokeApiSlug` and `showdownName` on every entity. Export only Showdown names.
- Do not invent, paraphrase, or rewrite Pokédex, ability, move, or item descriptions. Pokédex entries use the latest unique English PokéAPI flavor only. Ability, move, and item `description` prefers PokéAPI English `short_effect`/`effect` when it includes numbers, then Showdown battling text with numbers, then flavor. Never invent multipliers. Leave the field empty when no source has English text.
- Do not invent Pokémon data when an authoritative source exists.
- Do not hardcode large catalogs inside React components.

## Randomization and validation

- Use `lib/randomizer/randomUtils.ts` for all randomness. Do not call `Math.random()` in product code.
- Pokémon results in a roll must be unique along overlapping evolution paths. Split branches may appear together (Cascoon with Silcoon or Beautifly). A shared ancestor (Wurmple) or the rest of the same branch (Dustox with Cascoon) may not.
- Insufficient pools are errors. Never silently return fewer results.
- Do not auto-assign EVs, IVs, Nature, Tera type, gender (when mixed), level, or shiny.
- Mega Evolutions are a first-class form type and are off by default. Dynamax is not a form. Gigantamax is a form and is off by default.

## Testing and quality

- Every significant feature needs automated tests.
- Before considering a feature done: lint, typecheck, tests, and a production build when the change can affect the app.
- Vitest covers domain logic. Playwright covers the real user flow.

## Git

- Use conventional commits (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`).
- Do not commit secrets, `.env` files, or credentials.
- Do not make unrelated changes in a single commit.

## UI, accessibility, and errors

- Build responsive layouts from the start.
- Keyboard access, visible focus, semantic HTML, and labels are part of the work.
- Do not rely on color alone.
- User-facing errors must be plain language. Never show stack traces.
- Asynchronous work needs a loading state.

## Dependencies

- Do not add a package without a concrete reason.
- Do not add a database until accounts, saved builds, or shared sessions exist.
- Do not implement future features (teams, accounts, share URLs, public seeds, learnset-only mode) unless explicitly requested.
