/* PRIVACY: the report never holds a dollar amount, a name, or a fact key. */

import type { Preparer } from "../../tests/types.js";
import type { CompareResult, LineDiff, LineStatus } from "./compare.js";
import type { InputShape } from "./inputShape.js";
import type { RootCause } from "./rootCauses.js";
import type { SupportIssue } from "./support.js";

export const REPORT_SCHEMA = "openreturn-check/1";

/* Placeholder until the first checker run settles the channel. */
export const SEND_INSTRUCTIONS =
  "Send the report (the .md and .json files) privately to the maintainer.";

export interface ReportInput {
  taxYear: number;
  createdAt: string;
  engineCommit: string;
  preparer?: Preparer;
  result: CompareResult;
  roots: RootCause[];
  shape: InputShape;
  centsLines: string[];
  support: SupportIssue[];
}

export const STATUS_TEXT: Record<LineStatus, string> = {
  not_modeled: "not modeled",
  blocked: "blocked",
  engine_only: "return leaves blank",
  drift_1: "off by ≤ $1",
  drift_10: "off by $2–10",
  wrong: "off by > $10",
};

const PREPARER_TEXT: Record<Preparer["kind"], string> = {
  cpa: "CPA",
  enrolled_agent: "Enrolled agent",
  software: "Tax software",
  self: "Self-prepared by hand",
};

function preparerLine(preparer: Preparer | undefined): string {
  if (!preparer) return "**not stated** (add `preparer` to index.ts)";
  const who = preparer.name
    ? `${PREPARER_TEXT[preparer.kind]} — ${preparer.name}`
    : PREPARER_TEXT[preparer.kind];
  const style = Object.entries(preparer.rounding ?? {}).map(([key, value]) => `${key}: ${value}`);
  return style.length > 0 ? `${who} (rounding: ${style.join(", ")})` : who;
}

/** Presence only, never an amount. */
function blankSide(diff: LineDiff): string {
  return diff.filed !== 0 && (diff.engine === null || diff.engine === 0)
    ? "engine leaves blank"
    : "";
}

function label(diff: LineDiff): string {
  const flat = diff.label.replace(/\s+/g, " ").trim();
  return flat.length > 70 ? `${flat.slice(0, 69)}…` : flat;
}

function summaryTable(result: CompareResult): string[] {
  const rows = ["| Form | Lines on return | Match | Differ |", "|---|---:|---:|---:|"];
  const forms = Object.keys(result.matches);
  for (const formId of forms) {
    const diffs = result.diffs.filter((diff) => diff.formId === formId);
    const filled = result.matches[formId].length + diffs.filter((diff) => diff.filed !== 0).length;
    rows.push(`| ${formId} | ${filled} | ${result.matches[formId].length} | ${diffs.length} |`);
  }
  return rows;
}

function rootSection(roots: RootCause[]): string[] {
  const out = [`## Root causes (${roots.length})`, ""];
  if (roots.length === 0) return [...out, "None. Every filled line matches.", ""];
  out.push("A root line differs while every line it reads matches. Fix roots first.", "");
  roots.forEach(({ root, downstream }, i) => {
    const side = blankSide(root);
    out.push(`### ${i + 1}. \`${root.fieldId}\` — ${STATUS_TEXT[root.status]}`);
    out.push("", `${label(root)}${side ? ` (${side})` : ""}`, "");
    if (downstream.length > 0) {
      const ids = downstream.map((diff) => `\`${diff.fieldId}\``).join(", ");
      out.push(`Downstream (${downstream.length}): ${ids}`, "");
    }
  });
  return out;
}

const SUPPORT_TEXT: Record<SupportIssue["kind"], string> = {
  unknown_fact: "Unknown fact",
  unknown_decision: "Unknown decision",
  out_of_scope: "Out of scope",
  form_not_modeled: "Form not modeled",
};

