/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 *
 * MANUAL EDIT: every line comes from one computation, figureBasis in
 * passThrough/basis.ts, which the basis stage of the loss limits reads too.
 * One copy for each S corporation K-1 that files the form (resolveInfo.ts).
 * A line is blank while the holding lacks an answer, and the K-1's reason when
 * the computation does not handle the case. QUESTIONS.md lists the doubts.
 */

import { defineForm, type FormSpec } from "../../defineForm.js";
import { unsupported } from "../../types.js";
import {
  figureBasis,
  type BasisFigures,
  type DebtBasisLines,
  type IncreaseLine,
  type PartIIILine,
  type PartIIIRow,
} from "../passThrough/basis.js";
import type { PassThroughEntity } from "../passThrough/items.js";
import type { Form7203FilingInfo } from "./filingInfo.js";
import type { Form7203 } from "./types.js";

type Info = Form7203FilingInfo;
type Fn = (form: unknown, info: Info) => unknown;
type Spec = FormSpec<Form7203, Info>;

const entityOf = (info: Info): PassThroughEntity | undefined =>
  info.form7203Entities?.[info.form7203CopyIndex ?? 0];

/* A line from the figures: blank while they wait, the reason when they cannot be figured. */
function fromFigures(read: (figures: BasisFigures) => unknown): Fn {
  return (_, info) => {
    const entity = entityOf(info);
    if (!entity) return undefined;
    const outcome = figureBasis(entity);
    if (outcome.kind === "waiting") return undefined;
    if (outcome.kind === "unsupported") return unsupported(outcome.reason);
    return read(outcome.figures);
  };
}

/* An amount the form prints only when it is more than 0 (a row with nothing to enter). */
const aboveZero = (amount: number | undefined) =>
  amount !== undefined && amount > 0 ? amount : undefined;

/*
 * Lines 8 to 14 when line 7 is more than 0, and lines 11 to 14 when line 10 is:
 * "If the result is zero or less, enter -0-, skip lines ..." (Form 7203 lines 7 and 10).
 */
const afterLine7 = (read: (figures: BasisFigures) => unknown) =>
  fromFigures((figures) => (figures.stock.line7 > 0 ? read(figures) : undefined));
const afterLine10 = (read: (figures: BasisFigures) => unknown) =>
  fromFigures((figures) => (figures.stock.line10 > 0 ? read(figures) : undefined));

const ACQUIRED_AS = {
  "0.header.d1_original_shareholder": "original_shareholder",
  "0.header.d2_purchased": "purchased",
  "0.header.d3_inherited": "inherited",
  "0.header.d4_gift": "gift",
  "0.header.d5_other": "other",
} as const;

/* The shareholder: the K-1's owner on a joint return, else the taxpayer. */
function shareholder(info: Info): { name?: string; id?: string } {
  const spouse = entityOf(info)?.holding?.owner === "spouse";
  const first = spouse ? info.spouseFirstName : info.taxpayerFirstName;
  const last = spouse ? info.spouseLastName : info.taxpayerLastName;
  return {
    name: first && last ? `${first} ${last}` : undefined,
    id: spouse ? info.spouseSSN : info.taxpayerSSN,
  };
}

function headerBindings(): Record<string, Fn> {
  const acquired = Object.fromEntries(
    Object.entries(ACQUIRED_AS).map(([field, answer]): [string, Fn] => [
      field,
      (_, info) => {
        const stated = entityOf(info)?.holding?.stockAcquiredAs;
        return stated === undefined ? undefined : stated === answer;
      },
    ]),
  );
  return {
    "0.header.shareholder_name": (_, info) => shareholder(info).name,
    "0.header.identifying_number": (_, info) => shareholder(info).id,
    "0.header.a_s_corporation_name": (_, info) => entityOf(info)?.name,
    "0.header.b_employer_identification_number": (_, info) => entityOf(info)?.ein,
    ...acquired,
  };
}

const INCREASE_FIELDS: Record<IncreaseLine, string> = {
  "3a": "0.line.3a_ordinary_business_income",
  "3b": "0.line.3b_net_rental_real_estate_income",
  "3c": "0.line.3c_other_net_rental_income",
  "3d": "0.line.3d_interest_income",
  "3e": "0.line.3e_ordinary_dividends",
  "3f": "0.line.3f_royalties",
  "3g": "0.line.3g_net_capital_gains",
  "3h": "0.line.3h_net_section_1231_gain",
  "3i": "0.line.3i_other_income",
  "3k": "0.line.3k_tax_exempt_income",
};

