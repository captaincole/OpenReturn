/*
 * One fact per early distribution (a 1099-R with box 7 code 1 or S) that the
 * taxpayer says an exception covers: the exception's number from the Form 5329
 * instructions and the amount it excludes (Form 5329 line 2,
 * irs-5329-inst-2025::sec::line-2::b01). No 1099-R prints it: the payer's code 1
 * means "no known exception". Absent, the code stands and no part is excluded.
 */

export interface EarlyDistributionExceptionFactValue {
  /* "01" to "23", as the Form 5329 instructions number the exceptions. */
  number: string;
  /* The part of the distribution's taxable amount that the exception excludes. */
  amount: number;
}

/* irs-5329-inst-2025::sec::exceptions-to-the-additional-tax-on-early::b01–b05: exceptions 01 to 23. */
const LAST_EXCEPTION = 23;
export const EARLY_DISTRIBUTION_EXCEPTION_NUMBERS: readonly string[] = Array.from(
  { length: LAST_EXCEPTION },
  (_, index) => String(index + 1).padStart(2, "0"),
);

/* Exception 12: a code 1, J or S distribution received at age 59½ or older (::b02–b03). */
export const EXCEPTION_AGE_59_AND_A_HALF = "12";

/* ::b01–b02: "doesn't apply to IRAs" (01, 06); "IRA distributions" only (07, 08, 09). */
export const EXCEPTIONS_NOT_FOR_IRAS: readonly string[] = ["01", "06"];
export const EXCEPTIONS_FOR_IRAS_ONLY: readonly string[] = ["07", "08", "09"];

const PREFIX = "retirement.early_distribution_exception.";

/* The key names the 1099-R fact it belongs to (makeRetirementDistributionFactKey's two ids). */
export function makeEarlyDistributionExceptionKey(
  payerSlug: string,
  distributionId: string,
): string {
  return `${PREFIX}${payerSlug}.${distributionId}`;
}

export function isEarlyDistributionExceptionNumber(value: unknown): boolean {
  return typeof value === "string" && EARLY_DISTRIBUTION_EXCEPTION_NUMBERS.includes(value);
}

/* The stated exception, or undefined when none is stated or the value is not one (Cade asks again). */
export function readEarlyDistributionException(
  factByKey: ReadonlyMap<string, unknown>,
  payerSlug: string,
  distributionId: string,
): EarlyDistributionExceptionFactValue | undefined {
  const value = factByKey.get(makeEarlyDistributionExceptionKey(payerSlug, distributionId));
  if (typeof value !== "object" || value === null) return undefined;
  const { number, amount } = value as Record<string, unknown>;
  const isAmount = typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
  return isEarlyDistributionExceptionNumber(number) && isAmount
    ? { number: number as string, amount: amount as number }
    : undefined;
}
