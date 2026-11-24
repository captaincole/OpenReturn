/* Renders Leilwin's Schedule K-1 (Form 1041) into docs/: npx tsx tests/scenarios/synthetic/mat/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1041Pdf } from "../../documents/scheduleK1Form1041.js";
import { MAT, MAT_TAX_YEAR, trustK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  const pdf = await scheduleK1Form1041Pdf(
    trustK1,
    {
      fiduciary: {
        name: "Arad Doman Trust Company, Trustee",
        street: "1200 Guadalupe Street",
        cityStateZip: "Austin, TX 78701",
      },
      beneficiary: {
        name: `${MAT.spouse.firstName} ${MAT.spouse.lastName}`,
        tin: "XXX-XX-2092",
        street: MAT.street,
        cityStateZip: `${MAT.city}, ${MAT.state} ${MAT.zip}`,
        domestic: true,
      },
    },
    MAT_TAX_YEAR,
  );
  const name = "01-schedule-k1-shandalle-family-trust.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
