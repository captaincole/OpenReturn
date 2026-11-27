/* The binding and accessor types that the Form 540NR section files share. */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { formOnly540Gap } from "./californiaForms.js";
import type { Form540NRFilingInfo } from "./filingInfo.js";
import type { Form540NR } from "./types.js";

/* The method for one Form 540NR field. */
export type Form540NRLine<K extends keyof Form540NR> = BindingFn<Form540NR, Form540NRFilingInfo, K>;

export type Form540NRForm = FormAccessor<Form540NR>;

/*
 * The gap of the first of these forms that the return needs and the engine
 * figures for Form 540 only (californiaForms.ts); undefined when it needs none.
 */
export function gapFor(
  info: Pick<Form540NRFilingInfo, "formsNeededOnly540">,
  ...formIds: string[]
): Unsupported | undefined {
  const needed = formIds.find((formId) => info.formsNeededOnly540?.includes(formId));
  return needed === undefined ? undefined : unsupported(formOnly540Gap(needed));
}
