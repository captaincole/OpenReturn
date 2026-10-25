<h1 align="center">OpenReturn</h1>

<p align="center">
  <strong>Open-source AI Agent tax preparation. Cited facts in, a deterministic return out.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License: AGPL-3.0"></a>
  <img src="https://img.shields.io/badge/status-beta-orange" alt="Status: beta">
  <img src="https://img.shields.io/badge/tax%20year-2025-7c3aed" alt="Tax year 2025">
  <img src="https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white" alt="Node 20 or later">
  <a href="https://mastra.ai"><img src="https://img.shields.io/badge/built%20with-Mastra-111111" alt="Built with Mastra"></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/web-Next.js%2016-000000?logo=nextdotjs" alt="Next.js 16"></a>
</p>

<p align="center">
  <a href="cade/README.md">Cade</a> ·
  <a href="canon/README.md">Canon</a> ·
  <a href="engine/README.md">Form engine</a> ·
  <a href="sources/README.md">Sources</a> ·
  <a href="web/README.md">Web app</a> ·
  <a href="docs/quickstart.md">Quickstart</a>
</p>

<p align="center">
  <img src="static/how-it-works.svg" alt="How OpenReturn works: the Web App sends your words and documents to Cade. Cade sends tax facts and decisions to the Form Engine, and asks Canon to check each decision against the IRS and FTB reference library. Canon sends back verdicts and citations. The Form Engine sends the draft return and open questions back to the Web App." width="720">
</p>

OpenReturn prepares your US federal and California return, or an estimate, on your own machine. Twin agents do the work: **Cade**, your CPA, interviews you and reads your documents. **Canon**, your tax attorney, checks each of Cade's decisions against the IRS and FTB text. A deterministic form engine computes every line. No AI touches the math.

## Why? - Let's Break The System...

Taxes shouldn't be as hard as they are today. An entire industry profits from keeping the U.S. tax system difficult and opaque, but it doesn't have to be that way and this project is an attempt to change that system.

You shouldn't have to pay a private company to help you figure out how much money you have to pay to the government!

This project was going to be a startup, but life changed directions. Now I want this to be a collaborative project that has the greatest impact it can.

## Features

