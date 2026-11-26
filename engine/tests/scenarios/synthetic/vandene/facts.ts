/*
 * A made-up partner (README.md): every name and amount is invented. The two
 * Forms 8986 are made documents (generate-docs.ts renders them from the
 * objects below); the W-2 has no PDF. The year facts are her answers: the
 * totals of each earlier return and the corrected tax from her preparer's
 * statements.
 */

import {
  makeForm8986FactKey,
  makePartnerAdjustmentYearFactKey,
  makeW2FactKey,
  type Form8986FactValue,
  type PartnerAdjustmentYearFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const VANDENE_USER_ID = "vandene-integration";
export const VANDENE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: VANDENE_USER_ID,
  taxYear: VANDENE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const VANDENE = {
  firstName: "Vandene",
  lastName: "Quillfeather",
  ssn: "400-00-8978",
  street: "715 Seawall Point Drive",
  city: "Corpus Christi",
  state: "TX",
  zip: "78411",
};

const address = {
  line1: VANDENE.street,
  city: VANDENE.city,
  state: VANDENE.state,
  zip: VANDENE.zip,
};

// W-2 from Gulfline Marine Engineering (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Gulfline Marine Engineering Inc",
  employerEin: "00-0008978",
  employerAddress: {
    line1: "4100 Harbor Bridge Road",
    city: "Corpus Christi",
    state: "TX",
    zip: "78402",
  },
  employee: { firstName: VANDENE.firstName, lastName: VANDENE.lastName, ssn: VANDENE.ssn, address },
  box1: 185000,
  box2: 42000,
  box3: 176100,
  box4: 10918.2,
  box5: 185000,
  box6: 2682.5,
};

/*
 * Form 8986 from Copperline Ventures LP after a BBA audit of 2021 (Part I
 * box 1): more ordinary income, less other deductions, a capital loss, a
 * smaller research credit, and the substantial understatement penalty listed.
 */
export const copperline: Form8986FactValue = {
  trackingNumber: "CV-2021-00417",
  auditControlNumber: "ACN-61-22719",
  submitter: "audited_partnership",
  returnType: "1065",
  partnershipName: "Copperline Ventures LP",
  partnershipAddress: "88 Refinery Row, Houston, TX 77002",
  partnershipTin: "00-0008986",
  reviewYearEnded: "2021-12-31",
  adjustmentYearEnded: "2025-12-31",
  extendedDueDate: "2026-09-15",
  dateFurnished: "2025-06-12",
  partnerShare: {
    profit: { asReported: 6, change: 0, corrected: 6 },
    loss: { asReported: 6, change: 0, corrected: 6 },
    capital: { asReported: 6, change: 0, corrected: 6 },
  },
  adjustments: [
    {
      lineNumber: "1",
      lineTitle: "Ordinary business income (loss)",
      asReported: 42000,
      netAdjustment: 18000,
      asCorrected: 60000,
    },
    {
      lineNumber: "9a",
      lineTitle: "Net long-term capital gain (loss)",
      asReported: 0,
      netAdjustment: -7000,
      asCorrected: -7000,
    },
    {
      lineNumber: "13",
      lineTitle: "Other deductions",
      code: "W",
      asReported: 6000,
      netAdjustment: -2500,
      asCorrected: 3500,
    },
    {
      lineNumber: "15",
      lineTitle: "Credits",
      code: "M",
      asReported: 1500,
      netAdjustment: -1200,
      asCorrected: 300,
    },
  ],
  penalties: [
    {
      codeSection: "6662(a)",
      description: "Accuracy-related penalty: substantial understatement of income tax",
      ratePercent: 20,
      lineNumbers: "1",
      totalAdjustments: 18000,
    },
  ],
};

/*
 * Form 8986 from Bayline Partners LP, a pass-through partner (Part I box 2)
 * of Saltmarsh Timber Fund LLC, audited for 2022. Bayline's year ends June 30,
 * and the adjustments relate to its year ended June 30, 2023 (Part III item C).
 */
