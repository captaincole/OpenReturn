/* Renders the Form 1099-S and the Form 1099-DIV into docs/: npx tsx tests/scenarios/synthetic/berelain/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1099DivPdf } from "../../documents/form1099Div.js";
import { form1099SPdf } from "../../documents/form1099S.js";
import { BERELAIN, BERELAIN_TAX_YEAR, closing1099S, reitFund } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const NAME = `${BERELAIN.firstName} ${BERELAIN.lastName}`;
const TIN = "***-**-4797";
const CITY_STATE_ZIP = `${BERELAIN.city}, ${BERELAIN.state} ${BERELAIN.zip}`;

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-1099-s-llano-estacado-title.pdf",
      await form1099SPdf(
        closing1099S,
        {
          filerStreet: "2201 Broadway, Suite 300",
          filerCityStateZip: "Lubbock, TX 79401",
          transferorName: NAME,
          transferorTin: TIN,
          transferorStreet: BERELAIN.street,
          transferorCityStateZip: CITY_STATE_ZIP,
          fileNumber: "LET-25-08817",
        },
        BERELAIN_TAX_YEAR,
      ),
    ],
    [
      "02-1099-div-high-plains-reit.pdf",
      await form1099DivPdf(
        reitFund,
        {
          payerStreet: "PO Box 64710",
          payerCityStateZip: "Amarillo, TX 79106",
          recipientName: NAME,
          recipientTin: TIN,
          recipientStreet: BERELAIN.street,
          recipientCityStateZip: CITY_STATE_ZIP,
          accountNumber: "HPR-4797-01",
        },
        BERELAIN_TAX_YEAR,
      ),
    ],
  ];
  for (const [file, pdf] of docs) {
    await writeFile(join(docsDir, file), pdf);
    console.log(`✓ ${file} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
