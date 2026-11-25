/* Renders the two installer invoices into docs/: npx tsx tests/scenarios/synthetic/pevara/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  refuelingPropertyInvoicePdf,
  type InvoiceParties,
  type InvoiceWork,
} from "../../documents/refuelingPropertyInvoice.js";
import { DRIVEWAY_CHARGER, GARAGE_CHARGER, PEVARA, TEODOR } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const PARTIES: InvoiceParties = {
  installerName: "Barton Creek Electric LLC",
  installerStreet: "5600 South Congress Avenue",
  installerCityStateZip: "Austin, TX 78745",
  installerPhone: "(512) 555-0160",
  installerEmail: "billing@bartoncreekelectric.example",
  installerLicense: "TECL-TEST-08911",
  customerName: `${PEVARA.firstName} and ${TEODOR.firstName} ${PEVARA.lastName}`,
  customerStreet: PEVARA.street,
  customerCityStateZip: `${PEVARA.city}, ${PEVARA.state} ${PEVARA.zip}`,
};

/*
 * Made-up prices. Texas taxes the charger and the materials of a residential
 * job billed in separate lines, not the labor or the permit; Austin's rate is
 * 8.25%. Each invoice adds to the fact's cost: $4,150 and $2,080.
 */
const SALES_TAX_LABEL = "Sales tax 8.25% (charger and materials)";

const GARAGE_WORK: InvoiceWork = {
  invoiceNumber: "BCE-2025-0411",
  lines: [
    {
      description: "Sample Charger Co. Level 2 charger, model SC-L2-48",
      detail: "48 A, one charging port, hardwired. Condition: new.",
      amountCents: 69_900,
    },
    {
      description: "Materials, dedicated circuit for this charger only",
      detail: "60 A two-pole breaker, 85 ft of 6 AWG copper in conduit, wall mount.",
      amountCents: 90_100,
    },
    {
      description: "Electrical permit and inspection",
      detail: "City of Austin permit 2025-TEST-0411 EP, final inspection passed.",
      amountCents: 16_800,
    },
    { description: "Installation labor", amountCents: 225_000 },
  ],
  salesTaxLabel: SALES_TAX_LABEL,
  salesTaxCents: 13_200,
  paymentMethod: "Visa ending 0000",
};

const DRIVEWAY_WORK: InvoiceWork = {
  invoiceNumber: "BCE-2025-0926",
  lines: [
    {
      description: "Sample Charger Co. Level 2 charger, model SC-L2-40",
      detail: "40 A, one charging port, hardwired. Condition: new.",
      amountCents: 59_900,
    },
    {
      description: "Materials, dedicated circuit for this charger only",
      detail: "Pedestal mount, 50 A two-pole breaker, 20 ft of 6 AWG copper in conduit.",
      amountCents: 40_100,
    },
    {
      description: "Electrical permit and inspection",
      detail: "City of Austin permit 2025-TEST-0926 EP, final inspection passed.",
      amountCents: 14_750,
    },
    { description: "Installation labor", amountCents: 85_000 },
  ],
  salesTaxLabel: SALES_TAX_LABEL,
  salesTaxCents: 8_250,
  paymentMethod: "check no. 1042",
};

async function main() {
  const invoices: Array<[string, Uint8Array]> = [
    [
      "01-invoice-garage-charger.pdf",
      await refuelingPropertyInvoicePdf(GARAGE_CHARGER, PARTIES, GARAGE_WORK),
    ],
    [
      "02-invoice-driveway-charger.pdf",
      await refuelingPropertyInvoicePdf(DRIVEWAY_CHARGER, PARTIES, DRIVEWAY_WORK),
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
