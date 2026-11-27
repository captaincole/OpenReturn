# Schedule P (540NR): open questions

Schedule P (540NR) figures a nonresident's or part-year resident's California minimum tax. Part I and lines 22 to 24 figure the tentative minimum tax on all income, as a resident would. Lines 25 to 45 take California's part of it at the same average rate. Part III limits the credits.

The engine runs Schedule P (540)'s rules for Part I, lines 22 to 24 and Part III (`fromScheduleP.ts`). Lines 25 to 45 are this form's own (`partII.ts`, `lines.ts`). The only published example with numbers is FTB Pub. 1100 Example 43, a unit test.

## Doubts

1. **Rounding of lines 38 and 42.** The instructions give no rule. The form prints four boxes after the point. The engine rounds the half up, the rule Form 540NR lines 36 and 38 follow (decision A78). FTB Pub. 1100 Example 43 rounds too: 8,314 ÷ 235,000 = .035379 prints .0354 (`ftb-pub-1100-2025::sec::california-alternative-minimum-tax::b01`). Changes dollars: yes, a few, against cutting off.

2. **Line 38 floor.** "Divide line 32 by line 37. Do not enter more than 1.0000" (the form) names no floor. A California AMT AGI below 0 gives a ratio of 0 here, as Form 540NR line 38 does. With line 37 at 0 or less, the ratio is 1 for a California amount above 0, else 0. Changes dollars: only with a California loss.

3. **Line 43 floor.** "Multiply line 40 by line 42" (the form). A California AMTI below 0 gives line 43 of 0, not a negative tentative minimum tax. Part III line 2 reads line 43, and a negative amount there would raise line 3. "If line 23 is zero or less, enter -0- on line 23, line 24, and line 43" (`ca-540nr-sched-p-inst-2025::sec::line-23::b01`) is applied as written. Changes dollars: only with a California loss.

4. **Line 29a.** Line 29a takes the California part of Part I line 7 (`::line-29-adjustments-and-preferences::b01`). Line 34e also takes Part I line 7. The engine figures line 7 only for a return that itemizes, from FTB 3526, as Schedule P (540) does. That amount is an itemized deduction (Schedule CA (540NR) Part III), not Part II income, so it reaches California AMTI through line 34e and the proration on lines 35 to 39. Line 29a is then blank. With FTB 3526 needed, lines 7, 14, 29a and 34e carry its gap: FTB 3526 is figured for Form 540 only. Investment interest reported on Schedule E is not modeled (the same gap as Schedule P (540) line 7). Changes dollars: no, for what the engine figures.

5. **Line 29d, the California part of the ISO spread.** The taxpayer states it (`ca_540nr.amt_california_amount.iso_exercise_spread`). The engine never splits it by workdays. A stated 0 leaves the line blank. A stated part above the line 10 spread is taken as stated: no text caps it. Changes dollars: only when the answer is wrong.

6. **Line 26 sign.** "Enter as a positive number" (the form). Column E of lines 9b1 to 9b3 holds the deduction as a negative amount, as column D does. The engine takes the absolute value of the total. Changes dollars: no.

7. **Form 540NR line 71 at zero.** Line 45: "If zero or less, enter -0- here and on Form 540NR, line 71" (the form). The engine prints 0 on line 71 whenever Schedule P (540NR) files. Form 540 line 61 leaves 0 blank (`540/otherTaxes.ts`). Changes dollars: no.

8. **Form 540NR line 71 source.** Line 45 and Part III line 25 both say "on Form 540NR, line 71". Line 25 is line 45 less the Section C credits, so the engine takes line 25. The Section C credits have no facts, so the two are equal today. Changes dollars: no.

9. **Part III without credits.** "Complete Part III only if you have tax credits" (`::how-to-compute-the-limitation::b02`). The engine fills Part III lines 1 to 3, 11, 22 and 25 on every return, as Schedule P (540) does. Changes dollars: no.

10. **Line 10's blank after the name** (`2.part3.10_prior_year_amt_entry`). The form prints a blank after "Credit for prior year alternative minimum tax". The instructions do not say what it holds. Unsupported. Changes dollars: no.

11. **Who files.** The engine files the schedule when Form 540NR files and Schedule P (540) would file on the same answers for a resident (an ISO exercise, itemized deductions, a prior year AMT credit, a Section A1 or A2 credit, more than two credits). "The total of Part I, line 7 through line 13 is negative and you would be liable for AMT without taking those lines into account" (`::b-who-must-file::b01`) has no fact: no negative adjustment is modeled. Changes dollars: no.

## Unsupported field groups

| Fields | Why |
| --- | --- |
| Part I lines 4, 6, 8, 9, 11, 12, 13a to 13l, 17, 20 | Schedule P (540)'s reasons: no facts for these adjustments. |
| Line 27, line 29b, 29c, 29e to 29r, line 31 | The California part of a Part I line the engine does not figure; the Part I reason. |
| Line 34c | Copies Part I line 4. |
| Part III lines 4 to 10, 16 to 18, 20, 21 | Each credit form (FTB 3506, 3507, 3510, 3541, 3801-CR, 3804-CR, Schedule S) is figured for Form 540 only: a named gap when the return needs it, else Schedule P (540)'s reason. |
| Part III lines 8, 9, 12 to 15, 19, 23, 24 | Schedule P (540)'s reasons: no credit facts. |
| Part III lines 12 to 14, the credit from Form 540NR and the percentage | No fact asks whether the taxpayer qualifies (as Form 540NR lines 51 to 55). |
| Part III line 10, the blank after the name | Doubt 10. |

## Confidence

| Field group | Confidence |
| --- | --- |
| Lines 32 to 45 (the proration, the rate, California TMT, AMT) | Published example with numbers (FTB Pub. 1100 Example 43) |
| Part I, lines 22 to 24 | Stated rule (Schedule P (540)'s rules, the same instructions) |
| Lines 25, 26, 28 to 30, 33, 34a to 34e | Stated rule |
| Line 29d | Stated rule, with a stated California amount |
| Line 29a blank | Own reading (doubt 4) |
| Floors of lines 38 and 43 | Own reading (doubts 2 and 3) |
| Part III lines 1 to 3, 11, 22, 25 | Stated rule |
| Part III credit rows | Unsupported on Form 540NR (gaps) |

## Proposals for a discussion

- **Credit forms on Form 540NR.** Every Part III credit row takes a credit form the engine figures for Form 540 only. Several have their own Form 540NR lines (FTB 3506 prorates the credit by the California ratio; Schedule S has a part-year rule). Letting each credit form file with Form 540NR, with its nonresident lines, would fill Part III and Form 540NR lines 50 and 58 to 62. That is a change to each credit form's structure, one form at a time.
