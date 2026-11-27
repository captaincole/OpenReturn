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
  type CreditCarryoverFact,
  type GeneralBusinessCreditFact,
  type K1ResearchCreditAnswer,
  type PassiveCreditActivity,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { figuredOnForm3468, form3468CreditSources } from "../3468/credit.js";
import { workOpportunitySources } from "../5884/sources.js";
import { lowIncomeHousingSourcesOf } from "../8586/form3800.js";
import { renewableElectricitySourcesOf } from "../8835/form3800.js";
import { withForm8844 } from "../8844/sources.js";
import { tipCreditSourcesOf } from "../8846/form3800.js";
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
  const engineForm = ENGINE_FORM_LINES[value.line];
  if (engineForm)
    return `Line ${value.line} comes from ${engineForm}, which the engine figures: state that form's inputs (the property, vehicle or tips) instead.`;
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
export function form3800SourcesOf(inputs: ResolverInputs): {
  sources: Form3800Sources;
  missing: string[];
} {
  const stated = getGeneralBusinessCreditFacts(inputs.facts).map(statedSource);
  const k1 = k1EntitiesWithRoute(inputs, "form_3800")
    .filter((received) => !figuredOnForm3468(inputs, received))
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
  // Line 4d: Form 8586 line 3, the credit of the buildings the taxpayer owns (8586/form3800.ts).
  const housing = lowIncomeHousingSourcesOf(inputs);
  missing.push(...tips.missing, ...housing.missing);
  // Lines 4e and 1f: Form 8835 line 15, the credit of each facility the taxpayer owns (8835/form3800.ts).
  const electricity = renewableElectricitySourcesOf(inputs);
  missing.push(...electricity.missing);
  // Line 3: Form 8844 line 2, the empowerment zone credit of the taxpayer's own employees (8844/sources.ts).
  const zone = withForm8844(inputs, [
    ...stated,
    ...tips.sources,
    ...housing.sources,
    ...electricity.sources,
    ...k1.flatMap((found) => (found.source ? [found.source] : [])),
    ...form3468.sources,
    ...workOpportunity.sources,
  ]);
  missing.push(...zone.missing);
  const current = zone.sources;
  const carryovers = getCreditCarryoverFacts(inputs.facts).map(carryoverOf);
  return { sources: { current, carryovers }, missing: [...new Set(missing)] };
}
