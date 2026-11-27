/* Renders Alar's Form 8609 and Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/alar/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form8609Pdf } from "../../documents/form8609.js";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { ALAR, ALAR_TAX_YEAR, juniperK1, SAGEBRUSH } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const owner = [
  `${ALAR.firstName} ${ALAR.lastName}`,
  ALAR.street,
  `${ALAR.city}, ${ALAR.state} ${ALAR.zip}`,
];

async function form8609() {
  return form8609Pdf(SAGEBRUSH, {
    buildingAddress: ["Sagebrush Terrace", "4120 Mill Creek Road", "Reno, NV 89502"],
    agencyNameAndAddress: [
      "High Desert Housing Credit Division",
      "1830 College Parkway, Suite 200",
      "Carson City, NV 89706",
    ],
    agencyEin: "00-0008624",
    ownerNameAndAddress: owner,
    ownerTin: ALAR.ssn,
    allocationDate: "06/12/2018",
    placedInServiceDate: "03/18/2019",
    taxExemptBondPercent: "0",
    allocationBoxes: ["b"],
    minimumSetAside: "40-60",
    agencyOfficial: "Ottoline Brasher",
    agencySignedOn: "01/29/2020",
    ownerSigner: `${ALAR.firstName} ${ALAR.lastName}`,
    ownerSignedOn: "02/20/2020",
  });
}

async function scheduleK1() {
  return scheduleK1Form1065Pdf(
    juniperK1,
    {
      partnership: { street: "77 Juniper Flats Road", cityStateZip: "Elko, NV 89801" },
      irsCenter: "Ogden, UT",
      partner: {
        name: `${ALAR.firstName} ${ALAR.lastName}`,
        tin: "XXX-XX-8586",
        street: ALAR.street,
        cityStateZip: `${ALAR.city}, ${ALAR.state} ${ALAR.zip}`,
        entityType: "Individual",
      },
    },
    ALAR_TAX_YEAR,
  );
}

async function main() {
  await mkdir(docsDir, { recursive: true });
  const documents: Array<[string, Uint8Array]> = [
    ["01-form-8609-sagebrush-terrace.pdf", await form8609()],
    ["02-schedule-k1-juniper-flats-housing.pdf", await scheduleK1()],
  ];
  for (const [name, pdf] of documents) {
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
