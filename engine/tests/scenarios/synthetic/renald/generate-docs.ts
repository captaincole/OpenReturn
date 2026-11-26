/* Renders Renald's two Schedules K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/renald/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PartnershipK1FactValue } from "../../../../src/facts/index.js";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { RENALD, RENALD_TAX_YEAR, clinicK1, outfitterK1, worksK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${RENALD.taxpayer.firstName} ${RENALD.taxpayer.lastName}`,
  tin: "XXX-XX-3801",
  street: RENALD.street,
  cityStateZip: `${RENALD.city}, ${RENALD.state} ${RENALD.zip}`,
  entityType: "Individual",
};

const K1S: Array<[string, PartnershipK1FactValue, { street: string; cityStateZip: string }]> = [
  [
    "01-schedule-k1-coldwater-furniture-works.pdf",
    worksK1,
    { street: "210 Coldwater Industrial Way", cityStateZip: "San Angelo, TX 76903" },
  ],
  [
    "02-schedule-k1-riverbend-clinic-partners.pdf",
    clinicK1,
    { street: "77 Riverbend Plaza, Suite 4", cityStateZip: "San Angelo, TX 76904" },
  ],
  [
    "03-schedule-k1-pecos-trail-outfitters.pdf",
    outfitterK1,
    { street: "5 Pecos River Landing", cityStateZip: "Pecos, TX 79772" },
  ],
];

async function main() {
  for (const [name, k1, partnership] of K1S) {
    const pdf = await scheduleK1Form1065Pdf(
      k1,
      { partnership, irsCenter: "Ogden, UT", partner },
      RENALD_TAX_YEAR,
    );
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
