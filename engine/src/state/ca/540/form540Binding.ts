/* The binding and accessor types that the Form 540 section files share. */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import type { Form540FilingInfo } from "./filingInfo.js";
import type { Form540 } from "./types.js";

/* The method for one Form 540 field. */
export type Form540Line<K extends keyof Form540> = BindingFn<Form540, Form540FilingInfo, K>;

export type Form540Form = FormAccessor<Form540>;
