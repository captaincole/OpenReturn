import {
  SECTION_1231_KEYS,
  businessesOnReturn,
  californiaRecapture,
  getForm1099SFacts,
  readBusinessPropertySaleFacts,
  readSection179RecaptureFacts,
  type BusinessPropertySaleFact,
  type Section179RecaptureFact,
} from "../../../facts/index.js";
import type { Form4797FilingInfo } from "../../../federal/4797/filingInfo.js";
import { placeProperty, saleGap, type PlacedProperty } from "../../../federal/4797/properties.js";
import {
  priceOf,
  reportedProceeds,
  resolve4797Info,
  sharedForms,
} from "../../../federal/4797/resolveInfo.js";
import { spousePropertiesOnReturn } from "../../../federal/rentals/passive.js";
import {
  filingStatusOf,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { resolve3801Info } from "../3801/resolveInfo.js";
import { californiaSale, californiaSaleGap, differsForCalifornia } from "./california.js";
import type { ScheduleD1FilingInfo } from "./filingInfo.js";
import {
  differsFromFederal,
  recaptureDifference,
  scheduleD1Lines,
  type CaliforniaDifference,
  type ScheduleD1Lines,
} from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_d_1";
const FILES_540_KEY = "decisions.scope.must_file_ca_540";
const FTB_3805E_KEY = "decisions.scope.must_file_3805e";

/* The facts that state a California amount that is not the federal one. */
function differingKeys(
  inputs: ResolverInputs,
  sales: BusinessPropertySaleFact[],
  recaptures: Section179RecaptureFact[],
): string[] {
  const californiaLine8 = num(inputs, SECTION_1231_KEYS.californiaNonrecapturedLosses);
  const federalLine8 = num(inputs, SECTION_1231_KEYS.nonrecapturedLosses);
  const recaptureDiffers = ({ value }: Section179RecaptureFact) =>
    (value.californiaPriorDeductions ?? value.priorDeductions) !== value.priorDeductions ||
    (value.californiaRecomputedDepreciation ?? value.recomputedDepreciation) !==
      value.recomputedDepreciation;
  return [
    ...sales.filter((sale) => differsForCalifornia(sale.value)).map((sale) => sale.key),
    ...recaptures.filter(recaptureDiffers).map((each) => each.key),
    ...(californiaLine8 !== undefined && californiaLine8 !== federalLine8
      ? [SECTION_1231_KEYS.californiaNonrecapturedLosses]
      : []),
  ];
}

/*
 * Why lines 7–21 cannot be figured: the federal form's reason (a K-1 section
 * 1231 item, Form 6252 or 8824), FTB 3805E filing (lines 4 and 15), or a loss on
 * line 2 or 10 while FTB 3801 files: "get form FTB 3801 ... to see how much of
 * the loss is allowed before entering it on Schedule D-1"
 * (ca-540-sched-d1-inst-2025::sec::b-special-rules::b07). FTB 3801 reads no
 * Schedule D-1 amount, so the loss is a gap.
 */
function summaryGapOf(
  inputs: ResolverInputs,
  federal: Form4797FilingInfo,
  placed: PlacedProperty[],
): string | undefined {
  if (federal.form4797SummaryGap) return federal.form4797SummaryGap;
  if (inputs.decisionByKey.get(FTB_3805E_KEY) === true) {
    return "FTB 3805E files, and the engine does not carry its amounts to Schedule D-1 (lines 4 and 15).";
  }
  const losses = placed.flatMap((each) =>
    each.part !== "part_iii" && each.row.gainOrLoss < 0 ? [each.row.description] : [],
  );
  if (losses.length === 0) return undefined;
  if (resolve3801Info(inputs).mustFile?.["form-3801"]?.value !== true) return undefined;
  return `${losses.join(", ")}: a loss on line 2 or 10 while FTB 3801 files. FTB 3801 decides how much of a passive activity's loss is allowed before it goes on Schedule D-1 (b-special-rules::b07), and FTB 3801 reads no Schedule D-1 amount.`;
}

/* The Schedule C businesses on the return, by businessId. */
function businessIdsOnReturn(inputs: ResolverInputs): Set<string> {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  return new Set(
    businessesOnReturn(inputs.facts, joint).businesses.map((each) => each.key.split(".")[1] ?? ""),
  );
}

const LINE_38_GAP =
  "line 38's difference goes on the Schedule CA line of the business that took the deduction (ca-540-sched-d1-inst-2025::sec::part-iv::b03); the engine carries it only to a Schedule C business on this return (line 3).";

/* Part IV: the gap for a column that names no Schedule C business, and the line 3 difference. */
function recaptureFigures(inputs: ResolverInputs, recaptures: Section179RecaptureFact[]) {
  const ids = businessIdsOnReturn(inputs);
  const onReturn = (each: Section179RecaptureFact) =>
    each.value.businessId !== undefined && ids.has(each.value.businessId);
  const gapFor = (column: string) => {
    const lost = recaptures.filter((each) => each.value.column === column && !onReturn(each));
    return lost.length === 0
      ? undefined
      : `${lost.map(({ value }) => value.description).join(", ")}: ${LINE_38_GAP}`;
  };
  const partIVGap = { section179: gapFor("section_179"), section280f: gapFor("section_280f") };
  const kept = recaptures.filter(onReturn).map((each) => each.value);
  const difference: CaliforniaDifference = recaptureDifference(kept, kept.map(californiaRecapture));
  const offReturn = recaptures.filter((each) => !onReturn(each)).map((each) => each.value);
  const lostDifference = recaptureDifference(offReturn, offReturn.map(californiaRecapture));
  const lost = lostDifference.subtraction > 0 || lostDifference.addition > 0;
  return {
    partIVGap: partIVGap.section179 || partIVGap.section280f ? partIVGap : undefined,
    recapture: lost
      ? { ...difference, gap: partIVGap.section179 ?? partIVGap.section280f }
      : difference,
  };
}

/* Why no line can be figured: the federal form's reason, or a California one. */
function wholeGap(
  federal: Form4797FilingInfo,
  sales: BusinessPropertySaleFact[],
  prices: Array<number | undefined>,
): string | undefined {
  if (federal.form4797Gap) return federal.form4797Gap;
  return (
    sales.map((sale) => californiaSaleGap(sale.value)).find(Boolean) ??
    sales.map((sale, index) => saleGap(californiaSale(sale.value), prices[index])).find(Boolean)
  );
}

interface Figured {
  keys: string[];
  files: boolean;
  gap?: string;
  summaryGap?: string;
  lines?: ScheduleD1Lines;
  partIVGap?: ScheduleD1FilingInfo["scheduleD1PartIVGap"];
  recapture?: CaliforniaDifference;
}

/* The schedule with California amounts, and whether it differs from federal Form 4797. */
function figure(inputs: ResolverInputs, federal: Form4797FilingInfo): Figured {
  const sales = readBusinessPropertySaleFacts(inputs.facts).sales;
  const recaptures = readSection179RecaptureFacts(inputs.facts).recaptures;
  const keys = differingKeys(inputs, sales, recaptures);
  const forms = getForm1099SFacts(inputs.facts);
  const shared = sharedForms(sales);
  const prices = sales.map((sale) => priceOf(sale, forms, shared));
  const gap = wholeGap(federal, sales, prices);
  // Part IV reads only the recapture facts: Schedule CA line 3 takes its difference even with a gap.
  if (gap) return { keys, files: keys.length > 0, gap, ...recaptureFigures(inputs, recaptures) };
  const placed = sales.map((sale, index) =>
    placeProperty(californiaSale(sale.value), prices[index] ?? 0),
  );
  const lines = scheduleD1Lines({
    properties: placed,
    reportedProceeds: reportedProceeds(sales, forms),
    nonrecapturedLosses:
      num(inputs, SECTION_1231_KEYS.californiaNonrecapturedLosses) ??
      num(inputs, SECTION_1231_KEYS.nonrecapturedLosses),
    recaptures: recaptures.map((each) => californiaRecapture(each.value)),
    federalLine18b: federal.form4797?.line18b,
    federalWaits: federal.form4797?.waitsForLine8 ?? false,
  });
  const comparable = federal.form4797 !== undefined && !lines.waitsForLine19Or20;
  const differs = comparable ? differsFromFederal(lines, federal.form4797!) : true;
  return {
    keys,
    files: keys.length > 0 && differs,
    lines,
    summaryGap: summaryGapOf(inputs, federal, placed),
    ...recaptureFigures(inputs, recaptures),
  };
}

/*
 * California's section 1231 gain for Schedule D (540) line 1. With a gap it
 * differs when Schedule D-1 files: the gain cannot be compared, so Schedule D
 * (540) files and shows the gap.
 */
function section1231Gain(figured: Figured, federal: Form4797FilingInfo) {
  const gap = figured.gap ?? figured.summaryGap;
  const gain = figured.lines?.scheduleDGain;
  return {
    gain,
    gap,
    waits: figured.lines?.waitsForLine8 ?? false,
    differs: gap === undefined ? gain !== federal.form4797?.scheduleDGain : figured.files,
  };
}

/*
 * Who files: "only if your California gains or losses from the sale or exchange
 * of assets used in a trade or business are different from your federal gains or
 * losses" (ca-540-sched-d1-inst-2025::sec::a-purpose::b01), on Form 540. A fact
 * states a California amount that differs, and the California ordinary gain, the
 * section 1231 gain or a recapture differs (or cannot be compared yet). The
 * explicit decision still wins.
 */
export function resolveScheduleD1Info(inputs: ResolverInputs): ScheduleD1FilingInfo {
  const federal = resolve4797Info(inputs);
  const californiaReturn = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const federalFiles = federal.mustFile?.["form-4797"]?.value === true;
  const figured = californiaReturn && federalFiles ? figure(inputs, federal) : undefined;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${californiaReturn}), Form 4797 files (${federalFiles}), and ${figured?.keys.length ?? 0} fact(s) give California amounts that change a gain or loss`,
        value: figured?.files ?? false,
        triggeredByFactKeys: figured?.keys ?? [],
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
    ],
  });
  const californiaSection1231Gain = figured && section1231Gain(figured, federal);
  if (resolution.value !== true)
    return { mustFile: { "schedule-d-1": resolution }, californiaSection1231Gain };
  const waits = figured?.lines?.waitsForLine8 === true;
  return {
    mustFile: { "schedule-d-1": resolution },
    missingInputs: { "schedule-d-1": waits ? [SECTION_1231_KEYS.nonrecapturedLosses] : [] },
    scheduleD1: figured?.lines,
    scheduleD1Gap:
      figured?.gap ??
      (figured === undefined
        ? "Schedule D-1 files by decision, but Form 4797 does not file on a Form 540 return."
        : undefined),
    scheduleD1SummaryGap: figured?.summaryGap,
    scheduleD1PartIVGap: figured?.partIVGap,
    californiaSection1231Gain,
    scheduleD1Recapture: figured?.recapture,
  };
}
