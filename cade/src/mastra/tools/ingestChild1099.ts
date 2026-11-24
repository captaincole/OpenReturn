import { createTool } from "@mastra/core/tools";
import {
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  type ChildInvestmentIncomeFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type TaxFactRow,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { listFacts, listFactsByKeys, recordFacts, type TaxFact } from "../db/taxFacts";
import { cadeRequestContextSchema } from "../server/requestContext";
import type { IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/*
 * A child's Form 1099-INT or 1099-DIV (Form 8814, FTB 3803). The engine reads
 * one fact per child that holds the sum of the child's forms and the parents'
 * answers. Each form is also kept as printed, under a key the engine does not
 * read, and the child's fact is added up again from those forms. So a second
 * form adds to the first, and the same form read twice replaces itself.
 */

export type ChildForm = "1099-INT" | "1099-DIV";

const CATEGORY = "dependents";

const FORM_KEY_PART: Record<ChildForm, string> = {
  "1099-INT": "form_1099_int",
  "1099-DIV": "form_1099_div",
};

const childFormsKeyStart = (dependentSlug: string) => `dependent.${dependentSlug}.`;

/* One of the child's forms as printed: dependent.<child>.form_1099_int.<payer>. */
export const childFormFactKey = (dependentSlug: string, form: ChildForm, payerSlug: string) =>
  `${childFormsKeyStart(dependentSlug)}${FORM_KEY_PART[form]}.${payerSlug}`;

/* The form a key of this child's forms names; undefined for any other key. */
function childFormOf(dependentSlug: string, key: string): ChildForm | undefined {
  const start = childFormsKeyStart(dependentSlug);
  if (!key.startsWith(start)) return undefined;
  const [part, payerSlug, ...more] = key.slice(start.length).split(".");
  if (!payerSlug || more.length > 0) return undefined;
  return (Object.keys(FORM_KEY_PART) as ChildForm[]).find((form) => FORM_KEY_PART[form] === part);
}

/* The fields no form gives: the parents' answers. A rebuild keeps them. */
const ANSWER_FIELDS = [
  "estimatedTaxPaid",
  "hadOtherIncome",
  "californiaEstimatedTaxPaid",
  "taxExemptInterestTaxedByCalifornia",
  "alaskaPermanentFundDividends",
] as const;

type AnswerField = (typeof ANSWER_FIELDS)[number];
type AmountField = Exclude<keyof ChildInvestmentIncomeFactValue, AnswerField>;
type ChildAmounts = Partial<Record<AmountField, number>>;

const STATE = "CA";

/* State tax withheld counts when the form names California, or no state. */
const californiaWithholding = (form: InterestFactValue) =>
  form.box15 === undefined || form.box15.trim().toUpperCase() === STATE ? form.box17 : undefined;

export function interestAmounts(form: InterestFactValue): ChildAmounts {
  return {
    taxableInterest: addCents(form.box1, form.box3),
    usObligationInterest: form.box3,
    taxExemptInterest: form.box8,
    privateActivityBondInterest: form.box9,
    federalTaxWithheld: form.box4,
    stateTaxWithheld: californiaWithholding(form),
  };
}

export function dividendAmounts(form: DividendFactValue): ChildAmounts {
  return {
    ordinaryDividends: form.box1a,
    qualifiedDividends: form.box1b,
    capitalGainDistributions: form.box2a,
    unrecapturedSection1250Gain: form.box2b,
    collectiblesGain: form.box2d,
    federalTaxWithheld: form.box4,
    taxExemptInterest: form.box12,
    privateActivityBondInterest: form.box13,
  };
}

/* The boxes with an amount that the child's fact has no field for. */
const NOT_CARRIED: Record<ChildForm, string[]> = {
  "1099-INT": ["box2", "box5", "box6", "box10", "box11", "box12", "box13"],
  "1099-DIV": ["box3", "box5", "box6", "box7", "box9", "box10"],
};

export const boxesNotOnChildFact = (form: ChildForm, value: object): string[] =>
  Object.entries(value)
    .filter(([box, amount]) => NOT_CARRIED[form].includes(box) && amount)
    .map(([box]) => box);

/* A sum in cents, so 0.1 + 0.2 stays 0.3; undefined when no amount is a number. */
function addCents(...amounts: Array<number | undefined>): number | undefined {
  const numbers = amounts.filter((amount): amount is number => typeof amount === "number");
  if (numbers.length === 0) return undefined;
  return numbers.reduce((total, amount) => total + Math.round(amount * 100), 0) / 100;
}

function addAmounts(left: ChildAmounts, right: ChildAmounts): ChildAmounts {
  const fields = [...new Set([...Object.keys(left), ...Object.keys(right)])] as AmountField[];
  return Object.fromEntries(
    fields
      .map((field) => [field, addCents(left[field], right[field])] as const)
      .filter(([, amount]) => amount !== undefined),
  );
}

export interface ChildFormValue {
  form: ChildForm;
  value: InterestFactValue | DividendFactValue;
}

const amountsOf = ({ form, value }: ChildFormValue): ChildAmounts =>
  form === "1099-INT"
    ? interestAmounts(value as InterestFactValue)
    : dividendAmounts(value as DividendFactValue);

const answersOf = (previous: ChildInvestmentIncomeFactValue | undefined) =>
  Object.fromEntries(
    ANSWER_FIELDS.filter((field) => previous?.[field] !== undefined).map((field) => [
      field,
      previous?.[field],
    ]),
  ) as Pick<ChildInvestmentIncomeFactValue, AnswerField>;

/* The child's fact: the sum of every form, and the answers the last fact held. */
export function childIncomeOf(
  previous: ChildInvestmentIncomeFactValue | undefined,
  forms: ChildFormValue[],
): ChildInvestmentIncomeFactValue {
  return { ...forms.map(amountsOf).reduce(addAmounts, {}), ...answersOf(previous) };
}

/* The latest row of each key, from rows newest first. */
const latestByKey = (rows: TaxFactRow[]): TaxFactRow[] => [
  ...new Map([...rows].reverse().map((row) => [row.key, row])).values(),
];

async function childRows(ctx: IngestCtx, dependentSlug: string) {
  const rows = latestByKey(
    await listFacts(ctx.scope, { taxYear: ctx.year, category: CATEGORY, limit: 500 }),
  );
  const childKey = makeChildInvestmentIncomeFactKey(dependentSlug);
  const previous = rows.find((row) => row.key === childKey)?.value as
    ChildInvestmentIncomeFactValue | undefined;
  return { rows, previous };
}

async function requireDependent(ctx: IngestCtx, dependentSlug: string): Promise<void> {
  const key = makeDependentFactKey(dependentSlug);
  if ((await listFactsByKeys(ctx.scope, ctx.year, [key])).length > 0) return;
  throw new Error(
    `No dependent ${dependentSlug}: nothing was recorded. Record the child with record-dependent first, then pass the dependentId it returns as dependentSlug.`,
  );
}

const factRow = (ctx: IngestCtx, key: string, value: unknown): TaxFact => ({
  id: crypto.randomUUID(),
  userId: ctx.userId,
  filingId: ctx.filingId,
  taxYear: ctx.year,
  category: CATEGORY,
  key,
  value,
  sourceNote: ctx.sourceNote,
});

/* Records the form as printed and the child's fact added up again, in one transaction. */
export async function recordChildForm(
  ctx: IngestCtx,
  input: { dependentSlug: string; payerSlug: string } & ChildFormValue,
): Promise<{ factKey: string; boxesNotOnChildFact: string[] }> {
  await requireDependent(ctx, input.dependentSlug);
  const { rows, previous } = await childRows(ctx, input.dependentSlug);
  const formKey = childFormFactKey(input.dependentSlug, input.form, input.payerSlug);
  const forms = rows
    .filter((row) => row.key !== formKey)
    .flatMap((row) => {
      const form = childFormOf(input.dependentSlug, row.key);
      return form ? [{ form, value: row.value as ChildFormValue["value"] }] : [];
    });
  const factKey = makeChildInvestmentIncomeFactKey(input.dependentSlug);
  const income = childIncomeOf(previous, [...forms, { form: input.form, value: input.value }]);
  await recordFacts(ctx.scope, [factRow(ctx, formKey, input.value), factRow(ctx, factKey, income)]);
  return { factKey, boxesNotOnChildFact: boxesNotOnChildFact(input.form, input.value) };
}

export const dependentSlugField = z
  .string()
  .optional()
  .describe(
    "Only for a form whose recipient is the user's dependent child (Form 8814): the dependentId record-dependent returned for the child. The form then goes on the child's investment income, not the user's. Leave it out for the user's or spouse's own form.",
  );

export const recordChildInvestmentAnswers = createTool({
  id: "record-child-investment-answers",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Record the parents' answers for a child's interest and dividends (Form 8814, FTB 3803). Pass only the answers the user gave; the child's amounts from the 1099s stay.",
  inputSchema: z.object({
    year: z.number().int(),
    dependentSlug: z.string().describe("The dependentId record-dependent returned for the child"),
    hadOtherIncome: z
      .boolean()
      .optional()
      .describe("The child had income other than interest and dividends (wages, for example)"),
    estimatedTaxPaid: z
      .boolean()
      .optional()
      .describe("Federal estimated tax was paid for 2025 under the child's name and SSN"),
    californiaEstimatedTaxPaid: z
      .boolean()
      .optional()
      .describe("California estimated tax was paid for 2025 under the child's name"),
    taxExemptInterestTaxedByCalifornia: z
      .number()
      .optional()
      .describe(
        "The part of the child's tax-exempt interest that California taxes: interest on another state's bonds",
      ),
    sourceNote: z.string().default("Answers stated by the user"),
  }),
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, sourceNote, dependentSlug, ...answers } = input;
    const ctx: IngestCtx = { scope, userId, filingId, year, sourceNote };
    await requireDependent(ctx, dependentSlug);
    const { previous } = await childRows(ctx, dependentSlug);
    const factKey = makeChildInvestmentIncomeFactKey(dependentSlug);
    await recordFacts(scope, [factRow(ctx, factKey, { ...previous, ...answers })]);
    return { factKey };
  },
});
