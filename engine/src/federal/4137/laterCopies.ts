import { sum } from "../../money.js";
import type { Form4137FilingInfo } from "./filingInfo.js";
import { form4137Lines, type Form4137Lines } from "./lines.js";

/*
 * A line that adds both spouses' Form 4137 (Schedule 2 line 5, Form 8959 line
 * 2). The engine evaluates only the first copy, so the line reads that copy's
 * field and adds each later copy's line from the same pure arithmetic. Blank
 * while the first copy's line is blank or a later one waits.
 */
export function withLaterCopies(
  first: unknown,
  info: Pick<Form4137FilingInfo, "form4137Filers">,
  pick: (lines: Form4137Lines) => number | undefined,
): number | undefined {
  if (typeof first !== "number") return undefined;
  const later = (info.form4137Filers ?? [])
    .slice(1)
    .map((filer) => pick(form4137Lines(filer.rows, filer.socialSecurityWagesAndTips)));
  if (later.some((value) => value === undefined)) return undefined;
  return sum(first, ...later);
}
