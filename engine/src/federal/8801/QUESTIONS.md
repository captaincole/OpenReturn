# Form 8801 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount.

All inputs to lines 1–21 and Part III are 2024 amounts. The taxpayer states them (`facts/kinds/priorYearMinimumTax.ts`); the engine does not read last year's return (#79).

## 1. Who files: the form needs Part I even with no 2024 AMT

- Text: "Complete Form 8801 if ... for 2024 had: An AMT liability and adjustments or preferences other than exclusion items, A credit carryforward to 2025 ..., or An unallowed qualified electric vehicle credit ... File Form 8801 only if line 21 is more than zero" (irs-8801-inst-2025::sec::who-should-file::b01).
- The gap: a filer with only a carryforward and no 2024 AMT still has lines 1–15. The text does not say whether that filer completes Part I from a 2024 Form 6251 they did not file.
- Default: any minimum tax answer on file puts the form in scope, and the form asks for the 2024 Form 6251 lines. It files while line 21 waits, and stops when line 21 is figured and not above 0.
- Changes dollars: no (Part I with no 2024 AMT gives line 15 = 0 in the common case).

## 2. Line 3 is asked on every return

- Text: line 3 is "the total of the minimum tax credit net operating loss (MTCNOL) carryovers and carrybacks to 2024" (irs-8801-inst-2025::sec::line-3::b01).
- The instructions give no trigger, and the MTCNOL is figured with only exclusion items, separately from the regular loss. A carryover can reach 2024 with no 2024 Form 6251 line 2e: the regular carryover was used up first, or 2024 regular income before the deduction was 0 or less while income with exclusion items was not.
- Default (changed in the second pass): line 3 is asked whenever the form files; 0 means no loss was carried to 2024, and the line is then blank. No filed 2024 page prints it: it comes from the loss carryover worksheets. The engine takes the stated MTCNOLD; it does not figure it.
- Changes dollars: no longer; the old trigger (a line 2e amount) dropped line 3 for the filers above.

## 3. Line 12 is asked only with a 2024 AMT foreign tax credit

- Text: "If you made an election to claim the foreign tax credit ... without filing Form 1116, your MTFTCE is the same as the foreign tax credit on your 2024 Schedule 3 (Form 1040), line 1. ... Otherwise, your MTFTCE is your 2024 AMT foreign tax credit (AMTFTC) refigured using only exclusion items" (irs-8801-inst-2025::sec::line-12::b01).
- Default: line 12 is blank when 2024 Form 6251 line 8 is blank. With a line 8 amount, the form asks how the 2024 credit was claimed: the election gives the Schedule 3 line 1 amount; Form 1116 makes line 12 unsupported (the refigured Forms 1116 are not modeled).
- Changes dollars: yes, only when 2024 line 8 was 0 but a credit refigured with exclusion items would be above 0 (rare).

## 4. Line 28 "as refigured for the AMT, if necessary"

- Text: line 28 takes worksheet line 4 or line 13 "(as refigured for the AMT, if necessary)" (the blank form).
- The gap: the instructions do not say when a refigure is necessary or how.
- Default: the taxpayer states line 4 or line 13; the fact says to state the AMT amount when it differs. The engine does not refigure it.
- Changes dollars: yes, when a 2024 AMT gain differed (for example, ISO stock sold in 2024).

## 5. A 2024 taxable income of zero or less

- Text: "If your 2024 taxable income was zero or less, enter -0- on Form 8801, line 35. You must also ... complete lines 2 through 4 of the Qualified Dividends and Capital Gain Tax Worksheet" (irs-8801-inst-2025::sec::part-iii-tax-computation-using::b01).
- Default: the taxpayer states the worksheet with the lines they completed; line 5 (or lines 14 and 21) is 0. Lines 35 and 42 print 0 for any amount below 0. The engine has no separate answer for "no worksheet was used".
- Changes dollars: no.

## 6. Line 11 with a 2024 Form 2555, and line 10 for a 2024 Form 1040-NR

