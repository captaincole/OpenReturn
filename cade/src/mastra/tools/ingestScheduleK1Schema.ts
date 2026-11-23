import type {
  K1FactValue,
  PartnerCapitalAccount,
  PartnerLiabilities,
  PartnershipK1FactValue,
  SCorporationK1FactValue,
  Section199AStatement,
  TrustK1FactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";

/*
 * The input schema of ingest-schedule-k1: the parts of a Schedule K-1 as
 * printed. One schema serves the three forms. The fields every K-1 has sit at
 * the top; each form's own Part I and Part II items sit in one object named
 * for the form. Each object is typed against the engine's fact, so a field the
 * fact adds or drops fails to compile here.
 */

const amount = z.number().nonnegative();
const signed = z.number();
const percent = z.number().nonnegative();

/* The fields of one form's fact that the other two forms do not have. */
type OwnFields<T> = Exclude<keyof T, keyof K1FactValue>;
type PartShape<T> = { [K in OwnFields<T>]-?: z.ZodType<T[K]> };

export const boxSchema = z.object({
  box: z.string().describe("The box as printed, without the word Box: '1', '4a', '8a', '17'"),
  code: z
    .string()
    .optional()
    .describe("The code where the box has codes: 'A', 'V', 'ZZ'. Leave it out for a box with none"),
  amount: signed
    .optional()
    .describe(
      "The amount, signed: a loss (printed in parentheses or with a minus) is negative. Leave it out when the box prints only STMT",
    ),
});

const section199A: { [K in keyof Section199AStatement]-?: z.ZodType<Section199AStatement[K]> } = {
  businessName: z.string().optional().describe("The trade or business the statement names"),
  qualifiedBusinessIncome: signed.optional().describe("QBI or qualified business loss, signed"),
  w2Wages: amount.optional().describe("W-2 wages"),
  qualifiedPropertyUbia: amount.optional().describe("UBIA of qualified property"),
  specifiedService: z
    .boolean()
    .optional()
    .describe("The statement marks it a specified service trade or business (SSTB)"),
  section199ADividends: signed.optional().describe("Section 199A dividends (qualified REIT)"),
  qualifiedPtpIncome: signed.optional().describe("Qualified PTP income (a partnership only)"),
};

const sCorporation: PartShape<SCorporationK1FactValue> = {
  allocationPercent: percent
    .optional()
    .describe("Part II item G: the current year allocation percentage, 100 for 100%"),
  sharesAtStart: amount.optional().describe("Part II item H: shares at the beginning of the year"),
  sharesAtEnd: amount.optional().describe("Part II item H: shares at the end of the year"),
  loansAtStart: amount
    .optional()
    .describe("Part II item I: loans from the shareholder, beginning of the year"),
  loansAtEnd: amount.optional().describe("Part II item I: loans from the shareholder, end of year"),
  scheduleK3Attached: z.boolean().optional().describe("Box 14: Schedule K-3 is attached"),
  moreThanOneAtRiskActivity: z
    .boolean()
    .optional()
    .describe("Box 18: more than one activity for at-risk purposes"),
  moreThanOnePassiveActivity: z
    .boolean()
    .optional()
    .describe("Box 19: more than one activity for passive activity purposes"),
};

const liabilities: { [K in keyof PartnerLiabilities]-?: z.ZodType<PartnerLiabilities[K]> } = {
  nonrecourse: amount.optional(),
  qualifiedNonrecourseFinancing: amount.optional(),
  recourse: amount.optional(),
};

const capitalAccount: {
  [K in keyof PartnerCapitalAccount]-?: z.ZodType<PartnerCapitalAccount[K]>;
} = {
  beginning: signed.optional().describe("Beginning capital account"),
  contributed: amount.optional().describe("Capital contributed during the year"),
  currentYearNetIncome: signed.optional().describe("Current year net income (loss), signed"),
  otherIncreaseOrDecrease: signed.optional().describe("Other increase (decrease), signed"),
  withdrawalsAndDistributions: amount.optional().describe("Withdrawals and distributions"),
  ending: signed.optional().describe("Ending capital account"),
};

const partnership: PartShape<PartnershipK1FactValue> = {
  publiclyTraded: z
    .boolean()
    .optional()
    .describe("Part I item D: checked, a publicly traded partnership (PTP)"),
  foreignPartnership: z.boolean().optional().describe("The partnership is a foreign partnership"),
  partnerType: z
    .enum(["general", "limited"])
    .optional()
    .describe(
      "Part II item G: general partner or LLC member-manager (general), or limited partner or other LLC member (limited)",
    ),
  profitPercent: percent.optional().describe("Item J: profit share at the end of the year, %"),
  lossPercent: percent.optional().describe("Item J: loss share at the end of the year, %"),
  capitalPercent: percent.optional().describe("Item J: capital share at the end of the year, %"),
  decreasedBySale: z.boolean().optional().describe("Item J: checked, decrease due to sale"),
  decreasedByExchange: z
    .boolean()
    .optional()
    .describe("Item J: checked, decrease due to exchange of partnership interest"),
  liabilitiesAtEnd: z
    .object(liabilities)
    .optional()
    .describe("Item K1: the partner's share of liabilities, the Ending column"),
  liabilitiesGuaranteed: z
    .boolean()
    .optional()
    .describe("Item K3: checked, liabilities subject to guarantees or other payment obligations"),
  capitalAccount: z.object(capitalAccount).optional().describe("Item L: the capital account"),
  contributedBuiltInGainProperty: z
    .boolean()
    .optional()
    .describe("Item M: Yes, the partner contributed property with a built-in gain or loss"),
  section704cAtStart: signed.optional().describe("Item N: section 704(c) gain (loss), beginning"),
  section704cAtEnd: signed.optional().describe("Item N: section 704(c) gain (loss), ending"),
  scheduleK3Attached: z.boolean().optional().describe("Box 16: Schedule K-3 is attached"),
  moreThanOneAtRiskActivity: z
    .boolean()
    .optional()
    .describe("Box 22: more than one activity for at-risk purposes"),
  moreThanOnePassiveActivity: z
    .boolean()
    .optional()
    .describe("Box 23: more than one activity for passive activity purposes"),
};

const trust: PartShape<TrustK1FactValue> = {
  finalYearOfEntity: z
    .boolean()
    .optional()
    .describe("Part I item E: checked, this is the final Form 1041 for the estate or trust"),
  isEstate: z
    .boolean()
    .optional()
    .describe("True when the entity is an estate, false when it is a trust"),
};

export const ingestScheduleK1Input = z.object({
  year: z.number().int(),
  form: z
    .enum(["1120-S", "1065", "1041"])
    .describe(
      "The form the K-1 is for: 1120-S (S corporation), 1065 (partnership), 1041 (estate or trust)",
    ),
  entityId: z
    .string()
    .optional()
    .describe(
      "A short stable id for the entity, such as 'kore-springs-stables'. Defaults to the slugified name. Pass the same id to correct this K-1 and to record-k1-holding.",
    ),
  entityName: z.string().describe("Part I: the entity's name as printed"),
  entityEin: z.string().describe("Part I item A: the entity's EIN"),
  finalK1: z.boolean().optional().describe("The Final K-1 box at the top is checked"),
  amendedK1: z.boolean().optional().describe("The Amended K-1 box at the top is checked"),
  boxes: z
    .array(boxSchema)
    .describe(
      "Part III: every amount, in the order printed, one entry per box and code. A box with several codes has one entry per code. Do not add, net or move amounts",
    ),
  section199A: z
    .object(section199A)
    .optional()
    .describe(
      "The section 199A statement (1120-S box 17 code V, 1065 box 20 code Z, 1041 box 14 code I), as printed",
    ),
  sCorporation: z
    .object(sCorporation)
    .optional()
    .describe("Form 1120-S only: Part II items G to I and the box 14, 18 and 19 checkboxes"),
  partnership: z
    .object(partnership)
    .optional()
    .describe("Form 1065 only: Part I item D and Part II items G to N, boxes 16, 22 and 23"),
  trust: z.object(trust).optional().describe("Form 1041 only: Part I item E, estate or trust"),
  sourceNote: z.string().optional(),
});

export type IngestScheduleK1Input = z.infer<typeof ingestScheduleK1Input>;
