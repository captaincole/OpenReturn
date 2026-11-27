/* Renders Jaret's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/jaret/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { JARET, JARET_TAX_YEAR, outfitterK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${JARET.taxpayer.firstName} ${JARET.taxpayer.lastName}`,
  tin: "XXX-XX-8844",
  street: JARET.street,
  cityStateZip: `${JARET.city}, ${JARET.state} ${JARET.zip}`,
  entityType: "Individual",
};

const partnership = { street: "4400 Franklin Ridge Road", cityStateZip: "El Paso, TX 79902" };

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-franklin-ridge-outfitters.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    outfitterK1,
    { partnership, irsCenter: "Ogden, UT", partner },
    JARET_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
