/* Renders Ailil's three Forms 1099-C into docs/: npx tsx tests/scenarios/synthetic/ailil/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1099CPdf, type Form1099CParties } from "../../documents/form1099C.js";
import { AILIL, AILIL_TAX_YEAR, FORM_1099C } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const debtor = {
  debtorName: `${AILIL.firstName} ${AILIL.lastName}`,
  debtorTin: `***-**-${AILIL.ssn.slice(-4)}`,
  debtorStreet: AILIL.street,
  debtorCityStateZip: `${AILIL.city}, ${AILIL.state} ${AILIL.zip}`,
};

/* Each creditor's own details: invented, and not in any fact. */
const FORMS: Array<[keyof typeof FORM_1099C, string, Omit<Form1099CParties, keyof typeof debtor>]> =
  [
    [
      "card",
      "01-lone-star-card-1099c.pdf",
      {
        creditorStreet: "PO Box 9820",
        creditorCityStateZip: "Lubbock, TX 79408",
        creditorPhone: "800-555-0198",
        accountNumber: "XXXX-XXXX-XXXX-4417",
      },
    ],
    [
      "home",
      "02-caprock-home-lending-1099c.pdf",
      {
        creditorStreet: "5100 Canyon Drive",
        creditorCityStateZip: "Amarillo, TX 79110",
        creditorPhone: "806-555-0144",
        accountNumber: "ML-0062195",
      },
    ],
    [
      "farm",
      "03-panhandle-farm-credit-1099c.pdf",
      {
        creditorStreet: "1200 West Park Avenue",
        creditorCityStateZip: "Hereford, TX 79045",
        creditorPhone: "806-555-0177",
        accountNumber: "OL-77310",
      },
    ],
  ];

async function main() {
  for (const [which, name, creditor] of FORMS) {
    const pdf = await form1099CPdf(
      FORM_1099C[which].value,
      { ...debtor, ...creditor },
      AILIL_TAX_YEAR,
    );
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
