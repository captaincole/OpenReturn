/*
 * Every Form 8824 of the return: the exchanges and the Part IV sales that file
 * this year, the form the engine prints, and what they send to Schedule D and
 * Form 4797. Schedule D, Form 4797 and Form 8960 read it from the facts.
 */

import {
  readConflictOfInterestSaleFacts,
  readLikeKindExchangeFacts,
  type LikeKindExchangeFactValue,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { evaluateDivestiture, type DivestitureForm } from "./divestiture.js";
import { evaluateExchange, type ExchangeForm } from "./exchange.js";
import { addAll, emptyAmounts, type Destination, type RoutedAmounts } from "./routedAmounts.js";

/* An exchange that files whose lines cannot be figured. */
export interface ExchangeGap {
  key: string;
  reason: string;
}

/*
 * What Form 8824 sends to one receiving form. While lines 9 and 10 of a related
 * party exchange are not answered, the amounts are those with no disposition,
 * and the form asks for the answers (resolveInfo.ts).
 */
export interface ReceivingForm {
  /* Why the receiving lines are a gap; undefined when they are known. */
  gap?: string;
}

/* An exchange's Form 4797 amounts and the activity whose property it was. */
export interface ExchangeActivityAmounts {
  key: string;
  value: LikeKindExchangeFactValue;
  section1231: number;
  ordinary: number;
}

export interface Form8824Totals {
  /* Why no line of the form can be figured: a malformed fact, or a form filed with no fact. */
  formGap?: string;
  /* The exchanges that file, figured or a gap, in fact order. */
  exchanges: ExchangeForm[];
  exchangeGaps: ExchangeGap[];
  divestitures: DivestitureForm[];
  divestitureGaps: ExchangeGap[];
  /* The keys of the facts that file the form, and of malformed facts. */
  fileKeys: string[];
  malformedKeys: string[];
  /* Related party exchanges whose lines 9 and 10 are not answered. */
  unansweredKeys: string[];
  amounts: RoutedAmounts;
  scheduleD: ReceivingForm & { unrecapturedGap?: string };
  form4797: ReceivingForm & { activities: ExchangeActivityAmounts[] };
}

const MALFORMED = (keys: string[]) => `Malformed Form 8824 fact(s): ${keys.join(", ")}.`;

/* The first gap that reaches a form, from the exchanges and the Part IV sales. */
function gapFor(
  destination: Destination,
  gaps: ReadonlyArray<{ reason: string; destinations: ReadonlyArray<Destination> }>,
): string | undefined {
  return gaps.find((gap) => gap.destinations.includes(destination))?.reason;
}

function readOutcomes(inputs: ResolverInputs) {
  const exchangeFacts = readLikeKindExchangeFacts(inputs.facts);
  const saleFacts = readConflictOfInterestSaleFacts(inputs.facts);
  const exchangeOutcomes = exchangeFacts.facts.map(evaluateExchange);
  const saleOutcomes = saleFacts.facts.map(evaluateDivestiture);
  return {
    exchangeOutcomes,
    saleOutcomes,
    malformedKeys: [...exchangeFacts.malformedKeys, ...saleFacts.malformedKeys],
  };
}

const BUSINESS_DIVESTITURE =
  "A divested business property's Part IV lines go on Form 4797 (irs-8824-inst-2025::sec::line-35::b01, line-36::b01), which the engine does not carry from this fact.";

/* Every Form 8824 of the return, or undefined with no exchange or Part IV fact. */
export function form8824Totals(inputs: ResolverInputs): Form8824Totals | undefined {
  const { exchangeOutcomes, saleOutcomes, malformedKeys } = readOutcomes(inputs);
  if (exchangeOutcomes.length + saleOutcomes.length + malformedKeys.length === 0) return undefined;
  const exchanges = exchangeOutcomes.flatMap((each) => (each.kind === "filed" ? [each.form] : []));
  const divestitures = saleOutcomes.flatMap((each) => (each.kind === "filed" ? [each.form] : []));
  const outcomeGaps = [...exchangeOutcomes, ...saleOutcomes].flatMap((each) =>
    each.kind === "gap" ? [each] : [],
  );
  const routeGaps = [
    ...outcomeGaps,
    ...exchanges.flatMap((form) => (form.route.gap ? [form.route.gap] : [])),
    ...divestitures.flatMap((form) =>
      form.linesGap ? [{ reason: BUSINESS_DIVESTITURE, destinations: ["form_4797" as const] }] : [],
    ),
  ];
  if (malformedKeys.length > 0) {
    routeGaps.unshift({
      reason: MALFORMED(malformedKeys),
      destinations: ["schedule_d", "form_4797"],
    });
  }
  const unansweredKeys = exchanges.filter((form) => form.route.waits).map((form) => form.key);
  const unrecapturedGap = exchanges.find((form) => form.route.unrecapturedGap)?.route
    .unrecapturedGap;
  return {
    formGap: malformedKeys.length > 0 ? MALFORMED(malformedKeys) : undefined,
    exchanges,
    exchangeGaps: exchangeOutcomes.flatMap((each) => (each.kind === "gap" ? [each] : [])),
    divestitures,
    divestitureGaps: saleOutcomes.flatMap((each) => (each.kind === "gap" ? [each] : [])),
    fileKeys: [
      ...exchanges.map((form) => form.key),
      ...divestitures.map((form) => form.key),
      ...outcomeGaps.map((gap) => gap.key),
    ],
    malformedKeys,
    unansweredKeys,
    amounts: addAll([
      ...exchanges.map((form) => form.route.amounts),
      ...divestitures.map((form) => form.amounts),
    ]),
    scheduleD: { gap: gapFor("schedule_d", routeGaps), unrecapturedGap },
    form4797: {
      gap: gapFor("form_4797", routeGaps),
      activities: exchanges
        .filter((form) => form.route.amounts.section1231 !== 0 || form.route.amounts.ordinary !== 0)
        .map((form) => ({
          key: form.key,
          value: form.value,
          section1231: form.route.amounts.section1231,
          ordinary: form.route.amounts.ordinary,
        })),
    },
  };
}

const NO_FACTS =
  "Form 8824 files by decision, but no like-kind exchange or conflict-of-interest sale fact for 2025 gives its amounts.";

/* The form filed by the decision with no fact: every line, and every line it feeds, is a gap. */
export const NO_FACT_TOTALS: Form8824Totals = {
  formGap: NO_FACTS,
  exchanges: [],
  exchangeGaps: [],
  divestitures: [],
  divestitureGaps: [],
  fileKeys: [],
  malformedKeys: [],
  unansweredKeys: [],
  amounts: emptyAmounts(),
  scheduleD: { gap: NO_FACTS },
  form4797: { gap: NO_FACTS, activities: [] },
};
