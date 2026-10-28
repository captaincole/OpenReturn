/*
 * Usage: npx tsx scripts/compareFiled/cli.ts <folder> [--init | --check | --show-values]
 *
 * PRIVACY: the report files and the default terminal output hold no amounts,
 * names, or payers, so an AI session can run it. Only --show-values prints
 * amounts, and only to the terminal.
 */

import { execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { loadFromFixtures } from "../../src/catalog.js";
import { evaluateScenario } from "../../src/index.js";
import { FORMS } from "../../src/registry.js";
import { catalogPath } from "../../tests/helpers/formPaths.js";
import { decisionsWithPreparerStyle } from "../../tests/helpers/preparer.js";
import type { Scenario } from "../../tests/types.js";
import { compareFiled, type CompareResult, type FiledReturn } from "./compare.js";
import { inputShape } from "./inputShape.js";
import {
  inputSection,
  renderReport,
  reportData,
  reportHead,
  SEND_INSTRUCTIONS,
  STATUS_TEXT,
  supportSection,
  type ReportInput,
} from "./report.js";
import { groupRootCauses } from "./rootCauses.js";
import { checkSupport } from "./support.js";
import { writeTemplates } from "./templates.js";

/* Upstreams first, so the first root is the first place to look. */
const CALC_ORDER = [
  "schedule-d",
  "schedule-b",
  "schedule-1",
  "form-8889",
  "form-8959",
  "form-8960",
  "schedule-2",
  "form-8995-a",
  "schedule-a",
  "form-1040",
  "schedule-d-ca",
  "schedule-ca",
  "form-540",
  "form-5805",
];

/*
 * Form 8949 rows do not line up: the engine writes one row per lot, and
 * a preparer may combine lots. Schedule D compares the totals instead.
 */
const SKIP = ["form-8949"];

function findScenario(mod: Record<string, unknown>): Scenario {
  const found = Object.values(mod).find(
    (v) => typeof v === "object" && v !== null && Array.isArray((v as Scenario).forms),
  );
  if (!found) throw new Error("index.ts exports no Scenario (an object with forms[]).");
  return found as Scenario;
}

function filedFrom(s: Scenario): FiledReturn {
  return Object.fromEntries(s.forms.map((f) => [f.formId, f.expected.engineFields]));
}

function centsLines(filed: FiledReturn): string[] {
  return Object.values(filed).flatMap((lines) =>
    Object.entries(lines)
      .filter(([, v]) => !Number.isInteger(v))
      .map(([id]) => id),
  );
}

function engineCommit(): string {
  const git = (cmd: string) => execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
  try {
    const dirty = git("status --porcelain -- .") !== "";
    return `${git("rev-parse --short HEAD")}${dirty ? " (uncommitted changes)" : ""}`;
  } catch {
    return "unknown";
  }
}

const money = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));

/* Terminal only. Amounts never go into the report file. */
function printValues(result: CompareResult): void {
  console.log("\nAmounts (terminal only — do not paste into a model or a report):");
  for (const d of result.diffs) {
    const status = STATUS_TEXT[d.status].padEnd(13);
    console.log(`  ${status} ${d.fieldId}  filed ${money(d.filed)}  engine ${money(d.engine)}`);
  }
}

async function buildReport(dir: string): Promise<{ s: Scenario; report: ReportInput }> {
  const s = findScenario(await import(resolve(dir, "index.ts")));
  const evaluated = evaluateScenario({
    filing: { id: "private-return", taxYear: s.taxYear },
    facts: s.facts,
    decisions: decisionsWithPreparerStyle(s),
  });
  const catalog = await loadFromFixtures(FORMS.map(catalogPath));
  const formOrder = [...CALC_ORDER, ...FORMS.map((f) => f.formId)].filter(
    (id, i, all) => all.indexOf(id) === i,
  );
  const filed = filedFrom(s);
  const result = compareFiled({ formOrder, forms: evaluated.forms, filed, catalog, skip: SKIP });
  const reads = new Map(
    [...evaluated.forms.values()].flatMap((f) => f.fields.map((x) => [x.fieldId, x.reads])),
  );
  const createdAt = new Date().toISOString().slice(0, 10);
  const report: ReportInput = {
    taxYear: s.taxYear,
    createdAt,
    engineCommit: engineCommit(),
    preparer: s.preparer,
    result,
    roots: groupRootCauses(result.diffs, (id) => reads.get(id)),
    shape: inputShape(s),
    centsLines: centsLines(filed),
    support: checkSupport(s, new Set(evaluated.forms.keys())),
  };
  return { s, report };
}

async function checkFolder(dir: string): Promise<number> {
  const { report } = await buildReport(dir);
  console.log([...supportSection(report), ...inputSection(report)].join("\n"));
  const unknown = report.support.filter((i) => i.kind.startsWith("unknown_")).length;
  return unknown + report.centsLines.length + report.result.unknownFields.length;
}

async function compareFolder(dir: string, showValues: boolean): Promise<number> {
  const { s, report } = await buildReport(dir);
  const { result, createdAt } = report;
  const base = resolve(dir, `openreturn-check-${s.taxYear}-${createdAt}`);
  writeFileSync(`${base}.md`, renderReport(report));
  writeFileSync(`${base}.json`, `${JSON.stringify(reportData(report), null, 2)}\n`);
  console.log(reportHead(report).join("\n"));
  if (showValues) printValues(result);
  console.log(`\nReport written to ${base}.md and ${base}.json`);
  console.log(SEND_INSTRUCTIONS);
  return result.diffs.length + result.unknownFields.length;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      init: { type: "boolean" },
      check: { type: "boolean" },
      "show-values": { type: "boolean" },
    },
  });
  if (positionals.length !== 1) {
    console.error("Usage: cli.ts <folder> [--init | --check | --show-values]");
    process.exit(1);
  }
  const dir = resolve(positionals[0]);
  /* Private data never lives inside the project, not even in .scratch/. */
  const project = resolve(process.cwd(), "../..");
  if (dir === project || dir.startsWith(`${project}${sep}`)) {
    console.error(`${dir} is inside this project. Keep the data folder outside it.`);
    process.exit(1);
  }
  if (values.init) return writeTemplates(dir);
  if (!existsSync(resolve(dir, "index.ts"))) {
    console.error(`No ${dir}/index.ts. Run with --init first.`);
    process.exit(1);
  }
  const problems = values.check
    ? await checkFolder(dir)
    : await compareFolder(dir, values["show-values"] === true);
  process.exit(problems === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
