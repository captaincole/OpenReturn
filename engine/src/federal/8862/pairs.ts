/* The binding shapes the parts of Form 8862 share. */

import type { BindingFn, FormAccessor } from "../../defineForm.js";
import type { Form8862FilingInfo } from "./filingInfo.js";
import type { Form8862 } from "./types.js";

export type Bindings = Partial<{
  [K in keyof Form8862]: BindingFn<Form8862, Form8862FilingInfo, K>;
}>;
export type Form = FormAccessor<Form8862>;
export type Binding = (form: Form, info: Form8862FilingInfo) => unknown;

/*
 * A Yes/No pair: "Yes" checked on a yes and "No" on a no (an unchecked box is
 * false); both blank while the question is skipped or unanswered.
 */
export function yesNo(
  yesField: string,
  noField: string,
  read: (form: Form, info: Form8862FilingInfo) => boolean | undefined,
): Record<string, Binding> {
  return {
    [yesField]: (form, info) => read(form, info),
    [noField]: (form, info) => {
      const answer = read(form, info);
      return answer === undefined ? undefined : !answer;
    },
  };
}

/* The columns 1 to count. */
export const columns = (count: number): number[] =>
  Array.from({ length: count }, (_, index) => index + 1);
