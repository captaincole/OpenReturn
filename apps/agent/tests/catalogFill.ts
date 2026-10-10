/*
 * Catalog-fill test. Checks a form catalog against its blank PDF and
 * against a golden snapshot.
 *
 * For one form-id: load the catalog and the blank PDF. Build an
 * EvaluatedForm with a deterministic synthetic value per field. Render
 * with fillFromCatalog. Diff the rendered map against the golden file
 * stored next to the catalog.
 *
 *   npx tsx tests/catalogFill.ts --form-id=form-8949 [--update]
 *   (check-only, via the main runner: npm test -- form-8949)
 *
 * This catches:
 *   - A catalog widget that does not exist in the PDF.
 *   - A catalog `text` field whose widget is a checkbox.
 *   - Two fields that share one pdfWidgetName. Per-field synthetic
 *     values surface this; a shared value would not.
 *   - A catalog field the renderer skips (size mismatch).
 *   - Drift from the last validated state (golden diff).
 *
 * First run: pass --update to bootstrap the golden and a filled PDF at
 * /tmp/smoke-<formId>.pdf. Inspect the PDF and commit the golden. Later
 * runs without --update are a regression check.
 *
 * runAll.ts imports `runCatalogFillCheck` and `CATALOGS`, then runs one
 * check per form — one row per form in the summary.
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { loadFromFixture, type Catalog, type FieldInventory } from "../src/engine/catalog.js";
import { fillFromCatalog } from "../src/engine/render/fillFromCatalog.js";
import type { AnyFormField, EvaluatedForm } from "../src/engine/types.js";
import type { RunResult } from "./types.js";

interface Args {
  formId: string;
  update: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const arg = argv.find((a) => a.startsWith(`${flag}=`));
    return arg ? arg.slice(flag.length + 1) : undefined;
  };
  const formId = get("--form-id");
  const update = argv.includes("--update");
  if (!formId) {
    throw new Error("Required: --form-id=<formId>. Optional: --update.");
  }
  return { formId, update };
}

/*
 * ─── Catalog registry ───────────────────────────────────────────────────
 *
 * The set of forms with catalog-fill goldens equals the set of forms in
 * the shared registry (src/engine/registry.ts) — one source of truth.
 * Re-export FORMS as CATALOGS so runAll's iteration stays self-describing.
 */
import { FORMS, getFormSpec } from "../src/engine/registry.js";

export const CATALOGS = FORMS;

function lookupCatalogPath(formId: string): string {
  return getFormSpec(formId).catalogPath;
}

/*
 * ─── Synthetic value generation ─────────────────────────────────────────
 *
 * Deterministic per field. Two goals:
 *   1. Match the renderer's shape expectations per (valueType, pdfFieldKind).
 *   2. Make each value per-field-unique. A widget collision (two fields
 *      that share one pdfWidgetName) then surfaces as wrong text.
 */

function hashFieldId(id: string): number {
  return createHash("sha256").update(id).digest().readUInt32BE(0);
}

function syntheticValue(field: FieldInventory): unknown {
  const seed = hashFieldId(field.fieldId);
  const tag = seed.toString(36).slice(0, 5).toUpperCase();
  /*
   * Branch on the classifier's rich type. It distinguishes within the
   * coarse valueType buckets. Fall back to plain valueType for a catalog
   * without valueTypeRich.
   */
  const rich = field.valueTypeRich ?? field.valueType;

  /*
   * Small-maxLength fields are usually structural sub-parts: date
   * month/day/year, 2-letter state, 2-digit year suffix, credit code,
   * single-digit count. The canonical synthetic — "01/15/2025", "T-XXXXX",
   * 4-digit money — overflows them. The renderer's maxLength-expanding
   * fallback then writes the longer value anyway. That masks the bug
   * instead of failing the test. So produce a value of exactly maxLength,
   * derived from the seed to stay per-field-unique. Numeric fields get a
   * number (the renderer requires typeof === "number"); all other fields
   * get a digit string.
   */
  if (typeof field.maxLength === "number" && field.maxLength > 0 && field.maxLength <= 4) {
    const mod = 10 ** field.maxLength;
    if (field.valueType === "numeric") return seed % mod;
    return String(seed % mod).padStart(field.maxLength, "0");
  }

  switch (rich) {
    case "money":
    case "count":
    case "numeric":
      // 4-digit values stay under common widget maxLength caps.
      return 1000 + (seed % 9000);
    case "ssn":
      return "123-45-6789";
    case "phone":
      return "555-123-4567";
    case "zip":
      return "94110";
    case "email":
      return `t-${tag.toLowerCase()}@example.com`;
    case "signature":
      /*
       * Signature widgets fall through to coerceTextValue as plain strings.
       * Give them a per-field-unique tag like other text fields.
       */
      return `T-${tag}`;
    case "boolean":
      return true;
    case "date":
      return "01/15/2025";
    case "single_select":
    case "multi_select":
      return field.options?.[0]?.value;
    case "text":
    default:
      // Per-field-unique tag so widget collisions surface as wrong text.
      return `T-${tag}`;
  }
}

