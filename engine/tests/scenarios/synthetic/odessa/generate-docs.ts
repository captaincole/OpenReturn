/* Renders the savings bond record into docs/: npx tsx tests/scenarios/synthetic/odessa/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSavingsBondCashedFacts } from "../../../../src/facts/index.js";
import { savingsBondRecordPdf } from "../../documents/savingsBondRecord.js";
import { ODESSA, ODESSA_TAX_YEAR, odessaFacts } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* The bond rows are the value objects of the scenario's bond facts, in their order. */
const bonds = getSavingsBondCashedFacts(odessaFacts).map((fact) => fact.value);

async function main() {
  const name = "01-savings-bonds-cashed.pdf";
  const pdf = await savingsBondRecordPdf(bonds, {
    ownerName: `${ODESSA.firstName} ${ODESSA.lastName}`,
    taxYear: ODESSA_TAX_YEAR,
  });
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
