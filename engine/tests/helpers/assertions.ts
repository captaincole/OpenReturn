/*
 * Assertion primitives the runner uses to check engine and render output
 * against a Scenario's ExpectedResults. All assertions append to a
 * failure list instead of throwing. The runner then reports every failure
 * at once instead of stopping at the first.
 *
 * Each helper takes an optional `prefix` (the formId). It is prepended to
 * failure messages so multi-form scenarios stay unambiguous.
 */

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
    /*
     * Roadmap scenarios pass a notModeled list: an unsupported field is
     * recorded there (zero or not) instead of failing.
     */
    if (f.result.unsupported && notModeled) {
      notModeled.push(tag(prefix, `${fieldId} (expected ${expected})`));
      return;
    }
    /*
     * `unsupported` is a deliberate engine gap, not a "needs data" block.
     * The rule library's fromFields contract treats unsupported terms as
     * 0 downstream, so an unsupported field IS 0 semantically. Accept it
     * as a pass when the expected value is 0. Genuinely blocked results
     * (facts/decisions the user must still provide) fail.
     */
    if (f.result.unsupported && expected === 0) return;
    failures.push(tag(prefix, `engine: ${fieldId} blocked — ${f.result.reason}.`));
    return;
  }
  const got = f.result.value;
  /*
   * 50¢ tolerance. Money lines round at render time, and table-derived
   * tax values are already integers.
   */
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

/**
 * Diff our rendered values against a CPA-completed golden PDF, widget by
 * widget. This test layer catches catalog mislabels. Example: the catalog
 * says `first_name_mi → f1_01[0]`, but f1_01[0] is the year-begin widget.
 * The binding writes "Alex" to f1_01[0], the golden holds "01/01/2025",
 * and we report the mismatch.
 *
 * Comparison is per widget name (the deterministic PDF identifier), not
 * per fieldId. The catalog's labels are fully out of the loop.
 *
 * Emit a failure with the widget name and both values when: the golden
 * fills a widget and we do not, we fill a widget the golden does not, or
 * the two values disagree.
 */
export function assertMatchesGolden(
  rendered: Map<string, RenderedWidget[]>,
  golden: Map<string, GoldenValue>,
  failures: string[],
  prefix?: string,
): void {
  /*
   * Index our rendered output by widget name, one row per widget written.
   * A RenderedWidget carries `text` (text fields, dates), `checked`
   * (checkboxes turned on), or a radio-option label.
   */
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

    /*
     * For checkboxes and radios, our renderer writes a value only when
     * the box is "on". The golden's checkbox value is an explicit
     * true/false.
     */
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

    /*
     * Default: text comparison. Covers text fields and widgets the golden
     * did not classify cleanly. Blank on both sides is a pass. We do NOT
     * treat "0" and "" as equal: a numeric line that computes to zero
     * must render as "0" on both sides.
     */
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