- **A conversation, not a form.** Cade asks one question at a time. It reads W-2s, 1099s and photos of them directly.
- **Every fact has a citation.** Each value records where it came from: a document, a statement line, or "you told me, on this date".
- **Never an invented number.** An unknown becomes an open question, not a guess.
- **Decisions are checked.** In the background, Canon grounds each judgment call in the IRS and FTB instructions. It cites the passage or reopens the question.
- **Ask The Tax Code.** Ask a tax question and get a short answer with numbered citations into a library of 168 IRS and FTB documents.
- **A live draft return.** Each new fact runs the engine again. The 1040, the CA 540 and their schedules update as you talk.
- **Your data stays local.** All data is SQLite files and a documents folder on your machine. No Docker, no Postgres, no hosted services.
- **Any model.** Use Anthropic, or any OpenAI-compatible server such as Ollama. The smallest model we recommend is **Gemma 4 31B**; it runs the full flow locally, document reading included. See [Evals](#evals).

## Before you use this — read honestly

- **Your tax data goes to your model.** Every conversation turn and every background check sends your tax facts to the model you configured. A local model or your own private infrastructure keeps the data with you; a cloud API (Anthropic, OpenAI) does not.
- **This is not tax advice.** OpenReturn is in beta and produces *drafts*. Have a CPA check the work.
- **Coverage is narrow** — see [what OpenReturn supports](docs/testing-with-your-return.md#what-openreturn-supports). Outside it, Cade says "we don't handle that yet" rather than guess.

## Quickstart

You need Node.js 20 or later, and an Anthropic API key or [Ollama](https://ollama.com) with Gemma 4 31B.

```bash
git clone https://github.com/captaincole/OpenReturn.git
cd OpenReturn
npm run install:all
npm run dev:all            # writes the .env.development files; stop it with Ctrl-C
# set ANTHROPIC_API_KEY (or a local model) in cade/ and canon/.env.development
npm run corpus -- fetch    # the IRS + FTB library
npm run dev:all            # then open http://localhost:3000
```

The [Quickstart guide](docs/quickstart.md) has the local-model settings and what to explore first.

## How it works

1. You talk to **Cade** in the web app and upload your documents.
2. Cade records **tax facts** (what you said or what a document shows, with a citation) and **decisions** (judgment calls, with a rationale).
3. The **form engine** computes the return from the facts and decisions. The inputs it still needs become Cade's next questions.
4. **Canon** checks each decision against the IRS and FTB reference library, and answers your tax-code questions with citations.

## The project

Each top-level folder builds and runs on its own, and each has its own README.

| Folder | What it is | Read more |
| --- | --- | --- |
| [`web/`](web/) | The web app: chat, documents, forms, Ask The Tax Code, the reference library. Next.js 16. | [web/README.md](web/README.md) |
| [`cade/`](cade/) | **Cade, your AI CPA.** The conversational agent: intake, document reading, facts, decisions, form generation. Mastra, port 4111. | [cade/README.md](cade/README.md) |
| [`canon/`](canon/) | **Canon, your tax attorney.** The IRS and FTB reference library, hybrid search, Ask The Tax Code, and the judges that ground Cade's decisions. Mastra and an MCP server, port 4112. | [canon/README.md](canon/README.md) |
| [`engine/`](engine/) | The form engine: facts and decisions in, evaluated and filled tax forms out. Pure TypeScript, no AI, no I/O. | [engine/README.md](engine/README.md) |
| [`engine/builder/`](engine/builder/) | Dev-time tools that build the engine's assets from blank IRS and FTB PDFs. | [engine/builder/README.md](engine/builder/README.md) |
| [`sources/`](sources/) | The documents the IRS and FTB publish, by tax year: blank forms, tax tables and the sidecars for the reference library. | [sources/README.md](sources/README.md) |
| [`docs/`](docs/) | Guides for users and contributors, and the model eval reports. | [Documentation](#documentation) |

## What it looks like

<p align="center">
  <img src="static/screenshots/return-2025.png" alt="The 2025 return workspace: Cade's chat on the left, with a summary of the drafted return and links to the forms; on the right, the Activity feed of recorded facts and decisions, Requested actions, and the generated Tax forms" width="880">
  <br/><strong>A return.</strong> Chat with Cade on the left; the facts, decisions and forms it drafts on the right.
</p>

| | |
| --- | --- |
| <img src="static/screenshots/home.png" alt="The home page: a tax code search box, the 2025 return card and the 2026 estimated taxes card" width="430"><br/>**Home.** Your returns, estimates and the tax-code search. | <img src="static/screenshots/ask-tax-code.png" alt="Ask Canon: the question 'What is the maximum HSA contribution for self-only coverage in 2025?' with a cited answer and three reference cards that quote Publication 969 and the Form 8889 instructions" width="430"><br/>**Ask The Tax Code.** Short answers with numbered citations into the IRS and FTB text. |

## Evals

Every flow that uses a model has an eval: document ingest (Cade), decision review and Ask The Tax Code (Canon). Each model gets one score per flow. Scores from 2026-10-23; the [eval reports](docs/evals/README.md) have the details.

| Model | Overall | Ingest | Review | Ask |
| --- | --- | --- | --- | --- |
| Claude Haiku 5.5 | **94%** | 100% | 100% | 81% |
| Gemma 4 31B (Q4_K_M) | **85%** | 91% | 96% | 69% |
| Gemma 4 26B (Q4_K_M) | **81%** | 90% | 81% | 72% |

**The smallest recommended model is Gemma 4 31B** (`ollama/gemma4:31b`). Smaller models lose accuracy in decision review.

## Documentation

| Guide | For |
| --- | --- |
| [Quickstart](docs/quickstart.md) | Run OpenReturn in a few minutes, on a cloud model or a local one |
| [Contributing and developer guide](docs/contributing.md) | Who can contribute, and how the agents, the corpus, the scenarios and the form engine work |
| [Test OpenReturn against your filed return](docs/testing-with-your-return.md) | Check the engine against a return you already filed, privately, and send us the result |
| [Add a scenario](docs/adding-a-scenario.md) | Add a new test taxpayer, with new forms or documents, and the tests that check each step |
| [End-to-end tests](web/e2e/README.md) | The Playwright run that drives the whole stack with a real model |
| [Model evals](docs/evals/README.md) | One score per model, by flow: document ingest ([full](docs/evals/ingest.md), [quick](docs/evals/ingest-quick.md)), [review judges](docs/evals/review.md) and [Ask The Tax Code](docs/evals/ask.md) |

## Contributing

OpenReturn computes taxes, so code contributions come from approved contributors. You can also help by checking OpenReturn against a return you already filed. See the [contributing guide](docs/contributing.md) for both.

## License

AGPL-3.0 — see [`LICENSE`](LICENSE).
