import {
  INJURED_SPOUSE_KEY,
  farmOwnerOf,
  farmsOnReturn,
  isRetirementDistributionFactKey,
  isW2FactKey,
  ownerOf,
  readInjuredSpouseFact,
  statedBusinessesOnReturn,
  type InjuredSpouse,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  w2Owner,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { excessSocialSecurityOf } from "../schedule-3/excessSocialSecurity.js";
import type { Form8379FilingInfo, Form8379Spouse } from "./filingInfo.js";

const otherOf = (injured: InjuredSpouse): InjuredSpouse =>
  injured === "taxpayer" ? "spouse" : "taxpayer";

function w2sOf(inputs: ResolverInputs): Array<{ key: string; w2: W2FactValue }> {
  return factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => ({ key: row.key, w2: row.value as W2FactValue }));
}

function ownsBusiness(inputs: ResolverInputs, owner: InjuredSpouse): boolean {
  const { businesses } = statedBusinessesOnReturn(inputs.facts, true);
  const { farms } = farmsOnReturn(inputs.facts, true);
  return (
    businesses.some((business) => ownerOf(business.value) === owner) ||
    farms.some((farm) => farmOwnerOf(farm.value) === owner)
  );
}

function spouseOf(inputs: ResolverInputs, owner: InjuredSpouse): Form8379Spouse {
  const w2s = w2sOf(inputs)
    .filter(({ w2 }) => w2Owner(inputs, w2) === owner)
    .map(({ w2 }) => w2);
  const retirement = factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .map((row) => row.value as RetirementDistributionFactValue)
    .filter((distribution) => (distribution.owner ?? "taxpayer") === owner);
  return {
    wages: sum(...w2s.map((w2) => w2.box1)),
    w2Withholding: sum(...w2s.map((w2) => w2.box2)),
    retirementWithholding: sum(...retirement.map((distribution) => distribution.box4)),
    medicareTaxWithheld: sum(...w2s.map((w2) => w2.box6)),
    medicareWages: sum(...w2s.map((w2) => w2.box5)),
    excessSocialSecurity: excessSocialSecurityOf(w2s),
    hasBusiness: ownsBusiness(inputs, owner),
  };
}

/*
 * Who files (irs-8379-inst-2025::sec::are-you-an-injured-spouse::b01, the form's
 * Part I lines 2 to 4): a joint return, an overpayment applied to a past-due
 * debt of the other spouse only, and an injured spouse who does not owe it.
 * Lines 5 to 9 need the return's amounts; the form names their Yes boxes in
 * filesOnlyWithAmountOn, so it leaves the return when Part I says "Stop here".
 * The explicit decision wins.
 */
export function resolve8379Info(inputs: ResolverInputs): Form8379FilingInfo {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const fact = readInjuredSpouseFact(inputs.factByKey);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8379",
    fallbacks: [
      {
        rule: "fallback: a joint return's overpayment pays a debt of the other spouse only, which the injured spouse does not owe",
        value: joint && fact?.offsetForOtherSpouseDebt === true && !fact.legallyObligated,
        triggeredByFactKeys: fact === undefined ? [] : [INJURED_SPOUSE_KEY],
      },
    ],
  });
  const unplaced = joint
    ? w2sOf(inputs)
        .filter(({ w2 }) => w2Owner(inputs, w2) === undefined)
        .map(({ key }) => key)
    : [];
  // Line 15 itemized: the fact is listed again while its share of the deductions is missing.
  const itemizes = inputs.decisionByKey.get("decisions.itemize_vs_standard") === "itemized";
  const complete =
    fact !== undefined && (!itemizes || fact.shares.itemizedDeductions !== undefined);
  const required: Record<string, unknown> = { [INJURED_SPOUSE_KEY]: complete ? fact : undefined };
  for (const key of unplaced) required[key] = undefined;
  const spouses =
    fact === undefined || unplaced.length > 0
      ? undefined
      : {
          injured: spouseOf(inputs, fact.injuredSpouse),
          other: spouseOf(inputs, otherOf(fact.injuredSpouse)),
        };
  return {
    mustFile: { "form-8379": resolution },
    missingInputs: { "form-8379": resolution.value === true ? missingInputs(required) : [] },
    form8379: { fact, spouses },
  };
}
