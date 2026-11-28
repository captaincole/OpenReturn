/* Renders Basel's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/basel/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { BASEL, BASEL_TAX_YEAR, depotK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${BASEL.firstName} ${BASEL.lastName}`,
  tin: "XXX-XX-8932",
  street: BASEL.street,
  cityStateZip: `${BASEL.city}, ${BASEL.state} ${BASEL.zip}`,
  entityType: "Individual",
};

const NAME = "01-schedule-k1-brazos-valley-depot.pdf";

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1065Pdf(
    depotK1,
    {
      partnership: { street: "7100 Interstate 35 North", cityStateZip: "Waco, TX 76705" },
      irsCenter: "Ogden, UT",
      partner,
    },
    BASEL_TAX_YEAR,
  );
  await writeFile(join(docsDir, NAME), pdf);
  console.log(`✓ ${NAME} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
