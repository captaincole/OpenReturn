import {
  FOREIGN_TAX_CREDIT_KEYS,
  PRIOR_YEAR_KEYS,
  isDividendFactKey,
  isInterestFactKey,
} from "../../facts/index.js";
import { exchangeRateGap, waitsForExchangeRate } from "../../incomeInDollars.js";
import { sum } from "../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { resolve2555Info } from "../2555/resolveInfo.js";
import { receivedOnReturn } from "../passThrough/receipts.js";
import type { ForeignTaxInfo, Form1116CategoryInfo, Form1116FilingInfo } from "./filingInfo.js";
import { electionLimit } from "./lines.js";
import { foreignTaxSources, k1ForeignTax, type ForeignTaxSource } from "./sources.js";

const MUST_FILE_KEY = "decisions.scope.must_file_1116";

const CARRYOVER_KEY = {
  passive: PRIOR_YEAR_KEYS.foreignTaxCarryoverPassive,
  general: PRIOR_YEAR_KEYS.foreignTaxCarryoverGeneral,
} as const;

const OTHER_CATEGORY_GAP =
  "A foreign tax source is in a category other than passive or general (irs-1116-inst-2025::sec::categories-of-income::b01); the engine figures only those two Forms 1116.";
const NO_SOURCE_GAP =
  "Form 1116 files by decision, but no fact holds a foreign tax or foreign-source income (1099-DIV box 7, 1099-INT box 6, a trust K-1's foreign taxes, or a stated foreign tax).";
const EXCLUDED_INCOME_GAP =
  "Form 2555 or Form 4563 files: line 12 takes off the taxes on the excluded income (irs-1116-inst-2025::sec::line-12-2::b01, b02), and the engine does not figure that part.";
const LOSS_ACCOUNT_GAP =
  "An earlier year left a foreign or domestic loss account; line 16 recaptures it (irs-1116-inst-2025::sec::line-16::b06–b13), and the engine has no balances to do it.";
const FORM_5471_GAP =
  "Form 5471 files: line 22 may take a section 960(c) increase (irs-1116-inst-2025::sec::line-22::b01), and the engine has no rules for it.";

/* Forms 4563 and 5471 have no rules: only their must-file decision files them. Form 2555 files from its facts too. */
const decidedToFile = (inputs: ResolverInputs, shortId: string) =>
  shortId === "2555"
    ? resolve2555Info(inputs).mustFile?.["form-2555"]?.value === true
    : inputs.decisionByKey.get(`decisions.scope.must_file_${shortId}`) === true;

/*
 * The election (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b01, b02):
 * all foreign income passive, all of it and its taxes on payee statements, and
 * the creditable taxes no more than the limit. Form 2555 income is general
 * category income, so it ends the election. A stated carryover above 0 does
 * too: the election year cannot use one (part-iii-figuring-the-credit::b03, b04).
 */
function electionApplies(sources: ForeignTaxSource[], inputs: ResolverInputs): boolean {
  const taxes = sum(...sources.map((source) => source.foreignTaxPaid));
  if (taxes <= 0) return false;
  const status = filingStatusOf(inputs) ?? "single";
  return (
    sources.every((source) => source.category === "passive" && source.onPayeeStatement) &&
    taxes <= electionLimit(status) &&
    !decidedToFile(inputs, "2555") &&
    (num(inputs, CARRYOVER_KEY.passive) ?? 0) <= 0
  );
}

function categoriesOf(sources: ForeignTaxSource[], inputs: ResolverInputs): Form1116CategoryInfo[] {
  return (["passive", "general"] as const)
    .map((category) => ({
      category,
      sources: sources.filter((source) => source.category === category),
      carryover: num(inputs, CARRYOVER_KEY[category]),
    }))
    .filter((each) => each.sources.length > 0);
}