// ─── EvaluatedForm builder ──────────────────────────────────────────────

function buildSyntheticForm(formId: string, catalog: Catalog): EvaluatedForm<AnyFormField> {
  const meta = catalog.getForm(formId);
  if (!meta) throw new Error(`Catalog missing form metadata for ${formId}`);

  const fields: AnyFormField[] = catalog.getFields(formId).map((inv) => ({
    formFieldKind: `${formId}.${inv.valueType}`,
    fieldId: inv.fieldId,
    label: inv.label,
    category: inv.category,
    valueType: inv.valueType,
    result: {
      ok: true as const,
      value: syntheticValue(inv),
      rationale: "smokeFormFill synthetic value",
      supportingFactKeys: [],
    },
  }));

  return {
    formId: meta.formId,
    jurisdiction: meta.jurisdiction,
    title: meta.title,
    taxYear: meta.taxYear,
    mustFile: {
      ok: true,
      value: true,
      rationale: "smokeFormFill",
      supportingFactKeys: [],
    },
    fields,
  };
}

/*
 * ─── Golden serialization ───────────────────────────────────────────────
 *
 * Stable JSON shape: rendered map → sorted array of [fieldId, widgets[]].
 * Widget entries omit absent text/checked fields so the diff is signal-only.
 */

interface GoldenEntry {
  fieldId: string;
  widgets: Array<{ widgetName: string; text?: string; checked?: boolean }>;
}

interface Golden {
  formId: string;
  fieldCount: number;
  entries: GoldenEntry[];
}

function toGolden(
  formId: string,
  fieldCount: number,
  rendered: Map<string, Array<{ widgetName: string; text?: string; checked?: boolean }>>,
): Golden {
  const entries: GoldenEntry[] = [];
  for (const [fieldId, widgets] of rendered) {
    entries.push({
      fieldId,
      widgets: widgets.map((w) => {
        const out: GoldenEntry["widgets"][number] = { widgetName: w.widgetName };
        if (w.text !== undefined) out.text = w.text;
        if (w.checked !== undefined) out.checked = w.checked;
        return out;
      }),
    });
  }
  entries.sort((a, b) => a.fieldId.localeCompare(b.fieldId));
  return { formId, fieldCount, entries };
}

function diffGoldens(expected: Golden, actual: Golden): string[] {
  const diffs: string[] = [];
  if (expected.fieldCount !== actual.fieldCount) {
    diffs.push(`fieldCount: expected=${expected.fieldCount} actual=${actual.fieldCount}`);
  }
  const expById = new Map(expected.entries.map((e) => [e.fieldId, e]));
  const actById = new Map(actual.entries.map((e) => [e.fieldId, e]));
  const allIds = new Set([...expById.keys(), ...actById.keys()]);
  for (const id of allIds) {
    const a = expById.get(id);
    const b = actById.get(id);
    if (!a) {
      diffs.push(`added field: ${id}`);
      continue;
    }
    if (!b) {
      diffs.push(`removed field: ${id}`);
      continue;
    }
    if (JSON.stringify(a.widgets) !== JSON.stringify(b.widgets)) {
      diffs.push(
        `changed: ${id}\n  expected: ${JSON.stringify(a.widgets)}\n  actual:   ${JSON.stringify(b.widgets)}`,
      );
    }
  }
  return diffs;
}

/*
 * ─── Programmatic entry (used by runAll) ────────────────────────────────
 *
 * Returns a RunResult with the same shape `runScenario` produces. runAll.ts
 * can then aggregate catalog-fill checks and scenario runs in one table.
 * Failures collect as strings instead of thrown errors. Partial info shows
 * what changed across all forms in one pre-commit pass; a stack trace
 * stops at the first form.
 */

