/*
 * The canceled debt facts read into Form 982's inputs (lines.ts), with the
 * answers still missing and the cases the engine does not figure.
 */

import {
  canceledDebtKeyFor1099C,
  DEBT_RELIEF_KEYS,
  getCanceledDebtFacts,
  getForm1099CFacts,
  readInsolvencyFact,
  readTaxAttributesFact,
  type CanceledDebtFact,
  type Form1099CFactValue,
} from "../../facts/index.js";
import {
  amountOrZero,
  insolvencyAmount,
  NO_ATTRIBUTES,
  type Attributes,
  type DebtInput,
} from "./lines.js";

type FactRow = { key: string; value: unknown; category: string };

export interface DebtsRead {
  debts: DebtInput[];
  /* Form 1099-C facts that no canceled debt fact names: Schedule 1 line 8c waits for them. */
  unanswered1099C: string[];
  /* Answers Form 982 waits for. */
  missing: string[];
  gap?: string;
  insolvency: number;
  attributes: Attributes;
}

const KINDS = new Set([
  "personal",
  "principal_residence",
  "farm",
  "real_property_business",
  "other_business",
]);

const UNKNOWN_1099C = "A canceled debt fact names a Form 1099-C that is not among the facts.";
const INSOLVENT_ON_TWO_DATES =
  "Debts canceled on different dates use the insolvency exclusion; each date needs its own Insolvency Worksheet (irs-pub-4681-2025::sec::insolvency-worksheet::b01), and the engine reads one.";

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/*
 * A nonrecourse debt (not personally liable: the fact's answer, else Form
 * 1099-C box 5 unchecked) is canceled debt income only when the taxpayer keeps
 * the collateral (irs-pub-4681-2025::sec::general-rules::b01). When the lender
 * takes the property, "The entire amount of the nonrecourse debt is treated as
 * an amount realized on the disposition" (sales-or-other-dispositions::b02):
 * "disposed", with no canceled debt income. "missing" while the keep answer is
 * absent; undefined for a recourse debt or kept collateral.
 */
function nonrecourseCollateral(
  fact: CanceledDebtFact,
  form: Form1099CFactValue | undefined,
): "disposed" | "missing" | undefined {
  const value = fact.value;
  const liable = value.personallyLiable ?? form?.box5 ?? true;
  if (liable) return undefined;
  const kept =
    value.kind === "principal_residence"
      ? value.principalResidence?.keepsHome
      : value.keepsCollateral;
  if (typeof kept !== "boolean") return "missing";
  return kept ? undefined : "disposed";
}

/* One debt with its form, or the reason its answers are missing. */
function readDebt(
  fact: CanceledDebtFact,
  form: Form1099CFactValue | undefined,
): DebtInput | "missing" {
  const value = fact.value;
  const amount = isAmount(value.amount) ? value.amount : form?.box2;
  if (!isAmount(amount) || !KINDS.has(value.kind)) return "missing";
  const collateral = nonrecourseCollateral(fact, form);
  if (collateral === "missing") return "missing";
  if (collateral === "disposed") {
    return {
      key: fact.key,
      income: 0,
      kind: value.kind,
      title11Case: false,
      insolventBefore: false,
    };
  }
  if (typeof value.title11Case !== "boolean" || typeof value.insolventBefore !== "boolean") {
    return "missing";
  }
  const income = amountOrZero(amount - (isAmount(value.notIncome) ? value.notIncome : 0));
  const debt: DebtInput = {
    key: fact.key,
    income,
    kind: value.kind,
    title11Case: value.title11Case,
    insolventBefore: value.insolventBefore,
  };
  if (value.title11Case) return debt;
  return withKindAnswers(debt, fact);
}

