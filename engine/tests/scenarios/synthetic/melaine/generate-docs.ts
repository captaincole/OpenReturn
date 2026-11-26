/* Renders the recapture tax notice into docs/: npx tsx tests/scenarios/synthetic/melaine/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { recaptureTaxNoticePdf, type NoticeParties } from "../../documents/recaptureTaxNotice.js";
import { MELAINE, MELAINE_NOTICE } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* The issuer's address and the loan number are made up. */
const PARTIES: NoticeParties = {
  issuerStreet: "315 Granite Shoals Avenue, Suite 210",
  issuerCityStateZip: "Brazos Bend, TX 76599",
  borrowerName: `${MELAINE.firstName} ${MELAINE.lastName}`,
  loanNumber: "BB-2020-04417",
};

async function main() {
  const name = "01-recapture-tax-notice.pdf";
  await mkdir(docsDir, { recursive: true });
  const pdf = await recaptureTaxNoticePdf(MELAINE_NOTICE, PARTIES);
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
