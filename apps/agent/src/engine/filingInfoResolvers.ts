/*
 * Per-form slot resolvers behind resolveFilingInfo (filingInfo.ts).
 *
 * Each resolve<Form>Info function reads raw facts + decisions through a
 * shared ResolverInputs view and produces that form's FilingInfo slots.
 * resolveFilingInfo spreads the results into the runtime intersection.
 * Adding a form = add its resolver here and spread it there.
 */

import { isInterestFactKey, type TradeFactValue } from "./facts/index.js";
import type { Form1040FilingInfo } from "./federal/1040/filingInfo.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import type { BaseFilingInfo } from "./filingInfo.js";
import type { Form540FilingInfo } from "./state/ca/540/filingInfo.js";
import type { ScheduleCaFilingInfo } from "./state/ca/schedule-ca/filingInfo.js";
import type { EngineDerivation } from "./types.js";
import { phone, ssn } from "./values.js";

// ─── Shared inputs view ──────────────────────────────────────────────────

export interface ResolverInputs {
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>;
  factByKey: Map<string, unknown>;
  decisionByKey: Map<string, unknown>;
  trades: PartitionedTrades;
}

export function makeResolverInputs(opts: {
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>;
  decisions: ReadonlyArray<{ decisionKey: string; decision: unknown }>;
}): ResolverInputs {
  const factByKey = new Map<string, unknown>();
  for (const f of opts.facts) factByKey.set(f.key, f.value);
  const decisionByKey = new Map<string, unknown>();
  for (const d of opts.decisions) decisionByKey.set(d.decisionKey, d.decision);
  return { facts: opts.facts, factByKey, decisionByKey, trades: partitionTrades(opts.facts) };
}

// ─── Fact readers ────────────────────────────────────────────────────────

function text(inputs: ResolverInputs, key: string): string | undefined {
  const v = inputs.factByKey.get(key);
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") {
    throw new Error(
      `resolveFilingInfo: fact "${key}" expected string, got ${typeof v} ` +
        `(value=${JSON.stringify(v).slice(0, 100)}). Re-record this fact as a ` +
        `plain string via record-tax-fact.`,
    );
  }
  return v;
}

/*
 * Single-key numeric read. Returns undefined when missing or
 * non-numeric. Callers use ?? 0 when they compose a sum.
 */
