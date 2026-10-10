import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createDocument } from "../db/userDocuments";
import {
  type AnyFormField,
  type EvaluatedForm,
} from "../../engine/types";
import { renderForm } from "../../engine";
import { loadAndEvaluateScenario } from "../loadScenario";
import { FORMS } from "../../engine/registry";
import { requireUserContext } from "./userContext";

function lineValue(
  form: EvaluatedForm<AnyFormField>,
  fieldId: string,
): number | null {
  const f = form.fields.find((x) => x.fieldId === fieldId);
  if (!f || !f.result.ok) return null;
  const v = f.result.value;
  return typeof v === "number" ? v : null;
}

function serializeForm<F extends AnyFormField>(
  form: EvaluatedForm<F>,
): {
  formId: string;
  jurisdiction: string;
  title: string;
  mustFile: EvaluatedForm<F>["mustFile"];
  /**
   * Audit trail for the must-file determination. Present when the resolver
   * populated it for this form. See EngineDerivation.
   */
  mustFileDerivation: EvaluatedForm<F>["mustFileDerivation"];
  fields: Array<{
    fieldId: string;
    label: string;
    category: string;
    valueType: string;
    result: F["result"];
  }>;
} {
  return {
    formId: form.formId,
    jurisdiction: form.jurisdiction,
    title: form.title,
    mustFile: form.mustFile,
    mustFileDerivation: form.mustFileDerivation,
    fields: form.fields.map((f) => ({
      fieldId: f.fieldId,
      label: f.label,
      category: f.category,
      valueType: f.valueType,
      result: f.result,
    })),
  };
}

function refundOrOwed(
  form: EvaluatedForm<AnyFormField>,
  refundFieldId: string,
  owedFieldId: string,
): { kind: "refund" | "owed" | "balanced"; amount: number } {
  const refund = lineValue(form, refundFieldId);
  const owed = lineValue(form, owedFieldId);
  if (refund !== null && refund > 0) return { kind: "refund", amount: refund };
  if (owed !== null && owed > 0) return { kind: "owed", amount: owed };
  return { kind: "balanced", amount: 0 };
}

function countFields(form: EvaluatedForm<AnyFormField>): {
  ok: number;
  blocked: number;
  unsupported: number;
} {
  const ok = form.fields.filter((f) => f.result.ok).length;
  const unsupported = form.fields.filter(
    (f) => !f.result.ok && f.result.unsupported,
  ).length;
  return {
    ok,
    blocked: form.fields.length - ok - unsupported,
    unsupported,
  };
}

