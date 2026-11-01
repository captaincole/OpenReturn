import { createStep } from "@mastra/core/workflows";
import { loadFromFixture, type FieldInventory } from "@openreturn/engine/catalog";
import { promises as fs } from "node:fs";
import path from "node:path";
import { classifyBindings } from "../classifyBindings.js";
import { renderBindings } from "../renderBindings.js";
import { retrieveContextPerField } from "../retrieveContext.js";
import {
  afterClassifySchema,
  afterPrepareSchema,
  afterRetrieveSchema,
  workflowInputSchema,
  workflowOutputSchema,
  type AfterRetrieve,
} from "./schemas.js";

export const prepareStep = createStep({
  id: "prepare",
  inputSchema: workflowInputSchema,
  outputSchema: afterPrepareSchema,
  execute: async ({ inputData }) => {
    const catalog = await loadFromFixture(inputData.catalogPath);
    const form = catalog.getForm(inputData.formId);
    if (!form) {
      throw new Error(
        `prepare: no form "${inputData.formId}" in catalog at ${inputData.catalogPath}`,
      );
    }
    const fields = catalog.getFields(inputData.formId);
    if (fields.length === 0) {
      throw new Error(`prepare: form "${inputData.formId}" has no fields in catalog`);
    }
    return {
      ...inputData,
      jurisdiction: form.jurisdiction,
      formTitle: form.title,
      fields,
    };
  },
});

export const retrieveStep = createStep({
  id: "retrieve",
  inputSchema: afterPrepareSchema,
  outputSchema: afterRetrieveSchema,
  execute: async ({ inputData }) => {
    const t0 = Date.now();
    const retrieved = await retrieveContextPerField(
      {
        fields: inputData.fields,
        formTitle: inputData.formTitle,
        topK: 3,
        concurrency: 10,
      },
      (done, total) => {
        if (done % 25 === 0 || done === total) {
          process.stderr.write(
            `    retrieve: ${done}/${total} fields (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`,
          );
        }
      },
    );
    const retrievedContext = retrieved.map((r) => ({
      fieldId: r.fieldId,
      blocks: r.blocks.map((b) => ({
        blockId: b.blockId,
        docId: b.docId,
        text: b.text,
        score: typeof b.score === "number" ? b.score : undefined,
      })),
    }));
    return { ...inputData, retrievedContext };
  },
});

export const classifyStep = createStep({
  id: "classify",
  inputSchema: afterRetrieveSchema,
  outputSchema: afterClassifySchema,
  execute: async ({ inputData }) => {
    const result = await classifyBindings(
      {
        formId: inputData.formId,
        taxYear: inputData.taxYear,
        jurisdiction: inputData.jurisdiction,
        formTitle: inputData.formTitle,
        fields: inputData.fields,
        retrievedContext: inputData.retrievedContext,
      },
      (i, total, size) => {
        process.stderr.write(`    classify batch ${i + 1}/${total} (${size} fields)\n`);
      },
    );
    return {
      ...inputData,
      bindings: result.bindings,
      mustFile: result.mustFile,
      usage: result.usage,
    };
  },
});

function pascalFormName(formId: string): string {
  return formId
    .split(/[-_]/)
    .map((s) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : ""))
    .join("");
}

export const writeStep = createStep({
  id: "write",
  inputSchema: afterClassifySchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    const fields: FieldInventory[] = inputData.fields;
    const interfaceBase = pascalFormName(inputData.formId);
    const report = renderBindings({
      formId: inputData.formId,
      taxYear: inputData.taxYear,
      jurisdiction: inputData.jurisdiction,
      formTitle: inputData.formTitle,
      fields,
      bindings: inputData.bindings,
      mustFile: inputData.mustFile,
      outputPath: inputData.outputPath,
      minConfidence: inputData.minConfidence,
      typeInterfaceName: interfaceBase,
      filingInfoInterfaceName: `${interfaceBase}FilingInfo`,
    });
    // Catalog-only forms have no engine folder yet.
    await fs.mkdir(path.dirname(inputData.outputPath), { recursive: true });
    await fs.writeFile(inputData.outputPath, report.source, "utf8");

    return {
      outputPath: inputData.outputPath,
      fieldCount: inputData.fields.length,
      emittedCount: report.emittedCount,
      unsupportedCount: report.unsupportedCount,
      unboundCount: report.unboundCount,
      ruleBreakdown: report.ruleBreakdown,
      confidenceBreakdown: report.confidenceBreakdown,
      retrievalCount: inputData.retrievedContext.length,
      usage: inputData.usage,
    };
  },
});

/* Unused here: a re-export so other modules need not import the carrier types. */
export type { AfterRetrieve };