/* The line 1e or line 1d answers the debt's kind needs. */
function withKindAnswers(debt: DebtInput, fact: CanceledDebtFact): DebtInput | "missing" {
  const residence = fact.value.principalResidence;
  if (debt.kind === "principal_residence") {
    if (!residence || !isAmount(residence.loanBalance) || !isAmount(residence.qualifiedPart)) {
      return "missing";
    }
    if (typeof residence.keepsHome !== "boolean") return "missing";
    if (residence.keepsHome && !isAmount(residence.homeBasis)) return "missing";
    const excluded =
      residence.electsInsolvencyInstead !== true &&
      residence.unrelatedToDeclineOrFinancialCondition !== true;
    return { ...debt, residence: { ...residence, excluded } };
  }
  const property = fact.value.realPropertyBusiness;
  if (debt.kind === "real_property_business") {
    if (
      !property ||
      !isAmount(property.principalBeforeDischarge) ||
      !isAmount(property.propertyValue)
    ) {
      return "missing";
    }
    const otherQualifiedDebt = isAmount(property.otherQualifiedDebt)
      ? property.otherQualifiedDebt
      : 0;
    return { ...debt, realProperty: { ...property, otherQualifiedDebt } };
  }
  return debt;
}

/* The tax attributes with absent amounts as 0. */
function attributesOf(value: unknown): Attributes | undefined {
  const fact = readTaxAttributesFact(value);
  if (fact === undefined) return undefined;
  const amounts = Object.fromEntries(
    Object.entries(NO_ATTRIBUTES)
      .filter(([, base]) => typeof base === "number")
      .map(([key]) => {
        const stated = (fact as Record<string, unknown>)[key];
        return [key, isAmount(stated) ? stated : 0];
      }),
  );
  return {
    ...NO_ATTRIBUTES,
    ...amounts,
    treatRealPropertyForSaleAsDepreciable: fact.treatRealPropertyForSaleAsDepreciable === true,
  };
}

/* A debt that reduces tax attributes: lines 1a to 1d (line 1e reduces only the home's basis). */
const reducesAttributes = (debt: DebtInput) =>
  debt.income > 0 &&
  (debt.title11Case ||
    debt.insolventBefore ||
    debt.kind === "farm" ||
    debt.kind === "real_property_business");

/* The dates of the insolvent debts that have one, from box 1 or the fact. */
function insolventDates(
  facts: CanceledDebtFact[],
  forms: Map<string, Form1099CFactValue>,
): Set<string> {
  const dates = facts
    .filter((fact) => fact.value.insolventBefore === true && fact.value.title11Case !== true)
    .map((fact) => fact.value.date ?? forms.get(fact.value.form1099CKey ?? "")?.box1)
    .filter((date): date is string => typeof date === "string" && date !== "");
  return new Set(dates);
}

/* Every canceled debt on the return, read for Form 982 and Schedule 1 line 8c. */
export function readDebts(
  facts: ReadonlyArray<FactRow>,
  factByKey: Map<string, unknown>,
): DebtsRead {
  const forms = getForm1099CFacts(facts);
  const debtFacts = getCanceledDebtFacts(facts);
  const named = new Set(debtFacts.map((fact) => fact.value.form1099CKey).filter(Boolean));
  const unanswered1099C = [...forms.keys()]
    .filter((key) => !named.has(key))
    .map(canceledDebtKeyFor1099C);
  const gap = debtFacts.some(
    (fact) => fact.value.form1099CKey && !forms.has(fact.value.form1099CKey),
  )
    ? UNKNOWN_1099C
    : insolventDates(debtFacts, forms).size > 1
      ? INSOLVENT_ON_TWO_DATES
      : undefined;
  const read = debtFacts.map((fact) => readDebt(fact, forms.get(fact.value.form1099CKey ?? "")));
  const missing = debtFacts.filter((_, index) => read[index] === "missing").map((fact) => fact.key);
  const debts = read.filter((debt): debt is DebtInput => debt !== "missing");
  const worksheet = readInsolvencyFact(factByKey.get(DEBT_RELIEF_KEYS.insolvency));
  if (debts.some((debt) => debt.insolventBefore && !debt.title11Case) && !worksheet) {
    missing.push(DEBT_RELIEF_KEYS.insolvency);
  }
  const attributes = attributesOf(factByKey.get(DEBT_RELIEF_KEYS.taxAttributes));
  if (debts.some(reducesAttributes) && !attributes) missing.push(DEBT_RELIEF_KEYS.taxAttributes);
  return {
    debts,
    unanswered1099C,
    missing,
    gap,
    insolvency: worksheet
      ? insolvencyAmount(worksheet.totalLiabilities, worksheet.totalAssetsValue)
      : 0,
    attributes: attributes ?? NO_ATTRIBUTES,
  };
}
