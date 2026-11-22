import { sum } from "../../money.js";
import type { Form8919FilingInfo } from "./filingInfo.js";
import { form8919Lines, type Form8919Lines } from "./lines.js";

/*
 * A line that adds both spouses' Form 8919 (Form 1040 line 1g, Schedule 2 line
 * 6, Form 8959 line 3). The engine evaluates only the first copy, so the line
 * reads that copy's field and adds each later copy's line from the same pure
 * arithmetic. Blank while the first copy's line is blank or a later one waits.
 */
export function withLaterForm8919Copies(
  first: unknown,
  info: Pick<Form8919FilingInfo, "form8919Filers">,
  pick: (lines: Form8919Lines) => number | undefined,
): number | undefined {
  if (typeof first !== "number") return undefined;
  const later = (info.form8919Filers ?? [])
    .slice(1)
    .map((filer) => pick(form8919Lines(filer.rows, filer.socialSecurityWagesAndTips)));
  if (later.some((value) => value === undefined)) return undefined;
  return sum(first, ...later);
}
