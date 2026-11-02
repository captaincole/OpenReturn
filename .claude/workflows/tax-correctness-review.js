export const meta = {
  name: "tax-correctness-review",
  description:
    "Review an engine PR for IRS and FTB correctness; a skeptic refutes or scopes out each finding",
  whenToUse:
    "On demand for a PR that changes engine/ or sources/. Needs Canon running (npm run dev:canon). args: {pr: <number>}",
  phases: [
    { title: "Scope", detail: "split the diff into review units, tag IRS / FTB", model: "fable" },
    {
      title: "Find",
      detail: "one finder per unit and authority, grounded in Canon's reference library",
      model: "fable",
    },
    {
      title: "Challenge",
      detail: "one skeptic for the top findings: refuted / out_of_scope / stands",
      model: "fable",
    },
  ],
};

const PR = typeof args === "object" && args ? args.pr : args;
if (!PR) throw new Error("args.pr (the PR number) is required");
const TAX_YEAR = (args && args.taxYear) || 2025;
const MAX_FINDERS = (args && args.maxFinders) || 8;
const MAX_FINDINGS = (args && args.maxFindings) || 8;

const AUTHORITY = {
  irs: {
    name: "IRS",
    docs: `IRS documents (docIds such as irs-1040-inst-${TAX_YEAR} and irs-pub-590a-${TAX_YEAR})`,
    note: "Schedules 1, 2 and 3 have no own instructions; the Form 1040 instructions (irs-1040-inst) cover them.",
  },
  ftb: {
    name: "California FTB",
    docs: `FTB documents (docIds such as ca-540-inst-${TAX_YEAR} and ftb-pub-1001-${TAX_YEAR})`,
    note: "FTB instructions often cite FTB publications that are not in the library. Report those as ungroundable, not as findings.",
  },
};

const RULES = `Rules:
- The instructions come from Canon's reference library over MCP: mcp__canon__searchRefDocs finds blocks (pass docId to stay inside one document), and mcp__canon__citeRefDoc returns a block's exact text. If the Canon tools are missing or fail, stop and say so; do not ground a finding in memory.
- Read the PR code at its head commit with \`git show <headSha>:<path>\`. Never check out, stash, commit, or edit files.
- Use only synthetic example inputs. Never use or mention real taxpayer data.
- Whole-dollar rounding to the nearest dollar is the engine's documented convention (CLAUDE.md); do not report it as an error.`;

const SCOPE_SCHEMA = {
  type: "object",
  properties: {
    headSha: { type: "string" },
    baseSha: { type: "string" },
    units: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          files: { type: "array", items: { type: "string" } },
          authorities: { type: "array", items: { type: "string", enum: ["irs", "ftb"] } },
          whatChanged: { type: "string" },
        },
        required: ["id", "title", "files", "authorities", "whatChanged"],
      },
    },
    skipped: {
      type: "array",
      items: {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
        required: ["files", "reason"],
      },
    },
  },
  required: ["headSha", "baseSha", "units", "skipped"],
};

const FINDINGS_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          file: { type: "string" },
          line: { type: "integer" },
          summary: { type: "string" },
          engineBehavior: { type: "string" },
          instructionsSay: { type: "string" },
          blockId: { type: "string" },
          quote: { type: "string" },
          failureScenario: { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: [
          "file",
          "line",
          "summary",
          "engineBehavior",
          "instructionsSay",
          "blockId",
          "quote",
          "failureScenario",
          "severity",
        ],
      },
    },
    ungroundable: {
      type: "array",
      items: {
        type: "object",
        properties: { topic: { type: "string" }, missingSource: { type: "string" } },
        required: ["topic", "missingSource"],
      },
    },
  },
  required: ["findings", "ungroundable"],
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
          verdict: { type: "string", enum: ["refuted", "out_of_scope", "stands"] },
          reason: { type: "string" },
          quoteVerified: { type: "boolean" },
          lineChangedInPr: { type: "boolean" },
        },
        required: ["index", "verdict", "reason", "quoteVerified", "lineChangedInPr"],
      },
    },
  },
  required: ["verdicts"],
};

phase("Scope");
const scope = await agent(
  `You scope PR #${PR} for a tax-correctness review of the form engine.

1. Get the commits: \`gh pr view ${PR} --json headRefOid,baseRefOid\`. Run \`git fetch origin pull/${PR}/head\` if the head commit is not local.
2. Read the diff with rename detection: \`git diff -M <base> <head> -- engine sources\`.
3. Group the changes into review units. A unit is one coherent change to tax logic: a form's lines or bindings, a worksheet, a tax table or rate data, money math, fact derivations, or a scenario's expected values.
4. Tag each unit with the authorities whose rules it must follow: "irs" for engine/src/federal/** and federal data; "ftb" for engine/src/state/ca/** and CA data; both for shared code (worksheets, money, facts, scenario goldens that span both returns).
5. Put in "skipped" (with a reason) every changed file that cannot change a tax result: pure renames or moves with no content change, import-path edits, docs, test harness plumbing, comments, formatting. Be strict: if a content change could alter a computed value, it is a unit.

Return the head and base SHAs, the units, and the skipped files.`,
  { label: "scope", phase: "Scope", schema: SCOPE_SCHEMA, model: "fable" },
);

