/* Renders the three fund statements into docs/: npx tsx tests/scenarios/synthetic/leane/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pficFundStatementPdf } from "../../documents/pficFundStatement.js";
import { LEANE, LEANE_TAX_YEAR, nordicIndex, pacificRim, rhineValley } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");
const shareholderName = `${LEANE.firstName} ${LEANE.lastName}`;

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-pfic-rhine-valley.pdf",
      await pficFundStatementPdf(
        rhineValley,
        { shareholderName, accountNumber: "RV-55102-A" },
        LEANE_TAX_YEAR,
      ),
    ],
    [
      "02-pfic-nordic-index.pdf",
      await pficFundStatementPdf(
        nordicIndex,
        { shareholderName, accountNumber: "NB-880431" },
        LEANE_TAX_YEAR,
      ),
    ],
    [
      "03-pfic-pacific-rim.pdf",
      await pficFundStatementPdf(
        pacificRim,
        { shareholderName, accountNumber: "PRG-20417" },
        LEANE_TAX_YEAR,
      ),
    ],
  ];
  for (const [name, bytes] of docs) await writeFile(join(docsDir, name), bytes);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
