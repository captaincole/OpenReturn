/* Renders the two installer invoices into docs/: npx tsx tests/scenarios/synthetic/pevara/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  refuelingPropertyInvoicePdf,
  type InvoiceParties,
} from "../../documents/refuelingPropertyInvoice.js";
import { DRIVEWAY_CHARGER, GARAGE_CHARGER, PEVARA, TEODOR } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const parties = (invoiceNumber: string): InvoiceParties => ({
  installerName: "Barton Creek Electric LLC",
  installerStreet: "5600 South Congress Avenue",
  installerCityStateZip: "Austin, TX 78745",
  installerLicense: "TECL-TEST-08911",
  invoiceNumber,
  customerName: `${PEVARA.firstName} and ${TEODOR.firstName} ${PEVARA.lastName}`,
  customerStreet: PEVARA.street,
  customerCityStateZip: `${PEVARA.city}, ${PEVARA.state} ${PEVARA.zip}`,
});

async function main() {
  const invoices: Array<[string, Uint8Array]> = [
    [
      "01-invoice-garage-charger.pdf",
      await refuelingPropertyInvoicePdf(GARAGE_CHARGER, parties("BCE-2025-0411")),
    ],
    [
      "02-invoice-driveway-charger.pdf",
      await refuelingPropertyInvoicePdf(DRIVEWAY_CHARGER, parties("BCE-2025-0926")),
    ],
  ];
  for (const [name, pdf] of invoices) {
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