const jobs = scope.units.flatMap((u) => u.authorities.map((a) => ({ unit: u, authority: a })));
const run = jobs.slice(0, MAX_FINDERS);
const capped = jobs.slice(MAX_FINDERS);
log(
  `${scope.units.length} units, ${jobs.length} finder jobs, ${scope.skipped.length} skipped groups`,
);
if (capped.length)
  log(
    `cap ${MAX_FINDERS}: not reviewed — ${capped.map((j) => `${j.unit.id}/${j.authority}`).join(", ")}`,
  );

const findPrompt = ({ unit, authority }) => {
  const a = AUTHORITY[authority];
  return `You check one change in PR #${PR} against ${a.name} rules for tax year ${TAX_YEAR}.

Head commit: ${scope.headSha}. Base commit: ${scope.baseSha}.
Unit "${unit.title}": ${unit.whatChanged}
Files: ${unit.files.join(", ")}

Ground every finding in the ${a.name} instructions in Canon's library: ${a.docs}. ${a.note}
Read the changed code at the head commit and the diff for these files. Then check that what the engine computes matches what the instructions say: line formulas, thresholds, limits, phase-outs, rounding steps, which line feeds which, and when a form or line applies.

Report a finding only when:
- you can quote the instructions verbatim (copy the exact text that citeRefDoc returns for blockId), and
- you can give a concrete failure scenario: synthetic inputs → the engine's value vs the value the instructions require.
Report problems in the changed code, plus problems the change exposes. If a rule depends on a source that is not in the library, list it under "ungroundable" instead.
An empty findings list is a good result when the change is correct.

${RULES}`;
};

const challengePrompt = (
  findings,
) => `You are a skeptic. Try to REFUTE each IRS / FTB finding on PR #${PR}, or show it is out of scope.

Head commit: ${scope.headSha}. Base commit: ${scope.baseSha}.
Findings (several finders worked separately, so findings may overlap; give one verdict per index):
${findings.map((f, i) => `[${i}] ${JSON.stringify(f, null, 2)}`).join("\n")}

For each finding, check in order:
1. Does the quote appear verbatim in its block? Fetch it with mcp__canon__citeRefDoc. Set quoteVerified.
2. Does the quoted rule actually govern this line and tax year, read in context (exceptions, definitions, other lines that override it)?
3. Does the engine code at the head commit really behave as the finding says? Trace the failure scenario through the code.
4. Did this PR change or expose the behavior? Compare with the base commit (\`git show ${scope.baseSha}:<path>\`; paths may have moved — use \`git diff -M\`). Set lineChangedInPr.

Verdict:
- "refuted" if the quote is missing or wrong, the rule does not apply, or the engine is correct.
- "out_of_scope" if the problem is real but the same behavior exists at the base commit and this PR does not touch it.
- "stands" only if it survives every check.
If two findings describe the same problem (for example an IRS and an FTB finder hitting shared code), let the better-grounded one stand and refute the other as a duplicate of its index.
If you are unsure, choose "refuted". Give the evidence in "reason".

${RULES}`;

phase("Find");
const results = await parallel(
  run.map(
    (job) => () =>
      agent(findPrompt(job), {
        label: `find:${job.unit.id}/${job.authority}`,
        phase: "Find",
        schema: FINDINGS_SCHEMA,
        model: "fable",
      }).then((found) => found && { job, found }),
  ),
);

// Barrier on purpose: one skeptic sees every finding, so it can merge overlaps.
const done = results.filter(Boolean);
const RANK = { high: 0, medium: 1, low: 2 };
const found = done
  .flatMap((r) =>
    r.found.findings.map((f) => ({ ...f, authority: r.job.authority, unit: r.job.unit.id })),
  )
  .sort((a, b) => RANK[a.severity] - RANK[b.severity]);
const top = found.slice(0, MAX_FINDINGS);
const notChallenged = found.slice(MAX_FINDINGS);
if (notChallenged.length)
  log(`cap ${MAX_FINDINGS}: ${notChallenged.length} lower-severity findings not challenged`);

phase("Challenge");
const v = top.length
  ? await agent(challengePrompt(top), {
      label: "challenge",
      phase: "Challenge",
      schema: VERDICTS_SCHEMA,
      model: "fable",
    })
  : null;
const all = top.map((f, i) => ({
  ...f,
  verdict: v ? v.verdicts.find((x) => x.index === i) : undefined,
}));
const by = (v) => all.filter((f) => f.verdict && f.verdict.verdict === v);
return {
  pr: PR,
  headSha: scope.headSha,
  baseSha: scope.baseSha,
  survivors: by("stands"),
  outOfScope: by("out_of_scope").map((f) => ({
    authority: f.authority,
    file: f.file,
    line: f.line,
    summary: f.summary,
  })),
  refuted: by("refuted").length,
  unjudged: all
    .filter((f) => !f.verdict)
    .map((f) => `${f.authority} ${f.severity} ${f.file}:${f.line} — ${f.summary}`),
  notChallenged: notChallenged.map(
    (f) => `${f.authority} ${f.severity} ${f.file}:${f.line} — ${f.summary}`,
  ),
  ungroundable: done.flatMap((r) =>
    r.found.ungroundable.map((u) => ({ authority: r.job.authority, ...u })),
  ),
  units: scope.units.map((u) => ({ id: u.id, title: u.title, authorities: u.authorities })),
  notReviewed: capped.map((j) => `${j.unit.id}/${j.authority}`),
  failedFinders: run.length - done.length,
  skipped: scope.skipped,
};
