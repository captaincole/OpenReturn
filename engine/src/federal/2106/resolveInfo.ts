import {
  getEmployeeBusinessExpensesFacts,
  isW2FactKey,
  type EmployeeBusinessExpensesFact,
  type EmployeeBusinessExpensesFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  filingStatusOf,
  resolveMustFile,
  w2Owner,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form2106Copy, Form2106FilingInfo, Form2106Totals } from "./filingInfo.js";
import { impairmentShare, mealsRate, partILines, reservistLimit } from "./lines.js";
import { performingArtistTests } from "./performingArtist.js";
import { line22, vehicleLines, VEHICLES_PER_PAGE, type VehicleLines } from "./vehicle.js";

/* W-2 box 12 code L: substantiated employee business expense reimbursements (irs-2106-inst-2025::sec::line-7::b01). */
const REIMBURSEMENT_CODE = "L";

const ONE_COPY =
  "Each person files a Form 2106 for each occupation; the engine prints one copy, so a return with more than one needs a preparer for the forms.";
const MORE_VEHICLES =
  "More than two vehicles need a second Form 2106, page 2 (irs-2106-inst-2025::sec::section-a-general-information::b01), which the engine does not print.";
const CODE_L_UNSPLIT =
  "A W-2 box 12 code L reimbursement belongs on line 7 (irs-2106-inst-2025::sec::line-7::b01), but the expenses do not say how it splits between meals and other expenses.";
const PER_DIEM =
  "A reservist's lodging or meals need the regular federal per diem for the reserve travel days: Schedule 1 line 12 is limited to it (irs-2106-inst-2025::sec::line-10::b01).";
const LODGING =
  "A reservist's line 3 does not say how much is lodging: the per diem limit covers lodging, not fares (irs-2106-inst-2025::sec::line-10::b01).";

interface OwnerW2 {
  wages: number;
  codeL: number;
}

/* The owner's W-2 box 1 wages and box 12 code L total, cents kept. */
function ownerW2(inputs: ResolverInputs, owner: "taxpayer" | "spouse"): OwnerW2 {
  const w2s = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => row.value as W2FactValue)
    .filter((w2) => w2Owner(inputs, w2) === owner);
  const codeL = w2s
    .flatMap((w2) => w2.box12 ?? [])
    .filter((entry) => entry.code.toUpperCase() === REIMBURSEMENT_CODE);
  return {
    wages: sum(...w2s.map((w2) => w2.box1)),
    codeL: sum(...codeL.map((each) => each.amount)),
  };
}

/* One form's figures: the printed copy and its share of each total. */
interface Figured {
  copy: Form2106Copy;
  files: boolean;
  parts: Form2106Totals;
}

/* Part II's columns, or why they cannot be figured. */
function vehicleColumns(fact: EmployeeBusinessExpensesFactValue, wages: number) {
  const vehicles = fact.vehicles ?? [];
  if (vehicles.length > VEHICLES_PER_PAGE) return MORE_VEHICLES;
  const columns = vehicles.map((vehicle) => vehicleLines(vehicle, wages));
  return (
    columns.find((column): column is string => typeof column === "string") ??
    (columns as VehicleLines[])
  );
}

/*
 * Who files (irs-2106-inst-2025::sec::general-instructions::b01–b03, the
 * flowchart): a person in one of the four groups whose expenses are more than
 * the reimbursements not in box 1. "If line 4 is your only entry, don't complete
 * Form 2106 unless you are claiming" performing-arts, fee-basis or
 * impairment-related expenses (::line-4::b01): a reservist with only line 4
 * does not file.
 */
function filesForm(fact: EmployeeBusinessExpensesFactValue, copy: Form2106Copy): boolean {
  const { partI } = copy;
  const expenses = partI.line6a + (partI.line6b ?? 0);
  const reimbursed = (partI.line7a ?? 0) + (partI.line7b ?? 0);
  const onlyLine4 = !partI.line1 && !partI.line2 && !partI.line3 && !partI.line5;
  if (fact.qualification === "armed_forces_reservist" && onlyLine4) return false;
  return expenses > reimbursed;
}

/* Schedule 1 line 12's part for a reservist: line 10 less the impairment share, up to the limit. */
function reservistPart(fact: EmployeeBusinessExpensesFactValue, copy: Form2106Copy, rest: number) {
  const lodging = fact.lodging;
  const meals = fact.meals ?? 0;
  if ((copy.partI.line3 ?? 0) > 0 && lodging === undefined) return LODGING;
  const needsPerDiem = (lodging ?? 0) > 0 || meals > 0;
  if (
    needsPerDiem &&
    (fact.federalPerDiemLodging === undefined || fact.federalPerDiemMeals === undefined)
  ) {
    return PER_DIEM;
  }
  const limit = reservistLimit({
    lines: copy.partI,
    vehicles: copy.vehicles,
    line22: copy.line22,
    lodging: lodging ?? 0,
    meals,
    perDiemLodging: fact.federalPerDiemLodging ?? 0,
    perDiemMeals: fact.federalPerDiemMeals ?? 0,
    mealsRate: mealsRate(fact),
  });
  return Math.min(rest, limit);
}