export const saltmarsh: Form8986FactValue = {
  trackingNumber: "BP-2023-01186",
  submitter: "pass_through_of_audited",
  returnType: "1065",
  partnershipName: "Saltmarsh Timber Fund LLC",
  partnershipAddress: "2900 Piney Woods Parkway, Lufkin, TX 75901",
  partnershipTin: "00-0008987",
  reviewYearEnded: "2022-12-31",
  adjustmentYearEnded: "2024-12-31",
  extendedDueDate: "2025-09-15",
  dateFurnished: "2025-02-20",
  passThroughPartner: {
    name: "Bayline Partners LP",
    address: "1200 Ocean Drive, Corpus Christi, TX 78404",
    tin: "00-0008988",
    taxYearEnded: "2023-06-30",
  },
  partnerShare: {
    profit: { asReported: 2.5, change: 0, corrected: 2.5 },
    loss: { asReported: 2.5, change: 0, corrected: 2.5 },
    capital: { asReported: 2.5, change: 0, corrected: 2.5 },
  },
  adjustments: [
    {
      lineNumber: "2",
      lineTitle: "Net rental real estate income (loss)",
      asReported: 9000,
      netAdjustment: 4000,
      asCorrected: 13000,
    },
    {
      lineNumber: "12",
      lineTitle: "Section 179 deduction",
      asReported: 5000,
      netAdjustment: -3000,
      asCorrected: 2000,
    },
  ],
};

/* 2021, the first affected year of the Copperline audit: the $7,000 loss is limited to $3,000. */
const year2021: PartnerAdjustmentYearFactValue = {
  taxYear: 2021,
  totalIncome: 168000,
  totalDeductions: 14000,
  totalCredits: 1500,
  totalIncomeTax: 29481,
  returnExtended: true,
  attributeAdjustments: [
    {
      source: "bba_audit",
      line: "income",
      description: "Capital loss limit, section 1211(b): $3,000 allowed in 2021",
      amount: 4000,
    },
  ],
  bbaAudit: { incomeTax: 35707, alternativeMinimumTax: 640, penalties: 1313 },
};

/* 2022, an intervening year: $3,000 of the capital loss carries over. */
const year2022: PartnerAdjustmentYearFactValue = {
  taxYear: 2022,
  totalIncome: 175000,
  totalDeductions: 12950,
  totalCredits: 0,
  totalIncomeTax: 32728,
  attributeAdjustments: [
    {
      source: "bba_audit",
      line: "income",
      description: "Capital loss carryover from 2021",
      amount: -3000,
    },
  ],
  bbaAudit: { incomeTax: 32008 },
};

/* 2023, the first affected year of the Saltmarsh statement, and the last $1,000 of the loss. */
const year2023: PartnerAdjustmentYearFactValue = {
  taxYear: 2023,
  totalIncome: 181000,
  totalDeductions: 13850,
  totalCredits: 0,
  totalIncomeTax: 33516,
  attributeAdjustments: [
    {
      source: "bba_audit",
      line: "income",
      description: "Capital loss carryover from 2021",
      amount: -1000,
    },
  ],
  bbaAudit: { incomeTax: 34956 },
};

/* 2024, an intervening year: the higher 2023 passive income left less passive loss to carry. */
const year2024: PartnerAdjustmentYearFactValue = {
  taxYear: 2024,
  totalIncome: 190000,
  totalDeductions: 14600,
  totalCredits: 0,
  totalIncomeTax: 35139,
  attributeAdjustments: [
    {
      source: "bba_audit",
      line: "income",
      description: "Passive activity loss carryover reduced (Form 8582)",
      amount: 1800,
    },
  ],
  bbaAudit: { incomeTax: 35571 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: VANDENE_USER_ID, taxYear: VANDENE_TAX_YEAR, suffix, value });

const yearFact = (value: PartnerAdjustmentYearFactValue) =>
  fact(
    "k1",
    makePartnerAdjustmentYearFactKey(value.taxYear),
    value,
    `Stated by Vandene: her ${value.taxYear} return as filed, and her preparer's statement of the corrected tax.`,
  );

export const vandeneFacts: TaxFactRow[] = [
  idFact("name.first", VANDENE.firstName),
  idFact("name.last", VANDENE.lastName),
  idFact("ssn", VANDENE.ssn),
  idFact("dob", "07/09/1979"),
  idFact("address.street", VANDENE.street),
  idFact("address.city", VANDENE.city),
  idFact("address.state", VANDENE.state),
  idFact("address.zip", VANDENE.zip),
  idFact("occupation", "Marine engineer"),
  idFact("phone", "361-555-0178"),
  fact("wages", makeW2FactKey("gulfline-marine"), w2, "W-2 from Gulfline Marine Engineering."),
  fact(
    "k1",
    makeForm8986FactKey("copperline-ventures-2021"),
    copperline,
    "Form 8986 from Copperline Ventures LP (docs/01-form-8986-copperline-ventures.pdf).",
  ),
  fact(
    "k1",
    makeForm8986FactKey("saltmarsh-timber-2022"),
    saltmarsh,
    "Form 8986 from Bayline Partners LP for Saltmarsh Timber Fund LLC (docs/02-form-8986-saltmarsh-timber.pdf).",
  ),
  yearFact(year2021),
  yearFact(year2022),
  yearFact(year2023),
  yearFact(year2024),
];
