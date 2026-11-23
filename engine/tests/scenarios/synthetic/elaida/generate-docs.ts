/* Renders the Schedule K-1 (Form 1120-S) into docs/: npx tsx tests/scenarios/synthetic/elaida/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1120SPdf } from "../../documents/scheduleK1Form1120S.js";
import { ELAIDA, ELAIDA_TAX_YEAR, glassK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const cityStateZip = `${ELAIDA.city}, ${ELAIDA.state} ${ELAIDA.zip}`;

async function main() {
  const pdf = await scheduleK1Form1120SPdf(
    glassK1,
    {
      corporation: { street: ELAIDA.street, cityStateZip },
      irsCenter: "Ogden, UT",
      shareholder: {
        name: `${ELAIDA.spouse.firstName} ${ELAIDA.spouse.lastName}`,
        tin: "XXX-XX-3102",
        street: ELAIDA.street,
        cityStateZip,
        entityType: "Individual",
      },
    },
    ELAIDA_TAX_YEAR,
  );
  const name = "01-schedule-k1-white-tower-glassworks.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
