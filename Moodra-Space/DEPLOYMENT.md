# Deployment Guide — Moodra Space

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (built to `dist/public/`) |
| Backend | Node.js + Express (bundled to `dist/index.js`) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Google OAuth 2.0 + `express-session` |
| File storage | Supabase Storage (private bucket, accessed via server-side proxy) |
| PDF renderer | Python + WeasyPrint (optional sidecar, started by `start.sh`) |

---

## Running locally

```bash
# 1. Copy and fill in environment variables
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, SESSION_SECRET,
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL

# 2. Install dependencies
npm install

# 3. Push the database schema (first time only)
npm run db:push

# 4. Start the dev server (hot-reload)
npm run dev
```

The app will be available at `http://localhost:5000`.

---

## Building for production

```bash
npm run build
```

This runs `script/build.ts` which:
1. Cleans `dist/`
2. Builds the React client into `dist/public/` via Vite
3. Bundles the Express server into `dist/index.js` via esbuild
4. Attempts to install the Python dependencies for the Cyrillic PDF renderer
   (non-fatal — the Node.js server still starts if Python is unavailable)

---

## Starting in production

```bash
npm start
```

This runs `start.sh` which:
1. Starts the Cyrillic renderer (Python/WeasyPrint) in the background on `CYRILLIC_RENDERER_PORT` (default `3001`)
2. Starts the Node.js server in the foreground: `node dist/index.js`

The server listens on `0.0.0.0:PORT` (default `5000`).

---

## Render deployment

### Service type
**Web Service** (not a static site, not a background worker)

### Root directory
```
Moodra-Space
```
*(Set this in Render → Service → Settings → Root Directory)*

### Build Command
```
npm install && npm run build
```

### Start Command
```
npm start
```

### Environment variables to set in Render

Set all of these under **Render → Service → Environment**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase connection string (see below) |
| `SESSION_SECRET` | A long random string (`openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://<your-render-subdomain>.onrender.com/api/auth/google/callback` |
| `SUPABASE_URL` | Your project URL from Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from the same page (keep secret — server-side only) |
| `SUPABASE_STORAGE_BUCKET` | Name of your private storage bucket (e.g. `uploads`) |

Optional:

| Variable | Value |
|----------|-------|
| `CYRILLIC_RENDERER_PORT` | `3001` (default) |
| `OPENAI_API_KEY` | Server-level fallback key (users can set their own in the UI) |

---

## Setting DATABASE_URL for Supabase

In your Supabase dashboard → **Project Settings → Database → Connection string → URI**,
copy the **Session Mode** (port 5432) pooler URL:

```
postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

Paste this as `DATABASE_URL` in Render's environment variables.

### First deploy — push the schema

After setting `DATABASE_URL`, run the schema migration from your local machine
(or a Render one-off job):

```bash
DATABASE_URL="postgresql://..." npm run db:push
```

The `sessions` table is created automatically on first server startup
(`createTableIfMissing: true` in the session store config).

---

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add your Render URL to **Authorised redirect URIs**:
   ```
   https://<your-render-subdomain>.onrender.com/api/auth/google/callback
   ```
4. Copy the Client ID and Secret into Render's environment variables

---

## Supabase Storage setup

Designer page images (full-page images interleaved in the book layout) are stored in Supabase Storage. The service role key is used **only on the server** — the client never sees it.

### How it works

| Step | Detail |
|------|--------|
| Upload | `POST /api/books/:id/designer-pages/upload` — receives the image via multipart, uploads the buffer to Supabase Storage at path `designer-pages/{bookId}/{filename}` |
| Serve | `GET /api/uploads/designer-pages/:bookId/:filename` — server-side proxy fetches the file from Supabase Storage and streams it to the client |
| URL in DB | URLs are stored as `/api/uploads/designer-pages/{bookId}/{filename}` — permanent, never-expiring proxy paths |

### Required Supabase settings

1. **Create a private bucket** named `uploads` (or whatever you set `SUPABASE_STORAGE_BUCKET` to)
2. **Storage → Policies**: No client-side RLS policies are required because all access is via the service role key on the server side. You can leave the bucket with no public access policies.
3. _(Optional)_ If you want the Cyrillic PDF renderer to embed images directly from Supabase (bypassing the proxy), you can make the bucket public and return the public URL instead of the proxy URL — but the current server-proxy approach works fine for both web and PDF rendering.

### Manual step after first deploy

No schema changes are needed for storage. The only step is:
1. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` in Render
2. Create the `uploads` bucket in Supabase Storage (private)

---

## Changed files (deployment prep)

| File | Change |
|------|--------|
| `server/replit_integrations/auth/replitAuth.ts` | `createTableIfMissing: false` → `true` so the `sessions` table is auto-created on first startup |
| `server/supabase-storage.ts` | New: reusable server-side helper for Supabase Storage upload/download via REST API |
| `server/routes.ts` | Designer-pages upload writes to Supabase Storage instead of local disk; new GET proxy route added; `uploadsDir` creation and `fs` import removed |
| `server/index.ts` | Removed `express.static("/uploads", ...)` — local disk is no longer used for file serving |
| `.env.example` | Updated with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` as required vars |
| `DEPLOYMENT.md` | This file |

---

## Summary — exact Render settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `Moodra-Space` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **PORT** | Set automatically by Render; app reads `process.env.PORT` |
