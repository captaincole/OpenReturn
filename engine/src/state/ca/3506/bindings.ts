/* FTB 3506 rules, written by hand from ca-3506-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import type { CaHouseholdFundsEntry } from "../../../facts/index.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { roundDollars, sum } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { Phone } from "../../../values.js";
import type { CaCarePersonRow, CaCareProviderRow, Form3506FilingInfo } from "./filingInfo.js";
import { NO_PROVIDER, type Form } from "./gates.js";
import { PART_I_SLOTS, PERSON_ROWS, PROVIDER_COLUMNS } from "./lines.js";
import { partIIIBindings } from "./partIII.js";
import { partIVBindings } from "./partIV.js";
import type { Form3506 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3506]: BindingFn<Form3506, Form3506FilingInfo, K> }>;
type RowBinding = (form: Form, info: Form3506FilingInfo) => unknown;

const PART_I_OVERFLOW = unsupported(
  "Part I has six places and the instructions give no continuation statement; a seventh source of household money is not printed.",
);
const PROVIDER_STATEMENT = unsupported(
  "A third care provider in California goes on an attached sheet (line 1: 'If you need more space, attach a separate sheet'), which is not modeled.",
);
const PERSON_STATEMENT = unsupported(
  "A fourth qualifying person goes on an attached sheet marked 'see attached' (ca-3506-inst-2025::sec::line-2::b01), which is not modeled.",
);
const NO_PROVIDER_TIN = unsupported(
  "The care provider's identification number is not recorded, and the explanation that the provider did not give it (ca-3506-inst-2025::sec::line-1::b01) is not modeled.",
);
/* "See W-2" when the employer furnished the care (ca-3506-inst-2025::sec::line-1a-through-line-1c::b01). */
const SEE_W2 = "See W-2";

/*
 * Part I (ca-3506-inst-2025::sec::part-i-unearned-income-and-other-funds-received-in-2025::b01):
 * money that supported the household and is not earned income. The return's
 * own amounts come first, then the stated ones (child support and the rest).
 */
const RETURN_FUNDS = [
  { source: "Interest", lines: ["form-1040.line.2a", "form-1040.line.2b"] },
  { source: "Dividends", lines: ["form-1040.line.3b"] },
  { source: "Pensions, annuities and IRAs", lines: ["form-1040.line.4b", "form-1040.line.5b"] },
  { source: "Social security", lines: ["form-1040.line.6a"] },
  { source: "Unemployment compensation", lines: ["schedule-1.0.line.7"] },
];

function partIEntries(form: Form, info: Form3506FilingInfo): CaHouseholdFundsEntry[] {
  const fromReturn: CaHouseholdFundsEntry[] = RETURN_FUNDS.map(({ source, lines }) => ({
    source,
    amount: roundDollars(sum(...lines.map((id) => form[id]))),
  })).filter(({ amount }) => amount > 0);
  // While the stated list waits, the slots after the return's amounts stay blank.
  const others = (info.caHouseholdFunds ?? [])
    .map(({ source, amount }) => ({ source, amount: roundDollars(amount) }))
    .filter(({ amount }) => amount > 0);
  return [...fromReturn, ...others];
}

/* Part I slot `index` (0 to 5, left to right, top to bottom). */
function partISlot(form: Form, info: Form3506FilingInfo, index: number) {
  const entries = partIEntries(form, info);
  if (index === PART_I_SLOTS - 1 && entries.length > PART_I_SLOTS) return PART_I_OVERFLOW;
  return entries[index];
}

/* The six Part I places in reading order: row, then left before right. */
const PART_I_PLACES: Array<[number, "left" | "right"]> = [1, 2, 3].flatMap((row) => [
  [row, "left"] as [number, "left"],
  [row, "right"] as [number, "right"],
]);

function partIBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (let index = 0; index < PART_I_SLOTS; index++) {
    const [row, side] = PART_I_PLACES[index];
    const prefix = `0.part1.row${row}`;
    const slot = (form: Form, info: Form3506FilingInfo) => partISlot(form, info, index);
    bindings[`${prefix}_source_of_income_${side}`] = (form, info) => {
      const found = slot(form, info);
      return found === undefined || "unsupported" in found ? found : found.source;
    };
    bindings[`${prefix}_amount_${side}`] = (form, info) => {
      const found = slot(form, info);
      return found === undefined || "unsupported" in found ? found : found.amount;
    };
  }
  return bindings as Bindings;
}

