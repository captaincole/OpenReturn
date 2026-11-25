/*
 * The amounts Form 8824 sends to other forms: Schedule D lines 4 and 11 ("gain
 * or (loss) from Forms 4684, 6781, and 8824") and Form 4797 lines 5 and 16
 * ("gain or (loss) from like-kind exchanges from Form 8824"), as the lines of
 * those forms name them.
 */

/* Where the gain of a property goes: Schedule D for a capital asset, else Form 4797. */
export type Destination = "schedule_d" | "form_4797";

export interface RoutedAmounts {
  /* Schedule D line 4 and line 11. */
  shortTermCapital: number;
  longTermCapital: number;
  /* Form 4797 line 5 (section 1231) and line 16 (ordinary). */
  section1231: number;
  ordinary: number;
}

export const emptyAmounts = (): RoutedAmounts => ({
  shortTermCapital: 0,
  longTermCapital: 0,
  section1231: 0,
  ordinary: 0,
});

export function addAmount(
  amounts: RoutedAmounts,
  line: keyof RoutedAmounts,
  amount: number,
): RoutedAmounts {
  return { ...amounts, [line]: amounts[line] + amount };
}

export function addAll(amounts: ReadonlyArray<RoutedAmounts>): RoutedAmounts {
  return amounts.reduce(
    (total, each) => ({
      shortTermCapital: total.shortTermCapital + each.shortTermCapital,
      longTermCapital: total.longTermCapital + each.longTermCapital,
      section1231: total.section1231 + each.section1231,
      ordinary: total.ordinary + each.ordinary,
    }),
    emptyAmounts(),
  );
}

/* A routed amount as a line value: blank when nothing goes there (the printed-zero rule). */
export const lineAmount = (amount: number): number | undefined =>
  amount === 0 ? undefined : amount;
