# AI Lead Qualifier

A web app that qualifies sales leads with AI. The user submits lead info through a form on the frontend, a backend workflow scores/qualifies the lead with an LLM, and results stream back to the UI in realtime.

## WAT framework

This project follows the **WAT** framework:

- **W — Workflows / instructions** → [workflows/](workflows/)
  Markdown specs (the *what* and *why* of each workflow) paired with Trigger.dev task implementations (the *how*).
- **A — Agent** → Claude Code
  No folder. The agent reads `CLAUDE.md`, follows the conventions below, and uses the workflows + tools to build and maintain the project.
- **T — Tools / integrations** → [tools/](tools/)
  Pure helpers and SDK clients (OpenAI, etc.) used by workflows. No Trigger.dev imports here — keeps tools reusable and testable.

## Architecture

```
┌────────────────────┐        ┌──────────────────────────┐        ┌──────────────┐
│  frontend/ (Vercel)│        │  workflows/ (Trigger.dev)│        │   OpenAI     │
│                    │        │                          │        │              │
│  Form → "Analyze"  │  POST  │  /api/qualify route      │ tasks  │  Chat API    │
│  ─────────────────►│───────►│   → tasks.trigger(       │───────►│              │
│  page.tsx          │  JSON  │       "qualify-lead")    │        │              │
│                    │        │                          │        └──────────────┘
│  useRealtimeRun()  │◄───────│  returns { runId,        │
│  streams output    │ stream │            publicAccessToken }
└────────────────────┘        └──────────────────────────┘
```

1. User fills the form in `frontend/app/page.tsx` and clicks **Analyze**.
2. Frontend POSTs to `frontend/app/api/qualify/route.ts`.
3. The route calls `tasks.trigger("qualify-lead", input)` and returns `{ runId, publicAccessToken }`.
4. Frontend subscribes via `@trigger.dev/react-hooks` `useRealtimeRun(runId, { accessToken })` and renders status + final qualification result as it streams.

## Tech stack

| Layer    | Tech                                                                 |
|----------|----------------------------------------------------------------------|
| Frontend | Next.js 15 (App Router), React, deployed to **Vercel** via GitHub    |
| Backend  | **Trigger.dev v4** (`@trigger.dev/sdk`), Node, deployed to Trigger.dev cloud |
| LLM      | **OpenAI** (`openai` SDK)                                            |
| Schema   | Zod (shared between task `schemaTask` and frontend form validation)  |

## Folder conventions

### `workflows/`
- Every workflow has **two files**:
  - `<name>.md` — spec: purpose, inputs, outputs, scoring rubric, examples.
  - `<name>.task.ts` — implementation: a Trigger.dev v4 `schemaTask` with a Zod schema. The schema **is** the API contract.
- Export task ids from `workflows/index.ts`.
- Tasks may import from `tools/` but should not contain integration logic inline.

### `tools/`
- Pure helpers and SDK clients. **No `@trigger.dev/sdk` imports.**
- One file per integration (`openai-client.ts`, future: `slack.ts`, etc.).
- Re-export from `tools/index.ts`.
- `tools/scripts/` holds dev/deploy/type-check shell scripts.

### `frontend/`
- Standalone Next.js app with its own `package.json` (see *Packages* below).
- API routes are **thin** — trigger a task, return `{ runId, publicAccessToken }`. No business logic.
- Form validation reuses the Zod schema from the matching workflow (imported relatively).

## Frontend ↔ backend contract

**Request** — `POST /api/qualify`
```ts
// Body: LeadInput, mirrors workflows/qualify-lead.task.ts schema
{
  name: string;
  email: string;
  company: string;
  title?: string;
  notes?: string;
}
```

**Response**
```ts
{ runId: string; publicAccessToken: string }
```

**Streaming** — frontend uses the public access token + runId with `useRealtimeRun()` to receive status updates and the final task output.

## Environment variables

**Backend** (set in Trigger.dev project dashboard):
- `OPENAI_API_KEY`

**Frontend** (set in Vercel project settings):
- `TRIGGER_SECRET_KEY` — server-only, used by the API route to trigger tasks
- `NEXT_PUBLIC_TRIGGER_API_URL` — only if self-hosting Trigger.dev; omit for cloud

Local dev uses `.env.local` (frontend) and `.env` (root, for Trigger.dev). Both are gitignored.

## Packages

Two independent `package.json` files — **not** a monorepo:

- **Root `package.json`** — Trigger.dev tasks + tools. Deps: `@trigger.dev/sdk`, `openai`, `zod`.
- **`frontend/package.json`** — Next.js app. Deps: `next`, `react`, `@trigger.dev/sdk`, `@trigger.dev/react-hooks`, `zod`.

Shared types live in `workflows/<name>.task.ts` and are imported into the frontend by **relative path** (`../../workflows/qualify-lead.task.ts`). Keep these imports limited to types only (`import type { ... }`) so Next.js doesn't try to bundle the task code.

> If the project grows past 2–3 workflows or needs shared runtime code, switch to **pnpm workspaces**. Not now.

## Deployment

**Backend** (Trigger.dev):
```bash
npx trigger.dev@latest deploy
```
Run from the project root. CI is optional — Trigger.dev's CLI handles versioning.

**Frontend** (Vercel via GitHub):
1. Push to GitHub.
2. In Vercel, set the project **root directory** to `frontend/`.
3. Vercel auto-deploys on every push to `main`.

## Adding a new workflow

1. Write `workflows/<name>.md` — spec the inputs, outputs, and the scoring/decision logic in plain language.
2. Implement `workflows/<name>.task.ts` using `schemaTask` with a Zod schema. Pull integrations from `tools/`.
3. Add a Next.js API route at `frontend/app/api/<name>/route.ts` that triggers the task and returns `{ runId, publicAccessToken }`. Wire a UI to it.

## Reference

- **Trigger.dev v4 SDK patterns** (task definitions, `triggerAndWait` vs `Result`, waits, debounce) → see `c:\Users\jikah\CLAUDE.md`. Do **not** duplicate those patterns here.
- **Trigger.dev realtime hooks** → https://trigger.dev/docs/realtime/react-hooks
- **Vercel + Next.js subdirectory deploys** → set Root Directory in Project Settings.

## Out of scope (v1)

These are intentionally **not** built yet. Don't add them speculatively.

- Authentication / user accounts
- Lead enrichment (company lookup, web search, Clearbit, etc.)
- Persistence (database, history of past qualifications)
- Multi-tenant / team support
- Rate limiting beyond what Trigger.dev provides by default
