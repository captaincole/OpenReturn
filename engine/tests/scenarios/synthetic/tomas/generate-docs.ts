/* Renders Juniper's 1099-INT and 1099-DIV into docs/: npx tsx tests/scenarios/synthetic/tomas/generate-docs.ts */

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
import { HOME, TOMAS_TAX_YEAR, juniperIncome } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* A broker that holds Juniper's Treasury bills. */
const BROKER = {
  payerName: "Grand Lake Brokerage",
  payerTin: "00-0007131",
  payerStreet: "3300 Lakeshore Ave",
  payerCityStateZip: "Oakland, CA 94610",
};
/* A mutual fund. */
const FUND = {
  payerName: "Redwood Dividend Fund",
  payerTin: "00-0007132",
  payerStreet: "PO Box 7713",
  payerCityStateZip: "Kansas City, MO 64105",
};

const JUNIPER = childRecipient("Juniper Albrecht", "400-00-0713", HOME);

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-1099-int-juniper.pdf",
      await form1099IntPdf(
        childInterestForm(BROKER, juniperIncome),
        { ...BROKER, ...JUNIPER, accountNumber: "GLB-UTMA-0713" },
        TOMAS_TAX_YEAR,
      ),
    ],
    [
      "02-1099-div-juniper.pdf",
      await form1099DivPdf(
        childDividendForm(FUND, juniperIncome),
        { ...FUND, ...JUNIPER, accountNumber: "RDF-207713" },
        TOMAS_TAX_YEAR,
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
