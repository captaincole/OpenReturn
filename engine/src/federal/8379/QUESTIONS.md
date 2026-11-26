# Form 8379 — questions and defaults

Form 8379 splits a joint return's items between the spouses, so the IRS can refund the injured spouse's share. It changes no amount on the return. No IRS text works the form with numbers, so the rules rest on the line instructions.

Two decisions with conflicting texts are in `docs/rule-decisions.md` (A44, line 15's basic standard deduction; A45, Schedule 3 lines 10 and 11 on line 17). The doubts below have no conflicting text.

## 1. The injured spouse's share of most lines is stated

- Source: "allocate joint income, such as interest earned on a joint bank account, as you determine" (irs-8379-inst-2025::sec::line-13b::b01); lines 14, 16, 17 and 18 say the same for the items that belong to neither spouse.
- Default: the fact `refund.injured_spouse` states column (b) of lines 13b, 14, 15 (itemizing), 16, 17, 18 and 20, and the part of line 19 that no W-2 or 1099-R shows. The engine figures line 13a, most of line 19 and line 15 with the standard deduction.
- Dollars: no. Cade asks for each share.

## 2. Line 9 leaves out the additional child tax credit

- Source: "Refundable credits include the following. American opportunity credit. Credit for federal tax paid on fuels. Refundable prior year minimum tax. Premium tax credit." (irs-8379-inst-2025::sec::line-9::b01). Line 8 asks about the additional child tax credit.
- Default: line 9 is Yes when line 17 column (a) less Form 1040 line 28 is above 0. A spouse with no earned income reaches line 9 and does not get there by the other spouse's additional child tax credit.
- Dollars: no. Only whether the form files.

## 3. Line 17 counts the refundable adoption credit

- Source: "include any refundable tax credits (except the earned income credit) shown on your joint return" (irs-8379-inst-2025::sec::line-17::b01). The 2024 instructions name lines 28 and 29; Form 1040 line 30 is new for 2025.
- Default: line 17 column (a) adds Form 1040 line 30. Line 9 counts it too.
- Dollars: only on the form, with an adoption credit.

## 4. Line 7, earned income

- Source: "Did you have earned income, such as wages, salaries, or self-employment income?" (the form).
- Default: Yes when the injured spouse's W-2s show wages, or the spouse owns a Schedule C business or a Schedule F farm. A business with a loss counts; a Form 1099-NEC with no business fact does not.
- Dollars: no. Only whether the form files, when lines 5 and 6 are No.

## 5. Line 19, Additional Medicare Tax withholding

- Source: "include on this line ... any Additional Medicare Tax withholding from Form 8959, line 24, attributed to each spouse" (irs-8379-inst-2025::sec::line-19::b01).
- Default: the injured spouse's part is Form 8959 lines 19 to 22 on that spouse's W-2s alone (box 6 less 1.45% of box 5, at least 0), at most line 24. Line 24's RRTA part (line 23) is not computed by the engine.
- Dollars: $1 at most, from rounding; column (c) takes the rest.

## 6. Line 19 with excess social security tax

- Source: line 19 includes "any excess social security or tier 1 railroad retirement (RRTA) tax withheld" (irs-8379-inst-2025::sec::line-19::b01).
- Default: Schedule 3 line 11 is not computed, so line 19 is unsupported when a spouse with more than one W-2 had more than $10,918.20 withheld.

## 7. Line 20 when the spouses do not agree

- Source: "If you can't agree, the estimated tax payments will be allocated according to the following formula" by each spouse's separate tax liability (irs-8379-inst-2025::sec::line-20::b01).
- Default: unsupported when the fact says the spouses do not agree. Separate returns are not figured.

## 8. Line 15 with a disaster loss

- Source: the instructions split only the basic and the additional standard deduction (irs-8379-inst-2025::sec::basic-standard-deduction::b01).
- Default: unsupported when the standard deduction is increased by a net qualified disaster loss (Schedule A line 16).

## 9. Schedule 1-A and the QBI deduction have no line

- Source: line 15 is "Form 1040 or 1040-SR, line 12" (irs-8379-inst-2025::sec::line-15::b01). "the IRS will generally use information reported with the jointly filed Form 1040 or 1040-SR to allocate the QBI deduction" (::future-developments::b01).
- Default: Form 1040 lines 13a and 13b are on no line of Form 8379.
- Dollars: no amount on the form changes.

## 10. Part I stops take the form off the return

- Source: "Stop here. Do not file this form. You are not an injured spouse." (irs-8379-face-2025::sec::face-part-i::b01 to ::b03).
- Default: the Yes boxes of lines 5, 6, 8 and 9 are named in `filesOnlyWithAmountOn`. With none checked, the form leaves the return, even with the explicit decision.

## 11. Part IV is blank

- Source: "Complete this part only if you are filing Form 8379 by itself and not with your tax return" (irs-8379-face-2025::sec::face-part-iv::b01).
- Default: the engine attaches the form to the joint return, so Part IV is blank.

## 12. Form 8888 with Form 8379

- Source: "You can't have your refund deposited into more than one account if you file Form 8379" (irs-8888-form-2025::sec::general-instructions::b01).
- Default: no check yet. Cade must not record two accounts for a filer who files Form 8379 (Form 8888 QUESTIONS.md item 5).

## 13. Line 13a with Form 2106

- Source: line 13a column (a) is "any income shown on your joint return from Form(s) W-2" (irs-8379-inst-2025::sec::line-13a::b01). Form 1040 line 1a also adds a Form 2106 excess reimbursement.
- Default: column (a) is Form 1040 line 1a; column (b) is the injured spouse's W-2 box 1. An excess reimbursement falls in column (c).
- Dollars: only with a Form 2106 excess reimbursement of the injured spouse.

## 14. Line 3 with a joint federal tax debt

- Source: line 3 asks about past-due debts "owed only by your spouse"; its note reads "If the past-due amount is for a federal tax liability owed by both you and your spouse, you may qualify for innocent spouse relief" (irs-8379-face-2025::sec::face-part-i::b01).
- Default: the fact's `offsetForOtherSpouseDebt` is false for a federal tax debt of a joint return both spouses filed, so line 3 is No and Part I stops. The blind fill read it this way; the first engine run had answered line 3 Yes and line 4 Yes.
- Dollars: no. Both paths stop; only the checked box differs.

## 15. Line 15, one-half of an odd basic amount

- Source: "include one-half of your basic standard deduction" (irs-8379-inst-2025::sec::line-15::b01), with "Column (a) must equal columns (b) + (c)" (irs-8379-face-2025::sec::face-part-iii::b01).
- Default: column (b) is one-half rounded by the IRS rule (50 cents up); column (c) is the rest. A dependent's basic amount of $5,301 gives $2,651 and $2,650. The blind fill chose the same.
- Dollars: $1 between the columns.

## Second opinions

- PolicyEngine-US 2.154.0 (commit 363e9fc5, 2026-11-25) does not model Form 8379 or any split of a joint return between spouses. Its constants agree with the engine's: the 2025 joint basic standard deduction $31,500 (the base of decision A44), the 2025 additional amount $1,600 for a married filer, the Medicare rate 1.45%, and the 2025 social security wage base $176,100 at 6.2% ($10,918.20).
- It figures Additional Medicare Tax withholding as 0.9% of wages above $200,000. The engine reads each spouse's W-2 (box 6 less 1.45% of box 5), as Form 8959 lines 19 to 22 do. That is a scope difference: the form reads the W-2.
- IRS Direct File: no checkout is reachable from this project (issue #140). Not compared.
- Blind fill (14 cases, `.scratch/blind`): no dollar difference. One Part I difference (item 14) came from the engine run's input, not from a rule.

## Confidence

| Field group | Confidence |
| --- | --- |
| Part I lines 2 to 4, 5 | stated rule (the form's routing) |
| Part I lines 6 to 9 | own reading (items 2 and 4) |
| Part II lines 10 to 12 | stated rule |
| Part III column (a) | stated rule (each line names its Form 1040 lines); line 17 decision A45 |
| Line 13a column (b) | stated rule |
| Line 15 columns (b), (c), standard deduction | stated rule with decision A44; worksheet amounts printed in the instructions |
| Line 19 column (b) | stated rule; own reading for Form 8959 (item 5) |
| Lines 13b, 14, 15 itemized, 16, 17, 18, 20 column (b) | stated by the spouses (item 1) |
| Column (c) | stated rule: (a) less (b) |
| Part IV | stated rule (blank with the return) |
| Line 19 with excess social security, line 20 not agreed, line 15 with a disaster loss | unsupported |
