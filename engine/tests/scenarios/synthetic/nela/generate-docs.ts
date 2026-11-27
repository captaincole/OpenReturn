/* Renders Nela's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/nela/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { NELA, NELA_TAX_YEAR, crushK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${NELA.taxpayer.firstName} ${NELA.taxpayer.lastName}`,
  tin: "XXX-XX-8864",
  street: NELA.street,
  cityStateZip: `${NELA.city}, ${NELA.state} ${NELA.zip}`,
  entityType: "Individual",
};

const NAME = "01-schedule-k1-prairie-crush-biofuels.pdf";

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1065Pdf(
    crushK1,
    {
      partnership: { street: "88 Elevator Spur", cityStateZip: "Plainview, TX 79072" },
      irsCenter: "Ogden, UT",
      partner,
    },
    NELA_TAX_YEAR,
  );
  await writeFile(join(docsDir, NAME), pdf);
  console.log(`✓ ${NAME} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
