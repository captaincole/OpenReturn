/* Renders the three fund statements into docs/: npx tsx tests/scenarios/synthetic/sheriam/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pficFundStatementPdf } from "../../documents/pficFundStatement.js";
import {
  SHERIAM,
  SHERIAM_TAX_YEAR,
  TAVIN,
  alpineBalanced,
  balticTech,
  capeHorizon,
} from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");
const sheriam = `${SHERIAM.firstName} ${SHERIAM.lastName}`;
const joint = `${sheriam} and ${TAVIN.firstName} ${TAVIN.lastName}`;

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-pfic-alpine-balanced.pdf",
      await pficFundStatementPdf(
        alpineBalanced,
        { shareholderName: sheriam, accountNumber: "ABF-7731" },
        SHERIAM_TAX_YEAR,
      ),
    ],
    [
      "02-pfic-cape-horizon.pdf",
      await pficFundStatementPdf(
        capeHorizon,
        { shareholderName: joint, accountNumber: "CH-210988" },
        SHERIAM_TAX_YEAR,
      ),
    ],
    [
      "03-pfic-baltic-tech.pdf",
      await pficFundStatementPdf(
        balticTech,
        { shareholderName: sheriam, accountNumber: "BTL-40552" },
        SHERIAM_TAX_YEAR,
      ),
    ],
  ];
  for (const [name, bytes] of docs) await writeFile(join(docsDir, name), bytes);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
