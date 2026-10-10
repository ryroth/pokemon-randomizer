# Generated catalogs

This directory is filled by `npm run import:data`.

- `catalog.json` — normalized catalogs consumed by later phases
- `learnsets.json` — in-game moves per form as `moveId:CODES` strings (L level-up, M TM, E egg, T tutor, V transfer), from `npx tsx scripts/import/learnsets.ts`
- `dex-entries.json` — every unique English Pokédex entry per species as `[generation, versions[], text]`, oldest first, from `npm run import:dex-entries`
- `hidden-abilities.json` — Hidden Ability id per form, from `npx tsx scripts/import/hidden-abilities.ts`
- `join-report.json` — PokéAPI / Showdown records that did not join

Do not hand-edit these files. HTTP responses are cached in `data/cache/pokeapi/` (gitignored).
