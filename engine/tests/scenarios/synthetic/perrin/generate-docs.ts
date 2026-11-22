/* Renders the three Forms 1098-T into docs/: npx tsx tests/scenarios/synthetic/perrin/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1098TPdf } from "../../documents/form1098T.js";
import {
  PERRIN,
  PERRIN_TAX_YEAR,
  STUDENT_CITY_STATE_ZIP,
  college1098T,
  graduate1098T,
  university1098T,
} from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const DOCUMENTS = [
  { file: "01-rio-grande-valley-1098-t.pdf", form: university1098T, account: "RGV-551208" },
  { file: "02-sunland-park-1098-t.pdf", form: college1098T, account: "SPCC-20931" },
  { file: "03-franklin-mountains-1098-t.pdf", form: graduate1098T, account: "FMSB-7704" },
];

async function main() {
  for (const { file, form, account } of DOCUMENTS) {
    const pdf = await form1098TPdf(
      form,
      {
        studentStreet: PERRIN.street,
        studentCityStateZip: STUDENT_CITY_STATE_ZIP,
        accountNumber: account,
      },
      PERRIN_TAX_YEAR,
    );
    await writeFile(join(docsDir, file), pdf);
    console.log(`✓ ${file} (${pdf.length} bytes) for ${form.studentName}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
