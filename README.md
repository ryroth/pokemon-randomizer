# Pokémon Randomizer

A polished web app for generating a unique Pokémon, building a complete set by hand, and copying it into [Pokémon Showdown](https://pokemonshowdown.com/).

## Status

Phase 2 data layer: Next.js app shell plus a generated PokéAPI + Showdown catalog at `data/generated/catalog.json`. The UI still does not load catalogs or randomize Pokémon.

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:3000`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run build` | Production build |
| `npm run import:data` | Snapshot PokéAPI + Showdown into `data/generated/catalog.json` |

## Documentation

- [PROJECT_SPEC.md](PROJECT_SPEC.md) — product requirements
- [ARCHITECTURE.md](ARCHITECTURE.md) — system design
- [DATA_MODEL.md](DATA_MODEL.md) — catalogs and classification rules
- [ROADMAP.md](ROADMAP.md) — phased delivery
- [TEST_PLAN.md](TEST_PLAN.md) — test strategy
- [AGENTS.md](AGENTS.md) — persistent contributor instructions

## License and trademarks

Pokémon and Pokémon character names are trademarks of Nintendo. This fan project is not affiliated with Nintendo, Game Freak, or The Pokémon Company.
