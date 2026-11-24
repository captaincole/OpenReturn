import { createTool } from "@mastra/core/tools";
import {
  makeHsaDistributionFactKey,
  type HsaDistributionFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { PayerSchema, recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/*
 * "Paid qualified medical expenses" is a verbal fact (hsa.distributions_all_qualified).
 * Form 5498-SA is not needed: W-2 box 12 code W carries employer contributions.
 */

const ACCOUNT_TYPES = ["HSA", "Archer MSA", "MA MSA"] as const;

export const form1099SAInput = z.object({
  year: z.number().int(),
  payer: PayerSchema.extend({
    tin: z.string().optional().describe("Payer's TIN printed on the form"),
  }),
  owner: z
    .enum(["taxpayer", "spouse"])
    .optional()
    .describe("Whose account it is, from the recipient's name. Omit for the taxpayer."),
  accountNumber: z.string().optional(),
  accountSlug: z
    .string()
    .optional()
    .describe("Stable slug for this account. Defaults to slugified payer name."),
  distributionId: z
    .string()
    .optional()
    .describe("Stable id for this form. Defaults to the owner, account type and code."),
  box1: z.number().describe("Gross distribution"),
  box2: z.number().optional().describe("Earnings on excess contributions"),
  box3: z.string().describe("Distribution code, e.g. '1' (normal distribution)"),
  box4: z.number().optional().describe("FMV on date of death"),
  box5: z.enum(ACCOUNT_TYPES).describe("Account type checkbox"),
  sourceNote: z.string().default("Form 1099-SA ingested via structured payload"),
});

export type Form1099SAInput = z.input<typeof form1099SAInput>;

/*
 * "code-1" for the taxpayer's HSA, as before. A spouse's form and an MSA form
 * get their own prefix, so two accounts at one custodian do not share a key.
 */
export function distributionIdOf(form: Pick<Form1099SAInput, "owner" | "box3" | "box5">): string {
  const ownerPart = form.owner === "spouse" ? "spouse" : "";
  const typePart = form.box5 === "HSA" ? "" : slugify(form.box5);
  return [ownerPart, typePart, `code-${slugify(form.box3)}`].filter((part) => part).join("-");
}

const withoutBlanks = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

const tinSlug = (tin: string | undefined) => (tin ? `tin-${tin.split("-").join("")}` : "payer");

export function form1099SAFact(input: Form1099SAInput): {
  key: string;
  value: HsaDistributionFactValue;
} {
  const slug = input.accountSlug || slugify(input.payer.name) || tinSlug(input.payer.tin);
  const value = withoutBlanks<HsaDistributionFactValue>({
    payerName: input.payer.name,
    payerTin: input.payer.tin,
    box1: input.box1,
    box2: input.box2,
    box3: input.box3,
    box4: input.box4,
    box5: input.box5,
    owner: input.owner,
  });
  const key = makeHsaDistributionFactKey(slug, input.distributionId || distributionIdOf(input));
  return { key, value };
}

export const ingest1099SA = createTool({
  id: "ingest-1099-sa",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1099-SA (HSA, Archer MSA or Medicare Advantage MSA distribution). Call ONCE per form. Writes one fact under category 'hsa'. On a joint return, set owner from the recipient's name. Then ask the user whether every distribution paid qualified medical expenses, if not yet known.",
  inputSchema: form1099SAInput,
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const ctx: IngestCtx = {
      scope,
      userId,
      filingId,
      year: input.year,
      sourceNote: input.sourceNote,
    };
    const { key, value } = form1099SAFact(input);
    await recordIngestFact(ctx, "hsa", key, value);
    return { factKey: key };
  },
});
