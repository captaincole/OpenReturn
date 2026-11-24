/* Renders the two Forms 1099-R into docs/: npx tsx tests/scenarios/synthetic/siuan/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  makeRetirementDistributionFactKey,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import { form1099RPdf, type Form1099RParties } from "../../documents/form1099R.js";
import { LUMP_SUM_KEY, SIUAN, SIUAN_TAX_YEAR, siuanFacts } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* The fact's own value object, so the document and the fact cannot disagree. */
function distributionOf(key: string): RetirementDistributionFactValue {
  const found = siuanFacts.find((fact) => fact.key === key);
  if (found === undefined) throw new Error(`no fact ${key}`);
  return found.value as RetirementDistributionFactValue;
}

const recipient = {
  recipientName: `${SIUAN.firstName} ${SIUAN.lastName}`,
  recipientTin: SIUAN.ssn,
  recipientStreet: SIUAN.street,
  recipientCityStateZip: `${SIUAN.city}, ${SIUAN.state} ${SIUAN.zip}`,
};

const PENSION_PAYER: Form1099RParties = {
  ...recipient,
  payerStreet: "2400 Kietzke Lane",
  payerCityStateZip: "Reno, NV 89502",
  payerPhone: "775-555-0171",
};

const LUMP_SUM_PAYER: Form1099RParties = {
  ...recipient,
  payerStreet: "88 Foundry Street",
  payerCityStateZip: "Sparks, NV 89431",
  payerPhone: "775-555-0186",
};

async function main() {
  const pension = distributionOf(
    makeRetirementDistributionFactKey("truckee-valley-water", "pension"),
  );
  const forms: Array<[string, Uint8Array]> = [
    [
      "01-truckee-valley-water-1099-r.pdf",
      await form1099RPdf(pension, PENSION_PAYER, SIUAN_TAX_YEAR),
    ],
    [
      "02-harlow-tool-works-1099-r.pdf",
      await form1099RPdf(distributionOf(LUMP_SUM_KEY), LUMP_SUM_PAYER, SIUAN_TAX_YEAR),
    ],
  ];
  for (const [name, pdf] of forms) {
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
