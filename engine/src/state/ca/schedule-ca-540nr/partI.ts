/*
 * Schedule CA (540NR) Part I, Residency Information: "Answer all the
 * questions in this part for you and your spouse/RDP. If a question does not
 * apply, then leave the line blank"
 * (ca-540nr-sched-ca-inst-2025::sec::part-i-residency-information::b01). Each
 * line prints the person's stated answer (facts/kinds/caResidency.ts); the
 * engine does not test residency. The spouse column is for a joint return.
 */

import type { BindingFn } from "../../../defineForm.js";
import {
  CA_RESIDENCY,
  type CaPersonResidency,
  type CaResidencyFactValue,
} from "../../../facts/index.js";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleCa540NR } from "./types.js";

type Info = ScheduleCa540NRFilingInfo;
type Line<K extends keyof ScheduleCa540NR> = BindingFn<ScheduleCa540NR, Info, K>;
type AnyLine = BindingFn<ScheduleCa540NR, Info, keyof ScheduleCa540NR>;
type Person = "taxpayer" | "spouse";

function answersOf(info: Info, person: Person): CaResidencyFactValue | undefined {
  if (person === "taxpayer") return info.caResidencyTaxpayer;
  return info.filingStatus === "married_filing_jointly" ? info.caResidencySpouse : undefined;
}

/* The return's residency decision, as the taxpayer's box when the Part I fact is not recorded. */
const BOX_OF_DECISION: Record<string, CaPersonResidency> = {
  [CA_RESIDENCY.fullYear]: "resident",
  [CA_RESIDENCY.partYear]: "part_year_resident",
  [CA_RESIDENCY.nonresident]: "nonresident",
};

/* Line 1: the person's box; the taxpayer's falls back on the return's decision. */
export const line1aResidencyMyself: Line<"0.part1.1a_residency_myself"> = (_, info) =>
  info.caResidencyTaxpayer?.residency ??
  (info.caResidencyStatus === undefined ? undefined : BOX_OF_DECISION[info.caResidencyStatus]);
export const line1bResidencySpouse: Line<"0.part1.1b_residency_spouse"> = (_, info) =>
  answersOf(info, "spouse")?.residency;

type AnswerOf = (answers: CaResidencyFactValue) => string | number | undefined;

/*
 * Lines 2 to 8, each with a "yourself" and a "spouse" field: the line's name
 * on the form, and the answer it prints.
 */
const PER_PERSON_LINES: ReadonlyArray<[string, AnswerOf]> = [
  // Line 2a: domicile; line 2b: the military station (::line-2-domicile-and-military::b01).
  ["2a_domiciled_state", (answers) => answers.domicileState],
  ["2b_military_stationed_state", (answers) => answers.militaryStationState],
  // Line 3: became a resident (prior state, date); line 4: became a nonresident (new state, date).
  ["3_became_resident_prior_state", (answers) => answers.becameResident?.state],
  ["3_became_resident_move_date", (answers) => answers.becameResident?.date],
  ["4_became_nonresident_new_state", (answers) => answers.becameNonresident?.state],
  ["4_became_nonresident_move_date", (answers) => answers.becameNonresident?.date],
  // Line 5: nonresident the entire year (the state of residence).
  ["5_nonresident_entire_year_state", (answers) => answers.nonresidentAllYearState],
  // Line 6: days in California for any purpose (::line-6-the-number-of-days-i-spent-in-california::b01).
  ["6_days_in_ca", (answers) => answers.daysInCalifornia],
  // Line 7: "enter Y for Yes, N for No" (the form).
  ["7_owned_ca_home", (answers) => (answers.ownedCaliforniaProperty ? "Y" : "N")],
  // Line 8: the most recent period of California residency before 2025 (::line-8-...::b01).
  ["8_prior_ca_resident_begin_date", (answers) => answers.priorResidency?.begin],
  ["8_prior_ca_resident_end_date", (answers) => answers.priorResidency?.end],
];

/* One answer of one person: blank when the person has no answers or the question does not apply. */
const answer =
  (person: Person, pick: AnswerOf): AnyLine =>
  (_, info) => {
    const answers = answersOf(info, person);
    return answers === undefined ? undefined : pick(answers);
  };

const FIELD_OF_PERSON: Record<Person, string> = { taxpayer: "yourself", spouse: "spouse" };

export const PART_I_BINDINGS: Record<string, AnyLine> = {
  "0.part1.1a_residency_myself": line1aResidencyMyself as AnyLine,
  "0.part1.1b_residency_spouse": line1bResidencySpouse as AnyLine,
  ...Object.fromEntries(
    PER_PERSON_LINES.flatMap(([line, pick]) =>
      (["taxpayer", "spouse"] as const).map((person) => [
        `0.part1.${line}_${FIELD_OF_PERSON[person]}`,
        answer(person, pick),
      ]),
    ),
  ),
};
