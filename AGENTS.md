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
- Do not invent, paraphrase, or rewrite Pokédex, ability, move, or item descriptions. Pokédex entries use unique English PokéAPI flavor texts only, kept for every generation in `data/generated/dex-entries.json` (the catalog keeps the latest as a fallback), and the UI cycles through them. Ability, move, and item `description` prefers PokéAPI English `short_effect`/`effect` when it includes numbers, then Showdown battling text with numbers, then flavor. Never invent multipliers. Leave the field empty when no source has English text.
- Do not invent Pokémon data when an authoritative source exists.
- Do not hardcode large catalogs inside React components.

## Randomization and validation

- Use `lib/randomizer/randomUtils.ts` for all randomness. Do not call `Math.random()` in product code.
- Pokémon results in a roll must be unique along overlapping evolution paths. Split branches may appear together (Cascoon with Silcoon or Beautifly). A shared ancestor (Wurmple) or the rest of the same branch (Dustox with Cascoon) may not.
- Insufficient pools are errors. Never silently return fewer results.
- If Ability, Move, or Item runs before Pokémon, that pool is generated once (`canGenerateExtraPool`). A later Generate does not replace it. Re-roll still replaces one result. Clear generated abilities, moves, or items removes that pool so it can be generated again (`clearAbilityPool`, `clearMovePool`, `clearItemPool`), and only while the user is still on that step. Moving to a later randomizer or the builder keeps the pool (`passReachedRandomizer`). A step that runs after Pokémon can generate again for the current Pokémon.
- Do not auto-assign EVs or Nature. Tera type and gender (when mixed) may be left blank in the builder: a blank Tera type becomes the Pokémon's primary type, and a blank gender is rolled 50/50 when the user continues to the recap (`lib/randomizer/gender.ts`, `finalizeBuilderSet`). The Pokémon randomizer rolls shiny per Pokémon at a user-set percentage (`shinyChance`, 0-100, default 1, via `lib/randomizer/shiny.ts`). A shiny Pokémon starts the builder with Shiny set to Yes. Every other Pokémon starts at No. Starting a build for a different Pokémon clears EVs, Nature, Tera type, gender, shiny, and nickname back to those defaults. Level defaults to 50 and can be edited. IVs default to 31 and can be edited. Happiness defaults to 255 (range 0-255). Nickname is optional. A set has one to four moves.
- Moves, abilities, and items that a randomizer step chose before the Builder are locked in the Builder (`lib/builder/locks.ts`). If an enabled randomizer step has not given the Pokémon its part yet (`pendingRandomizerSteps`), the Builder asks the user to finish it first and does not offer a hand-picked choice.
- An Other form or Mega Evolution that must hold an item to be that form (Giratina-Origin and the Griseous Core, Arceus-Fire and the Flame Plate, Venusaur-Mega and Venusaurite) is given that item when the user selects it. The item stays locked until they select a different Pokémon (`requiredFormItemId` in `lib/data/formItems.ts`, from `npm run import:form-items`). When several items can cause the change, the plate, orb, mask, drive, or memory is used and the Z-Crystal is left out. A Mega uses its Mega Stone. Mega Rayquaza has no stone, so its item stays free.
- Evolutions can only be chosen when the Evolution stages filter has Basic, Stage 1, and Stage 2 all selected (`evolutionChoiceAllowed`, `evolutionChoices`, `resetDisallowedEvolution`).
- Only the moves, ability, and item a randomizer actually applied are locked. Moves the user picked by hand stay editable. The Recap shows no Edit link for a locked part (`recapEditAccess` in `lib/builder/locks.ts`). Reordering randomizers must not scroll the page to the top.
- Art is still and official: use `pokemonImage` / `pokemonImageCandidates` in `lib/art/pokemonImage.ts` (newest artwork, shiny artwork for a shiny Pokémon). Do not add animated sprites, GIFs, or 3D models for Pokémon. Missing art is filled at import time by `npm run import:art` (`data/generated/pokemon-art.json`, `data/generated/item-icons.json`).
- The tab icon is Ditto's official Pokémon HOME picture as a face icon (`app/icon.png`, made by `npm run import:ditto-icon`). When the user selects a Pokémon on `/randomizer` it turns into that Pokémon's official artwork (whole picture, not a head crop), then goes back to Ditto. Generating or rolling alone does not change it (`components/randomizer/ditto-favicon.tsx`, `lib/art/faceIcon.ts`, `lib/art/dittoMorph.ts`). It is built in the browser from still pictures only, so it is not an animated Pokémon sprite. Reduced motion keeps the still icon.
- Use the word "forms", not "formes", in user-facing text. Call the Builder's EV recommendation a "suggested spread", not a guess.
- Mega Evolutions are a first-class form type and are off by default. Dynamax is not a form. Gigantamax is a form and is off by default.
- Struggle stays out of the move randomizer, All Moves, and each Pokémon's moveset (`isLearnableMove`). It is the move used when every move is out of PP.
- Do not generate costume Pikachu (Cosplay and every cap), Castform's Sunny, Rainy, and Snowy forms, Darmanitan Zen Mode, Galarian Darmanitan Zen Mode, Meloetta Pirouette, Wishiwashi School, Mimikyu Busted, Cramorant Gorging and Gulping, Eiscue Noice, Morpeko Hangry, Eternatus Eternamax, or Palafin Hero (`isGeneratablePokemon` in `lib/data/generatableForms.ts`). Leave them in the catalog. The base form is what a roll can return. Zen Mode, Relic Song, Hunger Switch, Zero to Hero, and the other battle abilities and moves still change that Pokémon during a battle. Vivillon rolls are Meadow, Fancy, and Poké Ball only.

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
