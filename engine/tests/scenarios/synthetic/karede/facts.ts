/*
 * A made-up 17-year-old in Sacramento (README.md): every name and amount is
 * invented. No input documents: the facts are the boxes as the documents would
 * print them, and the answers the child and her parents state.
 */

import {
  CA_CHILD_UNEARNED_INCOME_KEYS,
  CHILD_UNEARNED_INCOME_KEYS,
  makeDividendFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type InterestFactValue,
  type ParentCaliforniaReturnFactValue,
  type ParentReturnFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const KAREDE_USER_ID = "karede-synthetic";
export const KAREDE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const PAYER_TIN = "00-0003800";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: KAREDE_USER_ID,
  taxYear: KAREDE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const KAREDE = {
  firstName: "Karede",
  lastName: "Ashfordly",
  ssn: "400-00-3800",
  street: "1817 Camellia Way",
  city: "Sacramento",
  state: "CA",
  zip: "95818",
};

const address = { line1: KAREDE.street, city: KAREDE.city, state: KAREDE.state, zip: KAREDE.zip };

// Her W-2 from a bookshop (made up): earned income, so FTB 3800 line 1 uses its worksheet.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta Lantern Books LLC",
  employerEin: "00-0003801",
  employerAddress: { line1: "910 J Street", city: "Sacramento", state: "CA", zip: "95814" },
  employee: { firstName: KAREDE.firstName, lastName: KAREDE.lastName, ssn: KAREDE.ssn, address },
  box1: 18000,
  box2: 600,
  box3: 18000,
  box4: 1116,
  box5: 18000,
  box6: 261,
  box15: "CA",
  box16: 18000,
  box17: 250,
};

// 1099-INT from a savings bank (made up).
const interest: InterestFactValue = {
  payerName: "American River Savings Bank",
  payerTin: PAYER_TIN,
  box1: 3200,
};

// 1099-DIV from a fund her grandmother left her (made up).
const dividends: DividendFactValue = {
  payerName: "Sierra Foothill Growth Fund",
  payerTin: PAYER_TIN,
  box1a: 8000,
  box1b: 5000,
  box2a: 1800,
};

/*
 * The parents' joint 2025 federal return (made up), as they told her, for
 * Form 8615. Her brother Lucan's Form 8615 line 5 is $4,500.
 */
export const PARENT_RETURN: ParentReturnFactValue = {
  name: "Galen R. Ashfordly",
  ssn: "400-00-3802",
  filingStatus: "married_filing_jointly",
  taxableIncome: 296000,
  tax: 56464,
  qualifiedDividends: 3000,
  otherChildren: [{ netUnearnedIncome: 4500 }],
};

/*
 * The parents' joint 2025 Form 540 (made up): line 19 $280,000 and line 31
 * $18,917 (Schedule Y on $280,000). Lucan's FTB 3800 line 5 is $4,200 (his
 * Treasury interest is not taxed by California, so it is less than his
 * federal line 5). No name: the same parent as on Form 8615.
 */
export const PARENT_CA_RETURN: ParentCaliforniaReturnFactValue = {
  taxableIncome: 280000,
  tax: 18917,
  otherChildren: [{ netUnearnedIncome: 4200 }],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: KAREDE_USER_ID, taxYear: KAREDE_TAX_YEAR, suffix, value });

const KEYS = CHILD_UNEARNED_INCOME_KEYS;

export const karedeFacts: TaxFactRow[] = [
  idFact("name.first", KAREDE.firstName),
  idFact("name.last", KAREDE.lastName),
  idFact("ssn", KAREDE.ssn),
  idFact("dob", "03/09/2008"),
  idFact("address.street", KAREDE.street),
  idFact("address.city", KAREDE.city),
  idFact("address.state", KAREDE.state),
  idFact("address.zip", KAREDE.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Student"),
  idFact("phone", "916-555-0138"),
  fact("wages", makeW2FactKey("delta-lantern-books"), w2, "W-2 from Delta Lantern Books."),
  fact(
    "investment_income",
    makeInterestFactKey("american-river-savings"),
    interest,
    "1099-INT from American River Savings Bank.",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("sierra-foothill-growth"),
    dividends,
    "1099-DIV from Sierra Foothill Growth Fund.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: parents' plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact("other", KEYS.parentAlive, true, "Stated by Karede: both parents are living."),
  fact(
    "other",
    KEYS.claimableAsDependent,
    false,
    "Stated by Karede: she pays more than half of her own support, so nobody can claim her.",
  ),
  fact(
    "other",
    KEYS.parentReturn,
    PARENT_RETURN,
    "Stated by her parents from their 2025 joint Form 1040 and her brother's Form 8615.",
  ),
  fact(
    "other",
    CA_CHILD_UNEARNED_INCOME_KEYS.parentCaliforniaReturn,
    PARENT_CA_RETURN,
    "Stated by her parents from their 2025 joint Form 540 and her brother's FTB 3800.",
  ),
];