export function supportSection(input: ReportInput): string[] {
  const out = ["## Support check", ""];
  for (const i of input.support) {
    out.push(`- **${SUPPORT_TEXT[i.kind]}:** \`${i.subject}\` — ${i.detail}`);
  }
  const notModeled = input.result.diffs.filter((diff) => diff.status === "not_modeled");
  if (notModeled.length > 0) {
    const ids = notModeled.map((diff) => `\`${diff.fieldId}\``).join(", ");
    out.push(`- **Lines not modeled (${notModeled.length}):** ${ids}`);
  }
  if (out.length === 2)
    out.push("Supported. The engine reads every input and models every filed line.");
  return [...out, ""];
}

export function inputSection(input: ReportInput): string[] {
  const out = ["## Input check", ""];
  const { unknownFields } = input.result;
  if (!input.preparer) out.push("- Preparer not stated.");
  if (input.centsLines.length > 0) {
    out.push(
      `- Filed lines typed with cents (a filed return shows whole dollars): ` +
        input.centsLines.map((id) => `\`${id}\``).join(", "),
    );
  }
  if (unknownFields.length > 0) {
    out.push(
      `- Field ids not in the catalog: ${unknownFields.map((id) => `\`${id}\``).join(", ")}`,
    );
  }
  if (out.length === 2) out.push("No input problems found.");
  return [...out, ""];
}

const counts = (tally: Record<string, number>) =>
  Object.entries(tally)
    .map(([key, count]) => `${key} ×${count}`)
    .join(", ") || "none";

function shapeSection(shape: InputShape): string[] {
  const scope = Object.entries(shape.scope)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return [
    "## Return shape",
    "",
    `- Documents: ${counts(shape.documents)}`,
    `- Sales by Form 8949 box: ${counts(shape.salesByBox)}`,
    `- Other facts: ${counts(shape.otherFacts)}`,
    `- Scope decisions: ${scope || "none"}`,
    "",
  ];
}

function diffTable(result: CompareResult, roots: RootCause[]): string[] {
  const rootIds = new Set(roots.map((root) => root.root.fieldId));
  const out = ["## All differences", "", "| Line | Status | Root | Note |", "|---|---|:-:|---|"];
  for (const diff of result.diffs) {
    const root = rootIds.has(diff.fieldId) ? "●" : "";
    out.push(
      `| \`${diff.fieldId}\` | ${STATUS_TEXT[diff.status]} | ${root} | ${blankSide(diff)} |`,
    );
  }
  return [...out, ""];
}

export function reportData(input: ReportInput): Record<string, unknown> {
  const { result } = input;
  return {
    schema: REPORT_SCHEMA,
    taxYear: input.taxYear,
    createdAt: input.createdAt,
    engineCommit: input.engineCommit,
    preparer: input.preparer ?? null,
    matched: result.matches,
    differing: result.diffs.map((diff) => ({ fieldId: diff.fieldId, status: diff.status })),
    roots: input.roots.map((root) => root.root.fieldId),
    shape: input.shape,
    support: input.support,
  };
}

export function reportHead(input: ReportInput): string[] {
  const { result } = input;
  const matched = Object.values(result.matches).reduce((total, ids) => total + ids.length, 0);
  return [
    `# OpenReturn check — tax year ${input.taxYear}`,
    "",
    `- **Prepared by:** ${preparerLine(input.preparer)}`,
    `- **Engine:** \`${input.engineCommit}\``,
    `- **Created:** ${input.createdAt}`,
    `- **Result:** ${matched} filled lines match, ${result.diffs.length} differ, ` +
      `${input.roots.length} root cause(s)`,
    "",
    "> This report holds no dollar amounts, names, or payers. Read it before you send it.",
    `> ${SEND_INSTRUCTIONS}`,
    "",
    ...supportSection(input),
    "## Summary",
    "",
    ...summaryTable(result),
    "",
    ...rootSection(input.roots),
  ];
}

export function renderReport(input: ReportInput): string {
  return [
    ...reportHead(input),
    ...inputSection(input),
    ...shapeSection(input.shape),
    ...diffTable(input.result, input.roots),
  ].join("\n");
}
