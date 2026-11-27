/* Renders the Form 8332 Davin signed for Tobin into docs/: npx tsx tests/scenarios/synthetic/ellorien/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form8332Pdf } from "../../documents/form8332.js";
import { DAVIN, ELLORIEN, TOBIN, TOBIN_RELEASE } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  const pdf = await form8332Pdf(TOBIN_RELEASE, {
    noncustodialParentName: `${ELLORIEN.firstName} ${ELLORIEN.lastName}`,
    noncustodialParentSsn: ELLORIEN.ssn,
    childName: `${TOBIN.firstName} ${TOBIN.lastName}`,
    custodialParentName: `${DAVIN.firstName} ${DAVIN.lastName}`,
    signedOn: "01/12/2026",
  });
  const name = "01-form-8332-tobin-tarvale.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
