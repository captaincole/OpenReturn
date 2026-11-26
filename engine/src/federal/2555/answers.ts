/*
 * Form 2555 Parts I to III: the taxpayer's answers as the form prints them
 * (irs-2555-face-2025::sec::face-part-i::b01 to face-part-iii::b01). No
 * arithmetic here: each field shows one answer of the person's fact.
 */

import type {
  BonaFideResidence,
  ForeignEarnedIncomeFactValue,
  Form2555EmployerType,
  Form2555LivingQuarters,
  PhysicalPresence,
} from "../../facts/index.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form2555FilingInfo } from "./filingInfo.js";
import type { Form2555Filer } from "./person.js";

type Value = string | number | boolean | Unsupported | undefined;
type Binding = (form: unknown, info: Form2555FilingInfo) => Value;

/* Line 9's face: "If an item doesn't apply, enter 'N/A.'" (irs-2555-face-2025::sec::face-part-i::b02). */
const NOT_APPLICABLE = "N/A";
/* Line 18 with no travel (irs-2555-face-2025::sec::face-part-iii::b01). */
export const NO_TRAVEL =
  "Physically present in a foreign country or countries for the entire 12-month period.";
const US_VISIT_ROWS = 8;
const PRESENCE_ROWS = 4;
const TOO_MANY_VISITS =
  "More than 8 stays in the United States: line 14 has 8 rows, and the engine writes no attached statement.";
const TOO_MANY_STAYS =
  "More than 4 stays during the 12-month period: line 18 has 4 rows, and the engine writes no attached statement.";

/* This copy's person: the first copy is the taxpayer's, or the only person's. */
export function filerOf(info: Form2555FilingInfo): Form2555Filer | undefined {
  return info.form2555Filers?.[info.form2555CopyIndex ?? 0];
}

/* A field that prints one answer; blank with no person. */
export function answer(
  pick: (value: ForeignEarnedIncomeFactValue, filer: Form2555Filer) => Value,
): Binding {
  return (_, info) => {
    const filer = filerOf(info);
    return filer === undefined ? undefined : pick(filer.answers, filer);
  };
}

const checked = (yes: boolean) => (yes ? true : undefined);
const yesBox = (value: boolean | undefined) => (value === undefined ? undefined : checked(value));
const noBox = (value: boolean | undefined) => (value === undefined ? undefined : checked(!value));

/* A text answer on two lines: what comes after the first line break goes on the second. */
function textLine(text: string | undefined, line: 0 | 1): string | undefined {
  if (text === undefined) return undefined;
  const [first, ...rest] = text.split("\n");
  return line === 0 ? first : rest.length > 0 ? rest.join(" ") : undefined;
}

const employerType = (type: Form2555EmployerType) =>
  answer((value) => (value.employer ? checked(value.employer.types.includes(type)) : undefined));

/* Line 6c is answered only after line 6a: line 6b sends a first-time filer to line 7. */
const revoked = (value: ForeignEarnedIncomeFactValue) =>
  value.lastYearFiled === undefined ? undefined : value.revocation !== undefined;

/* Line 9: "List your tax home(s) during your tax year and date(s) established." */
const taxHomeText = (home: { location: string; established: string }) =>
  `${home.location} (established ${home.established})`;

export const partIBindings: Record<string, Binding> = {
  "0.line.1_foreign_address": answer((value) => value.foreignAddress),
  "0.line.2_occupation": answer((value) => value.occupation),
  "0.line.3_employer_name": answer((value) => value.employer?.name ?? NOT_APPLICABLE),
  "0.line.4a_employer_us_address": answer((value) => value.employer?.usAddress ?? NOT_APPLICABLE),
  "0.line.4b_employer_foreign_address": answer(
    (value) => value.employer?.foreignAddress ?? NOT_APPLICABLE,
  ),
  "0.line.5a_employer_foreign_entity": employerType("foreign_entity"),
  "0.line.5b_employer_us_company": employerType("us_company"),
  "0.line.5c_employer_self": employerType("self"),
  "0.line.5d_employer_foreign_affiliate": employerType("foreign_affiliate"),
  "0.line.5e_employer_other": employerType("other"),
  "0.line.5e_employer_other_specify": answer((value) =>
    value.employer?.types.includes("other") ? value.employer.otherType : undefined,
  ),
  "0.line.6a_last_year_filed": answer((value) =>
    value.lastYearFiled === undefined ? undefined : String(value.lastYearFiled),
  ),
  "0.line.6b_not_previously_filed": answer((value) => checked(value.lastYearFiled === undefined)),
  "0.line.6c_revoked_exclusions_yes": answer((value) => yesBox(revoked(value))),
  "0.line.6c_revoked_exclusions_no": answer((value) => noBox(revoked(value))),
  "0.line.6d_revocation_type_and_year": answer((value) =>
    value.lastYearFiled === undefined ? undefined : value.revocation,
  ),
  "0.line.7_country_of_citizenship": answer((value) => value.citizenship),
  "0.line.8a_separate_foreign_residence_yes": answer((value) => checked(!!value.secondHousehold)),
  "0.line.8a_separate_foreign_residence_no": answer((value) => checked(!value.secondHousehold)),
  "0.line.8b_separate_residence_city_country_days": answer((value) =>
    value.secondHousehold
      ? `${value.secondHousehold.cityCountry}; ${value.secondHousehold.days} days`
      : undefined,
  ),
  "0.line.9_tax_homes_dates_established": answer((value) =>
    value.taxHomes.length === 0 ? undefined : taxHomeText(value.taxHomes[0]),
  ),
  "0.line.9_tax_homes_dates_established_line2": answer((value) =>
    value.taxHomes.length < 2 ? undefined : value.taxHomes.slice(1).map(taxHomeText).join("; "),
  ),
};

