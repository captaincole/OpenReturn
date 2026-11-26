import {
  getAmericanSamoaExclusionFacts,
  makeAmericanSamoaExclusionFactKey,
  type AmericanSamoaExclusionFact,
} from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form4563FilingInfo } from "./filingInfo.js";
import {
  excludedGrossIncome,
  form4563Lines,
  hasExcludedIncome,
  type Form4563Filer,
} from "./lines.js";

const TAXPAYER_KEY = makeAmericanSamoaExclusionFactKey("taxpayer");

function filerOf(fact: AmericanSamoaExclusionFact): Form4563Filer {
  return {
    key: fact.key,
    owner: fact.owner,
    answers: fact.value,
    lines: form4563Lines(fact.value),
    excludedGrossIncome: excludedGrossIncome(fact.value),
  };
}

/*
 * Who files: a person who "were a bona fide resident of American Samoa for the
 * entire tax year" and has income from sources there to exclude
 * (irs-4563-form-2025::sec::omb-no-1545-0074::b02; Pub. 570: "Form 4563
 * cannot be filed by itself"). A spouse's own form belongs on a joint return
 * only. A fact that is missing an answer files the form and is listed again;
 * a person who is not a resident all year files none. The decision still wins.
 * A fact with income that files no form is listed, so Form 1040 line 9 is a gap.
 */
export function resolve4563Info(inputs: ResolverInputs): Form4563FilingInfo {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const read = getAmericanSamoaExclusionFacts(inputs.facts);
  const facts = read.facts.filter((fact) => fact.owner === "taxpayer" || joint);
  const incomplete = read.incompleteKeys.filter((key) => key === TAXPAYER_KEY || joint);
  const filers = facts
    .filter((fact) => fact.value.bonaFideResidentAllYear === true)
    .map(filerOf)
    .filter((filer) => hasExcludedIncome(filer.lines));
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4563",
    fallbacks: [
      {
        rule: `fallback: ${filers.length} bona fide resident(s) of American Samoa exclude income`,
        value: filers.length > 0 || incomplete.length > 0,
        triggeredByFactKeys: [...facts.map((fact) => fact.key), ...incomplete],
      },
    ],
  });
  const files = mustFile.value === true;
  const noFact = files && facts.length === 0 && incomplete.length === 0 ? [TAXPAYER_KEY] : [];
  const missing = files ? [...incomplete, ...noFact] : [];
  const filedKeys = files ? filers.map((filer) => filer.key) : [];
  const notExcluded = facts
    .filter((fact) => !filedKeys.includes(fact.key))
    .filter((fact) => hasExcludedIncome(form4563Lines(fact.value)))
    .map((fact) => fact.key);
  return {
    mustFile: { "form-4563": mustFile },
    missingInputs: {
      "form-4563": missingInputs(Object.fromEntries(missing.map((key) => [key, undefined]))),
    },
    form4563Filers: files ? filers : undefined,
    form4563IncomeNotExcluded: notExcluded,
  };
}
