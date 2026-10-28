// Own module so jurisdiction registries avoid a circular import of registry.ts.

import type { FilingInfo } from "./filingInfo.js";

export interface FormSpec {
  formId: string;
  shortId: string;
  displayName: string;
  relativeDir: string;
  /*
   * An explicit call, not a side-effect import, so tree-shaking cannot drop
   * the bindings. Without it the form's fields stay undefined (blank PDF).
   */
  register?: () => void;
  copies?: FormCopies;
}

export interface FormCopies {
  count: (info: FilingInfo | undefined) => number;
  select: (info: FilingInfo | undefined, index: number) => FilingInfo | undefined;
}

export function makeFormSpec(args: {
  formId: string;
  shortId: string;
  displayName: string;
  relativeDir: string;
  register?: () => void;
  copies?: FormCopies;
}): FormSpec {
  return args;
}
