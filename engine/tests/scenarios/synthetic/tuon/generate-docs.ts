/* Renders the Form 1099-R into docs/: npx tsx tests/scenarios/synthetic/tuon/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  makeRetirementDistributionFactKey,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import { form1099RPdf } from "../../documents/form1099R.js";
import { TUON_TAX_YEAR, tuonFacts } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* A fact's own value, so the document and the fact cannot disagree. */
function valueOf(key: string): unknown {
  const found = tuonFacts.find((fact) => fact.key === key);
  if (found === undefined) throw new Error(`no fact ${key}`);
  return found.value;
}

const identity = (suffix: string) => String(valueOf(`identity.${suffix}`));

async function main() {
  const pension = valueOf(
    makeRetirementDistributionFactKey("redwood-valley-pension", "r-1"),
  ) as RetirementDistributionFactValue;
  const parties = {
    payerStreet: "1150 Mill Creek Road",
    payerCityStateZip: "Healdsburg, CA 95448",
    payerPhone: "707-555-0162",
    recipientName: `${identity("name.first")} ${identity("name.last")}`,
    recipientTin: identity("ssn"),
    recipientStreet: identity("address.street"),
    recipientCityStateZip: `${identity("address.city")}, ${identity("address.state")} ${identity("address.zip")}`,
  };
  const name = "01-redwood-valley-mills-1099-r.pdf";
  const pdf = await form1099RPdf(pension, parties, TUON_TAX_YEAR);
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
