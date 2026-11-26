/*
 * The gross income test for farmers and fishermen: "You are a farmer or
 * fisherman if at least two-thirds of your 2024 or 2025 gross income is from
 * farming or fishing" (ca-5805f-inst-2025::sec::b-qualifications::b01; the
 * federal rule is the same, irs-pub-505-2025::sec::farming-and-fishing::b01).
 * One fact per year, category self_employment. The taxpayer states both
 * amounts, figured as Pub. 505 and Pub. 225 say:
 *
 * - Gross income from all sources is the total of the income (not loss)
 *   amounts on the return; on a joint return both spouses' amounts
 *   (irs-pub-225-2025::sec::qualified-farmer::b02, b03).
 * - Gross income from farming is Schedule F line 9, Form 4835 line 7, the
 *   farm income on a Schedule K-1, and gains from sales of draft, breeding,
 *   dairy or sporting livestock; not farm wages, contract harvesting or the
 *   sale of farmland. Gross income from fishing is Schedule C line 7 of a
 *   fishing business, crew pay on a fishing vessel and the other items of
 *   irs-pub-505-2025::sec::farming-and-fishing::b02, b03.
 */

type FactRow = { key: string; value: unknown; category: string };

export const FARMER_OR_FISHERMAN_KEYS = {
  grossIncome2024: "farmer_or_fisherman.gross_income_2024",
  grossIncome2025: "farmer_or_fisherman.gross_income_2025",
} as const;

export interface FarmerGrossIncomeFactValue {
  /* Gross income from all sources, the income (not loss) amounts. */
  totalGrossIncome: number;
  /* The part of it from farming or fishing. */
  farmingOrFishingGrossIncome: number;
}

export interface FarmerGrossIncomeFact {
  key: string;
  value: FarmerGrossIncomeFactValue;
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function isFarmerGrossIncome(value: unknown): value is FarmerGrossIncomeFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fact = value as Partial<FarmerGrossIncomeFactValue>;
  return isAmount(fact.totalGrossIncome) && isAmount(fact.farmingOrFishingGrossIncome);
}

/* The 2024 and 2025 facts that are recorded and well formed. */
export function getFarmerGrossIncomeFacts(facts: ReadonlyArray<FactRow>): FarmerGrossIncomeFact[] {
  const keys: string[] = Object.values(FARMER_OR_FISHERMAN_KEYS);
  return facts
    .filter((row) => keys.includes(row.key) && isFarmerGrossIncome(row.value))
    .map((row) => ({ key: row.key, value: row.value as FarmerGrossIncomeFactValue }));
}
