/* Renders the six foreign statements into docs/: npx tsx tests/scenarios/synthetic/amys/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { foreignAssetStatementPdf } from "../../documents/foreignAssetStatement.js";
import {
  alpenroseFund,
  baselBalances,
  baselCurrent,
  bolognaBalances,
  bolognaInterest,
  bolognaSavings,
  fjordlineDividends,
  fjordlineShares,
  polderInterest,
  polderNote,
  thamesBalances,
  thamesBrokerage,
  thamesDividends,
  thamesSale,
} from "./assets.js";
import { AMYS, AMYS_TAX_YEAR, CORIN } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const amys = `${AMYS.firstName} ${AMYS.lastName}`;
const corin = `${CORIN.firstName} ${CORIN.lastName}`;
const holderAddress = [AMYS.street, `${AMYS.city}, ${AMYS.state} ${AMYS.zip}`, "United States"];

/* Each statement prints the facts as recorded: the account's currency, no U.S. dollar amount. */
const documents = [
  {
    file: "01-banca-saragozza-savings.pdf",
    value: bolognaSavings,
    income: { interest: bolognaInterest },
    holders: `${amys} and ${corin}`,
    balances: bolognaBalances,
  },
  {
    file: "02-thames-crown-custody.pdf",
    value: thamesBrokerage,
    income: { dividends: thamesDividends, trades: [thamesSale] },
    holders: amys,
    balances: thamesBalances,
  },
  {
    file: "03-rheinknie-current.pdf",
    value: baselCurrent,
    income: {},
    holders: amys,
    balances: baselBalances,
  },
  {
    file: "04-fjordline-register.pdf",
    value: fjordlineShares,
    income: { dividends: fjordlineDividends },
    holders: corin,
  },
  {
    file: "05-polder-grid-note.pdf",
    value: polderNote,
    income: { interest: polderInterest },
    holders: amys,
  },
  { file: "06-alpenrose-fund.pdf", value: alpenroseFund, income: {}, holders: amys },
];

async function main() {
  for (const document of documents) {
    const { file, value, income, holders } = document;
    const balances = "balances" in document ? document.balances : undefined;
    const pdf = await foreignAssetStatementPdf(
      value,
      income,
      { holderNames: holders, holderAddress, taxYear: AMYS_TAX_YEAR },
      balances,
    );
    await writeFile(join(docsDir, file), pdf);
    console.log(`✓ ${file} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
