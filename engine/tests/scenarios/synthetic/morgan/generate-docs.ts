/* Renders the girls' 1099-INTs and Ellis's 1099-DIV into docs/: npx tsx tests/scenarios/synthetic/morgan/generate-docs.ts */

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
import { HOME, MORGAN_TAX_YEAR, ellisIncome, wrenIncome } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* A broker that holds Ellis's municipal bonds. */
const BROKER = {
  payerName: "Granite Ridge Brokerage",
  payerTin: "00-0004403",
  payerStreet: "1100 Congress Ave",
  payerCityStateZip: "Austin, TX 78701",
};
/* The index fund the parents own too. */
const FUND = {
  payerName: "Bluebonnet Index Fund",
  payerTin: "00-0004404",
  payerStreet: "PO Box 2215",
  payerCityStateZip: "Dallas, TX 75201",
};
/* Wren's savings account. */
const BANK = {
  payerName: "Pecan Savings Bank",
  payerTin: "00-0004405",
  payerStreet: "12 Main St",
  payerCityStateZip: "Round Rock, TX 78664",
};

const ELLIS = childRecipient("Ellis Morgan", "900-71-4403", HOME);
const WREN = childRecipient("Wren Morgan", "900-71-4404", HOME);

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-1099-int-ellis.pdf",
      await form1099IntPdf(
        childInterestForm(BROKER, ellisIncome),
        { ...BROKER, ...ELLIS, accountNumber: "GRB-30-114403" },
        MORGAN_TAX_YEAR,
      ),
    ],
    [
      "02-1099-div-ellis.pdf",
      await form1099DivPdf(
        childDividendForm(FUND, ellisIncome),
        { ...FUND, ...ELLIS, accountNumber: "BIF-774403" },
        MORGAN_TAX_YEAR,
      ),
    ],
    [
      "03-1099-int-wren.pdf",
      await form1099IntPdf(
        childInterestForm(BANK, wrenIncome),
        { ...BANK, ...WREN, accountNumber: "PSB-0094404" },
        MORGAN_TAX_YEAR,
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
