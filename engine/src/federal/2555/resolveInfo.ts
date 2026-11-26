import {
  getForeignEarnedIncomeFacts,
  makeForeignEarnedIncomeFactKey,
  type ForeignEarnedIncomeFact,
} from "../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form2555FilingInfo } from "./filingInfo.js";
import { form2555Filer, type Form2555Filer } from "./person.js";
import { qualification } from "./qualifies.js";

/* A spouse's own Form 2555 belongs on a joint return only; on a separate return the spouse files it. */
function factsOnReturn(inputs: ResolverInputs): ForeignEarnedIncomeFact[] {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  return getForeignEarnedIncomeFacts(inputs.facts).filter(
    (fact) => fact.owner === "taxpayer" || joint,
  );
}

interface Sorted {
  filers: Form2555Filer[];
  /* The facts whose answers the form still waits for. */
  waiting: string[];
}

/* Each fact that claims an exclusion: a filer when the person qualifies or the engine cannot tell why not. */
function sortFacts(facts: ForeignEarnedIncomeFact[]): Sorted {
  const sorted: Sorted = { filers: [], waiting: [] };
  for (const fact of facts) {
    const result = qualification(fact.value);
    if (typeof result === "string") {
      sorted.filers.push({ ...form2555Filer(fact), partIVGap: result });
    } else if ("waiting" in result) {
      sorted.waiting.push(fact.key);
    } else if (result.qualifies) {
      const filer = form2555Filer(fact);
      sorted.filers.push(filer);
      if (filer.exclusion?.selfEmployment === "waiting") sorted.waiting.push(fact.key);
    }
  }
  return sorted;
}

export const FOREIGN_BUSINESS_QBI =
  "This owner's Form 2555 reports a business or partnership on line 20a or 20b, income earned abroad: qualified business income counts only items effectively connected with a U.S. trade or business (section 199A(c)(3)), and the engine does not split a business's income by where it was earned.";

/* The people whose Form 2555 has self-employment income (line 20a or 20b): their QBI is a gap. */
export function ownersWithForeignBusiness(inputs: ResolverInputs): Set<"taxpayer" | "spouse"> {
  const filers = resolve2555Info(inputs).form2555Filers ?? [];
  return new Set(
    filers
      .filter(
        (filer) => filer.answers.business !== undefined || filer.answers.partnership !== undefined,
      )
      .map((filer) => filer.owner),
  );
}

/*
 * Who files: a person who qualifies and claims "the foreign earned income
 * exclusion and/or the housing exclusion or deduction"
 * (irs-2555-inst-2025::sec::purpose-of-form::b01, who-qualifies::b01). A fact
 * for a person who meets neither test files no form. A fact still missing an
 * answer files the form and lists the fact again. The decision still wins.
 */
export function resolve2555Info(inputs: ResolverInputs): Form2555FilingInfo {
  const facts = factsOnReturn(inputs);
  const { filers, waiting } = sortFacts(facts);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_2555",
    fallbacks: [
      {
        rule: `fallback: ${filers.length + waiting.length} person(s) claim the foreign earned income or housing exclusion`,
        value: filers.length > 0 || waiting.length > 0,
        triggeredByFactKeys: facts.map((fact) => fact.key),
      },
    ],
  });
  const files = mustFile.value === true;
  const noFact = files && facts.length === 0 ? [makeForeignEarnedIncomeFactKey("taxpayer")] : [];
  return {
    mustFile: { "form-2555": mustFile },
    missingInputs: { "form-2555": files ? [...new Set([...waiting, ...noFact])] : [] },
    form2555Filers: files ? filers : undefined,
  };
}
