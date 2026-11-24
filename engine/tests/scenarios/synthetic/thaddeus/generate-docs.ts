/*
 * Renders the couple's fake 1099-SAs and 1099-LTCs into docs/:
 * npx tsx tests/scenarios/synthetic/thaddeus/generate-docs.ts (from engine/).
 * Each form prints the value object that facts.ts records for it.
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  makeHsaDistributionFactKey,
  makeLtcBenefitsFactKey,
  type HsaDistributionFactValue,
  type LtcBenefitsFactValue,
} from "../../../../src/facts/index.js";
import { form1099LtcPdf } from "../../documents/form1099Ltc.js";
import { form1099SAPdf } from "../../documents/form1099SA.js";
import { THADDEUS, THADDEUS_TAX_YEAR, thaddeusFacts } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const factValue = <T>(key: string): T => {
  const found = thaddeusFacts.find((fact) => fact.key === key);
  if (!found) throw new Error(`thaddeus has no fact ${key}`);
  return found.value as T;
};

/* The account holder or policyholder the form names: the fact's owner. */
function person(owner: "taxpayer" | "spouse" | undefined) {
  const spouse = owner === "spouse";
  return {
    name: `${spouse ? THADDEUS.spouseFirstName : THADDEUS.firstName} ${THADDEUS.lastName}`,
    tin: spouse ? THADDEUS.spouseSsn : THADDEUS.ssn,
    street: THADDEUS.street,
    cityStateZip: `${THADDEUS.city}, ${THADDEUS.state} ${THADDEUS.zip}`,
  };
}

/* Made-up payer addresses; the facts hold no address. */
const PAYERS: Record<string, { street: string; cityStateZip: string; phone: string }> = {
  "cascade-health": {
    street: "900 Summit Ridge Way",
    cityStateZip: "Bellevue, WA 98004",
    phone: "425-555-0141",
  },
  "sound-savings": {
    street: "77 Pier Lantern Street",
    cityStateZip: "Everett, WA 98201",
    phone: "425-555-0162",
  },
  "evergreen-ma": {
    street: "3300 Fir Terrace Blvd",
    cityStateZip: "Spokane, WA 99201",
    phone: "509-555-0117",
  },
  "mount-rainier": {
    street: "1460 Paradise Valley Road",
    cityStateZip: "Puyallup, WA 98371",
    phone: "253-555-0175",
  },
  "olympic-life": {
    street: "250 Hurricane Ridge Plaza",
    cityStateZip: "Port Angeles, WA 98362",
    phone: "360-555-0129",
  },
};

const INSURED_ADDRESS = { street: "1290 Larch Hollow Road", cityStateZip: "Olympia, WA 98501" };

const SA_FORMS: [string, string, string][] = [
  ["01-cascade-health-1099-sa.pdf", "cascade-health", "sa1"],
  ["02-sound-savings-1099-sa.pdf", "sound-savings", "sa1"],
  ["03-evergreen-ma-1099-sa-code-1.pdf", "evergreen-ma", "sa1"],
  ["04-evergreen-ma-1099-sa-code-3.pdf", "evergreen-ma", "sa2"],
];

const LTC_FORMS: [string, string, string][] = [
  ["05-mount-rainier-1099-ltc.pdf", "mount-rainier", "ltc1"],
  ["06-olympic-life-1099-ltc.pdf", "olympic-life", "ltc1"],
];

async function write(file: string, pdf: Uint8Array) {
  await writeFile(join(docsDir, file), pdf);
  console.log(`✓ ${file} (${pdf.length} bytes)`);
}

async function main() {
  for (const [file, slug, formId] of SA_FORMS) {
    const sa = factValue<HsaDistributionFactValue>(makeHsaDistributionFactKey(slug, formId));
    const payer = PAYERS[slug];
    const recipient = person(sa.owner);
    const parties = {
      payerStreet: payer.street,
      payerCityStateZip: payer.cityStateZip,
      payerPhone: payer.phone,
      recipientName: recipient.name,
      recipientTin: recipient.tin,
      recipientStreet: recipient.street,
      recipientCityStateZip: recipient.cityStateZip,
    };
    await write(file, await form1099SAPdf(sa, parties, THADDEUS_TAX_YEAR));
  }
  for (const [file, slug, formId] of LTC_FORMS) {
    const ltc = factValue<LtcBenefitsFactValue>(makeLtcBenefitsFactKey(slug, formId));
    const payer = PAYERS[slug];
    const policyholder = person(ltc.owner);
    const parties = {
      payerStreet: payer.street,
      payerCityStateZip: payer.cityStateZip,
      payerPhone: payer.phone,
      policyholderName: policyholder.name,
      policyholderTin: policyholder.tin,
      policyholderStreet: policyholder.street,
      policyholderCityStateZip: policyholder.cityStateZip,
      insuredStreet: INSURED_ADDRESS.street,
      insuredCityStateZip: INSURED_ADDRESS.cityStateZip,
    };
    await write(file, await form1099LtcPdf(ltc, parties, THADDEUS_TAX_YEAR));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
