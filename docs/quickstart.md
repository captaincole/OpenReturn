# Quickstart

[← Back to the README](../README.md)

This guide installs OpenReturn, configures its models and runs it on your machine. It takes about 10 minutes on a cloud model.

## 1. Before you start

| You need | Why |
| --- | --- |
| [Node.js](https://nodejs.org) 20 or later | Runs all three services |
| An [Anthropic API key](https://console.anthropic.com), **or** an OpenAI-compatible model server such as [Ollama](https://ollama.com) | Powers Cade and Canon's judges |
| [Ollama](https://ollama.com) (optional) | Semantic search over the tax library, with a local embedding model. Without it, search uses keywords only. |

There is nothing else to install: no Docker, no database server. All data is SQLite files on your machine.

## 2. Install

```bash
git clone https://github.com/captaincole/OpenReturn.git
cd OpenReturn
npm run install:all
```

`install:all` installs the npm workspaces (`canon`, `cade`, `engine`, `engine/builder`, `sources`) from the root lockfile, then the web app, which installs on its own.

## 3. First run

```bash
npm run dev:all
```

The first run writes one `.env.development` file for each service: `canon/`, `cade/` and `web/`. The files have working ports and data paths for your clone, and these default models:

| Role | Setting | Default | File |
| --- | --- | --- | --- |
| Cade, the conversation (must read images) | `CADE_MODEL` | `anthropic/claude-sonnet-4-6` | `cade/.env.development` |
| Canon's judges (grounding, Ask The Tax Code) | `JUDGE_MODEL` | `anthropic/claude-haiku-5-5` | `canon/.env.development` |

The services cannot work until a model is available. Stop them with Ctrl-C.

## 4. Set your API key

Set `ANTHROPIC_API_KEY` in **both** files:

```bash
# cade/.env.development and canon/.env.development
ANTHROPIC_API_KEY=sk-ant-...
```

To use a local model instead, see [Run on local models](#run-on-local-models).

## 5. Get the tax library

```bash
npm run corpus -- fetch
```

This downloads the prebuilt reference library (`corpus.db`, about 350 MB) from the GitHub release and checks its sha256. It holds the text, sections and embeddings of every IRS and FTB document in `sources/`. It goes to `canon/.data/corpus.db`.

For semantic search, install Ollama and pull the embedding model once:

```bash
ollama pull embeddinggemma-2
```

The library ships with vectors from this model, so nothing needs to be embedded again.

## 6. Run it

```bash
npm run dev:all
```

| Service | URL | What it is |
| --- | --- | --- |
| Web app | http://localhost:3000 | Where you work |
| Cade | http://localhost:4111 | Mastra Studio for Cade: traces, tools, threads |
| Canon | http://localhost:4112 | Mastra Studio for Canon; the MCP endpoint is `/api/mcp/canon/mcp` |

Open http://localhost:3000. The first visit goes to `/setup`: create the owner account (name, email, password). Then start a 2025 return from the home page and say hello to Cade.

## 7. Check your setup

```bash
npm run doctor
```

The doctor prints your machine, the resolved configuration, the state of each data file, and whether Ollama or LM Studio is installed, running and serving the models OpenReturn expects.

## Run on local models

Any OpenAI-compatible server works: Ollama, LM Studio, vLLM, llama.cpp. Set a role's model and the server's URL:

```bash
# cade/.env.development
CADE_MODEL=ollama/gemma4:26b
CADE_MODEL_URL=http://localhost:11434/v1

# canon/.env.development
JUDGE_MODEL=ollama/gemma4:26b
JUDGE_MODEL_URL=http://localhost:11434/v1
```

- **Cade's model must read images** (it reads your W-2s) and call tools. PDFs become page images for models that cannot read PDFs.
- **The judges need structured output.**
- **Expect minutes per turn on a laptop.** One call to Canon may take at most 5 minutes (`CANON_TIMEOUT_MS`).
- The full flow, document reading included, works on Gemma 4 through Ollama.

## Configuration reference

Each service reads its `.env.development` file. A gitignored `.env` next to it holds personal overrides. Each `.env.example` lists every setting.

| Setting | File | Default | What it does |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | cade, canon | — | Key for the Anthropic models |
| `CADE_MODEL` | cade | required | Cade's model, as `provider/model` |
| `CADE_MODEL_URL` | cade | — | An OpenAI-compatible server for Cade's model |
| `JUDGE_MODEL` | canon | required | The judges' model |
| `JUDGE_MODEL_URL` | canon | — | An OpenAI-compatible server for the judges |
| `EMBEDDINGS_MODEL` | canon | `ollama/embeddinggemma-2` | The local embedding model for semantic search |
| `CANON_URL` | cade | `http://127.0.0.1:4112` | Where Cade reaches Canon over MCP |
| `DECISION_REVIEW` | cade | `on` | `off` skips the background grounding of decisions |
| `AGENT_API_TOKEN` | cade, web | — | Gates Cade's port when it is reachable beyond localhost |
| `CANON_API_TOKEN` | canon, cade, web | — | Gates Canon's port the same way |
| `APP_DB_PATH`, `DOCUMENTS_PATH` | cade, web | `cade/.data/…` | Your data. The web app reads the same files as Cade. |
| `CORPUS_DB_PATH` | canon | `canon/.data/corpus.db` | The reference library |

## Where your data lives

| File | What it holds |
| --- | --- |
| `cade/.data/app.db` | Your account, filings, tax facts, decisions, Ask threads |
| `cade/.data/mastra.db` | Cade's conversation memory |
| `cade/.data/documents/` | The documents you upload, and the generated forms |
| `canon/.data/corpus.db` | The IRS and FTB reference library |

All of it is gitignored.

## Start over

- **Delete one filing:** the avatar menu, top right, then **Delete filing**.
- **Delete all your data:** stop the services, then run `npm run reset`. It keeps `corpus.db`. The next visit goes to `/setup` again.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| A service exits at startup and names `CADE_MODEL` or `JUDGE_MODEL` | Set the model in that service's `.env.development` |
| `npm run corpus -- status` shows missing documents | Run `npm run corpus -- fetch`, and check `CORPUS_DB_PATH` in `canon/.env.development` |
| The logs warn about a keyword-only search | Ollama is not running, or `embeddinggemma-2` is not pulled. Search still works, with lower recall. |
| Decisions stay `review_unreached` | Canon was not running. Start it; the next decision retries the others. |
| You moved the clone, or the paths look wrong | Delete the `.env.development` files. The next `npm run dev:all` writes new ones. |

## Next steps

- [Cade](../cade/README.md) and [Canon](../canon/README.md): how the two agents work.
- [Test OpenReturn against your filed return](testing-with-your-return.md): check the engine privately.
- [Contributing and developer guide](contributing.md).
