/* Renders Elam's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/elam/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { ELAM, ELAM_TAX_YEAR, partnershipK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${ELAM.firstName} ${ELAM.lastName}`,
  tin: "XXX-XX-8826",
  street: ELAM.street,
  cityStateZip: `${ELAM.city}, ${ELAM.state} ${ELAM.zip}`,
  entityType: "Individual",
};

const partnership = { street: "2100 Mount Rose Highway", cityStateZip: "Reno, NV 89511" };

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-sierra-bouldering-park.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    partnershipK1,
    { partnership, irsCenter: "Ogden, UT", partner },
    ELAM_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
