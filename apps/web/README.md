# apps/web

The OpenReturn web app: Next.js 16 (App Router). You chat with Cade, upload documents, watch your return take shape, and ask the tax code questions.

## Run

From the repo root:

```bash
npm run dev:all   # agent (:4111) + web (:3000)
npm run dev:web   # web only
```

The first run redirects to `/setup` to create the owner account. The env file is `.env.development` (see `.env.example`). `APP_DB_PATH` and `DOCUMENTS_PATH` must point at the same files as the agent.

## Pages

| Route | What it shows |
| --- | --- |
| `/setup`, `/login` | First-run owner account, then a password sign-in |
| `/` | Home: tax returns, estimates, the tax code search box |
| `/r/[returnId]` | A return: chat with Cade, activity, forms, documents |
| `/ask/[threadId]` | Ask The Tax Code: cited answers and follow-up questions |
| `/library` | The reference documents the answers can cite |
| `/library/[docId]` | One HTML reference document (FTB web page), opened at a cited section |

## How it talks to the agent

- **The browser never calls the agent.** Agent calls go through `/api/agent/[...path]`, which checks the session cookie and forwards to `AGENT_INTERNAL_URL` (default `http://127.0.0.1:4111`).
- **Everything else reads `app.db` directly:** Server Components through `lib/serverDb.ts`, browser code through the other `/api/*` route handlers.
- **Auth** is one owner and one password (`lib/localAuth.ts`). `proxy.ts` checks only that the cookie exists; layouts and route handlers verify it with `getOwnerSession()`.

See the root `CLAUDE.md` for the whole architecture.
