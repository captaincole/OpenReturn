/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8609ACopy, Form8609AFilingInfo, Form8609APartII } from "./filingInfo.js";
import { decimalDigits } from "./lines.js";
import type { Form8609A } from "./types.js";

type Value = number | string | boolean | undefined;
type Binding = (form: unknown, info: Form8609AFilingInfo) => Value | Unsupported;
type Bindings = Partial<{ [K in keyof Form8609A]: BindingFn<Form8609A, Form8609AFilingInfo, K> }>;
type LineKey = keyof Form8609APartII;

/*
 * The cents box of a whole-dollar line: the engine rounds every line to the
 * dollar (CLAUDE.md, whole-dollar rounding), so a line with an amount prints
 * "00" (QUESTIONS.md).
 */
const NO_CENTS = "00";

const copyOf = (info: Form8609AFilingInfo): Form8609ACopy | undefined =>
  info.form8609ACopies?.[info.form8609ACopyIndex ?? 0];

/* Part II line `line`: unsupported from the copy's gap on, blank while it waits or with no copy. */
function lineOf(line: number, pick: (partII: Form8609APartII) => Value): Binding {
  return (_, info) => {
    const copy = copyOf(info);
    if (copy === undefined) return undefined;
    if (copy.gap && copy.gap.fromLine <= line) return unsupported(copy.gap.reason);
    if (copy.waitingOn && copy.waitingOn.length > 0) return undefined;
    return pick(copy.partII);
  };
}

const lineNumber = (key: LineKey): number => Number(key.slice("line".length));

/* A dollar line and its cents box. */
function dollarLine(key: LineKey): [Binding, Binding] {
  const line = lineNumber(key);
  return [
    lineOf(line, (partII) => partII[key]),
    lineOf(line, (partII) => (partII[key] === undefined ? undefined : NO_CENTS)),
  ];
}

/* A decimal line as its two boxes around the printed point. */
function decimalLine(key: LineKey): [Binding, Binding] {
  const line = lineNumber(key);
  const digits = (partII: Form8609APartII) => {
    const value = partII[key];
    return value === undefined ? undefined : decimalDigits(value);
  };
  return [
    lineOf(line, (partII) => digits(partII)?.whole),
    lineOf(line, (partII) => digits(partII)?.decimal),
  ];
}

/* Part I, from the building fact (specific-instructions::b01, b02). */
const partI =
  (pick: (copy: Form8609ACopy) => Value): Binding =>
  (_, info) => {
    const copy = copyOf(info);
    return copy === undefined ? undefined : pick(copy);
  };

function partIBindings(): Record<string, Binding> {
  return {
    // MANUAL EDIT: item A, "the building identification number (BIN) from Part I, item E, of Form 8609".
    "0.line.a_building_identification_number": partI(
      (copy) => copy.building.form8609.buildingIdentificationNumber,
    ),
    // MANUAL EDIT: item B, one box: the building, or its section 42(e) rehabilitation expenditures.
    "0.line.b_new_or_existing_building": partI((copy) =>
      copy.building.allocation === "building" ? true : undefined,
    ),
    "0.line.b_rehabilitation_expenditures": partI((copy) =>
      copy.building.allocation === "rehabilitation" ? true : undefined,
    ),
    // MANUAL EDIT: items C, D, E. The catalog row checks "Yes"; "No" prints no mark (QUESTIONS.md).
    "0.line.c_original_form_8609_in_records": partI((copy) => copy.building.hasSignedForm8609),
    "0.line.d_qualified_low_income_project": partI((copy) =>
      copy.building.hasSignedForm8609 ? copy.building.qualifiedAtYearEnd : undefined,
    ),
    "0.line.e_decrease_in_qualified_basis": partI((copy) =>
      copy.building.hasSignedForm8609 && copy.building.qualifiedAtYearEnd
        ? copy.building.qualifiedBasisDecreased
        : undefined,
    ),
  };
}

/* Part II (lines.ts, creditYear.ts, copies.ts). */
function partIIBindings(): Record<string, Binding> {
  const pairs: Array<[string, LineKey, "dollars" | "decimal"]> = [
    ["1_eligible_basis_building", "line1", "dollars"],
    ["2_low_income_portion", "line2", "decimal"],
    ["3_qualified_basis_building", "line3", "dollars"],
    ["4_part_year_adjustment_disposition", "line4", "dollars"],
    ["5_percentage", "line5", "decimal"],
    ["7_additions_to_qualified_basis", "line7", "dollars"],
    ["8_part_year_adjustment_disposition", "line8", "dollars"],
    ["9_percentage", "line9", "decimal"],
    ["10_multiply_7_or_8_by_9", "line10", "dollars"],
    ["11_section_42f3b_modification", "line11", "dollars"],
    ["12_add_lines", "line12", "dollars"],
    ["13_credit_before_line_14_reduction", "line13", "dollars"],
    ["14_disallowed_credit_federal_grants", "line14", "dollars"],
    ["15_credit_allowed_for_building", "line15", "dollars"],
    ["16_proportionate_share_of_credit", "line16", "dollars"],
    ["17_deferred_first_year_credit_adjustments", "line17", "dollars"],
    ["18_taxpayers_credit", "line18", "dollars"],
  ];
  const out: Record<string, Binding> = {
    // MANUAL EDIT: line 6 has no cents box on the form.
    "0.line.6_multiply_3_or_4_by_5": lineOf(6, (partII) => partII.line6),
  };
  for (const [field, key, kind] of pairs) {
    const [first, second] = kind === "dollars" ? dollarLine(key) : decimalLine(key);
    out[`0.line.${field}`] = first;
    out[`0.line.${field}${kind === "dollars" ? "_cents" : "_decimal"}`] = second;
  }
  return out;
}

export function register(): void {
  defineForm<Form8609A, Form8609AFilingInfo>("form-8609-a", {
    bindings: {
      // MANUAL EDIT: the names and number of the return.
      "0.header.name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
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
