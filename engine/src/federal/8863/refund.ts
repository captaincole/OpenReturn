/*
 * Part I line 7: can the filer take part of the American opportunity credit as
 * a refundable credit? The seven questions of irs-8863-inst-2025::sec::line-7::b02,
 * b03, in their order. Ages are at the end of 2025, and a January 1 birthday
 * counts as the day before, as for the same test on the kiddie tax ("A child
 * born on January 1, 2008, is considered to be age 18 at the end of 2025",
 * irs-1040-inst-2025::sec::tax-table-or-tax-computation-work::b02).
 */

import { bornBeforeJan2Of } from "../../birthDate.js";
import type { EducationRefundAnswersFactValue } from "../../facts/index.js";

/* Born before January 2, 2002: 24 or older at the end of 2025. */
const AGE_24_YEAR = 2002;
/* Born before January 2, 2007: over 18 (19 or older). */
const OVER_18_YEAR = 2007;
/* Born before January 2, 2008: 18 or older. */
const AGE_18_YEAR = 2008;

export type AgeGroup = "under_18" | "age_18" | "over_18_under_24" | "24_or_older";

/* The filer's age group at the end of 2025; undefined when the date of birth is missing. */
export function ageGroupOf(dob: string | undefined): AgeGroup | undefined {
  const age24 = bornBeforeJan2Of(dob, AGE_24_YEAR);
  if (age24 === undefined) return undefined;
  if (age24) return "24_or_older";
  if (bornBeforeJan2Of(dob, OVER_18_YEAR)) return "over_18_under_24";
  return bornBeforeJan2Of(dob, AGE_18_YEAR) ? "age_18" : "under_18";
}

/* "refundable"; "not_refundable" (check the line 7 box); or the answer the questions wait for. */
export type RefundOutcome =
  | { kind: "refundable" }
  | { kind: "not_refundable" }
  | { kind: "waits"; for: "date_of_birth" | keyof EducationRefundAnswersFactValue };

const REFUNDABLE: RefundOutcome = { kind: "refundable" };
const NOT_REFUNDABLE: RefundOutcome = { kind: "not_refundable" };

/* Questions 6 and 7: a parent alive at the end of 2025, and no joint return. */
function parentQuestion(answers: EducationRefundAnswersFactValue | undefined): RefundOutcome {
  const alive = answers?.parentAlive;
  if (alive === undefined) return { kind: "waits", for: "parentAlive" };
  return alive ? NOT_REFUNDABLE : REFUNDABLE;
}

/* Question 5: earned income less than one-half of support. */
function supportQuestion(answers: EducationRefundAnswersFactValue | undefined): RefundOutcome {
  const lessThanHalf = answers?.earnedIncomeLessThanHalfOfSupport;
  if (lessThanHalf === undefined) {
    return { kind: "waits", for: "earnedIncomeLessThanHalfOfSupport" };
  }
  return lessThanHalf ? parentQuestion(answers) : REFUNDABLE;
}

/*
 * The questions in order. A joint return answers question 7 "Yes" whatever the
 * others say, so it is asked first: a joint filer is never asked the rest.
 */
export function refundOutcome(
  joint: boolean,
  dob: string | undefined,
  answers: EducationRefundAnswersFactValue | undefined,
): RefundOutcome {
  if (joint) return REFUNDABLE;
  const group = ageGroupOf(dob);
  if (group === undefined) return { kind: "waits", for: "date_of_birth" };
  if (group === "24_or_older") return REFUNDABLE;
  if (group === "under_18") return parentQuestion(answers);
  if (group === "age_18") return supportQuestion(answers);
  const student = answers?.fullTimeStudent;
  if (student === undefined) return { kind: "waits", for: "fullTimeStudent" };
  return student ? supportQuestion(answers) : REFUNDABLE;
}