/* Line 1, one column per provider in the order recorded (ca-3506-inst-2025::sec::line-1::b01). */
function providerBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (let column = 1; column <= PROVIDER_COLUMNS; column++) {
    const provider = (info: Form3506FilingInfo): CaCareProviderRow | undefined =>
      info.caCareProviders?.[column - 1];
    const read =
      (pick: (found: CaCareProviderRow) => unknown): RowBinding =>
      (_, info) => {
        const found = provider(info);
        return found === undefined ? undefined : pick(found);
      };
    const suffix = `provider${column}`;
    bindings[`0.line.1a_care_provider_name_${suffix}`] = (_, info) => {
      const providers = info.caCareProviders ?? [];
      if (column === PROVIDER_COLUMNS && providers.length > PROVIDER_COLUMNS) {
        return PROVIDER_STATEMENT;
      }
      const found = provider(info);
      if (found !== undefined) return found.name;
      const expenses = (info.caCarePersons ?? []).some(
        (person) => (person.californiaExpenses ?? 0) > 0,
      );
      return column === 1 && expenses ? unsupported(NO_PROVIDER) : undefined;
    };
    bindings[`0.line.1b_care_provider_address_${suffix}`] = read((found) =>
      found.employerProvided ? SEE_W2 : found.address,
    );
    bindings[`0.line.1c_care_provider_telephone_${suffix}`] = read((found) => found.phone);
    bindings[`0.line.1d_person_or_organization_${suffix}`] = read((found) => found.providerType);
    bindings[`0.line.1e_identification_number_${suffix}`] = read(
      (found) => found.tin ?? NO_PROVIDER_TIN,
    );
    bindings[`0.line.1f_address_where_care_provided_${suffix}`] = read(
      (found) => found.careAddress,
    );
    // ca-3506-inst-2025::sec::line-1g::b01: paid in 2025, not reduced by reimbursements; blank for employer care.
    bindings[`0.line.1g_amount_paid_for_care_${suffix}`] = read((found) =>
      found.employerProvided ? undefined : roundDollars(found.amountPaid),
    );
  }
  return bindings as Bindings;
}

/* Line 2, one row per qualifying person (ca-3506-inst-2025::sec::column-a::b01 to ::column-e::b01). */
function personBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (let row = 1; row <= PERSON_ROWS; row++) {
    const person = (info: Form3506FilingInfo): CaCarePersonRow | undefined =>
      info.caCarePersons?.[row - 1];
    const read =
      (pick: (found: CaCarePersonRow) => unknown): RowBinding =>
      (_, info) => {
        const found = person(info);
        return found === undefined ? undefined : pick(found);
      };
    const prefix = `0.line.2_row${row}`;
    bindings[`${prefix}_first_name_col_a`] = (_, info) => {
      const persons = info.caCarePersons ?? [];
      if (row === PERSON_ROWS && persons.length > PERSON_ROWS) return PERSON_STATEMENT;
      return person(info)?.firstName;
    };
    bindings[`${prefix}_last_name_col_a`] = read((found) => found.lastName);
    bindings[`${prefix}_ssn_col_b`] = read((found) => found.ssn);
    bindings[`${prefix}_date_of_birth_col_c`] = read((found) => found.dob);
    bindings[`${prefix}_disabled_col_c`] = read((found) => found.disabled);
    bindings[`${prefix}_physical_custody_percentage_col_d`] = read((found) =>
      found.custodyPercent === undefined ? undefined : String(found.custodyPercent),
    );
    bindings[`${prefix}_qualified_expenses_col_e`] = read((found) =>
      roundDollars(found.californiaExpenses),
    );
  }
  return bindings as Bindings;
}

/* Every FTB 3506 binding; the unit tests evaluate them without the engine. */
export function form3506Bindings(): Bindings {
  return {
    "0.header.name": (_, info) => namesOnReturn(info),
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    ...partIBindings(),
    ...providerBindings(),
    ...personBindings(),
    ...partIIIBindings(),
    ...partIVBindings(),
  };
}

const formatPhone = (value: string) => Phone.format(value as Parameters<typeof Phone.format>[0]);

export function register(): void {
  defineForm<Form3506, Form3506FilingInfo>("form-3506", {
    bindings: form3506Bindings(),
    formatters: {
      "0.line.1c_care_provider_telephone_provider1": formatPhone,
      "0.line.1c_care_provider_telephone_provider2": formatPhone,
    },
  });
}