/* Line 10's parts by where each goes (irs-2106-inst-2025::sec::line-10::b01–b04), or a gap. */
function partsOf(
  fact: EmployeeBusinessExpensesFactValue,
  copy: Form2106Copy,
  inputs: ResolverInputs,
) {
  const impairment = impairmentShare(fact, copy.partI);
  const rest = (copy.partI.line10 ?? 0) - impairment;
  const parts = {
    scheduleOne: 0,
    performingArts: 0,
    impairment,
    excessReimbursement: copy.partI.excessReimbursement ?? 0,
    depreciation: copy.vehicles.some((vehicle) => (vehicle.sectionC?.line28 ?? 0) > 0),
    qualifies: true,
  };
  if (fact.qualification === "fee_basis_official") return { ...parts, scheduleOne: rest };
  if (fact.qualification === "armed_forces_reservist") {
    const part = reservistPart(fact, copy, rest);
    return typeof part === "string" ? part : { ...parts, scheduleOne: part };
  }
  if (fact.qualification === "qualified_performing_artist") {
    const passes = performingArtistTests(fact, rest, filingStatusOf(inputs));
    if (typeof passes === "string") return passes;
    // A performing artist who fails tests 1–3 is not one of the four groups: no form (line-10::b02).
    return { ...parts, performingArts: passes ? rest : 0, qualifies: passes };
  }
  return parts;
}

/* One fact's form, or why it cannot be figured. */
function figure(fact: EmployeeBusinessExpensesFactValue, inputs: ResolverInputs): Figured | string {
  const w2 = ownerW2(inputs, fact.owner);
  if (w2.codeL > 0 && fact.reimbursements === undefined) return CODE_L_UNSPLIT;
  const columns = vehicleColumns(fact, w2.wages);
  if (typeof columns === "string") return columns;
  const standard = line22(columns);
  const vehicleExpense =
    columns.length === 0
      ? undefined
      : sum(standard, ...columns.map((each) => each.sectionC?.line29));
  const copy: Form2106Copy = {
    owner: fact.owner,
    occupation: fact.occupation,
    partI: partILines({ ...fact, vehicleExpense, mealsRate: mealsRate(fact) }),
    vehicles: columns,
    line22: standard,
    vehicleAvailableOffDuty: fact.vehicleAvailableOffDuty,
    anotherVehicleAvailable: fact.anotherVehicleAvailable,
    hasEvidence: fact.hasEvidence,
    evidenceIsWritten: fact.evidenceIsWritten,
  };
  const parts = partsOf(fact, copy, inputs);
  if (typeof parts === "string") return parts;
  const { qualifies, ...totals } = parts;
  return { copy, files: qualifies && filesForm(fact, copy), parts: totals };
}

/* The totals of every form that files. */
function totalsOf(figured: ReadonlyArray<Figured>): Form2106Totals {
  const filed = figured.filter((each) => each.files).map((each) => each.parts);
  return {
    scheduleOne: sum(...filed.map((each) => each.scheduleOne)),
    performingArts: sum(...filed.map((each) => each.performingArts)),
    impairment: sum(...filed.map((each) => each.impairment)),
    excessReimbursement: sum(...filed.map((each) => each.excessReimbursement)),
    depreciation: filed.some((each) => each.depreciation),
  };
}

/* A fact files unless its figures say it does not; a fact with a gap files (its lines are unsupported). */
const factFiles = (figured: Figured | string) => typeof figured === "string" || figured.files;

/*
 * Who files: the explicit decision, else a fact whose expenses the form deducts
 * (filesForm). The printed copy is the return's one form.
 */
export function resolve2106Info(inputs: ResolverInputs): Form2106FilingInfo {
  const facts: EmployeeBusinessExpensesFact[] = getEmployeeBusinessExpensesFacts(inputs.facts);
  const figured = facts.map((fact) => figure(fact.value, inputs));
  const filing = facts.filter((_, index) => factFiles(figured[index]!));
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_2106",
    fallbacks: [
      {
        rule: `fallback: ${filing.length} Form 2106 fact(s) with deductible expenses`,
        value: filing.length > 0,
        triggeredByFactKeys: filing.map((fact) => fact.key),
      },
    ],
  });
  const filed = { mustFile: { "form-2106": mustFile } };
  if (mustFile.value !== true || filing.length === 0) return filed;
  const gap = figured.find((each): each is string => typeof each === "string");
  const forms = figured.filter((each): each is Figured => typeof each !== "string" && each.files);
  return {
    ...filed,
    form2106: filing.length === 1 && !gap ? forms[0]?.copy : undefined,
    form2106Gap: filing.length > 1 ? ONE_COPY : gap,
    form2106Totals: gap ? undefined : totalsOf(forms),
    form2106TotalsGap: gap,
  };
}
