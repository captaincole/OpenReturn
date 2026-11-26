import type { HealthPlanBusinessKind } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form2555FilingInfo } from "../2555/filingInfo.js";
import type { PremiumLines } from "./lines.js";

/*
 * Line 12's source: no Form 2555 for the plan's person (blank); a Form 2555
 * with nothing attributable to this business (0); all of that person's line 45
 * (the form excludes only this business's income); or a gap.
 */
export type ForeignExclusionSource = "none" | "zero" | "line45" | { gap: string };

/* One plan, one copy of Form 7206, as far as the facts settle it before any line is figured. */
export interface SelfEmployedHealthPlan {
  factKey: string;
  kind: HealthPlanBusinessKind;
  /* The business, farm, K-1 or W-2 fact the plan is established under. */
  businessKey: string;
  owner: "taxpayer" | "spouse";
  premiums: PremiumLines;
  /* Line 4, whole dollars; undefined while the business's line 31 or the farm's line 34 waits. */
  line4?: number;
  /* Line 11, whole dollars: W-2 box 5 from the S corporation. */
  line11?: number;
  /* Line 9: a stated amount (cents kept), or all of Schedule 1 line 16. */
  line9Source: number | "line16";
  line12Source: ForeignExclusionSource;
  /* Why this plan's lines cannot be figured. */
  gap?: string;
}

export interface Form7206FilingInfo
  extends BaseFilingInfo, Pick<Form2555FilingInfo, "form2555Filers"> {
  /* Every plan, in fact order; undefined with none. Each is one Form 7206 when the form files. */
  form7206Plans?: SelfEmployedHealthPlan[];
  /* Line 5: the taxpayer's Schedule C and F profits, whole dollars; undefined while one waits. */
  form7206Line5?: number;
  /* Which plan this copy is for (renderCopies sets it); absent means the first. */
  form7206CopyIndex?: number;
}
