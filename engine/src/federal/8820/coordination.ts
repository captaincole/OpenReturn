/*
 * Form 8820 next to Form 6765 on one business: "Qualified clinical testing
 * expenses used to figure the orphan drug credit cannot also be used to figure
 * the credit for increasing research activities"
 * (irs-8820-form-2025::sec::coordination-with-the::b01; section 45C(c)(1)).
 * Both facts state totals, so the engine cannot see which dollars each one
 * counts. It can see one case: the business deducts both kinds of expense on
 * the same Schedule C line, and the line is smaller than the two amounts
 * together. Then some dollars are in both (or one of them is not deducted on
 * that line), the facts cannot tell which, and Form 6765 line 28 is a gap
 * (6765/resolveInfo.ts) with no research reduction on Schedule C. This file
 * reads only facts, so the facts layer can call it.
 */

import { statedBusinessesOnReturn } from "../../facts/kinds/business.js";
import { readOrphanDrugCreditFact } from "../../facts/kinds/orphanDrugCredit.js";
import { readResearchCreditFact } from "../../facts/kinds/researchCredit.js";
import { sum } from "../../money.js";
import { paidByCategory } from "../6765/qualifiedExpenses.js";
import { REDUCTION_ORDER as RESEARCH_ORDER } from "../6765/reduction.js";
import { REDUCTION_ORDER as CLINICAL_ORDER } from "./reduction.js";

type FactRow = { key: string; value: unknown; category: string };

/* The Schedule C line names of the gap, as a reader knows them. */
const LINE_NAMES: Readonly<Record<string, string>> = {
  wages: "line 26 (wages)",
  supplies: "line 22 (supplies)",
  rentVehiclesMachinery: "line 20a (machinery rent)",
  contractLabor: "line 11 (contract labor)",
};

/*
 * Why Form 6765 cannot take its research expenses as stated next to the
 * orphan drug credit of the same business; undefined when the facts do not
 * show an overlap (or the two credits are on different businesses).
 */
export function clinicalAndResearchOverlapGap(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): string | undefined {
  const clinical = readOrphanDrugCreditFact(facts).fact?.value;
  const research = readResearchCreditFact(facts).fact?.value;
  if (clinical === undefined || research === undefined) return undefined;
  if (clinical.businessKey !== research.businessKey) return undefined;
  const business = statedBusinessesOnReturn(facts, joint).businesses.find(
    (each) => each.key === clinical.businessKey,
  );
  if (business === undefined) return undefined;
  const paid = paidByCategory(research.expenses, research.businessComponents);
  const lines = CLINICAL_ORDER.filter(({ line, kind }) => {
    const category = RESEARCH_ORDER.find((each) => each.line === line)?.category;
    const testing = sum(clinical.expenses[kind]);
    const researched = category === undefined ? 0 : paid[category];
    const deducted = sum(business.value.expenses?.[line]);
    return testing > 0 && researched > 0 && testing + researched > deducted;
  }).map(({ line }) => LINE_NAMES[line]);
  if (lines.length === 0) return undefined;
  return `The business's Schedule C ${lines.join(", ")} is less than its clinical testing expenses (Form 8820) and its research expenses (Form 6765) together, so some of the same expenses are in both. "Qualified clinical testing expenses used to figure the orphan drug credit cannot also be used to figure the credit for increasing research activities" (irs-8820-form-2025::sec::coordination-with-the::b01): state the research expenses without the clinical testing expenses.`;
}
