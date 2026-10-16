/*
 * The comparison report a checker sends to a maintainer.
 *
 * Two files: Markdown for people (renderReport) and JSON for a future
 * stats script (reportData, REPORT_SCHEMA). It never holds a dollar amount, a name, or a fact key:
 * only field ids, drift buckets, root causes, and input counts. The
 * checker reviews it before sending.
 */

import type { Preparer } from "../../tests/types.js";
import type { CompareResult, LineDiff, LineStatus } from "./compare.js";
import type { InputShape } from "./inputShape.js";
import type { RootCause } from "./rootCauses.js";
import type { SupportIssue } from "./support.js";

export const REPORT_SCHEMA = "summa-check/1";

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
  /** Filed lines typed with cents (a filed return shows whole dollars). */
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

function preparerLine(p: Preparer | undefined): string {
  if (!p) return "**not stated** (add `preparer` to index.ts)";
  const who = p.name ? `${PREPARER_TEXT[p.kind]} — ${p.name}` : PREPARER_TEXT[p.kind];
  const style = Object.entries(p.rounding ?? {}).map(([k, v]) => `${k}: ${v}`);
  return style.length > 0 ? `${who} (rounding: ${style.join(", ")})` : who;
}

/** Presence only, never an amount. (A blank return line is its own status.) */
function blankSide(d: LineDiff): string {
  return d.filed !== 0 && (d.engine === null || d.engine === 0) ? "engine leaves blank" : "";
}

function label(d: LineDiff): string {
  const flat = d.label.replace(/\s+/g, " ").trim();
  return flat.length > 70 ? `${flat.slice(0, 69)}…` : flat;
}

function summaryTable(r: CompareResult): string[] {
  const rows = ["| Form | Lines on return | Match | Differ |", "|---|---:|---:|---:|"];
  const forms = Object.keys(r.matches);
  for (const formId of forms) {
    const diffs = r.diffs.filter((d) => d.formId === formId);
    const filled = r.matches[formId].length + diffs.filter((d) => d.filed !== 0).length;
    rows.push(`| ${formId} | ${filled} | ${r.matches[formId].length} | ${diffs.length} |`);
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
      const ids = downstream.map((d) => `\`${d.fieldId}\``).join(", ");
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

/** Does the engine cover this return? Differences caused by gaps here are expected. */
export function supportSection(input: ReportInput): string[] {
  const out = ["## Support check", ""];
  for (const i of input.support) {
    out.push(`- **${SUPPORT_TEXT[i.kind]}:** \`${i.subject}\` — ${i.detail}`);
  }
  const notModeled = input.result.diffs.filter((d) => d.status === "not_modeled");
  if (notModeled.length > 0) {
    const ids = notModeled.map((d) => `\`${d.fieldId}\``).join(", ");
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

const counts = (m: Record<string, number>) =>
  Object.entries(m)
    .map(([k, n]) => `${k} ×${n}`)
    .join(", ") || "none";

function shapeSection(s: InputShape): string[] {
  const scope = Object.entries(s.scope)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return [
    "## Return shape",
    "",
    `- Documents: ${counts(s.documents)}`,
    `- Sales by Form 8949 box: ${counts(s.salesByBox)}`,
    `- Other facts: ${counts(s.otherFacts)}`,
    `- Scope decisions: ${scope || "none"}`,
    "",
  ];
}

function diffTable(r: CompareResult, roots: RootCause[]): string[] {
  const rootIds = new Set(roots.map((g) => g.root.fieldId));
  const out = ["## All differences", "", "| Line | Status | Root | Note |", "|---|---|:-:|---|"];
  for (const d of r.diffs) {
    const root = rootIds.has(d.fieldId) ? "●" : "";
    out.push(`| \`${d.fieldId}\` | ${STATUS_TEXT[d.status]} | ${root} | ${blankSide(d)} |`);
  }
  return [...out, ""];
}

/** The JSON file: the same facts as the Markdown, for a stats script. */
export function reportData(input: ReportInput): Record<string, unknown> {
  const { result } = input;
  return {
    schema: REPORT_SCHEMA,
    taxYear: input.taxYear,
    createdAt: input.createdAt,
    engineCommit: input.engineCommit,
    preparer: input.preparer ?? null,
    matched: result.matches,
    differing: result.diffs.map((d) => ({ fieldId: d.fieldId, status: d.status })),
    roots: input.roots.map((g) => g.root.fieldId),
    shape: input.shape,
    support: input.support,
  };
}

/** The headline and summary sections; also printed to the terminal. */
export function reportHead(input: ReportInput): string[] {
  const { result } = input;
  const matched = Object.values(result.matches).reduce((n, ids) => n + ids.length, 0);
  return [
    `# Summa check — tax year ${input.taxYear}`,
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
