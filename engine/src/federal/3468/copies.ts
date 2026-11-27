/*
 * The copies of Form 3468 a return files: one for each property fact, "a
 * separate Form 3468 ... for each facility or property", then one separate
 * form for the unused credits from cooperatives, stated or on a K-1 (codes P
 * to U) (irs-3468-inst-2025::sec::general-instructions::b01 to ::b03).
 * Everything here is figured from the facts, so Form 3800 can read every copy.
 */

import {
  getCooperativeInvestmentCreditFacts,
  getInvestmentCreditPropertyFacts,
  type CooperativeCreditAmounts,
  type InvestmentCreditPropertyFact,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import { k1EntitiesWithRoute, type ReceivedItem } from "../passThrough/receipts.js";
import { inPart, type Cells } from "./cells.js";
import { energyLines } from "./energy.js";
import { placedIn2025, WAITING } from "./lines.js";
import { cooperativePartI, partILines } from "./partI.js";
import {
  advancedEnergyLines,
  advancedManufacturingLines,
  cleanElectricityLines,
  coalGasificationLines,
  type PartResult,
} from "./parts.js";
import { rehabilitationLines } from "./rehabilitation.js";

type PartName = InvestmentCreditPropertyFact["value"]["credit"]["part"];

/* Each part: its cells prefix, its Form 3800 Part III line, and its cooperative and total lines. */
export const PARTS: Readonly<
  Record<PartName, { prefix: string; form3800Line: string; cooperative: string; total: string }>
> = {
  advanced_coal_gasification: { prefix: "part2", form3800Line: "1a", cooperative: "6", total: "7" },
  advanced_energy: { prefix: "part3", form3800Line: "1d", cooperative: "2", total: "3" },
  advanced_manufacturing: { prefix: "part4", form3800Line: "1o", cooperative: "2", total: "3" },
  clean_electricity: { prefix: "part5", form3800Line: "1v", cooperative: "10", total: "11" },
  energy: { prefix: "part6", form3800Line: "4a", cooperative: "31", total: "32" },
  rehabilitation: { prefix: "part7", form3800Line: "4k", cooperative: "2", total: "3" },
};

/* The fact field of each part on a cooperative fact. */
export const COOPERATIVE_FIELDS: Record<PartName, keyof CooperativeCreditAmounts> = {
  advanced_coal_gasification: "advancedCoalGasification",
  advanced_energy: "advancedEnergy",
  advanced_manufacturing: "advancedManufacturing",
  clean_electricity: "cleanElectricity",
  energy: "energy",
  rehabilitation: "rehabilitation",
};

/* The K-1 box 15 codes P to U (passThrough box tables) and the part each goes to (irs-1065k1-inst-2025::sec::box-15-credits::b07, ::b08). */
export const K1_COOPERATIVE_DETAILS: Readonly<Record<string, PartName>> = {
  unused_coal: "advanced_coal_gasification",
  unused_advanced_energy: "advanced_energy",
  unused_manufacturing: "advanced_manufacturing",
  unused_clean_electricity: "clean_electricity",
  unused_energy: "energy",
  unused_rehabilitation: "rehabilitation",
};

export interface Form3468Copy {
  /* The property fact, or "cooperatives" for the separate form. */
  key: string;
  cells: Cells;
  /* The part total that reaches Form 3800; undefined for the cooperative copy and while waiting. */
  total?: number | ReturnType<typeof unsupported>;
  part?: PartName;
  waiting: boolean;
}

export const COOPERATIVES_COPY = "cooperatives";

const NOT_THIS_YEAR =
  "Parts II to VI take property placed in service during the tax year (Part I line 5 is not in 2025); the engine does not model qualified progress expenditures.";
const TRANSFER_GAP =
  "A section 6418 transfer is for the credits of Parts III, V and VI (irs-3468-inst-2025::sec::credit-transfers::b01).";
const ELECTIVE_GAP =
  "An individual makes the elective payment election only for the advanced manufacturing investment credit, Part IV (irs-3468-inst-2025::sec::elective-payment-under-section::b01); sections 48C, 48E and 48 allow it for applicable entities (applicable-entities::b01).";

function partResult(fact: InvestmentCreditPropertyFact): PartResult {
  const { facility, credit, passThroughEin } = fact.value;
  switch (credit.part) {
    case "advanced_coal_gasification":
      return coalGasificationLines(credit.investment);
    case "advanced_energy":
      return advancedEnergyLines(credit.investment, facility, passThroughEin);
    case "advanced_manufacturing":
      return advancedManufacturingLines(credit.investment, facility);
    case "clean_electricity":
      return cleanElectricityLines(credit.investment, facility);
    case "energy":
      return energyLines(credit.investment, facility);
    case "rehabilitation":
      return rehabilitationLines(credit.investment, facility, passThroughEin);
  }
}

/* Why the total cannot reach Form 3800 as figured; undefined when it can. */
function electionGap(fact: InvestmentCreditPropertyFact): string | undefined {
  const { credit, transfer, electivePayment, facility } = fact.value;
  if (credit.part !== "rehabilitation" && !placedIn2025(facility)) return NOT_THIS_YEAR;
  const transferable = ["advanced_energy", "clean_electricity", "energy"].includes(credit.part);
  if (transfer !== undefined && !transferable) return TRANSFER_GAP;
  if (electivePayment !== undefined && credit.part !== "advanced_manufacturing")
    return ELECTIVE_GAP;
  return undefined;
}

/* One property's Form 3468. */
export function propertyCopy(fact: InvestmentCreditPropertyFact): Form3468Copy {
  const part = fact.value.credit.part;
  const prefix = PARTS[part].prefix;
  const partI = partILines(fact.value);
  const result = partResult(fact);
  if (result === WAITING) return { key: fact.key, cells: partI, part, waiting: true };
  const reason = electionGap(fact) ?? result.gap;
  const total = reason === undefined ? result.total : unsupported(reason);
  const lines =
    reason === undefined ? result.lines : { ...result.lines, [PARTS[part].total]: total };
  return {
    key: fact.key,
    cells: { ...partI, ...inPart(prefix, lines) },
    total,
    part,
    waiting: false,
  };
}

/* The K-1 codes P to U on the return, with their part. */
export function k1CooperativeItems(
  inputs: ResolverInputs,
): Array<ReceivedItem & { part: PartName }> {
  return k1EntitiesWithRoute(inputs, "form_3800").flatMap((received) => {
    const part = K1_COOPERATIVE_DETAILS[received.item.detail ?? ""];
    return part === undefined ? [] : [{ ...received, part }];
  });
}

const K1_STATEMENT_GAP =
  "The K-1 prints STMT for an unused investment credit from cooperatives, and the K-1 fact does not hold the amount.";

/* The separate Form 3468 for cooperatives, or undefined with none. */
export function cooperativeCopy(inputs: ResolverInputs): Form3468Copy | undefined {
  const stated = getCooperativeInvestmentCreditFacts(inputs.facts);
  const k1 = k1CooperativeItems(inputs);
  if (stated.length === 0 && k1.length === 0) return undefined;
  const cells: Cells = cooperativePartI();
  for (const [part, layout] of Object.entries(PARTS) as Array<
    [PartName, (typeof PARTS)[PartName]]
  >) {
    const field = COOPERATIVE_FIELDS[part];
    const statedAmounts = stated.flatMap((fact) => fact.value.credits[field] ?? []);
    const fromK1 = k1.filter((item) => item.part === part);
    if (statedAmounts.length === 0 && fromK1.length === 0) continue;
    const missing = fromK1.some((item) => item.item.amount === undefined);
    const amount = missing
      ? unsupported(K1_STATEMENT_GAP)
      : sum(
          ...statedAmounts.map(roundDollars),
          ...fromK1.map((item) => roundDollars(item.item.amount ?? 0)),
        );
    Object.assign(
      cells,
      inPart(layout.prefix, { [layout.cooperative]: amount, [layout.total]: amount }),
    );
  }
  return { key: COOPERATIVES_COPY, cells, waiting: false };
}

/* Every copy, the properties in the order recorded and the cooperative form last. */
export function form3468Copies(inputs: ResolverInputs): Form3468Copy[] {
  const properties = getInvestmentCreditPropertyFacts(inputs.facts).map(propertyCopy);
  const cooperatives = cooperativeCopy(inputs);
  return cooperatives === undefined ? properties : [...properties, cooperatives];
}