function num(inputs: ResolverInputs, key: string): number | undefined {
  const v = inputs.factByKey.get(key);
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function factsInCategory(
  inputs: ResolverInputs,
  cat: string,
): Array<{ key: string; value: unknown }> {
  return inputs.facts.filter((f) => f.category === cat);
}

function sumW2Box(inputs: ResolverInputs, boxKey: string): number {
  let total = 0;
  for (const row of factsInCategory(inputs, "wages")) {
    const v = (row.value as Record<string, unknown>)?.[boxKey];
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

/*
 * Sum a numeric field across investment_income facts. The optional
 * `keyFilter` narrows the read to one 1099 section. 1099-DIV box1a does
 * not overlap 1099-INT box1 today, but the filter makes the read
 * explicit and protects against future box-name overlap. Returns 0 when
 * no facts match, same convention as sumW2Box: "no 1099-INT at all → 0
 * taxable interest" rather than "we do not know."
 */
function sumInvestmentBox(
  inputs: ResolverInputs,
  boxKey: string,
  keyFilter?: (key: string) => boolean,
): number {
  let total = 0;
  for (const row of factsInCategory(inputs, "investment_income")) {
    if (keyFilter && !keyFilter(row.key)) continue;
    const v = (row.value as Record<string, unknown>)?.[boxKey];
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

function sumCaSdi(wageRows: Array<{ value: unknown }>): number {
  let total = 0;
  for (const row of wageRows) {
    const box14 = (row.value as Record<string, unknown>)?.box14;
    if (!Array.isArray(box14)) continue;
    for (const entry of box14) {
      const label = (entry as Record<string, unknown>)?.label;
      const amount = (entry as Record<string, unknown>)?.amount;
      if (
        typeof label === "string" &&
        /CA\s*SDI/i.test(label) &&
        typeof amount === "number" &&
        Number.isFinite(amount)
      ) {
        total += amount;
      }
    }
  }
  return total;
}

// ─── Trade facts (Form 8949 / Schedule D inputs) ─────────────────────────

/*
 * Mirrors the key convention in src/engine/facts/kinds/trade.ts. Inlined
 * here because parseTradeFact() expects a full TaxFactRow, while the
 * resolver only sees a {key, value, category} projection. The thinner
 * shape is enough to recognize and decode a trade fact.
 */
const TRADE_KEY_RE = /^account\.([^.]+)\.trades\.([^.]+)$/;

interface PartitionedTrades {
  short: TradeFactValue[];
  long: TradeFactValue[];
  factKeys: string[];
}

/*
 * Trade-fact partitioning for Form 8949. Walk investment_income facts,
 * pull out anything that parses as a trade (key shape
 * `account.<slug>.trades.<tradeId>`), then split by holding period:
 * held > 1 year ⇒ long-term, else short-term. Facts store dates as
 * "MM/DD/YY" or "MM/DD/YYYY"; both parse. The fact-key list feeds the
 * engine-derivation audit trail (triggeredByFactKeys).
 */
function partitionTrades(
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>,
): PartitionedTrades {
  const short: TradeFactValue[] = [];
  const long: TradeFactValue[] = [];
  const factKeys: string[] = [];
  for (const row of facts) {
    if (row.category !== "investment_income") continue;
    if (!TRADE_KEY_RE.test(row.key)) continue;
    const trade = row.value as TradeFactValue;
    (isLongTermTrade(trade) ? long : short).push(trade);
    factKeys.push(row.key);
  }
  return { short, long, factKeys };
}

/*
 * Trade-date parser. Accepts "MM/DD/YY" or "MM/DD/YYYY", the formats
 * brokers print on a 1099-B. Two-digit years anchor to the 2000s.
 */
function parseTradeDate(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  return new Date(year, month - 1, day);
}

/*
 * IRC §1222 short/long-term split: held more than 1 year is long-term.
 * "More than 1 year" means strictly past the anniversary date, at day
 * precision. Unparseable dates default to short-term. That is the
 * conservative choice (higher rate) versus a long-term mislabel.
 */
function isLongTermTrade(t: TradeFactValue): boolean {
  const acq = parseTradeDate(t.dateAcquired);
  const sold = parseTradeDate(t.dateSold);
  if (!acq || !sold) return false;
  const anniversary = new Date(acq);
  anniversary.setFullYear(anniversary.getFullYear() + 1);
  return sold > anniversary;
}

// ─── Must-file resolution with provenance ────────────────────────────────

/**
 * Resolve a must-file flag with explicit-decision-wins semantics, and
 * capture an audit trail (EngineDerivation) for the path that fired.
 *
 * Semantics:
 *  - An explicit boolean decision wins, even when false. This lets a
 *    scenario opt out of a form it would otherwise default into.
 *  - Otherwise, walk `fallbacks` in order and return the first whose
 *    `value` is true. Source order is the priority.
 *  - All fallbacks false → return false with a "no signal" derivation.
 *  - No fallbacks AND no explicit decision → value is undefined (caller
 *    decides), derivation is undefined.
 *
 * We record provenance even though the must_file_* keys are not in
 * ai_decisions. A CPA who reviews the doc-gen sidecar should see WHY
 * Schedule D was generated. The engine makes these scope calls today; the
 * EngineDerivation captures that honestly.
 */
interface MustFileFallback {
  /** Plain-English description of the rule. CPA-readable. */
  rule: string;
  /** True when this fallback signal currently fires. */
  value: boolean;
  /** Fact keys this rule consumed. */
  triggeredByFactKeys?: readonly string[];
  /** Decision keys this rule consumed. */
  triggeredByDecisionKeys?: readonly string[];
}

function resolveMustFile(
  decisions: Map<string, unknown>,
  opts: { explicitKey: string; fallbacks?: MustFileFallback[] },
): { value: boolean | undefined; derivation: EngineDerivation | undefined } {
  const explicit = decisions.get(opts.explicitKey);
  if (typeof explicit === "boolean") {
    return {
      value: explicit,
      derivation: {
        decidedBy: "engine",
        rule: `explicit decision: ${opts.explicitKey} = ${explicit}`,
        triggeredByFactKeys: [],
        triggeredByDecisionKeys: [opts.explicitKey],
      },
    };
  }
  const fallbacks = opts.fallbacks ?? [];
  for (const fb of fallbacks) {
    if (fb.value === true) {
      return {
        value: true,
        derivation: {
          decidedBy: "engine",
          rule: fb.rule,
          triggeredByFactKeys: fb.triggeredByFactKeys ?? [],
          triggeredByDecisionKeys: fb.triggeredByDecisionKeys ?? [],
        },
      };
    }
  }
  if (fallbacks.length > 0) {
    return {
      value: false,
      derivation: {
        decidedBy: "engine",
        rule: "no triggering signal (no explicit decision; all fallback signals absent)",
        triggeredByFactKeys: [],
        triggeredByDecisionKeys: [],
      },
    };
  }
  return { value: undefined, derivation: undefined };
}

/*
 * Shared fallback pair for Form 8949 and Schedule D: trade facts win when
 * present (the more specific signal); has_reportable_sales is the safety
 * net.
 */
function reportableSalesFallbacks(inputs: ResolverInputs): MustFileFallback[] {
  const tradeCount = inputs.trades.short.length + inputs.trades.long.length;
  return [
    {
      rule: `fallback: ${tradeCount} trade fact(s) present`,
      value: tradeCount > 0,
      triggeredByFactKeys: inputs.trades.factKeys,
    },
    {
      rule: "fallback: decisions.scope.has_reportable_sales = true",
      value: inputs.decisionByKey.get("decisions.scope.has_reportable_sales") === true,
      triggeredByDecisionKeys: ["decisions.scope.has_reportable_sales"],
    },
  ];
}

// ─── Per-form resolvers ──────────────────────────────────────────────────

export function resolveBaseInfo(inputs: ResolverInputs): BaseFilingInfo {
  const filingStatusRaw = inputs.decisionByKey.get("decisions.scope.filing_status");
  const filingStatus =
    filingStatusRaw === "single" ||
    filingStatusRaw === "married_filing_jointly" ||
    filingStatusRaw === "married_filing_separately" ||
    filingStatusRaw === "head_of_household" ||
    filingStatusRaw === "qualifying_surviving_spouse"
      ? filingStatusRaw
      : undefined;

  const ssnRaw = text(inputs, "identity.ssn");
  const phoneRaw = text(inputs, "identity.phone");

  return {
    filingStatus,
    taxpayerFirstName: text(inputs, "identity.name.first"),
    taxpayerMiddleInitial: text(inputs, "identity.name.middle_initial"),
    taxpayerLastName: text(inputs, "identity.name.last"),
    /*
     * The constructors strip separators and validate the digit count.
     * The FilingInfo slot stores bare digits.
     */
    taxpayerSSN: ssnRaw ? ssn(ssnRaw) : undefined,
    taxpayerDateOfBirth: text(inputs, "identity.dob"),
    taxpayerOccupation: text(inputs, "identity.occupation"),
    taxpayerPhone: phoneRaw ? phone(phoneRaw) : undefined,
    taxpayerEmail: text(inputs, "identity.email"),
    homeAddressLine1: text(inputs, "identity.address.street"),
    homeAddressApt: text(inputs, "identity.address.apt"),
    homeAddressCity: text(inputs, "identity.address.city"),
    homeAddressState: text(inputs, "identity.address.state"),
    homeAddressZip: text(inputs, "identity.address.zip"),
    homeAddressCounty: text(inputs, "identity.address.county"),
    fullYearMEC: inputs.factByKey.get("health_coverage.full_year_mec") as boolean | undefined,
  };
}

/*
 * 1099-INT sums: box1 (taxable) and box8 (tax-exempt). The filter pins
 * each aggregate to its source section, because future 1099 sections
 * (OID, MISC) may reuse low-number box names. When the taxpayer has NO
 * interest facts at all, the slots stay undefined rather than 0. The
 * renderer then leaves the cells blank instead of writing "0", which
 * matches the CPA-golden convention.
 */
function resolveInterestSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const hasInterest = inputs.facts.some(
    (f) => f.category === "investment_income" && isInterestFactKey(f.key),
  );
  if (!hasInterest) {
    return { taxableInterestTotal: undefined, taxExemptInterestTotal: undefined };
  }
  return {
    taxableInterestTotal: sumInvestmentBox(
      inputs,
      "box1",
      isInterestFactKey,
    ) as Form1040FilingInfo["taxableInterestTotal"],
    taxExemptInterestTotal: sumInvestmentBox(
      inputs,
      "box8",
      isInterestFactKey,
    ) as Form1040FilingInfo["taxExemptInterestTotal"],
  };
}

export function resolve1040Info(inputs: ResolverInputs): Form1040FilingInfo {
  const { decisionByKey } = inputs;
  const mustFile = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_federal",
  });
  const itemizeDecision = decisionByKey.get("decisions.itemize_vs_standard");
  return {
    mustFileFederal: mustFile.value as Form1040FilingInfo["mustFileFederal"],
    mustFileFederalDerivation: mustFile.derivation,
    hasDigitalAssets: decisionByKey.get("decisions.scope.has_digital_assets") as
      boolean | undefined,
    w2WagesTotal: sumW2Box(inputs, "box1") as Form1040FilingInfo["w2WagesTotal"],
    w2FederalWithholding: sumW2Box(inputs, "box2") as Form1040FilingInfo["w2FederalWithholding"],
    qualifiedDividends: sumInvestmentBox(
      inputs,
      "box1b",
    ) as Form1040FilingInfo["qualifiedDividends"],
    ordinaryDividends: sumInvestmentBox(inputs, "box1a") as Form1040FilingInfo["ordinaryDividends"],
    form1099FederalWithholding: sumInvestmentBox(
      inputs,
      "box4",
    ) as Form1040FilingInfo["form1099FederalWithholding"],
    ...resolveInterestSlots(inputs),
    refundFullOverpaymentFederal: decisionByKey.get(
      "decisions.refund.refund_full_overpayment_federal",
    ) as boolean | undefined,
    useItemizedDeductions:
      itemizeDecision === "itemized" ? true : itemizeDecision === "standard" ? false : undefined,
  };
}

export function resolve540Info(inputs: ResolverInputs): Form540FilingInfo {
  const { decisionByKey, factByKey } = inputs;
  const mustFile = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_ca_540",
  });
  return {
    mustFileCA540: mustFile.value as Form540FilingInfo["mustFileCA540"],
    mustFileCA540Derivation: mustFile.derivation,
    caResidencyStatus: decisionByKey.get("decisions.scope.ca_residency") as string | undefined,
    w2StateWages: sumW2Box(inputs, "box16") as Form540FilingInfo["w2StateWages"],
    w2StateWithholding: sumW2Box(inputs, "box17") as Form540FilingInfo["w2StateWithholding"],
    w2CaSdiTotal: sumCaSdi(factsInCategory(inputs, "wages")) as Form540FilingInfo["w2CaSdiTotal"],
    useTaxOwed:
      typeof factByKey.get("use_tax.owed_amount") === "number"
        ? (factByKey.get("use_tax.owed_amount") as Form540FilingInfo["useTaxOwed"])
        : undefined,
    noUseTaxOwed:
      decisionByKey.get("decisions.scope.use_tax_zero_reason") === "no_use_tax_owed"
        ? true
        : undefined,
    useTaxZeroReason: (() => {
      const v = decisionByKey.get("decisions.scope.use_tax_zero_reason");
      return typeof v === "string" ? v : undefined;
    })(),
    mailingSameAsResidence: decisionByKey.get(
      "decisions.scope.mailing_same_as_principal_residence",
    ) as boolean | undefined,
    refundFullOverpaymentCA: decisionByKey.get("decisions.refund.refund_full_overpayment_ca") as
      boolean | undefined,
  };
}

