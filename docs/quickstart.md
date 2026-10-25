# Quickstart

[← Back to the README](../README.md)

You need Node.js 20 or later, and an Anthropic API key or [Ollama](https://ollama.com) with Gemma 4 31B.

## 1. Install

```bash
git clone https://github.com/captaincole/OpenReturn.git
cd OpenReturn
npm run install:all
npm run dev:all        # writes the .env.development files; stop it with Ctrl-C
```

## 2. Pick a model

**Anthropic:** set your key in `cade/.env.development` and `canon/.env.development`.

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Local:** run `ollama pull gemma4:31b`, then set:

```bash
# cade/.env.development
CADE_MODEL=ollama/gemma4:31b
CADE_MODEL_URL=http://localhost:11434/v1

# canon/.env.development
JUDGE_MODEL=ollama/gemma4:31b
JUDGE_MODEL_URL=http://localhost:11434/v1
```

## 3. Run

```bash
npm run corpus -- fetch    # the IRS + FTB library, about 350 MB
npm run dev:all
```

Open http://localhost:3000, create your account, and start a 2025 return.

## Explore

- **http://localhost:3000**: the app. Upload a W-2 and talk to Cade, or ask the tax code a question.
- **http://localhost:4111**: Cade in Mastra Studio. Every trace and tool call.
- **http://localhost:4112**: Canon in Mastra Studio. Its MCP tools and workflows.

## If something is wrong

- `npm run doctor` checks your machine, configuration and model servers.
- `ollama pull embeddinggemma-2` turns on semantic search. Without it, search uses keywords only.
- `npm run reset` deletes your data and keeps the library.

Each folder's README has its settings: [Cade](../cade/README.md), [Canon](../canon/README.md), [web](../web/README.md).