- Text: irs-8801-inst-2025::sec::line-11::b01, the Foreign Earned Income Tax Worksheet, ::lines-28-29-and-30::b01–b03 (Form 2555), ::line-10::b01 (Form 1040-NR).
- Default: a 2024 Form 2555 makes line 11, Part III (when the filer has a 2024 worksheet) and the lines after line 12 unsupported. The engine files Form 1040 only, so it assumes no 2024 Form 1040-NR and no estate or trust.
- Changes dollars: yes, for those filers only.

## 7. Line 22: Schedule 3 lines the engine does not compute

- Text: subtract "the total of any credits from Form 1040 ... line 19 and Schedule 3 (Form 1040), lines 1 through 6z (not including any credit for prior year minimum tax on line 6b or any credit claimed on Form 8912 ... on line 6k)" (irs-8801-inst-2025::sec::line-22::b01).
- Default: the engine subtracts every Schedule 3 line it figures. Line 22, and lines 24–26 and Schedule 3 line 6b after it, are unsupported while a credit it subtracts is a gap:
  - Form 5695 files (line 5a, Part I, is not modeled), or Form 3800, 8859, 8834, 8911 or 8978 files (lines 6a, 6h, 6i, 6j, 6l).
  - Schedule 3 line 1, 3, 4, 6c, 6f, 6g or 6m is a gap (each form's own gap helper).
  - Form 2441 claims the credit but its line 11 (Schedule 3 line 2) is blank above a tax limit (`2441/creditGap.ts`).
- Lines checked and not gaps: 5b (Form 5695 Part II has no gap of its own; Part I files the form, above), 6d (Schedule R has no gap), Form 1040 line 19 (Schedule 8812 line 14 is a gap only through the adoption credit, above), 6z ("Leave line 6z blank", irs-1040-inst-2025::sec::line-6z::b01).
- Left: Form 1040 line 16 and Schedule 2 line 1z are added, not subtracted. A gap in line 16 (Form 8615, Form 4972) leaves line 22 blank, not unsupported; the Schedule 2 lines 1d–1y that are unsupported count as 0 in line 1z, as on Form 1040 line 17.
- Changes dollars: no longer for the credits above; a filer with only a residential clean energy credit and no Form 5695 on the return has no fact to record it.

## 8. Who "claims" the credit for Form 6251

- Text: attach Form 6251 if "You claim ... the credit for prior year minimum tax (Form 8801)" (irs-6251-inst-2025::sec::who-must-file::b01).
- The gap: a Form 8801 with line 25 = 0 (only a carryforward) may not "claim" the credit.
- Default: Form 6251 files whenever Form 8801 files; line 23 reads its line 9. Schedule 3 files with Form 8801 too, and line 6b is blank when line 25 is 0.
- Changes dollars: no.

## 9. Line 21 not above 0 under the explicit decision

- Text: "If line 21 is zero or less, you don't have a minimum tax credit or a credit carryforward. Don't complete the rest of this form and don't file it" (irs-8801-inst-2025::sec::line-21::b01).
- Default: the form does not file from facts. With `decisions.scope.must_file_8801` true, lines 1–21 print and lines 22–26 stay blank.
- Changes dollars: no.

## 10. Rounding inside the computation

- Text: the 8801 instructions have no rounding rule. The Form 1040 rule: "You can round off cents to whole dollars on your return and schedules. If you do round to whole dollars, you must round all amounts" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
- The gap: lines 4 (the married-filing-separately add-on), 8, 11, 33, 46, 49, 52 and 54 multiply by a rate and can produce cents.
- Default: each line that produces cents rounds to the nearest dollar (`roundDollars`), and the next line reads the rounded amount. The blind fill made the same choice.
- Changes dollars: by $1 at most, against a preparer who keeps the cents until line 55 or line 25. In the blind cases 3, 7 and 12, both ways give the same result.

## 11. Form 6251 line 2e goes on line 1 only

- Text: line 1 combines "lines 1 and 2e of your 2024 Form 6251" (the blank form). Line 2 lists lines 2a, 2b, 2c, 2d, 2g and 2h, plus "Exclusion items on other lines" (irs-8801-inst-2025::sec::line-2::b01).
- Default: the 2024 line 2e amount is in line 1 and not in line 2. The MTCNOLD is a subtraction on line 3 (question 2).
- Changes dollars: yes, for a 2024 net operating loss deduction, if a preparer also counts line 2e on line 2. The text supports the default.

## 12. A negative 2024 Form 6251 line 2b

- Text: line 2 combines lines 2a, 2b, … of the 2024 Form 6251 (the blank form; irs-8801-inst-2025::sec::line-2::b01). Line 2b (a tax refund) is a negative amount.
- Default: line 2 keeps each amount with its sign, so a negative line 2b lowers line 2.
- Changes dollars: yes, if a preparer drops a negative amount. The word "combine" supports the default.

## 13. Line 23 when the 2025 Form 6251 leaves line 8 blank

- Text: line 23 is "the amount from your 2025 Form 6251, line 9" (the blank form). The Form 6251 instructions: "If the amount on line 10 is greater than or equal to the amount on line 7 ... Leave line 8 blank and enter -0- on line 11" (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01); with the election, "your AMTFTC is the same as the foreign tax credit on Schedule 3 (Form 1040), line 1" (::b02).
- The gap: a filer who takes the credit has line 10 above line 7, so line 8 is blank and line 9 is the tentative minimum tax before the AMT foreign tax credit. Section 55(b) defines the tentative minimum tax after that credit (not in the corpus; from the Code, not checked here). The two give different line 23 amounts when there is a foreign tax credit.
- Default: the form text. Line 23 reads line 9 as the engine fills it, with line 8 blank.
- Changes dollars: yes. For logain, line 8 at the election amount ($250) gives line 23 = 165,556, line 24 and the credit = 35,587, and line 26 = 129,233, against 165,806, 35,337 and 129,483 now.

## Second opinions

- Blind fill (13 cases, `.scratch/blind`): every value matches the engine (13 lines and the files flag in each case). There are no dollar differences and no blank-against-0 differences. The preparer's doubts that change dollars are questions 3, 9, 10, 11 and 12.
- PolicyEngine-US 2.153.8 (commit b3edc0446b): `prior_year_minimum_tax_credit` is a bare input with no formula, so it does not model Form 8801 lines 1–26. Its 2024 Form 6251 parameters are a check on the constants the 2025 form prints. These match: the exemption (85,700 / 133,300 / 66,650), the phase-out start (609,350 / 1,218,700), the 25% phase-out rate, the married-filing-separately limit (875,950, capped at the exemption), the 26%/28% break (232,600, half for married filing separately), and the 2024 0% and 15% capital gain ceilings for each filing status (lines 34 and 40). Its Form 6251 Part III formula (`amt_tax_including_cg`) has the same steps as lines 27–55. It skips the 25% step when unrecaptured section 1250 gain is 0; the form skips lines 50–52 when line 29 is zero or blank. These are the same condition. It keeps cents and the engine rounds each line (question 10). No disagreement.
- IRS Direct File (IRS-Public/direct-file): a GitHub code search finds no Form 8801 or Form 6251. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, identifying number) | stated rule |
| Line 4 married-filing-separately add-on | published example with numbers (line-4::b01) |
| Lines 1, 2, 4–10 | stated rule |
| Line 3 | stated rule for the amount; asked on every return (question 2) |
| Line 11 (AMT rates or Part III) | stated rule; Form 2555 unsupported |
| Line 12 | stated rule for the election; Form 1116 unsupported |
| Lines 13–21 | stated rule |
| Line 22 | stated rule; gaps per question 7 |
| Lines 23–26 | stated rule; line 23 with a foreign tax credit per question 13 |
| Part III, lines 27–55 | stated rule; line 28 refigure is the taxpayer's (question 4) |
| Schedule 3 line 6b | stated rule |
| Form 6251 must-file with Form 8801 | stated rule; own reading for a zero credit (question 8) |
