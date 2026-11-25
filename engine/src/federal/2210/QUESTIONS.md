# Form 2210 (2025): open questions

Each item is a place where the form and the 2025 instructions do not settle a rule. It names the source text, the default the engine applies, and whether the default changes a dollar amount.

## Sorted by kind

1. **Two official texts conflict; a person decides:** items 1 and 15.
2. **Work that could be done; not now:** items 2, 3, 5, 6, 10, 12, 13 and 14 say why. Items 4, 7, 8, 9 and 11 are defaults that need no work.
3. **Pattern change:** item 16 (`filesOnlyWithAmountOn`).

The Part III columns are not a limit (item 17).

## 1. Withholding on a due date that pays an earlier underpayment (kind 1)

- Text A: "For withheld federal income tax and excess social security or tier 1 RRTA, you are considered to have paid one-fourth of these amounts on each payment due date unless you can show otherwise" (irs-2210-inst-2025::sec::table-1-estimated-tax-payments::b01), and "Your payments are applied first to any underpayment balance on an earlier installment even if you designate a payment for a later period" (section-b-figure-the-penalty::b01).
- Text B: "Do not enter any withheld federal income tax and excess social security or tier 1 RRTA on line 1b" (line-1b::b01). Line 1b is where the worksheet records the payment that pays an earlier underpayment.
- Default: text A. Withholding counts as paid on each due date. On that day it first pays an earlier unpaid underpayment, as Section A line 15 does, and the worksheet counts the days to that date.
- Changes dollars: yes. Under text B that part stays unpaid to April 15, 2026, and the penalty is higher.

## 2. The payment with the return (kind 2)

- Source: "Any payment made on your balance due return for 2025. Use the date you filed (or will file) your return or April 15, 2026, whichever is earlier" and the January 31 rule (line-11::b01, table-1-estimated-tax-payments::b02).
- Default: the engine has no filing date. It treats the balance as paid on April 15, 2026, the last day the worksheet counts. The January 31 rule never applies.
- Changes dollars: yes, for a filer who files and pays before April 15, 2026 (a lower penalty).
- Not now: it needs a new fact for the day the return is filed and paid, and a question for Cade; the default can only overstate the penalty by a few days of interest.

## 3. Line 38 when no box B, C or D applies (kind 2, a choice made)

- Source: "If you didn't check box B, C, or D in Part II, you don't need to figure the penalty. The IRS will figure any penalty for underpayment of estimated tax and send you a bill. ... Leave the penalty line on your return blank; don't file Form 2210" (the-irs-will-figure-the-penalty-for::b01). Form 1040: "If you choose to figure the penalty yourself, use Form 2210" and "you can leave line 38 blank and the IRS will figure the penalty and send you a bill" (irs-1040-inst-2025::sec::figuring-the-penalty::b01); the blank form: "If you want to figure it, you may use Part III as a worksheet".
- Choice: the engine figures the penalty only when a fact checks box B, C or D (a waiver of part, Schedule AI periods, withholding by date). Otherwise Form 1040 line 38 stays blank, line 37 does not include a penalty, and the IRS sends a bill. The texts above allow both choices.
- The other choice: figure the penalty on every return where line 37 is $1,000 or more. Each such return would then wait for two new answers, the 2024 tax and the 2024 AGI, before it is complete, and every existing scenario that owes $1,000 or more would change. The gain is only that line 37 shows the penalty the IRS will bill anyway.
- Changes dollars: yes, on Form 1040 line 37 (the penalty is not in the amount owed).

## 4. Rounding (kind 2, no work)

- Source: the IRS whole-dollar rule (CLAUDE.md); the worksheet's lines 4, 7, 10 and 13 are "$" amounts.
- Default: each payment is rounded to whole dollars; line 10 is 25% of line 9 to the nearest dollar in each column; withholding splits into four whole-dollar parts that add up to line 6; the worksheet keeps cents and rounds line 14 once. Schedule AI Part II rounds each line (line 33 at 49.6%, 18.6% and so on; line 35), and line 36 adds the rounded lines.
- Other reading: the blind fill rounded each worksheet line to cents first; it gave the same whole dollar in every case.
- Changes dollars: by at most a dollar.

## 5. Household employment taxes on line 2 (kind 2)

- Source: "Don't include household employment taxes if both of the following are true: (1) you didn't have federal income tax withheld from your income, and (2) you wouldn't be required to make estimated tax payments even if the household employment taxes weren't included" (line-2::b01).
- Default: (2) is read as "Part I without them shows no possible penalty (line 9 not more than line 6, or the form stops)".
- Changes dollars: yes, in rare cases.
- Not now: the text gives no other test to apply, and no scenario has a household employer who pays estimated tax.

## 6. Line 3 and Schedule 3 lines 13a, 13c, 13d and 13z (kind 2)

