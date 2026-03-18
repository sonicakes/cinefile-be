# Architectural Patterns — Cinefile-BE

## 1. Factory Pattern for Content Type Components

Every content type's `routes/`, `controllers/`, and `services/` files are thin wrappers using Strapi's factory functions. No custom logic is added unless explicitly required.

```ts
// Pattern repeated across all 4 content types
export default factories.createCoreRouter('api::movie.movie');
export default factories.createCoreController('api::movie.movie');
export default factories.createCoreService('api::movie.movie');
```

**Convention:** Custom logic goes in a separate file alongside the factory file, not by overriding it inline. Lifecycle hooks are the exception — they live in `content-types/<name>/lifecycles.ts`.

Example files:
- `src/api/movie/controllers/movie.ts`
- `src/api/movie/services/movie.ts`
- `src/api/movie/routes/movie.ts`

---

## 2. Repeatable Components for Flexible Content

Rather than nesting fields directly on a content type, optional or variable-length content is modelled as **repeatable components**. This keeps the core schema clean and allows editors to add zero or many instances.

Components used repeteably across content types:
- `shared.availability-item` — on `movie` and `about`
- `shared.further-reading` — on `movie`
- `shared.sims-scenario` — on `movie`
- `shared.spotify-eps` — on `movie`
- `shared.favourite-movies` — on `about`
- `shared.favourite-podcasts` — on `about`

**Convention:** New optional/multi-value content → create a component in `src/components/shared/`, not a new field directly on the content type.

---

## 3. Single-Use (Non-Repeatable) Components for Structured Sub-Objects

When a sub-object is singular but has its own distinct fields, it uses a non-repeatable component.

Example: `shared.next-movie` on `movie` — stores a single related Movie via a `oneToOne` relation inside the component.

**Convention:** Use non-repeatable components for structured sub-objects that have their own semantic identity but don't warrant a separate content type.

---

## 4. Lifecycle Hook → Detached Backup Process

The `movie` content type hooks into `afterCreate` and `afterUpdate` to trigger an external backup script as a detached child process. This avoids blocking the Strapi request cycle.

```
[Strapi saves Movie] → lifecycles.ts:afterCreate/afterUpdate
  → spawn("node", ["scripts/backup-posts.mjs"], { detached: true })
  → script fetches all movies via REST API (populate=*)
  → converts to Markdown + YAML frontmatter
  → pushes to GitHub repo: sonicakes/cinefile-content
```

Key files:
- `src/api/movie/content-types/movie/lifecycles.ts` — hook entry point
- `scripts/backup-posts.mjs` — backup logic
- `backup.log` — appended log output from detached process

**Convention:** Side effects triggered by content saves belong in `lifecycles.ts`. Heavy work runs as a detached process so it never delays the API response.

---

## 5. Genre as a Shared Lookup / Relation Target

`genre` is a minimal collection type (just a `name` field) used as a relation target from multiple content types (`movie` and `about`). It acts as a normalised lookup table rather than repeating genre strings as enums.

**Convention:** Shared categorical data → separate collection type with a relation, not an inline enum, so editors can manage the list without a code deploy.

---

## 6. Dual Database Strategy (PostgreSQL everywhere)

The database config (`config/database.ts:5`) selects the client based on `DATABASE_URL`:
- **With `DATABASE_URL`:** PostgreSQL (used both locally and in production on Neon)
- **Without `DATABASE_URL`:** falls back to SQLite (present in code but not actively used)

Production adds SSL (`rejectUnauthorized: false`) for Neon/Railway compatibility.

**Convention:** Always set `DATABASE_URL` in `.env` — even locally — to keep the environment consistent with production.

---

## 7. Auto-Generated TypeScript Types

`types/generated/components.d.ts` and `types/generated/contentTypes.d.ts` are fully regenerated on every `npm run build`. They provide strict typing for all schema attributes via Strapi's `Schema.Attribute` API.

**Convention:** Never edit files in `types/generated/` manually. After any schema change (adding a field, component, or relation), run `npm run build` to regenerate them.
