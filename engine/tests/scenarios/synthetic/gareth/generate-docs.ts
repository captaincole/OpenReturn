/* Renders the Schedule K-1 (Form 1120-S) into docs/: npx tsx tests/scenarios/synthetic/gareth/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1120SPdf } from "../../documents/scheduleK1Form1120S.js";
import { GARETH, GARETH_TAX_YEAR, stablesK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const cityStateZip = `${GARETH.city}, ${GARETH.state} ${GARETH.zip}`;

async function main() {
  const pdf = await scheduleK1Form1120SPdf(
    stablesK1,
    {
      corporation: { street: GARETH.street, cityStateZip },
      irsCenter: "Ogden, UT",
      shareholder: {
        name: `${GARETH.taxpayer.firstName} ${GARETH.taxpayer.lastName}`,
        tin: "XXX-XX-3201",
        street: GARETH.street,
        cityStateZip,
        entityType: "Individual",
      },
    },
    GARETH_TAX_YEAR,
  );
  const name = "01-schedule-k1-kore-springs-stables.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
