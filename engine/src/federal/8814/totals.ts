/*
 * The amounts every Form 8814 sends to other forms, added across the copies
 * (irs-8814-inst-2025::sec::line-12::b01, ::line-15::b01), and the one rule
 * those forms' lines follow to add them.
 */

import { sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { form8814Children } from "./children.js";
import type { Form8814Child, Form8814Figured, Form8814Totals } from "./filingInfo.js";
import { eicWorksheet1Line4, line12LessAlaskaDividends, line12Of } from "./lines.js";

/* Undefined with no child; "waits" while a child's answer is missing; the first child's gap. */
export function form8814TotalsOf(children: Form8814Child[]): Form8814Totals | undefined {
  if (children.length === 0) return undefined;
  const gap = children.find((child) => child.gap !== undefined)?.gap;
  if (gap !== undefined) return { kind: "unsupported", reason: gap };
  const figured = children.flatMap((child) => (child.lines ? [{ child, lines: child.lines }] : []));
  if (figured.length < children.length) return { kind: "waits" };
  const line9ByChild = figured.map(({ lines }) => lines.partI?.line9 ?? 0);
  return {
    kind: "figured",
    line9ByChild,
    line9: sum(...line9ByChild),
    line10: sum(...figured.map(({ lines }) => lines.partI?.line10)),
    line12: sum(...figured.map(({ lines }) => line12Of(lines))),
    line15: sum(...figured.map(({ lines }) => lines.line15)),
    line1b: sum(...figured.map(({ lines }) => lines.line1b)),
    privateActivityBondInterest: sum(
      ...figured.map(({ child }) => child.privateActivityBondInterest),
    ),
    line12LessAlaskaDividends: sum(
      ...figured.map(({ child, lines }) =>
        line12LessAlaskaDividends(lines, child.alaskaPermanentFundDividends),
      ),
    ),
    eicWorksheet1Line4: sum(
      ...figured.map(({ child, lines }) =>
        eicWorksheet1Line4(lines, child.alaskaPermanentFundDividends),
      ),
    ),
  };
}

/* The totals from the facts and decisions, for a resolver that needs them. */
export function form8814Totals(inputs: ResolverInputs): Form8814Totals | undefined {
  return form8814TotalsOf(form8814Children(inputs));
}

/*
 * A line of another form that adds a Form 8814 amount. With no Form 8814 the
 * line is what it was; while a child's answer is missing it is blank; a
 * child's gap makes it unsupported; otherwise the amount adds when it is not 0.
 */
export function withForm8814(
  totals: Form8814Totals | undefined,
  own: number | undefined,
  amountOf: (figured: Form8814Figured) => number,
): number | Unsupported | undefined {
  if (totals === undefined) return own;
  if (totals.kind === "waits") return undefined;
  if (totals.kind === "unsupported") return unsupported(totals.reason);
  const amount = amountOf(totals);
  return amount === 0 ? own : sum(own, amount);
}

/* Form 8814's figured totals, or undefined (none filed, or not figured yet). */
export function figuredForm8814(totals: Form8814Totals | undefined): Form8814Figured | undefined {
  return totals?.kind === "figured" ? totals : undefined;
}
