# Form 8978 — open questions

Sources: `irs-8978-inst-2025` (Rev. December 2024) and Form 8986 (Rev. December 2024). The decision on the Form 8986 column is in `scheduleA.ts` and in `docs/rule-decisions.md` (row A18). The doubts below have no conflicting text.

## Doubts

1. **What the "previously reported" totals are on a Form 1040.** "Enter the total income amount as shown on your original or amended return, or as adjusted by the IRS" (`line-1a-total-income-per-original-return-or-as::b01`); lines 3a, 9a and 12 say the same. Default: the partner states each total; the fact comments name Form 1040 line 9, lines 10 and 14 added, line 21 and line 22. Changes no dollar in the engine: it takes the amounts as stated.
2. **The first affected year of a statement from a pass-through partner.** "First affected year is the partner's tax year that includes the end of the audited partnership's reviewed year(s)" (`purpose-of-this-form::b06`). A tiered statement also prints the pass-through partner's year "to which the adjustments relate" (Form 8986 Part III item C). Default: Part III item C when the statement has it, else Part II item D. Changes dollars when the two dates fall in different calendar years: the column and the start of the interest move.
3. **The day interest stops.** Interest runs "up to the date the additional reporting year tax is paid" (`example-2-completing-form-8978-and-schedule-a-for::b04`). Default: April 15, 2026, the due date of the 2025 return, the last day of the rate table. Changes dollars when the tax is paid later. Line 18 is not on the return (`line-17::b02`).
4. **The penalty amount.** "If penalties apply, include a statement showing how the penalties were figured and enter the amount" (`line-15::b01`). The instructions give no method. Default: line 15 is the amount from the partner's penalty statement, asked for each year whose Form 8986 lists a penalty; 0 when the statement shows none is due (Example 2). Changes no dollar the engine figures.
5. **Zero or blank in a column the form uses.** "Each Form 8978 should have all lines completed" (`example-3-completing-forms-8978-and-schedules-a-for::b03`). Default: every line of a used column prints, 0 included (line 7 with no AMT, line 15 with no penalty, line 17 on a decrease). Unused columns are blank. No dollars.
6. **Negative lines 5 and 11.** The form subtracts; the statement may replace either line. Default: the plain difference, which can be negative. No dollars in the scenarios.
7. **Negative amounts print with a minus.** "Enter negative amounts in parentheses" (`line-1a-total-income-per-original-return-or-as::b01`). The engine's renderer prints "-3,000" on every form. No dollars.
8. **The sign of a deduction row.** "All adjustments (positive and negative) from a Form 8986 should be shown as reported on that form" (`specific-instructions-for-schedule-a::b02`). Default: a deduction row keeps its sign, so a decrease is negative on line 3b (Example 2). No dollars when the statement follows that sign.
9. **K-1 lines that are part of another line.** Lines 4c, 6b, 9b and 9c (Form 1065) and 5b, 8b and 8c (Form 1120-S) are parts of a line above them. Default: they add 0, so an amount counts once. A statement that changes only a part line loses that amount on Schedule A; its rate effect stays in the statement's line 6.
10. **Rows with no direct taxable amount.** "Schedule K-3 (Form 1065) adjustments that do not directly increase or decrease a partner's taxable income should be reported with a zero amount" (`specific-instructions-for-schedule-a::b01`). Default: the same for K-1 lines 14 and 16–23 (1065), 14–17 (1120-S) and "K3"; their effect is a partner-level amount the partner states.
11. **The extended due date.** Interest on a penalty runs from the due date "including any valid extensions" (`line-17::b01`). Default: October 15 of the next year; the weekend rule is not applied, as for Form 8621 (`federal/8621/interest.ts`). Changes dollars by a day or two of interest.
12. **A statement furnished in another year.** It belongs to that year's return (the reporting year rule, `purpose-of-this-form::b07`). Default: it does not file Form 8978 for 2025 and adds nothing.
13. **Schedule 3 files only with a negative total.** With a Form 8978 gap the resolver cannot see the total, so Schedule 3 does not file for line 6l (KNOWN GAP); Form 1040 line 16 shows the gap.
14. **The days that bear interest.** The Form 8978 instructions give no day count. Default: interest accrues from the day after the due date through the end date, each day at its own quarter's rate (`federal/8621/interest.ts`). The Form 2210 penalty worksheet counts days the same way: "Rate Period 1: April 16, 2025–June 30, 2025" (`irs-2210-inst-2025::sec::tax-year-2025::b03`), and its Table 4-1 counts April 15 as day 0 (`::b01`). Changes dollars: the blind fill counted the due date and not the end date, so April 15, 2021 (5% with the audit's 2 points) replaced April 15, 2026 (8%). Line 17 of the blind audit case moved by $1 ($1,211 against $1,212).
15. **The original due date in a year with a holiday or a postponement.** "From the original due date of your income tax return" (`line-17::b01`); Example 2 counts "from April 15, 2022 (the due date of his 2021 return)" (`example-2-completing-form-8978-and-schedule-a-for::b04`), though that year's date moved to April 18. Default: April 15 of the next year for every year, with no holiday shift and no disaster postponement (the 2019 and 2020 returns). Changes dollars: about $16 in a blind case on a 2020 increase of $2,400 if the May 17, 2021 postponement applied.
16. **Interest on a penalty goes on line 17.** "Interest on penalties is figured in the same manner as interest on tax" (`line-17::b01`), and the form has one interest line. Default: line 17 holds the interest on the line 13 increase plus the interest on line 15, at the same rate. Changes dollars if the penalty's interest is reported elsewhere ($384 in a blind case on a $1,000 penalty from October 15, 2022).
17. **Line 18 adds the rounded columns.** "Add line 17, columns (a) through (d)" (the form face). Default: each column rounds once, and line 18 adds the rounded columns. Changes dollars by $1 at most for each form (a blind case: $206 against an unrounded total of $205.48).
18. **Line 12 is the tax after credits.** "Line 12. Total tax shown on return or as previously adjusted. Enter the amount shown on your original or amended return, or as adjusted by the IRS" (`line-12-total-tax-shown-on-return-or-as-previously::b01`). Default: the partner states the income tax after credits (Form 1040 line 22), because line 13 compares line 12 with line 11, a tax after credits. Changes dollars by the credits when a partner states the tax before credits.

