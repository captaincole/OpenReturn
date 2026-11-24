import { createTool } from "@mastra/core/tools";
import {
  K1_CATEGORY,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeSCorporationK1FactKey,
  makeTrustK1FactKey,
  type K1Box,
  type K1FactValue,
  type K1Form,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { ingestScheduleK1Input, type IngestScheduleK1Input } from "./ingestScheduleK1Schema";
import { recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

const BOX_WORD = "box";

/* "Box 4A " as printed is the box tables' "4a". */
export function boxLabelOf(printed: string): string {
  const text = printed.trim().toLowerCase();
  return text.startsWith(BOX_WORD) ? text.slice(BOX_WORD.length).trim() : text;
}

/* " zz" is "ZZ"; an empty code is no code. */
export function boxCodeOf(printed: string | undefined): string | undefined {
  const code = printed?.trim().toUpperCase();
  return code ? code : undefined;
}

/* One box as the fact holds it: the label and code in the tables' spelling, the amount untouched. */
function printedBox(box: IngestScheduleK1Input["boxes"][number]): K1Box {
  const code = boxCodeOf(box.code);
  return {
    box: boxLabelOf(box.box),
    ...(code === undefined ? {} : { code }),
    ...(box.amount === undefined ? {} : { amount: box.amount }),
  };
}

/* The input's object for each form's own items. */
const PART_OF_FORM: Record<K1Form, "sCorporation" | "partnership" | "trust"> = {
  "1120-S": "sCorporation",
  "1065": "partnership",
  "1041": "trust",
};

const KEY_OF_FORM: Record<K1Form, (entityId: string) => string> = {
  "1120-S": makeSCorporationK1FactKey,
  "1065": makePartnershipK1FactKey,
  "1041": makeTrustK1FactKey,
};

/* The objects of the other two forms that the call filled: a sign the form is wrong. */
export function otherFormParts(input: IngestScheduleK1Input): string[] {
  return Object.values(PART_OF_FORM).filter(
    (part) => part !== PART_OF_FORM[input.form] && input[part] !== undefined,
  );
}

/* The fact value: the entity, the boxes as printed and the form's own items. */
function k1ValueOf(input: IngestScheduleK1Input): K1FactValue {
  const entity = {
    entityName: input.entityName,
    entityEin: input.entityEin,
    ...(input.finalK1 === undefined ? {} : { finalK1: input.finalK1 }),
    ...(input.amendedK1 === undefined ? {} : { amendedK1: input.amendedK1 }),
    boxes: input.boxes.map(printedBox),
    ...(input.section199A === undefined ? {} : { section199A: input.section199A }),
  };
  switch (input.form) {
    case "1120-S":
      return { form: "1120-S", ...entity, ...input.sCorporation };
    case "1065":
      return { form: "1065", ...entity, ...input.partnership };
    case "1041":
      return { form: "1041", ...entity, ...input.trust };
  }
}

/* The entity id, the fact key and the value one call records. */
export function k1FactOf(input: IngestScheduleK1Input): {
  entityId: string;
  key: string;
  value: K1FactValue;
} {
  const entityId = input.entityId || slugify(input.entityName) || "entity";
  return { entityId, key: KEY_OF_FORM[input.form](entityId), value: k1ValueOf(input) };
}

export const ingestScheduleK1 = createTool({
  id: "ingest-schedule-k1",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Schedule K-1: from an S corporation (Form 1120-S), a partnership (Form 1065) or an estate or trust (Form 1041). Call ONCE per K-1. Copy Part I, Part II and every Part III box as printed, one entry per box and code; never add, net or move amounts. Fill only the object for the K-1's form (sCorporation, partnership or trust). Writes one fact under category 'k1'. Returns the entityId and the holdingKey: the owner's answers go to record-k1-holding with the same entityId.",
  inputSchema: ingestScheduleK1Input,
  outputSchema: z.object({ factKey: z.string(), entityId: z.string(), holdingKey: z.string() }),
  execute: async (input, context) => {
    const others = otherFormParts(input);
    if (others.length > 0) {
      throw new Error(
        `A Form ${input.form} K-1 fills only '${PART_OF_FORM[input.form]}'; this call also filled ${others.join(", ")}. Nothing was recorded: check the form and call again.`,
      );
    }
    const { scope, userId, filingId } = await requireUserContext(context);
    const { entityId, key, value } = k1FactOf(input);
    const sourceNote =
      input.sourceNote ?? `Schedule K-1 (Form ${input.form}) from ${input.entityName}`;
    await recordIngestFact(
      { scope, userId, filingId, year: input.year, sourceNote },
      K1_CATEGORY,
      key,
      value,
    );
    return { factKey: key, entityId, holdingKey: makeK1HoldingFactKey(entityId) };
  },
});
