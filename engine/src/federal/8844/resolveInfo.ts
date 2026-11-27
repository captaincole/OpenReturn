import {
  empowermentZoneFigures,
  getEmpowermentZoneEmployeeFacts,
  type BusinessFactValue,
  type EmpowermentZoneFigures,
  type FarmFactValue,
} from "../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8844Employer, Form8844Figures, Form8844FilingInfo } from "./filingInfo.js";
import { countedWagesOf } from "./lines.js";

const UNKNOWN_EMPLOYER_GAP =
  "An empowerment zone employee fact names no Schedule C business or Schedule F farm of the return (employerKey), and the engine lowers the wage deduction only there (irs-8844-inst-2025::sec::line-2::b01).";
const WAGES_ABOVE_DEDUCTION_GAP =
  "The qualified zone wages of a business or farm are more than the wages it deducts (Schedule C line 26 or Schedule F line 22), so the line 2 credit cannot reduce that deduction (irs-8844-inst-2025::sec::line-2::b01).";

/* The business or farm fact of an employer key (empowermentZoneFigures found it on the return). */
function activityOf(inputs: ResolverInputs, key: string): BusinessFactValue | FarmFactValue {
  const row = inputs.facts.find((fact) => fact.key === key);
  return row?.value as BusinessFactValue | FarmFactValue;
}

/* The wages the activity deducts: Schedule C line 26 or Schedule F line 22, before the credit. */
function deductedWagesOf(activity: BusinessFactValue | FarmFactValue): number | undefined {
  const expenses = activity.expenses as { wages?: number; laborHired?: number } | undefined;
  return "grossReceipts" in activity ? expenses?.wages : expenses?.laborHired;
}

function employersOf(inputs: ResolverInputs, figures: EmpowermentZoneFigures): Form8844Employer[] {
  return [...figures.creditByEmployer].map(([key, credit]) => {
    const activity = activityOf(inputs, key);
    const name = ("name" in activity && activity.name) || activity.activity;
    return { key, name, credit, passive: activity.materiallyParticipated === false };
  });
}

/* An employer whose counted zone wages are more than the wages it deducts. */
function wagesAboveDeduction(inputs: ResolverInputs, figures: EmpowermentZoneFigures): boolean {
  return [...figures.creditByEmployer.keys()].some((key) => {
    const counted = figures.employees
      .filter((employee) => employee.value.employerKey === key)
      .reduce((total, employee) => total + countedWagesOf(employee.value), 0);
    return counted > (deductedWagesOf(activityOf(inputs, key)) ?? 0);
  });
}

/* Lines 1 and 2 and the employers' shares, or the gap that stops them. */
export function form8844FiguresOf(inputs: ResolverInputs): Form8844Figures {
  const status = filingStatusOf(inputs);
  const figures = empowermentZoneFigures(
    inputs.facts,
    status === undefined || status === "married_filing_jointly",
  );
  let gap: Unsupported | undefined;
  if (figures.unknownEmployerKeys.length > 0) gap = unsupported(UNKNOWN_EMPLOYER_GAP);
  else if (wagesAboveDeduction(inputs, figures)) gap = unsupported(WAGES_ABOVE_DEDUCTION_GAP);
  if (gap) return { line1: gap, line2: gap, employers: [] };
  return { line1: figures.line1, line2: figures.line2, employers: employersOf(inputs, figures) };
}

/*
 * Who files: "Partnerships and S corporations must file this form to claim the
 * credit. All others are generally not required to complete or file this form
 * if their only source for this credit is a partnership, S corporation,
 * estate, trust, or cooperative" (irs-8844-inst-2025::sec::general-instructions::b01).
 * So an individual files it for the wages of the employees of his own
 * business or farm: line 1 above 0, or a gap that stops it. A K-1 credit
 * alone goes straight to Form 3800 Part III line 3. The explicit decision
 * still wins.
 */
export function resolve8844Info(inputs: ResolverInputs): Form8844FilingInfo {
  const figures = form8844FiguresOf(inputs);
  const employeeKeys = getEmpowermentZoneEmployeeFacts(inputs.facts).map((each) => each.key);
  const claims = typeof figures.line1 !== "number" || figures.line1 > 0;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8844",
    fallbacks: [
      {
        rule: "fallback: qualified empowerment zone wages paid by the taxpayer's own business or farm (line 1)",
        value: claims,
        triggeredByFactKeys: claims ? employeeKeys : [],
      },
    ],
  });
  const filed = { mustFile: { "form-8844": mustFile }, missingInputs: { "form-8844": [] } };
  return mustFile.value === true ? { ...filed, form8844: figures } : filed;
}