- Source: line 3 lists refundable credits "for example" (line-3::b01) and names neither Form 2439 nor the other Schedule 3 line 13 amounts.
- Default: the form is unsupported when one of them has an amount.
- Changes dollars: not applicable (unsupported).
- Not now: each of these credits has its own date rule for the penalty (Form 2439 tax is paid by the fund, not on a due date), and no scenario has one with an estimated tax penalty.

## 7. Box A with box C or D (kind 2, no work)

- Source: "If you checked box A, complete only page 1 of Form 2210" (waiver-of-penalty::b01).
- Default: box A (waive the whole penalty) leaves boxes C and D clear and page 2 blank; Form 1040 line 38 stays blank.
- Changes dollars: no.

## 8. Choosing box C, box D, or both (kind 2, no work)

- Source: box C "your penalty is reduced or eliminated when figured using the annualized income installment method"; box D "Your penalty is lower when figured by treating the federal income tax withheld ... as paid on the dates it was actually withheld" (the blank form).
- Default: the engine figures every method the facts allow and keeps the lowest penalty. A tie keeps the method with fewer boxes.
- Changes dollars: no (it picks the lowest).

## 9. Schedule AI line 9, the QBI deduction for a period (kind 2, no work)

- Source: "Enter your deduction for qualified business income" (line-9::b01). Line 9 is added to line 8, which is annualized.
- Default: the period fact holds the deduction figured on the period's annualized income, and line 9 takes it as stated.
- Changes dollars: yes, when a filer states the period's deduction before annualizing.

## 10. Schedule AI lines 14 and 16 that the instructions leave open

- Source: line 14 "You may adjust your 2025 taxable income here for any provision you did not account for elsewhere" (Schedule 1-A deductions, line-14::b01); line 16 names Part I line 2 taxes, Form 4972, Form 8814 and AMT, but not Schedule 2 line 1 (the excess advance premium tax credit), which is in Part I line 1 (line-16::b01).
- Default: Schedule AI is unsupported with a Schedule 1-A deduction, Form 8615, a Form 4952 line 4g election, or an amount on Schedule 2 line 1z.
- Changes dollars: not applicable (unsupported).
- Not now: each case needs a per-period amount that no fact holds yet, and no scenario combines it with the annualized method.

## 11. Schedule AI column (d) line 18 (kind 2, no work)

- Source: "the same type of credits as allowed on Form 2210, Part I, lines 1 and 3" (line-18::b01).
- Default: Form 1040 line 18 minus line 22 (the nonrefundable credits that line 22 used) plus Part I line 3.
- Changes dollars: no; it keeps column (d) line 19 equal to Part I line 4.

## 12. The 2024 AGI for the 110% test after a change to or from a joint return

- Source: "If the AGI shown on your 2024 tax return is more than $150,000" (line-19::b02); the joint-return rules for the 2024 tax (line-19::b03).
- Default: the stated 2024 AGI (prior_year.federal_agi). For two 2024 returns, Cade records the two AGIs added.
- Changes dollars: yes, when one spouse's 2024 AGI is under $150,000 and the sum is over it.
- Not now: neither the instructions nor Pub. 505 ("For 2024, AGI is the amount shown on Form 1040 or 1040-SR, line 11", irs-pub-505-2025::sec::higher-income-taxpayers::b01) say how to combine two 2024 returns, so there is no other rule to apply.

## 13. Farmers and fishers (kind 2)

- Source: "If at least two-thirds of your gross income for 2024 or 2025 is from farming and fishing, substitute 66 2/3% for 90%" and Form 2210-F (who-must-pay-the-underpayment::b01, exceptions-to-the-penalty::b02).
- Default: the form is unsupported when Schedule F or Form 4835 files; the engine does not figure the two-thirds share.
- Changes dollars: not applicable (unsupported).
- Not now: it is a separate form (Form 2210-F) with its own catalog.

## 14. Smaller defaults (kind 2)

Not now: each needs a fact the engine does not have (a payment date for a 2024 balance, a section 965 or 1062 election), and no scenario has one.


- The 2024 overpayment applied always counts on April 15, 2025; the engine has no date for a 2024 balance paid later (table-1-estimated-tax-payments::b02). Changes dollars: rarely.
- Section 965 net tax liability and section 1062(a) elections are not taken out or added (line-1::b01, line-3::b01): the engine has no facts for them. Changes dollars: only with those elections.
- Line 28 below $400 is tested on net earnings (profit × 92.35%), as Schedule SE line 4c does (line-28::b01). Changes dollars: no in practice.
- "Line 8 (additional tax on distributions only)" (line-2::b01): the engine's Schedule 2 line 8 holds only Form 5329 Part I, so it is taken whole. Changes dollars: no today.
- Schedule AI Part II prints all four columns when any period has net earnings from self-employment.

## 15. No 2024 tax liability, and no 2024 return (kind 1)

