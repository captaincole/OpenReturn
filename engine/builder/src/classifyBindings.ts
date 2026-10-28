/*
 * The bulky context is one cache-controlled block, so each batch after the
 * first pays only for its own field list. Three batches in flight keep long
 * forms under the rate limit.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { FieldInventory } from "@openreturn/engine/catalog";
import { formatIndexedForm, loadCatalogIndex, type CatalogIndex } from "./catalogIndex.js";
import { BINDING_TOOLS, SYSTEM_PROMPT } from "./classifyBindingsPrompt.js";
import type { RetrievedFieldContext } from "./retrieveContext.js";

/*
 * FORMS_PIPELINE_MODEL overrides the model (e.g. Haiku for a cheap draft).
 * Read at call time: the CLI loads its env files after the imports run.
 */
const model = () => process.env.FORMS_PIPELINE_MODEL ?? "claude-opus-5-5";
const MAX_TOKENS = 16000;
const FIELDS_PER_BATCH = 10;
const CONCURRENCY = 3;
/* Bounds runaway lookup loops; real batches use 1-2. */
const MAX_LOOKUPS_PER_BATCH = 5;

export type RuleName =
  | "lookupFact"
  | "sumFacts"
  | "tableLookupByDecision"
  | "lookupDecision"
  | "decisionIfEquals"
  | "fromFields"
  | "constant"
  | "bracketLookup"
  | "taxTable"
  | "unsupported";

export type Confidence = "high" | "medium" | "low";

export interface ClassifiedBinding {
  fieldId: string;
  ruleName: RuleName;
  params: Record<string, unknown>;
  rationale: string;
  confidence: Confidence;
}

export interface BindingClassificationResult {
  bindings: ClassifiedBinding[];
  mustFile: {
    decisionKey: string;
    rationale: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
}

export interface ClassifyBindingsOpts {
  formId: string;
  taxYear: number;
  jurisdiction: string;
  formTitle: string;
  fields: FieldInventory[];
  retrievedContext?: RetrievedFieldContext[];
}

export async function classifyBindings(
  opts: ClassifyBindingsOpts,
  onBatchComplete?: (batchIndex: number, totalBatches: number, batchSize: number) => void,
): Promise<BindingClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey });

  const catalogIndex = await loadCatalogIndex(opts.formId);
  console.log(
    `[classify-bindings] catalog index: ${catalogIndex.size} other form(s) available — ${Array.from(catalogIndex.keys()).join(", ") || "(none)"}`,
  );

  const inventoryBlock = buildInventoryBlock(opts, catalogIndex);

  const contextByFieldId = new Map<string, RetrievedFieldContext>();
  for (const c of opts.retrievedContext ?? []) {
    contextByFieldId.set(c.fieldId, c);
  }

  const batches: FieldInventory[][] = [];
  for (let i = 0; i < opts.fields.length; i += FIELDS_PER_BATCH) {
    batches.push(opts.fields.slice(i, i + FIELDS_PER_BATCH));
  }

  const result = await runBatchPool(
    { client, opts, inventoryBlock, contextByFieldId, catalogIndex },
    batches,
    onBatchComplete,
  );

  /* A missing must-file binding must not discard the paid run: use the naming convention. */
  const mustFile = result.mustFile ?? {
    decisionKey: `decisions.scope.must_file_${opts.formId.replace(/^form-/, "").replace(/-/g, "_")}`,
    rationale: "Classifier returned no must-file binding; defaulted to the naming convention.",
  };
  if (!result.mustFile) {
    console.warn(
      `[classify-bindings] no must-file binding returned; using ${mustFile.decisionKey}`,
    );
  }

  return {
    bindings: result.bindings,
    mustFile,
    usage: result.usage,
  };
}

interface BatchPoolCtx {
  client: Anthropic;
  opts: ClassifyBindingsOpts;
  inventoryBlock: string;
  contextByFieldId: Map<string, RetrievedFieldContext>;
  catalogIndex: CatalogIndex;
}

async function runBatchPool(
  ctx: BatchPoolCtx,
  batches: FieldInventory[][],
  onBatchComplete?: (batchIndex: number, totalBatches: number, batchSize: number) => void,
): Promise<SingleBatchResult> {
  const usage = zeroUsage();
  const allBindings: ClassifiedBinding[] = [];
  let mustFile: BindingClassificationResult["mustFile"] | null = null;

  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= batches.length) return;
      const batch = batches[i];
      const result = await classifyOneBatch(
        ctx.client,
        ctx.opts,
        ctx.inventoryBlock,
        batch,
        i,
        batches.length,
        ctx.contextByFieldId,
        ctx.catalogIndex,
      );
      for (const b of result.bindings) allBindings.push(b);
      if (result.mustFile && !mustFile) mustFile = result.mustFile;
      addUsage(usage, result.usage);
      onBatchComplete?.(i, batches.length, batch.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, () => worker()));

  return { bindings: allBindings, mustFile, usage };
}

