import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedField } from "./extractFormFields.js";
import { createStructured } from "./structuredOutput.js";

/*
 * FORMS_PIPELINE_MODEL overrides the model (e.g. Haiku for a cheap draft).
 * Read at call time: the CLI loads its env files after the imports run.
 */
const model = () => process.env.FORMS_PIPELINE_MODEL ?? "claude-sonnet-5-5";
const MAX_TOKENS = 16000;
const FIELDS_PER_BATCH = 40;

export type Category = "personal_info" | "filing_scope" | "income" | "deductions_credits" | "other";

export type ValueType =
  | "money"
  | "count"
  | "text"
  | "ssn"
  | "phone"
  | "zip"
  | "email"
  | "date"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "signature";

export interface FieldEnrichmentOption {
  value: string;
  /** Echo of the PDF option label, to verify alignment. */
  radioOption: string;
}

export interface FieldEnrichment {
  pdfFieldName: string;
  fieldId: string;
  category: Category;
  valueType: ValueType;
  /** Same length and order as radioOptions[]. */
  options?: FieldEnrichmentOption[];
}

export interface FieldSkip {
  pdfFieldName: string;
  skipReason: string;
}

export interface ClassificationResult {
  enrichments: FieldEnrichment[];
  skipped: FieldSkip[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface ClassifyOpts {
  formId: string;
  taxYear: number;
  jurisdiction: string;
  formTitle: string;
  fields: ExtractedField[];
}

const SYSTEM_PROMPT = `You are assigning semantic metadata to PDF form fields on a U.S. tax form.

Each field arrives with its structure already known:
  - \`field_kind\` — text / checkbox / radio / signature / other (don't override)
  - \`label\` — the human-readable label, already resolved from /TU or vision (don't paraphrase)
  - For text fields: \`max_length\` and \`multiline\`
  - For radio groups: \`radio_options\` in PDF order (you'll assign stable values to each)

Your job is three decisions per field:

1. **field_id** — a stable "<formId>.<section>.<key>" identifier
   Sections: \`header\` (top-of-form personal info), \`line\` (numbered tax lines), \`signing\` (signature block), \`dependents\`, \`page2\`, etc.
   Use snake_case for the key. Pick a canonical name on first encounter; reuse it if a semantically-equivalent field appears later. The "Already-assigned fieldIds" table shows ids from earlier batches — reuse those when they fit.

2. **category** — which UI bucket the field rolls up into:
   \`personal_info\` / \`filing_scope\` / \`income\` / \`deductions_credits\` / \`other\`

3. **value_type** — what kind of value belongs in this field. Pick from:

   numeric variants (almost always text widgets):
     - \`money\` — dollar amount on a tax line ("Total amount from Form(s) W-2", "Adjusted gross income", "Tax")
     - \`count\` — small integer count ("Number of dependents", "Number of exemptions", "Personal: enter 1 or 2 in the box")

   text variants:
     - \`text\` — free text (first name, last name, address, occupation)
     - \`ssn\` — Social Security Number or ITIN (label mentions SSN/ITIN/identification number)
     - \`phone\` — phone number
     - \`zip\` — ZIP code (label mentions ZIP)
     - \`email\` — email address

   date variants:
     - \`date\` — calendar date (label mentions date / "Date of birth" / "born before…" with MM DD YYYY)

   selection variants:
     - \`boolean\` — a single checkbox (e.g. "Spouse itemizes on a separate return", "Filed pursuant to section 301.9100-2")
     - \`single_select\` — radio group OR group of mutually-exclusive checkboxes where only one is valid
     - \`multi_select\` — independent checkboxes where any subset can be set

   other:
     - \`signature\` — signature fields (kind = signature)

For radio fields (kind = radio), also return \`options\` — one entry per \`radio_option\` in the same order, with a snake_case \`value\` per option and the original \`radio_option\` text echoed back. value_type for radios is almost always \`single_select\`.

If a field is genuinely decorative or duplicate-with-no-purpose, emit a skip entry instead.

**Field-id conventions** (use these exact ids when applicable):
  - form-1040.header.first_name_mi, form-1040.header.last_name, form-1040.header.ssn
  - form-1040.header.spouse_first_name_mi, form-1040.header.spouse_last_name, form-1040.header.spouse_ssn
  - form-1040.header.home_address, form-1040.header.apartment, form-1040.header.city, form-1040.header.state, form-1040.header.zip
  - form-1040.header.filing_status_single, form-1040.header.filing_status_mfj, form-1040.header.filing_status_mfs, form-1040.header.filing_status_hoh, form-1040.header.filing_status_qss
  - form-1040.line.1a, form-1040.line.11b, form-1040.line.12e, form-1040.line.16, form-1040.line.34
  - form-1040.signing.taxpayer_occupation, form-1040.signing.taxpayer_email, form-1040.signing.taxpayer_phone
  - form-540.header.filing_status (radio group with options)`;

const ENRICH_TOOL: Anthropic.Tool = {
  name: "enrich_fields",
  description:
    "Submit semantic enrichment for every field in this batch. Field entries become catalog rows; skip entries are dropped from the catalog but preserved in the run record.",
  input_schema: {
    type: "object",
    properties: {
      enrichments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pdf_field_name: { type: "string" },
            field_id: { type: "string" },
            category: {
              type: "string",
              enum: ["personal_info", "filing_scope", "income", "deductions_credits", "other"],
            },
            value_type: {
              type: "string",
              enum: [
                "money",
                "count",
                "text",
                "ssn",
                "phone",
                "zip",
                "email",
                "date",
                "boolean",
                "single_select",
                "multi_select",
                "signature",
              ],
            },
            options: {
              type: "array",
              description:
                "Required when field_kind is radio. One entry per radio_option in the PDF, in the same order. value is a stable snake_case key; radio_option echoes the PDF's exact label so we can verify alignment.",
              items: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  radio_option: { type: "string" },
                },
                required: ["value", "radio_option"],
              },
            },
          },
          required: ["pdf_field_name", "field_id", "category", "value_type"],
        },
      },
      skipped: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pdf_field_name: { type: "string" },
            skip_reason: { type: "string" },
          },
          required: ["pdf_field_name", "skip_reason"],
        },
      },
    },
    required: ["enrichments", "skipped"],
  },
};

