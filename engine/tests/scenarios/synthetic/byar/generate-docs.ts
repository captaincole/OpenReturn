/* Renders Byar's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/byar/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { BYAR, BYAR_TAX_YEAR, supplyK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${BYAR.firstName} ${BYAR.lastName}`,
  tin: "XXX-XX-5884",
  street: BYAR.street,
  cityStateZip: `${BYAR.city}, ${BYAR.state} ${BYAR.zip}`,
  entityType: "Individual",
};

const partnership = { street: "88 Canyon Expressway", cityStateZip: "Canyon, TX 79015" };

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-panhandle-orchard-supply.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    supplyK1,
    { partnership, irsCenter: "Ogden, UT", partner },
    BYAR_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
