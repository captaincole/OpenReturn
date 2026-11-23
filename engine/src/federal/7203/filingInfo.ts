import type { BaseFilingInfo } from "../../filingInfo.js";
import type { PassThroughEntity } from "../passThrough/items.js";

export interface Form7203FilingInfo extends BaseFilingInfo {
  /* The S corporation K-1s that file Form 7203, one copy each, in fact order. */
  form7203Entities?: PassThroughEntity[];
  /* Which K-1 this copy is for (renderCopies sets it); absent means the first. */
  form7203CopyIndex?: number;
}
