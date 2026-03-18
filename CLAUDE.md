# Cinefile-BE — CLAUDE.md

## Project Overview

**Cinefile-BE** is a headless CMS backend for a movie/cinema review platform. It stores and serves structured movie review data to a frontend client. Content editors manage reviews through Strapi's admin UI; published content is automatically backed up to a GitHub repository as Markdown files.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Strapi 5.38.0 (Headless CMS) |
| Language | TypeScript 5.x |
| Runtime | Node.js ≥20.0.0 |
| Database (prod) | PostgreSQL via Neon (connection pooling, SSL required) |
| Database (local) | PostgreSQL (local instance, also uses `DATABASE_URL`) |
| Media storage | Cloudinary (`@strapi/provider-upload-cloudinary`) |
| Auth | `@strapi/plugin-users-permissions` |

## Key Directories

```
src/api/          # Content types: movie, genre, homepage, about
src/components/   # Reusable schema components (shared/)
src/extensions/   # Strapi extension point (currently empty)
config/           # Server, database, admin, middleware, plugins, API config
scripts/          # backup-posts.mjs — GitHub backup triggered by lifecycle hooks
types/generated/  # Auto-generated TS types — do NOT edit manually
database/         # Strapi migrations directory
dist/             # Compiled output — do NOT edit
```

## Content Types

| Type | Kind | Notes |
|---|---|---|
| `movie` | Collection | Core entity; has lifecycle hooks → `scripts/backup-posts.mjs` |
| `genre` | Collection | Lookup table; related to Movie and About |
| `homepage` | Single | Curated front page content |
| `about` | Single | Bio/profile page |

Shared components live in `src/components/shared/`: `availability-item`, `favourite-movies`, `favourite-podcasts`, `further-reading`, `next-movie`, `sims-scenario`, `spotify-eps`.

## Essential Commands

```bash
npm run develop   # Dev server with auto-reload (http://localhost:1337)
npm run build     # Compile TypeScript + build admin panel
npm run start     # Production start (no auto-reload)
npm run backup    # Manually run the GitHub backup script
npm run console   # Interactive Strapi REPL
npm run deploy    # Deploy to Strapi Cloud
```

## Required Environment Variables

```
APP_KEYS, ADMIN_JWT_SECRET, API_TOKEN_SALT, TRANSFER_TOKEN_SALT, ENCRYPTION_KEY
DATABASE_URL                            # PostgreSQL connection string (local + Neon prod)
CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET
GITHUB_TOKEN                            # For automated markdown backup to GitHub
```

## Behaviour Instructions for Claude

- **Before modifying anything:** show the proposed change in plain language and get confirmation.
- **Ask clarifying questions** on both minor and major decisions.
- **Branch check:** when starting a feature or fix, show the current branch and ask if it's correct; if not, ask what branch to create.
- **Plan mode:** when starting a feature, bug fix, or architectural change, ask if the user wants to enter `/plan` mode first.
- **Docs sync:** after making changes, check if any `.claude/docs/` file is affected and update it.
- **Type generation:** after schema changes run `npm run build` to regenerate `types/generated/`.

## Additional Documentation

| File | When to consult |
|---|---|
| `.claude/docs/architectural_patterns.md` | Content type design, component usage, factory pattern, backup flow |
