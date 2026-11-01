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
      usesAtLeast?: boolean;
    }
  | { kind: "unsupported"; reason: string };

export function translate(binding: ClassifiedBinding, formId: string): Translation {
  switch (binding.ruleName) {
    case "lookupFact":
      return translateLookupFact(binding);
    case "sumFacts":
      return translateSumFacts(binding);
    case "lookupDecision":
      return translateLookupDecision(binding);
    case "decisionIfEquals":
      return translateDecisionIfEquals(binding);
    case "tableLookupByDecision":
      return translateTableLookupByDecision(binding);
    case "fromFields":
      return translateFromFields(binding, formId);
    case "taxTable":
      return translateTaxTable(binding, formId);
    case "constant":
      return translateConstant(binding);
    case "bracketLookup":
      return {
        kind: "unsupported",
        reason:
          "bracketLookup translation not implemented yet — typically progressive-bracket math (AMT, ≥$100k Tax Computation Worksheet)",
      };
    case "unsupported":
      // The caller routes `unsupported` to its own map; this must not run.
      return { kind: "unsupported", reason: "unsupported routed to bindings path" };
  }
}

function translateLookupFact(binding: ClassifiedBinding): Translation {
  const factKey = String(binding.params.factKey ?? "");
  const slot = FACT_TO_SLOT[factKey];
  if (!slot) {
    return {
      kind: "unsupported",
      reason: `no FilingInfo slot for fact "${factKey}". Add the slot to BaseFilingInfo / <Form>FilingInfo and map it in renderBindings.FACT_TO_SLOT.`,
    };
  }
  return { kind: "body", body: `(_, info) => info.${slot}` };
}

function translateSumFacts(binding: ClassifiedBinding): Translation {
  const category = String(binding.params.category ?? "");
  const keyPrefix = String(binding.params.keyPrefix ?? "");
  const fieldPath = String(binding.params.fieldPath ?? "");
  const key = `${category}|${keyPrefix}|${fieldPath}`;
  const slot = SUM_FACTS_TO_SLOT[key];
  if (!slot) {
    return {
      kind: "unsupported",
      reason: `no FilingInfo slot for sumFacts(${key}). Add the aggregate to <Form>FilingInfo + the resolver, and map it in renderBindings.SUM_FACTS_TO_SLOT.`,
    };
  }
  return { kind: "body", body: `(_, info) => info.${slot}` };
}

function translateLookupDecision(binding: ClassifiedBinding): Translation {
  const decisionKey = String(binding.params.decisionKey ?? "");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "unsupported",
      reason: `no FilingInfo slot for decision "${decisionKey}". Add the slot to BaseFilingInfo / <Form>FilingInfo and map it in renderBindings.DECISION_TO_SLOT.`,
    };
  }
  return { kind: "body", body: `(_, info) => info.${slot}` };
}

function translateDecisionIfEquals(binding: ClassifiedBinding): Translation {
  const decisionKey = String(binding.params.decisionKey ?? "");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "unsupported",
      reason: `no FilingInfo slot for decision "${decisionKey}".`,
    };
  }
  const matchValue = binding.params.matchValue;
  if (matchValue === undefined) {
    // Mode 1: pass through the raw decision value (single/multi select).
    return { kind: "body", body: `(_, info) => info.${slot}` };
  }
  /*
   * Mode 2: per-checkbox boolean. The AI emits matchValue as `true` or as "true".
   * Normalize to a boolean so the comparison matches the slot's type.
   */
  const normalized = matchValue === "true" ? true : matchValue === "false" ? false : matchValue;
  return {
    kind: "body",
    body: `(_, info) => info.${slot} === ${JSON.stringify(normalized)}`,
  };
}

function translateTableLookupByDecision(binding: ClassifiedBinding): Translation {
  const decisionKey = String(binding.params.decisionKey ?? "");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "unsupported",
      reason: `no FilingInfo slot for decision "${decisionKey}".`,
    };
  }
  const table = binding.params.table;
  if (!table || typeof table !== "object") {
    return { kind: "unsupported", reason: "tableLookupByDecision missing table param" };
  }
  const tableLiteral = JSON.stringify(table);
  return {
    kind: "body",
    body: `(_, info) => (info.${slot} ? (${tableLiteral} as Record<string, number>)[info.${slot}] : undefined)`,
  };
}

function translateFromFields(binding: ClassifiedBinding, formId: string): Translation {
  const terms = binding.params.terms as
    Array<{ fieldId: string; sign?: number; whenSourceNotRequired?: unknown }> | undefined;
  if (!Array.isArray(terms) || terms.length === 0) {
    return { kind: "unsupported", reason: "fromFields missing terms" };
  }
  const args: string[] = [];
  for (const term of terms) {
    const sign = term.sign ?? 1;
    const key = shortOrFullKey(term.fieldId, formId);
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
  const floorVal = binding.params.floor;
  if (typeof floorVal === "number") {
    return {
      kind: "body",
      body: `(f) => atLeast(${floorVal}, ${sumExpr})`,
      usesSum: true,
      usesAtLeast: true,
    };
  }
  return { kind: "body", body: `(f) => ${sumExpr}`, usesSum: true };
}

function translateTaxTable(binding: ClassifiedBinding, formId: string): Translation {
  const decisionKey = String(binding.params.decisionKey ?? "");
  const inputFieldId = String(binding.params.inputFieldId ?? "");
  const tableId = String(binding.params.tableId ?? "federal-2025");
  const slot = DECISION_TO_SLOT[decisionKey];
  if (!slot) {
    return {
      kind: "unsupported",
      reason: `taxTable: no FilingInfo slot for decision "${decisionKey}".`,
    };
  }
  if (!inputFieldId) {
    return { kind: "unsupported", reason: "taxTable missing inputFieldId" };
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

function translateConstant(binding: ClassifiedBinding): Translation {
  const value = binding.params.value;
  if (value === undefined) {
    return { kind: "unsupported", reason: "constant missing value param" };
  }
  return { kind: "body", body: `() => ${JSON.stringify(value)}` };
}

export function shortKey(fieldId: string, formId: string): string {
  const prefix = `${formId}.`;
  if (fieldId.startsWith(prefix)) return fieldId.slice(prefix.length);
  return fieldId;
}

/** Cross-form refs keep the full fieldId so the form accessor routes through the global registry. */
function shortOrFullKey(fieldId: string, formId: string): string {
  if (fieldId.startsWith(`${formId}.`)) return fieldId.slice(formId.length + 1);
  return fieldId;
}

export function quote(text: string): string {
  return JSON.stringify(text);
}
