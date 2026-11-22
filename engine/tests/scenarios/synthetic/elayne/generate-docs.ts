/* Renders the two seller reports into docs/: npx tsx tests/scenarios/synthetic/elayne/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanVehicleSellerReportPdf,
  type SellerReportParties,
} from "../../documents/cleanVehicleSellerReport.js";
import { ELAYNE, ELAYNE_NEW_VEHICLE, ELAYNE_USED_VEHICLE } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const buyer = {
  buyerName: `${ELAYNE.firstName} ${ELAYNE.lastName}`,
  buyerTin: ELAYNE.ssn,
  buyerStreet: ELAYNE.street,
  buyerCityStateZip: `${ELAYNE.city}, ${ELAYNE.state} ${ELAYNE.zip}`,
};

const NEW_DEALER: SellerReportParties = {
  ...buyer,
  dealerName: "Chisholm Trail Electric Motors LLC",
  dealerTin: "00-0089361",
  dealerStreet: "4100 North Interstate 35",
  dealerCityStateZip: "Round Rock, TX 78664",
  confirmationNumber: "ECO-TEST-0000000001",
};

const USED_DEALER: SellerReportParties = {
  ...buyer,
  dealerName: "Pecan Street Pre-Owned Autos Inc",
  dealerTin: "00-0089362",
  dealerStreet: "1800 West Pecan Street",
  dealerCityStateZip: "Pflugerville, TX 78660",
  confirmationNumber: "ECO-TEST-0000000002",
};

async function main() {
  const reports: Array<[string, Uint8Array]> = [
    [
      "01-seller-report-new-vehicle.pdf",
      await cleanVehicleSellerReportPdf(ELAYNE_NEW_VEHICLE, NEW_DEALER),
    ],
    [
      "02-seller-report-previously-owned-vehicle.pdf",
      await cleanVehicleSellerReportPdf(ELAYNE_USED_VEHICLE, USED_DEALER),
    ],
  ];
  for (const [name, pdf] of reports) {
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