/*
 * Default: file Schedule CA whenever Form 540 is filed. An explicit
 * `decisions.scope.must_file_schedule_ca` overrides the default. Set it
 * false on scenarios that do not need the schedule (for example Alex: no
 * adjustments to report).
 */
export function resolveScheduleCaInfo(inputs: ResolverInputs): ScheduleCaFilingInfo {
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_ca",
    fallbacks: [
      {
        rule: "fallback: must_file_ca_540 = true",
        value: inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true,
        triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
      },
    ],
  });
  return {
    mustFileScheduleCA: r.value as ScheduleCaFilingInfo["mustFileScheduleCA"],
    mustFileScheduleCADerivation: r.derivation,
  };
}

/*
 * Default: required when trade facts exist to itemize, OR when the 1099
 * ingest recorded `has_reportable_sales = true`. Either signal indicates
 * capital-asset sales that need row-level reporting.
 */
export function resolve8949Info(inputs: ResolverInputs): Form8949FilingInfo {
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8949",
    fallbacks: reportableSalesFallbacks(inputs),
  });
  return {
    mustFile8949: r.value as Form8949FilingInfo["mustFile8949"],
    mustFile8949Derivation: r.derivation,
    shortTermTrades: inputs.trades.short,
    longTermTrades: inputs.trades.long,
  };
}

