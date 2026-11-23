/*
 * The Schedule K-1 an individual receives, one fact per K-1: from a partnership
 * (Form 1065), an S corporation (Form 1120-S) or an estate or trust (Form 1041).
 * Category k1. Each fact holds the boxes as the form prints them, and the
 * statements a box points to when a form reads them. Nothing here is
 * interpreted: the box tables in federal/passThrough/ turn each box into an
 * item, and the owner's own answers (participation, basis, carried losses) are
 * the holding fact (k1Holding.ts). The engine never computes the entity's
 * return (Form 1065, 1120-S or 1041).
 */

type FactRow = { key: string; value: unknown; category: string };

/* The form the K-1 belongs to. */
export type K1Form = "1065" | "1120-S" | "1041";

/*
 * One amount the K-1 prints in Part III: the box ("1", "4a", "17"), the code
 * where the box has codes ("V", "ZZ"), and the amount, signed (a loss is
 * negative). The amount is absent when the K-1 prints "STMT" for an item that
 * is an attached statement only (irs-1120sk1-inst-2025::sec::specific-instructions::b03).
 */
export interface K1Box {
  box: string;
  code?: string;
  amount?: number;
}

/*
 * One trade or business on the section 199A statement: S corporation box 17
 * code V (irs-1120sk1-inst-2025::sec::box-17-other-information::b11, ::b12), partnership
 * box 20 code Z, trust box 14 code I. Amounts as the statement prints them.
 */
export interface Section199AStatement {
  /* The trade or business, as the statement names it. */
  businessName?: string;
  /*
   * QBI (qualified business income or loss) of the trade or business, signed.
   * Absent on a statement that names no trade or business: a trust's statement
   * may hold only section 199A dividends
   * (irs-1041k1-inst-2025::sec::box-14-other-information::b05).
   */
  qualifiedBusinessIncome?: number;
  /* W-2 wages allocable to the QBI (Form 8995-A line 4). */
  w2Wages?: number;
  /* UBIA of qualified property (Form 8995-A line 7). */
  qualifiedPropertyUbia?: number;
  /* The statement marks it a specified service trade or business. */
  specifiedService?: boolean;
  /* Section 199A dividends (qualified REIT dividends). */
  section199ADividends?: number;
  /* Qualified PTP income (partnership statements only). */
  qualifiedPtpIncome?: number;
}

/* Part I: the entity, common to the three forms. */
interface K1Entity {
  /* The entity's name as Part I prints it. */
  entityName: string;
  /* The entity's EIN (Part I item A). */
  entityEin: string;
  /* The "Final K-1" box at the top (irs-1041k1-inst-2025::sec::specific-instructions::b01). */
  finalK1?: boolean;
  /* The "Amended K-1" box at the top. */
  amendedK1?: boolean;
  /* Part III: the amounts, in the order printed. */
  boxes: K1Box[];
  /* The section 199A statement, when the K-1 has one; more than one trade or business is not modeled. */
  section199A?: Section199AStatement;
}

/* Schedule K-1 (Form 1120-S): a shareholder's share. */
export interface SCorporationK1FactValue extends K1Entity {
  form: "1120-S";
  /* Part II item G: the current year allocation percentage. */
  allocationPercent?: number;
  /* Part II item H: the shareholder's number of shares, beginning and end of the year. */
  sharesAtStart?: number;
  sharesAtEnd?: number;
  /* Part II item I: loans from the shareholder, beginning and end of the year. */
  loansAtStart?: number;
  loansAtEnd?: number;
  /* Box 14: Schedule K-3 is attached (irs-1120sk1-inst-2025::sec::box-14-international-transactions::b01). */
  scheduleK3Attached?: boolean;
  /* Box 18: more than one activity for at-risk purposes (::box-18-more-than-one-activity-for-at-risk). */
  moreThanOneAtRiskActivity?: boolean;
  /* Box 19: more than one activity for passive activity purposes (::box-19-more-than-one-activity-for-passive). */
  moreThanOnePassiveActivity?: boolean;
}

/* Schedule K-1 (Form 1065) Part II item K1: the partner's share of liabilities, at the end of the year. */
export interface PartnerLiabilities {
  nonrecourse?: number;
  qualifiedNonrecourseFinancing?: number;
  recourse?: number;
}

