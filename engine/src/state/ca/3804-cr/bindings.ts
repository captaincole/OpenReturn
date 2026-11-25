/*
 * FTB 3804-CR, Pass-Through Entity Elective Tax Credit. Part I lists each
 * electing entity's credit (the stated K-1 amounts); Part II adds last year's
 * carryover and limits the credit to the tax left (creditUsed.ts). More than ten
 * entities take more forms; Part II is on the first.
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { numberOrBlank } from "../../../money.js";
import type { Unsupported } from "../../../types.js";
import { pteCreditClaimed } from "./creditUsed.js";
import type { Form3804CRFilingInfo, PteCreditRow } from "./filingInfo.js";
import {
  columnC,
  creditCarryover,
  partIILine1,
  partIILine2,
  partIILine3,
  partILine2,
  rowsByForm,
} from "./lines.js";
import type { Form3804CR } from "./types.js";

type Info = Form3804CRFilingInfo;
type Form = FormAccessor<Form3804CR>;
type Bindings = Partial<{ [K in keyof Form3804CR]: BindingFn<Form3804CR, Info, K> }>;

const ROW_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
type RowLetter = (typeof ROW_LETTERS)[number];

const copyIndex = (info: Info) => info.form3804CrCopyIndex ?? 0;
const allRows = (info: Info) => info.pteCreditRows ?? [];
/* The rows on the form being evaluated. */
const rowsOnForm = (info: Info) => rowsByForm(allRows(info))[copyIndex(info)] ?? [];

/* Every stated credit, or undefined while one waits. */
function statedCredits(rows: readonly PteCreditRow[]): number[] | undefined {
  const credits = rows.map((row) => row.credit);
  return credits.every((credit) => credit !== undefined) ? (credits as number[]) : undefined;
}

/*
 * Columns (a) to (c) of one row: the entity's name, its number and its credit
 * (ca-3804cr-inst-2025::sec::line-1-column-a-electing-qualified-pass-through-entity-pte-name::b01,
 * ::line-1-column-b-entity-identification-number::b01,
 * ::line-1-column-c-pte-elective-tax-credit-s::b01). A row with no entity is blank.
 */
function partIRow(index: number, letter: RowLetter): Bindings {
  const row = (info: Info) => rowsOnForm(info)[index];
  return {
    [`0.part1.1${letter}_electing_pte_col_a`]: (_: Form, info: Info) => row(info)?.entityName,
    [`0.part1.1${letter}_electing_pte_col_b`]: (_: Form, info: Info) => row(info)?.entityId,
    [`0.part1.1${letter}_electing_pte_col_c`]: (_: Form, info: Info) => {
      const credit = row(info)?.credit;
      return credit === undefined ? undefined : columnC(credit);
    },
  } as Bindings;
}

const partI: Bindings = Object.assign(
  {},
  ...ROW_LETTERS.map((letter, index) => partIRow(index, letter)),
  {
    // "Add the amounts in column (c)" (the form): this form's rows.
    "0.part1.2_total_pte_elective_tax_credit": (_: Form, info: Info) => {
      const rows = rowsOnForm(info);
      const credits = statedCredits(rows);
      return rows.length === 0 || credits === undefined ? undefined : partILine2(credits);
    },
  },
);

/* Part II is on the first form only: its line 1 adds every form's Part I line 2. */
const firstForm = (info: Info) => copyIndex(info) === 0;

function line3(info: Info): number | undefined {
  const credits = statedCredits(allRows(info));
  const carryover = info.pteCreditCarryover;
  if (credits === undefined || carryover === undefined) return undefined;
  return partIILine3(partIILine1(credits), carryover);
}

function line4(form: Form, info: Info): number | Unsupported | undefined {
  const available = line3(info);
  if (available === undefined) return undefined;
  return pteCreditClaimed((fieldId) => form[fieldId], info, available);
}

const partII: Bindings = {
  "0.part2.1_total_credit_from_ptes": (_, info) => {
    const credits = statedCredits(allRows(info));
    return firstForm(info) && credits !== undefined ? partIILine1(credits) : undefined;
  },
  // "Enter the carryover amount ... from the prior year" (ca-3804cr-inst-2025::sec::line-2-credit-carryover-from-prior-year::b01).
  "0.part2.2_credit_carryover_prior_year": (_, info) => {
    const carryover = info.pteCreditCarryover;
    return firstForm(info) && carryover !== undefined ? partIILine2(carryover) : undefined;
  },
  "0.part2.3_total_available_credit": (_, info) => (firstForm(info) ? line3(info) : undefined),
  "0.part2.4_credit_claimed_current_year": (form, info) =>
    firstForm(info) ? line4(form, info) : undefined,
  "0.part2.5_credit_carryover_future_years": (form, info) => {
    if (!firstForm(info)) return undefined;
    const available = numberOrBlank(form["0.part2.3_total_available_credit"]);
    const claimed = numberOrBlank(form["0.part2.4_credit_claimed_current_year"]);
    if (available === undefined || claimed === undefined) return undefined;
    return creditCarryover(available, claimed);
  },
};

/*
 * The header: the names on the return and the taxpayer's number. An individual
 * files with an SSN or ITIN; a disregarded SMLLC's owner enters the owner's own
 * name and number (ca-3804cr-inst-2025::sec::specific-line-instructions::b01).
 */
const header: Bindings = {
  "0.header.id_number_type": () => "ssn_or_itin",
  "0.header.name_on_return": (_, info) => namesOnReturn(info),
  "0.header.ssn_itin_or_fein": (_, info) => info.taxpayerSSN,
};

export function register(): void {
  defineForm<Form3804CR, Form3804CRFilingInfo>("form-3804-cr", {
    bindings: { ...header, ...partI, ...partII },
  });
}
