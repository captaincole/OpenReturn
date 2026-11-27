/* Renders Cowin's Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/cowin/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import { COWIN, COWIN_TAX_YEAR, opticsK1 } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner = {
  name: `${COWIN.firstName} ${COWIN.lastName}`,
  tin: "XXX-XX-6765",
  street: COWIN.street,
  cityStateZip: `${COWIN.city}, ${COWIN.state} ${COWIN.zip}`,
  entityType: "Individual",
};

const partnership = { street: "620 Eastlake Avenue East", cityStateZip: "Seattle, WA 98109" };

async function main() {
  await mkdir(docsDir, { recursive: true });
  const name = "01-schedule-k1-larkspur-optics-partners.pdf";
  const pdf = await scheduleK1Form1065Pdf(
    opticsK1,
    { partnership, irsCenter: "Ogden, UT", partner },
    COWIN_TAX_YEAR,
  );
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