/*
 * Default: required whenever Form 8949 is required, because Schedule D
 * summarizes the per-row 8949 totals. It also fires for capital-gain
 * distributions without 8949. The same trade-fact / decision signals
 * cover both cases.
 */
export function resolveScheduleDInfo(inputs: ResolverInputs): ScheduleDFilingInfo {
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_d",
    fallbacks: reportableSalesFallbacks(inputs),
  });
  return {
    mustFileScheduleD: r.value as ScheduleDFilingInfo["mustFileScheduleD"],
    mustFileScheduleDDerivation: r.derivation,
  };
}

/*
 * Default: required when Medicare wages exceed $200,000. That is the
 * single-filer threshold, which the IRS also uses as the
 * employer-withholding cut-line. Other statuses have different
 * thresholds, but this conservative fallback catches every case where
 * the form COULD be required. An explicit `decisions.scope.must_file_8959`
 * wins when set.
 */
export function resolve8959Info(inputs: ResolverInputs): Form8959FilingInfo {
  const medicareWages = sumW2Box(inputs, "box5");
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8959",
    fallbacks: [
      {
        rule: `fallback: W-2 box 5 (Medicare wages) sum $${medicareWages} > $200,000`,
        value: medicareWages > 200000,
      },
    ],
  });
  return {
    mustFile8959: r.value as Form8959FilingInfo["mustFile8959"],
    mustFile8959Derivation: r.derivation,
    w2MedicareWagesTotal: medicareWages as Form8959FilingInfo["w2MedicareWagesTotal"],
    w2MedicareTaxWithheld: sumW2Box(inputs, "box6") as Form8959FilingInfo["w2MedicareTaxWithheld"],
  };
}

