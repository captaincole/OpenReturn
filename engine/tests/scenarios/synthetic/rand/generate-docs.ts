/* Renders Rand's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/rand/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { RAND, RAND_TAX_YEAR, partnersK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${RAND.taxpayer.firstName} ${RAND.taxpayer.lastName}`,
  tin: "XXX-XX-7210",
  street: RAND.street,
  cityStateZip: `${RAND.city}, ${RAND.state} ${RAND.zip}`,
  entityType: "Individual",
};

const NAME = "01-schedule-k1-gulf-coast-hydrogen-partners.pdf";

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1065Pdf(
    partnersK1,
    {
      partnership: { street: "900 Fuel Cell Way", cityStateZip: "La Porte, TX 77571" },
      irsCenter: "Ogden, UT",
      partner,
    },
    RAND_TAX_YEAR,
  );
  await writeFile(join(docsDir, NAME), pdf);
  console.log(`✓ ${NAME} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
