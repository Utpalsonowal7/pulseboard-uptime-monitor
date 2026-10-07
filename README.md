# PulseBoard

A full-stack uptime monitoring dashboard for websites and HTTP APIs. PulseBoard periodically checks enabled endpoints, records response history, tracks incidents, and exposes shareable public status pages.

## Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, React Router
- **API:** Node.js, Express, TypeScript, Prisma 7, PostgreSQL, Zod
- **Checks:** modular monitoring service + non-overlapping 60-second scheduler

## Local setup

Requirements: Node.js 20+, npm, and PostgreSQL 14+.

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Set `DATABASE_URL` in `server/.env` to your PostgreSQL connection string. Then:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

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
- `GET /api/monitors`, `POST /api/monitors`
- `GET /api/monitors/:id`, `PATCH /api/monitors/:id`, `DELETE /api/monitors/:id`
- `GET /api/monitors/:id/checks`, `/stats`, `/incidents`
- `GET /api/status/:slug` (public)

Responses use `{ data: ... }`; errors use `{ error: { message, details? } }`.

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

**Before a public deployment:** this starter currently has no user authentication or workspace authorization. Keep the API private until authentication and per-user monitor ownership are added; CORS is not an access-control boundary.