/* Item L: the partner's capital account, tax basis method (irs-1065k1-inst-2025::sec::item-l::b01). */
export interface PartnerCapitalAccount {
  beginning?: number;
  contributed?: number;
  currentYearNetIncome?: number;
  otherIncreaseOrDecrease?: number;
  withdrawalsAndDistributions?: number;
  ending?: number;
}

/* Schedule K-1 (Form 1065): a partner's share. */
export interface PartnershipK1FactValue extends K1Entity {
  form: "1065";
  /* Part I item D: a publicly traded partnership (irs-1065k1-inst-2025::sec::specific-instructions::b01). */
  publiclyTraded?: boolean;
  /* The partnership is a foreign partnership (Schedule E line 28 column (c)). */
  foreignPartnership?: boolean;
  /* Part II item G: general partner or LLC member-manager, or limited partner or other LLC member. */
  partnerType?: "general" | "limited";
  /* Item J: profit, loss and capital shares at the end of the year, in percent (::item-j::b01). */
  profitPercent?: number;
  lossPercent?: number;
  capitalPercent?: number;
  /* Item J: the interest decreased by a sale or an exchange this year (::item-j::b01). */
  decreasedBySale?: boolean;
  decreasedByExchange?: boolean;
  /*
   * Item K1, at the beginning and the end of the year (::item-k1::b01): the
   * Partner's Basis Worksheet lines 3b and 3a (irs-1065k1-inst-2025::sec::line-3a::b01,
   * ::line-3b::b01). Both absent: the K-1 shows no share of liabilities.
   */
  liabilitiesAtStart?: PartnerLiabilities;
  liabilitiesAtEnd?: PartnerLiabilities;
  /* Item K3: the partner's share of liabilities is subject to guarantees (::item-k3::b01). */
  liabilitiesGuaranteed?: boolean;
  /* Item L. */
  capitalAccount?: PartnerCapitalAccount;
  /* Item M: contributed property with a built-in gain or loss (::item-m::b01). */
  contributedBuiltInGainProperty?: boolean;
  /* Item N: net unrecognized section 704(c) gain or loss, beginning and end (::item-n::b01). */
  section704cAtStart?: number;
  section704cAtEnd?: number;
  /* Box 16: Schedule K-3 is attached (::box-16-international-transactions). */
  scheduleK3Attached?: boolean;
  /* Box 22: more than one activity for at-risk purposes (::box-22-more-than-one-activity-for). */
  moreThanOneAtRiskActivity?: boolean;
  /* Box 23: more than one activity for passive activity purposes (::box-23-more-than-one-activity-for). */
  moreThanOnePassiveActivity?: boolean;
}

/*
 * The trustee's statement of the foreign-source income behind the foreign taxes
 * on a K-1 (Form 1041). The K-1 box gives only the tax; Form 1116 line 1a needs
 * the income and its qualified dividends (irs-1116-inst-2025::sec::qualified-dividends-and-capital-gain-tax::b02).
 * The election to claim the credit without Form 1116 does not need it. Amounts
 * in U.S. dollars, cents kept.
 */
export interface K1ForeignIncomeStatement {
  /* Gross income from foreign sources, its qualified dividends included. */
  grossIncome: number;
  /* The part of grossIncome that is qualified dividends. Absent: none. */
  qualifiedDividends?: number;
  /*
   * Form 1116 line i: the country the statement names, or "RIC" when the income
   * passed through from a mutual fund (irs-1116-inst-2025::sec::specific-instructions::b02).
   * Absent: no column has a country, and line i is a gap.
   */
  country?: string;
  /* The Part II column the tax goes in: (q) dividends or (s) interest. */
  incomeKind: "dividends" | "interest";
}

/* Schedule K-1 (Form 1041): a beneficiary's share. */
export interface TrustK1FactValue extends K1Entity {
  form: "1041";
  /* Item E: this is the final year of the estate or trust (irs-1041k1-inst-2025::sec::specific-instructions::b01). */
  finalYearOfEntity?: boolean;
  /* An estate (true) or a trust (false). */
  isEstate?: boolean;
  /* The statement behind the foreign taxes (box 14 code B), when the trustee gives one. */
  foreignIncome?: K1ForeignIncomeStatement;
}

export type K1FactValue = SCorporationK1FactValue | PartnershipK1FactValue | TrustK1FactValue;

