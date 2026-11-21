# Form 8880 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount.

## 1. W-2 box 12 code G

- Text: "These amounts may be shown in box 12 of your Form(s) W-2" (irs-8880-form-2025::sec::line-2::b01). Line 2 takes elective deferrals to a governmental 457(b) only.
- The gap: code G holds deferrals and employer contributions to any 457(b) plan, governmental or not.
- Default: all of code G counts on line 2.
- Changes dollars: yes, when code G holds employer money or a non-governmental plan and line 5 is under $2,000.

## 2. Which 1099-R codes stay off line 4

- Text: the "Don't include" list (irs-8880-form-2025::sec::line-4::b01, ::b02).
- The gap: the list names kinds of distribution, not box 7 codes.
- Default: codes G, H, L, 8, P, E, N, R and U stay off. Codes 6, 9, C, D, F and W stay off too: they are not distributions from a plan the line lists. Every other code counts at box 1.
- A 60-day rollover from an employer plan or a Roth IRA, an inherited IRA of a non-spouse, and a military retirement plan show no code. The person states them (`excluded2025Distributions`).
- Changes dollars: yes.

## 3. A Roth IRA distribution that is not taxable

- Text: Pub. 590-A: "Also reduce your eligible contributions by any distribution from a Roth IRA that isn't rolled over, even if the distribution isn't taxable" (irs-pub-590a-2025::sec::retirement-savings::b04).
- Default: a Roth IRA distribution (code J, Q or T) counts at box 1, not box 2a.
- Changes dollars: no (this follows the text). Listed because the form itself is silent.

## 4. The 2026 part of the testing period on a joint return

- Text: "Don't include your spouse's distributions with yours ... if you and your spouse didn't file a joint return for the year the distribution was received" (irs-8880-form-2025::sec::line-4::b02). The couple has not filed for 2026 when the 2025 return is due.
- Default: a 2026 distribution counts as from a joint year. The person moves it to `otherDistributionsInSeparateYears` when they will not file jointly for 2026.
- Changes dollars: yes, on a joint return.

## 5. A column for a person who cannot take the credit

- Text: "You cannot take this credit if ... The person(s) who made the qualified contribution ... was a student" (irs-8880-form-2025::sec::omb-no-1545-0074::b01).
- The gap: the form does not say what to print in that person's column.
- Default: that column is blank. A column with no contribution is blank too.
- Changes dollars: no.

## 6. The stops

- Text: line 7 "If zero, stop"; line 9 "If line 9 is zero, stop"; worksheet line 3 "if zero or less, stop; you can't take the credit—don't file this form" (irs-8880-form-2025::sec::omb-no-1545-0074::b02, ::credit-limit-worksheet::b01).
- Default: the engine cannot un-file a form. Line 7 prints 0 and lines 8–12 stay blank. Line 9 prints 0 and lines 10–12 stay blank. Worksheet line 3 prints 0 when line 1 less line 2 is zero or less, and lines 11 and 12 stay blank. Schedule 3 line 4 is blank in each case.
- Changes dollars: no.

## 7. Who files: AGI from facts

