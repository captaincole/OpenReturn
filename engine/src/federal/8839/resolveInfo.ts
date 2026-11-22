import {
  ADOPTION_KEYS,
  getAdoptionChildFacts,
  isW2FactKey,
  type AdoptionChildFact,
  type W2FactValue,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import {
  factsInCategory,
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { AdoptionChildRow, Form8839FilingInfo, PartState } from "./filingInfo.js";
import {
  finalityOf,
  line5Expenses,
  MAXIMUM_CREDIT_PER_CHILD,
  MAXIMUM_EXCLUSION_PER_CHILD,
  specialNeedsFinalThisYear,
} from "./lines.js";

/* W-2 box 12 code T: employer adoption benefits, not in box 1 (irs-w2w3-inst-2025::sec::special-reporting-situations-for-form::b01). */
const ADOPTION_BENEFITS_CODE = "T";

function codeTTotal(inputs: ResolverInputs): number {
  const entries = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .flatMap((row) => (row.value as W2FactValue).box12 ?? [])
    .filter((entry) => entry.code.toUpperCase() === ADOPTION_BENEFITS_CODE);
  return sum(...entries.map((entry) => entry.amount));
}

const GAP = {
  separate:
    "Married filing separately without the lived-apart test (irs-8839-inst-2025::sec::married-persons-not-filing-jointly::b01): no credit or exclusion, and the instructions do not say how to fill the form.",
  foreignNotFinal:
    "A foreign child whose adoption is not final by the end of 2025 (more-than-three-eligible-children::b09): no credit, and the benefits go on Form 1040 line 1f outside this form; the engine does not model it.",
  priorForeignBenefits:
    "Employer benefits before 2025 for a foreign child final in 2025 need the Exclusion of Prior Year Benefits Worksheet, whose line 9 the instructions do not place on any line.",
  codeTNoChild:
    "W-2 box 12 code T shows adoption benefits, but no adoption child is recorded for Part I.",
  codeTSplit:
    "W-2 box 12 code T is one total: with more than one child, each child's line 22 amount is needed, and the amounts must add up to the code T total.",
} as const;

/* Line 22 for each child: the child's stated amount, or code T for the only child. */
function line22Amounts(
  children: AdoptionChildFact[],
  codeT: number,
): { amounts: number[]; gap?: string } {
  const stated = children.some((each) => each.child.employerBenefits2025 !== undefined);
  if (stated) {
    const amounts = children.map((each) => roundDollars(sum(each.child.employerBenefits2025)));
    const matches = codeT === 0 || roundDollars(codeT) === sum(...amounts);
    return { amounts, gap: matches ? undefined : GAP.codeTSplit };
  }
  if (codeT === 0) return { amounts: children.map(() => 0) };
  if (children.length === 0) return { amounts: [], gap: GAP.codeTNoChild };
  if (children.length > 1) return { amounts: children.map(() => 0), gap: GAP.codeTSplit };
  return { amounts: [roundDollars(codeT)] };
}

function rowOf(
  fact: AdoptionChildFact,
  line22: number,
  program: boolean | undefined,
): AdoptionChildRow {
  const { child } = fact;
  const line3 = roundDollars(sum(child.priorYearCredit));
  return {
    factKey: fact.factKey,
    child,
    line2: roundDollars(child.creditLimitShare ?? MAXIMUM_CREDIT_PER_CHILD),
    line3,
    priorCreditFiled: child.priorYearCredit !== undefined,
    line5: line5Expenses(child, line3),
    line19: roundDollars(child.exclusionLimitShare ?? MAXIMUM_EXCLUSION_PER_CHILD),
    line20: roundDollars(sum(child.priorYearBenefits)),
    priorBenefitsFiled: child.priorYearBenefits !== undefined,
    line22,
    takesLine21: specialNeedsFinalThisYear(child) ? program : false,
  };
}

/* Part II applies with a line 5 amount or a carryforward (general-instructions::b02, item 4). */
function partIIState(rows: AdoptionChildRow[], carryforward: number | undefined): PartState {
  if (rows.some((row) => row.line5 > 0) || (carryforward ?? 0) > 0) return "applies";
  return carryforward === undefined ? "waits" : "skipped";
}

/* Part III applies with employer benefits, or a special needs child the program covers (line-24::b01). */
function partIIIState(rows: AdoptionChildRow[]): PartState {
  if (rows.some((row) => row.line22 > 0 || row.takesLine21 === true)) return "applies";
  return rows.some((row) => row.takesLine21 === undefined) ? "waits" : "skipped";
}

function wholeFormGap(inputs: ResolverInputs, children: AdoptionChildFact[]): string | undefined {
  const separate = filingStatusOf(inputs) === "married_filing_separately";
  if (
    separate &&
    inputs.factByKey.get(ADOPTION_KEYS.marriedSeparatelyTreatedAsUnmarried) === false
  ) {
    return GAP.separate;
  }
  const foreignNotFinal = children.some(
    (each) => each.child.foreign === true && finalityOf(each.child) === "not_final",
  );
  return foreignNotFinal ? GAP.foreignNotFinal : undefined;
}

/* The answers the form reads, by when it reads them. */
function answersRead(inputs: ResolverInputs, children: AdoptionChildFact[], codeT: number) {
  const answers: Record<string, unknown> = {
    [ADOPTION_KEYS.creditCarryforward]: num(inputs, ADOPTION_KEYS.creditCarryforward),
  };
  if (filingStatusOf(inputs) === "married_filing_separately") {
    answers[ADOPTION_KEYS.marriedSeparatelyTreatedAsUnmarried] = inputs.factByKey.get(
      ADOPTION_KEYS.marriedSeparatelyTreatedAsUnmarried,
    );
  }
  if (codeT === 0 && children.some((each) => specialNeedsFinalThisYear(each.child))) {
    answers[ADOPTION_KEYS.employerHasQualifiedProgram] = inputs.factByKey.get(
      ADOPTION_KEYS.employerHasQualifiedProgram,
    );
  }
  return answers;
}

/*
 * Who files (irs-8839-inst-2025::sec::general-instructions::b01–b03): a taxpayer
 * with an eligible child (expenses or employer benefits), a credit carryforward
 * from 2024, or employer benefits in W-2 box 12 code T (Part III figures the
 * taxable part, irs-pub-525-2025::sec::adoption-assistance::b01). The explicit
 * decision still wins.
 */
export function resolve8839Info(inputs: ResolverInputs): Form8839FilingInfo {
  const children = getAdoptionChildFacts(inputs.facts);
  const codeT = codeTTotal(inputs);
  const carryforward = num(inputs, ADOPTION_KEYS.creditCarryforward);
  const answers = answersRead(inputs, children, codeT);
  const program =
    codeT > 0 ? true : (answers[ADOPTION_KEYS.employerHasQualifiedProgram] as boolean | undefined);
  const line22 = line22Amounts(children, codeT);
  const rows = children.map((fact, index) => rowOf(fact, line22.amounts[index] ?? 0, program));
  const priorForeign = children.some((each) => sum(each.child.foreignBenefitsBefore2025) > 0);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8839",
    fallbacks: [
      {
        rule: `fallback: ${children.length} adoption child fact(s) present`,
        value: children.length > 0,
        triggeredByFactKeys: children.map((each) => each.factKey),
      },
      {
        rule: "fallback: an adoption credit carryforward from 2024",
        value: (carryforward ?? 0) > 0,
        triggeredByFactKeys: [ADOPTION_KEYS.creditCarryforward],
      },
      { rule: "fallback: W-2 box 12 code T (employer adoption benefits)", value: codeT > 0 },
    ],
  });
  const files = resolution.value === true;
  const separateWaits =
    answers[ADOPTION_KEYS.marriedSeparatelyTreatedAsUnmarried] === undefined &&
    ADOPTION_KEYS.marriedSeparatelyTreatedAsUnmarried in answers;
  const partIII = line22.gap === GAP.codeTNoChild ? "applies" : partIIIState(rows);
  return {
    mustFile: { "form-8839": resolution },
    missingInputs: { "form-8839": files ? missingInputs(answers) : [] },
    adoptionChildren: rows,
    adoptionCarryforward: carryforward,
    adoptionPartII: separateWaits ? "waits" : partIIState(rows, carryforward),
    adoptionPartIII: separateWaits ? "waits" : partIII,
    adoptionGap: wholeFormGap(inputs, children),
    adoptionPartIIIGap: line22.gap ?? (priorForeign ? GAP.priorForeignBenefits : undefined),
  };
}
