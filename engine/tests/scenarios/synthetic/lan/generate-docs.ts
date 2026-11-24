/* Renders Lan's Schedule K-1 (Form 1120-S) into docs/: npx tsx tests/scenarios/synthetic/lan/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1120SPdf } from "../../documents/scheduleK1Form1120S.js";
import { LAN, LAN_TAX_YEAR, fencingK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const cityStateZip = `${LAN.city}, ${LAN.state} ${LAN.zip}`;

async function main() {
  const pdf = await scheduleK1Form1120SPdf(
    fencingK1,
    {
      corporation: { street: LAN.street, cityStateZip },
      irsCenter: "Ogden, UT",
      shareholder: {
        name: `${LAN.spouse.firstName} ${LAN.spouse.lastName}`,
        tin: "XXX-XX-2072",
        street: LAN.street,
        cityStateZip,
        entityType: "Individual",
      },
    },
    LAN_TAX_YEAR,
  );
  const name = "01-schedule-k1-malkier-fencing.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
