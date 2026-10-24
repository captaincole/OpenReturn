import type { TaxFactRow } from "@openreturn/engine/facts";
import { SCENARIOS } from "@openreturn/engine/scenarios";
import path from "node:path";

/*
 * The dataset: every source document in the engine scenarios, paired with
 * the facts it should produce. The facts are the scenario's ground truth
 * (facts.ts), selected by key. Verbal facts (reported basis, HSA coverage,
 * the home-energy questions) are not on a document, so no case asks for
 * them.
 */

export interface IngestCase {
  doc: string;
  /* In the quick tier: one document per type, the fast ones where there is a choice. */
  quick: boolean;
  type: string;
  pdf: string;
  expected: TaxFactRow[];
}

const SCENARIO_DIR = path.resolve(__dirname, "../../../engine/tests/scenarios");

/*
 * [scenario, file, document type, key patterns of the facts it produces].
 * QUICK names the quick-tier documents.
 */
const MANIFEST: [string, string, string, RegExp[]][] = [
  ["alex", "01-alex-w2.pdf", "W-2", [/^employer\./]],
  ["alejandro", "01-alejandro-w2.pdf", "W-2", [/^employer\./]],
  ["alejandro", "02-alejandro-1099.pdf", "Consolidated 1099", [/^account\.apex-individual\./]],
  ["marcus", "01-marcus-w2.pdf", "W-2", [/^employer\./]],
  ["marcus", "02-marcus-1099-wealthfront.pdf", "1099-INT", [/^account\.wealthfront-cash\./]],
  ["marcus", "03-marcus-1099-schwab.pdf", "Consolidated 1099", [/^account\.schwab-brokerage\./]],
  ["jordan", "01-example-corp-w2.pdf", "W-2", [/^employer\./]],
  [
    "jordan",
    "02-example-broker-1099-consolidated.pdf",
    "Consolidated 1099",
    [
      /^account\.example-broker\.(dividends|interest|misc)$/,
      /^account\.example-broker\.trades\.[^.]+$/,
    ],
  ],
  [
    "jordan",
    "03-example-broker-stock-plan-1099.pdf",
    "1099-B",
    [/^account\.example-broker-stock-plan\.trades\./],
  ],
  ["jordan", "04-example-savings-1099-int.pdf", "1099-INT", [/^account\.example-savings\./]],
  [
    "jordan",
    "05-example-exchange-1099-da.pdf",
    "1099-DA",
    [/^account\.example-exchange\.trades\./],
  ],
  [
    "jordan",
    "06-example-exchange-1099-misc.pdf",
    "1099-MISC",
    [/^account\.example-exchange\.misc$/],
  ],
  ["jordan", "07-example-trust-1099-r-code-g.pdf", "1099-R", [/distributions\.code-g$/]],
  ["jordan", "08-example-trust-1099-r-code-h.pdf", "1099-R", [/distributions\.code-h$/]],
  ["jordan", "09-example-hsa-1099-sa.pdf", "1099-SA", [/hsa_distributions\./]],
  ["carter", "01-liberty-trust-1099-r-code-q.pdf", "1099-R", [/^payer\.liberty-trust-company\./]],
  [
    "carter",
    "02-jubilee-retirement-1099-r-code-g.pdf",
    "1099-R",
    [/^payer\.jubilee-retirement-fund\./],
  ],
  ["carter", "03-example-reit-fund-1099-div.pdf", "1099-DIV", [/^account\.example-reit-fund\./]],
  ["carter", "04-ssa-1099.pdf", "SSA-1099", [/^payer\.ssa\./]],
  /*
   * Tara's two employer W-2s (01, 02) are left out for now: they hold an
   * embedded image, and the page rasterizer for local models cannot draw
   * it (unpdf reports "@napi-rs/canvas is not available", though it
   * renders every PDF without images).
   */
  ["tara", "03-household-employee-w-2-copy-d.pdf", "Household W-2", [/\.household_w2$/]],
  ["tara", "04-bay-area-door-invoice.pdf", "Energy invoice", [/^vendor\.bay-area-door/]],
  ["tara", "05-sierra-window-invoice.pdf", "Energy invoice", [/^vendor\.sierra-window/]],
  ["tara", "06-valley-comfort-hvac-invoice.pdf", "Energy invoice", [/^vendor\.valley-comfort/]],
];

const QUICK = new Set([
  "jordan/01-example-corp-w2.pdf",
  "marcus/03-marcus-1099-schwab.pdf",
  "marcus/02-marcus-1099-wealthfront.pdf",
  "jordan/03-example-broker-stock-plan-1099.pdf",
  "jordan/05-example-exchange-1099-da.pdf",
  "jordan/06-example-exchange-1099-misc.pdf",
  "carter/01-liberty-trust-1099-r-code-q.pdf",
  "jordan/09-example-hsa-1099-sa.pdf",
  "carter/03-example-reit-fund-1099-div.pdf",
  "carter/04-ssa-1099.pdf",
  "tara/03-household-employee-w-2-copy-d.pdf",
  "tara/04-bay-area-door-invoice.pdf",
]);

export function loadCases(tier: "quick" | "full"): IngestCase[] {
  const cases = MANIFEST.map(([scenario, file, type, patterns]) => {
    const facts = SCENARIOS.find((s) => s.name === scenario)?.facts ?? [];
    const expected = facts.filter((f) => patterns.some((p) => p.test(f.key)));
    if (!expected.length) throw new Error(`${scenario}/${file}: no expected facts match`);
    const doc = `${scenario}/${file}`;
    return {
      doc,
      quick: QUICK.has(doc),
      type,
      pdf: path.join(SCENARIO_DIR, scenario, "docs", file),
      expected,
    };
  });
  const missing = [...QUICK].filter((d) => !cases.some((c) => c.doc === d));
  if (missing.length) throw new Error(`QUICK names unknown documents: ${missing.join(", ")}`);
  return tier === "full" ? cases : cases.filter((c) => c.quick);
}