export async function runCatalogFillCheck(formId: string): Promise<RunResult> {
  const t0 = Date.now();
  const failures: string[] = [];
  try {
    const catalogPath = lookupCatalogPath(formId);
    const formDir = catalogPath.replace(/\/catalog\.json$/, "");
    const blankPath = join(formDir, "blank.pdf");
    const goldenPath = join(formDir, "catalog-fill-golden.json");

    const catalog = await loadFromFixture(catalogPath);
    const fieldCount = catalog.getFields(formId).length;
    const blankPdfBytes = await fs.readFile(blankPath);
    const form = buildSyntheticForm(formId, catalog);
    const { pdfBytes, rendered, warnings } = await fillFromCatalog({
      blankPdfBytes,
      form,
      catalog,
    });

    /*
     * Write the rendered PDF on every run, green or red. The operator can
     * open it to confirm a diff is real.
     */
    await fs.writeFile(`/tmp/smoke-${formId}.pdf`, pdfBytes);

    /*
     * Layer 1: render warnings. The catalog references a widget the PDF
     * cannot satisfy (wrong name, wrong type, overflow after fallbacks).
     */
    for (const w of warnings) failures.push(`render warning: ${w}`);

    /*
     * Layer 2: every field must produce at least one rendered widget. The
     * renderer silently skips fields with undefined values (e.g. selects
     * with empty options). Surface those as missing.
     */
    if (rendered.size !== fieldCount) {
      const renderedIds = new Set(rendered.keys());
      const missing = catalog
        .getFields(formId)
        .map((f) => f.fieldId)
        .filter((id) => !renderedIds.has(id));
      const head = missing.slice(0, 5).join(", ");
      const tail = missing.length > 5 ? `…+${missing.length - 5}` : "";
      failures.push(
        `rendered ${rendered.size}/${fieldCount} fields; missing ${missing.length}: ${head}${tail}`,
      );
    }

    /*
     * Layer 3: diff against the golden. A missing golden file is itself a
     * failure. A form added without a bootstrapped snapshot then shows red
     * in the runAll table instead of silently green.
     */
    const actual = toGolden(formId, fieldCount, rendered);
    let expectedRaw: string;
    try {
      expectedRaw = await fs.readFile(goldenPath, "utf8");
    } catch {
      failures.push(
        `no golden at ${goldenPath} — run "npx tsx tests/catalogFill.ts --form-id=${formId} --update"`,
      );
      return {
        name: `catalog-fill:${formId}`,
        passed: false,
        failures,
        durationMs: Date.now() - t0,
      };
    }
    const expected = JSON.parse(expectedRaw) as Golden;
    const diffs = diffGoldens(expected, actual);
    for (const d of diffs.slice(0, 10)) {
      /*
       * Keep only the first line of each diff entry. Multi-line diff
       * bodies make the summary table unreadable.
       */
      failures.push(`diff: ${d.split("\n")[0]}`);
    }
    if (diffs.length > 10) failures.push(`…and ${diffs.length - 10} more diffs`);
  } catch (err) {
    failures.push(err instanceof Error ? err.message : String(err));
  }
  return {
    name: `catalog-fill:${formId}`,
    passed: failures.length === 0,
    failures,
    durationMs: Date.now() - t0,
  };
}

// ─── CLI entry ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const catalogPath = lookupCatalogPath(args.formId);
  const formDir = catalogPath.replace(/\/catalog\.json$/, "");
  const blankPath = join(formDir, "blank.pdf");
  const goldenPath = join(formDir, "catalog-fill-golden.json");

  console.log(`catalog-fill ${args.formId}${args.update ? " (--update)" : ""}`);
  console.log(`  catalog: ${catalogPath}`);
  console.log(`  blank:   ${blankPath}`);
  console.log(`  golden:  ${goldenPath}`);

  /*
   * --update path: bootstrap or refresh the golden, write the PDF, exit.
   * It bypasses the diff check. The operator can re-snapshot after an
   * intentional change without a fail-then-update cycle.
   */
  if (args.update) {
    const catalog = await loadFromFixture(catalogPath);
    const fieldCount = catalog.getFields(args.formId).length;
    const blankPdfBytes = await fs.readFile(blankPath);
    const form = buildSyntheticForm(args.formId, catalog);
    const { pdfBytes, rendered, warnings } = await fillFromCatalog({
      blankPdfBytes,
      form,
      catalog,
    });
    const outPdfPath = `/tmp/smoke-${args.formId}.pdf`;
    await fs.writeFile(outPdfPath, pdfBytes);
    if (warnings.length > 0) {
      console.error(`\nFAIL: ${warnings.length} render warning(s):`);
      for (const w of warnings) console.error(`  - ${w}`);
      process.exit(1);
    }
    if (rendered.size !== fieldCount) {
      const renderedIds = new Set(rendered.keys());
      const missing = catalog
        .getFields(args.formId)
        .map((f) => f.fieldId)
        .filter((id) => !renderedIds.has(id));
      console.error(
        `\nFAIL: rendered ${rendered.size}/${fieldCount} fields. ` +
          `Missing (${missing.length}): ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? "…" : ""}`,
      );
      process.exit(1);
    }
    const actual = toGolden(args.formId, fieldCount, rendered);
    await fs.writeFile(goldenPath, JSON.stringify(actual, null, 2) + "\n");
    console.log(`\nOK: wrote golden (${actual.entries.length} fields) and PDF`);
    console.log(`  golden: ${goldenPath}`);
    console.log(`  pdf:    ${outPdfPath}`);
    console.log(`\nEyeball the PDF, then commit the golden.`);
    return;
  }

  /*
   * Check path: defer to runCatalogFillCheck so the CLI and runAll share
   * one implementation.
   */
  const result = await runCatalogFillCheck(args.formId);
  if (result.passed) {
    console.log(`\nOK: ${result.name} (${result.durationMs}ms)`);
    console.log(`  pdf: /tmp/smoke-${args.formId}.pdf`);
    return;
  }
  console.error(`\nFAIL: ${result.name} (${result.failures.length} failure(s)):`);
  for (const f of result.failures) console.error(`  - ${f}`);
  console.error(`\nIf the change is intentional, re-run with --update to refresh the golden.`);
  process.exit(1);
}

/*
 * Skip the CLI wrapper when imported; runAll consumes the exports above.
 * The import.meta.url vs argv[1] check is the standard Node pattern.
 */
const isCli = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
