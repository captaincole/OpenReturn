/*
 * Renders Leane's fund documents into docs/: an account statement for each
 * fund, and the PFIC Annual Information Statement of the QEF.
 * npx tsx tests/scenarios/synthetic/leane/generate-docs.ts
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fundAccountStatementPdf } from "../../documents/fundAccountStatement.js";
import { pficAnnualInformationStatementPdf } from "../../documents/pficFundStatement.js";
import { LEANE, LEANE_TAX_YEAR, nordicIndex, pacificRim, rhineValley } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");
const holderName = `${LEANE.firstName} ${LEANE.lastName}`;
const account = (fund: typeof rhineValley, accountNumber: string) =>
  fundAccountStatementPdf(fund, { holderName, accountNumber }, LEANE_TAX_YEAR);

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    ["01-pfic-rhine-valley.pdf", await account(rhineValley, "RV-55102-A")],
    ["02-pfic-nordic-index.pdf", await account(nordicIndex, "NB-880431")],
    [
      "03-pfic-pacific-rim.pdf",
      await pficAnnualInformationStatementPdf(
        pacificRim,
        { name: "Mira Tolland", title: "Chief Financial Officer", signed: "March 2, 2026" },
        LEANE_TAX_YEAR,
      ),
    ],
    ["04-pfic-pacific-rim-account.pdf", await account(pacificRim, "PRG-20417")],
  ];
  for (const [name, bytes] of docs) await writeFile(join(docsDir, name), bytes);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
