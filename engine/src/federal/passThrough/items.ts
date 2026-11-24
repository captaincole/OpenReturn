/*
 * Layers 1 to 3 together (README.md): each K-1 fact on the return, its
 * holding, and its boxes turned into items by the form's box table. Imports
 * no form, so any form or bound may read it.
 */

import {
  k1EntityIdOf,
  makeAtRiskFactKey,
  makeK1HoldingFactKey,
  readAtRiskFacts,
  readK1Facts,
  readK1HoldingFacts,
  type AtRiskAmounts,
  type K1CarriedBasisLosses,
  type K1FactValue,
  type K1Form,
  type K1HoldingFactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { rowFor, type BoxTable, type StatementBox } from "./boxTable.js";
import { isPortfolio, labelOf, RENTAL_TYPES, roleOf, type ItemType } from "./itemTypes.js";
import { PARTNERSHIP_BOXES, PARTNERSHIP_STATEMENT_BOX } from "./partnershipBoxes.js";
import { S_CORPORATION_BOXES, S_CORPORATION_STATEMENT_BOX } from "./sCorporationBoxes.js";
import { TRUST_BOXES, TRUST_STATEMENT_BOX } from "./trustBoxes.js";

type FactRow = { key: string; value: unknown; category: string };

export const BOX_TABLES: Record<K1Form, BoxTable> = {
  "1120-S": S_CORPORATION_BOXES,
  "1065": PARTNERSHIP_BOXES,
  "1041": TRUST_BOXES,
};

export const STATEMENT_BOXES: Record<K1Form, StatementBox> = {
  "1120-S": S_CORPORATION_STATEMENT_BOX,
  "1065": PARTNERSHIP_STATEMENT_BOX,
  "1041": TRUST_STATEMENT_BOX,
};

/* How the reasons name each form's entity. */
export const ENTITY_KIND: Record<K1Form, string> = {
  "1120-S": "S corporation",
  "1065": "partnership",
  "1041": "estate or trust",
};

/* One amount from one K-1, in the shared vocabulary. */
export interface PassThroughItem {
  /* The K-1 fact it came from. */
  entityKey: string;
  type: ItemType;
  detail?: string;
  /* Signed as the K-1 prints it; undefined for an item that is a statement only. */
  amount?: number;
  /* Where it came from, for the reasons a form prints; no form routes by these. */
  box: string;
  code?: string;
  label: string;
  /*
   * A loss or deduction the basis limit held back in an earlier year, carried to
   * this one (the holding's carriedLosses.basis); box and code are the K-1's
   * for that item.
   */
  fromPriorYear?: boolean;
  /*
   * A loss the passive limit held back in an earlier year (the holding's
   * carriedLosses.passive), allowed this year by the passive stage;
   * fromPriorYear is true too. It is not a basis loss: no "PYA" row of its own
   * while Form 8582 reports it.
   */
  passiveCarryover?: boolean;
  /*
   * A loss the at-risk limit held back in an earlier year (the holding's
   * carriedLosses.atRisk), on this year's Form 6198 line 1; fromPriorYear is
   * true too, so once allowed it takes a "PYA" row like a carried basis loss
   * (irs-1040se-inst-2025::sec::losses-not-allowed-in-prior-years-due-to-the-basis::b01).
   */
  atRiskCarryover?: boolean;
}

/* An item as a reason names it: its type and the box it came from. */
export function describeItem(item: PassThroughItem): string {
  const where = item.code === undefined ? `box ${item.box}` : `box ${item.box} code ${item.code}`;
  const when = item.fromPriorYear === true ? ", carried from an earlier year" : "";
  return `${labelOf(item.type)} (${where}${when})`;
}

/* "<name> (<kind> K-1)", the way every reason starts. */
export function entityTitle(entity: { name: string; form: K1Form }): string {
  return `${entity.name} (${ENTITY_KIND[entity.form]} K-1)`;
}

/* One K-1 on this return: the document, the owner's holding answers, and its items. */
export interface PassThroughEntity {
  key: string;
  holdingKey: string;
  form: K1Form;
  name: string;
  ein: string;
  k1: K1FactValue;
  /* Undefined until the owner's answers are recorded. */
  holding?: K1HoldingFactValue;
  items: PassThroughItem[];
  /* The basis losses carried from earlier years (fromPriorYear), from the holding. */
  priorYearItems: PassThroughItem[];
  /* Form 6198's amounts at risk (the fact at_risk.<key>); undefined until recorded. */
  atRisk?: AtRiskAmounts;
}

type CarriedBasisItem = {
  type: ItemType;
  box: string;
  code?: string;
  detail?: string;
  sign: 1 | -1;
};

/*
 * Each carried basis loss of the holding as the item the K-1 box would give
 * (Schedule K-1 (Form 1120-S) boxes 1 to 12 and 16 code F): a loss negative, a
 * deduction positive, as the K-1 prints them.
 */
const S_CORPORATION_CARRIED: Record<keyof K1CarriedBasisLosses, CarriedBasisItem> = {
  ordinaryBusinessLoss: { type: "ordinary_business_income", box: "1", sign: -1 },
  netRentalRealEstateLoss: { type: "net_rental_real_estate_income", box: "2", sign: -1 },
  otherNetRentalLoss: { type: "other_net_rental_income", box: "3", sign: -1 },
  netShortTermCapitalLoss: { type: "net_short_term_capital_gain", box: "7", sign: -1 },
  netLongTermCapitalLoss: { type: "net_long_term_capital_gain", box: "8a", sign: -1 },
  netSection1231Loss: { type: "net_section_1231_gain", box: "9", sign: -1 },
  otherLoss: { type: "other_income", box: "10", code: "ZZ", detail: "other", sign: -1 },
  section179Deduction: { type: "section_179_deduction", box: "11", sign: 1 },
  cashCharitableContributions: {
    type: "charitable_contribution",
    box: "12",
    code: "A",
    detail: "cash_60",
    sign: 1,
  },
  otherCharitableContributions: { type: "charitable_contribution", box: "12", sign: 1 },
  investmentInterestExpense: { type: "investment_interest_expense", box: "12", code: "H", sign: 1 },
  section59eExpenditures: {
    type: "other_deduction",
    box: "12",
    code: "J",
    detail: "section_59e_expenditures",
    sign: 1,
  },
  otherDeductions: { type: "other_deduction", box: "12", code: "ZZ", detail: "other", sign: 1 },
  foreignTaxes: { type: "foreign_tax_paid", box: "16", code: "F", sign: 1 },
};

/*
 * The same for a partner (Schedule K-1 (Form 1065) boxes 1 to 13 and 21): the
 * rows of the Partner's Basis Worksheet Part II line 15, column (B)
 * (irs-1065k1-inst-2025::sec::line-14::b03).
 */
const PARTNERSHIP_CARRIED: Record<keyof K1CarriedBasisLosses, CarriedBasisItem> = {
  ordinaryBusinessLoss: { type: "ordinary_business_income", box: "1", sign: -1 },
  netRentalRealEstateLoss: { type: "net_rental_real_estate_income", box: "2", sign: -1 },
  otherNetRentalLoss: { type: "other_net_rental_income", box: "3", sign: -1 },
  netShortTermCapitalLoss: { type: "net_short_term_capital_gain", box: "8", sign: -1 },
  netLongTermCapitalLoss: { type: "net_long_term_capital_gain", box: "9a", sign: -1 },
  netSection1231Loss: { type: "net_section_1231_gain", box: "10", sign: -1 },
  otherLoss: { type: "other_income", box: "11", code: "ZZ", detail: "other", sign: -1 },
  section179Deduction: { type: "section_179_deduction", box: "12", sign: 1 },
  cashCharitableContributions: {
    type: "charitable_contribution",
    box: "13",
    code: "A",
    detail: "cash_60",
    sign: 1,
  },
  otherCharitableContributions: { type: "charitable_contribution", box: "13", sign: 1 },
  investmentInterestExpense: { type: "investment_interest_expense", box: "13", code: "H", sign: 1 },
  section59eExpenditures: {
    type: "other_deduction",
    box: "13",
    code: "J",
    detail: "section_59e_expenditures",
    sign: 1,
  },
  otherDeductions: { type: "other_deduction", box: "13", code: "ZZ", detail: "other", sign: 1 },
  foreignTaxes: { type: "foreign_tax_paid", box: "21", sign: 1 },
};

/* A beneficiary has no basis limit, so a trust K-1 carries no basis loss. */
const CARRIED_BASIS_ITEMS: Partial<
  Record<K1Form, Record<keyof K1CarriedBasisLosses, CarriedBasisItem>>
> = {
  "1120-S": S_CORPORATION_CARRIED,
  "1065": PARTNERSHIP_CARRIED,
};

/* A holding with any basis loss carried from an earlier year. */
export function hasCarriedBasisLoss(holding: K1HoldingFactValue | undefined): boolean {
  return Object.values(holding?.carriedLosses?.basis ?? {}).some((amount) => (amount ?? 0) > 0);
}

/* The holding's carried basis losses as items, in Form 7203 Part III order. */
export function priorYearItemsOf(
  key: string,
  holding: K1HoldingFactValue | undefined,
  form: K1Form = "1120-S",
) {
  const carried = holding?.carriedLosses?.basis ?? {};
  const rows: Partial<Record<string, CarriedBasisItem>> = CARRIED_BASIS_ITEMS[form] ?? {};
  return Object.entries(rows).flatMap(([field, row]): PassThroughItem[] => {
    if (row === undefined) return [];
    const amount = carried[field as keyof K1CarriedBasisLosses] ?? 0;
    if (amount <= 0) return [];
    const { sign, ...where } = row;
    return [
      {
        entityKey: key,
        ...where,
        amount: sign * amount,
        label: `${labelOf(row.type)} carried from an earlier year`,
        fromPriorYear: true,
      },
    ];
  });
}

/*
 * Each box with an amount other than 0 is an item; a box with no amount
 * (STMT) is an item too, since it says a statement exists. A section 199A
 * statement adds its box's item when the boxes do not list it.
 */
export function itemsOf(key: string, k1: K1FactValue): PassThroughItem[] {
  const table = BOX_TABLES[k1.form];
  const items = k1.boxes
    .filter((entry) => entry.amount !== 0)
    .map((entry): PassThroughItem => {
      const row = rowFor(table, entry.box, entry.code);
      return {
        entityKey: key,
        type: row.type,
        detail: row.detail,
        amount: entry.amount,
        box: entry.box,
        code: entry.code,
        label: row.label,
      };
    });
  const statement = STATEMENT_BOXES[k1.form];
  const listed = items.some((item) => item.box === statement.box && item.code === statement.code);
  if (k1.section199A === undefined || listed) return items;
  const row = rowFor(table, statement.box, statement.code);
  return [...items, { entityKey: key, type: row.type, label: row.label, ...statement }];
}

/*
 * The K-1s on this return, in fact order. Filing jointly, every K-1. On any
 * other status, a K-1 the holding gives to the spouse belongs on the spouse's
 * return: its key is in spouseKeys so a form can wait on it, as a spouse's
 * Schedule C business does. A K-1 whose holding is not recorded yet stays on
 * the return; its holding key is in missingHoldingKeys. A beneficiary's
 * holding decides only whose K-1 it is (the passive stage asks a trust
 * nothing), so on a joint return a trust K-1 does not ask for it.
 */
export function passThroughEntitiesOnReturn(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): {
  entities: PassThroughEntity[];
  spouseKeys: string[];
  missingHoldingKeys: string[];
  malformedKeys: string[];
} {
  const { k1s, malformedKeys } = readK1Facts(facts);
  const { holdings, malformedKeys: malformedHoldings } = readK1HoldingFacts(facts);
  const { amounts: atRisk, malformedKeys: malformedAtRisk } = readAtRiskFacts(facts);
  const all = k1s.map(({ key, value }): PassThroughEntity => {
    const holdingKey = makeK1HoldingFactKey(k1EntityIdOf(key) ?? key);
    const holding = holdings.get(holdingKey);
    return {
      key,
      holdingKey,
      form: value.form,
      name: value.entityName,
      ein: value.entityEin,
      k1: value,
      holding,
      items: itemsOf(key, value),
      priorYearItems: priorYearItemsOf(key, holding, value.form),
      atRisk: atRisk.get(makeAtRiskFactKey(key)),
    };
  });
  const offReturn = (entity: PassThroughEntity) => !joint && entity.holding?.owner === "spouse";
  const entities = all.filter((entity) => !offReturn(entity));
  return {
    entities,
    spouseKeys: all.filter(offReturn).map((entity) => entity.key),
    missingHoldingKeys: entities
      .filter((entity) => entity.holding === undefined && (entity.form !== "1041" || !joint))
      .map((entity) => entity.holdingKey),
    malformedKeys: [...malformedKeys, ...malformedHoldings, ...malformedAtRisk],
  };
}

const allItems = (facts: ReadonlyArray<FactRow>) =>
  readK1Facts(facts).k1s.flatMap(({ key, value }) => itemsOf(key, value));

const enteringIncome = (item: PassThroughItem) =>
  roleOf(item.type) === "income" || roleOf(item.type) === "unknown";

const positiveAmount = (item: PassThroughItem) => Math.max(0, item.amount ?? 0);

/*
 * A partnership K-1 may print only the total of guaranteed payments (box 4c,
 * irs-1065k1-inst-2025::sec::box-4c-total-guaranteed-payments::b01), not boxes
 * 4a and 4b. The part of the total above boxes 4a and 4b is income too.
 */
function guaranteedPaymentsOnlyInTotal(items: PassThroughItem[]): number {
  const total = sum(
    ...items.filter((item) => item.type === "guaranteed_payments_total").map(positiveAmount),
  );
  const parts = sum(
    ...items
      .filter(
        (item) =>
          item.type === "guaranteed_payment_services" || item.type === "guaranteed_payment_capital",
      )
      .map(positiveAmount),
  );
  return Math.max(0, total - parts);
}

/*
 * An upper bound on what every K-1 adds to AGI, for the bounds the resolvers
 * use before evaluation (Form 8960's MAGI, the QBI form choice): each income
 * item's amount above 0, an unknown item's, and guaranteed payments printed
 * only as a total. Every K-1 counts, whoever's.
 */
export function passThroughIncomeUpperBound(facts: ReadonlyArray<FactRow>): number {
  const perK1 = readK1Facts(facts).k1s.map(({ key, value }) => {
    const items = itemsOf(key, value);
    return sum(
      ...items.filter(enteringIncome).map(positiveAmount),
      guaranteedPaymentsOnlyInTotal(items),
    );
  });
  return sum(...perK1);
}

/*
 * Income from a passive activity: every rental, and a trade or business the
 * owner does not materially participate in (irs-8960-inst-2025::sec::passive-activity::b01).
 * A trust's business and rental income goes in Schedule E Part III column (d),
 * passive income (QUESTIONS.md item 16), so a trust K-1's is passive too.
 */
function isPassiveActivityIncome(
  form: K1Form,
  holding: K1HoldingFactValue | undefined,
  item: PassThroughItem,
): boolean {
  if (RENTAL_TYPES.includes(item.type)) return true;
  if (item.type !== "ordinary_business_income") return false;
  return form === "1041" || holding?.materiallyParticipated === false;
}

/*
 * A K-1 brings investment income for Form 8960's Who Must File: a portfolio
 * item (interest, dividends, gains, other portfolio income), income from a
 * passive activity, or a beneficiary's net investment income adjustment
 * (irs-1041k1-inst-2025::sec::box-14-other-information::b03). Every K-1
 * counts, whoever's.
 */
export function passThroughHasInvestmentIncome(facts: ReadonlyArray<FactRow>): boolean {
  const { holdings } = readK1HoldingFacts(facts);
  return readK1Facts(facts).k1s.some(({ key, value }) => {
    const holding = holdings.get(makeK1HoldingFactKey(k1EntityIdOf(key) ?? key));
    return itemsOf(key, value).some(
      (item) =>
        (item.amount ?? 0) !== 0 &&
        (isPortfolio(item.type) ||
          item.type === "net_investment_income" ||
          isPassiveActivityIncome(value.form, holding, item)),
    );
  });
}

/*
 * A lower bound on what every K-1 adds to AGI (the EIC's AGI floor): each
 * income item's loss, an unknown item's, every deduction, and every loss
 * carried from an earlier year, as if all were allowed. The limits only
 * shrink a loss, so the bound holds.
 */
export function passThroughLossFloor(facts: ReadonlyArray<FactRow>): number {
  const items = allItems(facts);
  const losses = items.filter(enteringIncome).map((item) => Math.min(0, item.amount ?? 0));
  const deductions = items
    .filter((item) => roleOf(item.type) === "deduction")
    .map((item) => -Math.abs(item.amount ?? 0));
  const carried = [...readK1HoldingFacts(facts).holdings.values()].flatMap((holding) => {
    const { basis, atRisk, passive } = holding.carriedLosses ?? {};
    return [...Object.values(basis ?? {}), atRisk, passive].map((amount) => -(amount ?? 0));
  });
  return sum(...losses, ...deductions, ...carried);
}
