/* Renders Jac's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/jac/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { JAC, JAC_TAX_YEAR, staffingK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${JAC.taxpayer.firstName} ${JAC.taxpayer.lastName}`,
  tin: "XXX-XX-8882",
  street: JAC.street,
  cityStateZip: `${JAC.city}, ${JAC.state} ${JAC.zip}`,
  entityType: "Individual",
};

const NAME = "01-schedule-k1-hill-country-staffing.pdf";

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1065Pdf(
    staffingK1,
    {
      partnership: { street: "811 Sundance Parkway", cityStateZip: "Round Rock, TX 78681" },
      irsCenter: "Ogden, UT",
      partner,
    },
    JAC_TAX_YEAR,
  );
  await writeFile(join(docsDir, NAME), pdf);
  console.log(`✓ ${NAME} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
