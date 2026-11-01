import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { loadFromFixture, type Catalog, type FieldInventory } from "../../src/catalog.js";
import { fillFromCatalog } from "../../src/render/fillFromCatalog.js";
import type { AnyFormField, EvaluatedForm } from "../../src/types.js";
import { blankPdfPath, catalogPath, catalogTaxYear } from "../helpers/formPaths.js";
import type { RunResult } from "../types.js";

interface Args {
  formId: string;
  update: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const arg = argv.find((candidate) => candidate.startsWith(`${flag}=`));
    return arg ? arg.slice(flag.length + 1) : undefined;
  };
  const formId = get("--form-id");
  const update = argv.includes("--update");
  if (!formId) {
    throw new Error("Required: --form-id=<formId>. Optional: --update.");
  }
  return { formId, update };
}

import { FORMS, getFormSpec } from "../../src/registry.js";

export const CATALOGS = FORMS;

const GOLDEN_DIR = join(__dirname, "catalog-fill");

function formPaths(formId: string): { catalogPath: string; blankPath: string; goldenPath: string } {
  const spec = getFormSpec(formId);
  return {
    catalogPath: catalogPath(spec),
    blankPath: blankPdfPath({ relativeDir: spec.relativeDir, taxYear: catalogTaxYear(spec) }),
    goldenPath: join(GOLDEN_DIR, `${spec.relativeDir}.json`),
  };
}

/* Each value is unique per field, so two fields that share one widget show as wrong text. */

function hashFieldId(id: string): number {
  return createHash("sha256").update(id).digest().readUInt32BE(0);
}

function syntheticValue(field: FieldInventory): unknown {
  const seed = hashFieldId(field.fieldId);
  const tag = seed.toString(36).slice(0, 5).toUpperCase();
  const rich = field.valueTypeRich ?? field.valueType;

  /*
   * A longer value would overflow a small field, and the renderer's
   * maxLength-expanding fallback would hide that bug. Fill exactly maxLength.
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
      return `T-${tag}`;
  }
}

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
    missingInputs: [],
    mustFile: {
      ok: true,
      value: true,
      rationale: "smokeFormFill",
      supportingFactKeys: [],
    },
    fields,
  };
}

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
      widgets: widgets.map((widget) => {
        const out: GoldenEntry["widgets"][number] = { widgetName: widget.widgetName };
        if (widget.text !== undefined) out.text = widget.text;
        if (widget.checked !== undefined) out.checked = widget.checked;
        return out;
      }),
    });
  }
  entries.sort((left, right) => left.fieldId.localeCompare(right.fieldId));
  return { formId, fieldCount, entries };
}

function diffGoldens(expected: Golden, actual: Golden): string[] {
  const diffs: string[] = [];
  if (expected.fieldCount !== actual.fieldCount) {
    diffs.push(`fieldCount: expected=${expected.fieldCount} actual=${actual.fieldCount}`);
  }
  const expById = new Map(expected.entries.map((entry) => [entry.fieldId, entry]));
  const actById = new Map(actual.entries.map((entry) => [entry.fieldId, entry]));
  const allIds = new Set([...expById.keys(), ...actById.keys()]);
  for (const id of allIds) {
    const expectedEntry = expById.get(id);
    const actualEntry = actById.get(id);
    if (!expectedEntry) {
      diffs.push(`added field: ${id}`);
      continue;
    }
    if (!actualEntry) {
      diffs.push(`removed field: ${id}`);
      continue;
    }
    if (JSON.stringify(expectedEntry.widgets) !== JSON.stringify(actualEntry.widgets)) {
      diffs.push(
        `changed: ${id}\n  expected: ${JSON.stringify(expectedEntry.widgets)}\n  actual:   ${JSON.stringify(actualEntry.widgets)}`,
      );
    }
  }
  return diffs;
}

export async function runCatalogFillCheck(formId: string): Promise<RunResult> {
  const t0 = Date.now();
  const failures: string[] = [];
  try {
    const { catalogPath, blankPath, goldenPath } = formPaths(formId);

    const catalog = await loadFromFixture(catalogPath);
    const fieldCount = catalog.getFields(formId).length;
    const blankPdfBytes = await fs.readFile(blankPath);
    const form = buildSyntheticForm(formId, catalog);
    const { pdfBytes, rendered, warnings } = await fillFromCatalog({
      blankPdfBytes,
      form,
      catalog,
    });

    await fs.writeFile(`/tmp/smoke-${formId}.pdf`, pdfBytes);

    for (const warning of warnings) failures.push(`render warning: ${warning}`);

    /* The renderer silently skips fields with undefined values (e.g. selects with no options). */
    if (rendered.size !== fieldCount) {
      const renderedIds = new Set(rendered.keys());
      const missing = catalog
        .getFields(formId)
        .map((field) => field.fieldId)
        .filter((id) => !renderedIds.has(id));
      const head = missing.slice(0, 5).join(", ");
      const tail = missing.length > 5 ? `…+${missing.length - 5}` : "";
      failures.push(
        `rendered ${rendered.size}/${fieldCount} fields; missing ${missing.length}: ${head}${tail}`,
      );
    }

    /* A missing golden is a failure, so a new form without one shows red. */
    const actual = toGolden(formId, fieldCount, rendered);
    let expectedRaw: string;
    try {
      expectedRaw = await fs.readFile(goldenPath, "utf8");
    } catch {
      failures.push(
        `no golden at ${goldenPath} — run "npx tsx tests/golden/catalogFill.ts --form-id=${formId} --update"`,
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
    for (const diff of diffs.slice(0, 10)) {
      failures.push(`diff: ${diff.split("\n")[0]}`);
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const { catalogPath, blankPath, goldenPath } = formPaths(args.formId);

  console.log(`catalog-fill ${args.formId}${args.update ? " (--update)" : ""}`);
  console.log(`  catalog: ${catalogPath}`);
  console.log(`  blank:   ${blankPath}`);
  console.log(`  golden:  ${goldenPath}`);

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
      for (const warning of warnings) console.error(`  - ${warning}`);
      process.exit(1);
    }
    if (rendered.size !== fieldCount) {
      const renderedIds = new Set(rendered.keys());
      const missing = catalog
        .getFields(args.formId)
        .map((field) => field.fieldId)
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

  const result = await runCatalogFillCheck(args.formId);
  if (result.passed) {
    console.log(`\nOK: ${result.name} (${result.durationMs}ms)`);
    console.log(`  pdf: /tmp/smoke-${args.formId}.pdf`);
    return;
  }
  console.error(`\nFAIL: ${result.name} (${result.failures.length} failure(s)):`);
  for (const failure of result.failures) console.error(`  - ${failure}`);
  console.error(`\nIf the change is intentional, re-run with --update to refresh the golden.`);
  process.exit(1);
}

const isCli = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
