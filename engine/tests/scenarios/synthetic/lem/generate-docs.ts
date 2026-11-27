/* Renders Lem's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/lem/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { LEM, celluloseK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${LEM.taxpayer.firstName} ${LEM.taxpayer.lastName}`,
  tin: "XXX-XX-6478",
  street: LEM.street,
  cityStateZip: `${LEM.city}, ${LEM.state} ${LEM.zip}`,
  entityType: "Individual",
  domestic: true,
};

const partnership = { street: "4100 N Cliff Avenue", cityStateZip: "Sioux Falls, SD 57104" };

/*
 * The partnership's tax year began July 1, 2024, so it issues the 2024 form;
 * the year ends in Lem's 2025 tax year, the return that reports it.
 */
const K1_FORM_YEAR = 2024;
const FISCAL_YEAR: [string, string] = ["07/01/2024", "06/30/2025"];

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-big-sioux-cellulose-fuels.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    celluloseK1,
    { partnership, irsCenter: "Ogden, UT", partner, fiscalYear: FISCAL_YEAR },
    K1_FORM_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
