export const meta = {
  name: "solve-forms-batch",
  description:
    "Write, test and review the rules of each form in a batch: rules with a scenario, blind fill, reconcile with other projects, tax review, fixes",
  whenToUse:
    "On demand, to write the rules of several forms that the engine catalogs and that have no rules yet. Make one worktree per form first (branch from main, npm install). args: {corpusDbPath: <absolute path of the main checkout canon/.data/corpus.db>, forms: [{id, branch, root (the worktree, absolute), title, folder, sources, docs, scenario, scenario2}]}. Each agent commits on its branch and never pushes; a person or the lead merges the branches one at a time.",
  phases: [
    {
      title: "Rules",
      detail: "one agent per form: evidence, fact kinds, rules, tests, synthetic scenario",
    },
    {
      title: "Blind",
      detail: "a second agent fills the form by hand from the blank form and instructions only",
    },
    {
      title: "Reconcile",
      detail: "compare engine and blind fill, cross-check other projects, fix",
    },
    { title: "Review", detail: "find rule errors against the IRS or FTB text" },
    { title: "Fix", detail: "challenge each finding, fix what stands, final gates" },
  ],
};

/*
 * No agent here names a model. Each one runs on the session's model, or on the
 * model in CLAUDE_CODE_SUBAGENT_MODEL when you set it.
 */

if (!args || !Array.isArray(args.forms) || !args.corpusDbPath) {
  throw new Error("args.forms (a list) and args.corpusDbPath are required");
}
const CORPUS = "CORPUS_DB_PATH=" + args.corpusDbPath + " npm run corpus --";
const FORMS = args.forms;

const ground = (f) =>
  [
    "Work only in this git worktree: " + f.root,
    "Run every command from it (or its engine/ folder). Never cd to another checkout. Write files only inside it; scratch files go under its .scratch/ folder (gitignored).",
    "If a permission is denied, stop and report it; never work around it. Never push. Never git stash. Do not start subagents. Do not run npm run coverage or npm run form-graph.",
    "The official text is read-only through: " +
      CORPUS +
      ' outline <docId> | read <docId> <section> | read <blockId> | search "<words>" --doc-id <docId> --limit 10. Never run sync, fetch or reembed. If a read fails with a database lock, run it again.',
  ].join("\n");

const commitRule =
  'Commit your work on the current branch with a plain message that says what changed and why, ending with the line "Co-Authored-By: Claude <noreply@anthropic.com>" and nothing else after it (no session link). The commit hook runs the test suites and is slow: allow 10 minutes. Never push.';

const RULES_SCHEMA = {
  type: "object",
  properties: {
    done: { type: "boolean" },
    summary: { type: "string" },
    fieldsBound: { type: "integer" },
    fieldsUnsupported: { type: "integer" },
    unsupportedWhy: { type: "string" },
    factKinds: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          what: { type: "string" },
          source: { type: "string" },
        },
        required: ["key", "what", "source"],
      },
    },
    inputDocumentsNeeded: { type: "array", items: { type: "string" } },
    newInputDocuments: { type: "array", items: { type: "string" } },
    centralFormLinesChanged: { type: "array", items: { type: "string" } },
    otherFormsChanged: { type: "array", items: { type: "string" } },
    changesForm1040Bindings: { type: "boolean" },
    existingGoldensChanged: { type: "array", items: { type: "string" } },
    publishedExamples: { type: "array", items: { type: "string" } },
    scenarioName: { type: "string" },
    doubts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          sourceText: { type: "string" },
          defaultApplied: { type: "string" },
          changesDollars: { type: "boolean" },
        },
        required: ["topic", "sourceText", "defaultApplied", "changesDollars"],
      },
    },
    gates: { type: "string" },
    blocked: { type: "string" },
  },
  required: [
    "done",
    "summary",
    "fieldsBound",
    "fieldsUnsupported",
    "factKinds",
    "changesForm1040Bindings",
    "existingGoldensChanged",
    "doubts",
    "gates",
  ],
};

const BLIND_SCHEMA = {
  type: "object",
  properties: {
    casesFilled: { type: "integer" },
    readForbiddenFile: { type: "boolean" },
    doubts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          sourceText: { type: "string" },
          choice: { type: "string" },
        },
        required: ["topic", "sourceText", "choice"],
      },
    },
  },
  required: ["casesFilled", "readForbiddenFile", "doubts"],
};

