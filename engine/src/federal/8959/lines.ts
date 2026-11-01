import { atLeast } from "../../money.js";

/* Line 6: blank without a threshold on line 5; a blank line 5 is not $0. */
export const excessMedicareWages = (
  line4: number | undefined,
  line5: number | undefined,
): number | undefined => (line5 === undefined ? undefined : atLeast(0, (line4 ?? 0) - line5));
