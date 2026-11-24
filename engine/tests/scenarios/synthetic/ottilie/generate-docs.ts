/* Renders the two care providers' year-end statements into docs/: npx tsx tests/scenarios/synthetic/ottilie/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SPOUSE_KEYS,
  getDependentCareProviderFacts,
  makeDependentCareProviderFactKey,
} from "../../../../src/facts/index.js";
import {
  careProviderStatementPdf,
  type CareStatementFamily,
} from "../../documents/careProviderStatement.js";
import { OTTILIE_TAX_YEAR, ottilieFacts } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const valueOf = (key: string): string => {
  const row = ottilieFacts.find((fact) => fact.key === key);
  if (row === undefined) throw new Error(`ottilie: no fact ${key}`);
  return String(row.value);
};

/* The family, from the identity facts the return uses. */
const family = {
  payerName: `${valueOf("identity.name.first")} and ${valueOf(SPOUSE_KEYS.firstName)} ${valueOf("identity.name.last")}`,
  payerStreet: valueOf("identity.address.street"),
  payerCityStateZip: `${valueOf("identity.address.city")}, ${valueOf("identity.address.state")} ${valueOf("identity.address.zip")}`,
};

/* The letters' own details: invented, and not in any fact. */
const LETTERS: Array<[string, string, Omit<CareStatementFamily, keyof typeof family>]> = [
  [
    "sunflower-hill",
    "01-sunflower-hill-care-statement.pdf",
    {
      statementDate: "January 12, 2026",
      accountNumber: "SHP-2041",
      signedBy: "Dana Whitlock, Director",
    },
  ],
  [
    "lupe-arroyo",
    "02-lupe-arroyo-care-statement.pdf",
    { statementDate: "January 6, 2026", signedBy: "Lupe Arroyo" },
  ],
];

const providerOf = (slug: string) => {
  const key = makeDependentCareProviderFactKey(slug);
  const found = getDependentCareProviderFacts(ottilieFacts).find((fact) => fact.factKey === key);
  if (found === undefined) throw new Error(`ottilie: no provider fact ${key}`);
  return found.provider;
};

async function main() {
  for (const [slug, name, letter] of LETTERS) {
    const pdf = await careProviderStatementPdf(
      providerOf(slug),
      { ...family, ...letter },
      OTTILIE_TAX_YEAR,
    );
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
