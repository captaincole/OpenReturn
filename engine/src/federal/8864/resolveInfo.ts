import { roundDollars } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { agriBiodieselFigures, type AgriBiodieselFigures } from "./figures.js";
import type { AmountOrGap, Form8864FilingInfo } from "./filingInfo.js";
import { K1_STATEMENT_GAP, k1BiodieselCreditsOf, statedPassThroughCredits } from "./k1.js";
import { line10Of } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8864";

const isJoint = (inputs: ResolverInputs) => {
  const status = filingStatusOf(inputs);
  return status === undefined || status === "married_filing_jointly";
};

/* The return's own figures; every resolver that reads them calls this one function. */
export const agriBiodieselFiguresOf = (inputs: ResolverInputs): AgriBiodieselFigures =>
  agriBiodieselFigures(inputs.facts, isJoint(inputs));

const LIMITS_GAP =
  "A K-1 statement's agri-biodiesel and the return's other sources together pass a limit the engine cannot apply (see Form 8864 line 9).";

/* Line 10: every K-1 code AC credit and every stated cooperative, estate or trust credit. */
export function line10Figure(inputs: ResolverInputs): AmountOrGap | undefined {
  const k1 = k1BiodieselCreditsOf(inputs);
  const stated = statedPassThroughCredits(inputs);
  if (k1.length === 0 && stated.length === 0) return undefined;
  const statementOnly = k1.find(({ received }) => received.item.amount === undefined);
  if (statementOnly) return { gap: K1_STATEMENT_GAP(statementOnly.received.entity.name) };
  const withStatement = k1.some(({ answer }) => answer?.agriBiodiesel !== undefined);
  if (withStatement && agriBiodieselFiguresOf(inputs).combinedLimitsExceeded) {
    return { gap: LIMITS_GAP };
  }
  const amounts = [
    ...k1.map(({ received }) => received.item.amount ?? 0),
    ...stated.map(({ value }) => value.amount),
  ];
  return { amount: line10Of(amounts) ?? 0 };
}

/* Line A: the one registration number of the transfer elections; a gap with two. */
function transferRegistrationOf(figures: AgriBiodieselFigures) {
  const numbers = [
    ...new Set(figures.productions.flatMap(({ fact }) => fact.transfer?.registrationNumber ?? [])),
  ];
  if (numbers.length === 0) return undefined;
  if (numbers.length > 1) {
    return {
      gap: `Line A has room for one registration number, and the transfer elections name ${numbers.length}.`,
    };
  }
  return { number: numbers[0] };
}

/*
 * The income Schedule C line 6 takes from line 9 (figures.ts), which Form 6251
 * line 3 takes back: "if you're subject to alternative minimum tax (AMT), this
 * amount isn't income in figuring AMT and must be subtracted when figuring your
 * alternative minimum taxable income" (irs-8864-inst-2025::sec::line-9::b01).
 */
function incomeIncludedOf(figures: AgriBiodieselFigures): AmountOrGap | undefined {
  if (figures.gap !== undefined) return { gap: figures.gap };
  const line9 = figures.lines?.line9;
  return line9 === undefined || line9 === 0 ? undefined : { amount: roundDollars(line9) };
}

/*
 * DECISION (2026-11-27, by the author): who files with a K-1 credit only.
 * Text A, the Form 8864 instructions: "All other taxpayers aren't required to
 * complete or file this form if their only source for this credit is a
 * partnership, S corporation, cooperative, estate, or trust. Instead, they can
 * report this credit directly on the appropriate line of Form 3800"
 * (irs-8864-inst-2025::sec::general-instructions::b01). Text B, the partner's
 * K-1 instructions: the source form is not required "The following exceptions
 * apply. • You're claiming ... the biodiesel, renewable diesel, or sustainable
 * aviation fuels credit (Form 8864)" (irs-1065k1-inst-2025::sec::box-15-credits::b01),
 * and code AC: "report this amount on Form 8864, line 10" (::b09). The engine
 * follows text A: a form's own instructions decide who files it. A K-1 alone
 * does not file Form 8864; its credit reaches Form 3800 line 1l or 1ff the same
 * way (form3800.ts), so no dollar changes. The explicit decision still wins.
 *
 * Who files otherwise: an eligible small agri-biodiesel producer, "Use Form 8864
 * to claim the section 40A small agri-biodiesel producer credit"
 * (general-instructions::b01): a production fact of a registered producer
 * within the capacity limit (figures.ts).
 */
export function resolve8864Info(inputs: ResolverInputs): Form8864FilingInfo {
  const figures = agriBiodieselFiguresOf(inputs);
  const own = figures.eligibleKeys.length > 0 || figures.malformedKeys.length > 0;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${figures.eligibleKeys.length} agri-biodiesel production fact(s) of an eligible small producer`,
        value: own,
        triggeredByFactKeys: [...figures.eligibleKeys, ...figures.malformedKeys],
      },
    ],
  });
  const included = incomeIncludedOf(figures);
  const always = {
    mustFile: { "form-8864": mustFile },
    ...(figures.gapBusinessKeys.length > 0
      ? { form8864IncomeGapBusinessKeys: figures.gapBusinessKeys }
      : {}),
    ...(included !== undefined ? { form8864IncomeIncluded: included } : {}),
  };
  if (mustFile.value !== true) return { ...always, missingInputs: { "form-8864": [] } };
  const answers = k1BiodieselCreditsOf(inputs).filter(({ answer }) => answer === undefined);
  return {
    ...always,
    missingInputs: {
      "form-8864": [...figures.malformedKeys, ...answers.map(({ answerKey }) => answerKey)],
    },
    form8864: {
      lines: figures.lines,
      ownProduction: figures.eligibleKeys.length > 0,
      gap: figures.gap,
      line10: line10Figure(inputs),
      transferRegistration: transferRegistrationOf(figures),
    },
  };
}
