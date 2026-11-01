/*
 * Labels come from /TU, else from vision (IRS 1040 strips /TU). There is no
 * positional fallback by policy: a widget with no label throws for human review.
 */

import { readFile } from "node:fs/promises";
import { createIsomorphicCanvasFactory, getDocumentProxy } from "unpdf";
import { resolveLabelsForPage } from "./visionLabel.js";

const canvasImport = () => import("@napi-rs/canvas");

export type FieldKind = "text" | "checkbox" | "radio" | "signature" | "other";
export type LabelSource = "tu" | "vision";

export interface ExtractedFieldWidget {
  /** 0-based. */
  page: number;
  position: { x: number; y: number; width: number; height: number };
  buttonValue?: string;
}

export interface ExtractedField {
  fieldName: string;
  shortName: string;
  fieldKind: FieldKind;
  label: string;
  labelSource: LabelSource;
  maxLength?: number | null;
  multiline?: boolean;
  /** A comb field has fixed character cells (SSN boxes). */
  comb?: boolean;
  radioOptions?: string[];
  /** The "on" appearance state name, often "Yes" or "1". */
  checkboxOnValue?: string;
  widgets: ExtractedFieldWidget[];
}

export interface ExtractedForm {
  pdfPath: string;
  totalPages: number;
  fields: ExtractedField[];
}

export interface CoverageReport {
  totalFields: number;
  tier1Count: number;
  tier2Count: number;
}

export class MissingLabelError extends Error {
  fieldName: string;
  pdfPath: string;
  constructor(opts: { fieldName: string; pdfPath: string }) {
    super(
      `extractFormFields(${opts.pdfPath}): widget "${opts.fieldName}" has no ` +
        `label after tier-1 (/TU) and tier-2 (vision). The vision step did ` +
        `not return a label for this widget. Investigate the page render + ` +
        `overlay or escalate to manual review.`,
    );
    this.name = "MissingLabelError";
    this.fieldName = opts.fieldName;
    this.pdfPath = opts.pdfPath;
  }
}

interface PageWidget {
  pdfWidgetId: number; // the overlay badge number
  annot: any;
  rect: [number, number, number, number];
}

interface WidgetOccurrence {
  annot: any;
  page: number;
  rect: [number, number, number, number];
}

interface CollectedWidgets {
  tier1Labels: Map<string, string>;
  widgetsByFieldName: Map<string, WidgetOccurrence[]>;
  widgetsByPage: Map<number, PageWidget[]>;
}

/*
 * Skip ReadOnly widgets (e.g. Form 8949 Totals row, column (f)). PDF viewers
 * grey them out, so a value written there looks wrong to a person.
 */
function collectPageWidgets(annots: any[], pageIdx: number, out: CollectedWidgets): PageWidget[] {
  const rawWidgets: Array<{ annot: any; rect: [number, number, number, number] }> = [];

  for (const annot of annots) {
    if (annot.subtype !== "Widget") continue;
    if (annot.readOnly === true) continue;
    const rect = annot.rect as [number, number, number, number];
    const fieldName = annot.fieldName as string;

    let bucket = out.widgetsByFieldName.get(fieldName);
    if (!bucket) {
      bucket = [];
      out.widgetsByFieldName.set(fieldName, bucket);
    }
    bucket.push({ annot: annot, page: pageIdx, rect });

    const alt = annot.alternativeText;
    if (!out.tier1Labels.has(fieldName) && typeof alt === "string" && alt.trim().length > 0) {
      out.tier1Labels.set(fieldName, alt.trim());
    }

    rawWidgets.push({ annot: annot, rect });
  }

  /* Reading order, as the vision prompt promises. PDF y is bottom-up: larger y is higher. */
  rawWidgets.sort((left, right) => {
    const ay = (left.rect[1] + left.rect[3]) / 2;
    const by = (right.rect[1] + right.rect[3]) / 2;
    if (Math.abs(ay - by) > 3) return by - ay;
    return left.rect[0] - right.rect[0];
  });

  return rawWidgets.map((widget, i) => ({
    pdfWidgetId: i + 1,
    annot: widget.annot,
    rect: widget.rect,
  }));
}

async function resolveTier2Labels(
  pdfPath: string,
  pdf: Awaited<ReturnType<typeof getDocumentProxy>>,
  totalPages: number,
  collected: CollectedWidgets,
): Promise<Map<string, string>> {
  const tier2Labels = new Map<string, string>();
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageWidgets = collected.widgetsByPage.get(pageIndex) ?? [];
    if (pageWidgets.length === 0) continue;
    const allHaveTu = pageWidgets.every((widget) =>
      collected.tier1Labels.has(widget.annot.fieldName as string),
    );
    if (allHaveTu) continue;

    const labels = await resolveLabelsForPage({
      pdfPath,
      pdf,
      pageIndex: pageIndex,
      widgets: pageWidgets.map((widget) => ({
        id: widget.pdfWidgetId,
        fieldName: widget.annot.fieldName as string,
        kind: classifyKind(widget.annot),
        rect: widget.rect,
        exportValue:
          typeof widget.annot.exportValue === "string" ? widget.annot.exportValue : undefined,
        buttonValue:
          typeof widget.annot.buttonValue === "string" ? widget.annot.buttonValue : undefined,
        tuLabel: collected.tier1Labels.get(widget.annot.fieldName as string) ?? null,
      })),
    });

    /* Widgets can share a fieldName across pages; the first non-empty label wins. */
    for (const widget of pageWidgets) {
      const fn = widget.annot.fieldName as string;
      if (collected.tier1Labels.has(fn)) continue;
      if (tier2Labels.has(fn)) continue;
      const lab = labels.get(widget.pdfWidgetId);
      if (lab && lab.trim().length > 0) {
        tier2Labels.set(fn, lab.trim());
      }
    }
  }
  return tier2Labels;
}

