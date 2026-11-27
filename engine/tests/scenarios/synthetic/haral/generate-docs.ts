/* Renders the Form 8609 of the Marrow Court rehabilitation into docs/: npx tsx tests/scenarios/synthetic/haral/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form8609Pdf } from "../../documents/form8609.js";
import { HARAL, MARROW_COURT } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await form8609Pdf(MARROW_COURT, {
    buildingAddress: ["Marrow Court", "912 Cypress Hammock Road", "Sarasota, FL 34237"],
    agencyNameAndAddress: [
      "Suncoast Housing Credit Agency",
      "227 North Bronough Street, Suite 5000",
      "Tallahassee, FL 32301",
    ],
    agencyEin: "00-0008623",
    ownerNameAndAddress: [
      `${HARAL.firstName} ${HARAL.lastName}`,
      HARAL.street,
      `${HARAL.city}, ${HARAL.state} ${HARAL.zip}`,
    ],
    ownerTin: HARAL.ssn,
    allocationDate: "05/04/2015",
    placedInServiceDate: "04/30/2015",
    taxExemptBondPercent: "0",
    allocationBoxes: ["e"],
    minimumSetAside: "40-60",
    agencyOfficial: "Teodora Vance",
    agencySignedOn: "01/22/2016",
    ownerSigner: `${HARAL.firstName} ${HARAL.lastName}`,
    ownerSignedOn: "02/15/2016",
  });
  const name = "01-form-8609-marrow-court.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
