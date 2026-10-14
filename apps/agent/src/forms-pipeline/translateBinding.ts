/*
 * Translation layer for generate-bindings: classifier rule → TS function
 * body, plus the FilingInfo slot tables that ground the AI's raw fact /
 * decision keys in typed slots. renderBindings.ts composes these into the
 * generated bindings file. When a key is not in a table, the renderer
 * pushes the binding to `todos` for human review: add the slot to
 * FilingInfo, or clarify the AI's choice.
 */

import type { ClassifiedBinding } from "./classifyBindings.js";


const FACT_TO_SLOT: Record<string, string> = {
  "identity.name.first": "taxpayerFirstName",
  "identity.name.middle_initial": "taxpayerMiddleInitial",
  "identity.name.last": "taxpayerLastName",
  "identity.ssn": "taxpayerSSN",
  "identity.dob": "taxpayerDateOfBirth",
  "identity.address.street": "homeAddressLine1",
  "identity.address.apt": "homeAddressApt",
  "identity.address.city": "homeAddressCity",
  "identity.address.state": "homeAddressState",
  "identity.address.zip": "homeAddressZip",
  "identity.address.county": "homeAddressCounty",
  "identity.email": "taxpayerEmail",
  "identity.phone": "taxpayerPhone",
  "identity.occupation": "taxpayerOccupation",
  "use_tax.owed_amount": "useTaxOwed",
  "health_coverage.full_year_mec": "fullYearMEC",
};

export const DECISION_TO_SLOT: Record<string, string> = {
  "decisions.scope.must_file_federal": "mustFileFederal",
  "decisions.scope.must_file_ca_540": "mustFileCA540",
  "decisions.scope.filing_status": "filingStatus",
  "decisions.scope.ca_residency": "caResidencyStatus",
  "decisions.scope.mailing_same_as_principal_residence": "mailingSameAsResidence",
  "decisions.scope.use_tax_zero_reason": "useTaxZeroReason",
  "decisions.refund.refund_full_overpayment_federal": "refundFullOverpaymentFederal",
  "decisions.refund.refund_full_overpayment_ca": "refundFullOverpaymentCA",
};

// sumFacts identity: `${category}|${keyPrefix ?? ""}|${fieldPath}`.
const SUM_FACTS_TO_SLOT: Record<string, string> = {
  "wages|employer.|box1": "w2WagesTotal",
  "wages|employer.|box2": "w2FederalWithholding",
  "wages|employer.|box16": "w2StateWages",
  "wages|employer.|box17": "w2StateWithholding",
  "investment_income|account.|box1a": "ordinaryDividends",
  "investment_income|account.|box1b": "qualifiedDividends",
  "investment_income|account.|box4": "form1099FederalWithholding",
};

export type Translation =
  | {
      kind: "body";
      body: string;
      usesLookupTax?: boolean;
      usesSum?: boolean;
      usesFloor?: boolean;
    }
  | { kind: "todo"; reason: string };

export function translate(b: ClassifiedBinding, formId: string): Translation {
  switch (b.ruleName) {
    case "lookupFact":
      return translateLookupFact(b);
    case "sumFacts":
      return translateSumFacts(b);
    case "lookupDecision":
      return translateLookupDecision(b);
    case "decisionIfEquals":
      return translateDecisionIfEquals(b);
    case "tableLookupByDecision":
      return translateTableLookupByDecision(b);
    case "fromFields":
      return translateFromFields(b, formId);
    case "taxTable":
      return translateTaxTable(b, formId);
    case "constant":
      return translateConstant(b);
    case "bracketLookup":
      return {
        kind: "todo",
        reason:
          "bracketLookup translation not implemented yet — typically progressive-bracket math (AMT, ≥$100k Tax Computation Worksheet)",
      };
    case "unsupported":
      // The caller routes `unsupported` to its own map; this must not run.
      return { kind: "todo", reason: "unsupported routed to bindings path" };
  }
}

function translateLookupFact(b: ClassifiedBinding): Translation {
  const factKey = String(b.params.factKey ?? "");
  const slot = FACT_TO_SLOT[factKey];
  if (!slot) {
    return {
      kind: "todo",
      reason: `no FilingInfo slot for fact "${factKey}". Add the slot to BaseFilingInfo / <Form>FilingInfo and map it in renderBindings.FACT_TO_SLOT.`,
    };
  }
  return { kind: "body", body: `(_, info) => info.${slot}` };
}

function translateSumFacts(b: ClassifiedBinding): Translation {
  const category = String(b.params.category ?? "");
  const keyPrefix = String(b.params.keyPrefix ?? "");
  const fieldPath = String(b.params.fieldPath ?? "");
  const key = `${category}|${keyPrefix}|${fieldPath}`;
  const slot = SUM_FACTS_TO_SLOT[key];
  if (!slot) {
    return {
      kind: "todo",
      reason: `no FilingInfo slot for sumFacts(${key}). Add the aggregate to <Form>FilingInfo + the resolver, and map it in renderBindings.SUM_FACTS_TO_SLOT.`,
    };
  }
  return { kind: "body", body: `(_, info) => info.${slot}` };
}

