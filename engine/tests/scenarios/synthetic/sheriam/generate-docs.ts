/*
 * Renders the couple's fund documents into docs/: an account statement for
 * each fund, and the PFIC Annual Information Statement of the QEF.
 * npx tsx tests/scenarios/synthetic/sheriam/generate-docs.ts
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fundAccountStatementPdf } from "../../documents/fundAccountStatement.js";
import { pficAnnualInformationStatementPdf } from "../../documents/pficFundStatement.js";
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
const account = (fund: typeof alpineBalanced, holderName: string, accountNumber: string) =>
  fundAccountStatementPdf(fund, { holderName, accountNumber }, SHERIAM_TAX_YEAR);

async function main() {
  const docs: Array<[string, Uint8Array]> = [
    [
      "01-pfic-alpine-balanced.pdf",
      await pficAnnualInformationStatementPdf(
        alpineBalanced,
        { name: "Lukas Brenner", title: "Head of Fund Accounting", signed: "February 20, 2026" },
        SHERIAM_TAX_YEAR,
      ),
    ],
    ["02-pfic-cape-horizon.pdf", await account(capeHorizon, joint, "CH-210988")],
    ["03-pfic-baltic-tech.pdf", await account(balticTech, sheriam, "BTL-40552")],
    ["04-pfic-alpine-balanced-account.pdf", await account(alpineBalanced, sheriam, "ABF-7731")],
  ];
  for (const [name, bytes] of docs) await writeFile(join(docsDir, name), bytes);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
