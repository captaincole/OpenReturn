/* Renders Jaim's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/jaim/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { JAIM, JAIM_TAX_YEAR, nurseryK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${JAIM.taxpayer.firstName} ${JAIM.taxpayer.lastName}`,
  tin: "XXX-XX-8941",
  street: JAIM.street,
  cityStateZip: `${JAIM.city}, ${JAIM.state} ${JAIM.zip}`,
  entityType: "Individual",
};

const NAME = "01-schedule-k1-barton-creek-nursery.pdf";

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1065Pdf(
    nurseryK1,
    {
      partnership: { street: "4410 Bee Caves Road", cityStateZip: "Austin, TX 78746" },
      irsCenter: "Ogden, UT",
      partner,
    },
    JAIM_TAX_YEAR,
  );
  await writeFile(join(docsDir, NAME), pdf);
  console.log(`✓ ${NAME} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
