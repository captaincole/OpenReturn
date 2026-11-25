/*
 * The copy being printed and the helper every line of it uses: a line is
 * unsupported with its fund's gap, blank with no fund, and otherwise read
 * from the fund.
 */

import type { BindingFn } from "../../defineForm.js";
import { formatDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8621FilingInfo } from "./filingInfo.js";
import type { Form8621Fund } from "./fund.js";
import type { Form8621 } from "./types.js";

export type Bindings = Partial<{
  [K in keyof Form8621]: BindingFn<Form8621, Form8621FilingInfo, K>;
}>;

export const fundOf = (info: Form8621FilingInfo): Form8621Fund | undefined =>
  info.form8621Totals?.filed[info.form8621CopyIndex ?? 0];

export function fundLine<V>(read: (fund: Form8621Fund) => V | Unsupported | undefined) {
  return (_: unknown, info: Form8621FilingInfo): V | Unsupported | undefined => {
    const fund = fundOf(info);
    if (fund === undefined) return undefined;
    if (fund.gap !== undefined) return unsupported(fund.gap);
    return read(fund);
  };
}

/* A checkbox: true or blank. */
export const checked = (value: boolean | undefined): true | undefined =>
  value === true ? true : undefined;

/* A loss prints in brackets, as the form asks on lines 8e and 15f. */
export const bracketedLoss = (value: unknown): string =>
  typeof value === "number" && value < 0
    ? `(${formatDollars(-value)})`
    : formatDollars(value as number);

/* An ISO date as MM/DD/YYYY. */
export function monthDayYear(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}
