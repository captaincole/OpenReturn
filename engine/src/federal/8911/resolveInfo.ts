import {
  getRefuelingPropertyFacts,
  readK1Facts,
  type K1Form,
  type RefuelingPropertyFact,
  type RefuelingPropertyFactValue,
} from "../../facts/index.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8911FilingInfo, RefuelingScheduleA } from "./filingInfo.js";
import {
  FULL_BUSINESS_USE,
  LAST_PLACED_IN_SERVICE_DATE,
  businessUsePercentage,
  constructionBeforePwaRules,
  scheduleALines,
} from "./lines.js";

/* Line 5 of a 2025 Schedule A: placed in service during the tax year (qualified-alternative-fuel-vehicle::b01). */
const TAX_YEAR_PREFIX = "2025-";

/* Form 8911 line 2: code AO in Form 1065 box 15 and Form 1120-S box 13 (irs-8911-inst-2025::sec::line-2::b01). */
const K1_CREDIT_BOX: Readonly<Partial<Record<K1Form, string>>> = { "1065": "15", "1120-S": "13" };
const K1_CREDIT_CODE = "AO";

const placedInService2025 = (property: RefuelingPropertyFactValue) =>
  property.placedInServiceDate.startsWith(TAX_YEAR_PREFIX) &&
  property.placedInServiceDate <= LAST_PLACED_IN_SERVICE_DATE;

const line9Of = (property: RefuelingPropertyFactValue) =>
  businessUsePercentage(property.businessUsePercent, property.businessUseMonths);

/* Schedule A line 10 above 0: a business/investment use part. */
const hasBusinessPart = (property: RefuelingPropertyFactValue) =>
  roundDollars((property.cost * line9Of(property)) / 100) > 0;

/* Below 100% business use, line 17 is asked. */
const asksLine17 = (property: RefuelingPropertyFactValue) => line9Of(property) < FULL_BUSINESS_USE;

/*
 * A property that files a Schedule A: placed in service in 2025, in an eligible
 * census tract (line 6a "No. Stop here"), with a business part or a home that
 * may be the main home (line 17 "No. Stop here" with no business part leaves
 * nothing to claim).
 */
const claimsCredit = (property: RefuelingPropertyFactValue) =>
  placedInService2025(property) &&
  property.eligibleCensusTract === true &&
  (hasBusinessPart(property) || (asksLine17(property) && property.mainHome !== false));

/* Line 13: "Yes" without the test when construction began before January 29, 2023. */
const line13Of = (property: RefuelingPropertyFactValue) =>
  constructionBeforePwaRules(property.constructionBeganDate) ? true : property.meetsPwaRequirements;

function scheduleAOf(fact: RefuelingPropertyFact): RefuelingScheduleA {
  const property = fact.value;
  const line13 = hasBusinessPart(property) ? line13Of(property) : false;
  const line17 = asksLine17(property) ? property.mainHome : false;
  if (line13 === undefined || line17 === undefined) return { factKey: fact.key };
  const lines = scheduleALines({
    cost: property.cost,
    businessUsePercent: property.businessUsePercent,
    businessUseMonths: property.businessUseMonths,
    section179Deduction: property.section179Deduction,
    line13,
    line17,
  });
  return { factKey: fact.key, lines };
}

/* The code AO credits of every K-1, cents kept; undefined with none. */
export function refuelingK1Credit(inputs: ResolverInputs): number | undefined {
  const amounts = readK1Facts(inputs.facts).k1s.flatMap(({ value }) =>
    value.boxes
      .filter((box) => box.box === K1_CREDIT_BOX[value.form] && box.code === K1_CREDIT_CODE)
      .map((box) => box.amount),
  );
  return sumOrBlank(...amounts);
}

const propertiesClaiming = (inputs: ResolverInputs) =>
  getRefuelingPropertyFacts(inputs.facts).filter((fact) => claimsCredit(fact.value));

/*
 * Who files: a taxpayer who placed refueling property in service in 2025
 * (irs-8911-inst-2025::sec::general-instructions::b01). A credit only from a
 * partnership or S corporation needs no Form 8911: it can go straight to Form
 * 3800 line 1s. The explicit decision still wins. A form that ends with no
 * credit on line 3 or line 10 leaves the return (filesOnlyWithAmountOn,
 * bindings.ts): "do not file this form unless you are claiming a credit on line 3".
 */
export function resolve8911Info(inputs: ResolverInputs): Form8911FilingInfo {
  const properties = propertiesClaiming(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8911",
    fallbacks: [
      {
        rule: `fallback: ${properties.length} refueling property item(s) placed in service in 2025 in an eligible census tract`,
        value: properties.length > 0,
        triggeredByFactKeys: properties.map((fact) => fact.key),
      },
    ],
  });
  const filed = { mustFile: { "form-8911": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8911": [] } };
  const schedulesA = properties.map(scheduleAOf);
  return {
    ...filed,
    // A property waits while line 13 or line 17 has no answer: the fact is asked again.
    missingInputs: {
      "form-8911": schedulesA.filter((sheet) => !sheet.lines).map((sheet) => sheet.factKey),
    },
    refuelingSchedulesA: schedulesA,
    refuelingK1Credit: refuelingK1Credit(inputs),
  };
}

/* Schedule 3 line 6j and Form 6251: a property at the main home with a personal use part. */
export function refuelingPersonalPart(inputs: ResolverInputs): boolean {
  if (resolve8911Info(inputs).mustFile?.["form-8911"]?.value !== true) return false;
  return propertiesClaiming(inputs).some(
    (fact) => asksLine17(fact.value) && fact.value.mainHome === true,
  );
}

/*
 * A general business credit for Form 3800: a property with a business part
 * (line 3, "report this amount on Form 3800, Part III, line 1s"), or a K-1 code
 * AO credit, which goes there with or without Form 8911 (line-2::b01).
 */
export function refuelingBusinessCredit(inputs: ResolverInputs): boolean {
  if ((refuelingK1Credit(inputs) ?? 0) > 0) return true;
  if (resolve8911Info(inputs).mustFile?.["form-8911"]?.value !== true) return false;
  return propertiesClaiming(inputs).some((fact) => hasBusinessPart(fact.value));
}
