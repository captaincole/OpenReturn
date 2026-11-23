/* Renders the 1099-DIVs and the fund's foreign income statement into docs/: npx tsx tests/scenarios/synthetic/rand/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { foreignIncomeStatementPdf } from "../../documents/foreignIncomeStatement.js";
import { form1099DivPdf } from "../../documents/form1099Div.js";
import {
  RAND,
  RAND_TAX_YEAR,
  brokerDividends,
  brokerForeignIncome,
  fundDividends,
  fundForeignIncome,
} from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const recipient = {
  recipientName: `${RAND.firstName} ${RAND.lastName}`,
  recipientTin: "***-**-1116",
  recipientStreet: RAND.street,
  recipientCityStateZip: `${RAND.city}, ${RAND.state} ${RAND.zip}`,
};

const FUND = { payerStreet: "PO Box 4410", payerCityStateZip: "Boston, MA 02110" };
const BROKER = { payerStreet: "77 Lakeview Plaza", payerCityStateZip: "Chicago, IL 60601" };

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-1099-div-larchmont.pdf",
      await form1099DivPdf(
        fundDividends,
        { ...FUND, ...recipient, accountNumber: "LIX-0047731" },
        RAND_TAX_YEAR,
      ),
    ],
    [
      "02-foreign-income-larchmont.pdf",
      await foreignIncomeStatementPdf(
        fundForeignIncome,
        {
          payerName: fundDividends.payerName,
          ...FUND,
          recipientName: recipient.recipientName,
          accountNumber: "LIX-0047731",
          box1a: fundDividends.box1a ?? 0,
          box1b: fundDividends.box1b,
          box7: fundDividends.box7,
        },
        RAND_TAX_YEAR,
      ),
    ],
    [
      "03-1099-div-northgate.pdf",
      await form1099DivPdf(
        brokerDividends,
        { ...BROKER, ...recipient, accountNumber: "NG-88213-4", box8: brokerForeignIncome.country },
        RAND_TAX_YEAR,
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
