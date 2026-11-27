# Schedule CA (540NR): open questions

Columns A to C and Part III are Schedule CA (540)'s rules on the same lines (`fromScheduleCa.ts`). Column D is A less B plus C. Column E is the taxpayer's stated California amount of each line (`facts/kinds/caCaliforniaAmounts.ts`). Part I prints each person's stated answers (`facts/kinds/caResidency.ts`).

## Two texts conflict

None. The ratio of Part IV line 3 is Form 540NR's decision A71 (`../540nr/QUESTIONS.md`).

## Should we do this now

1. **Column E, one answer per line.** The owner chose a stated answer (issue #336); the smaller design is one answer per line, not one per document: the column has one box per line and the Part-Year Resident Worksheet figures it per line (`ca-540nr-sched-ca-inst-2025::sec::section-b-additional-income-3::b07`). Done.
2. **Which column E answers the form asks for.** The resolver sees facts, not lines. Done: it asks for lines 1a (a W-2), 2b (a 1099-INT), 3b (a 1099-DIV), 4b and 5b (a taxable 1099-R), 7a (Schedule D or capital gain distributions), and Section B lines 3, 4, 5 and 6 and Section C line 15 (Schedule C, Form 4797, Schedule E, Schedule F, Schedule SE). Any other line with a column D amount and no stated amount is a gap, so its totals and Form 540NR lines 32 and 35 are gaps too: never 0. Asking for every line is proposal 2.
3. **Section C column E.** Lines 14 to 19a give ratios for column E (`::line-15-deductible-part-of-self-employment-tax::b01` and the lines after it). Their inputs (self-employment income while a resident, the IRA and the SEP parts of line 16) are not separate facts, so the taxpayer states the result, as for every line. Done.
4. **Column D prints blank** when columns A, B and C hold no amount ("If you do not have an entry for a line, leave it blank", `ca-540nr-booklet-2025::sec::before-you-begin::b02`). Lines 9b1 to 9b3 take column B as a negative number (`::line-9b1-through-line-9b3::b01`). Done.
5. **Columns B and C that count a gap as 0.** Schedule CA (540)'s rules leave some column B and C lines unsupported (for example line 1a column B), and its totals count them as 0. Column D does the same, so it equals column A there. The gap stays on the line. Not now: the totals follow Schedule CA (540), and changing how its totals read a gap changes Form 540 too.
6. **Line 7a columns B and C.** "If there are differences, use Schedule D (540NR)" (`::line-7a-capital-gain-or-loss::b01`). Schedule D (540NR) has no rules yet: with a capital gain or loss the columns are a gap naming it. Column D counts them as 0. Not now: Schedule D (540NR) is the next job (proposal 1).
7. **Part IV line 3 with no total AGI.** Line 27 column D is 0 or less: nothing to divide. Done: 1.0000 when column E is above 0, else 0.0000. The form's floor ("If less than zero, enter -0-") covers a California loss.
8. **Part I line 1a without the Part I fact.** Done: the return's decision `decisions.scope.ca_residency` checks the taxpayer's box; lines 2 to 8 wait for the fact, which the form asks for. The spouse column is for a joint return only.
9. **Part I line 2a for a part-year resident.** The form asks for one state of domicile for 2025. The taxpayer states it. Done.
10. **Part III line 30 for a married/RDP filing separately taxpayer whose spouse itemizes.** "If your filing status is married/RDP filing separately and your spouse itemizes, enter the amount from line 29 (even if the standard deduction is larger)" (`ca-540nr-sched-ca-inst-2025::sec::line-30-amount-from-line-29-or-standard-deduction::b01`). Part III is Schedule CA (540)'s rule, which always takes the larger of line 29 and the standard deduction; no fact says whether the spouse itemizes on the California return. Not now: the same gap is on Schedule CA (540) line 30, so the fix (a new fact) belongs to both forms in one change. Found by the blind fill.
11. **Part IV line 3 with a California loss.** The face says "If less than zero, enter -0-"; the instructions say only that it "may not be greater than 1.0000" (`::line-3-deduction-percentage::b01`). The instructions are silent on the floor, so the texts do not conflict. Done: the face's floor. Line 35 is 0 either way.
12. **Line 10 column B on Form 540NR (fixed 2026-11-26).** Schedule CA (540)'s line 10 list named a column B field for Section B line 2a, which neither schedule has. Schedule CA (540) read it as blank; Schedule CA (540NR) reads each name from its own catalog, failed, and Form 540NR line 14 printed 0 with a subtraction on the return. Done: the list (`../schedule-ca/line10.ts`) no longer names the field; no Form 540 value changes.
13. **Fixed rows.** Part II and Part III have one row per line, and each line adds its documents into one amount. The lines with one description box (8z, 24z, Part III line 27) are unsupported, as on Schedule CA (540), so no row limit is reached. Done.

## Pattern change

None for this schedule. Form 540NR's line 39 rounding is in `../540nr/QUESTIONS.md`.

## Second opinions

- **Blind fill (2026-11-26).** Part IV lines 3 and 4 match the engine in all 14 cases (see Form 540NR's QUESTIONS.md).
- **PolicyEngine-US 2.154.1** models no Schedule CA (540NR): it has no column E and no Part IV ratio. Nothing to compare beyond the standard deduction, which agrees ($5,706 and $11,412).

## Field groups

| Group | Rule | Confidence |
| --- | --- | --- |
| Part I | the stated answers | stated rule |
| Part II columns A to C, Part III | Schedule CA (540)'s rules; the lines that take FTB 3801, 3461, 3526, 3800, 3803, 3805V, 3885A, 3913, 5870A or Schedule D-1 are named gaps when the return needs the form | stated rule (unsupported where Schedule CA (540) is) |
| Part II line 7a columns B and C | Schedule D (540NR) gap | unsupported |
| Part II column D | A less B plus C | stated rule |
| Part II column E | stated per line; totals add them | own reading (design of issue #336) |
| Part IV | the deductions times CA AGI over total AGI | published example with numbers (Pub. 1100 Example 1) |

## Proposals for a discussion

1. **Schedule D (540NR).** Its rules come next (issue #336, point 4). Line 7a columns B and C then read its line 12a and 12b, and column E can read its nonresident worksheet.
2. **Asking column E for every line.** A field cannot ask for a fact while it evaluates; the resolver asks before. The proposal: the resolver of each federal schedule exposes the Schedule 1 and Form 1040 lines it fills, so the column E questions follow the lines, not a list of detectors.