## Proposals for a discussion

- **Print Schedule A (Form 8978).** The engine figures Schedule A lines 2, 4 and 6 (`scheduleA.ts`) but has no catalog for it, so the return lacks the schedule the instructions require. Proposal: add `federal/8978-schedule-a` with its blank PDF and catalog, one row per Form 8986 item.
- **Figure the earlier years' tax.** Lines 6 and 7 come from the partner's statement because the engine has only 2025 tables. Proposal: year-keyed tax tables and rules for 2021–2024, a new layer.
- **Figure the section 6662 penalty.** Example 2 tests the substantial understatement threshold by hand. Proposal: a rule for the threshold and the 20% rate, with the line 13 increase as the understatement.
- **A payment date for interest.** Proposal: an answer for the day the tax is paid, and rate quarters past April 2026.
- **Form 1041 statements.** A trust or estate pass-through partner's statement uses Form 1041 K-1 lines; the engine has no box table for it, so such a statement is a gap.

## Second opinions

- **Blind fill (2026-11-25).** Fifteen cases filled by hand from the blank form and the instructions. Every line matched but one: line 18 of the audit form in the two-statement case ($1,212 against $1,211), from the day count (doubt 14). The engine stays: the Form 2210 worksheet counts the days the engine's way.
- **PolicyEngine-US 2.154.0** (commit 363e9fc5, 2026-11-25). It does not model Form 8978: its credit-limit parameters say "6l (Form 8978, not modeled)", and it has no underpayment rate or interest rule. Nothing to compare.
- **IRS Direct File.** Not compared: its scope has no partnership K-1 income, so it has no Form 8978. The repository names no other reference implementation.

## Unsupported cases (the whole form is a gap)

- A statement whose Part I item B is Form 1041 or "other", or a Part V line the box table does not know.
- A review year of 2025 or later, or a date that does not read.

Every catalog field has a rule.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header: name, TIN, source boxes, tax year ended | stated rule |
| Who files; reporting year | published example with numbers (item G 06/15/2023; Example 1) |
| Columns shown (applicable years) | published example (first affected 2020, only 2023 intervening) |
| Lines 1b, 3b, 9b (Schedule A totals) | published examples with numbers (Examples 2 and 4) |
| Lines 1a, 2, 3a, 4, 5, 8, 10, 11, 12, 13, 14 | stated rule |
| AAR form first, audit form starts from it | published example with numbers (Example 3) |
| Lines 6, 7 (from the statement) | stated rule (the engine does not figure earlier years) |
| Lines 15, 16 | stated rule; own reading for the amount (doubt 4) |
| Lines 17, 18 | stated rule (rate, start, no interest on decreases); own reading for the end (doubt 3) |
| Form 1040 line 16 box 3; Schedule 3 line 6l; Schedule 2 line 17z | stated rule (Form 1040 instructions and worksheets) |
| Form 6251 line 10; Form 1116 line 20 | stated rule |
