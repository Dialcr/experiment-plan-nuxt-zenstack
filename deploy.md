# Deployment

## Overview

This application is deployed as a Node.js SSR server to **Render** using a **Docker** runtime.

Stack: Nuxt 4 + Vue 3 + Nitro + ZenStack + PostgreSQL (Supabase) + Supabase Auth.

---

## Docker

### Build

```bash
docker build \
  --build-arg DATABASE_URL=<your-database-url> \
  --build-arg SUPABASE_URL=<your-supabase-url> \
  --build-arg SUPABASE_PUBLIC_KEY=<your-supabase-public-key> \
  -t experiment-plan .
```

### Run

```bash
docker run \
  -e DATABASE_URL=<your-database-url> \
  -e SUPABASE_URL=<your-supabase-url> \
  -e SUPABASE_PUBLIC_KEY=<your-supabase-public-key> \
  -p 3000:3000 \
  experiment-plan
```

The application is available at `http://localhost:3000`.

### Multi-stage Build

The Dockerfile uses three stages:

1. **deps** — installs all dependencies with frozen lockfile
2. **build** — generates ZenStack artifacts and builds the Nuxt application
3. **runner** — minimal production image containing only the `.output` directory

Build-time arguments:

| ARG | Required | Secret? | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | Yes | PostgreSQL connection string (build validates it) |
| `SUPABASE_URL` | Yes | No | Injected at build time for Nuxt configuration |
| `SUPABASE_PUBLIC_KEY` | Yes | No | Injected at build time for Nuxt configuration |

> `DATABASE_URL` is used at build time for Nuxt config validation but does **not** persist to the final runner image — only `.output/` is copied to production.

Runtime environment variables (secrets):

| ENV | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_PUBLIC_KEY` | Yes | Supabase anon/public key |

---

## Render Configuration

### Service Type

- **Type**: Web Service
- **Runtime**: Docker
- **Region**: Choose the closest to your users

### Build-time Environment Variables

Set these in the Render dashboard under **Environment** → **Build**:

| Variable | Secret? |
|---|---|
| `DATABASE_URL` | Yes |
| `SUPABASE_URL` | No |
| `SUPABASE_PUBLIC_KEY` | No |

### Runtime Environment Variables

Set these in the Render dashboard under **Environment** → **Runtime**:

| Variable | Type | Notes |
|---|---|---|
| `DATABASE_URL` | Secret | Never commit to version control |
| `SUPABASE_URL` | Standard | Your Supabase project URL |
| `SUPABASE_PUBLIC_KEY` | Standard | Your Supabase anon key |
| `NODE_ENV` | Standard | Set to `production` |

### Start Command

Render uses the Dockerfile's `CMD`:

```bash
node .output/server/index.mjs
```

### Deploy Hook

Render provides a Deploy Hook URL in the dashboard. Copy it and add as a GitHub secret (see below).

---

## GitHub Secrets

Configure these in the repository under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for production database |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLIC_KEY` | Supabase anon/public key |
| `RENDER_DEPLOY_HOOK` | Render Deploy Hook URL for triggering deployments |

---

## GitHub Actions

### CI (`ci.yml`)

**Triggers:**
- Pull requests to any branch
- Pushes to all branches except `main`

**Pipeline:**
1. Checkout repository
2. Enable Corepack
3. Setup Node.js 22 (with pnpm caching)
4. Install dependencies (`pnpm install --frozen-lockfile`)
5. Generate ZenStack artifacts (`pnpm zen generate`)
6. Build (`pnpm build`)
7. Lint (`pnpm lint`) — skipped if script does not exist
8. Type check (`pnpm typecheck`) — skipped if script does not exist
9. Test (`pnpm test`) — skipped if script does not exist

This workflow is suitable for **branch protection** — it can be required as a status check before merging into `main`.

The old `pr-build.yml` is preserved alongside `ci.yml` for backwards compatibility.

### Deploy (`deploy.yml`)

**Trigger:**
- Push to `main`

**Pipeline:**
1. Checkout repository
2. Enable Corepack
3. Setup Node.js 22 (with pnpm caching)
4. Install dependencies (`pnpm install --frozen-lockfile`)
5. Generate ZenStack artifacts (`pnpm zen generate`)
6. Build (`pnpm build`)
7. Run database migrations (`pnpm zen migrate deploy`)
8. Trigger Render deployment via Deploy Hook (`curl POST`)

Database migrations run **before** the new application version is deployed, ensuring the database schema is ready for the incoming code.

---

## Production Deployment Flow

```
Developer pushes to main
        │
        ▼
  GitHub Actions (deploy.yml)
        │
        ├── 1. Checkout
        ├── 2. Install dependencies
        ├── 3. ZenStack generate
        ├── 4. Build (nuxt build)
        │
        ├── 5. Run database migrations (zen migrate deploy)
        │         │
        │         ├── Success ──► 6. Trigger Render Deploy Hook
        │         │                    │
        │         │                    ▼
        │         │              Render builds Docker image
        │         │              and deploys new version
        │         │
        │         └── Failure ──► Pipeline stops.
        │                         Migration must be fixed manually.
        │
        └── Any step fails ──► Pipeline stops. No deployment.
```

---

## Required Environment Variables

| Variable | Where Used | Secret? |
|---|---|---|
| `DATABASE_URL` | Build + Runtime | Yes |
| `SUPABASE_URL` | Build + Runtime | No (public URL) |
| `SUPABASE_PUBLIC_KEY` | Build + Runtime | No (public anon key) |
| `RENDER_DEPLOY_HOOK` | GitHub Actions only | Yes |
