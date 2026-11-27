/* Renders Gill's Schedule K-1 (Form 1120-S) into docs/: npx tsx tests/scenarios/synthetic/gill/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1120SPdf } from "../../documents/scheduleK1Form1120S.js";
import { GILL, GILL_TAX_YEAR, kitchenK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1120SPdf(
    kitchenK1,
    {
      corporation: { street: "310 Commerce Street", cityStateZip: "Fort Worth, TX 76102" },
      irsCenter: "Ogden, UT",
      shareholder: {
        name: `${GILL.firstName} ${GILL.lastName}`,
        tin: "XXX-XX-8881",
        street: GILL.street,
        cityStateZip: `${GILL.city}, ${GILL.state} ${GILL.zip}`,
        entityType: "Individual",
      },
    },
    GILL_TAX_YEAR,
  );
  const name = "01-schedule-k1-trinity-commissary-kitchen.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
