/* Renders the six foreign statements into docs/: npx tsx tests/scenarios/synthetic/amys/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { foreignAssetStatementPdf } from "../../documents/foreignAssetStatement.js";
import {
  alpenroseFund,
  fjordlineDividends,
  fjordlineShares,
  polderInterest,
  polderNote,
  rhineCurrent,
  thamesBrokerage,
  thamesDividends,
  thamesSale,
  zurichInterest,
  zurichSavings,
} from "./assets.js";
import { AMYS, AMYS_TAX_YEAR, CORIN } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const amys = `${AMYS.firstName} ${AMYS.lastName}`;
const corin = `${CORIN.firstName} ${CORIN.lastName}`;

const documents = [
  {
    file: "01-limmat-savings.pdf",
    value: zurichSavings,
    income: { interest: zurichInterest },
    holders: `${amys} and ${corin}`,
  },
  {
    file: "02-thames-crown-custody.pdf",
    value: thamesBrokerage,
    income: { dividends: thamesDividends, trades: [thamesSale] },
    holders: amys,
  },
  { file: "03-rheinufer-current.pdf", value: rhineCurrent, income: {}, holders: amys },
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
  for (const { file, value, income, holders } of documents) {
    const pdf = await foreignAssetStatementPdf(value, income, {
      holderNames: holders,
      taxYear: AMYS_TAX_YEAR,
    });
    await writeFile(join(docsDir, file), pdf);
    console.log(`✓ ${file} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
