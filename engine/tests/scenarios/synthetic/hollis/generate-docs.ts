/* Renders the two futures 1099-Bs into docs/: npx tsx tests/scenarios/synthetic/hollis/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1099BFuturesPdf } from "../../documents/form1099BFutures.js";
import { HOLLIS, HOLLIS_TAX_YEAR, mesa, ridgeline } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const recipient = {
  recipientName: `${HOLLIS.firstName} ${HOLLIS.lastName}`,
  recipientTin: "***-**-6781",
  recipientStreet: HOLLIS.street,
  recipientCityStateZip: `${HOLLIS.city}, ${HOLLIS.state} ${HOLLIS.zip}`,
};

const documents = [
  {
    file: "01-1099-b-ridgeline-futures.pdf",
    form: ridgeline,
    payer: {
      payerStreet: "141 W Jackson Blvd, Suite 2200",
      payerCityStateZip: "Chicago, IL 60604",
      payerTin: "00-0006782",
    },
  },
  {
    file: "02-1099-b-mesa-commodity.pdf",
    form: mesa,
    payer: {
      payerStreet: "75 Canyon Ridge Drive",
      payerCityStateZip: "Tempe, AZ 85281",
      payerTin: "00-0006783",
    },
  },
];

async function main() {
  for (const { file, form, payer } of documents) {
    const pdf = await form1099BFuturesPdf(form, { ...payer, ...recipient }, HOLLIS_TAX_YEAR);
    await writeFile(join(docsDir, file), pdf);
    console.log(`✓ ${file} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
