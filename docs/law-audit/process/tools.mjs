/*
 * Tools of the law audit. Run from the repository root (a worktree):
 *   node docs/law-audit/process/tools.mjs record <form>-record   checks every quote of a form's record word for word
 *   node docs/law-audit/process/tools.mjs findings               writes docs/law-audit/findings.md
 *   node docs/law-audit/process/tools.mjs tracking               writes docs/law-audit/tracking.md
 * The working files (claims, records, matches, verdicts) are in .scratch/law-audit, which git does not hold.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const here = ".scratch/law-audit";
const envLines = readFileSync("canon/.env", "utf8").split("\n");
const envValue = (key) =>
  envLines.find((line) => line.startsWith(`${key}=`))?.slice(key.length + 1);
const libraries = [
  envValue("CORPUS_DB_PATH"),
  join(envValue("LAW_DB_DIR"), "federal.db"),
  join(envValue("LAW_DB_DIR"), "ca.db"),
].filter((path) => path && existsSync(path));

const readJson = (form, name) => JSON.parse(readFileSync(join(here, form, name), "utf8"));
const writeJson = (form, name, value) =>
  writeFileSync(join(here, form, name), JSON.stringify(value, null, 2) + "\n");

const sqlQuote = (text) => `'${text.split("'").join("''")}'`;
const blockTextIn = (library, blockId) => {
  const out = execFileSync(
    "sqlite3",
    [
      "-readonly",
      "-json",
      library,
      `select text from ref_blocks where block_id = ${sqlQuote(blockId)};`,
    ],
    { encoding: "utf8" },
  );
  return out.trim() ? JSON.parse(out)[0].text : undefined;
};
const blockText = (blockId) =>
  libraries.map((library) => blockTextIn(library, blockId)).find((text) => text !== undefined);

// Whitespace and typographic quotes differ between a terminal copy and the stored text; nothing else may.
const plain = (text) =>
  text
    .split("’")
    .join("'")
    .split("‘")
    .join("'")
    .split("“")
    .join('"')
    .split("”")
    .join('"')
    .split(/\s+/)
    .join(" ")
    .trim();

const checkSource = (source) => {
  const text = blockText(source.blockId);
  if (text === undefined) return "no such block";
  return plain(text).includes(plain(source.quote)) ? "ok" : "quote not in block";
};

// The tracking document: every form folder of the engine with its audit state, and the law sections read so far.
const formRoots = [
  ["Federal", "engine/src/federal"],
  ["California", "engine/src/state/ca"],
];
const lineCount = (path) => readFileSync(path, "utf8").split("\n").length;
const engineForms = () =>
  formRoots.flatMap(([jurisdiction, root]) =>
    readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, "bindings.ts")))
      .map((entry) => ({
        jurisdiction,
        form: entry.name,
        hasRules: lineCount(join(root, entry.name, "bindings.ts")) > 15,
      })),
  );
const has = (folder, name) => existsSync(join(here, folder, name));
const stateOf = (form, results) => {
  if (results[form]) return "done";
  if (has(`${form}-match`, "findings.json")) return "matched, not verified";
  if (has(form, "claims.json") || has(`${form}-record`, "requirements.json")) return "in work";
  return "not started";
};
const lawSection = (blockId) => {
  const [doc, , section] = blockId.split("::");
  const name = (section ?? "").slice(1);
  if (doc.startsWith("usc-26")) return `IRC ${name}`;
  if (doc.startsWith("cfr-26")) return `Reg. ${name}`;
  if (doc.startsWith("ca-rtc")) return `CA ${name}`;
  return undefined;
};
const sectionsRead = () => {
  const pairs = readdirSync(here)
    .filter((folder) => folder.endsWith("-record") && has(folder, "requirements.json"))
    .flatMap((folder) =>
      readJson(folder, "requirements.json").flatMap((item) =>
        (item.law ?? []).map((source) => [
          lawSection(source.blockId),
          folder.slice(0, -"-record".length),
        ]),
      ),
    )
    .filter(([section]) => section);
  return pairs.reduce(
    (byLaw, [section, form]) => ({
      ...byLaw,
      [section]: [...new Set([...(byLaw[section] ?? []), form])],
    }),
    {},
  );
};
const byNumber = (left, right) => left.localeCompare(right, "en", { numeric: true });
const tracking = () => {
  const results = resultsByForm();
  const forms = engineForms();
  const rows = forms.map(({ jurisdiction, form, hasRules }) => {
    const result = results[form];
    const state = hasRules ? stateOf(form, results) : "out of scope: no rules yet";
    const counts = result ? [1, 2, 3, 4].map((cls) => result.findings[cls] ?? 0).join(" / ") : "";
    return `| ${form} | ${jurisdiction} | ${state} | ${result?.date ?? ""} | ${counts} | ${result?.note ?? ""} |`;
  });
  const count = (state) => rows.filter((row) => row.includes(`| ${state}`)).length;
  const sections = sectionsRead();
  const sectionRows = Object.keys(sections)
    .sort(byNumber)
    .map((section) => `| ${section} | ${sections[section].sort(byNumber).join(", ")} |`);
  const text = [
    "# Law audit: tracking",
    "",
    "This file is written by the audit's script. Do not edit it by hand. The findings are in [findings.md](findings.md).",
    "",
    `Forms with rules: ${forms.filter((form) => form.hasRules).length}. Done: ${count("done")}. In work: ${count("in work") + count("matched, not verified")}. Not started: ${count("not started")}. Out of scope (no rules yet): ${forms.filter((form) => !form.hasRules).length}.`,
    "",
    "## Forms",
    "",
    "Findings are counted by class: 1 wrong or incomplete rule / 2 texts disagree / 3 unclear or not checkable / 4 loophole.",
    "",
    "| Form folder | Jurisdiction | State | Date | Findings 1 / 2 / 3 / 4 | Note |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "## Law sections read",
    "",
    "A section is in this list when a form's record quotes it. A section that is not in the list was not read for any form yet.",
    "",
    "| Section | Forms whose record quotes it |",
    "| --- | --- |",
    ...sectionRows,
    "",
  ].join("\n");
  writeFileSync("docs/law-audit/tracking.md", text);
  console.log(`tracking.md: ${rows.length} forms, ${sectionRows.length} law sections`);
};

// A form is done when every candidate finding of its match has a verdict of the lead.
const verdicts = () => JSON.parse(readFileSync(join(here, "verdicts.json"), "utf8"));
const matchedForms = () =>
  readdirSync(here)
    .filter((folder) => folder.endsWith("-match") && has(folder, "findings.json"))
    .map((folder) => folder.slice(0, -"-match".length));
const judged = (form) => {
  const all = verdicts();
  const findings = readJson(`${form}-match`, "findings.json");
  if (!findings.every((finding) => all[finding.id])) return undefined;
  return findings.map((finding) => ({
    ...finding,
    verdict: all[finding.id],
    class: all[finding.id].class ?? finding.class,
  }));
};
const AUDIT_DATE = "2026-11-27";
const resultsByForm = () =>
  Object.fromEntries(
    matchedForms()
      .map((form) => [form, judged(form)])
      .filter(([, findings]) => findings)
      .map(([form, findings]) => {
        const kept = findings.filter((finding) => finding.verdict.keep);
        const counts = kept.reduce(
          (totals, finding) => ({ ...totals, [finding.class]: (totals[finding.class] ?? 0) + 1 }),
          {},
        );
        return [form, { date: AUDIT_DATE, findings: counts, note: "" }];
      }),
  );
const formName = (form) => {
  const california =
    engineForms().find((entry) => entry.form === form)?.jurisdiction === "California";
  const upper = (text) => text.toUpperCase();
  if (form.startsWith("schedule-"))
    return `Schedule ${upper(form.slice("schedule-".length))}${california ? " (California)" : ""}`;
  return california ? `FTB ${upper(form)}` : `Form ${upper(form)}`;
};
const CLASS_NAMES = {
  1: "Class 1: the texts agree and the engine does something else or less",
  2: "Class 2: two texts disagree and the engine follows one",
  3: "Class 3: a text is unclear, in error, or not in the library",
  4: "Class 4: a possible loophole",
};
const findingText = (finding) =>
  [
    `**${finding.id}** (${finding.confidence} confidence). ${finding.title}.`,
    "",
    ...finding.texts.map((text) => `- Text, \`${text.blockId}\`: "${plain(text.quote)}"`),
    `- Engine: ${finding.engine}`,
    `- Effect: ${finding.effect}`,
    `- Who meets this: ${finding.reach}`,
    `- Code: \`${finding.codeRef}\``,
    ...(finding.verdict.note ? [`- Note from the check: ${finding.verdict.note}`] : []),
    "",
  ].join("\n");
const exampleCount = (form) =>
  has(`${form}-match`, "examples.json") ? readJson(`${form}-match`, "examples.json").length : 0;
const findingsDocument = () => {
  const forms = matchedForms()
    .sort(byNumber)
    .map((form) => ({ form, findings: judged(form) }))
    .filter((entry) => entry.findings);
  const kept = (entry, cls) =>
    entry.findings.filter((finding) => finding.verdict.keep && finding.class === cls);
  const total = (cls) => forms.reduce((count, entry) => count + kept(entry, cls).length, 0);
  const summary = forms.map(
    (entry) =>
      `| ${formName(entry.form)} | ${[1, 2, 3, 4].map((cls) => kept(entry, cls).length).join(" | ")} | ${exampleCount(entry.form)} |`,
  );
  const sections = forms.flatMap((entry) => [
    `## ${formName(entry.form)}`,
    "",
    ...[1, 2, 3, 4].flatMap((cls) =>
      kept(entry, cls).length === 0
        ? []
        : [`### ${CLASS_NAMES[cls]}`, "", ...kept(entry, cls).map(findingText)],
    ),
  ]);
  const rejected = forms.flatMap((entry) =>
    entry.findings
      .filter((finding) => !finding.verdict.keep)
      .map(
        (finding) =>
          `- **${finding.id}**, ${formName(entry.form)}: ${finding.title}. Rejected: ${finding.verdict.why}`,
      ),
  );
  const text = [
    readFileSync(join(here, "findings-intro.md"), "utf8").trimEnd(),
    "",
    "## Count by form",
    "",
    "| Form | Class 1 | Class 2 | Class 3 | Class 4 | Worked examples in the instructions |",
    "| --- | --- | --- | --- | --- | --- |",
    ...summary,
    `| **All** | ${[1, 2, 3, 4].map((cls) => `**${total(cls)}**`).join(" | ")} | |`,
    "",
    ...sections,
    "## Candidates the check rejected",
    "",
    ...(rejected.length ? rejected : ["None."]),
    "",
  ].join("\n");
  writeFileSync("docs/law-audit/findings.md", text);
  console.log(
    `findings.md: ${forms.length} forms, ${[1, 2, 3, 4].map((cls) => total(cls)).join(" / ")} findings`,
  );
};

const commands = {
  tracking,
  findings: findingsDocument,
  blind: (form) => {
    const questions = readJson(form, "claims.json").map(
      ({ id, fields, question, sectionHints, instructionBlockIds }) => ({
        id,
        fields,
        question,
        sectionHints,
        instructionBlockIds,
      }),
    );
    writeJson(form, "questions.json", questions);
    console.log(`${form}: ${questions.length} questions written`);
  },
  quotes: (form) => {
    const results = readJson(form, "law.json").flatMap((card) =>
      (card.sources ?? []).map((source) => ({
        claimId: card.claimId,
        blockId: source.blockId,
        check: checkSource(source),
      })),
    );
    const bad = results.filter((result) => result.check !== "ok");
    writeJson(form, "quote-check.json", { total: results.length, failed: bad.length, bad });
    console.log(`${form}: ${results.length} quotes, ${bad.length} failed`);
    bad.forEach((result) => console.log(`  ${result.claimId}  ${result.blockId}  ${result.check}`));
  },
  // The two-pass shape: every quote of requirements.json, in its sources and in its law.
  record: (form) => {
    const results = readJson(form, "requirements.json").flatMap((item) =>
      [...(item.sources ?? []), ...(item.law ?? [])].map((source) => ({
        id: item.id,
        blockId: source.blockId,
        check: checkSource(source),
      })),
    );
    const bad = results.filter((result) => result.check !== "ok");
    writeJson(form, "record-quote-check.json", { total: results.length, failed: bad.length, bad });
    console.log(`${form}: ${results.length} quotes, ${bad.length} failed`);
    bad.forEach((result) => console.log(`  ${result.id}  ${result.blockId}  ${result.check}`));
  },
  stats: (form) => {
    const count = (items, key) =>
      items.reduce(
        (totals, item) => ({
          ...totals,
          [item[key]]: (totals[item[key]] ?? 0) + (item.fieldIds?.length ?? 1),
        }),
        {},
      );
    console.log(form, "fields by kind:", count(readJson(form, "fields.json"), "kind"));
    console.log(form, "claims:", readJson(form, "claims.json").length);
    if (existsSync(join(here, form, "compare.json")))
      console.log(form, "compare:", count(readJson(form, "compare.json"), "result"));
  },
};

const [command, form] = process.argv.slice(2);
commands[command](form);