const RECONCILE_SCHEMA = {
  type: "object",
  properties: {
    dollarDifferences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          caseAndLine: { type: "string" },
          engine: { type: "string" },
          blind: { type: "string" },
          whoIsRight: { type: "string" },
          action: { type: "string" },
        },
        required: ["caseAndLine", "engine", "blind", "whoIsRight", "action"],
      },
    },
    blankOrZeroOnly: { type: "integer" },
    otherProjects: { type: "string" },
    fixes: { type: "array", items: { type: "string" } },
    gates: { type: "string" },
  },
  required: ["dollarDifferences", "blankOrZeroOnly", "otherProjects", "fixes", "gates"],
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
    uncovered: { type: "array", items: { type: "string" } },
  },
  required: ["findings", "uncovered"],
};

const FIX_SCHEMA = {
  type: "object",
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          summary: { type: "string" },
          verdict: {
            type: "string",
            enum: ["refuted", "out_of_scope", "stands_fixed", "stands_needs_person"],
          },
          reason: { type: "string" },
        },
        required: ["summary", "verdict", "reason"],
      },
    },
    gates: { type: "string" },
    allGatesPass: { type: "boolean" },
    headCommit: { type: "string" },
    changesForm1040Bindings: { type: "boolean" },
    existingGoldensChanged: { type: "array", items: { type: "string" } },
    pdfsToReview: { type: "array", items: { type: "string" } },
    learningNotes: { type: "string" },
  },
  required: [
    "verdicts",
    "gates",
    "allGatesPass",
    "headCommit",
    "changesForm1040Bindings",
    "existingGoldensChanged",
    "pdfsToReview",
    "learningNotes",
  ],
};

