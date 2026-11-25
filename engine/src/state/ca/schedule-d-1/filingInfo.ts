import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { CaliforniaDifference, ScheduleD1Lines } from "./lines.js";

/* California's section 1231 gain for Schedule D (540) line 1, figured whenever Form 4797 files on a Form 540 return. */
export interface CaliforniaSection1231Gain {
  /* Line 7 with no line 8, or line 9 (the form's text under lines 7 and 9); undefined when none. */
  gain?: number;
  /* Why it is not figured. */
  gap?: string;
  /* It waits for the line 8 answer. */
  waits: boolean;
  /* It is not the federal Form 4797 amount that goes to federal Schedule D line 11. */
  differs: boolean;
}

export interface ScheduleD1FilingInfo extends BaseFilingInfo {
  /* The figured schedule; present only when it files and no gap stops it. */
  scheduleD1?: ScheduleD1Lines;
  /* Why no line can be figured (a malformed fact, a sale with no price, a California period). */
  scheduleD1Gap?: string;
  /* Why lines 7–21 cannot be figured (a K-1 section 1231 item, FTB 3805E or Form 8824, a passive loss). */
  scheduleD1SummaryGap?: string;
  /* Why a Part IV column's line 38 cannot reach Schedule CA. */
  scheduleD1PartIVGap?: { section179?: string; section280f?: string };
  /* Which copy this render prints (copies.ts); absent means the first. */
  scheduleD1CopyIndex?: number;
  californiaSection1231Gain?: CaliforniaSection1231Gain;
  /* Schedule CA line 3 columns B and C: federal line 35 less line 38, for Schedule C businesses. */
  scheduleD1Recapture?: CaliforniaDifference;
}
