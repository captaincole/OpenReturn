/* Renders the girls' 1099-INTs and Lucia's 1099-DIV into docs/: npx tsx tests/scenarios/synthetic/verin/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  childDividendForm,
  childInterestForm,
  childRecipient,
} from "../../documents/childForms1099.js";
import { form1099DivPdf } from "../../documents/form1099Div.js";
import { form1099IntPdf } from "../../documents/form1099Int.js";
import { HOME, VERIN_TAX_YEAR, luciaIncome, noorIncome } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* A broker that holds Lucia's Oregon bonds and Noor's Treasury bills. */
const BROKER = {
  payerName: "Capitol Mall Securities",
  payerTin: "00-0006131",
  payerStreet: "500 Capitol Mall, Suite 1200",
  payerCityStateZip: "Sacramento, CA 95814",
};
/* A mutual fund. */
const FUND = {
  payerName: "Sierra Crest Growth Fund",
  payerTin: "00-0006132",
  payerStreet: "PO Box 9180",
  payerCityStateZip: "Denver, CO 80202",
};

const LUCIA = childRecipient("Lucia Castellanos", "400-00-0613", HOME);
const NOOR = childRecipient("Noor Castellanos", "400-00-0614", HOME);

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-1099-int-lucia.pdf",
      await form1099IntPdf(
        childInterestForm(BROKER, luciaIncome),
        { ...BROKER, ...LUCIA, accountNumber: "CMS-UTMA-20613" },
        VERIN_TAX_YEAR,
      ),
    ],
    [
      "02-1099-div-lucia.pdf",
      await form1099DivPdf(
        childDividendForm(FUND, luciaIncome),
        { ...FUND, ...LUCIA, accountNumber: "SCG-448106" },
        VERIN_TAX_YEAR,
      ),
    ],
    [
      "03-1099-int-noor.pdf",
      await form1099IntPdf(
        childInterestForm(BROKER, noorIncome),
        { ...BROKER, ...NOOR, accountNumber: "CMS-UTMA-20614" },
        VERIN_TAX_YEAR,
      ),
    ],
  ];
  for (const [name, pdf] of docs) {
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
