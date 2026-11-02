import { createStep } from "@mastra/core/workflows";
import { SOURCES_ROOT } from "@openreturn/sources";
import { promises as fs } from "node:fs";
import { relative } from "node:path";
import { assembleCatalog } from "../catalogRows.js";
import { classifyFields } from "../classifyFields.js";
import { extractFormFields } from "../extractFormFields.js";
import {
  afterClassifySchema,
  afterExtractSchema,
  workflowInputSchema,
  workflowOutputSchema,
} from "./schemas.js";

export const extractStep = createStep({
  id: "extract",
  inputSchema: workflowInputSchema,
  outputSchema: afterExtractSchema,
  execute: async ({ inputData }) => {
    const form = await extractFormFields(inputData.pdfPath);
    return {
      ...inputData,
      fields: form.fields,
      totalPages: form.totalPages,
    };
  },
});

export const classifyStep = createStep({
  id: "classify",
  inputSchema: afterExtractSchema,
  outputSchema: afterClassifySchema,
  execute: async ({ inputData }) => {
    const result = await classifyFields({
      formId: inputData.formId,
      taxYear: inputData.taxYear,
      jurisdiction: inputData.jurisdiction,
      formTitle: inputData.formTitle,
      fields: inputData.fields,
    });
    return {
      ...inputData,
      enrichments: result.enrichments,
      skipped: result.skipped,
      usage: {
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        cache_creation_input_tokens: result.usage.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: result.usage.cache_read_input_tokens ?? 0,
      },
    };
  },
});

export const persistStep = createStep({
  id: "persist",
  inputSchema: afterClassifySchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    const { catalog, unenriched } = assembleCatalog({ ...inputData, prefixPage: true });

    const payload = {
      form: {
        formId: inputData.formId,
        taxYear: inputData.taxYear,
        jurisdiction: inputData.jurisdiction,
        title: inputData.formTitle,
      },
      fields: catalog,
      _meta: {
        // Relative to sources, so the committed catalog holds no local path.
        sourcePdf: relative(SOURCES_ROOT, inputData.pdfPath),
        ingestedAt: new Date().toISOString(),
        totalFields: inputData.fields.length,
        enriched: inputData.enrichments.length,
        unenriched: unenriched.length,
        skipped: inputData.skipped.length,
        catalogEntries: catalog.length,
        tokensIn: inputData.usage.input_tokens,
        tokensOut: inputData.usage.output_tokens,
        cacheRead: inputData.usage.cache_read_input_tokens,
        cacheCreate: inputData.usage.cache_creation_input_tokens,
      },
    };
    await fs.writeFile(inputData.outputPath, JSON.stringify(payload, null, 2), "utf8");

    return {
      outputPath: inputData.outputPath,
      totalFields: inputData.fields.length,
      enrichedCount: inputData.enrichments.length,
      unenrichedCount: unenriched.length,
      skippedCount: inputData.skipped.length,
      catalogEntryCount: catalog.length,
      usage: inputData.usage,
      skipSample: inputData.skipped.slice(0, 8),
      unenrichedSample: unenriched.slice(0, 8),
    };
  },
});
