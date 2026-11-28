/* Renders Dain's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/dain/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { DAIN, DAIN_TAX_YEAR, isotopeK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${DAIN.firstName} ${DAIN.lastName}`,
  tin: "XXX-XX-7213",
  street: DAIN.street,
  cityStateZip: `${DAIN.city}, ${DAIN.state} ${DAIN.zip}`,
  entityType: "Individual",
};

const partnership = { street: "77 Comanche Peak Road", cityStateZip: "Glen Rose, TX 76043" };

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-llano-isotope-partners.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    isotopeK1,
    { partnership, irsCenter: "Ogden, UT", partner },
    DAIN_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
