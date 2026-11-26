/* Renders the trust's Schedule J (541) Part IV into docs/: npx tsx tests/scenarios/synthetic/cenn/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleJ541PartIVPdf } from "../../documents/scheduleJ541PartIV.js";
import { CENN, CENN_TRUST } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  const name = "01-schedule-j-541-part-iv.pdf";
  const pdf = await scheduleJ541PartIVPdf(CENN_TRUST, {
    beneficiaryName: `${CENN.firstName} ${CENN.lastName}`,
    beneficiaryTin: CENN.ssn,
    beneficiaryStreet: CENN.street,
    beneficiaryCityStateZip: `${CENN.city}, ${CENN.state} ${CENN.zip}`,
    beneficiaryNonresident: false,
    taxYear: 2025,
  });
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
