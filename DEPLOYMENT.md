# 🚀 Deploying to Render (single service)

This deploys the **whole app as one Render Web Service**: the build compiles the
React client, and Express serves it from the same server. One URL, no CORS, no
separate frontend host.

---

## 1. Prerequisites

- A **GitHub** (or GitLab) account — Render deploys from a Git repo.
- Your **MongoDB Atlas** cluster (already set up).
- A **Render** account → https://render.com (free tier is fine).

### ⚠️ Atlas network access (important)
Render's servers use changing outbound IPs, so you **must** allow access from
anywhere:
1. Atlas → **Network Access** → **Add IP Address**
2. Choose **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`) → Confirm.

(You already did this for local dev — keep it.)

---

## 2. Push the project to GitHub

From the project root (`Family/`):

```bash
git init
git add .
git commit -m "Family Tree Manager"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

> `.gitignore` already excludes `node_modules/`, `client/dist/`, and `.env`
> files, so your secrets are **not** pushed.

---

## 3. Create the Render service

### Option A — Blueprint (uses `render.yaml`, easiest)
1. Render Dashboard → **New +** → **Blueprint**.
2. Connect your repo. Render reads `render.yaml` and pre-fills everything.
3. When prompted, fill in the secret env vars (see step 4) → **Apply**.

### Option B — Manual Web Service
1. Render Dashboard → **New +** → **Web Service** → connect your repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Add the env vars below → **Create Web Service**.

---

## 4. Environment variables (set in Render dashboard)

| Key              | Value                                              |
| ---------------- | -------------------------------------------------- |
| `NODE_ENV`       | `production`                                        |
| `MONGO_URI`      | your full Atlas connection string                   |
| `JWT_SECRET`     | a long random string (e.g. 64 hex chars)            |
| `JWT_EXPIRES_IN` | `7d`                                                |

Notes:
- **Do not** set `PORT` — Render injects it automatically and the server uses it.
- **Do not** set `VITE_API_URL` — the client defaults to `/api` (same origin),
  which is exactly what we want for single-service.

---

## 5. Deploy & use

Render runs `npm run build` (installs deps, builds the client) then `npm start`.
When it goes live you get a URL like:

```
https://family-tree.onrender.com
```

Open it, register/login, and build your tree. 🎉

---

## Troubleshooting

- **"database not connected"** → check the `MONGO_URI` value and that Atlas
  Network Access allows `0.0.0.0/0`. The server auto-retries, so fix it and it
  connects within ~30s (or redeploy).
- **Build fails on `vite: not found`** → ensure the Build Command is exactly
  `npm run build` (the root script installs the client's dev deps with
  `--include=dev`, which Vite needs).
- **First request is slow** → Render's free tier spins the service down when
  idle; the first hit after a while takes ~30–50s to wake up. Upgrade the plan
  to keep it always on.
- **Blank page / 404 on refresh of a route** → already handled: Express serves
  `index.html` for any non-API route (SPA fallback).
