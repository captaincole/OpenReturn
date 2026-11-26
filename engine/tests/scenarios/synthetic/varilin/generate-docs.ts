/* Renders the two Forms 1097-BTC and three Forms 1099-INT into docs/: npx tsx tests/scenarios/synthetic/varilin/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { InterestFactValue } from "../../../../src/facts/index.js";
import { form1097BtcPdf, type Form1097BtcParties } from "../../documents/form1097Btc.js";
import { form1099IntPdf, type Form1099IntParties } from "../../documents/form1099Int.js";
import {
  BROKER_INTEREST,
  BROKER_STATEMENT,
  COOPERATIVE_INTEREST,
  COOPERATIVE_STATEMENT,
  VARILIN,
  VARILIN_TAX_YEAR,
  WATER_INTEREST,
} from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const RECIPIENT = {
  recipientName: `${VARILIN.firstName} ${VARILIN.lastName}`,
  recipientTin: "***-**-8920",
  recipientStreet: VARILIN.street,
  recipientCityStateZip: `${VARILIN.city}, ${VARILIN.state} ${VARILIN.zip}`,
};

const BROKER: Form1097BtcParties = {
  filerStreet: "700 North Pine Street, Suite 400",
  filerCityStateZip: "Abilene, TX 79601",
  filerPhone: "(325) 555-0171",
  ...RECIPIENT,
};

const COOPERATIVE: Form1097BtcParties = {
  filerStreet: "12 Cooperative Way",
  filerCityStateZip: "Albany, TX 76430",
  filerPhone: "(325) 555-0182",
  ...RECIPIENT,
};

const interestParties = (
  street: string,
  cityStateZip: string,
  accountNumber: string,
): Form1099IntParties => ({
  payerStreet: street,
  payerCityStateZip: cityStateZip,
  accountNumber,
  ...RECIPIENT,
});

async function main() {
  const interest = (form: InterestFactValue, parties: Form1099IntParties) =>
    form1099IntPdf(form, parties, VARILIN_TAX_YEAR);
  const docs: Array<[string, Uint8Array]> = [
    ["01-1097-btc-brazos-ridge.pdf", await form1097BtcPdf(BROKER_STATEMENT, BROKER)],
    ["02-1097-btc-red-river.pdf", await form1097BtcPdf(COOPERATIVE_STATEMENT, COOPERATIVE)],
    [
      "03-1099-int-brazos-ridge.pdf",
      await interest(
        BROKER_INTEREST,
        interestParties(BROKER.filerStreet, BROKER.filerCityStateZip, "BRS-0000-8920"),
      ),
    ],
    [
      "04-1099-int-red-river.pdf",
      await interest(
        COOPERATIVE_INTEREST,
        interestParties(COOPERATIVE.filerStreet, COOPERATIVE.filerCityStateZip, "RREC-CREB-0451"),
      ),
    ],
    [
      "05-1099-int-lakeview-water.pdf",
      await interest(
        WATER_INTEREST,
        interestParties("40 Lakeshore Drive", "Lakeview, TX 79549", "99999BAB2"),
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
