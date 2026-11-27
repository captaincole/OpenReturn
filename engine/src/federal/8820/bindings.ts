/*
 * Form 8820, Orphan Drug Credit, for an individual: lines 1 to 2c from the
 * orphan drug credit fact of the taxpayer's own business (figures.ts), line 3
 * from the K-1s, line 4 to Form 3800 Part III line 1h (form3800.ts), and Part
 * II from the fact's drugs. Without the reduced credit election, line 2a also
 * lowers the business's Schedule C expenses (facts/kinds/activitiesOnReturn.ts).
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import type { OrphanDrug } from "../../facts/kinds/orphanDrugCredit.js";
import { unsupported, type Unsupported } from "../../types.js";
import { ISODate, SSN, isoDate } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8820Figures, Form8820FilingInfo } from "./filingInfo.js";
import { line4Of, type CreditLines } from "./lines.js";
import type { Form8820 } from "./types.js";

type Value = number | Unsupported | undefined;
type Binding = (
  form: unknown,
  info: Form8820FilingInfo,
) => string | number | boolean | Unsupported | undefined;
type Bindings = Partial<{ [K in keyof Form8820]: BindingFn<Form8820, Form8820FilingInfo, K> }>;

/*
 * The cents box of a whole-dollar line: the engine rounds every line to the
 * dollar (CLAUDE.md, whole-dollar rounding), so a line with an amount prints "00".
 */
const NO_CENTS = "00";

const isGap = (value: unknown): value is Unsupported => typeof value === "object" && value !== null;

/*
 * Lines 1 to 2c: "Figure any orphan drug credit from your own trade or
 * business on lines 1 and 2a" (irs-8820-form-2025::sec::specific-instructions::b01).
 * Blank with no credit of the taxpayer's own business (only line 3), and while
 * an answer is missing; the gap when the facts do not add up.
 */
function ownLine(figures: Form8820Figures | undefined, line: keyof CreditLines): Value {
  if (figures === undefined || !figures.ownCredit) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  return figures.lines?.[line];
}

/* Line 3: the K-1 credits, or the gap of a K-1 with no amount; blank with none. */
function line3Of(figures: Form8820Figures | undefined): Value {
  const k1 = figures?.k1Credits;
  if (k1 === undefined) return undefined;
  return "gap" in k1 ? unsupported(k1.gap) : k1.amount;
}

/* Line 4: "Add lines 2c and 3"; blank while both are blank or line 2c waits. */
function line4Value(figures: Form8820Figures | undefined): Value {
  const line2c = ownLine(figures, "line2c");
  const line3 = line3Of(figures);
  if (isGap(line2c)) return line2c;
  if (isGap(line3)) return line3;
  if (line2c === undefined && line3 === undefined) return undefined;
  if (figures?.ownCredit && line2c === undefined) return undefined;
  return line4Of(line2c, line3);
}

/* A dollar line and its cents box. */
function dollarLine(pick: (figures: Form8820Figures | undefined) => Value): [Binding, Binding] {
  const dollars: Binding = (_, info) => pick(info.form8820);
  const cents: Binding = (_, info) => {
    const value = pick(info.form8820);
    return isGap(value) ? value : value === undefined ? undefined : NO_CENTS;
  };
  return [dollars, cents];
}

const DOLLAR_LINES: Array<[string, (figures: Form8820Figures | undefined) => Value]> = [
  ["1_qualified_clinical_testing_expenses", (figures) => ownLine(figures, "line1")],
  ["2a_credit_amount", (figures) => ownLine(figures, "line2a")],
  ["2b_form_8932_wages_portion", (figures) => ownLine(figures, "line2b")],
  ["2c_subtract_2b_from_2a", (figures) => ownLine(figures, "line2c")],
  ["3_pass_through_orphan_drug_credit", line3Of],
  ["4_add_lines_2c_and_3", line4Value],
  /*
   * Lines 5 and 6: "Estates and trusts, go to line 5"; "Partnerships and S
   * corporations, report this amount on Schedule K. All others, report this
   * amount on Form 3800" (irs-8820-form-2025::sec::face-part-i::b01). An
   * individual stops at line 4, so both stay blank.
   */
  ["5_allocated_to_beneficiaries", () => undefined],
  ["6_estates_trusts_subtract_5_from_4", () => undefined],
];

function partIBindings(): Record<string, Binding> {
  const out: Record<string, Binding> = {};
  for (const [field, pick] of DOLLAR_LINES) {
    const [dollars, cents] = dollarLine(pick);
    out[`0.line.${field}_dollars`] = dollars;
    out[`0.line.${field}_cents`] = cents;
  }
  return out;
}

/* "If you are electing the reduced orphan drug credit ... clearly indicate your intent" (irs-8820-form-2025::sec::line-2a::b01). */
function electionBox(info: Form8820FilingInfo, box: boolean): boolean | undefined {
  const elected = info.form8820?.reducedCreditElection;
  return elected === undefined ? undefined : elected === box;
}

/* Part II rows 7a to 7z: one form has 26. */
const ROW_LETTERS = "abcdefghijklmnopqrstuvwxyz";
const PART_II_ROWS = ROW_LETTERS.length;

/*
 * "Attach as many Part II pages as needed to show all orphan drugs"
 * (irs-8820-form-2025::sec::part-ii::b01): the engine prints one page.
 */
const MORE_DRUGS_GAP = `The return lists more than ${PART_II_ROWS} orphan drugs, which need an extra Part II page (irs-8820-form-2025::sec::part-ii::b01), and the engine prints one.`;

/* Part II: "the generic name of the orphan drug, the Designation application number, and the date the drug was designated" (part-ii::b01). */
function drugCell(index: number, pick: (drug: OrphanDrug) => string): Binding {
  return (_, info) => {
    const drugs = info.form8820?.drugs ?? [];
    if (drugs.length > PART_II_ROWS) return unsupported(MORE_DRUGS_GAP);
    const drug = drugs[index];
    return drug === undefined ? undefined : pick(drug);
  };
}

function partIIBindings(): Record<string, Binding> {
  const out: Record<string, Binding> = {};
  [...ROW_LETTERS].forEach((letter, index) => {
    const row = `1.line.7${letter}`;
    out[`${row}_orphan_drug_name_col_b`] = drugCell(index, (drug) => drug.name);
    out[`${row}_designation_application_number_col_c`] = drugCell(
      index,
      (drug) => drug.designationApplicationNumber,
    );
    out[`${row}_date_drug_designated_col_d`] = drugCell(index, (drug) =>
      ISODate.usSlash(isoDate(drug.dateDesignated)),
    );
  });
  return out;
}

export function register(): void {
  defineForm<Form8820, Form8820FilingInfo>("form-8820", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.2a_elect_reduced_credit_280c_yes": (_, info) => electionBox(info, true),
      "0.line.2a_elect_reduced_credit_280c_no": (_, info) => electionBox(info, false),
      ...(partIBindings() as Bindings),
      ...(partIIBindings() as Bindings),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
