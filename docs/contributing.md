# Contributing and developer guide

[← Back to the README](../README.md)

## Who can contribute

OpenReturn computes taxes, so I limit code contributions to people I have
verified are real. To become an approved contributor, contact the
maintainer: file an issue in this repo that says who you are and why
you want to contribute.

There is a second way to help, also by approval: **check OpenReturn against a
return you already filed** and send the maintainer the report. See
[Test OpenReturn against your filed return](testing-with-your-return.md).

## Developer guide

Congratulations on wanting to be a developer! The point of this project is that it should be collaborative. 

To get it running first, follow the [Quickstart](quickstart.md). Each folder's README explains that part: [Cade](../cade/README.md), [Canon](../canon/README.md), [the form engine](../engine/README.md), [the builder](../engine/builder/README.md), [sources](../sources/README.md) and [the web app](../web/README.md).

If you want to get setup locally to be able to add capabilities to this system there are a few things you need to know. I would really like the patterns that have been established to stay the same unless there is a significantly improved pattern that a core contributor wants to recommend. 

### Understanding The Agent

The current agent Cade is built off of the [Mastra](https://mastra.ai/docs) framework. If you want to watch the agent run, checkout the [mastra studio](http://localhost:4111) locally. We don't currently use all the features of the framework but there are two core concepts that we utilize:

* Agent Setup: Mastra allows us to have a really simple agent setup that uses either your local provided model or a cloud model. We have environment configurations for you to setup either of them. 
* Workflows: We have developed several workflows that help us reduce context and verify that what Cade is saying is actually based in facts. See the `cade/src/mastra/workflows` (and Canon's `canon/src/mastra/workflows`) to learn more about workflows

### Generating The Corpus

The agent and the workflows use a corpus of IRS and FTB documents, form instructions and publications, to ground their information in truth and to generate the original bindings of the form engine. The corpus, its ingest pipeline and search live in Canon (`canon/`, see its [README](../canon/README.md)). Here is how that corpus is turned into our data model that the agents can then search. We store information in both vector format and in plain text format for two reasons. First, so there is a backup option if you aren't running a local embedding model, and second because if you add plain text search queries it makes the model's retrieval capabilities better for corpus search. 

1. *Read* Each document has a committed sidecar (e.g. `sources/2025/forms/federal/1040/instructions.meta.json` or `sources/2025/publications/federal/p587/publication.meta.json`) that names its source file by URL and sha256: a PDF, or for most FTB instructions a cleaned web page. Sync gets the file (from corpus.db, or downloads it). unpdf turns a PDF into text; a web page is read from its own headings and paragraphs (`refdocs/html/`)
2. *Parse (parse.ts)* turns those text documents into sections based on headers deterministically (No AI) with stable section IDs. A web page needs no heading detection: its `h2`–`h4` are the sections. 
3. *Contextualize (contextualize.ts)* receives each block and sends that to an LLM (haiku) that then adds contextual information as part of the block.
4. *Store* Then we store everything in the DB, as ref_documents (parent), ref_pages, ref_sections, and ref_blocks, plus the source file itself (ref_document_files; ref_documents.format says whether it is a PDF or a web page). The source files are not in git; corpus.db is the library
5. *Embeddings* Next we convert each block's summary + text into RAG-capable embeddings with the local embedding model (EmbeddingGemma 2 via Ollama — see below). We store those vectors in each block's embedding column. 

### Semantic search (RAG) vs keyword fallback

Reference-corpus search runs two legs: a keyword leg (SQLite FTS5) and a semantic vector leg. **The vector leg requires a local embedding model served by Ollama** — there is no cloud embedding dependency (the earlier Voyage pipeline was removed). As a developer, to get full-quality RAG retrieval you need:

```bash
# one-time setup
ollama pull embeddinggemma-2          # 1.3 GB; needs Ollama ≥ 0.40
```

The prebuilt corpus (corpus-v8, via `npm run corpus -- fetch`) holds every document in `sources`, with their source files, and ships EmbeddingGemma 2 vectors, so no re-embedding is needed. When you add documents, `npm run corpus -- status` lists the ones missing from your corpus and `npm run corpus -- sync` ingests them (about $0.50 of Haiku contextualization for a typical set of form instructions, more for a long publication). If you switch embedding models, run `npm run corpus -- reembed --all` (~4 min, free) — the corpus records which model built its vectors, and search refuses to mix vector spaces until you do.

**If Ollama isn't running, nothing breaks** — searches log a warning and fall back to keyword (FTS) matching, which is a real but lower-recall mode: exact-term queries work well, paraphrased/semantic queries suffer. Fine for end users trying the app; not fine for judging retrieval quality or developing anything RAG-adjacent. Use `npm run corpus -- search "your query" --mode vector` (vs `--mode fts`) to see each leg's behavior, and `npm run corpus -- check` to confirm every block has an embedding.

The embedding model is configurable via `EMBEDDINGS_MODEL` / `EMBEDDINGS_MODEL_URL` (default `ollama/embeddinggemma-2` at `http://localhost:11434`). After changing models, always run `npm run corpus -- reembed --all` — vectors from different models are not comparable, and the corpus records which model built it (`ref_meta.embedding_model`) to enforce that.

### Scenarios — how we know the engine is right

A scenario is one taxpayer: their documents as facts, their choices as
decisions, and the expected value of every line on their return. They
live in `engine/tests/scenarios/<name>/` (`facts.ts`, `decisions.ts`,
`expected.ts`, `index.ts`). `npm test` runs all of them before every commit.

**Every new field or document we support needs a scenario that uses it.**
The steps, with a diagram of the tests that check each one, are in
[Add a scenario](adding-a-scenario.md).

An expected value is only as good as its source. We use two sources, and
never a tax-software export we cannot redistribute:

1. **A CPA-prepared return (alex, alejandro, marcus).** The CPA's filed
   values are the expected values.
2. **A fake scenario verified against a contributor's filed return
   (jordan).** A contributor runs the engine on their own return privately (see
   [Test OpenReturn against your filed return](testing-with-your-return.md)).
   When it matches, we run the engine on a *fake* scenario with the same
   shape and lock its output as the expected values:

   ```bash
   cd engine
   npx tsx scripts/lockScenario.ts --scenario=jordan
   npx tsx scripts/renderScenario.ts --scenario=jordan --golden
   ```

   The second command writes the golden PDFs (`docs/*-Golden.pdf`), which
   the tests diff widget by widget. Commit them with `expected.ts`. From
   then on, any change to a locked line fails the tests until it is
   verified again and re-locked. No real data enters the repo.

### Understanding The Form Engine

The form engine is what makes this project special, because it is the tool that the AI uses to understand what information it needs to gather to generate real tax documents. The form engine is really just an obtuse DAG (my wording) that resolves after several "runs" instead of trying to do the DAG computation every time. 

Each form field relies on either

1. A simple fact directly

example: 

``` 
/// state/ca/540/bindings.ts
"signing.taxpayer_email": (_, info) => info.taxpayerEmail,
```

2. An AI decision

```
      "header.filing_status_single": (_, info) => info.filingStatus === "single",
```

3. Some math

```
"line.14": (f) => sum(f["line.12e"], f["line.13a"], f["line.13b"]),
```

4. Dependent on a calculation in another form or table

```
"line.25c": (f) => {
  const m = f["form-8959.0.line.24_total_additional_medicare_tax_withholding"];
  return typeof m === "number" ? m : undefined;
},
```

Or some combination of all the above. If a line has not yet been developed it is explicitly marked in the form as *Unsupported*. 

Because there is a dependency tree involved, and I am not confident that the IRS docs system is a non-repeating DAG, we start by calculating the values we can in the form and then repeat that process. See *evaluateAllForms* for the code.
