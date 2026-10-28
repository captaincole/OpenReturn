import type { RenderedWidget } from "../../src/render/fillFromCatalog.js";
import type { AnyFormField, EvaluatedForm } from "../../src/types.js";
import type { GoldenValue } from "./goldenPdf.js";
import { normalizeForCompare } from "./goldenPdf.js";

function tag(prefix: string | undefined, body: string): string {
  return prefix ? `[${prefix}] ${body}` : body;
}

export function assertEngineNumber(
  form: EvaluatedForm<AnyFormField>,
  fieldId: string,
  expected: number,
  failures: string[],
  prefix?: string,
  notModeled?: string[],
): void {
  const f = form.fields.find((x) => x.fieldId === fieldId);
  if (!f && notModeled) {
    /* A catalog-only form has no evaluated fields at all. */
    notModeled.push(tag(prefix, `${fieldId} (expected ${expected})`));
    return;
  }
  if (!f) {
    failures.push(tag(prefix, `engine: field ${fieldId} not present in evaluated form.`));
    return;
  }
  if (!f.result.ok) {
    if (f.result.unsupported && notModeled) {
      notModeled.push(tag(prefix, `${fieldId} (expected ${expected})`));
      return;
    }
    /* fromFields treats an unsupported term as 0 downstream, so it passes an expected 0. */
    if (f.result.unsupported && expected === 0) return;
    failures.push(tag(prefix, `engine: ${fieldId} blocked — ${f.result.reason}.`));
    return;
  }
  const got = f.result.value;
  /* 50¢ tolerance for unrounded upstream values; table-derived tax is already whole dollars. */
  if (typeof got !== "number" || Math.abs(got - expected) > 0.5) {
    failures.push(tag(prefix, `engine: ${fieldId} expected ${expected}, got ${String(got)}.`));
  }
}

export function assertRenderedText(
  rendered: Map<string, RenderedWidget[]>,
  fieldId: string,
  expectedText: string,
  failures: string[],
  prefix?: string,
): void {
  const arr = rendered.get(fieldId);
  if (!arr || arr.length === 0) {
    failures.push(tag(prefix, `render: ${fieldId} was not written to any PDF widget.`));
    return;
  }
  const matched = arr.find((w) => w.text === expectedText);
  if (!matched) {
    failures.push(
      tag(
        prefix,
        `render: ${fieldId} expected text "${expectedText}", got ${JSON.stringify(arr.map((w) => w.text ?? `(checked ${w.widgetName})`))}.`,
      ),
    );
  }
}

export function assertNotRendered(
  rendered: Map<string, RenderedWidget[]>,
  fieldId: string,
  failures: string[],
  prefix?: string,
): void {
  if (rendered.has(fieldId)) {
    failures.push(
      tag(
        prefix,
        `render: ${fieldId} should be blank but was written (${JSON.stringify(rendered.get(fieldId))}).`,
      ),
    );
  }
}

export function assertRenderedChecked(
  rendered: Map<string, RenderedWidget[]>,
  fieldId: string,
  failures: string[],
  prefix?: string,
): void {
  const arr = rendered.get(fieldId);
  if (!arr || arr.length === 0 || !arr.some((w) => w.checked || w.text)) {
    failures.push(
      tag(
        prefix,
        `render: ${fieldId} expected at least one checked/selected widget, got ${JSON.stringify(arr ?? [])}.`,
      ),
    );
  }
}

/** Compares per widget name, not per fieldId, so catalog mislabels show. */
export function assertMatchesGolden(
  rendered: Map<string, RenderedWidget[]>,
  golden: Map<string, GoldenValue>,
  failures: string[],
  prefix?: string,
): void {
  const ours = new Map<string, string | boolean>();
  for (const [, widgets] of rendered) {
    for (const w of widgets) {
      if (typeof w.text === "string") {
        ours.set(w.widgetName, w.text);
      } else if (w.checked) {
        ours.set(w.widgetName, true);
      }
    }
  }

  const allWidgets = new Set<string>([...ours.keys(), ...golden.keys()]);
  for (const widgetName of allWidgets) {
    const g = golden.get(widgetName);
    const o = ours.get(widgetName);

    if (g?.kind === "checkbox") {
      const goldenChecked = g.value === true;
      const ourChecked = o === true;
      if (goldenChecked !== ourChecked) {
        failures.push(
          tag(
            prefix,
            `golden: widget ${widgetName} (checkbox) — golden=${goldenChecked} ours=${ourChecked}`,
          ),
        );
      }
      continue;
    }
    if (g?.kind === "radio") {
      const goldenSelected = normalizeForCompare(g.value);
      const ourSelected = typeof o === "string" ? normalizeForCompare(o) : "";
      if (goldenSelected !== ourSelected) {
        failures.push(
          tag(
            prefix,
            `golden: widget ${widgetName} (radio) — golden=${JSON.stringify(g.value)} ours=${JSON.stringify(o ?? null)}`,
          ),
        );
      }
      continue;
    }

    /* "0" and "" are NOT equal: a line that computes to zero must render "0". */
    const goldenText = normalizeForCompare(g?.value);
    const ourText = typeof o === "string" ? normalizeForCompare(o) : "";
    if (goldenText !== ourText) {
      failures.push(
        tag(
          prefix,
          `golden: widget ${widgetName} — golden=${JSON.stringify(goldenText)} ours=${JSON.stringify(ourText)}`,
        ),
      );
    }
  }
}