function translateLookupDecision(b: ClassifiedBinding): Translation {
  const decisionKey = String(b.params.decisionKey ?? "");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "todo",
      reason: `no FilingInfo slot for decision "${decisionKey}". Add the slot to BaseFilingInfo / <Form>FilingInfo and map it in renderBindings.DECISION_TO_SLOT.`,
    };
  }
  return { kind: "body", body: `(_, info) => info.${slot}` };
}

function translateDecisionIfEquals(b: ClassifiedBinding): Translation {
  const decisionKey = String(b.params.decisionKey ?? "");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "todo",
      reason: `no FilingInfo slot for decision "${decisionKey}".`,
    };
  }
  const matchValue = b.params.matchValue;
  if (matchValue === undefined) {
    // Mode 1: pass through the raw decision value (single/multi select).
    return { kind: "body", body: `(_, info) => info.${slot}` };
  }
  /*
   * Mode 2 — per-checkbox boolean: true when decision === matchValue.
   * JSON.stringify preserves boolean/number/string typing, so the
   * comparison operand matches the FilingInfo slot's type (boolean ===
   * boolean, not boolean === "true"). The AI sometimes emits matchValue
   * as the literal `true` / `false` and sometimes as the string "true" /
   * "false". Normalize boolean-looking matchValues back to booleans so
   * both work.
   */
  const normalized = matchValue === "true" ? true : matchValue === "false" ? false : matchValue;
  return {
    kind: "body",
    body: `(_, info) => info.${slot} === ${JSON.stringify(normalized)}`,
  };
}

function translateTableLookupByDecision(b: ClassifiedBinding): Translation {
  const decisionKey = String(b.params.decisionKey ?? "");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "todo",
      reason: `no FilingInfo slot for decision "${decisionKey}".`,
    };
  }
  const table = b.params.table;
  if (!table || typeof table !== "object") {
    return { kind: "todo", reason: "tableLookupByDecision missing table param" };
  }
  const tableLiteral = JSON.stringify(table);
  return {
    kind: "body",
    body: `(_, info) => (info.${slot} ? (${tableLiteral} as Record<string, number>)[info.${slot}] : undefined)`,
  };
}

function translateFromFields(b: ClassifiedBinding, formId: string): Translation {
  const terms = b.params.terms as
    Array<{ fieldId: string; sign?: number; whenSourceNotRequired?: unknown }> | undefined;
  if (!Array.isArray(terms) || terms.length === 0) {
    return { kind: "todo", reason: "fromFields missing terms" };
  }
  const args: string[] = [];
  for (const t of terms) {
    const sign = t.sign ?? 1;
    const key = shortOrFullKey(t.fieldId, formId);
    if (sign === 1) {
      args.push(`f[${quote(key)}]`);
    } else if (sign === -1) {
      // sum() takes (number | undefined). Wrap to negate; undefined becomes 0.
      args.push(`f[${quote(key)}] === undefined ? 0 : -f[${quote(key)}]`);
    } else {
      args.push(`f[${quote(key)}] === undefined ? 0 : ${sign} * f[${quote(key)}]`);
    }
  }
  const sumExpr = `sum(${args.join(", ")})`;
  const floorVal = b.params.floor;
  if (typeof floorVal === "number") {
    return {
      kind: "body",
      body: `(f) => floor(${floorVal}, ${sumExpr})`,
      usesSum: true,
      usesFloor: true,
    };
  }
  return { kind: "body", body: `(f) => ${sumExpr}`, usesSum: true };
}

function translateTaxTable(b: ClassifiedBinding, formId: string): Translation {
  const decisionKey = String(b.params.decisionKey ?? "");
  const inputFieldId = String(b.params.inputFieldId ?? "");
  const tableId = String(b.params.tableId ?? "federal-2025");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "todo",
      reason: `taxTable: no FilingInfo slot for decision "${decisionKey}".`,
    };
  }
  if (!inputFieldId) {
    return { kind: "todo", reason: "taxTable missing inputFieldId" };
  }
  const inputKey = shortOrFullKey(inputFieldId, formId);
  return {
    kind: "body",
    body:
      `(f, info) => {\n` +
      `        if (!info.${slot}) return undefined;\n` +
      `        const income = f[${quote(inputKey)}];\n` +
      `        if (typeof income !== "number") return undefined;\n` +
      `        const r = lookupTax(${quote(tableId)}, income, info.${slot});\n` +
      `        return r.ok ? r.tax : undefined;\n` +
      `      }`,
    usesLookupTax: true,
  };
}

function translateConstant(b: ClassifiedBinding): Translation {
  const value = b.params.value;
  if (value === undefined) {
    return { kind: "todo", reason: "constant missing value param" };
  }
  return { kind: "body", body: `() => ${JSON.stringify(value)}` };
}

export function shortKey(fieldId: string, formId: string): string {
  const prefix = `${formId}.`;
  if (fieldId.startsWith(prefix)) return fieldId.slice(prefix.length);
  return fieldId;
}

/**
 * Cross-form refs use the full fieldId so the form accessor proxy routes
 * through the global registry. Same-form refs use the short key, the
 * convention defineForm uses for its own fields.
 */
function shortOrFullKey(fieldId: string, formId: string): string {
  if (fieldId.startsWith(`${formId}.`)) return fieldId.slice(formId.length + 1);
  return fieldId;
}

export function quote(s: string): string {
  return JSON.stringify(s);
}

