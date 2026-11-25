/* Renders the Form 1099-S into docs/: npx tsx tests/scenarios/synthetic/tylin/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1099SPdf } from "../../documents/form1099S.js";
import { TYLIN, TYLIN_TAX_YEAR, yard1099S } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  const file = "01-1099-s-capitol-valley-title.pdf";
  const pdf = await form1099SPdf(
    yard1099S,
    {
      filerStreet: "1020 J Street, Suite 400",
      filerCityStateZip: "Sacramento, CA 95814",
      transferorName: `${TYLIN.firstName} ${TYLIN.lastName}`,
      transferorTin: "***-**-0461",
      transferorStreet: TYLIN.street,
      transferorCityStateZip: `${TYLIN.city}, ${TYLIN.state} ${TYLIN.zip}`,
      fileNumber: "CVT-25-07152",
    },
    TYLIN_TAX_YEAR,
  );
  await writeFile(join(docsDir, file), pdf);
  console.log(`✓ ${file} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
