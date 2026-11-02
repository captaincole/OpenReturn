export const meta = {
  name: "pr-review",
  description:
    "General PR review: quality, open-source hygiene, security, simplicity; a skeptic drops what is wrong, out of scope, or not worth it; one docs agent brings the documentation in line with the change",
  whenToUse:
    "On demand. args: {pr: <number>} for a GitHub PR, or {base, head} for a local diff (defaults origin/main..HEAD)",
  phases: [
    { title: "Find", detail: "one finder per dimension", model: "opus" },
    {
      title: "Challenge",
      detail: "one skeptic per dimension: true, in scope, worth it?",
      model: "opus",
    },
    {
      title: "Docs",
      detail: "one agent: check the docs against the change and update them in the working tree",
      model: "opus",
    },
  ],
};

const A = typeof args === "object" && args ? args : { pr: args };
const TARGET = A.pr
  ? `PR #${A.pr}. Get its commits with \`gh pr view ${A.pr} --json title,body,headRefOid,baseRefOid\` (run \`git fetch origin pull/${A.pr}/head\` if the head is not local). The PR title and body state its goal.`
  : `the local range ${A.base || "origin/main"}..${A.head || "HEAD"}. The commit messages (\`git log ${A.base || "origin/main"}..${A.head || "HEAD"}\`) state its goal.`;

const MAX_FINDINGS = 4;

const RULES = `Rules:
- Read the diff with rename detection (\`git diff -M <base> <head>\`). A file moved with no content change is not a finding. Read code at the head commit with \`git show <head>:<path>\`.
- Never check out, stash, commit, push, comment on GitHub, or edit files.
- Report only what this change adds or changes, or a problem the change makes worse.
- Report at most ${MAX_FINDINGS} findings, most important first. An empty list is a good result.
- Never quote secrets, personal data, or real taxpayer figures in your output; name the file and line and the kind of data instead.`;

const DIMENSIONS = [
  {
    key: "quality",
    prompt: `Review for general code quality: correctness bugs, edge cases, error handling, type safety, missing or weak tests for new behavior, dead code, misleading names or comments, and drift from the surrounding code's idioms (this repo prefers a functional style).`,
  },
  {
    key: "open-source",
    prompt: `Review for open-source hygiene. This repo is public. Look in the diff, the commit messages, and the PR body for:
- machine-local data: absolute paths (/Users/, /home/, /private/tmp, /var/folders, C:\\Users), usernames, hostnames, LAN IPs, local ports tied to one machine;
- personal data: names, emails, phone numbers, addresses, SSNs, real tax figures, or any hint that a real tax return shaped the code (CLAUDE.md forbids this);
- secrets: API keys, tokens, passwords, .env content, private URLs;
- session or tool links (for example Claude-Session trailers or claude.ai session URLs) in commits or the PR body;
- third-party content copied in without a compatible license, and generated files that embed any of the above.`,
  },
  {
    key: "security",
    prompt: `Review for security: injection (SQL, shell, path traversal in file or blob paths), authentication and session handling, missing authorization or missing userId/filingId scoping on queries and routes (this repo requires every query to scope explicitly), SSRF or open proxying, secrets in logs or responses, unsafe parsing of uploads, new or changed dependencies, and CI changes (for example pull_request_target or secrets exposed to forks).`,
  },
  {
    key: "simplicity",
    prompt: `Review for simplicity and organization. Ask: is there a simpler way to reach this change's goal? Would a small refactor make the goal easier to reach, and easier to understand and review? Look for needless layers, duplicated logic that wants one abstraction, repeated identical patches (a sign of a missing structure), files or modules in the wrong place, and names that hide intent. Each finding must state the simpler alternative concretely and why a reviewer would find it easier.`,
  },
];

const FINDINGS_SCHEMA = {
  type: "object",
  properties: {
    headSha: { type: "string" },
    baseSha: { type: "string" },
    goal: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          file: { type: "string" },
          line: { type: "integer" },
          summary: { type: "string" },
          evidence: { type: "string" },
          suggestion: { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["file", "line", "summary", "evidence", "suggestion", "severity"],
      },
    },
  },
  required: ["headSha", "baseSha", "goal", "findings"],
};

const VERDICTS_SCHEMA = {
  type: "object",
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          verdict: { type: "string", enum: ["keep", "refuted", "out_of_scope", "not_worth_it"] },
          reason: { type: "string" },
        },
        required: ["index", "verdict", "reason"],
      },
    },
  },
  required: ["verdicts"],
};

const challengePrompt = (
  findings,
  d,
  found,
) => `You are a skeptic reviewing the ${d.key} findings on ${TARGET}
Head commit: ${found.headSha}. Base commit: ${found.baseSha}. Goal of the change: ${found.goal}
Findings (judge each one on its own; give one verdict per index):
${findings.map((f, i) => `[${i}] ${JSON.stringify(f, null, 2)}`).join("\n")}

For each finding, check the code yourself, then answer three questions:
1. Is it true? Read the code at the head commit. If the finding is wrong or already handled, the verdict is "refuted".
2. Is it in scope? If the same problem exists at the base commit and this change does not touch or worsen it, or it does not serve the change's goal, the verdict is "out_of_scope".
3. Is it worth it and necessary? If the fix costs more than it returns, is a style nit, is speculative ("might someday"), or adds complexity for little gain, the verdict is "not_worth_it".
Choose "keep" only if it passes all three. If you are unsure, do not keep it. If two findings describe the same problem, keep at most one and refute the other as a duplicate. Give your evidence in "reason".
Exception: a real leak of secrets or personal data is always worth fixing; never mark it "not_worth_it".

Never check out, edit, or comment on GitHub.`;