/* Part I (irs-7203-inst-2025::sec::part-i::b01 to ::line-13::b01). */
function partIBindings(): Record<string, Fn> {
  const increases = Object.fromEntries(
    Object.entries(INCREASE_FIELDS).map(([line, field]): [string, Fn] => [
      field,
      fromFigures((figures) => aboveZero(figures.stock.increases[line as IncreaseLine])),
    ]),
  );
  return {
    "0.line.1_stock_basis_beginning": fromFigures((figures) => figures.stock.line1),
    "0.line.2_capital_contributions_additional_stock": fromFigures((figures) =>
      aboveZero(figures.stock.line2),
    ),
    ...increases,
    "0.line.4_total_basis_increases": fromFigures((figures) => figures.stock.line4),
    "0.line.5_stock_basis_before_distributions": fromFigures((figures) => figures.stock.line5),
    "0.line.6_distributions": fromFigures((figures) => aboveZero(figures.stock.line6)),
    "0.line.7_stock_basis_after_distributions": fromFigures((figures) => figures.stock.line7),
    "0.line.8a_nondeductible_expenses": afterLine7((figures) => aboveZero(figures.stock.line8a)),
    "0.line.9_total_basis_decreases": afterLine7((figures) => figures.stock.line9),
    "0.line.10_stock_basis_before_loss_items": fromFigures((figures) => figures.stock.line10),
    "0.line.11_allowable_loss_deduction_items": afterLine10((figures) => figures.stock.line11),
    "0.line.12_debt_basis_restoration": afterLine10((figures) => aboveZero(figures.stock.line12)),
    "0.line.14_total_loss_restoration_other": afterLine10((figures) => figures.stock.line14),
    "0.line.15_stock_basis_end": fromFigures((figures) => figures.stock.line15),
  };
}

/* Part II column (d), the total of the loans; lines with no amount stay blank. */
const DEBT_FIELDS: Array<[string, (debt: DebtBasisLines) => number | undefined]> = [
  ["0.line.16_loan_balance_beginning_col_d", (debt) => debt.line16],
  ["0.line.17_additional_loans_col_d", (debt) => aboveZero(debt.line17)],
  ["0.line.18_loan_balance_before_repayment_col_d", (debt) => debt.line18],
  ["0.line.20_loan_balance_end_col_d", (debt) => debt.line20],
  ["1.line.21_debt_basis_beginning_col_d", (debt) => debt.line21],
  ["1.line.22_amount_from_line_17_col_d", (debt) => aboveZero(debt.line22)],
  ["1.line.23_debt_basis_restoration_col_d", (debt) => aboveZero(debt.line23)],
  ["1.line.24_debt_basis_before_repayment_col_d", (debt) => debt.line24],
  ["1.line.27_debt_basis_before_nondeductible_col_d", (debt) => debt.line27],
  ["1.line.28_nondeductible_expenses_excess_col_d", (debt) => aboveZero(debt.line28)],
  ["1.line.29_debt_basis_before_losses_col_d", (debt) => debt.line29],
  ["1.line.30_allowable_losses_excess_col_d", (debt) => aboveZero(debt.line30)],
  ["1.line.31_debt_basis_end_col_d", (debt) => debt.line31],
];

/*
 * Part II (irs-7203-inst-2025::sec::part-ii::b01 to ::line-30::b01), only for a
 * shareholder with loans. Lines 19, 26 and 32 to 34 stay blank: a loan
 * repayment stops the computation (basis.ts), so none reaches the form.
 */
function partIIBindings(): Record<string, Fn> {
  const blankWithoutRepayment = fromFigures(() => undefined);
  return {
    ...Object.fromEntries(
      DEBT_FIELDS.map(([field, read]): [string, Fn] => [
        field,
        fromFigures((figures) => (figures.debt ? read(figures.debt) : undefined)),
      ]),
    ),
    "0.line.19_principal_debt_repayment_col_d": blankWithoutRepayment,
    "1.line.26_nontaxable_debt_repayment_col_d": blankWithoutRepayment,
    "1.line.32_repayment_col_d": blankWithoutRepayment,
    "1.line.33_nontaxable_repayments_col_d": blankWithoutRepayment,
    "1.line.34_reportable_gain_col_d": blankWithoutRepayment,
  };
}

const PART_III_FIELDS: Record<PartIIILine, string> = {
  "35": "1.line.35_ordinary_business_loss",
  "36": "1.line.36_net_rental_real_estate_loss",
  "37": "1.line.37_other_net_rental_loss",
  "38": "1.line.38_net_capital_loss",
  "39": "1.line.39_net_section_1231_loss",
  "40": "1.line.40_other_loss",
  "41": "1.line.41_section_179_deductions",
  "42": "1.line.42_charitable_contributions",
  "43": "1.line.43_investment_interest_expense",
  "44": "1.line.44_section_59e2_expenditures",
  "45": "1.line.45_other_deductions",
  "46": "1.line.46_foreign_taxes_paid",
};

type Column = "a" | "b" | "c" | "d" | "e";
const COLUMNS: Column[] = ["a", "b", "c", "d", "e"];