const rulesPrompt = (f) =>
  [
    "You write the rules for one tax form in a deterministic TypeScript form engine (monorepo OpenReturn), tax year 2025. There is NO answer key for this form: correctness comes from the official instructions and their published examples.",
    ground(f),
    "",
    "THE FORM: " +
      f.title +
      ". Engine form folder: " +
      f.folder +
      " (catalog.json lists every field; bindings.ts has no rules yet; the form is listed in the formsWithNoRules.ts of its jurisdiction, with a resolver that reads only its must-file decision). Blank PDF and the instructions sidecar: " +
      f.sources +
      ". Likely corpus documents: " +
      f.docs +
      " (find others with search).",
    "",
    "GOAL: a full rule for EVERY field of the form. No stubs. A field is unsupported(reason) only when (a) the instructions themselves do not settle the rule, or (b) it needs another form or input the engine truly cannot have yet; in case (b) first try to add the input as a fact kind. Report each unsupported field group and why.",
    "",
    'READ FIRST: CLAUDE.md sections on the FormField model, "What a binding returns" and whole-dollar rounding; engine/README.md; the skills .claude/skills/write-binding-rules/SKILL.md, engine-scripts/SKILL.md, verify-form/SKILL.md, add-scenario/SKILL.md (patterns only: you do the work yourself). Good models already in the repo, each with a rule for every field: engine/src/federal/8880/ and engine/src/federal/3903/ (lines.ts with pure arithmetic and named constants, bindings.ts, resolveInfo.ts, filingInfo.ts), the fact kind engine/src/facts/kinds/armedForcesMove.ts, the tests engine/tests/unit/federal/8880/, and the synthetic scenarios engine/tests/scenarios/synthetic/wren/ and corwin/. For a California form see engine/src/state/ca/3506/ and engine/tests/scenarios/synthetic/ottilie/.',
    "",
    "STEPS",
    "1. Evidence. Read the blank form (Read tool shows PDFs) and all of its instructions. Search the corpus for every published example with numbers for this form (instructions, Pubs). You may search the web (irs.gov prior-year publications, ftb.ca.gov) for a filled example; a prior-year example is valid only for logic that does not depend on yearly amounts. Write .scratch/evidence.md: each example with source, inputs and results.",
    "2. Inputs. Decide what facts the form needs. Reuse existing fact kinds (engine/src/facts/kinds/, engine/src/facts/index.ts). Add a new fact kind for each missing input, following the conventions there. If a fact comes from an input document the product does not read yet (a 1099 or 1098 box, a new statement), create the fact kind AND make that document for your scenario as a fake PDF from a committed generator, following .claude/skills/create-input-documents/SKILL.md and the existing generators it names (do the work yourself; teaching Cade to read it is out of scope). List each document you made in newInputDocuments; a person reviews the first document of each type.",
    "3. Must-file. Keep the explicit decision key working; add fact-based rules where the instructions say who must file. The form must list every answer it reads in missingInputs (engine/tests/integration/requiredInputs.test.ts enforces it; an answer that is optional by design needs an entry in that test with a reason).",
    "4. Rules. Pure arithmetic in a lines.ts with named constants (2025 amounts, rates) and the corpus block id in a comment for each rule. Money math only through engine/src/money.ts (lint bans Math.round, ceil, floor, toFixed). No inline regex. No vague helper names. Lint caps: 400 lines per file, 50 lines per function. A binding returns a value, undefined (blank), or unsupported(reason); never undefined for an engine gap. Move the form out of formsWithNoRules.ts as the 6781 work did.",
    "5. Lines of other forms that receive this form's results (Schedule 1, 2, 3, A, B, D, Form 540, Schedule CA and so on): bind them. With none of this form's facts present, every existing value must stay exactly the same. Form 1040 (engine/src/federal/1040/) and Form 540 (engine/src/state/ca/540/) keep bindings.ts as an index: one entry per field that names an imported function, and the function lives in the section file of the paper form (income.ts, taxAndCredits.ts, payments.ts, credits.ts and so on). A new or changed line there is a function in its section file plus one entry in the index; never put logic in that bindings.ts. Change those two forms only when no schedule already carries the amount, make the smallest change, and report changesForm1040Bindings true when any file under either folder changes. Never change the expected values or goldens of an existing scenario that has an answer key (tcb-*, alex, alejandro, marcus); if one would change, stop and report it in \"blocked\".",
    '6. Tests in engine/tests/unit/<jurisdiction path>/<form>/: each published example with numbers becomes a unit test named by its source; limit tests that need no source (a credit is never more than its limit, a total equals its parts, each threshold edge, phase-out ends); must-file tests; "no facts, nothing changes" tests.',
    "7. One synthetic scenario in engine/tests/scenarios/synthetic/" +
      f.scenario +
      "/ (the folder name is fixed: use exactly this name; invent the surname). The scenario MUST show a nonzero value on every line of Form 1040, Form 540 or a schedule that your branch newly binds or changes; if one taxpayer cannot show them all (two branches exclude each other), add a second scenario named exactly " +
      f.scenario2 +
      " for the other branch. Details: (read that folder's README.md; verification \"unverified\"; federal-only in a state with no income tax for a federal form, a California full-year resident for a California form). Design it so the most lines of the form are nonzero. Invent every name and amount; no real person's data. Draft expected values (scripts/draftExpected.ts; if the drafted import path of tests/types.js is wrong for the synthetic folder, fix it by hand), hand-check every line of this form and each line that receives its results through the tax, then lock goldens with scripts/renderScenario.ts --scenario=<name> --golden. That command may rewrite other scenarios' PDF bytes: afterwards git checkout -- every PDF outside your scenario folder. Open the rendered PDF of this form with the Read tool and check each value sits in the right box. Write the scenario README (short sentences; who, what it covers, synthetic and unverified, the hand-check table).",
    '8. For the blind check that runs after you: write .scratch/blind/cases.md with 12 to 15 input-only cases in plain words (no answers, no hints about the code) that cover the form\'s branches and edges, and say exactly which lines to fill; write .scratch/blind/engine.json with the engine\'s value for those lines per case (an array of {"case": n, "<line key>": number|null}; null = blank), produced by a script .scratch/blind/run.ts that calls your pure functions; and write .scratch/blind/format.md that tells the blind agent the exact JSON keys to use, without revealing any value.',
    "9. Write the doubts file next to the form's code, QUESTIONS.md in " +
      f.folder +
      ": each place where the form and the instructions do not settle a rule, with the exact source text, the block id, the default applied, and whether it changes a dollar amount. Short sentences. Also a short table: each field group and its confidence (published example with numbers / stated rule / own reading / unsupported).",
    "10. Gates from the worktree root, all must pass: npm run typecheck, npm run lint, npm test, npm run test:unit, npm run test:integration. Prettier only on the exact .ts files you created or changed. No absolute paths in any committed file. Never edit a catalog.json.",
    "11. " + commitRule,
    "",
    'Do not touch cade/, web/ or the docs reports. Return the structured report. In "gates" give the pass or fail line of each gate. If you cannot finish, set done false and say why in "blocked".',
  ].join("\n");

