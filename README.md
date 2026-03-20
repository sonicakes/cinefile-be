# Cinefile-BE

Headless CMS backend for a movie/cinema review platform. Content editors manage reviews through Strapi's admin UI; published content is automatically backed up to a GitHub repository as Markdown files.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Strapi 5.38.0 |
| Language | TypeScript 5.x |
| Runtime | Node.js >= 20.0.0 |
| Database (prod) | PostgreSQL via Neon (connection pooling, SSL) |
| Database (local) | PostgreSQL (local instance, `DATABASE_URL`) |
| Media storage | Cloudinary |
| Auth | `@strapi/plugin-users-permissions` |

## Content Types

| Type | Kind | Notes |
|---|---|---|
| `movie` | Collection | Core entity; triggers GitHub backup on save |
| `genre` | Collection | Shared lookup; related to `movie` and `about` |
| `homepage` | Single | Curated front page content |
| `about` | Single | Bio/profile page |

### Shared Components (`src/components/shared/`)

| Component | Used on |
|---|---|
| `availability-item` | `movie`, `about` |
| `further-reading` | `movie` |
| `sims-scenario` | `movie` |
| `spotify-eps` | `movie` |
| `next-movie` | `movie` |
| `favourite-movies` | `about` |
| `favourite-podcasts` | `about` |

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- A running PostgreSQL instance (local or remote)
- A Cloudinary account
- A GitHub personal access token (for content backup)

### Environment Variables

Create a `.env` file in the project root:

```env
APP_KEYS=
ADMIN_JWT_SECRET=
API_TOKEN_SALT=
TRANSFER_TOKEN_SALT=
ENCRYPTION_KEY=

DATABASE_URL=               # PostgreSQL connection string — required locally and in prod

CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=

GITHUB_TOKEN=               # Personal access token for automated Markdown backup
```

> Always set `DATABASE_URL` even in local development to keep the environment consistent with production.

### Install & Run

```bash
npm install
npm run develop
```

The admin panel is available at `http://localhost:1337/admin`.

## Commands

| Command | Description |
|---|---|
| `npm run develop` | Dev server with auto-reload |
| `npm run build` | Compile TypeScript and rebuild admin panel |
| `npm run start` | Production start (no auto-reload) |
| `npm run backup` | Manually trigger the GitHub backup script |
| `npm run console` | Interactive Strapi REPL |
| `npm run deploy` | Deploy to Strapi Cloud |

> After any schema change (new field, component, or relation), run `npm run build` to regenerate `types/generated/`.

## Architecture

### Factory Pattern

Routes, controllers, and services are thin wrappers using Strapi's factory functions. Custom logic is added only when explicitly required, keeping the core files predictable and consistent across all content types.

### Component Model

Optional or variable-length content is modelled as repeatable components rather than fields directly on the content type. This keeps schemas clean and gives editors flexibility without requiring a code change.

### Lifecycle Hook — GitHub Backup

When a `movie` entry is created or updated, a lifecycle hook in `src/api/movie/content-types/movie/lifecycles.ts` spawns a detached child process running `scripts/backup-posts.mjs`. The script fetches all published movies via the REST API, converts them to Markdown with YAML frontmatter, and pushes them to the `sonicakes/cinefile-content` GitHub repository. Running it as a detached process means it never blocks the API response.

```
[Strapi saves Movie]
  -> lifecycles.ts: afterCreate / afterUpdate
  -> spawn detached: node scripts/backup-posts.mjs
  -> fetch all movies (populate=*)
  -> convert to Markdown + YAML frontmatter
  -> push to GitHub: sonicakes/cinefile-content
```

Backup output is logged to `backup.log` in the project root.

## Key Directories

```
src/api/             # Content types: movie, genre, homepage, about
src/components/      # Reusable schema components (shared/)
src/extensions/      # Strapi extension point
config/              # Server, database, admin, middleware, plugins, API config
scripts/             # backup-posts.mjs — GitHub backup script
types/generated/     # Auto-generated TS types — do not edit manually
database/            # Strapi migrations
dist/                # Compiled output — do not edit
```
