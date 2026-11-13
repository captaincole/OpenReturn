/* Renders the two SSA-1099s into docs/: npx tsx tests/scenarios/tcb-ca-004/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SocialSecurityFactValue } from "../../../src/facts/index.js";
import { ssa1099Pdf } from "../documents/ssa1099.js";
import { HOUSEHOLD, TCB_CA_004_TAX_YEAR, ssaSpouse, ssaTaxpayer } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function render(
  file: string,
  person: { firstName: string; lastName: string; ssn: string },
  value: SocialSecurityFactValue,
) {
  const beneficiary = {
    name: `${person.firstName} ${person.lastName}`,
    ssn: person.ssn,
    street: HOUSEHOLD.street,
    cityStateZip: `${HOUSEHOLD.city}, ${HOUSEHOLD.state} ${HOUSEHOLD.zip}`,
  };
  const pdf = await ssa1099Pdf(value, beneficiary, TCB_CA_004_TAX_YEAR);
  await writeFile(join(docsDir, file), pdf);
  console.log(`✓ ${file} (${pdf.length} bytes)`);
}

async function main() {
  await render("04-ssa-1099-sam.pdf", HOUSEHOLD.taxpayer, ssaTaxpayer);
  await render("05-ssa-1099-lisa.pdf", HOUSEHOLD.spouse, ssaSpouse);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
