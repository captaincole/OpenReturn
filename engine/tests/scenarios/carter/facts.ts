/* Source: IRS ATS test scenario 8 (2025), moved from NV to CA. Changes: docs/RELOCATION.md. */

import {
  SPOUSE_KEYS,
  makeDividendFactKey,
  makeRetirementDistributionFactKey,
  makeSocialSecurityFactKey,
  type DividendFactValue,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const CARTER_USER_ID = "carter-integration";
export const CARTER_TAX_YEAR = 2025;

const CREATED_AT = "2026-10-18T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CARTER_USER_ID,
  taxYear: CARTER_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The taxpayer as the documents print him (generate-docs.ts reads it too). */
export const CARTER = {
  firstName: "Carter",
  lastName: "Lewis",
  ssn: "400-00-1039",
  street: "807 Sahara Drive",
  city: "Sacramento",
  state: "CA",
  zip: "95814",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CARTER_USER_ID, taxYear: CARTER_TAX_YEAR, suffix, value });

// docs/01-liberty-trust-1099-r-code-q.pdf
const libertyTrust: RetirementDistributionFactValue = {
  payerName: "Liberty Trust Company",
  payerTin: "00-0000009",
  box1: 35800,
  box2a: 0,
  box4: 0,
  box7: "Q",
  box7IraSepSimple: false,
};

// docs/02-jubilee-retirement-1099-r-code-g.pdf
const jubileeRetirement: RetirementDistributionFactValue = {
  payerName: "Jubilee Retirement Fund",
  payerTin: "00-0000009",
  box1: 20300,
  box2a: 10300,
  box4: 2555,
  box7: "G",
  box7IraSepSimple: false,
};

// docs/03-example-reit-fund-1099-div.pdf (made by us from the cover page)
const reitDiv: DividendFactValue = {
  payerName: "Example REIT Fund",
  payerTin: "00-0000009",
  box2a: 7500,
};

// docs/04-ssa-1099.pdf (made by us from the cover page; carter/generate-docs.ts)
export const ssa: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 1000,
  box5: 1000,
};

export const carterFacts: TaxFactRow[] = [
  idFact("name.first", CARTER.firstName),
  idFact("name.last", CARTER.lastName),
  idFact("ssn", CARTER.ssn),
  idFact("dob", "10/29/1953"),
  idFact("address.street", CARTER.street),
  idFact("address.city", CARTER.city),
  idFact("address.state", CARTER.state),
  idFact("address.zip", CARTER.zip),
  idFact("address.county", "Sacramento"),
  fact(
    "identity",
    SPOUSE_KEYS.firstName,
    "Elizabeth",
    "IRS draft 1040 header (docs/irs-ats-2025-scenario-8.pdf, page 2).",
  ),
  fact(
    "identity",
    SPOUSE_KEYS.lastName,
    "Lewis",
    "IRS draft 1040 header (docs/irs-ats-2025-scenario-8.pdf, page 2).",
  ),
  fact(
    "identity",
    SPOUSE_KEYS.ssn,
    "400-00-1057",
    "IRS draft 1040 header (docs/irs-ats-2025-scenario-8.pdf, page 2).",
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.livedApartAllYear,
    true,
    "Cover page: lived apart from spouse the entire year.",
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.itemizesSeparately,
    false,
    "IRS draft 1040: line 12b (spouse itemizes on a separate return) is unchecked.",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("liberty-trust-company", "code-q"),
    libertyTrust,
    "1099-R from Liberty Trust Company (docs/01-liberty-trust-1099-r-code-q.pdf).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("jubilee-retirement-fund", "code-g"),
    jubileeRetirement,
    "1099-R from Jubilee Retirement Fund (docs/02-jubilee-retirement-1099-r-code-g.pdf).",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("example-reit-fund"),
    reitDiv,
    "1099-DIV from Example REIT Fund (docs/03-example-reit-fund-1099-div.pdf).",
  ),
  fact("retirement", makeSocialSecurityFactKey("ssa"), ssa, "SSA-1099 (docs/04-ssa-1099.pdf)."),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    "Added for CA (docs/RELOCATION.md): Medicare all year.",
  ),
  fact("use_tax", "use_tax.owed_amount", 0, "Added for CA (docs/RELOCATION.md): no use tax."),
];
