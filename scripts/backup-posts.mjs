#!/usr/bin/env node
/**
 * backup-posts.mjs
 *
 * Fetches all movie posts from Strapi and backs them up as Markdown files
 * to the cinefile-content GitHub repo via the GitHub API.
 *
 * Requires: GITHUB_TOKEN in .env
 * Usage: node --env-file=.env scripts/backup-posts.mjs
 */

const STRAPI_PORT = process.env.PORT ?? 1337;
const STRAPI_API_URL = `http://127.0.0.1:${STRAPI_PORT}/api`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "sonicakes";
const GITHUB_REPO = "cinefile-content";
const GITHUB_API = "https://api.github.com";

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is not set. Add it to your .env file.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------
async function githubRequest(method, path, body) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} failed ${res.status}: ${text}`);
  }

  return res.status === 404 ? null : res.json();
}

// Get current file SHA (needed to update an existing file)
async function getFileSha(filePath) {
  const data = await githubRequest("GET", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`);
  return data?.sha ?? null;
}

// Create or update a file in the repo
async function upsertFile(filePath, content, message) {
  const sha = await getFileSha(filePath);
  const encoded = Buffer.from(content, "utf-8").toString("base64");

  await githubRequest("PUT", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
    message,
    content: encoded,
    ...(sha ? { sha } : {}),
  });
}

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
// Fetch all posts from Strapi
// ---------------------------------------------------------------------------
async function fetchAllPosts() {
  const url = `${STRAPI_API_URL}/posts?populate=*&pagination[pageSize]=100`;
  console.log(`Fetching posts from ${url}...`);

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
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join("\n");

  const body = movie.body_blog ?? "";
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

// ---------------------------------------------------------------------------
// Convert a Strapi post record to a Markdown file string
// ---------------------------------------------------------------------------
function toPostMarkdown(post) {
  const fm = {
    id: post.id,
    documentId: post.documentId,
    title: post.title,
    date: post.date ?? null,
    meta_title: post.meta_title ?? null,
    excerpt: post.excerpt ?? null,
    image_description: post.image_description ?? null,
    further_reading: post.further_reading ?? [],
    spotify_episodes: post.spotify_episodes ?? [],
    img_url: post.img?.url ?? null,
  };

  const frontmatter = Object.entries(fm)
    .map(([k, v]) => {
      if (v === null || v === undefined) return `${k}: null`;
      if (typeof v === "string") return `${k}: "${v.replace(/"/g, '\\"')}"`;
      if (typeof v === "boolean" || typeof v === "number") return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join("\n");

  const body = post.body_blog ?? "";
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

// ---------------------------------------------------------------------------
// Generate a README index of all posts
// ---------------------------------------------------------------------------
function toReadme(movies, posts, timestamp) {
  const movieRows = movies
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((m) => `| ${m.title} | ${m.director} | ${m.year} | [${m.documentId}.md](movies/${m.documentId}.md) |`)
    .join("\n");

  const postRows = posts
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => `| ${p.title} | ${p.date ?? ""} | [${p.documentId}.md](posts/${p.documentId}.md) |`)
    .join("\n");

  return `# Cinefile Content Backup\n\nLast updated: ${timestamp} — ${movies.length} movies, ${posts.length} posts\n\n## Movies\n\n| Title | Director | Year | File |\n|---|---|---|---|\n${movieRows}\n\n## Posts\n\n| Title | Date | File |\n|---|---|---|\n${postRows}\n`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const [movies, posts] = await Promise.all([fetchAllMovies(), fetchAllPosts()]);
  console.log(`Found ${movies.length} movies, ${posts.length} posts.`);

  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  const commitMessage = `backup: ${timestamp} (${movies.length} movies, ${posts.length} posts)`;

  // Upload each movie file
  for (const movie of movies) {
    const filePath = `movies/${movie.documentId}.md`;
    const content = toMarkdown(movie);
    console.log(`  Upserting ${filePath}...`);
    await upsertFile(filePath, content, commitMessage);
  }

  // Upload each post file
  for (const post of posts) {
    const filePath = `posts/${post.documentId}.md`;
    const content = toPostMarkdown(post);
    console.log(`  Upserting ${filePath}...`);
    await upsertFile(filePath, content, commitMessage);
  }

  // Upload README index
  console.log("  Upserting README.md...");
  await upsertFile("README.md", toReadme(movies, posts, timestamp), commitMessage);

  console.log(`\nDone! ${movies.length} movies and ${posts.length} posts backed up to cinefile-content.`);
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
