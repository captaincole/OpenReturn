/* Renders the two seller reports into docs/: npx tsx tests/scenarios/synthetic/birgitte/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanVehicleSellerReportPdf,
  type SellerReportParties,
} from "../../documents/cleanVehicleSellerReport.js";
import { BIRGITTE, BIRGITTE_NEW_VEHICLE, BIRGITTE_USED_VEHICLE } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const buyer = {
  buyerName: `${BIRGITTE.firstName} ${BIRGITTE.lastName}`,
  buyerTin: BIRGITTE.ssn,
  buyerStreet: BIRGITTE.street,
  buyerCityStateZip: `${BIRGITTE.city}, ${BIRGITTE.state} ${BIRGITTE.zip}`,
};

const NEW_DEALER: SellerReportParties = {
  ...buyer,
  dealerName: "Eastgate Electric Motorcars LLC",
  dealerTin: "00-0089381",
  dealerStreet: "14600 SE Eastgate Way",
  dealerCityStateZip: "Bellevue, WA 98006",
  confirmationNumber: "ECO-TEST-0000000003",
};

const USED_DEALER: SellerReportParties = {
  ...buyer,
  dealerName: "Factoria Certified Pre-Owned Inc",
  dealerTin: "00-0089382",
  dealerStreet: "3900 Factoria Boulevard SE",
  dealerCityStateZip: "Bellevue, WA 98006",
  confirmationNumber: "ECO-TEST-0000000004",
};

async function main() {
  const reports: Array<[string, Uint8Array]> = [
    [
      "01-seller-report-new-vehicle.pdf",
      await cleanVehicleSellerReportPdf(BIRGITTE_NEW_VEHICLE, NEW_DEALER),
    ],
    [
      "02-seller-report-previously-owned-vehicle.pdf",
      await cleanVehicleSellerReportPdf(BIRGITTE_USED_VEHICLE, USED_DEALER),
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