export const K1_CATEGORY = "k1";

/* The key prefix of each form's K-1 fact. */
const K1_PREFIX: Record<K1Form, string> = {
  "1065": "k1.partnership.",
  "1120-S": "k1.s_corporation.",
  "1041": "k1.trust.",
};

/*
 * The key holds an id that Cade chooses once for the entity, so a corrected
 * K-1 updates the same fact. The holding fact for the entity uses the same id
 * (makeK1HoldingFactKey).
 */
export function makeSCorporationK1FactKey(entityId: string): string {
  return `${K1_PREFIX["1120-S"]}${entityId}`;
}

export function makePartnershipK1FactKey(entityId: string): string {
  return `${K1_PREFIX["1065"]}${entityId}`;
}

export function makeTrustK1FactKey(entityId: string): string {
  return `${K1_PREFIX["1041"]}${entityId}`;
}

/* The form whose key this is, or undefined for a key that is not a K-1. */
export function k1FormOfKey(key: string): K1Form | undefined {
  const forms = Object.keys(K1_PREFIX) as K1Form[];
  return forms.find((form) => {
    const prefix = K1_PREFIX[form];
    return (
      key.startsWith(prefix) && key.length > prefix.length && !key.includes(".", prefix.length)
    );
  });
}

export function isK1FactKey(key: string): boolean {
  return k1FormOfKey(key) !== undefined;
}

/* The entity id in a K-1 key: the part after the form's prefix. */
export function k1EntityIdOf(key: string): string | undefined {
  const form = k1FormOfKey(key);
  return form === undefined ? undefined : key.slice(K1_PREFIX[form].length);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isSignedAmount = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value);

const isOptionalSigned = (value: unknown): boolean => value === undefined || isSignedAmount(value);

const isOptionalAmount = (value: unknown): boolean =>
  value === undefined || (isSignedAmount(value) && (value as number) >= 0);

const isOptionalText = (value: unknown): boolean =>
  value === undefined || typeof value === "string";

const isOptionalBoolean = (value: unknown): boolean =>
  value === undefined || typeof value === "boolean";

const isBox = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.box === "string" &&
  value.box.length > 0 &&
  isOptionalText(value.code) &&
  isOptionalSigned(value.amount);

const isStatement = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    isOptionalSigned(value.qualifiedBusinessIncome) &&
    isOptionalText(value.businessName) &&
    isOptionalAmount(value.w2Wages) &&
    isOptionalAmount(value.qualifiedPropertyUbia) &&
    isOptionalBoolean(value.specifiedService) &&
    isOptionalSigned(value.section199ADividends) &&
    isOptionalSigned(value.qualifiedPtpIncome));

const isForeignIncome = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    isOptionalAmount(value.grossIncome) &&
    value.grossIncome !== undefined &&
    isOptionalAmount(value.qualifiedDividends) &&
    isOptionalText(value.country) &&
    (value.incomeKind === "dividends" || value.incomeKind === "interest"));

/* The fields every K-1 has, and its statements; the header answers each form adds are optional and not checked. */
function isK1(value: unknown, form: K1Form): value is K1FactValue {
  return (
    isRecord(value) &&
    value.form === form &&
    typeof value.entityName === "string" &&
    typeof value.entityEin === "string" &&
    Array.isArray(value.boxes) &&
    value.boxes.every(isBox) &&
    isOptionalBoolean(value.finalK1) &&
    isStatement(value.section199A) &&
    isForeignIncome(value.foreignIncome)
  );
}

/* Each K-1 fact whose fields have their types; a malformed one is left out and listed. */
export function readK1Facts(facts: ReadonlyArray<FactRow>): {
  k1s: Array<{ key: string; value: K1FactValue }>;
  malformedKeys: string[];
} {
  const rows = facts
    .filter((fact) => fact.category === K1_CATEGORY)
    .map((fact) => ({ ...fact, form: k1FormOfKey(fact.key) }))
    .filter((fact) => fact.form !== undefined);
  const wellFormed = (row: (typeof rows)[number]) => isK1(row.value, row.form as K1Form);
  return {
    k1s: rows.filter(wellFormed).map((row) => ({ key: row.key, value: row.value as K1FactValue })),
    malformedKeys: rows.filter((row) => !wellFormed(row)).map((row) => row.key),
  };
}
