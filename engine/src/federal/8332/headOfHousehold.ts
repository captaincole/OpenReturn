/*
 * Form 1040's entry space under the filing status boxes, for a custodial
 * parent who released the claim to a child: the child is still a qualifying
 * person for head of household ("Your qualifying child who, even though you
 * are the custodial parent, isn't your dependent because of the rule for
 * Children of divorced or separated parents"), and "If the child isn't
 * claimed as your dependent, enter the child's name in the entry space below
 * qualifying surviving spouse" (irs-1040-inst-2025::sec::head-of-household::b03).
 */

import {
  HEAD_OF_HOUSEHOLD_KEYS,
  getDependentFacts,
  isClaimedDependent,
  livedWithTaxpayerOverHalfYear,
  type DependentFact,
} from "../../facts/index.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { TAX_YEAR } from "./lines.js";

const nameOf = (fact: DependentFact) => `${fact.dependent.firstName} ${fact.dependent.lastName}`;

/*
 * The released child's name when that child is the head of household
 * qualifying person: the one the answer names, or, with no answer, the first
 * released child when no claimed dependent lived with the taxpayer more than
 * half the year (so no dependent can be the qualifying person). With a
 * released child and a claimed dependent at home, the answer is asked
 * (`question` lists its key): either can be the qualifying person.
 */
export function hohChildNotDependent(inputs: ResolverInputs): {
  name?: string;
  question: Record<string, unknown>;
} {
  if (filingStatusOf(inputs) !== "head_of_household") return { question: {} };
  const dependents = getDependentFacts(inputs.facts);
  const released = dependents.filter((fact) => !isClaimedDependent(fact.dependent));
  if (released.length === 0) return { question: {} };
  const named = inputs.factByKey.get(HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson);
  if (typeof named === "string" && named !== "") {
    const match = released.find((fact) => fact.dependentSlug === named);
    return { name: match === undefined ? undefined : nameOf(match), question: {} };
  }
  const claimedAtHome = dependents.filter(
    (fact) =>
      isClaimedDependent(fact.dependent) &&
      livedWithTaxpayerOverHalfYear(fact.dependent, TAX_YEAR) === true,
  );
  if (claimedAtHome.length === 0) return { name: nameOf(released[0]!), question: {} };
  return { question: { [HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson]: undefined } };
}
