import { bindingKind, FORMS } from "@openreturn/engine";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { FormTarget } from "./formTarget.js";
import { labelsPath, widgetsPath } from "./workFiles.js";

/*
 * The checkpoint state of the form skills, read from the repo alone, so a
 * new session (or another agent) continues where the last one stopped.
 */
export interface FormStatus {
  formId: string;
  subpath: string;
  blankPdf: boolean;
  /** The corpus document a binding reads: npm run corpus -- outline <id>. */
  instructionsDocId: string | null;
  widgetsJson: boolean;
  labelsJson: boolean;
  catalogFields: number | null;
  typesTs: boolean;
  filingInfoTs: boolean;
  registered: boolean;
  bound: number;
  unsupported: number;
  /** Catalog order, which is reading order. */
  notDrafted: string[];
  next: string;
}

function nextStep(status: Omit<FormStatus, "next">): string {
  if (!status.blankPdf) return "add blank.pdf under sources/";
  if (status.catalogFields === null) return "catalog-form-fields";
  if (!status.typesTs || !status.filingInfoTs || !status.registered) return "register-form";
  if (status.notDrafted.length > 0) return `write-binding-rules (${status.notDrafted[0]})`;
  return "verify-form";
}

/* Schedules 1, 1-A, 2 and 3 have no instructions of their own: the Form 1040 instructions cover them. */
const COVERED_BY_1040 = new Set([
  "federal/schedule-1",
  "federal/schedule-1-a",
  "federal/schedule-2",
  "federal/schedule-3",
]);

/* Schedule C (Form 8995-A) has no instructions of its own: the Form 8995-A instructions cover it. */
const COVERED_BY_8995A = new Set(["federal/8995-a-schedule-c"]);

function instructionsDocId(target: FormTarget): string | null {
  if (COVERED_BY_1040.has(target.subpath)) return `irs-1040-inst-${target.taxYear}`;
  if (COVERED_BY_8995A.has(target.subpath)) return `irs-8995a-inst-${target.taxYear}`;
  const sidecar = resolve(dirname(target.pdfPath), "instructions.meta.json");
  if (!existsSync(sidecar)) return null;
  return (JSON.parse(readFileSync(sidecar, "utf8")) as { docId: string }).docId;
}

function catalogFieldIds(target: FormTarget): string[] | null {
  if (!existsSync(target.catalogPath)) return null;
  const catalog = JSON.parse(readFileSync(target.catalogPath, "utf8"));
  return (catalog.fields as Array<{ fieldId: string }>).map((field) => field.fieldId);
}

export function formStatus(target: FormTarget): FormStatus {
  const fieldIds = catalogFieldIds(target);
  const registered = FORMS.some((spec) => spec.formId === target.formId);
  const kinds = (fieldIds ?? []).map((fieldId) => ({ fieldId, kind: bindingKind(fieldId) }));
  const status = {
    formId: target.formId,
    subpath: target.subpath,
    blankPdf: existsSync(target.pdfPath),
    instructionsDocId: instructionsDocId(target),
    widgetsJson: existsSync(widgetsPath(target)),
    labelsJson: existsSync(labelsPath(target)),
    catalogFields: fieldIds?.length ?? null,
    typesTs: existsSync(resolve(target.engineDir, "types.ts")),
    filingInfoTs: existsSync(resolve(target.engineDir, "filingInfo.ts")),
    registered,
    bound: kinds.filter(({ kind }) => kind === "binding").length,
    unsupported: kinds.filter(({ kind }) => kind === "unsupported").length,
    notDrafted: kinds.filter(({ kind }) => kind === undefined).map(({ fieldId }) => fieldId),
  };
  return { ...status, next: nextStep(status) };
}

const mark = (done: boolean) => (done ? "✓" : "·");

export function formatStatus(status: FormStatus): string {
  const lines = [
    `${status.formId} (${status.subpath})`,
    status.instructionsDocId
      ? `  instructions  ${status.instructionsDocId}  (npm run corpus -- outline ${status.instructionsDocId})`
      : "  instructions  · no instructions.meta.json in sources/",
    `  catalog   ${mark(status.catalogFields !== null)} ${status.catalogFields ?? 0} fields` +
      (status.catalogFields === null
        ? `  (widgets.json ${mark(status.widgetsJson)}, labels.json ${mark(status.labelsJson)})`
        : ""),
    `  wiring    ${mark(status.typesTs)} types.ts  ${mark(status.filingInfoTs)} filingInfo.ts  ${mark(status.registered)} registered`,
    `  bindings  ${status.bound} bound, ${status.unsupported} unsupported, ${status.notDrafted.length} not drafted`,
  ];
  if (status.notDrafted.length > 0) {
    const shown = status.notDrafted.slice(0, 12).map((id) => id.slice(status.formId.length + 1));
    const more =
      status.notDrafted.length > shown.length
        ? ` … +${status.notDrafted.length - shown.length}`
        : "";
    lines.push(`  not drafted: ${shown.join(", ")}${more}`);
  }
  lines.push(`  next: ${status.next}`);
  return lines.join("\n");
}
