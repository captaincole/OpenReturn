/*
 * Form 8986, Partner's Share of Adjustment(s) to Partnership-Related Item(s)
 * (Rev. December 2024): the statement a BBA partnership (or a pass-through
 * partner of one) sends a partner after an audit or an administrative
 * adjustment request (AAR). One fact per Form 8986, category k1, with the
 * items as the form prints them. Form 8978 and its Schedule A report the
 * adjustments (irs-8978-inst-2025::sec::purpose-of-this-form::b01).
 *
 * The partner's own answers for each tax year the adjustments change (the
 * earlier return's totals and the corrected tax) are the year fact
 * (partnerAdjustmentYear.ts).
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * Part I item A, the entity that submits the form: box 1 an audited BBA
 * partnership, box 2 its pass-through partner, box 3 a BBA partnership that
 * filed an AAR, box 4 its pass-through partner. Boxes 1 and 2 mean an audit,
 * boxes 3 and 4 an AAR (irs-8978-inst-2025::sec::completing-form-8978-and-schedule-a::b03).
 */
export type Form8986Submitter =
  "audited_partnership" | "pass_through_of_audited" | "aar_partnership" | "pass_through_of_aar";

/* Part I item B: the return the submitting entity files. */
export type Form8986ReturnType = "1065" | "1120-S" | "1041" | "other";

/* One row of Part V, Schedule K-1/K-3 items. */
export interface Form8986Adjustment {
  /* Column (a): the Schedule K-1 line number ("1", "9a", "13"), or "K3" for a Schedule K-3 item. */
  lineNumber: string;
  /* Column (b): the line title ("Ordinary business income"). */
  lineTitle: string;
  /* Column (c): the code letter; absent when the form prints "NA". */
  code?: string;
  /* Column (d): the amount as reported, or as previously corrected. */
  asReported?: number;
  /* Column (e): a Part VI statement explains the row. */
  hasStatement?: boolean;
  /* Column (f): the approved modifications. */
  approvedModifications?: number;
  /* Column (g): the reviewed year adjustment net of approved modifications, signed. */
  netAdjustment: number;
  /* Column (h): as corrected, column (d) combined with column (g). */
  asCorrected?: number;
}

/* One row of the Applicable Penalties table under Part V. */
export interface Form8986Penalty {
  /* Column (a): the Internal Revenue Code section ("6662(a)"). */
  codeSection: string;
  /* Column (b): the penalty description. */
  description: string;
  /* Column (c): the penalty rate, in percent (20). */
  ratePercent: number;
  /* Column (d): the Part V line numbers the penalty applies to, as printed ("1, 13"). */
  lineNumbers: string;
  /* Column (e): the total applicable adjustments. */
  totalAdjustments?: number;
}

/* Part III: filled only when a pass-through partner submits the statement. */
export interface Form8986PassThroughPartner {
  /* Item A line 1 and the address lines, as one line each. */
  name: string;
  address?: string;
  /* Item B. */
  tin: string;
  /* Item C: the pass-through partner's tax year end to which the adjustments relate (YYYY-MM-DD). */
  taxYearEnded: string;
}

/* Part IV item E: one share row, in percent. */
export interface Form8986ShareRow {
  asReported: number;
  change: number;
  corrected: number;
}

export interface Form8986FactValue {
  /* The "Corrected" box at the top; absent or false: an original. */
  corrected?: boolean;
  trackingNumber?: string;
  auditControlNumber?: string;
  /* Part I. */
  submitter: Form8986Submitter;
  returnType: Form8986ReturnType;
  /* Part I item B box 4: the form number when the return type is "other". */
  returnTypeOther?: string;
  /* Part II item A: the audited or AAR partnership. */
  partnershipName: string;
  partnershipAddress?: string;
  /* Part II item C. */
  partnershipTin: string;
  /* Part II item D: the review year ends (YYYY-MM-DD). */
  reviewYearEnded: string;
  /* Part II item E: the adjustment year ends (YYYY-MM-DD). */
  adjustmentYearEnded?: string;
  /* Part II item F: the extended due date of the partnership's adjustment year return (YYYY-MM-DD). */
  extendedDueDate?: string;
  /*
   * Part II item G: the date the partnership furnished the Forms 8986 to its
   * partners (YYYY-MM-DD). The partner's reporting year is the tax year that
   * holds it (irs-8978-inst-2025::sec::purpose-of-this-form::b07, b08).
   */
  dateFurnished: string;
  /* Part III, when a pass-through partner submits the statement. */
  passThroughPartner?: Form8986PassThroughPartner;
  /* Part IV item E: the partner's share of profit, loss and capital. */
  partnerShare?: { profit: Form8986ShareRow; loss: Form8986ShareRow; capital: Form8986ShareRow };
  /* Part V, in the order printed. */
  adjustments: Form8986Adjustment[];
  /* The Applicable Penalties table; absent or empty: none listed. */
  penalties?: Form8986Penalty[];
}

export interface Form8986Fact {
  key: string;
  value: Form8986FactValue;
}

const FORM_8986_CATEGORY = "k1";
const FORM_8986_PREFIX = "form_8986.";

export function makeForm8986FactKey(statementSlug: string): string {
  return `${FORM_8986_PREFIX}${statementSlug}`;
}

export function isForm8986FactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === FORM_8986_PREFIX && parts[1] !== "";
}

/* Every Form 8986 fact, in the order recorded. */
export function getForm8986Facts(facts: ReadonlyArray<FactRow>): Form8986Fact[] {
  return facts
    .filter((row) => row.category === FORM_8986_CATEGORY && isForm8986FactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as Form8986FactValue }));
}
