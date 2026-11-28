/* Renders Nieda's Schedule K-1 (Form 1120-S) into docs/: npx tsx tests/scenarios/synthetic/nieda/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1120SPdf } from "../../documents/scheduleK1Form1120S.js";
import { NIEDA, NIEDA_TAX_YEAR, terminalK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  await mkdir(docsDir, { recursive: true });
  const pdf = await scheduleK1Form1120SPdf(
    terminalK1,
    {
      corporation: { street: "800 Grain Road", cityStateZip: "Hereford, TX 79045" },
      irsCenter: "Ogden, UT",
      shareholder: {
        name: `${NIEDA.taxpayer.firstName} ${NIEDA.taxpayer.lastName}`,
        tin: "XXX-XX-8900",
        street: NIEDA.street,
        cityStateZip: `${NIEDA.city}, ${NIEDA.state} ${NIEDA.zip}`,
        entityType: "Individual",
      },
    },
    NIEDA_TAX_YEAR,
  );
  const name = "01-schedule-k1-llano-grain-terminal.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
