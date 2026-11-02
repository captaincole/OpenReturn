import { bindingKind, FORMS } from "@openreturn/engine";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  if (status.catalogFields === null) return "form-catalog";
  if (!status.typesTs || !status.filingInfoTs || !status.registered) return "form-wiring";
  if (status.notDrafted.length > 0) return `form-bindings (${status.notDrafted[0]})`;
  return "form-verify";
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