/* The answers a filed Form 1116 reads: each category's carryover, the loss accounts, each 1099's statement. */
function requiredAnswers(categories: Form1116CategoryInfo[], inputs: ResolverInputs): string[] {
  const required: Record<string, unknown> = {
    [PRIOR_YEAR_KEYS.foreignLossAccounts]: inputs.factByKey.get(
      PRIOR_YEAR_KEYS.foreignLossAccounts,
    ),
  };
  for (const each of categories) {
    required[CARRYOVER_KEY[each.category]] = each.carryover;
    for (const source of each.sources) {
      if (source.grossIncomeKey) required[source.grossIncomeKey] = undefined;
    }
  }
  return missingInputs(required);
}

/*
 * A 1099-INT or 1099-DIV fact in a foreign currency with no rate yet has no
 * amounts (incomeInDollars.ts): its foreign tax is not known, so the credit waits.
 */
const incomeFacts = (inputs: ResolverInputs) =>
  inputs.facts.filter((fact) => isInterestFactKey(fact.key) || isDividendFactKey(fact.key));

const foreignIncomeWaits = (inputs: ResolverInputs) =>
  incomeFacts(inputs).some((fact) => waitsForExchangeRate(fact.value));

/* One that cannot be converted (an unsupported currency, a rate the tables lack): the credit is a gap. */
const foreignIncomeGap = (inputs: ResolverInputs) =>
  incomeFacts(inputs)
    .map((fact) => exchangeRateGap(fact.value))
    .find((gap) => gap !== undefined);

/* Line h: a home address in a U.S. state is a U.S. resident (own reading, QUESTIONS.md). */
function residentOf(inputs: ResolverInputs): string | undefined {
  const state = inputs.factByKey.get("identity.address.state");
  return typeof state === "string" && state !== "" ? "United States" : undefined;
}

function formGaps(inputs: ResolverInputs, sources: ForeignTaxSource[], filesForm: boolean) {
  const otherCategory = sources.some(
    (source) => source.category !== "passive" && source.category !== "general",
  );
  const excluded = decidedToFile(inputs, "2555") || decidedToFile(inputs, "4563");
  const lossAccounts = inputs.factByKey.get(PRIOR_YEAR_KEYS.foreignLossAccounts) === true;
  return {
    formGap: otherCategory
      ? OTHER_CATEGORY_GAP
      : filesForm && sources.length === 0
        ? NO_SOURCE_GAP
        : undefined,
    line12Gap: excluded ? EXCLUDED_INCOME_GAP : undefined,
    line16Gap: lossAccounts ? LOSS_ACCOUNT_GAP : undefined,
    line22Gap: decidedToFile(inputs, "5471") ? FORM_5471_GAP : undefined,
  };
}

/*
 * Who files (irs-1116-inst-2025::sec::purpose-of-form::b01): a filer who paid
 * a creditable foreign tax and for whom the election does not apply. The
 * election is the default when it applies; the explicit decision wins either
 * way (true files the form instead of the election).
 */
export function resolve1116Info(inputs: ResolverInputs): Form1116FilingInfo {
  // A K-1's foreign taxes (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02).
  const k1 = k1ForeignTax(receivedOnReturn(inputs, "schedule_3_line_1"));
  const sources = foreignTaxSources(inputs.facts, k1);
  const taxed = sources.filter((source) => source.foreignTaxPaid > 0);
  const election = electionApplies(sources, inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${taxed.length} foreign tax source(s); the election ${election ? "applies" : "does not apply"}`,
        value: taxed.length > 0 && !election,
        triggeredByFactKeys: taxed.map((source) => source.factKey),
      },
    ],
  });
  const filesForm = mustFile.value === true;
  const categories = filesForm ? categoriesOf(sources, inputs) : [];
  const foreignTax: ForeignTaxInfo = {
    sources,
    election: !filesForm && election,
    categories,
    claimAccrued: inputs.factByKey.get(FOREIGN_TAX_CREDIT_KEYS.claimAccrued) === true,
    residentOf: residentOf(inputs),
    k1Gap: k1.gap,
    taxesWaiting: k1.waiting || foreignIncomeWaits(inputs),
    currencyGap: foreignIncomeGap(inputs),
    ...formGaps(inputs, sources, filesForm),
  };
  return {
    mustFile: { "form-1116": mustFile },
    missingInputs: { "form-1116": filesForm ? requiredAnswers(categories, inputs) : [] },
    foreignTax,
  };
}
