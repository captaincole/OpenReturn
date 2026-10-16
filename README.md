# Summa by @captaincole — AI Can Do Your Taxes

Summa is a local-capable AI harness that allows you to build all the documents you need to either estimate or file your taxes.

## Why? - Let's Break The System...

Taxes shouldn't be as hard as they are today. An entire industry profits from keeping the U.S. tax system difficult and opaque, but it doesn't have to be that way and this project is an attempt to change that system. 

You shouldn't have to pay a private company to help you figure out how much money you have to pay to the government!

This project was going to be a startup, but life changed directions. Now I want this to be a collaborative project that has the greatest impact it can.

## Contents

- [What Is Summa?](#what-is-summa)
- [Before you use this — read honestly](#before-you-use-this--read-honestly)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [License](#license)

## What Is Summa?

Summa is a local-capable AI harness that allows you to build all the documents you need to either estimate or file your taxes. Summa is built with three distinct parts working together: a web app you talk to, an AI agent that turns the conversation into data, and a deterministic engine that turns the data into your return.

<p align="center">
  <img src="static/how-it-works.svg" alt="The Summa triangle — your words and documents go to Luca, Luca turns them into tax facts and decisions, the Form Engine computes the draft return and open questions, and the results flow back to you" width="640">
</p>

- **Web App (apps/web)** — where you live: type messages, store documents, watch your
  return take shape. This is your standard web application
- **Luca (apps/agent)** — the agent: interviews you, and reads the documents you upload
  (a W-2 PDF, a 1099, a photo of either) directly. From both it does two
  critical jobs. It records **tax facts**: verbatim pieces of data, each with
  a citation for where it came from (a document, a statement line, or "you
  told me, on this date").
  And it makes **decisions**: judgment calls where the facts are ambiguous —
  each one double-checked in the background against the actual IRS/FTB
  instruction text, which either cites the supporting passage or reopens the
  question. Numbers are never invented — an unknown becomes an open question,
  not a guess.
- **Form Engine (apps/agent/src/engine)** — a solver. Takes the facts and decisions and computes the
  draft 1040/540 by the tax rules — deterministic code, no AI anywhere in the
  math. Every new fact re-computes the return, so your draft updates live as
  you talk, and the open questions it surfaces are what Luca asks you next.

## Before you use this — read honestly

- **Your tax data goes to your model.** Every conversation turn and every background check sends your tax facts to the model you configured. A local model or your own private infrastructure keeps the data with you; a cloud API (Anthropic, OpenAI) does not.
- **This is not tax advice.** Summa is in beta and produces *drafts*. Have a CPA check the work.
- **Coverage is narrow** — see [what Summa supports](docs/testing-with-your-return.md#what-summa-supports). Outside it, Luca says "we don't handle that yet" rather than guess.

## Quick Start

The default setup uses Anthropic models (just for ease of startup), but Summa can run against **any OpenAI-compatible model server**. I've personally tested this using Ollama + Gemma4 on my MacBook Air M4. Semantic retrieval (RAG) over the IRS corpus runs **locally via Ollama** with EmbeddingGemma 2 — no API key, no cost.

| Variable | Required | What it does |
| --- | --- | --- |
| `LUCA_MODEL` | **Yes** | The conversation agent — must handle images (reads your W-2s). There is no in-code default: the app refuses to start without it. |
| `JUDGE_MODEL` | **Yes** | The grounding judges that double-check AI decisions. Also required at startup. |
| `ANTHROPIC_API_KEY` | With Anthropic models | Powers the two roles above when they point at Anthropic. |
| `LUCA_MODEL_URL` / `JUDGE_MODEL_URL` | For local models | Point a role at an OpenAI-compatible server instead, e.g. `LUCA_MODEL=ollama/gemma4:26b` + `LUCA_MODEL_URL=http://localhost:11434/v1`. |
| `EMBEDDINGS_MODEL` | No (defaults to `ollama/embeddinggemma-2`) | The local embedding model for semantic corpus search. Needs [Ollama](https://ollama.com) running with the model pulled; without it, search falls back to keyword matching. |
| `AGENT_API_TOKEN` | No | Gates the agent port if it's ever reachable beyond localhost. |

Local-model notes: vision, tool calling, and structured output all matter —
I've verified the full flow (document reading included) on `gemma4` via
Ollama. PDFs are rasterized to images automatically for models without
native PDF input. Expect turns to take minutes, not seconds, on laptop
hardware, and each model call must currently finish within 5 minutes.

You don't have to write this file from scratch: the first-run bootstrap
generates `apps/agent/.env.development` with the two model roles pre-filled
to Anthropic models (`anthropic/claude-sonnet-4-6` / `anthropic/claude-haiku-4-5`)
and working values for ports and `.data` paths. **The one thing it cannot
fill in is your `ANTHROPIC_API_KEY`** — set that yourself (or repoint the
model roles at a local server) before the app will do anything useful.

```bash
npm run install:all
npm run dev:all          # first run generates .env.development files
# → set ANTHROPIC_API_KEY in apps/agent/.env.development, restart
npm run corpus -- fetch  # prebuilt IRS reference corpus

# Optional but recommended — needs Ollama installed (https://ollama.com):
ollama pull embeddinggemma-2          # local embedding model for RAG
```

The last step enables semantic (RAG) search over the IRS corpus and
requires [Ollama](https://ollama.com) (`brew install ollama`, or the
installer from their site). It's optional: without it the agent still
works, and reference search falls back to keyword matching — see
[Semantic search](docs/contributing.md#semantic-search-rag-vs-keyword-fallback).

To check your setup at any point, run the doctor. It prints machine
info, resolved config, data-file state, and whether Ollama / LM Studio
are installed, running, and serving the models Summa expects:

```bash
npm run doctor
```

Open http://localhost:3000 — first run redirects to `/setup` to create your
owner account.

## Documentation

| Page | For |
| --- | --- |
| [Contributing and developer guide](docs/contributing.md) | Who can contribute, and how the agent, corpus, scenarios, and form engine work |
| [Test Summa against your filed return](docs/testing-with-your-return.md) | Check the engine against a return you already filed, privately, and send us the result |

## License

AGPL-3.0 — see [`LICENSE`](LICENSE).
