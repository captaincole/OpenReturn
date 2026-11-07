import { atLeast } from "../../money.js";

/* A binding of any form reads another form's lines through this part of its accessor. */
type CrossFormReader = { readonly [crossFormFieldId: string]: unknown };

/*
 * Form 4952 line 4d (FTB 3526 line 4b): total gains over total losses from
 * dispositions, with capital gain distributions and loss carryovers: Schedule D
 * line 16 includes all of them. Without a Schedule D, 1040 line 7a is the
 * capital gain distributions alone.
 */
export function netGainFromDispositions(form: CrossFormReader): number | undefined {
  const scheduleDLine16 = form["schedule-d.1.line.16_combined_gain_loss"];
  if (typeof scheduleDLine16 === "number") return scheduleDLine16;
  const form1040Line7a = form["form-1040.line.7a"];
  return typeof form1040Line7a === "number" ? form1040Line7a : undefined;
}

/*
 * Net long-term capital gain over net short-term capital loss (Form 4952 line
 * 4e, FTB 3526 line 4c). Capital gain distributions are long-term, so without a
 * Schedule D the whole amount counts.
 */
export function netCapitalGainFromDispositions(form: CrossFormReader): number {
  const scheduleDLine15 = form["schedule-d.0.line.15_net_long_term_gain_loss"];
  if (typeof scheduleDLine15 !== "number") {
    return atLeast(0, form["form-1040.line.7a"]);
  }
  const scheduleDLine7 = form["schedule-d.0.line.7_net_short_term_gain_loss"];
  const shortTermLoss =
    typeof scheduleDLine7 === "number" && scheduleDLine7 < 0 ? -scheduleDLine7 : 0;
  return atLeast(0, atLeast(0, scheduleDLine15) - shortTermLoss);
}
