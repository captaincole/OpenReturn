import {
  BUSINESS_LOSS_LIMIT_KEYS,
  getCasualtyEventFacts,
  getNolCarrybackWaiver,
  getNolCarrybackYear,
  getNolCarryoverRows,
  makeNolCarrybackYearFactKey,
  NOL_KEYS,
  type NolCarrybackYearValue,
} from "../../facts/index.js";
import { num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { businessLossesWithoutIncome } from "../461/resolveInfo.js";
import { totalBusinessLosses } from "../passThrough/excessBusinessLoss.js";
import type { Form172FilingInfo } from "./filingInfo.js";

export const UNREADABLE_CARRYOVERS_GAP =
  "The NOL carryover answer is not a list of rows with a year of loss and a carryover amount.";

/*
 * Who files (irs-172-inst-2025::sec::general-instructions::b01): "If your
 * deductions for the year are more than your income for the year, you may
 * have a net operating loss", and "your loss must generally be caused by
 * deductions from your" trade or business, rental property, or "Casualty and
 * theft losses resulting from a federally declared disaster". The resolver
 * cannot see the lines, so a business loss or a casualty files the form, and
 * Part I shows whether there is an NOL (QUESTIONS.md). The explicit decision wins.
 */
function mustFileOf(inputs: ResolverInputs) {
  const { k1Losses, other, line8Loss, entityKeys } = businessLossesWithoutIncome(inputs);
  const losses = other === undefined ? 0 : totalBusinessLosses(k1Losses, other) + line8Loss;
  const casualties = getCasualtyEventFacts(inputs.facts);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_172",
    fallbacks: [
      {
        rule: "fallback: the return has a business loss, which can make an NOL",
        value: losses > 0,
        triggeredByFactKeys: entityKeys,
      },
      {
        rule: "fallback: the return has a casualty or theft loss, which can make an NOL",
        value: casualties.length > 0,
        triggeredByFactKeys: casualties.map((casualty) => casualty.factKey),
      },
    ],
  });
}

/*
 * Part II's answers, asked only with a farm loss on the return: the waiver,
 * then, without it, each carryback year's return amounts until complete.
 */
function partIIAnswers(
  farmLoss: boolean,
  waives: boolean | undefined,
  years: Array<[string, NolCarrybackYearValue | undefined]>,
): string[] {
  if (!farmLoss) return [];
  if (waives === undefined) return [NOL_KEYS.waiveFarmingCarryback];
  if (waives) return [];
  return years.filter(([, value]) => !carrybackYearComplete(value)).map(([key]) => key);
}

/*
 * A carryback year holds every amount its lines need: line 6 when line 3 or 4
 * holds an amount, line 11 when the year itemized and line 3, 4 or 5 does,
 * and line 26's cash gifts when line 25 does and no other gifts are stated.
 */
export function carrybackYearComplete(year: NolCarrybackYearValue | undefined): boolean {
  if (year === undefined) return false;
  const refigures = (year.netCapitalLossDeduction ?? 0) > 0 || (year.section1202Exclusion ?? 0) > 0;
  if (refigures && year.agiAdjustment === undefined) return false;
  const adjusts = year.itemized && (refigures || (year.qbiDeduction ?? 0) > 0);
  if (!adjusts) return true;
  if (year.agi === undefined) return false;
  const gifts = (year.charitableContributions ?? 0) > 0 && year.otherGifts !== true;
  return !gifts || year.cashGiftsTo60PercentOrganizations !== undefined;
}

/*
 * The carryover rows are optional by design: a taxpayer with no carryover
 * says nothing. Schedule 1 line 8a reads them whether or not Form 172 files.
 */
export function resolve172Info(inputs: ResolverInputs): Form172FilingInfo {
  const rows = getNolCarryoverRows(inputs.facts);
  const carryovers: Form172FilingInfo = {
    nolCarryovers: rows ?? undefined,
    nolCarryoverGap: rows === null ? UNREADABLE_CARRYOVERS_GAP : undefined,
  };
  const mustFile = mustFileOf(inputs);
  if (mustFile.value !== true) return { ...carryovers, mustFile: { "form-172": mustFile } };
  const { other, entityKeys } = businessLossesWithoutIncome(inputs);
  const farmLoss = (other?.farmLosses ?? 0) > 0;
  const waives = getNolCarrybackWaiver(inputs.facts);
  const carryback2023 = getNolCarrybackYear(inputs.facts, 2023);
  const carryback2024 = getNolCarrybackYear(inputs.facts, 2024);
  const years: Array<[string, NolCarrybackYearValue | undefined]> = [
    [makeNolCarrybackYearFactKey(2023), carryback2023],
    [makeNolCarrybackYearFactKey(2024), carryback2024],
  ];
  return {
    ...carryovers,
    mustFile: { "form-172": mustFile },
    missingInputs: { "form-172": partIIAnswers(farmLoss, waives, years) },
    form172: {
      farmLoss,
      waivesFarmingCarryback: waives,
      carryback2023,
      carryback2024,
      passThroughOnReturn: entityKeys.length > 0,
      businessCapitalNet: num(inputs, BUSINESS_LOSS_LIMIT_KEYS.businessCapitalGain) ?? 0,
    },
  };
}
