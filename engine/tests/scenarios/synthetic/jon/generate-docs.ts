/* Renders Jon's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/jon/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { JON, JON_TAX_YEAR, partnershipK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${JON.taxpayer.firstName} ${JON.taxpayer.lastName}`,
  tin: "XXX-XX-8820",
  street: JON.street,
  cityStateZip: `${JON.city}, ${JON.state} ${JON.zip}`,
  entityType: "Individual",
};

const NAME = "01-schedule-k1-halvorn-rare-therapeutics.pdf";

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1065Pdf(
    partnershipK1,
    {
      partnership: { street: "1100 Eastlake Avenue East", cityStateZip: "Seattle, WA 98109" },
      irsCenter: "Ogden, UT",
      partner,
    },
    JON_TAX_YEAR,
  );
  await writeFile(join(docsDir, NAME), pdf);
  console.log(`✓ ${NAME} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
