/* Renders Natti's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/natti/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { NATTI, NATTI_TAX_YEAR, oysterBarK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${NATTI.taxpayer.firstName} ${NATTI.taxpayer.lastName}`,
  tin: "XXX-XX-8846",
  street: NATTI.street,
  cityStateZip: `${NATTI.city}, ${NATTI.state} ${NATTI.zip}`,
  entityType: "Individual",
};

const NAME = "01-schedule-k1-saltgrass-oyster-bar.pdf";

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1065Pdf(
    oysterBarK1,
    {
      partnership: { street: "2201 Harborside Drive", cityStateZip: "Galveston, TX 77550" },
      irsCenter: "Ogden, UT",
      partner,
    },
    NATTI_TAX_YEAR,
  );
  await writeFile(join(docsDir, NAME), pdf);
  console.log(`✓ ${NAME} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
