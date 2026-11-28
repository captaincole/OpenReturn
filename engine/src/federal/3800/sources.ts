/*
 * The resolver's side of Form 3800: every credit and carryover the return
 * states, every K-1 general business credit and every Form 3468 credit
 * (3468/credit.ts), as sources (filingInfo.ts), with the answers they still
 * wait on.
 */

import {
  GENERAL_BUSINESS_CREDIT_KEYS,
  getCreditCarryoverFacts,
  getGeneralBusinessCreditFacts,
  isBusinessFactKey,
  isOwnStatedWageCredit,
  type CreditCarryoverFact,
  type GeneralBusinessCreditFact,
  type K1ResearchCreditAnswer,
  type PassiveCreditActivity,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { figuredOnForm3468, form3468CreditSources } from "../3468/credit.js";
import { workOpportunitySources } from "../5884/sources.js";
import { statedOwnBiofuelGap } from "../6478/form3800.js";
import { researchCreditSources } from "../6765/form3800.js";
import { form7207CreditSources } from "../7207/form3800.js";
import { cleanHydrogenSourcesOf } from "../7210/form3800.js";
import { cleanElectricitySources } from "../7211/form3800.js";
import { nuclearProductionSources } from "../7213/form3800.js";
import { withForm7218 } from "../7218/form3800.js";
import { lowIncomeHousingSourcesOf } from "../8586/form3800.js";
import { orphanDrugCreditSourcesOf } from "../8820/form3800.js";
import { disabledAccessSourcesOf } from "../8826/form3800.js";
import { renewableElectricitySourcesOf } from "../8835/form3800.js";
import { withForm8844 } from "../8844/sources.js";
import { tipCreditSourcesOf } from "../8846/form3800.js";
import { biodieselCreditSourcesOf } from "../8864/form3800.js";
import { isBiodieselK1Credit } from "../8864/k1.js";
import { smallEmployerPlanSources } from "../8881/sources.js";
import { childcareCreditSourcesOf } from "../8882/form3800.js";
import { trackMaintenanceSourcesOf } from "../8900/form3800.js";
import type { ReceivedItem } from "../passThrough/receipts.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { gap, type Cell } from "./cells.js";
import { TAX_YEAR, type Carryover } from "./credits.js";
import type { CreditSource, Form3800Sources } from "./filingInfo.js";
import { RESEARCH_DETAIL, k1CreditAmount, k1CreditLineOf } from "./k1Credits.js";
import {
  ELECTIVE_PAYMENT_LINES,
  ENGINE_FORM_LINES,
  RESEARCH_LINES,
  TRANSFER_LINES,
  partIIIRow,
  partIVRow,
} from "./rows.js";

/* "Unused general business credits may be carried back 1 year and carried forward 20 years" (carryback-and-carryforward-of::b02). */
export const CARRYFORWARD_YEARS = 20;
const OTHER_LINE = "1zz";

/* Why a stated credit cannot be placed on its line; undefined when it can. */
function statedGap(value: GeneralBusinessCreditFact["value"]): string | undefined {
  const row = partIIIRow(value.line);
  if (row === undefined) return `Line ${value.line} is not a line of Form 3800 Part III.`;
  if (row.source !== value.sourceForm) {
    return `Part III line ${value.line} takes Form ${row.source}, not Form ${value.sourceForm}.`;
  }
  /* A purchased credit has no source form of the buyer's: the seller "earned and reported the credit on the appropriate source credit form" (transferees-of-eligible-credits-under-section::b01). */
  const engineForm =
    value.transfer?.direction === "purchased" ? undefined : ENGINE_FORM_LINES[value.line];
  if (engineForm)
    return `Line ${value.line} comes from ${engineForm}, which the engine figures: state that form's inputs (the property, vehicle or tips) instead.`;
  // Line 4c: no 2025 biofuel producer credit of the taxpayer's own production (6478/form3800.ts).
  const ownBiofuel = statedOwnBiofuelGap(value);
  if (ownBiofuel) return ownBiofuel;
  if (
    isOwnStatedWageCredit(value) &&
    (value.businessKey === undefined || !isBusinessFactKey(value.businessKey))
  ) {
    return `A Form ${value.sourceForm} credit of the taxpayer's own employees also lowers the wages deduction of the business that paid them (irs-1040sc-inst-2025::sec::line-26::b01): the engine lowers it only for a Schedule C business the credit names (businessKey).`;
  }
  if (value.transfer && !TRANSFER_LINES.includes(value.line)) {
    return `The credit of line ${value.line} cannot be transferred under section 6418 (column (f) is shaded).`;
  }
  if (value.electivePayment && !ELECTIVE_PAYMENT_LINES.includes(value.line)) {
    return `The credit of line ${value.line} has no elective payment election (column (h) is shaded).`;
  }
  return undefined;
}

function statedSource({ key, value }: GeneralBusinessCreditFact): CreditSource {
  const reason = statedGap(value);
  const line = partIIIRow(value.line) ? value.line : OTHER_LINE;
  const amount: Cell = reason ? gap(reason) : roundDollars(value.amount);
  return {
    credit: {
      line,
      key,
      amount,
      passive: value.passive,
      activity: value.passive ? value.passiveActivity : undefined,
      ein: value.passThroughEin,
      transfer: value.transfer && {
        ...value.transfer,
        amount: roundDollars(value.transfer.amount),
      },
      electivePayment: value.electivePayment,
    },
    attributableTaxableIncome: RESEARCH_LINES.includes(line)
      ? value.attributableTaxableIncome
      : undefined,
  };
}

/* Why a carryover cannot be placed; undefined when it can (part-iv-2::b01, line-2-3::b01). */
function carryoverGap(value: CreditCarryoverFact["value"]): string | undefined {
  const row = partIVRow(value.line);
  if (row === undefined) return `Line ${value.line} is not a line of Form 3800 Part IV.`;
  if (row.source !== value.sourceForm) {
    return `Part IV line ${value.line} takes Form ${row.source}, not Form ${value.sourceForm}.`;
  }
  if (value.originYear === TAX_YEAR)
    return "A 2025 credit is a current-year credit (Part III), not a carryover.";
  if (value.originYear < TAX_YEAR - CARRYFORWARD_YEARS) {
    return `A credit from ${value.originYear} is past the 20-year carryforward period (carryback-and-carryforward-of::b02).`;
  }
  if (value.originYear > TAX_YEAR && value.line.startsWith("2")) {
    return "Lines 2a through 2zz take carryforwards only (line-2-3::b01).";
  }
  if (RESEARCH_LINES.includes(value.line)) {
    return "A research credit carryover shares the research credit limitation with the credit of the year, and Part I line 4 then takes only its allowable part (part-iv-2::b02); the engine does not split it.";
  }
  return undefined;
}

function carryoverOf({ key, value }: CreditCarryoverFact): Carryover {
  const reason = carryoverGap(value);
  return {
    line: partIVRow(value.line) ? value.line : "2zz",
    key,
    originYear: value.originYear,
    amount: reason ? gap(reason) : roundDollars(value.amount),
    passive: value.passive,
    activity: value.passive ? value.passiveActivity : undefined,
    basisIncreaseElection: value.passive ? value.basisIncreaseElection : undefined,
    ein: value.passThroughEin,
    changed: value.changedFromOriginal === true,
    recaptured:
      value.recapturedOrAdjusted === undefined
        ? undefined
        : roundDollars(value.recapturedOrAdjusted),
  };
}

/* A K-1 credit is passive for a rental, or when the owner did not materially participate (box-15-credits::b01). */
function k1Passive({ entity, item }: ReceivedItem): boolean | undefined {
  if (k1CreditLineOf(item.detail).rental === true) return true;
  const participated = entity.holding?.materiallyParticipated;
  return participated === undefined ? undefined : !participated;
}

interface K1Found {
  source?: CreditSource;
  missing: string[];
}

/*
 * A passive K-1 credit's activity for Form 8582-CR: the entity, and its rental
 * real estate when the box is a rental credit. A K-1 low-income housing credit
 * is taken as placed in service after 1989 through an interest acquired after
 * 1989 (Worksheet 3): the K-1 does not say, and a current credit from an older
 * building ended with its 10-year credit period (8582-cr/QUESTIONS.md).
 */
function k1Activity({ entity, item }: ReceivedItem): PassiveCreditActivity {
  const k1 = entity.k1;
  return {
    name: entity.name,
    rentalRealEstate: k1CreditLineOf(item.detail).rental === true,
    activelyParticipated: entity.holding?.activelyParticipated,
    before1990: false,
    publiclyTradedPartnership: k1.form === "1065" && k1.publiclyTraded === true,
  };
}

function k1Source(inputs: ResolverInputs, received: ReceivedItem): K1Found {
  const { entity, item } = received;
  const passive = k1Passive(received);
  const missing = passive === undefined ? [entity.holdingKey] : [];
  const credit = {
    line: k1CreditLineOf(item.detail).line,
    key: entity.key,
    amount: k1CreditAmount(item.detail, item.amount),
    passive: passive ?? false,
    activity: passive === true ? k1Activity(received) : undefined,
    ein: entity.ein,
  };
  if (item.detail !== RESEARCH_DETAIL) {
    const detail = item.detail ?? "";
    return { missing, source: missing.length > 0 ? undefined : { credit, fromK1: { detail } } };
  }
  const answerKey = GENERAL_BUSINESS_CREDIT_KEYS.k1Research(entity.key);
  const answer = inputs.factByKey.get(answerKey) as K1ResearchCreditAnswer | undefined;
  if (answer === undefined) return { missing: [...missing, answerKey] };
  if (missing.length > 0) return { missing };
  const line = answer.eligibleSmallBusiness ? "4i" : "1c";
  const income = answer.attributableTaxableIncome;
  return { missing, source: { credit: { ...credit, line }, attributableTaxableIncome: income } };
}

const missingResearch = (source: CreditSource) =>
  RESEARCH_LINES.includes(source.credit.line) &&
  typeof source.credit.amount === "number" &&
  source.attributableTaxableIncome === undefined;

/* Every source of the return and the answers they wait on (fact keys). */
/*
 * The sources of the forms added after the ones above, in the order they were
 * added, so the order of the others stays as it was:
 * - Line 1g: Form 7210 line 10, the credit of each clean hydrogen facility the
 *   taxpayer owns (7210/form3800.ts).
 * - Lines 1l and 1ff: Form 8864 line 11, the taxpayer's own production and each
 *   K-1 code AC (8864/form3800.ts).
 * - Line 1h: Form 8820 line 2c, the taxpayer's own clinical testing (8820/form3800.ts).
 * - Line 1gg: Form 7211 line 11 of each clean electricity facility the
 *   taxpayer owns (7211/form3800.ts).
 * - Lines 4e and 1f: Form 8835 line 15 of each renewable electricity facility
 *   the taxpayer owns (8835/form3800.ts).
 * - Lines 1cc and 1u: Form 7213 Part I line 9 and Part II line 13 of each
 *   nuclear facility the taxpayer owns (7213/form3800.ts).
 * - Line 1q: Form 7218 line 3 of each clean fuel facility the taxpayer owns;
 *   next to one, a stated line 1q credit with no entity is a gap (7218/form3800.ts),
 *   so this returns the stated sources too, in their own place.
 * - Line 1b: Form 7207 line 8a of each facility the taxpayer operates (7207/form3800.ts).
 * - Line 4g: Form 8900 line 5, the taxpayer's own track maintenance (8900/form3800.ts).
 */
function laterFormSources(
  inputs: ResolverInputs,
  stated: CreditSource[],
): { stated: CreditSource[]; sources: CreditSource[]; missing: string[] } {
  const cleanFuel = withForm7218(inputs, stated);
  const forms = [
    cleanHydrogenSourcesOf(inputs),
    biodieselCreditSourcesOf(inputs),
    orphanDrugCreditSourcesOf(inputs),
    cleanElectricitySources(inputs),
    renewableElectricitySourcesOf(inputs),
    nuclearProductionSources(inputs),
    cleanFuel,
    { sources: form7207CreditSources(inputs), missing: [] },
    trackMaintenanceSourcesOf(inputs),
  ];
  return {
    stated: cleanFuel.stated,
    sources: forms.flatMap((form) => form.sources),
    missing: forms.flatMap((form) => form.missing),
  };
}

export function form3800SourcesOf(inputs: ResolverInputs): {
  sources: Form3800Sources;
  missing: string[];
} {
  const stated = getGeneralBusinessCreditFacts(inputs.facts).map(statedSource);
  const k1 = k1EntitiesWithRoute(inputs, "form_3800")
    .filter((received) => !figuredOnForm3468(inputs, received))
    .filter((received) => !isBiodieselK1Credit(received))
    .map((received) => k1Source(inputs, received));
  const form3468 = form3468CreditSources(inputs);
  // Line 4b: Form 5884 line 2, the credit of the taxpayer's own employees (5884/sources.ts).
  const workOpportunity = workOpportunitySources(inputs);
  const missing = [
    ...stated.filter(missingResearch).map((source) => source.credit.key),
    ...k1.flatMap((found) => found.missing),
    ...form3468.missing,
    ...workOpportunity.missing,
  ];
  // Line 4f: Form 8846 line 4, the credit on the taxpayer's own tipped employees (8846/form3800.ts).
  const tips = tipCreditSourcesOf(inputs);
  // Line 1k: Form 8882 lines 2 and 4, the credit of the taxpayer's own childcare expenditures (8882/form3800.ts).
  const childcare = childcareCreditSourcesOf(inputs);
  // Line 4d: Form 8586 line 3, the credit of the buildings the taxpayer owns (8586/form3800.ts).
  const housing = lowIncomeHousingSourcesOf(inputs);
  // Line 1e: Form 8826 line 6, the credit of the taxpayer's own businesses (8826/form3800.ts).
  const disabledAccess = disabledAccessSourcesOf(inputs);
  // Line 1c or 4i: Form 6765 line 28, the taxpayer's own research (6765/form3800.ts).
  const research = researchCreditSources(inputs);
  missing.push(
    ...tips.missing,
    ...childcare.missing,
    ...housing.missing,
    ...disabledAccess.missing,
    ...research.sources.filter(missingResearch).map((source) => source.credit.key),
    ...research.missing,
  );
  const later = laterFormSources(inputs, stated);
  missing.push(...later.missing);
  // Line 3: Form 8844 line 2, the empowerment zone credit of the taxpayer's own employees (8844/sources.ts).
  const zone = withForm8844(inputs, [
    ...later.stated,
    ...tips.sources,
    ...childcare.sources,
    ...housing.sources,
    ...k1.flatMap((found) => (found.source ? [found.source] : [])),
    ...form3468.sources,
    ...workOpportunity.sources,
    ...research.sources,
    ...disabledAccess.sources,
    ...later.sources,
  ]);
  // Lines 1j, 1dd and 1ee: Form 8881 lines 8, 11 and 15 less the K-1s, the taxpayer's own plan (8881/sources.ts).
  const plan = smallEmployerPlanSources(inputs);
  missing.push(...zone.missing, ...plan.missing);
  const current = [...zone.sources, ...plan.sources];
  const carryovers = getCreditCarryoverFacts(inputs.facts).map(carryoverOf);
  return { sources: { current, carryovers }, missing: [...new Set(missing)] };
}