const blindPrompt = (f) =>
  [
    "You are a careful tax preparer. Fill one tax form by hand for a list of cases, from the blank form and the official instructions only. This is an independent check of software, so you must NOT read the software.",
    ground(f),
    "",
    "THE FORM: " +
      f.title +
      ". Blank PDF folder: " +
      f.sources +
      " (the Read tool shows PDFs). Likely corpus documents: " +
      f.docs +
      ".",
    "STRICT: do NOT open or search anything under engine/ (no source, tests or scenarios, and no QUESTIONS.md), and do NOT open .scratch/blind/engine.json, .scratch/blind/run.ts or .scratch/evidence.md. Do not use git log, git show or git diff. You MAY read .scratch/blind/cases.md and .scratch/blind/format.md, blank form PDFs under sources/, and the official text through the corpus command.",
    'TASK: for each case in .scratch/blind/cases.md fill the lines it asks for. Whole dollars by the IRS rounding rule (say where you round). Write .scratch/blind/blind.json in the exact shape .scratch/blind/format.md gives (null for a line left blank, 0 for an entered zero). Write .scratch/blind/blind.md: one short paragraph of working per case, then a "Doubts" section: every place where the form and the instructions did not settle what to do, with the exact text and block id, and your choice.',
    "Return the structured report. Set readForbiddenFile true if you opened any forbidden file.",
  ].join("\n");

const reconcilePrompt = (f) =>
  [
    "You reconcile two independent results for one tax form in the OpenReturn form engine, then check the rules against other open-source implementations.",
    ground(f),
    "",
    "THE FORM: " +
      f.title +
      ". Code: " +
      f.folder +
      ". An implementer wrote the rules and committed them. A blind preparer then filled the same cases by hand from the blank form and instructions only.",
    "1. Compare .scratch/blind/engine.json with .scratch/blind/blind.json line by line with a small script. Sort each difference: (a) blank against 0 only, (b) a dollar difference. The blind preparer's doubts are in .scratch/blind/blind.md.",
    "2. For each dollar difference, read the instructions text in the corpus and decide who is right, with the block id and exact text. If the engine is wrong, fix the rule and add a unit test for the case. If the blind fill is wrong, say why. If the text does not settle it, keep the engine default and add the question to " +
      f.folder +
      "/QUESTIONS.md.",
    '3. Other projects as a second opinion (they are not a source of truth; the IRS or FTB text decides). Follow .claude/skills/cross-check-policyengine/SKILL.md to compare this form\'s constants and formula logic with PolicyEngine-US if it models the form; if a checkout or network access is not available, or the form is not modeled, say so and move on. If the repo names another reference implementation you can reach (for example IRS Direct File tax logic), compare the same way. For each disagreement on a constant or a formula, read the official text and fix the engine only when the text supports the other project. Record what you compared in QUESTIONS.md under "Second opinions".',
    "4. Add each blind doubt that changes a dollar amount to QUESTIONS.md if it is not there.",
    "5. If you changed code: gates from the worktree root (npm run typecheck, npm run lint, npm test, npm run test:unit, npm run test:integration), prettier only on the files you changed, then commit. " +
      commitRule,
    "Never edit a catalog.json, another scenario's expected values, or cade/ and web/. Return the structured report.",
  ].join("\n");

