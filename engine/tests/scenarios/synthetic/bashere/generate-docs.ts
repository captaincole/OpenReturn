/* Renders the Form 1098-T into docs/: npx tsx tests/scenarios/synthetic/bashere/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1098TPdf } from "../../documents/form1098T.js";
import { BASHERE, BASHERE_TAX_YEAR, STUDENT_CITY_STATE_ZIP, college1098T } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");
const FILE = "01-mission-trail-1098-t.pdf";

async function main() {
  const pdf = await form1098TPdf(
    college1098T,
    {
      studentStreet: BASHERE.street,
      studentCityStateZip: STUDENT_CITY_STATE_ZIP,
      accountNumber: "MTCC-40817",
    },
    BASHERE_TAX_YEAR,
  );
  await writeFile(join(docsDir, FILE), pdf);
  console.log(`✓ ${FILE} (${pdf.length} bytes) for ${college1098T.studentName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
