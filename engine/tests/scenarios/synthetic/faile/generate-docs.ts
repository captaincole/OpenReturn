/* Renders the 1099-DIV into docs/: npx tsx tests/scenarios/synthetic/faile/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1099DivPdf } from "../../documents/form1099Div.js";
import { FAILE, FAILE_TAX_YEAR, fundDividends } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  const pdf = await form1099DivPdf(
    fundDividends,
    {
      payerStreet: "1200 Riverwalk Plaza",
      payerCityStateZip: "San Antonio, TX 78205",
      recipientName: `${FAILE.firstName} ${FAILE.lastName}`,
      recipientTin: "***-**-1117",
      recipientStreet: FAILE.street,
      recipientCityStateZip: `${FAILE.city}, ${FAILE.state} ${FAILE.zip}`,
      accountNumber: "PGE-301558",
    },
    FAILE_TAX_YEAR,
  );
  await writeFile(join(docsDir, "01-1099-div-pecos.pdf"), pdf);
  console.log(`✓ 01-1099-div-pecos.pdf (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