function resolveLabel(
  pdfPath: string,
  fieldName: string,
  tier1Labels: Map<string, string>,
  tier2Labels: Map<string, string>,
): { label: string; labelSource: LabelSource } {
  const t1 = tier1Labels.get(fieldName);
  if (t1) return { label: t1, labelSource: "tu" };
  const t2 = tier2Labels.get(fieldName);
  if (t2) return { label: t2, labelSource: "vision" };
  throw new MissingLabelError({ fieldName, pdfPath });
}

function assembleField(
  pdfPath: string,
  fieldName: string,
  occurrences: WidgetOccurrence[],
  tier1Labels: Map<string, string>,
  tier2Labels: Map<string, string>,
): ExtractedField {
  const head = occurrences[0].annot;
  const fieldKind = classifyKind(head);
  const { label, labelSource } = resolveLabel(pdfPath, fieldName, tier1Labels, tier2Labels);

  const field: ExtractedField = {
    fieldName,
    shortName: shortenName(fieldName),
    fieldKind,
    label,
    labelSource,
    widgets: occurrences.map((occ) => ({
      page: occ.page,
      position: {
        x: occ.rect[0],
        y: occ.rect[1],
        width: occ.rect[2] - occ.rect[0],
        height: occ.rect[3] - occ.rect[1],
      },
      ...(fieldKind === "radio" && typeof occ.annot.buttonValue === "string"
        ? { buttonValue: occ.annot.buttonValue as string }
        : {}),
    })),
  };

  if (fieldKind === "text") {
    const ml = head.maxLen;
    field.maxLength = typeof ml === "number" && ml > 0 ? ml : null;
    field.multiline = !!head.multiLine;
    if (head.comb) field.comb = true;
  } else if (fieldKind === "checkbox") {
    if (typeof head.exportValue === "string") field.checkboxOnValue = head.exportValue;
  } else if (fieldKind === "radio") {
    field.radioOptions = occurrences
      .map((occ) => occ.annot.buttonValue)
      .filter((value): value is string => typeof value === "string");
  }

  return field;
}

export async function extractFormFields(pdfPath: string): Promise<ExtractedForm> {
  const bytes = await readFile(pdfPath);
  /*
   * pdf.js needs CanvasFactory at load time. Without it, some forms' annotations
   * fail with "@napi-rs/canvas is not available".
   */
  const CanvasFactory = await createIsomorphicCanvasFactory(canvasImport);
  const pdf = await getDocumentProxy(new Uint8Array(bytes), {
    CanvasFactory,
  } as any);
  const totalPages = pdf.numPages;

  const collected: CollectedWidgets = {
    tier1Labels: new Map(),
    widgetsByFieldName: new Map(),
    widgetsByPage: new Map(),
  };
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const annots = await page.getAnnotations();
    collected.widgetsByPage.set(pageNum - 1, collectPageWidgets(annots, pageNum - 1, collected));
  }

  const tier2Labels = await resolveTier2Labels(pdfPath, pdf, totalPages, collected);

  const fields: ExtractedField[] = [];
  for (const [fieldName, occurrences] of collected.widgetsByFieldName) {
    fields.push(assembleField(pdfPath, fieldName, occurrences, collected.tier1Labels, tier2Labels));
  }

  fields.sort((left, right) => {
    const aw = left.widgets[0];
    const bw = right.widgets[0];
    if (!aw || !bw) return 0;
    if (aw.page !== bw.page) return aw.page - bw.page;
    if (Math.abs(aw.position.y - bw.position.y) > 3) {
      return bw.position.y - aw.position.y;
    }
    return aw.position.x - bw.position.x;
  });

  return { pdfPath, totalPages, fields };
}

export function coverageReport(form: ExtractedForm): CoverageReport {
  let t1 = 0;
  let t2 = 0;
  for (const field of form.fields) {
    if (field.labelSource === "tu") t1++;
    else if (field.labelSource === "vision") t2++;
  }
  return { totalFields: form.fields.length, tier1Count: t1, tier2Count: t2 };
}

function classifyKind(annot: any): FieldKind {
  if (annot.fieldType === "Tx") return "text";
  if (annot.fieldType === "Btn") {
    if (annot.radioButton) return "radio";
    if (annot.checkBox) return "checkbox";
    return "other";
  }
  if (annot.fieldType === "Sig") return "signature";
  return "other";
}

function shortenName(fullName: string): string {
  const segs = fullName.split(".");
  const last = segs[segs.length - 1] ?? fullName;
  return last.replace(/\[\d+\]$/, "");
}