export const generateTaxDocuments = createTool({
  id: "generate-tax-documents",
  description:
    "Render the taxpayer's filed forms as PDFs using the form engine. Runs the multi-form evaluator against the current facts and decisions, looks up each catalog field's PDF widget, and writes the value. Returns a list of {formId, url} entries for each form whose mustFile predicate evaluates true, plus a JSON sidecar with the evaluated forms. Call at hand-off (no pending decisions, all required facts present). Marked draft / not-for-filing — a CPA reviews before submission. Produces Form 1040, plus any of: Form 8949 / Schedule D when the taxpayer has reportable capital sales, Schedule CA (540) and Form 540 when the taxpayer is a CA filer. READ THE RESULT CAREFULLY: if status is 'no_forms_rendered', NO forms were generated — tell the user that, report the blockers (record any missingDecisionKey listed), and do NOT present any links or dollar amounts. When forms ARE generated, present them by pasting markdownLinks verbatim — never compose or alter document URLs yourself.",
  inputSchema: z.object({
    year: z.number().int(),
  }),
  outputSchema: z.object({
    /**
     * "ok" — at least one form rendered. "no_forms_rendered" — nothing was
     * generated; blockers explain why. Then present no links and no numbers.
     */
    status: z.enum(["ok", "no_forms_rendered"]),
    /** Forms whose must-file check could not evaluate — usually a missing decision. */
    blockers: z.array(
      z.object({
        formId: z.string(),
        reason: z.string(),
        missingDecisionKey: z.string().nullable(),
      }),
    ),
    /** Convenience: the 1040 URL ("" when the 1040 did not render). */
    url: z.string(),
    /** Convenience: the 540 URL (null when not filed). Kept for prior consumers. */
    form540Url: z.string().nullable(),
    /** Every rendered form keyed by formId — the canonical list going forward. */
    documents: z.array(
      z.object({
        formId: z.string(),
        url: z.string(),
        filename: z.string(),
      }),
    ),
    /**
     * Ready-to-paste markdown bullet list of the rendered documents. Paste
     * it VERBATIM when presenting forms to the user — do not retype the
     * URLs. Empty string when no forms rendered.
     */
    markdownLinks: z.string(),
    /** Null when no forms rendered (no sidecar is written). */
    sidecarUrl: z.string().nullable(),
    linesPopulated: z.number(),
    /** Null when the 1040 did not render — there is no federal result to report. */
    federalRefundOrOwed: z
      .object({
        kind: z.enum(["refund", "owed", "balanced"]),
        amount: z.number(),
      })
      .nullable(),
    stateRefundOrOwed: z
      .object({
        kind: z.enum(["refund", "owed", "balanced"]),
        amount: z.number(),
      })
      .nullable(),
    fieldCounts: z.object({
      ok: z.number(),
      blocked: z.number(),
      unsupported: z.number(),
    }),
  }),
  execute: async (input, context) => {
    const { scope, userId, filingId, taxYear, authEmail } =
      await requireUserContext(context);
    const { year } = input;

    const scenario = await loadAndEvaluateScenario(scope, { id: filingId, taxYear }, authEmail);
    const { forms } = scenario;

    /*
     * ─── Render every form whose mustFile predicate evaluates true ───
     * Every scenario we model files the 1040; its mustFile reads the
     * decisions.scope.must_file_federal flag. Other forms gate per
     * scenario via their own mustFile decisions. Example: Alejandro files
     * 8949, Schedule D, Schedule CA, and 540; Alex files only 1040 + 540.
     */
    const documents: Array<{ formId: string; url: string; filename: string }> = [];
    const blockers: Array<{
      formId: string;
      reason: string;
      missingDecisionKey: string | null;
    }> = [];
    const sidecarForms: Record<string, ReturnType<typeof serializeForm>> = {};
    let totalLinesPopulated = 0;
    let totalCounts = { ok: 0, blocked: 0, unsupported: 0 };

    for (const spec of FORMS) {
      const form = forms.get(spec.formId);
      if (!form) {
        console.warn(
          `[generate-tax-documents] no evaluation result for ${spec.formId}`,
        );
        continue;
      }
      if (!form.mustFile.ok) {
        /*
         * Must-file could not evaluate. The usual cause is a missing
         * decision (e.g. decisions.scope.must_file_federal was never
         * recorded). Surface it so the agent records the decision instead
         * of mistaking "nothing rendered" for a completed hand-off.
         */
        blockers.push({
          formId: spec.formId,
          reason: form.mustFile.reason,
          missingDecisionKey: form.mustFile.missingDecisionKey ?? null,
        });
        continue;
      }
      if (!form.mustFile.value) {
        /*
         * The form is out of scope for this scenario. Skip the render,
         * the sidecar entry, and the field counts.
         */
        continue;
      }

      const { pdfBytes, rendered, warnings } = await renderForm(scenario, spec.formId);
      for (const w of warnings) {
        console.warn(`[generate-tax-documents][${spec.formId}] ${w}`);
      }
      const filename = `${spec.displayName} — ${year}`;
      const doc = await createDocument({
        userId,
        filingId,
        category: "drafts",
        filename,
        storageSlug: `${spec.shortId}-${year}`,
        extension: "pdf",
        bytes: pdfBytes,
        mimeType: "application/pdf",
        expiresInDays: 30,
        metadata: { formId: spec.shortId, taxYear: year },
      });
      const url = `/documents/${doc.id}`;
      documents.push({ formId: spec.formId, url, filename });
      sidecarForms[spec.formId] = serializeForm(form);
      totalLinesPopulated += rendered.size;
      const counts = countFields(form);
      totalCounts = {
        ok: totalCounts.ok + counts.ok,
        blocked: totalCounts.blocked + counts.blocked,
        unsupported: totalCounts.unsupported + counts.unsupported,
      };
    }

    /*
     * ─── Sidecar — every rendered form ───
     * Skip it when nothing rendered: an empty sidecar only invites
     * "here's your forms data" messages that point at a useless JSON file.
     */
    let sidecarUrl: string | null = null;
    if (documents.length > 0) {
      const sidecar = {
        userId,
        year,
        generatedAt: new Date().toISOString(),
        forms: sidecarForms,
      };
      const sidecarBytes = Buffer.from(JSON.stringify(sidecar, null, 2), "utf-8");
      const sidecarDoc = await createDocument({
        userId,
        filingId,
        category: "drafts",
        filename: `Forms sidecar — ${year}`,
        storageSlug: `forms-${year}`,
        extension: "json",
        bytes: sidecarBytes,
        mimeType: "application/json",
        expiresInDays: 30,
        metadata: { formId: "sidecar", taxYear: year },
      });
      sidecarUrl = `/documents/${sidecarDoc.id}`;
    }

    /*
     * ─── Refund/owed summaries ───
     * Only compute these for forms that rendered. A blocked 1040 would
     * otherwise report a vacuous "balanced $0".
     */
    const form1040 = forms.get("form-1040");
    const form540 = forms.get("form-540");
    const federalRefundOrOwed =
      form1040 && form1040.mustFile.ok && form1040.mustFile.value
        ? refundOrOwed(form1040, "form-1040.line.34", "form-1040.line.37")
        : null;
    const stateRefundOrOwed =
      form540 && form540.mustFile.ok && form540.mustFile.value
        ? refundOrOwed(
            form540,
            "form-540.line.115_refund_or_no_amount_due",
            "form-540.line.111_amount_you_owe",
          )
        : null;

    // ─── Backwards-compat URL fields ───
    const url1040 = documents.find((d) => d.formId === "form-1040")?.url ?? "";
    const url540 = documents.find((d) => d.formId === "form-540")?.url ?? null;

    /*
     * ─── Verbatim-paste markdown ───
     * The ONLY link text the agent should put in chat. This prevents
     * hand-composed document links, which were historically malformed or
     * fabricated.
     */
    const markdownLinks = [
      ...documents.map((d) => `- [${d.filename}](${d.url})`),
      ...(sidecarUrl ? [`- [Forms data (JSON)](${sidecarUrl})`] : []),
    ].join("\n");

    return {
      status:
        documents.length > 0 ? ("ok" as const) : ("no_forms_rendered" as const),
      blockers,
      url: url1040,
      form540Url: url540,
      documents,
      markdownLinks,
      sidecarUrl,
      linesPopulated: totalLinesPopulated,
      federalRefundOrOwed,
      stateRefundOrOwed,
      fieldCounts: totalCounts,
    };
  },
});
