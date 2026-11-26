/* Renders Berowyn's three Forms 1099-C into docs/: npx tsx tests/scenarios/synthetic/berowyn/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1099CPdf, type Form1099CParties } from "../../documents/form1099C.js";
import { BEROWYN, BEROWYN_TAX_YEAR, FORM_1099C } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const debtor = {
  debtorName: `${BEROWYN.firstName} ${BEROWYN.lastName}`,
  debtorTin: `***-**-${BEROWYN.ssn.slice(-4)}`,
  debtorStreet: BEROWYN.street,
  debtorCityStateZip: `${BEROWYN.city}, ${BEROWYN.state} ${BEROWYN.zip}`,
};

/* Each creditor's own details: invented, and not in any fact. */
const FORMS: Array<[keyof typeof FORM_1099C, string, Omit<Form1099CParties, keyof typeof debtor>]> =
  [
    [
      "card",
      "01-golden-bear-bank-1099c.pdf",
      {
        creditorStreet: "PO Box 4410",
        creditorCityStateZip: "Oakland, CA 94604",
        creditorPhone: "800-555-0131",
        accountNumber: "XXXX-XXXX-XXXX-2208",
      },
    ],
    [
      "home",
      "02-sierra-gold-mortgage-1099c.pdf",
      {
        creditorStreet: "77 Capitol Mall, Suite 900",
        creditorCityStateZip: "Sacramento, CA 95814",
        creditorPhone: "916-555-0162",
        accountNumber: "SGM-3390417",
      },
    ],
    [
      "car",
      "03-delta-auto-finance-1099c.pdf",
      {
        creditorStreet: "2600 Stockton Boulevard",
        creditorCityStateZip: "Sacramento, CA 95817",
        creditorPhone: "916-555-0120",
        accountNumber: "DAF-118206",
      },
    ],
  ];

async function main() {
  for (const [which, name, creditor] of FORMS) {
    const pdf = await form1099CPdf(
      FORM_1099C[which].value,
      { ...debtor, ...creditor },
      BEROWYN_TAX_YEAR,
    );
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
