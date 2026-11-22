import {
  isDividendFactKey,
  isInterestFactKey,
  makeSaversCreditFactKey,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { agiFloor } from "../schedule-eic/possible.js";
import type { Form8880Column, Form8880FilingInfo } from "./filingInfo.js";
import { agiLimit } from "./lines.js";
import {
  canTakeCredit,
  dobKeyOf,
  madeContribution,
  personOf,
  unplacedDeferralW2Keys,
  type Person,
} from "./people.js";

/* Line 4 of one column: the person's distributions, and on a joint return the spouse's too. */
function distributionsOf(person: Person, other: Person | undefined): number {
  const own = sum(person.distributions2025, person.fact?.otherDistributions);
  if (other === undefined) return own;
  // The Exception (irs-8880-form-2025::sec::line-4::b02): not the spouse's from a year filed separately.
  return sum(
    own,
    other.distributions2025,
    other.fact?.otherDistributions,
    -sum(other.fact?.otherDistributionsInSeparateYears),
  );
}

/*
 * One column. On a joint return line 4 needs both people's answers
 * (irs-8880-form-2025::sec::line-4::b02: "include both spouses' amounts in both columns").
 */
function columnOf(person: Person, other: Person | undefined, blocked: boolean): Form8880Column {
  const eligible = canTakeCredit(person);
  if (eligible === false || !madeContribution(person)) return { kind: "blank" };
  if (blocked || eligible === undefined || (other !== undefined && other.fact === undefined)) {
    return { kind: "waits" };
  }
  return {
    kind: "counts",
    inputs: {
      iraAndAbleContributions: person.iraAndAbleContributions,
      electiveDeferrals: person.electiveDeferrals,
      distributions: distributionsOf(person, other),
    },
  };
}

/* The answers the form reads: each person's fact, the date of birth of a contributor, unplaced W-2s. */
function requiredAnswers(people: Person[], unplaced: string[]): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const person of people) {
    answers[makeSaversCreditFactKey(person.owner)] = person.fact;
    if (madeContribution(person)) answers[dobKeyOf(person.owner)] = person.bornInTime;
  }
  for (const key of unplaced) answers[key] = undefined;
  return answers;
}

/*
 * Who files (irs-8880-form-2025::sec::who-can-take-this-credit::b01): a person on
 * the return made a contribution, no fact rules that person out, and AGI may
 * be under the limit. Resolvers cannot read line 11a, so the test uses the
 * least AGI the facts allow (agiFloor, as the EIC does): it errs toward filing
 * and asking, and line 9 then stops a filer whose AGI is over. When the facts
 * give no floor, the form does not file from facts (KNOWN GAP, QUESTIONS.md):
 * asking every high earner with an HSA or a business would be worse. The
 * explicit decision still wins. Column (b) is for a joint return only
 * (irs-8880-form-2025::sec::specific-instructions::b01).
 */
export function resolve8880Info(inputs: ResolverInputs): Form8880FilingInfo {
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  const you = personOf(inputs, "taxpayer");
  const spouse = joint ? personOf(inputs, "spouse") : undefined;
  const people = spouse === undefined ? [you] : [you, spouse];
  const unplaced = joint ? unplacedDeferralW2Keys(inputs) : [];
  const contributors = people.filter((person) => madeContribution(person));
  const candidates = contributors.filter((person) => canTakeCredit(person) !== false);
  const floor = agiFloor(inputs, joint);
  // No floor (an open business, rental or HSA amount): only the decision files the form.
  const agiMayQualify =
    floor !== undefined && floor <= agiLimit(status ?? "married_filing_jointly");
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8880",
    fallbacks: [
      {
        rule: `fallback: ${candidates.length} person(s) with a qualified retirement contribution, AGI may be under the limit`,
        value: (candidates.length > 0 || unplaced.length > 0) && agiMayQualify,
        triggeredByFactKeys: unplaced,
      },
    ],
  });
  const blocked = unplaced.length > 0;
  return {
    mustFile: { "form-8880": resolution },
    missingInputs: {
      "form-8880":
        resolution.value === true ? missingInputs(requiredAnswers(people, unplaced)) : [],
    },
    form8880Columns: {
      you: columnOf(you, spouse, blocked),
      spouse: spouse === undefined ? { kind: "blank" } : columnOf(spouse, you, blocked),
    },
    form8880ForeignTaxPaid:
      sum(
        sumInvestmentBox(inputs, "box7", isDividendFactKey),
        sumInvestmentBox(inputs, "box6", isInterestFactKey),
      ) > 0,
  };
}
