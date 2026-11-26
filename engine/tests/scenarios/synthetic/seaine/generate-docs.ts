/* Renders the trust's Schedule J (Form 1041) Part IV into docs/: npx tsx tests/scenarios/synthetic/seaine/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleJForm1041PartIVPdf } from "../../documents/scheduleJForm1041PartIV.js";
import { SEAINE, SEAINE_TRUST } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  const name = "01-schedule-j-part-iv.pdf";
  const pdf = await scheduleJForm1041PartIVPdf(SEAINE_TRUST, {
    beneficiaryName: `${SEAINE.firstName} ${SEAINE.lastName}`,
    beneficiaryTin: SEAINE.ssn,
    beneficiaryStreet: SEAINE.street,
    beneficiaryCityStateZip: `${SEAINE.city}, ${SEAINE.state} ${SEAINE.zip}`,
    taxYear: 2025,
  });
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