const DOCS_SCHEMA = {
  type: "object",
  properties: {
    headMatches: { type: "boolean" },
    edited: {
      type: "array",
      items: {
        type: "object",
        properties: { file: { type: "string" }, summary: { type: "string" } },
        required: ["file", "summary"],
      },
    },
    proposed: {
      type: "array",
      items: {
        type: "object",
        properties: {
          file: { type: "string" },
          line: { type: "integer" },
          summary: { type: "string" },
          suggestedText: { type: "string" },
        },
        required: ["file", "line", "summary", "suggestedText"],
      },
    },
  },
  required: ["headMatches", "edited", "proposed"],
};

const DOCS_PROMPT = `You keep the documentation consistent with ${TARGET}

1. Read the diff with rename detection (\`git diff -M <base> <head>\`) and the commit messages. List what changed that a reader of the docs would need to know: paths, file names, commands, scripts, flags, env vars, routes, data layout, behavior.
2. Find every Markdown doc that describes those things: CLAUDE.md files, README.md files, docs/**/*.md, and package or app READMEs. Grep for the old names and paths, and read the sections that cover the changed areas.
3. Fix what the change made wrong or left out: stale paths, commands and names; descriptions of behavior that changed; a new feature with no mention where its neighbors are documented. Keep each doc's existing style and length; the user wants docs short and concise. Do not rewrite text the change did not affect, and do not add new sections unless the doc has no place for the fact.
4. Scope: Markdown docs only. Code comments belong to the code review. Do not edit sources/ data, scenario fixture docs (engine/tests/scenarios/**/docs), generated files, or .scratch/.

Editing: run \`git rev-parse HEAD\` and \`git status --porcelain\`. Edit files in the working tree only if HEAD is the head commit of the change AND the file you edit has no uncommitted changes; set headMatches accordingly. Otherwise make no edits and return each fix under "proposed" with the exact replacement text. Never commit, push, stash, check out, or comment on GitHub. Never write absolute machine paths, secrets, or personal data into a doc.

Return headMatches, the files you edited with a one-line summary each, and any proposed edits you did not apply.`;

// One docs agent, independent of the review: start it now, collect it at the end.
const docsRun = agent(DOCS_PROMPT, {
  label: "docs",
  phase: "Docs",
  schema: DOCS_SCHEMA,
  model: "opus",
});

const results = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(
      `You review ${TARGET}\n\n${d.prompt}\n\n${RULES}\n\nReturn the head and base SHAs, a one-sentence goal of the change, and your findings.`,
      {
        label: `find:${d.key}`,
        phase: "Find",
        schema: FINDINGS_SCHEMA,
        model: "opus",
      },
    ),
  (found, d) => {
    const all = found ? found.findings : [];
    if (all.length > MAX_FINDINGS)
      log(
        `${d.key}: ${all.length - MAX_FINDINGS} findings over the cap of ${MAX_FINDINGS} were not challenged`,
      );
    const findings = all.slice(0, MAX_FINDINGS);
    if (!findings.length) return { d: d.key, found, judged: [] };
    return agent(challengePrompt(findings, d, found), {
      label: `challenge:${d.key}`,
      phase: "Challenge",
      schema: VERDICTS_SCHEMA,
      model: "opus",
    }).then((v) => ({
      d: d.key,
      found,
      judged: findings.map((f, i) => ({
        ...f,
        dimension: d.key,
        verdict: v ? v.verdicts.find((x) => x.index === i) : undefined,
      })),
    }));
  },
);

const done = results.filter(Boolean);
const all = done.flatMap((r) => r.judged);
const by = (v) => all.filter((f) => f.verdict && f.verdict.verdict === v);
const failed = DIMENSIONS.map((d) => d.key).filter((k) => !done.some((r) => r.d === k && r.found));
if (failed.length) log(`finders that returned nothing: ${failed.join(", ")}`);
const head = done.find((r) => r.found);
const docs = await docsRun;
if (!docs) log("docs agent returned nothing");
return {
  target: A.pr ? `PR #${A.pr}` : `${A.base || "origin/main"}..${A.head || "HEAD"}`,
  headSha: head ? head.found.headSha : null,
  goal: head ? head.found.goal : null,
  keep: by("keep").map((f) => ({
    dimension: f.dimension,
    severity: f.severity,
    file: f.file,
    line: f.line,
    summary: f.summary,
    suggestion: f.suggestion,
    why: f.verdict.reason,
  })),
  outOfScope: by("out_of_scope").map((f) => `${f.dimension} ${f.file}:${f.line} — ${f.summary}`),
  notWorthIt: by("not_worth_it").map((f) => `${f.dimension} ${f.file}:${f.line} — ${f.summary}`),
  refuted: by("refuted").length,
  unjudged: all
    .filter((f) => !f.verdict)
    .map((f) => `${f.dimension} ${f.severity} ${f.file}:${f.line} — ${f.summary}`),
  failedFinders: failed,
  docs: docs
    ? { headMatches: docs.headMatches, edited: docs.edited, proposed: docs.proposed }
    : null,
};
