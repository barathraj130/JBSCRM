# JBS Knit Wear CRM

A production-style CRM for managing IndiaMART leads, WhatsApp sales automation, and team productivity — built as a premium SaaS-style application with role-based access (Admin / Sales Manager / Employee).

## Tech stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma ORM
- **Auth**: JWT (access + refresh tokens), role-based access control
- **Automation**: n8n webhook integration for WhatsApp message automation
- **WhatsApp**: provider-agnostic interface — mock provider by default, swappable for a real WhatsApp Business API account
- **AI**: Anthropic Claude — reply suggestions, conversation summaries, sentiment, next-best-action, EN/Tamil/Hindi translation
- **Reports**: PDF (pdfkit), Excel (exceljs), CSV export
- **Deployment**: Docker, docker-compose

## Monorepo layout

```
apps/
  api/      Express API (REST, Prisma, integrations, PDF/Excel export)
  web/      Next.js app (App Router, shadcn/ui)
packages/
  shared/   Types and enums shared between api and web
scripts/
  backup-db.sh   Postgres backup script (see below)
```

## Local development

### 1. Prerequisites

- Node.js 20+
- pnpm (`corepack enable` will provide it)
- Docker Desktop (for Postgres + n8n)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The defaults work out of the box for local dev. Notable variables in `apps/api/.env`:

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | points at the local Docker Postgres |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets | change these for anything beyond local dev |
| `WHATSAPP_PROVIDER` | `mock` or a real provider | `mock` (messages are logged, not delivered) |
| `N8N_WEBHOOK_URL` | Outbound notifications to n8n | local n8n instance |
| `N8N_API_KEY` | Authenticates n8n's inbound calls to `/api/webhooks/whatsapp-inbound` | set to any value locally |
| `ANTHROPIC_API_KEY` | Enables the AI panel (Claude) | unset — AI features show a "not configured" state until set |
| `COMPANY_NAME` / `COMPANY_GSTIN` / `COMPANY_ADDRESS` | Quotation PDF letterhead | `JBS Knit Wear` |

> **Note on ports**: if you already run Postgres locally on 5432, `docker-compose.yml` maps the container to **5433** instead so it won't collide. Adjust `POSTGRES_PORT` in `.env` if you need a different port.

### 4. Start Postgres + n8n

```bash
pnpm docker:up
```

### 5. Run migrations and seed demo data

```bash
pnpm db:migrate
pnpm db:seed
```

Seeded logins (password `password123` for all):

| Role | Email |
|---|---|
| Admin | `admin@indiamartcrm.dev` |
| Sales Manager | `manager@indiamartcrm.dev` |
| Employee | `rahul@indiamartcrm.dev` |
| Employee | `sneha@indiamartcrm.dev` |

### 6. Run the app

```bash
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:3000
```

## Database backups

```bash
pnpm db:backup
```

Dumps the running Postgres container to a gzipped SQL file under `db-backups/` and prunes anything older than 14 days (`RETENTION_DAYS` env var to change). For a daily backup, add a cron entry:

```
0 2 * * * cd /path/to/indiamart-crm && ./scripts/backup-db.sh >> db-backups/backup.log 2>&1
```

## Production deployment

Multi-stage Dockerfiles are provided for both apps (`apps/api/Dockerfile`, `apps/web/Dockerfile`), plus a self-contained `docker-compose.prod.yml` that builds and runs Postgres, n8n, the API, and the web app together:

```bash
docker compose -f docker-compose.prod.yml up --build
```

Override every secret (`JWT_*_SECRET`, `POSTGRES_PASSWORD`, `ANTHROPIC_API_KEY`, etc.) via a real `.env` file before deploying anywhere beyond a local smoke test — the defaults baked into `docker-compose.prod.yml` are for local testing only. `NEXT_PUBLIC_API_URL` must point at the API's public URL and is baked in at **build time** (Next.js inlines `NEXT_PUBLIC_*` vars), not runtime.

## WhatsApp automation (n8n)

The intended flow: a customer messages your WhatsApp Business number → n8n receives the webhook → n8n calls `POST /api/webhooks/whatsapp-inbound` (authenticated via `x-n8n-api-key`) → the API detects intent (Claude if configured, keyword matching otherwise), matches a product category, and sends back images/brochure/pricing through the configured WhatsApp provider, logging everything to the CRM.

Since this only ships with the mock provider, you can exercise the whole pipeline without a real WhatsApp account or n8n workflow via the **"Simulate an incoming customer message"** box on a customer's WhatsApp tab in the CRM.

A ready-to-import n8n workflow implementing the real Meta WhatsApp Business Cloud API side of this (webhook verification + inbound message forwarding) lives in [`n8n/whatsapp-inbound-workflow.json`](n8n/whatsapp-inbound-workflow.json) — see [`n8n/README.md`](n8n/README.md) for setup.

## What's built

1. **Foundation** — auth, RBAC, dashboard
2. **Lead & Customer Management** — leads list, duplicate-guarded manual entry, Customer 360 profile
3. **Catalog & Quotations** — product catalog with media upload, quotation builder, PDF export, send-via-WhatsApp
4. **WhatsApp Automation & AI** — chat history, n8n webhook, Claude-backed suggestions/summary/sentiment/translation
5. **Productivity, Reports, Admin** — notifications, employee leaderboard, exportable reports, admin panel (employees, WhatsApp templates, automation status, system logs)
6. **Polish & Deploy** — production Docker images, DB backups, this README

## Scope notes

A few things were deliberately left out rather than faked:

- No dynamic permissions editor — roles are three fixed, code-defined roles (Admin/Manager/Employee), not a data-driven permission system.
- Employees are deactivated, not hard-deleted, to avoid orphaning their leads/activity history.
- "Quotation Viewed" tracking isn't implemented — there's no view-tracking mechanism, so it isn't surfaced as a notification.
