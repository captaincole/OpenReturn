/* Renders Beldeine's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/beldeine/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { BELDEINE, BELDEINE_TAX_YEAR, bakeryK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${BELDEINE.taxpayer.firstName} ${BELDEINE.taxpayer.lastName}`,
  tin: "XXX-XX-8583",
  street: BELDEINE.street,
  cityStateZip: `${BELDEINE.city}, ${BELDEINE.state} ${BELDEINE.zip}`,
  entityType: "Individual",
};

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-llano-bakery-partners.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    bakeryK1,
    {
      partnership: { street: "88 Main St", cityStateZip: "Llano, TX 78643" },
      irsCenter: "Ogden, UT",
      partner,
    },
    BELDEINE_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