interface RawEnrichInput {
  enrichments: Array<{
    pdf_field_name: string;
    field_id: string;
    category: Category;
    value_type: ValueType;
    options?: Array<{ value: string; radio_option: string }>;
  }>;
  skipped: Array<{ pdf_field_name: string; skip_reason: string }>;
}

function buildBatchUserText(
  opts: ClassifyOpts,
  batch: ExtractedField[],
  batchIndex: number,
  totalBatches: number,
  assignedFieldIds: Map<string, string>,
): string {
  const fieldsJson = JSON.stringify(
    batch.map((field) => ({
      pdf_field_name: field.fieldName,
      short_name: field.shortName,
      field_kind: field.fieldKind,
      label: field.label,
      ...(field.maxLength != null ? { max_length: field.maxLength } : {}),
      ...(field.multiline ? { multiline: true } : {}),
      ...(field.comb ? { comb: true } : {}),
      ...(field.radioOptions ? { radio_options: field.radioOptions } : {}),
      ...(field.checkboxOnValue ? { checkbox_on: field.checkboxOnValue } : {}),
    })),
    null,
    2,
  );

  return `Form: ${opts.formTitle} (${opts.formId}, tax year ${opts.taxYear}, jurisdiction ${opts.jurisdiction})

${buildAssignedTable(assignedFieldIds)}

Batch ${batchIndex + 1} of ${totalBatches} — ${batch.length} fields to enrich:

${fieldsJson}

For each field above, return one enrichment (or one skip). Reuse fieldIds from "Already-assigned fieldIds" when semantically equivalent.`;
}

/* The model sometimes returns the arrays as JSON strings; parse them back. */
function parseEnrichInput(input: unknown): RawEnrichInput | null {
  const raw = input as {
    enrichments?: RawEnrichInput["enrichments"] | string;
    skipped?: RawEnrichInput["skipped"] | string;
  } | null;
  if (raw && typeof raw.enrichments === "string") {
    try {
      raw.enrichments = JSON.parse(raw.enrichments) as RawEnrichInput["enrichments"];
    } catch {
      /* fall through */
    }
  }
  if (raw && typeof raw.skipped === "string") {
    try {
      const parsed: unknown = JSON.parse(raw.skipped);
      raw.skipped = Array.isArray(parsed) ? (parsed as RawEnrichInput["skipped"]) : undefined;
    } catch {
      raw.skipped = undefined;
    }
  }
  if (!raw || !Array.isArray(raw.enrichments)) return null;
  return {
    enrichments: raw.enrichments,
    skipped: Array.isArray(raw.skipped) ? raw.skipped : [],
  };
}