interface SingleBatchResult {
  bindings: ClassifiedBinding[];
  mustFile: BindingClassificationResult["mustFile"] | null;
  usage: BindingClassificationResult["usage"];
}

interface EmitPayload {
  bindings: Array<{
    field_id: string;
    rule_name: RuleName;
    params: Record<string, unknown>;
    rationale: string;
    confidence?: Confidence;
  }>;
  must_file: { decision_key: string; rationale: string } | null;
}

type Usage = BindingClassificationResult["usage"];

const zeroUsage = (): Usage => ({
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
});

function addUsage(
  total: Usage,
  u: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  },
): void {
  total.input_tokens += u.input_tokens;
  total.output_tokens += u.output_tokens;
  total.cache_creation_input_tokens += u.cache_creation_input_tokens ?? 0;
  total.cache_read_input_tokens += u.cache_read_input_tokens ?? 0;
}

async function classifyOneBatch(
  client: Anthropic,
  opts: ClassifyBindingsOpts,
  inventoryBlock: string,
  batch: FieldInventory[],
  batchIndex: number,
  totalBatches: number,
  contextByFieldId: Map<string, RetrievedFieldContext>,
  catalogIndex: CatalogIndex,
): Promise<SingleBatchResult> {
  const fieldsTable = batch
    .map((f, i) => renderFieldEntry(i + 1, f, contextByFieldId.get(f.fieldId)))
    .join("\n\n");

  const userText = `Form: ${opts.formTitle} (${opts.formId}, tax year ${opts.taxYear}, jurisdiction ${opts.jurisdiction})

Batch ${batchIndex + 1} of ${totalBatches} — bind these ${batch.length} field(s):
${fieldsTable}

For each field, emit a binding via the emit_bindings tool. ${batchIndex === 0 ? "Also include the must-file binding for this form (the decisionKey that determines whether the form is filed at all)." : "The must-file binding has already been recorded in an earlier batch — omit it here."}

If any field references a different form (e.g. "from Form 1040 line 11b"), call lookup_form_fields with that formId BEFORE emitting the binding — you need the exact fieldId, not a guess.`;

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: inventoryBlock,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: userText },
      ],
    },
  ];

  const { payload, usage } = await runBindingConversation(
    client,
    messages,
    catalogIndex,
    `${batchIndex + 1}/${totalBatches}`,
  );

  return {
    bindings: toClassifiedBindings(payload.bindings),
    mustFile: payload.must_file
      ? {
          decisionKey: payload.must_file.decision_key,
          rationale: payload.must_file.rationale,
        }
      : null,
    usage,
  };
}

/*
 * The 5.5 models reject a forced tool_choice. So after the lookup budget,
 * a lookup gets an error that says to call emit_bindings; a second one fails the batch.
 */
async function runBindingConversation(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  catalogIndex: CatalogIndex,
  batchLabel: string,
): Promise<{ payload: EmitPayload; usage: Usage }> {
  const usage = zeroUsage();
  let lookups = 0;
  let overBudgetTurns = 0;

  while (true) {
    const response = await client.messages.create({
      model: model(),
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: BINDING_TOOLS,
      tool_choice: { type: "auto" },
      messages,
    });
    addUsage(usage, response.usage);

    const toolUses = response.content.filter(
      (c): c is Anthropic.ToolUseBlock => c.type === "tool_use",
    );
    if (toolUses.length === 0) {
      throw new Error(
        `Batch ${batchLabel}: no tool_use in response; stop_reason=${response.stop_reason}`,
      );
    }

    const emit = toolUses.find((t) => t.name === "emit_bindings");
    if (emit) {
      return { payload: parseEmitPayload(emit, batchLabel, response.stop_reason), usage };
    }

    messages.push({ role: "assistant", content: response.content });
    if (lookups >= MAX_LOOKUPS_PER_BATCH) {
      if (overBudgetTurns++ > 0) {
        throw new Error(`Batch ${batchLabel}: kept calling lookups after the budget was spent.`);
      }
      messages.push({ role: "user", content: budgetSpentResults(toolUses) });
      continue;
    }
    const { toolResults, lookupCount } = executeLookups(toolUses, catalogIndex);
    lookups += lookupCount;
    messages.push({ role: "user", content: toolResults });
  }
}

