import {
  getLowIncomeHousingRecaptureFacts,
  k1EntityIdOf,
  makeK1LowIncomeHousingRecaptureFactKey,
  type FlowThroughLowIncomeHousingRecapture,
  type LowIncomeHousingRecaptureFact,
  type OwnLowIncomeHousingRecapture,
} from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { k1KeysWithRoute, receivedOnReturn } from "../passThrough/receipts.js";
import { flowThroughCopy, hasRecaptureEvent, ownCopy } from "./copies.js";
import type { Form8611Copy, Form8611FilingInfo } from "./filingInfo.js";

/* Where a K-1's low-income housing recapture goes (passThrough/routing.ts). */
const ROUTE = "form_8611_line_8";
const SECTION_42J5_TYPE = "low_income_housing_recapture_42j5";

type OwnFact = { key: string; value: OwnLowIncomeHousingRecapture };

const isOwn = (fact: LowIncomeHousingRecaptureFact): fact is OwnFact => fact.value.kind === "own";

/* The buildings the owner figures whose qualified basis fell this year. */
function recapturingBuildings(inputs: ResolverInputs): OwnFact[] {
  return getLowIncomeHousingRecaptureFacts(inputs.facts)
    .filter(isOwn)
    .filter((fact) => hasRecaptureEvent(fact.value));
}

/*
 * One copy for each K-1 recapture amount, with the building fact that goes
 * with its K-1 and code; it waits for that fact. A K-1 the loss limits stopped
 * or that waits on an answer gives one copy that says so.
 */
function k1Copies(inputs: ResolverInputs): Form8611Copy[] {
  const receipt = receivedOnReturn(inputs, ROUTE);
  if (receipt.kind === "unsupported") return [{ gap: { fromLine: 0, reason: receipt.reason } }];
  if (receipt.kind === "waiting") return [{ waitingOn: receipt.factKeys }];
  const facts = getLowIncomeHousingRecaptureFacts(inputs.facts);
  return receipt.items
    .filter(({ item }) => (item.amount ?? 0) !== 0)
    .map(({ entity, item }) => {
      const section42j5 = item.type === SECTION_42J5_TYPE;
      const key = makeK1LowIncomeHousingRecaptureFactKey(
        k1EntityIdOf(entity.key) ?? entity.key,
        section42j5 ? "section_42j5" : "other",
      );
      const fact = facts.find((each) => each.key === key);
      if (fact === undefined || fact.value.kind !== "flow_through") return { waitingOn: [key] };
      return flowThroughCopy(
        key,
        fact.value as FlowThroughLowIncomeHousingRecapture,
        item.amount ?? 0,
        section42j5,
      );
    });
}

/*
 * Who files: an owner who "must recapture part of the low-income housing credit
 * you claimed in previous years because the qualified basis decreased from one
 * year to the next or you disposed of a building, or your interest therein"
 * (irs-8611-form-2025::sec::purpose-of-form::b01). A building fact with a
 * recapture event this year files it, and so does a K-1 with a recapture of
 * the credit (partnership box 20 codes F and G, S corporation box 17 codes E
 * and F); the explicit decision still wins. One copy for each building: the
 * form is completed "for each building to which recapture applies"
 * (::face-page-1::b01), and each K-1 code is its own building's form.
 */
export function resolve8611Info(inputs: ResolverInputs): Form8611FilingInfo {
  const buildings = recapturingBuildings(inputs);
  const k1Keys = k1KeysWithRoute(inputs, ROUTE);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8611",
    fallbacks: [
      {
        rule: `fallback: ${buildings.length} building(s) whose qualified basis fell, ${k1Keys.length} K-1(s) with a low-income housing credit recapture`,
        value: buildings.length + k1Keys.length > 0,
        triggeredByFactKeys: [...buildings.map((fact) => fact.key), ...k1Keys],
      },
    ],
  });
  if (mustFile.value !== true) return { mustFile: { "form-8611": mustFile } };
  const copies = [
    ...buildings.map((fact) => ownCopy(fact.value)),
    ...(k1Keys.length > 0 ? k1Copies(inputs) : []),
  ];
  return {
    mustFile: { "form-8611": mustFile },
    missingInputs: { "form-8611": copies.flatMap((copy) => copy.waitingOn ?? []) },
    form8611Copies: copies,
  };
}
