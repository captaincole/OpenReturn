# web — the OpenReturn app

[← Back to the README](../README.md)

The web app is where you work: chat with Cade, upload documents, watch your return take shape, and ask the tax code questions. It is a Next.js 16 app (App Router) on port 3000.

<p align="center">
  <img src="../static/screenshots/home.png" alt="The OpenReturn home page: a greeting, the tax code search box, the 2025 return card and the 2026 estimated taxes card" width="880">
</p>

## Run

From the repo root:

```bash
npm run dev:all   # Canon (:4112) + Cade (:4111) + web (:3000)
npm run dev:web   # web only
npm run test:unit # unit tests: the engine's, Canon's and Cade's, then the web app's (lib/*.test.ts)
npm run e2e       # Playwright E2E through the UI (see e2e/README.md)
npm run e2e:madison  # the same for Madison and the Deductions tab
```

The first run redirects to `/setup` to create the local user. The env file is `.env.development` (see `.env.example`). `APP_DB_PATH` and `DOCUMENTS_PATH` must point at the same files as Cade's.

## Pages

| Route | What it shows |
| --- | --- |
| `/setup`, `/login` | First-run local user, then a password sign-in |
| `/notice` | First-visit notice on an instance behind Cloudflare Access (`AUTH_MODE=cloudflare-access`, see `.env.example`) |
| `/` | Home: tax returns, estimates, the tax code search box |
| `/r/[returnId]` | A return: chat with Cade, activity, forms, documents |
| `/r/[returnId]/deductions` | The return's deductions conversation: answers to tap, the documents Cade asks for there, and the itemize-or-standard summary |
| `/ask/[threadId]` | Ask Canon: cited answers and follow-up questions |
| `/library` | The reference documents the answers can cite |
| `/library/[docId]` | One HTML reference document (an FTB web page), opened at a cited section |

<p align="center">
  <img src="../static/screenshots/library.png" alt="The Reference Library: the federal IRS documents, each with its tax year, publication date, page and passage counts, and Open PDF and Source links" width="880">
</p>

## How it talks to Cade and Canon

- **The browser never calls Cade.** Calls to Cade go through `/api/agent/[...path]`, which checks the session cookie and forwards to `AGENT_INTERNAL_URL` (default `http://127.0.0.1:4111`).
- **The reference library comes from Canon.** `/api/canon/[...path]` (read-only, same cookie check) forwards to `CANON_INTERNAL_URL` (default `http://127.0.0.1:4112`).
- **Each proxy forwards only the routes on its list** (`lib/proxyRoutes.ts`) and answers 404 for any other route: Cade and Canon also serve Mastra's own routes. A new browser call needs a line there and in `lib/proxyRoutes.test.ts`.
- **Everything else reads `app.db` directly:** Server Components through `lib/serverDb.ts`, browser code through the other `/api/*` route handlers.
- **Auth** is a `users` table and, by default, one user with one password (`lib/localAuth.ts`, `lib/userStore.ts`). `proxy.ts` checks only that the cookie exists; layouts and route handlers verify it with `getUserSession()`. The agent proxy names the session's user to Cade in the `x-openreturn-user-id` header.

## Inside

```
web/
├── app/          the pages above, and the /api/* route handlers
├── components/   AppShell, ChatPane, DeductionReplies, ActivityCard, PlanCard, TopBar, Markdown
├── lib/          localAuth, sessionToken, userStore, serverDb, api, ask, activity, chatSession, deductions, mastraClient, proxyRoutes, uploads
├── e2e/          Playwright: drives web + Cade + Canon + a real model (e2e/README.md)
└── proxy.ts      the optimistic session-cookie gate
```

See the root `CLAUDE.md` for the whole architecture.
