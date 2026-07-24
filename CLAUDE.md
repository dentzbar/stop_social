# CLAUDE.md — stop_social

People sharing places for people. Vanilla single-file frontend + Vercel serverless backend.

## Git & GitHub

- **Remote:** `github.com/dentzbar/stop_social` — owned by **dentzbar**, NOT my personal account.
- I (`iftach-danciger`) have **no push access**. Pushing must use the `dentzbar` gh account:
  ```bash
  gh auth switch --user dentzbar
  GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=credential.helper \
    GIT_CONFIG_VALUE_0="!gh auth git-credential" git push origin main
  gh auth switch --user iftach-danciger   # always switch back afterward
  ```
- Both accounts are logged in via `gh` (keyring). Always restore `iftach-danciger` as the active account when done.
- Work directly on `main` (small personal project, no PR flow). Commit only when asked.

## Deploy (Vercel)

- Auto-deploys on push to `main` — pushing IS deploying. No manual deploy step.
- `api/*.js` are Vercel serverless functions (ES modules, `"type": "module"`).
- **Env vars** (set in Vercel dashboard): Neon `DATABASE_URL`, Vercel Blob `BLOB_READ_WRITE_TOKEN`.
- Stack: `@neondatabase/serverless` (Postgres) + `@vercel/blob` (image storage).

## Architecture

- **Frontend:** everything in [index.html](index.html) — HTML + inline CSS + vanilla JS, no build step. Hebrew, RTL.
- **Backend:** [api/posts.js](api/posts.js) (CRUD + reactions), [api/upload.js](api/upload.js) (image → Blob), [api/db.js](api/db.js) (Neon client), [api/seed.js](api/seed.js) (seed data).
- **DB schema:** [schema.sql](schema.sql) — `posts` + `comments`. Migrations are `alter ... if not exists` appended to the same file; run against Neon manually.

## Conventions

- No framework, no bundler — keep the frontend a single self-contained file.
- Images are user-uploaded and can be any aspect ratio; UI must keep the post bottom (text + reactions) visible for both vertical and horizontal images.
- Conventional commits, imperative mood.
