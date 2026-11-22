/*
 * Schedule CA (540) line 8z, columns B and C, for a child's interest and
 * dividends: the FTB 3803 line 6 total against the federal Form 8814 line 6
 * total (ca-3803-inst-2025::sec::line-6::b01;
 * ca-540-sched-ca-inst-2025::sec::line-8-other-income::b16). A child reported
 * on the federal return only is subtracted in full
 * (ca-3800-inst-2025::sec::purpose::b02).
 */

import { form8814Children } from "../../../federal/8814/children.js";
import type { Form8814Child } from "../../../federal/8814/filingInfo.js";
import { form8814TotalsOf } from "../../../federal/8814/totals.js";
import { sum } from "../../../money.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import type { ChildIncomeLine8z, Form3803Child, Form3803Totals } from "./filingInfo.js";
import { scheduleCaLine8zColumns } from "./lines.js";

/* The federal Form 8814 side: lines 6 and 12 added across the forms, and whether line 10 carries a capital gain. */
type FederalSide =
  | { kind: "figured"; line6: number; line12: number; capitalGain: boolean }
  | { kind: "waits" }
  | { kind: "unsupported"; reason: string };

function federalSide(children: Form8814Child[]): FederalSide {
  const totals = form8814TotalsOf(children);
  if (totals === undefined) return { kind: "figured", line6: 0, line12: 0, capitalGain: false };
  if (totals.kind !== "figured") return totals;
  const line6 = sum(...children.map((child) => child.lines?.partI?.line6));
  return { kind: "figured", line6, line12: totals.line12, capitalGain: totals.line10 > 0 };
}

/* A child's capital gain distributions reach FTB 3803 line 6 (line 3 filled and line 6 over 0). */
const californiaCapitalGain = (children: Form3803Child[]) =>
  children.some((child) => (child.lines?.line3 ?? 0) > 0 && (child.lines?.partI?.line6 ?? 0) > 0);

/*
 * Undefined when neither return reports a child's income. `elected` is the
 * FTB 3803 decision: true, false, or undefined while the parents have not chosen.
 */
export function childIncomeLine8z(
  inputs: ResolverInputs,
  elected: boolean | undefined,
  children: Form3803Child[],
  totals: Form3803Totals | undefined,
): ChildIncomeLine8z | undefined {
  const federalChildren = form8814Children(inputs);
  if (!elected && federalChildren.length === 0) return undefined;
  if (elected === undefined) return { kind: "waits" };
  const federal = federalSide(federalChildren);
  if (federal.kind !== "figured") return federal;
  if (!elected) {
    return {
      kind: "figured",
      ...scheduleCaLine8zColumns(0, federal.line6),
      childCapitalGainDistributions: federal.capitalGain,
      federalLine12: federal.line12,
    };
  }
  if (totals === undefined || totals.kind !== "figured") return totals;
  return {
    kind: "figured",
    ...scheduleCaLine8zColumns(totals.line6, federal.line6),
    childCapitalGainDistributions: federal.capitalGain || californiaCapitalGain(children),
    federalLine12: federal.line12,
  };
}