const reviewPrompt = (f) =>
  [
    "You review new tax form rules for correctness against the official instructions. Read-only: change no file.",
    ground(f),
    "",
    "THE FORM: " +
      f.title +
      ". The change under review is the branch diff: git diff -M origin/main...HEAD -- engine (the rules in " +
      f.folder +
      ", new fact kinds, the lines of other forms that receive its results, tests and one synthetic scenario).",
    "Check each rule against the instructions in the corpus (" +
      f.docs +
      " and any other document a rule cites): constants and 2025 amounts, thresholds and phase-outs, which line feeds which, signs, rounding, limits, filing-status differences, who must file, and what happens to other forms' lines. Check also that a line of another form does not silently lose an amount it had before. Check that the synthetic scenario shows a nonzero value on every Form 1040, Form 540 or schedule line that the branch newly binds or changes (read its expected.ts); a changed line that no scenario shows is a medium finding.",
    'A finding needs: the file, what the engine does, what the instructions say, the block id, a word-for-word quote from that block (verify it with the read command), a concrete failing input with the wrong and the right value, and a severity (high: a wrong tax amount on a common return; medium: a wrong amount on a plausible return; low: small or rare). Do not ground a finding in memory: no quote, no finding. A case only an unusual input produces goes in "uncovered", not in findings. Do not report style.',
    "Return the structured report.",
  ].join("\n");

const fixPrompt = (f, findings) =>
  [
    "You are the skeptic and the fixer for a tax correctness review of one form in the OpenReturn form engine.",
    ground(f),
    "",
    "THE FORM: " + f.title + ". Code: " + f.folder + ". Findings from the reviewer (JSON):",
    JSON.stringify(findings),
    "",
    "For each finding: fetch the quoted block and check the quote word for word; trace the code; decide refuted, out_of_scope (only an unusual input reaches it), stands_fixed, or stands_needs_person. Fix a finding that stands when the instructions are clear: change the rule, add a unit test with the failing input, keep every existing value the same when this form's facts are absent. If the fix would change an existing scenario with an answer key, or the text does not settle the rule, do not fix: verdict stands_needs_person, and add it to " +
      f.folder +
      "/QUESTIONS.md.",
    "Then, findings or not: run every gate from the worktree root (npm run typecheck, npm run lint, npm test, npm run test:unit, npm run test:integration) and report each result; allGatesPass is true only if all five pass now. Check git status is clean except ignored files; commit any change. " +
      commitRule,
    'Report: headCommit (git rev-parse --short HEAD); changesForm1040Bindings (true if git diff --name-only origin/main...HEAD lists a file under engine/src/federal/1040/ or engine/src/state/ca/540/); existingGoldensChanged (PDF paths changed outside engine/tests/scenarios/synthetic/, from git diff --name-only --diff-filter=AMD origin/main...HEAD -- "*.pdf"); pdfsToReview (the new golden PDFs, this form\'s first); learningNotes: 6 to 10 short plain sentences that teach a non-expert owner what this form is for, who files it, how the main lines work, the 2025 amounts, and the one or two open questions that matter.',
  ].join("\n");

const step = (phase, label, schema) => ({ phase, label, schema });

const results = await pipeline(
  FORMS,
  (f) => agent(rulesPrompt(f), step("Rules", "rules:" + f.id, RULES_SCHEMA)),
  async (rules, f) => {
    if (!rules || !rules.done)
      return {
        rules,
        stopped: "rules not done: " + (rules ? rules.blocked || rules.summary : "agent failed"),
      };
    const blind = await agent(blindPrompt(f), step("Blind", "blind:" + f.id, BLIND_SCHEMA));
    return { rules, blind };
  },
  async (prev, f) => {
    if (prev.stopped) return prev;
    const reconcile = await agent(
      reconcilePrompt(f),
      step("Reconcile", "reconcile:" + f.id, RECONCILE_SCHEMA),
    );
    return { ...prev, reconcile };
  },
  async (prev, f) => {
    if (prev.stopped) return prev;
    const review = await agent(reviewPrompt(f), step("Review", "review:" + f.id, FINDINGS_SCHEMA));
    return { ...prev, review };
  },
  async (prev, f) => {
    if (prev.stopped) return prev;
    const findings = prev.review ? prev.review.findings : [];
    const fix = await agent(fixPrompt(f, findings), step("Fix", "fix:" + f.id, FIX_SCHEMA));
    return { ...prev, fix };
  },
);

return FORMS.map((f, i) => ({ form: f.id, branch: f.branch, result: results[i] }));