const COLUMN_OF: Record<Column, (row: PartIIIRow) => number> = {
  a: (row) => row.current,
  b: (row) => row.carriedIn,
  c: (row) => row.fromStock,
  d: (row) => row.fromDebt,
  e: (row) => row.carriedOut,
};

/*
 * Columns (c) and (d) are skipped when their basis is 0, and (d) also when
 * column (c) is less than line 10 (irs-7203-inst-2025::sec::part-iii::b01,
 * ::b02); (a), (b) and (e) print only an amount.
 */
function columnUsed(figures: BasisFigures, column: Column): boolean {
  if (column === "c") return figures.stock.line10 > 0;
  if (column === "d") {
    const line29 = figures.debt?.line29 ?? 0;
    return line29 > 0 && figures.stock.line11 >= figures.stock.line10;
  }
  return true;
}

/* One Part III cell: the column summed over the line's items (line 38 holds both capital losses). */
function partIIICell(rows: PartIIIRow[], figures: BasisFigures, column: Column) {
  if (rows.length === 0 || !columnUsed(figures, column)) return undefined;
  const amount = rows.reduce((total, row) => total + COLUMN_OF[column](row), 0);
  return column === "c" || column === "d" ? amount : aboveZero(amount);
}

/* Part III, lines 35 to 47 (irs-7203-inst-2025::sec::part-iii::b01 to ::b03). */
function partIIIBindings(): Record<string, Fn> {
  const lines = Object.entries(PART_III_FIELDS).flatMap(([line, stem]) =>
    COLUMNS.map((column): [string, Fn] => [
      `${stem}_col_${column}`,
      fromFigures((figures) =>
        partIIICell(
          figures.rows.filter((row) => row.line === line),
          figures,
          column,
        ),
      ),
    ]),
  );
  const totals = COLUMNS.map((column): [string, Fn] => [
    `1.line.47_total_loss_col_${column}`,
    fromFigures((figures) => partIIICell(figures.rows, figures, column)),
  ]);
  return Object.fromEntries([...lines, ...totals]);
}

const ONE_TOTAL =
  "The holding gives one total for all of the shareholder's loans, so the engine fills column (d) only; one column for each formal note is not modeled.";

/* The Part II fields of columns (a) to (c), and the loan kind checkboxes. */
function perLoanFields(): Record<string, string> {
  const stems = [
    "0.line.16_loan_balance_beginning",
    "0.line.17_additional_loans",
    "0.line.18_loan_balance_before_repayment",
    "0.line.19_principal_debt_repayment",
    "0.line.20_loan_balance_end",
    "1.line.21_debt_basis_beginning",
    "1.line.22_amount_from_line_17",
    "1.line.23_debt_basis_restoration",
    "1.line.24_debt_basis_before_repayment",
    "1.line.25_repayment_basis_ratio",
    "1.line.26_nontaxable_debt_repayment",
    "1.line.27_debt_basis_before_nondeductible",
    "1.line.28_nondeductible_expenses_excess",
    "1.line.29_debt_basis_before_losses",
    "1.line.30_allowable_losses_excess",
    "1.line.31_debt_basis_end",
    "1.line.32_repayment",
    "1.line.33_nontaxable_repayments",
    "1.line.34_reportable_gain",
    "0.line.section_a_formal_note",
    "0.line.section_a_open_account",
  ];
  return Object.fromEntries(
    stems.flatMap((stem) => ["a", "b", "c"].map((column) => [`${stem}_col_${column}`, ONE_TOTAL])),
  );
}

export function register(): void {
  defineForm<Form7203, Form7203FilingInfo>("form-7203", {
    bindings: {
      ...headerBindings(),
      ...partIBindings(),
      ...partIIBindings(),
      ...partIIIBindings(),
    } as Spec["bindings"],
    unsupported: {
      "0.header.c_stock_block":
        "No fact gives a stock block; one form covers all of the shareholder's stock (irs-7203-inst-2025::sec::item-c::b01).",
      "0.header.d5_other_description":
        "No fact describes another way the stock was acquired (item D(5)).",
      "0.header.e_section_1367_election":
        "No fact gives a Regulations section 1.1367-1(g) election; the engine figures basis without it (item E).",
      "0.line.3j_excess_depletion_adjustment":
        "No K-1 item gives the excess depletion adjustment (line 3j).",
      "0.line.3l_recapture_business_credits":
        "A K-1 credit recapture's effect on basis is not modeled (line 3l): the K-1 is unsupported.",
      "0.line.3m_other_items_increase_basis": "No fact gives other items that increase basis.",
      "0.line.8b_depletion_oil_gas": "Oil and gas depletion (line 8b) is not modeled.",
      "0.line.8c_business_credits":
        "A K-1 credit's effect on basis (line 8c) is not modeled: the K-1 is unsupported.",
      "0.line.13_other_items_decrease_basis":
        "No fact gives other decreases (line 13): a sale of part of the stock stops the K-1.",
      ...perLoanFields(),
    } as Spec["unsupported"],
  });
}
