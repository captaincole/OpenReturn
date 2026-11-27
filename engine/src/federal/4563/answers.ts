/*
 * Form 4563 Part I: the person's answers as the form prints them
 * (irs-4563-form-2025::sec::face-part-i::b01). No arithmetic here but the
 * days of line 6 column (c) (lines.ts).
 */

import type {
  AmericanSamoaExclusionFactValue,
  AmericanSamoaLivingQuarters,
} from "../../facts/index.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form4563FilingInfo } from "./filingInfo.js";
import { daysAbsent, type Form4563Filer } from "./lines.js";

type Value = string | number | boolean | Unsupported | undefined;
export type Binding = (form: unknown, info: Form4563FilingInfo) => Value;

/* Line 1 for a residence that goes on, the word Form 2555 line 10 asks for (QUESTIONS.md). */
const CONTINUES = "Continues";
const ABSENCE_ROWS = 4;
const TOO_MANY_ABSENCES =
  "More than 4 absences from American Samoa: line 6 has 4 rows, and the instructions give no rule for more (the engine writes no attached statement).";
const BAD_DATE = "A date of this absence is not a date in MM/DD/YYYY form.";

/* This copy's person: the first copy is the taxpayer's, or the only person's. */
export function filerOf(info: Form4563FilingInfo): Form4563Filer | undefined {
  return info.form4563Filers?.[info.form4563CopyIndex ?? 0];
}

/* A field that prints one answer; blank with no person. */
export function answer(
  pick: (value: AmericanSamoaExclusionFactValue, filer: Form4563Filer) => Value,
): Binding {
  return (_, info) => {
    const filer = filerOf(info);
    return filer === undefined ? undefined : pick(filer.answers, filer);
  };
}

const checked = (yes: boolean) => (yes ? true : undefined);

/* A text answer on two lines: what comes after the first line break goes on the second. */
function textLine(text: string | undefined, line: 0 | 1): string | undefined {
  if (text === undefined || text === "") return undefined;
  const [first, ...rest] = text.split("\n");
  return line === 0 ? first : rest.length > 0 ? rest.join(" ") : undefined;
}

const quarters = (kind: AmericanSamoaLivingQuarters) =>
  answer((value) => checked(value.livingQuarters.includes(kind)));

/* Line 6, one row per absence; more absences than the form has rows is a gap. */
function absenceCell(row: number, column: "a" | "b" | "c" | "d"): Binding {
  return answer((value) => {
    const absences = value.absences ?? [];
    if (absences.length > ABSENCE_ROWS) return unsupported(TOO_MANY_ABSENCES);
    const absence = absences[row - 1];
    if (absence === undefined) return undefined;
    if (column === "a") return absence.left;
    if (column === "b") return absence.returned;
    if (column === "d") return absence.reason;
    return daysAbsent(absence.left, absence.returned) ?? unsupported(BAD_DATE);
  });
}

function absenceBindings(): Record<string, Binding> {
  const rows: Record<string, Binding> = {};
  for (let row = 1; row <= ABSENCE_ROWS; row++) {
    rows[`0.line.6_row${row}_date_left_col_a`] = absenceCell(row, "a");
    rows[`0.line.6_row${row}_date_returned_col_b`] = absenceCell(row, "b");
    rows[`0.line.6_row${row}_days_absent_col_c`] = absenceCell(row, "c");
    rows[`0.line.6_row${row}_reason_for_absence_col_d`] = absenceCell(row, "d");
  }
  return rows;
}

const family = (value: AmericanSamoaExclusionFactValue) => value.familyInAmericanSamoa;
const homes = (value: AmericanSamoaExclusionFactValue) => value.homesOutsideAmericanSamoa;
const hasText = (text: string | undefined) => text !== undefined && text !== "";

export function partIBindings(): Record<string, Binding> {
  return {
    "0.line.1_bona_fide_residence_began": answer((value) => value.residenceBegan),
    "0.line.1_bona_fide_residence_ended": answer((value) => value.residenceEnded ?? CONTINUES),
    "0.line.2_living_quarters_rented_room": quarters("rented_room"),
    "0.line.2_living_quarters_rented_house_apartment": quarters("rented_house"),
    "0.line.2_living_quarters_furnished_employer": quarters("employer_quarters"),
    "0.line.2_living_quarters_purchased_home": quarters("purchased_home"),
    "0.line.3a_family_lived_with_you_yes": answer((value) => checked(hasText(family(value)))),
    "0.line.3a_family_lived_with_you_no": answer((value) => checked(!hasText(family(value)))),
    "0.line.3b_family_who_and_period": answer((value) => textLine(family(value), 0)),
    "0.line.3b_family_who_and_period_cont": answer((value) => textLine(family(value), 1)),
    "0.line.4a_home_outside_samoa_yes": answer((value) => checked(hasText(homes(value)))),
    "0.line.4a_home_outside_samoa_no": answer((value) => checked(!hasText(homes(value)))),
    "0.line.4b_homes_outside_samoa": answer((value) => textLine(homes(value), 0)),
    "0.line.4b_homes_outside_samoa_cont": answer((value) => textLine(homes(value), 1)),
    "0.line.5_employer_name_address": answer((value) => textLine(value.employer, 0)),
    "0.line.5_employer_name_address_cont": answer((value) => textLine(value.employer, 1)),
    ...absenceBindings(),
  };
}
