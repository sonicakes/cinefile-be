#!/usr/bin/env node
/**
 * backup-posts.mjs
 *
 * Fetches all movie posts from Strapi and backs them up as Markdown files
 * with YAML frontmatter to the cinefile-content GitHub repo.
 *
 * Usage: node scripts/backup-posts.mjs
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const STRAPI_API_URL = "http://127.0.0.1:1337/api";
const CONTENT_REPO_URL = "https://github.com/sonicakes/cinefile-content.git";
const CLONE_DIR = join(__dirname, "../.content-backup-tmp");

// ---------------------------------------------------------------------------
// Fetch all movies from Strapi
// ---------------------------------------------------------------------------
async function fetchAllMovies() {
  const url = `${STRAPI_API_URL}/movies?populate=*&pagination[pageSize]=100`;
  console.log(`Fetching movies from ${url}...`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Strapi request failed: ${res.status} ${res.statusText}`);

  const json = await res.json();
  return json.data ?? [];
}

// ---------------------------------------------------------------------------
// Convert a Strapi movie record to a Markdown file string
// ---------------------------------------------------------------------------
function toMarkdown(movie) {
  const fm = {
    id: movie.id,
    documentId: movie.documentId,
    title: movie.title,
    year: movie.year,
    director: movie.director,
    run_time: movie.run_time,
    rating: movie.rating,
    rating_metric: movie.rating_metric,
    date_reviewed: movie.date_reviewed ?? null,
    date_watched: movie.date_watched ?? null,
    excerpt: movie.excerpt ?? null,
    meta_title: movie.meta_title ?? null,
    quote: movie.quote ?? null,
    image_description: movie.image_description ?? null,
    letterboxd_uri: movie.letterboxd_uri ?? null,
    would_recommend: movie.would_recommend,
    would_rewatch: movie.would_rewatch,
    review_provided: movie.review_provided,
    genres: (movie.genres ?? []).map((g) => g.name),
    availability: movie.availability ?? [],
    spotify_episodes: movie.spotify_episodes ?? [],
    next_movie: movie.next_movie?.movie?.title ?? null,
    img_url: movie.img?.url ?? null,
  };

  const frontmatter = Object.entries(fm)
    .map(([k, v]) => {
      if (v === null || v === undefined) return `${k}: null`;
      if (typeof v === "string") return `${k}: "${v.replace(/"/g, '\\"')}"`;
      if (typeof v === "boolean" || typeof v === "number") return `${k}: ${v}`;
      // arrays/objects — JSON inline
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join("\n");

  const body = movie.body_blog ?? "";

  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

// ---------------------------------------------------------------------------
// Derive a stable filename from documentId so renames don't create duplicates
// ---------------------------------------------------------------------------
function toFilename(movie) {
  return `${movie.documentId}.md`;
}

// ---------------------------------------------------------------------------
// Generate a README index of all posts
// ---------------------------------------------------------------------------
function toReadme(movies, timestamp) {
  const rows = movies
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((m) => `| ${m.title} | ${m.director} | ${m.year} | [${m.documentId}.md](posts/${m.documentId}.md) |`)
    .join("\n");

  return `# Cinefile Content Backup

Last updated: ${timestamp} — ${movies.length} posts

| Title | Director | Year | File |
|---|---|---|---|
${rows}
`;
}

// ---------------------------------------------------------------------------
// Git helpers — run commands inside the cloned repo
// ---------------------------------------------------------------------------
function git(cmd) {
  execSync(`git ${cmd}`, { cwd: CLONE_DIR, stdio: "inherit" });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // 1. Fetch posts
  const movies = await fetchAllMovies();
  console.log(`Found ${movies.length} movies.`);

  // 2. Clone or pull the content repo into a temp directory
  if (existsSync(CLONE_DIR)) {
    console.log("Updating existing content repo clone...");
    git("pull --ff-only");
  } else {
    console.log("Cloning content repo...");
    execSync(`git clone ${CONTENT_REPO_URL} "${CLONE_DIR}"`, { stdio: "inherit" });
  }

  // 3. Write markdown files
  const postsDir = join(CLONE_DIR, "posts");
  mkdirSync(postsDir, { recursive: true });

  for (const movie of movies) {
    const filename = toFilename(movie);
    const content = toMarkdown(movie);
    writeFileSync(join(postsDir, filename), content, "utf-8");
    console.log(`  Written: posts/${filename}`);
  }

  // 4. Write README index
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  writeFileSync(join(CLONE_DIR, "README.md"), toReadme(movies, timestamp), "utf-8");

  // 5. Commit and push
  git("add .");

  // Check if there's anything to commit
  const status = execSync("git status --porcelain", { cwd: CLONE_DIR }).toString().trim();
  if (!status) {
    console.log("No changes to commit — content is already up to date.");
    return;
  }

  git(`commit -m "backup: ${timestamp} (${movies.length} posts)"`);
  git("push");

  console.log(`\nDone! ${movies.length} posts backed up and pushed to cinefile-content.`);
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
