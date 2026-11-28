/* Renders Abell's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/abell/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { ABELL, ABELL_TAX_YEAR, blenderK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${ABELL.taxpayer.firstName} ${ABELL.taxpayer.lastName}`,
  tin: "XXX-XX-7218",
  street: ABELL.street,
  cityStateZip: `${ABELL.city}, ${ABELL.state} ${ABELL.zip}`,
  entityType: "Individual",
};

const partnership = { street: "500 Grain Elevator Road", cityStateZip: "Dimmitt, TX 79027" };

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-panhandle-fuel-partners.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    blenderK1,
    { partnership, irsCenter: "Ogden, UT", partner },
    ABELL_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