function parseEmitPayload(
  emit: Anthropic.ToolUseBlock,
  batchLabel: string,
  stopReason: unknown,
): EmitPayload {
  const raw = emit.input as {
    bindings?: EmitPayload["bindings"];
    must_file?: { decision_key: string; rationale: string };
  };
  if (!raw?.bindings || !Array.isArray(raw.bindings)) {
    throw new Error(
      `Batch ${batchLabel}: emit_bindings missing bindings array. stop_reason=${stopReason}.`,
    );
  }
  return { bindings: raw.bindings, must_file: raw.must_file ?? null };
}

function budgetSpentResults(toolUses: Anthropic.ToolUseBlock[]): Anthropic.ToolResultBlockParam[] {
  return toolUses.map((tu) => ({
    type: "tool_result",
    tool_use_id: tu.id,
    content: `Lookup budget spent (${MAX_LOOKUPS_PER_BATCH}). Do not look up more forms. Call emit_bindings now; use \`unsupported\` for any field you could not resolve.`,
    is_error: true,
  }));
}

function executeLookups(
  toolUses: Anthropic.ToolUseBlock[],
  catalogIndex: CatalogIndex,
): { toolResults: Anthropic.ToolResultBlockParam[]; lookupCount: number } {
  const toolResults: Anthropic.ToolResultBlockParam[] = [];
  let lookupCount = 0;
  for (const tu of toolUses) {
    if (tu.name !== "lookup_form_fields") {
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: `Unknown tool: ${tu.name}`,
        is_error: true,
      });
      continue;
    }
    const input = tu.input as { formId?: string };
    if (!input.formId || typeof input.formId !== "string") {
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: "lookup_form_fields: missing or invalid `formId` arg.",
        is_error: true,
      });
      continue;
    }
    const indexed = catalogIndex.get(input.formId);
    if (!indexed) {
      const known = Array.from(catalogIndex.keys()).sort();
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: `No catalog found for "${input.formId}". Known formIds: ${known.length > 0 ? known.join(", ") : "(none)"}. If you need a binding that references this form, use \`unsupported\` with a rationale naming the missing form.`,
      });
      continue;
    }
    toolResults.push({
      type: "tool_result",
      tool_use_id: tu.id,
      content: formatIndexedForm(indexed),
    });
    lookupCount++;
  }
  return { toolResults, lookupCount };
}

function toClassifiedBindings(raw: EmitPayload["bindings"]): ClassifiedBinding[] {
  return raw.map((b) => ({
    fieldId: b.field_id,
    ruleName: b.rule_name,
    params: b.params,
    /* The AI sometimes omits this despite the schema; one gap must not fail the whole run. */
    rationale: b.rationale ?? `(no rationale provided — rule=${b.rule_name})`,
    /* Unrated means "low", so a human reviews it. */
    confidence: b.confidence ?? "low",
  }));
}

/* Trimmed blocks keep a 10-field batch inside the uncached token budget. */
const MAX_BLOCK_CHARS = 800;
function renderFieldEntry(
  ordinal: number,
  field: FieldInventory,
  context: RetrievedFieldContext | undefined,
): string {
  const header = `${ordinal}. ${field.fieldId} — "${field.label}" (category=${field.category}, valueType=${field.valueType})`;
  if (!context || context.blocks.length === 0) return header;
  const blockLines = context.blocks
    .map((b) => {
      const text = b.text.replace(/\s+/g, " ").trim();
      const trimmed = text.length > MAX_BLOCK_CHARS ? text.slice(0, MAX_BLOCK_CHARS) + "…" : text;
      return `     [${b.blockId}] ${trimmed}`;
    })
    .join("\n");
  return `${header}\n   IRS context:\n${blockLines}`;
}

function buildInventoryBlock(opts: ClassifyBindingsOpts, catalogIndex: CatalogIndex): string {
  const lines = opts.fields.map(
    (f) => `  ${f.fieldId} — "${f.label}" (category=${f.category}, valueType=${f.valueType})`,
  );
  const otherForms = Array.from(catalogIndex.values()).map(
    (f) => `  - ${f.formId} — ${f.title} (${f.jurisdiction}, ${f.fields.length} fields)`,
  );
  const otherFormsBlock =
    otherForms.length > 0
      ? `Other ingested forms you may reference via lookup_form_fields (do not guess their fieldIds — call the tool to fetch them):
${otherForms.join("\n")}`
      : `No other forms are ingested yet. Any cross-form reference must bind to \`unsupported\` with a rationale naming the missing form.`;
  return `Form being bound: ${opts.formTitle} (${opts.formId}, tax year ${opts.taxYear})

${otherFormsBlock}

Full field inventory of THIS form (${opts.fields.length} fields — use these fieldIds for any same-form fromFields references):
${lines.join("\n")}`;
}
