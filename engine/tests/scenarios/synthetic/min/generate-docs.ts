/* Renders the Schedule K-1 (Form 1120-S) into docs/: npx tsx tests/scenarios/synthetic/min/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1120SPdf } from "../../documents/scheduleK1Form1120S.js";
import { MIN, MIN_TAX_YEAR, binderyK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const cityStateZip = `${MIN.city}, ${MIN.state} ${MIN.zip}`;

async function main() {
  const pdf = await scheduleK1Form1120SPdf(
    binderyK1,
    {
      corporation: { street: "640 North Division Street", cityStateZip: "Spokane, WA 99202" },
      irsCenter: "Ogden, UT",
      shareholder: {
        name: `${MIN.taxpayer.firstName} ${MIN.taxpayer.lastName}`,
        tin: "XXX-XX-2081",
        street: MIN.street,
        cityStateZip,
        entityType: "Individual",
      },
    },
    MIN_TAX_YEAR,
  );
  const name = "01-schedule-k1-baerlon-bindery.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