- Text A: "You won't have to pay the penalty or file this form if ... You had no tax liability for 2024, you were a U.S. citizen or resident alien for the entire year ..., and your 2024 tax return was (or would have been had you been required to file) for a full 12 months" (exceptions-to-the-penalty::b01).
- Text B, line 8: "If you didn't file a return for 2024 or your 2024 tax year was less than 12 months, don't complete line 8. Instead, enter the amount from line 5 on line 9" (line-19::b03).
- The conflict: for a full-year citizen who did not file for 2024 because no tax was due, text A says no penalty, and text B makes line 9 equal to line 5, so a penalty can follow.
- Default: the engine applies the exception only through line 8. A stated 2024 tax of 0 makes line 8 and line 9 zero, so line 9 is not more than line 6 and no penalty is figured. With `prior_year.no_twelve_month_return` true, line 9 is line 5 and the penalty is figured, even for a full-year citizen who did not file because the 2024 tax was zero. The engine has no fact for full-year citizenship or residence.
- Other reading: a filer who was not required to file for 2024 and had no 2024 tax should record a 2024 tax of 0 (not "no 12-month return"), because the exception counts a return that "would have been" for 12 months. The blind fill raised this for its case 7 and kept the penalty, because the case did not say the 2024 tax was zero.
- Changes dollars: yes. The whole penalty, for a 2024 non-filer with no tax liability whom Cade records as "no 12-month return".

## 16. `filesOnlyWithAmountOn` takes several fields and a checked box (kind 3, pattern change)

- Before: a form named one line of another form, and the engine took the form off the return when that line held no amount above 0 (Form 8888 and Form 1040 line 35a).
- After: a form names one or more fields, and an amount above 0 or a checked box on any of them keeps it; a field of the form's own that is blank or a gap also keeps it, so its questions stay in sight. Form 2210 names its five Part II boxes and leaves the return when none ends up checked; Form 8888 behaves as before (`engine/tests/unit/filesOnlyWithAmountOn.test.ts`, `tests/unit/federal/8888/form.test.ts`). The root `CLAUDE.md` section "A form that files only with an amount on another form" says the same.

## 17. More payments than the four Part III columns

- Part III has one column for each due date, not for each payment. Line 11 adds every payment made through that column's due date; a payment after January 15, 2026 is on no column. The penalty worksheet takes each payment on its own day, so the number of payments has no limit and nothing is dropped (`worksheet.test.ts`, "nine payments").

## Second opinions

- Blind fill (14 cases, from the blank form and instructions only): no dollar difference on any line. The only difference is case 10 line 19: the comparison script called the worksheet directly and printed 0; the blind fill left it blank because line 11 is at least line 10 in every column ("stop here"). The form itself leaves line 19 blank there, because a zero penalty with no box C or D figures no Part III. Case 11 (line 17 zero in every column) is also blank on the form, 0 in the blind fill.
- Blind doubts that the text settles: the June 16, 2025 payment counts as made on June 15, a Sunday ("the payment is considered made on the due date", table-1-estimated-tax-payments::b01); the engine and the blind fill agree. The early-distribution tax on Schedule 2 line 8 goes on line 2 (item 14). The withholding default (item 1) and rounding (item 4) are the blind fill's choices too.
- PolicyEngine-US 2.153.8 (commit b3edc0446b): it does not model Form 2210 or the estimated tax penalty. A search of `variables/gov/irs` and `parameters/gov/irs` finds no 2210, underpayment, safe harbor or required-installment variable, so the 90% / 100% / 110% tests, the $150,000 / $75,000 AGI limits, the $1,000 floor and the 7% rate were not compared.
- IRS Direct File (IRS-Public/direct-file, commit e365f9f): its fact dictionary (`backend/src/main/resources/tax`) has no Form 2210, underpayment or estimated tax penalty fact. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I lines 1–9 and the line 9 boxes | stated rule |
| Part II box A, B, E | stated rule |
| Part II box C, D (lowest penalty) | own reading (item 8) |
| Part III line 10 (regular), line 11 | published example with numbers (Example 1) |
| Part III lines 12–18 | published example with numbers (Example 3) |
| Part III line 19 (penalty worksheet) | published example with numbers (Examples 2–4, Table 2); item 1 and 2 defaults |
| Schedule AI lines 1–8, 10–13, 17, 19–27 | stated rule |
| Schedule AI line 9 | own reading (item 9) |
| Schedule AI line 14 | stated rule; unsupported cases (item 10) |
| Schedule AI lines 15–16, 18 | stated rule; column (d) own reading (items 10, 11) |
| Schedule AI Part II lines 28–36 | stated rule |
| Form 1040 lines 26, 35a, 37, 38 | stated rule (irs-1040-inst-2025::sec::line-26::b01, figuring-the-penalty::b01) |