async function classifyOneFieldBatch(
  client: Anthropic,
  opts: ClassifyOpts,
  batch: ExtractedField[],
  batchIndex: number,
  totalBatches: number,
  assignedFieldIds: Map<string, string>,
): Promise<{ raw: RawEnrichInput; usage: Anthropic.Usage } | null> {
  const userText = buildBatchUserText(opts, batch, batchIndex, totalBatches, assignedFieldIds);
  const { input, response } = await createStructured(client, {
    model: model(),
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tool: ENRICH_TOOL,
    messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
  });

  const raw = input === null ? null : parseEnrichInput(input);
  if (!raw) {
    console.warn(
      `[classify] batch ${batchIndex + 1}/${totalBatches}: no parseable output (stop_reason=${response.stop_reason}); skipping batch. Preview: ${JSON.stringify(input).slice(0, 300)}`,
    );
    return null;
  }
  return { raw, usage: response.usage };
}

function accumulateBatch(
  raw: RawEnrichInput,
  batch: ExtractedField[],
  acc: {
    allEnrichments: FieldEnrichment[];
    allSkipped: FieldSkip[];
    assignedFieldIds: Map<string, string>;
  },
): void {
  for (const rawEnrichment of raw.enrichments) {
    const enrichment: FieldEnrichment = {
      pdfFieldName: rawEnrichment.pdf_field_name,
      fieldId: rawEnrichment.field_id,
      category: rawEnrichment.category,
      valueType: rawEnrichment.value_type,
    };
    if (Array.isArray(rawEnrichment.options) && rawEnrichment.options.length > 0) {
      enrichment.options = rawEnrichment.options.map((option) => ({
        value: option.value,
        radioOption: option.radio_option,
      }));
    }
    acc.allEnrichments.push(enrichment);
    if (!acc.assignedFieldIds.has(rawEnrichment.field_id)) {
      const matched = batch.find((field) => field.fieldName === rawEnrichment.pdf_field_name);
      acc.assignedFieldIds.set(rawEnrichment.field_id, matched?.label ?? "");
    }
  }
  for (const skipped of raw.skipped) {
    acc.allSkipped.push({ pdfFieldName: skipped.pdf_field_name, skipReason: skipped.skip_reason });
  }
}

export async function classifyFields(opts: ClassifyOpts): Promise<ClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey });

  const allEnrichments: FieldEnrichment[] = [];
  const allSkipped: FieldSkip[] = [];
  const usage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };

  const batches: ExtractedField[][] = [];
  for (let i = 0; i < opts.fields.length; i += FIELDS_PER_BATCH) {
    batches.push(opts.fields.slice(i, i + FIELDS_PER_BATCH));
  }

  const assignedFieldIds = new Map<string, string>(); // fieldId → label

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const result = await classifyOneFieldBatch(
      client,
      opts,
      batch,
      i,
      batches.length,
      assignedFieldIds,
    );
    if (!result) continue;
    const { raw } = result;

    accumulateBatch(raw, batch, { allEnrichments, allSkipped, assignedFieldIds });

    usage.input_tokens += result.usage.input_tokens;
    usage.output_tokens += result.usage.output_tokens;
    usage.cache_creation_input_tokens += result.usage.cache_creation_input_tokens ?? 0;
    usage.cache_read_input_tokens += result.usage.cache_read_input_tokens ?? 0;

    console.log(
      `    batch ${i + 1}/${batches.length}: ${raw.enrichments.length} enriched, ${raw.skipped.length} skipped, ${assignedFieldIds.size} unique fieldIds so far`,
    );
  }

  return { enrichments: allEnrichments, skipped: allSkipped, usage };
}

function buildAssignedTable(assigned: Map<string, string>): string {
  if (assigned.size === 0) {
    return "Already-assigned fieldIds: (none — this is the first batch)";
  }
  const lines = ["Already-assigned fieldIds from earlier batches (reuse when applicable):"];
  for (const [id, label] of assigned) {
    lines.push(`  ${id} — ${label}`);
  }
  return lines.join("\n");
}
