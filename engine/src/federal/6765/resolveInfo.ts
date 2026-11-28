import {
  RESEARCH_CREDIT_KEY,
  businessesOnReturn,
  getGeneralBusinessCreditFacts,
  readResearchCreditFact,
  researchCreditPlacement,
  type ResearchCreditFact,
} from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { RESEARCH_LINES } from "../3800/rows.js";
import { clinicalAndResearchOverlapGap } from "../8820/coordination.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { researchFiguresOf, waitsOnMethod, type ResearchFigures } from "./figures.js";
import type { Form6765FilingInfo, Form6765Lines, ResearchBusiness } from "./filingInfo.js";
import { isFigureGap } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_6765";
const FORM_6765 = "6765";
/* The K-1 detail of a partnership's box 15 code M and an S corporation's box 13 code M (passThrough box tables). */
const K1_DETAIL = "research";

export const BUSINESS_GAP =
  "The research is in an activity that is not a Schedule C business of this return, and the engine needs its business for the 280C reduction, the passive activity rules and Form 3800's research limitation.";
export const REDUCTION_GAP =
  "Without the reduced credit election the research expenses the business deducts go down by the credit (irs-6765-inst-2025::sec::item-a-section-280c-election::b01), and the credit is more than the wages, supplies, computer rental and contract research on the business's Schedule C lines.";
const K1_AMOUNT_GAP =
  "A Schedule K-1 research credit (code M) has no amount, so line 29 is not known.";

/*
 * Line 29: "Enter the total credit for increasing research activities from:
 * Schedule K-1 (Form 1065) ... box 15 (code M); Schedule K-1 (Form 1120-S) ...
 * box 13 (code M); and Schedule K-1 (Form 1041) ... box 13 (code I)", and "All
 * other filers figuring a separate credit on earlier lines also report the
 * above credits on line 29" (irs-6765-inst-2025::sec::line-29::b01). The
 * partnership and S corporation boxes come from the K-1 facts; a Form 1041
 * K-1 is a stated Form 3800 research credit that names its entity. Each one
 * stays its own Form 3800 source (3800/sources.ts), so this line only shows them.
 */
export function passThroughResearch(inputs: ResolverInputs): number | Unsupported | undefined {
  const k1 = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_DETAIL,
  );
  if (k1.some(({ item }) => item.amount === undefined)) return unsupported(K1_AMOUNT_GAP);
  const stated = getGeneralBusinessCreditFacts(inputs.facts).filter(
    ({ value }) =>
      RESEARCH_LINES.includes(value.line) &&
      value.sourceForm === FORM_6765 &&
      value.passThroughEin !== undefined,
  );
  return sumOrBlank(
    ...k1.map(({ item }) => roundDollars(item.amount)),
    ...stated.map(({ value }) => roundDollars(value.amount)),
  );
}

function researchBusiness(inputs: ResolverInputs, key: string): ResearchBusiness | undefined {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const found = businessesOnReturn(inputs.facts, joint).businesses.find((each) => each.key === key);
  if (found === undefined) return undefined;
  const { value } = found;
  return {
    name: value.name ?? value.activity,
    ein: value.ein,
    code: value.code,
    materiallyParticipated: value.materiallyParticipated,
  };
}

/*
 * Line 28 is a gap when the business is not on the return, when its research
 * expenses may hold clinical testing expenses of Form 8820 (8820/coordination.ts),
 * or when the 280C reduction does not fit on its lines.
 */
function withBusinessGaps(
  inputs: ResolverInputs,
  figures: ResearchFigures,
  business: ResearchBusiness | undefined,
): ResearchFigures {
  if (figures.line28 === undefined || isFigureGap(figures.line28)) return figures;
  if (business === undefined) return { ...figures, line28: { gap: BUSINESS_GAP } };
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const overlap = clinicalAndResearchOverlapGap(inputs.facts, joint);
  if (overlap !== undefined) return { ...figures, line28: { gap: overlap } };
  const placed = researchCreditPlacement(inputs.facts, joint)?.placed;
  if (placed !== undefined && placed.left > 0)
    return { ...figures, line28: { gap: REDUCTION_GAP } };
  return figures;
}

export function form6765LinesOf(inputs: ResolverInputs, fact: ResearchCreditFact): Form6765Lines {
  const business = researchBusiness(inputs, fact.value.businessKey);
  const figures = withBusinessGaps(inputs, researchFiguresOf(fact.value), business);
  const line29 = figures.line28 === undefined ? undefined : passThroughResearch(inputs);
  return { fact: fact.value, figures, business, line29 };
}

/*
 * Who files: "Use Form 6765 to figure and claim the credit for increasing
 * research activities, to elect the reduced credit under section 280C, and to
 * elect to claim a certain amount of the credit as a payroll tax credit"
 * (irs-6765-inst-2025::sec::general-instructions::b01). A research credit fact
 * files it, also with no credit: "If you are electing the reduced research
 * credit, you must complete Form 6765 (even if no research credits are claimed
 * on the original return)" (item-a-section-280c-election::b01). A taxpayer
 * whose "only source for this credit is a partnership, S corporation, estate,
 * or trust" reports it "directly on Form 3800" (general-instructions::b01), so
 * a K-1 alone does not file it. The explicit decision still wins; filed with
 * no fact, the form asks for one.
 */
export function resolve6765Info(inputs: ResolverInputs): Form6765FilingInfo {
  const { fact, malformed } = readResearchCreditFact(inputs.facts);
  const stated = fact !== undefined || malformed;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: "fallback: the taxpayer's own research credit fact (a credit, a section 280C election or a payroll tax election)",
        value: stated,
        triggeredByFactKeys: stated ? [RESEARCH_CREDIT_KEY] : [],
      },
    ],
  });
  const files = mustFile.value === true;
  const asks = fact === undefined || waitsOnMethod(fact.value);
  return {
    mustFile: { "form-6765": mustFile },
    missingInputs: { "form-6765": files && asks ? [RESEARCH_CREDIT_KEY] : [] },
    researchCredit: files && fact !== undefined ? form6765LinesOf(inputs, fact) : undefined,
  };
}
