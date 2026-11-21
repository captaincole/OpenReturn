import type { IraOwner } from "../../facts/index.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form5329FilingInfo } from "./filingInfo.js";
import { earlyDistributionTax } from "./lines.js";
import { earlyDistributionPerson, retirementDistributionFacts } from "./partI.js";

const OWNERS: IraOwner[] = ["taxpayer", "spouse"];
const MUST_FILE_KEY = "decisions.scope.must_file_5329";

/*
 * MANUAL EDIT: when Form 5329 must file for Part I.
 * irs-5329-inst-2025::sec::who-must-file::b01–b02: a distribution subject to
 * the tax on early distributions, or an exception the 1099-R does not show.
 * "However, if distribution code 1 is correctly shown in box 7 of all your
 * Forms 1099-R and you owe the additional tax on the full amount shown on each
 * Form 1099-R, you don't have to file Form 5329": Schedule 2 line 8 then takes
 * 10% of the taxable amount with its box checked (irs-1040-inst-2025::sec::line-8::b01–b02).
 * The form files for a person with a stated exception, exception 12 (59½ or
 * older all year), a code S row, or a case the engine does not figure. On a
 * joint return a form for one spouse means a form for each spouse with an
 * early distribution (one form per person, ::specific-instructions::b01).
 * Parts II–IX have no facts: only the decision files the form for them.
 */
export function resolve5329Info(inputs: ResolverInputs): Form5329FilingInfo {
  const facts = retirementDistributionFacts(inputs);
  const reads = OWNERS.map((owner) => earlyDistributionPerson(inputs, owner, facts));
  const people = reads.flatMap((read) => (read.person ? [read.person] : []));
  const formNeeded = people.some((person) => person.needsForm || person.gap !== undefined);
  const open = !formNeeded && people.some((person) => person.pending);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: open
      ? []
      : [
          {
            rule: "fallback: an early distribution with an exception, exception 12, a SIMPLE IRA in its first 2 years (code S), or a case the engine does not figure; code 1 alone goes on Schedule 2 line 8",
            value: formNeeded,
            triggeredByFactKeys: people.flatMap((person) => person.factKeys),
          },
        ],
  });
  const invalid = reads.flatMap((read) => read.invalidExceptionKeys);
  return {
    mustFile: { "form-5329": resolution },
    missingInputs: {
      "form-5329": missingInputs(Object.fromEntries(invalid.map((key) => [key, undefined]))),
    },
    earlyDistributionPeople: people,
    form5329Filers: resolution.value === true ? people : [],
    earlyDistributionTaxWithoutForm:
      resolution.value === false && people.length > 0 && !people.some((person) => person.pending),
  };
}

/* Whether the early distribution tax files Schedule 2: undefined while an answer is missing. */
export function scheduleTwoNeededForEarlyDistributions(
  inputs: ResolverInputs,
): boolean | undefined {
  const people = resolve5329Info(inputs).earlyDistributionPeople ?? [];
  if (people.some((person) => person.gap !== undefined)) return true;
  const tax = earlyDistributionTax(people);
  return tax === undefined ? undefined : tax > 0;
}
