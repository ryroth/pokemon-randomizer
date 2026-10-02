# Generated catalogs

This directory is filled by `npm run import:data`.

- `catalog.json` — normalized catalogs consumed by later phases
- `learnsets.json` — in-game moves per form, from `npx tsx scripts/import/learnsets.ts`
- `hidden-abilities.json` — Hidden Ability id per form, from `npx tsx scripts/import/hidden-abilities.ts`
- `join-report.json` — PokéAPI / Showdown records that did not join

Do not hand-edit these files. HTTP responses are cached in `data/cache/pokeapi/` (gitignored).
