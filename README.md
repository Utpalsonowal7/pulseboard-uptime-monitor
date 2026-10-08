# PulseBoard

A full-stack uptime monitoring dashboard for websites and HTTP APIs. PulseBoard includes email/password accounts, private per-user monitors, scheduled endpoint checks, incident history, and shareable public status pages.

## Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, React Router
- **API:** Node.js, Express, TypeScript, Prisma 7, PostgreSQL, Zod
- **Checks:** modular monitoring service + non-overlapping 60-second scheduler

## Local setup

Requirements: Node.js 20+, npm, and Docker Desktop (for the local PostgreSQL container).

In PowerShell, from the repository root:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
docker compose up -d --wait postgres
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The example database URL targets the PostgreSQL container in `docker-compose.yml`. If you already have a database, point `DATABASE_URL` in `server/.env` at a dedicated PulseBoard database before running migrations. Do not use a database that belongs to another application. The local development server generates a temporary JWT secret if `JWT_SECRET` is unset; configure a long, unique value for production.

Open http://localhost:5173. The API runs at http://localhost:8080 and its database-backed health endpoint is http://localhost:8080/api/health. Keep the dev terminal running; use `docker compose down` to stop PostgreSQL when you are finished.

Client: http://localhost:5173 · API: http://localhost:8080/api · Health: http://localhost:8080/api/health

## Prisma commands

- `npm run prisma:generate` generates Prisma Client.
- `npm run prisma:migrate -- --name init` creates and applies a development migration.
- `npm run prisma:deploy` applies committed migrations in production.

The database workflow uses migrations. `db push` is intentionally not the production workflow.

## Docker API

```bash
docker build -t pulseboard-api -f server/Dockerfile .
docker run --env-file server/.env -p 8080:8080 pulseboard-api
```

The API container compiles TypeScript and starts with `node dist/server.js`. Apply migrations as a release step with `npm run prisma:deploy`.

## Environment

Server variables are documented in `server/.env.example`; client variables are in `client/.env.example`. Never commit real credentials.

## API routes

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/monitors`, `POST /api/monitors`
- `GET /api/monitors/:id`, `PATCH /api/monitors/:id`, `DELETE /api/monitors/:id`
- `GET /api/monitors/:id/checks`, `/stats`, `/incidents`
- `GET /api/status/:slug` (public)

Monitor CRUD, checks, stats, and incidents require an authenticated session. Responses use `{ data: ... }`; errors use `{ error: { message, details? } }`. Public status pages remain accessible without signing in.

## Architecture

Routes call controllers, which call services; database access goes through Prisma. The scheduler only starts a check run, while `monitorChecker.service.ts` owns endpoint checks and incident transitions. Host validation rejects local/private/internal and cloud-metadata destinations before each request. Redirects are not followed, preventing redirect-based SSRF bypasses.

```text
pulseboard/
├── client/       React dashboard and public status pages
├── server/       Express API, Prisma schema, scheduler, Dockerfile
└── README.md
```

## Planned AWS deployment

```text
React/Vite → AWS Amplify → Express API on AWS App Runner → Prisma → AWS RDS PostgreSQL
```

The scheduler currently runs in the API process for the MVP. For production scaling, move scheduled checks to EventBridge + Lambda or a dedicated worker so multiple API instances do not duplicate checks. Do not run multiple scheduler replicas without a distributed lock.

**Authentication and CSRF:** email/password login uses bcrypt password hashes and HttpOnly access/refresh cookies. Refresh tokens rotate and are stored as hashes; sessions can be revoked. Every API mutation requires a signed, expiring CSRF token in both an HttpOnly cookie and the `X-CSRF-Token` header, and requests with a mismatched `Origin` are rejected. The client fetches and refreshes the CSRF token automatically. Monitor management is scoped to the signed-in user; public status pages remain public.

For production, set a unique `JWT_SECRET` of at least 32 characters, `NODE_ENV=production`, the exact HTTPS `FRONTEND_URL`, the production PostgreSQL `DATABASE_URL`, and `TRUST_PROXY_HOPS=1` when one trusted reverse proxy sits in front of the API. Keep `TRUST_PROXY_HOPS=0` for direct local access. Run `npm run prisma:deploy` as a release step before starting the API. The API verifies its database connection before listening and shuts down gracefully on `SIGTERM`/`SIGINT`.
