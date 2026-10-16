/*
 * Phase D — per-field binding classification.
 *
 * For each form field in the catalog, pick a rule from our library and
 * emit its params plus a self-rated confidence. renderBindings translates
 * the classifier's structured output into typed defineForm-shape
 * TypeScript in the form's bindings.ts file. Low-confidence entries route
 * to a `todos` map for human review.
 *
 * Batched at 10 fields per Claude call. The bulky context (rule-library
 * spec, full field inventory, available facts/decisions schema) is sent
 * as a cache-controlled content block. Every batch after the first hits
 * the prompt cache and only pays for the per-batch field list and the
 * tool response. A concurrency cap (3 in flight) smooths the TPM curve so
 * long forms do not burst-fail rate limits.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { FieldInventory } from "../engine/catalog.js";
import { formatIndexedForm, loadCatalogIndex, type CatalogIndex } from "./catalogIndex.js";
import { BINDING_TOOLS, SYSTEM_PROMPT } from "./classifyBindingsPrompt.js";
import type { RetrievedFieldContext } from "./retrieveContext.js";

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 16000;
const FIELDS_PER_BATCH = 10;
const CONCURRENCY = 3;
/*
 * Cap on lookup_form_fields calls per batch before we force a final
 * emit_bindings. Protects against runaway loops when the model gets
 * confused. In practice 1-2 lookups per batch is the realistic ceiling.
 */
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
  /** Rule-specific params. Validated against the rule's Zod schema downstream. */
  params: Record<string, unknown>;
  rationale: string;
  /**
   * Self-rated confidence in this binding.
   *   high   — label + data path are both unambiguous; bind directly.
   *   medium — label is clear but the fact/slot choice is a guess.
   *   low    — label is ambiguous, OR `unsupported` because no path fits.
   * The renderer routes anything below the workflow's minConfidence floor
   * to a `todos` map (with rationale) so a human reviews it before the
   * binding ships.
   */
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
  /**
   * Optional per-field retrieved IRS-instruction blocks. When present,
   * each batch's prompt embeds the relevant blocks alongside each field.
   * When absent, the classifier runs purely on field-label heuristics.
   */
  retrievedContext?: RetrievedFieldContext[];
}

export async function classifyBindings(
  opts: ClassifyBindingsOpts,
  onBatchComplete?: (batchIndex: number, totalBatches: number, batchSize: number) => void,
): Promise<BindingClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey });

  /*
   * Load the catalog index once; it excludes the form being bound. The
   * classifier asks for any form's fields via `lookup_form_fields`, and
   * we resolve the request from this in-memory index.
   */
  const catalogIndex = await loadCatalogIndex(opts.formId);
  console.log(
    `[classify-bindings] catalog index: ${catalogIndex.size} other form(s) available — ${Array.from(catalogIndex.keys()).join(", ") || "(none)"}`,
  );

  /*
   * The full inventory is cached prefix context. Every batch's prompt
   * references it the same way, so prompt caching pays off heavily.
   */
  const inventoryBlock = buildInventoryBlock(opts, catalogIndex);

  // Index retrieved context by fieldId so per-batch rendering is O(1).
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

  /*
   * A missing must-file binding should not discard the run. Fall back to
   * the naming convention; the renderer emits a TODO when no FilingInfo
   * slot exists for it, so a human writes the rule.
   */
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

/* Everything a batch worker needs; built once per classifyBindings call. */
interface BatchPoolCtx {
  client: Anthropic;
  opts: ClassifyBindingsOpts;
  inventoryBlock: string;
  contextByFieldId: Map<string, RetrievedFieldContext>;
  catalogIndex: CatalogIndex;
}

/* Concurrency-capped worker pool over batches. */
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

/* The shape emit_bindings returns (snake_case, straight off the tool call). */
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

  /*
   * The initial message carries the cached inventory block (every batch
   * references it identically, so prompt caching pays off heavily) plus
   * the per-batch user text.
   */
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
 * Multi-turn conversation. On each tool_use response from Claude:
 *   - lookup_form_fields → execute, append tool_result, continue
 *   - emit_bindings → final answer; return
 * MAX_LOOKUPS_PER_BATCH bounds the worst case. The 5.5 models reject a
 * forced tool_choice, so once the budget is spent, further lookups get an
 * error result that tells the model to call emit_bindings now. A model
 * that keeps looking up after that fails the batch.
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
      model: MODEL,
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

    // When the model emits the final answer, capture it and stop.
    const emit = toolUses.find((t) => t.name === "emit_bindings");
    if (emit) {
      return { payload: parseEmitPayload(emit, batchLabel, response.stop_reason), usage };
    }

    /*
     * Otherwise we got lookup_form_fields calls. Execute each, append
     * assistant + tool_result blocks, and loop.
     */
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

/* Error results for lookups made after the budget is spent. */
function budgetSpentResults(toolUses: Anthropic.ToolUseBlock[]): Anthropic.ToolResultBlockParam[] {
  return toolUses.map((tu) => ({
    type: "tool_result",
    tool_use_id: tu.id,
    content: `Lookup budget spent (${MAX_LOOKUPS_PER_BATCH}). Do not look up more forms. Call emit_bindings now; use \`unsupported\` for any field you could not resolve.`,
    is_error: true,
  }));
}

/* Resolve each lookup_form_fields call against the in-memory catalog index. */
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
    /*
     * Default for when the AI omits rationale, although the tool schema
     * marks it required (intermittent failure mode). This keeps the
     * workflow's input-validation step from failing the whole bind over
     * 1-3 missing strings out of ~170.
     */
    rationale: b.rationale ?? `(no rationale provided — rule=${b.rule_name})`,
    /*
     * Same defensive default: when the AI omits confidence, mark "low"
     * so a human reviews it instead of trusting an unrated binding.
     */
    confidence: b.confidence ?? "low",
  }));
}

/*
 * One per-batch field entry: field metadata + the retrieved IRS blocks
 * for that field (when retrieval ran). Blocks are trimmed so a 10-field
 * batch stays inside the per-batch uncached token budget.
 */
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

/*
 * Renders the full field inventory as a cached prefix block. Each batch
 * can then reference any field (for fromFields cross-references) while
 * the prefix tokens are paid once.
 */
function buildInventoryBlock(opts: ClassifyBindingsOpts, catalogIndex: CatalogIndex): string {
  const lines = opts.fields.map(
    (f) => `  ${f.fieldId} — "${f.label}" (category=${f.category}, valueType=${f.valueType})`,
  );
  /*
   * Other forms available via lookup_form_fields. The classifier only
   * sees a roster here (formId + title + jurisdiction). Detailed fields
   * come back when it calls lookup_form_fields(formId).
   */
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
