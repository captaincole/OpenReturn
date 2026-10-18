/*
 * Make jordan's two 1099-R input documents as payer-style statements
 * (tests/helpers/form1099RDoc.ts). Box values come from facts.ts.
 *
 *   npx tsx tests/scenarios/jordan/generate-docs.ts
 *
 * Emits docs/07-example-trust-1099-r-code-g.pdf and
 * docs/08-example-trust-1099-r-code-h.pdf. jordan's other documents
 * are not generated here. The output PDFs are committed; run this again
 * only to change them.
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render1099R, type Form1099RMailing } from "../../helpers/form1099RDoc.js";
import { rolloverG, rolloverH } from "./facts.js";

const DOCS = join(dirname(fileURLToPath(import.meta.url)), "docs");

const mailing = (account: string): Form1099RMailing => ({
  taxYear: 2025,
  payerAddress: ["PO BOX 5000", "MALVERN PA 19355"],
  payerPhone: "1-800-555-0105",
  recipientName: "Jordan A. Sample",
  recipientAddress: ["1500 Example Street", "Oakland, CA 94612"],
  recipientTinMasked: "XXX-XX-0001",
  account,
});

async function main() {
  const outputs: [string, Uint8Array][] = [
    ["07-example-trust-1099-r-code-g.pdf", await render1099R(rolloverG, mailing("EXT-2025-0001"))],
    ["08-example-trust-1099-r-code-h.pdf", await render1099R(rolloverH, mailing("EXT-2025-0002"))],
  ];
  for (const [name, bytes] of outputs) {
    await writeFile(join(DOCS, name), bytes);
    console.log(`wrote docs/${name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