/* A Part II field: blank unless the person uses the bona fide residence test. */
const residence = (pick: (residence: BonaFideResidence) => Value) =>
  answer((value) => (value.bonaFideResidence ? pick(value.bonaFideResidence) : undefined));

const quarters = (kind: Form2555LivingQuarters) =>
  residence((part) => checked(part.livingQuarters.includes(kind)));

/* Line 14, one row per stay in the United States; more rows than the form has is a gap. */
function visitCell(row: number, column: "a" | "b" | "c" | "d"): Binding {
  return answer((value, filer) => {
    const visits = value.bonaFideResidence?.usVisits;
    if (visits === undefined) return undefined;
    if (visits.length > US_VISIT_ROWS) return unsupported(TOO_MANY_VISITS);
    const visit = visits[row - 1];
    if (visit === undefined) return undefined;
    if (column === "a") return visit.arrived;
    if (column === "b") return visit.left;
    if (column === "c") return visit.businessDays;
    return filer.usBusinessIncome[row - 1];
  });
}

function partIIBindings(): Record<string, Binding> {
  const rows: Record<string, Binding> = {};
  for (let row = 1; row <= US_VISIT_ROWS; row++) {
    for (const column of ["a", "b", "c", "d"] as const) {
      rows[`0.line.14_row${row}_col_${column}`] = visitCell(row, column);
    }
  }
  return {
    "0.line.10_bona_fide_residence_began": residence((part) => part.began),
    // "If you are still a bona fide resident, enter 'Continues'" (irs-2555-inst-2025::sec::line-10::b01).
    "0.line.10_bona_fide_residence_ended": residence((part) => part.ended ?? "Continues"),
    "0.line.11a_living_quarters_purchased_house": quarters("purchased_house"),
    "0.line.11b_living_quarters_rented_house": quarters("rented_house"),
    "0.line.11c_living_quarters_rented_room": quarters("rented_room"),
    "0.line.11d_living_quarters_employer_furnished": quarters("employer_quarters"),
    "0.line.12a_family_lived_abroad_yes": residence((part) => checked(!!part.familyAbroad)),
    "0.line.12a_family_lived_abroad_no": residence((part) => checked(!part.familyAbroad)),
    "0.line.12b_family_who_and_period": residence((part) => part.familyAbroad),
    "0.line.13a_nonresident_statement_submitted_yes": residence((part) =>
      yesBox(part.nonresidentStatement),
    ),
    "0.line.13a_nonresident_statement_submitted_no": residence((part) =>
      noBox(part.nonresidentStatement),
    ),
    "0.line.13b_foreign_income_tax_required_yes": residence((part) =>
      yesBox(part.foreignIncomeTaxRequired),
    ),
    "0.line.13b_foreign_income_tax_required_no": residence((part) =>
      noBox(part.foreignIncomeTaxRequired),
    ),
    ...rows,
    "0.line.15a_employment_contract_terms": residence((part) => textLine(part.contractTerms, 0)),
    "0.line.15a_employment_contract_terms_line2": residence((part) =>
      textLine(part.contractTerms, 1),
    ),
    "0.line.15b_visa_type": residence((part) => part.visaType),
    "0.line.15c_visa_limited_stay_yes": residence((part) => yesBox(part.visaLimitedStay)),
    "0.line.15c_visa_limited_stay_no": residence((part) => noBox(part.visaLimitedStay)),
    "0.line.15d_maintained_us_home_yes": residence((part) => checked(!!part.usHome)),
    "0.line.15d_maintained_us_home_no": residence((part) => checked(!part.usHome)),
    "0.line.15e_us_home_address_occupants": residence((part) => textLine(part.usHome, 0)),
    "0.line.15e_us_home_address_occupants_line2": residence((part) => textLine(part.usHome, 1)),
  };
}

/* A Part III field: blank unless the person uses the physical presence test. */
const presence = (pick: (presence: PhysicalPresence) => Value) =>
  answer((value) => (value.physicalPresence ? pick(value.physicalPresence) : undefined));

/* Line 18, one row per stay; no stay prints the form's sentence in row 1. */
function stayCell(row: number, column: "a" | "b" | "c" | "d" | "e" | "f"): Binding {
  return answer((value, filer) => {
    if (value.physicalPresence === undefined) return undefined;
    const stays = value.physicalPresence.stays ?? [];
    if (stays.length > PRESENCE_ROWS) return unsupported(TOO_MANY_STAYS);
    if (stays.length === 0) return row === 1 && column === "a" ? NO_TRAVEL : undefined;
    const stay = stays[row - 1];
    if (stay === undefined) return undefined;
    const cells = {
      a: stay.country,
      b: stay.arrived,
      c: stay.left,
      d: stay.fullDays,
      e: stay.usBusinessDays,
      f: filer.usBusinessIncome[row - 1],
    };
    return cells[column];
  });
}

function partIIIBindings(): Record<string, Binding> {
  const rows: Record<string, Binding> = {};
  for (let row = 1; row <= PRESENCE_ROWS; row++) {
    for (const column of ["a", "b", "c", "d", "e", "f"] as const) {
      rows[`1.line.18_row${row}_col_${column}`] = stayCell(row, column);
    }
  }
  return {
    "1.line.16_physical_presence_period_from": presence((part) => part.from),
    "1.line.16_physical_presence_period_through": presence((part) => part.through),
    "1.line.17_principal_country_of_employment": presence((part) => part.principalCountry),
    ...rows,
  };
}

export const answerBindings = (): Record<string, Binding> => ({
  ...partIBindings,
  ...partIIBindings(),
  ...partIIIBindings(),
});
