/*
 * Part I, "Should You File This Form?" (irs-8379-face-2025::sec::face-part-i::b01
 * to ::b03), and Part II, the joint return's names and the refund choices
 * (::face-part-ii::b01).
 */

import { numberOrBlank, sum } from "../../money.js";
import type { Unsupported } from "../../types.js";
import type { Form8379FilingInfo } from "./filingInfo.js";
import { partOneLines, type PartOneAnswers, type PartOneLine, type PartOneLines } from "./lines.js";
import { columnsOf, injuredShare, jointAmount, type Accessor } from "./partThree.js";

/* A line's answer: a box, a gap from Part III, or undefined while it waits. */
type Answer = boolean | Unsupported | undefined;

const isGap = (answer: Answer): answer is Unsupported => typeof answer === "object";

/* Column (b) of a Part III line, also when the line prints blank (then 0); undefined while it waits. */
function share(form: Accessor, info: Form8379FilingInfo, line: "19" | "20") {
  const columns = columnsOf(form, info, line);
  if (columns !== undefined) return "unsupported" in columns ? columns : columns.b;
  const joint = jointAmount(form, line);
  return typeof joint === "number" ? injuredShare(form, info, line, joint) : joint;
}

/* Line 6: the injured spouse's withholding or payments, Part III lines 19 and 20, column (b). */
function madePayments(form: Accessor, info: Form8379FilingInfo): Answer {
  const withheld = share(form, info, "19");
  const paid = share(form, info, "20");
  if (typeof withheld === "object") return withheld;
  if (typeof paid === "object") return paid;
  if (withheld === undefined || paid === undefined) return undefined;
  return sum(withheld, paid) > 0;
}

/* Line 8: the joint return claims the earned income credit (line 27a) or the additional child tax credit (line 28). */
function claimedEicOrActc(form: Accessor): boolean {
  return (
    (numberOrBlank(form["form-1040.line.27a"]) ?? 0) > 0 ||
    (numberOrBlank(form["form-1040.line.28"]) ?? 0) > 0
  );
}

/*
 * Line 9: the joint return claims a refundable credit of the line 9 list
 * (irs-8379-inst-2025::sec::line-9::b01): Part III line 17's credits less the
 * additional child tax credit, which line 8 asks about.
 */
function claimedRefundableCredit(form: Accessor): Answer {
  const credits = jointAmount(form, "17");
  if (typeof credits !== "number") return credits;
  return credits - (numberOrBlank(form["form-1040.line.28"]) ?? 0) > 0;
}

/* The answers each line reads; a gap stops Part I where it is read. */
function answersOf(form: Accessor, info: Form8379FilingInfo): Record<keyof PartOneAnswers, Answer> {
  const fact = info.form8379?.fact;
  const injured = info.form8379?.spouses?.injured;
  const status = info.filingStatus;
  return {
    joint: status === undefined ? undefined : status === "married_filing_jointly",
    offsetForOtherSpouseDebt: fact?.offsetForOtherSpouseDebt,
    legallyObligated: fact?.legallyObligated,
    communityProperty: fact === undefined ? undefined : fact.communityPropertyStates.length > 0,
    madePayments: madePayments(form, info),
    // Line 7: wages, salaries, or self-employment income.
    earnedIncome: injured === undefined ? undefined : injured.wages > 0 || injured.hasBusiness,
    claimedEicOrActc: claimedEicOrActc(form),
    claimedRefundableCredit: claimedRefundableCredit(form),
  };
}

/* Part I, or the gap of the first line it reaches that cannot be answered. */
export function partOneOf(
  form: Accessor,
  info: Form8379FilingInfo,
): PartOneLines | Unsupported | undefined {
  const answers = answersOf(form, info);
  const plain: PartOneAnswers = {};
  for (const [key, answer] of Object.entries(answers) as Array<[keyof PartOneAnswers, Answer]>) {
    if (typeof answer === "boolean") plain[key] = answer;
  }
  const filled = partOneLines(plain);
  if (!("waitsOn" in filled)) return filled;
  // A gap in the answer the chain reached is the form's gap; else the line waits.
  const answer = answers[filled.waitsOn];
  return isGap(answer) ? answer : undefined;
}

/*
 * A Yes or No box of Part I: checked when the line was reached with that
 * answer; unchecked (false) when it was not, so a form whose Part I stops has
 * no checked Yes box and leaves the return (filesOnlyWithAmountOn).
 */
export function partOneBox(
  form: Accessor,
  info: Form8379FilingInfo,
  line: PartOneLine,
  yes: boolean,
) {
  const filled = partOneOf(form, info);
  if (filled === undefined || "unsupported" in filled) return filled;
  return filled.answers[line] === yes;
}
