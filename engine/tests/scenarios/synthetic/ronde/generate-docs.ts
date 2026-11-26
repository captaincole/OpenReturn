/* Renders Ronde's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/ronde/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { RONDE, RONDE_TAX_YEAR, deliveryK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${RONDE.taxpayer.firstName} ${RONDE.taxpayer.lastName}`,
  tin: "XXX-XX-8834",
  street: RONDE.street,
  cityStateZip: `${RONDE.city}, ${RONDE.state} ${RONDE.zip}`,
  entityType: "Individual",
};

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-harbor-electric-delivery.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    deliveryK1,
    {
      partnership: { street: "45 Wharf Street", cityStateZip: "Corpus Christi, TX 78401" },
      irsCenter: "Ogden, UT",
      partner,
    },
    RONDE_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