- Text: no credit when line 11a "is more than $39,500 ($59,250 if head of household; $79,000 if married filing jointly)" (irs-8880-form-2025::sec::who-can-take-this-credit::b01).
- The gap: a resolver cannot read line 11a.
- Default: the form files when a person made a contribution and the least AGI the facts allow (`agiFloor`, the EIC's bound) is not over the limit. It can file a form that line 9 then stops (tcb-ca-007 does this, with no change to its values). When the facts give no least AGI (an open business, rental or HSA amount), the form does not file unless `decisions.scope.must_file_8880` is true. KNOWN GAP.
- Changes dollars: yes, for a filer with no AGI floor who qualifies.

## 8. Line 8 add-backs

- Text: "See Pub. 590-A ... for the amount to enter if you claim any exclusion or deduction for foreign earned income, foreign housing, income from Puerto Rico, or income from American Samoa" (irs-8880-form-2025::sec::omb-no-1545-0074::b03).
- Default: line 8 is Form 1040 line 11a. A Form 2555 makes line 8 unsupported. The engine has no facts for Puerto Rico or American Samoa income.
- Changes dollars: yes, for those filers only.

## 9. Worksheet line 2 credits the engine does not compute

- Text: line 2 adds "Schedule 3, lines 1 through 3, 6d, and 6l" (irs-8880-form-2025::sec::credit-limit-worksheet::b01).
- Default: Schedule 3 lines 1, 3 and 6l have no rules. Worksheet line 2, line 11, line 12 and Schedule 3 line 4 are unsupported when a 1099 shows foreign tax paid, or Form 1116, 8863 or 8978 files. Lines 2 and 6d come from Form 2441 and Schedule R. A gap inside those forms reads as 0 here.
- Changes dollars: yes, when Form 2441 or Schedule R has a gap.

## 10. Line 1 traditional IRA contributions

- Text: "Traditional and Roth IRA contributions ... for 2025. Do not include rollover contributions" (irs-8880-form-2025::sec::omb-no-1545-0074::b01).
- Default: `retirement.traditional_ira.<owner>.contributions`; without it, the stated Form 8606 line 1 (nondeductible contributions).
- Changes dollars: no, while the fact follows its own definition.

## 11. Rounding line 1 and line 2 before line 3

- Text: "If you have to add two or more amounts to figure the amount to enter on a line, include cents when adding the amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
- The gap: line 3 adds lines 1 and 2. Rounding each line first can differ by $1 from rounding the cents total (1,000.50 + 499.50 gives 1,501, not 1,500).
- Default: lines 1, 2 and 4 each round their own cents total; line 3 adds the rounded lines, as the form defines it. The blind fill read it the same way.
- Changes dollars: at most $1 on line 3, and on line 10 only when line 6 is under $2,000.

## Second opinions

- **PolicyEngine-US 2.152.15** (commit b274cacc), `variables/gov/irs/credits/retirement_savings/` and `parameters/gov/irs/credits/retirement_saving/`.
  - Same: the $2,000 cap per person; the AGI limits; every line 9 row edge (its joint table times 0.5 for single, separate and surviving spouse, and 0.75 for head of household gives the engine's table); "not over" is inclusive on each edge; the cap applies per person before the two are added; the worksheet's credits (foreign tax, child care, education, elderly or disabled; 6l not modeled there).
  - Differs, form decides, no change:
    - Line 4: PolicyEngine subtracts only the current year's distributions. The form takes the whole testing period, after 2022 and before the due date (irs-8880-form-2025::sec::line-4::b01).
    - Age: PolicyEngine tests age 18 or more. The form says "born after January 1, 2008" (irs-8880-form-2025::sec::who-can-take-this-credit::b01). The engine follows the form.
    - Worksheet line 1: PolicyEngine uses regular tax plus AMT. The form says Form 1040 line 18 (irs-8880-form-2025::sec::credit-limit-worksheet::b01), which also holds the excess advance premium tax credit repayment. This is a source conflict between the statute and the form. The engine fills the form.
    - Line 8: PolicyEngine adds back the section 911, 931 and 933 exclusions. The engine makes line 8 unsupported with Form 2555 (item 8). This is the same rule, with the engine's gap stated.
    - Rounding: PolicyEngine does not round to whole dollars. The engine rounds by form line.
- **IRS Direct File**: the repo names no checkout of it, so it was not compared.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Lines 1–3 (contributions) | stated rule; code G is own reading (item 1) |
| Line 4 (distributions) | published example with numbers (Exception example); code list is own reading (item 2) |
| Lines 5–7 | stated rule |
| Line 8 | stated rule; unsupported with Form 2555 |
| Line 9 (table) | stated rule (every row edge tested) |
| Line 10 | published example with numbers (IRS page, Jill, 2021, same 2025 rate) |
| Credit Limit Worksheet, line 11 | stated rule; unsupported with foreign tax, Form 1116, 8863 or 8978 |
| Line 12, Schedule 3 line 4 | stated rule |