/*
 * Default: required when decisions.itemize_vs_standard chose itemized.
 * An explicit `decisions.scope.must_file_schedule_a` wins when set.
 * State-local income tax composes from existing W-2 sums (box 17 + CA
 * SDI); the other slots are single-fact reads.
 */
export function resolveScheduleAInfo(inputs: ResolverInputs): ScheduleAFilingInfo {
  const { decisionByKey } = inputs;
  const r = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_a",
    fallbacks: [
      {
        rule: "fallback: decisions.itemize_vs_standard = itemized",
        value: decisionByKey.get("decisions.itemize_vs_standard") === "itemized",
        triggeredByDecisionKeys: ["decisions.itemize_vs_standard"],
      },
    ],
  });
  const w2Box17 = sumW2Box(inputs, "box17");
  const caSdi = sumCaSdi(factsInCategory(inputs, "wages"));
  const estStateTax = num(inputs, "state_local_tax.estimated_payments");
  return {
    mustFileScheduleA: r.value as ScheduleAFilingInfo["mustFileScheduleA"],
    mustFileScheduleADerivation: r.derivation,
    medicalDentalExpenses: num(inputs, "medical.expenses_total"),
    stateLocalIncomeTaxPaid: w2Box17 + caSdi + (estStateTax ?? 0),
    generalSalesTaxElection: decisionByKey.get("decisions.itemized.elect_general_sales_tax") as
      boolean | undefined,
    realEstateTaxes: num(inputs, "state_local_tax.real_estate"),
    personalPropertyTaxes: num(inputs, "state_local_tax.personal_property"),
    mortgageInterestForm1098: num(inputs, "mortgage.interest_form_1098"),
    mortgageInterestNotForm1098: num(inputs, "mortgage.interest_not_form_1098"),
    pointsNotForm1098: num(inputs, "mortgage.points_not_form_1098"),
    investmentInterest: num(inputs, "investment_income.investment_interest_expense"),
    giftsCashCheck: num(inputs, "charitable.cash"),
    giftsOtherThanCash: num(inputs, "charitable.noncash"),
    giftsCarryover: num(inputs, "charitable.carryover"),
  };
}
