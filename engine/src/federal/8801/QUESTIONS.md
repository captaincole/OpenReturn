# Form 8801 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount.

All inputs to lines 1–21 and Part III are 2024 amounts. The taxpayer states them (`facts/kinds/priorYearMinimumTax.ts`); the engine does not read last year's return (#79).

## 1. Who files: the form needs Part I even with no 2024 AMT

- Text: "Complete Form 8801 if ... for 2024 had: An AMT liability and adjustments or preferences other than exclusion items, A credit carryforward to 2025 ..., or An unallowed qualified electric vehicle credit ... File Form 8801 only if line 21 is more than zero" (irs-8801-inst-2025::sec::who-should-file::b01).
- The gap: a filer with only a carryforward and no 2024 AMT still has lines 1–15. The text does not say whether that filer completes Part I from a 2024 Form 6251 they did not file.
- Default: any minimum tax answer on file puts the form in scope, and the form asks for the 2024 Form 6251 lines. It files while line 21 waits, and stops when line 21 is figured and not above 0.
- Changes dollars: no (Part I with no 2024 AMT gives line 15 = 0 in the common case).

## 2. Line 3 is asked only with a 2024 net operating loss deduction

- Text: line 3 is "the total of the minimum tax credit net operating loss (MTCNOL) carryovers and carrybacks to 2024" (irs-8801-inst-2025::sec::line-3::b01).
- The gap: the instructions give no trigger. An MTCNOL comes from a year when income with only exclusion items was a loss, so a regular loss carryover exists too.
- Default: line 3 is asked only when the 2024 Form 6251 has a line 2e amount. Otherwise it is blank. The engine takes the stated MTCNOLD; it does not figure it.
- Changes dollars: yes, for a filer with an MTCNOL carryover and no 2024 regular NOL deduction (a regular carryover used up, or 2024 income below 0).

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
- Default: the engine subtracts every Schedule 3 line it figures. Line 22 is unsupported while a credit it subtracts is a gap: Form 3800, 8859, 8834, 8911 or 8978 files, or Schedule 3 line 1, 3, 4, 6c, 6f, 6g or 6m is unsupported. Line 5a (Form 5695 Part I) is not modeled anywhere; it counts as 0, as on Schedule 3 line 8.
- Changes dollars: yes, for a filer with a residential clean energy credit.

## 8. Who "claims" the credit for Form 6251

- Text: attach Form 6251 if "You claim ... the credit for prior year minimum tax (Form 8801)" (irs-6251-inst-2025::sec::who-must-file::b01).
- The gap: a Form 8801 with line 25 = 0 (only a carryforward) may not "claim" the credit.
- Default: Form 6251 files whenever Form 8801 files; line 23 reads its line 9. Schedule 3 files with Form 8801 too, and line 6b is blank when line 25 is 0.
- Changes dollars: no.

## 9. Line 21 not above 0 under the explicit decision

- Text: "If line 21 is zero or less, you don't have a minimum tax credit or a credit carryforward. Don't complete the rest of this form and don't file it" (irs-8801-inst-2025::sec::line-21::b01).
- Default: the form does not file from facts. With `decisions.scope.must_file_8801` true, lines 1–21 print and lines 22–26 stay blank.
- Changes dollars: no.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, identifying number) | stated rule |
| Line 4 married-filing-separately add-on | published example with numbers (line-4::b01) |
| Lines 1, 2, 4–10 | stated rule |
| Line 3 | stated rule for the amount; own reading for when it is asked (question 2) |
| Line 11 (AMT rates or Part III) | stated rule; Form 2555 unsupported |
| Line 12 | stated rule for the election; Form 1116 unsupported |
| Lines 13–21 | stated rule |
| Line 22 | stated rule; gaps per question 7 |
| Lines 23–26 | stated rule |
| Part III, lines 27–55 | stated rule; line 28 refigure is the taxpayer's (question 4) |
| Schedule 3 line 6b | stated rule |
| Form 6251 must-file with Form 8801 | stated rule; own reading for a zero credit (question 8) |
