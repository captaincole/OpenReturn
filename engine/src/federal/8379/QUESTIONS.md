# Form 8379 — questions and defaults

Form 8379 splits a joint return's items between the spouses, so the IRS can refund the injured spouse's share. It changes no amount on the return. No IRS text works the form with numbers, so the rules rest on the line instructions.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

### A52. Line 15, the basic standard deduction

- Source: "include one-half of your basic standard deduction ... 2025 $30,000" (irs-8379-inst-2025::sec::line-15::b01, ::basic-standard-deduction::b01). The 2025 Form 1040 chart gives $33,100 for a joint return with one box checked (irs-1040-inst-2025::sec::single-1::b01), so the basic amount is $31,500.
- Decision: the joint return's line 12e less $1,600 for each age or blindness box, halved, plus each spouse's own boxes (`lines.ts`). The same rule covers a dependent's basic amount (line 4c of the Standard Deduction Worksheet for Dependents).
- Dollars: $750 more in each column in `erian` ($15,750, not $15,000).

### A53. Line 17 and Schedule 3 lines 10 and 11

- Source: line 17 names "Part II of Schedule 3" (irs-8379-inst-2025::sec::line-17::b01); line 19 takes Schedule 3 line 11 (::line-19::b01) and line 20 takes Schedule 3 line 10 (::line-20::b01).
- Decision: lines 10 and 11 go on lines 20 and 19 only (`partThree.ts`). Form 1040 line 30, the refundable adoption credit new for 2025, counts on line 17 and on line 9.
- Dollars: only with an extension payment or excess social security tax; no made-up taxpayer has one.

## Should we do this now

1. **The injured spouse's share of most lines is stated.** Done. The instructions leave joint items to the spouses: "allocate joint income ... as you determine" (irs-8379-inst-2025::sec::line-13b::b01); lines 14, 16, 17 and 18 say the same. The fact `refund.injured_spouse` states column (b) of lines 13b, 14, 15 (itemizing), 16, 17, 18 and 20, and the part of line 19 that no W-2 or 1099-R shows. The engine figures line 13a, most of line 19 and line 15 with the standard deduction.
2. **Line 9 leaves out the additional child tax credit.** Done. The line 9 list (irs-8379-inst-2025::sec::line-9::b01) does not name it, and line 8 asks about it. Line 9 is Yes when line 17 column (a) less Form 1040 line 28 is above 0. It changes only whether the form files.
3. **Line 7, earned income.** Done. Yes when the injured spouse's W-2s show wages, or the spouse owns a Schedule C business or a Schedule F farm. A business with a loss counts; a Form 1099-NEC with no business fact does not.
4. **Line 19, Additional Medicare Tax withholding.** Done. The instructions take "Form 8959, line 24, attributed to each spouse" (irs-8379-inst-2025::sec::line-19::b01). The injured spouse's part is Form 8959 lines 19 to 22 on that spouse's W-2s alone (box 6 less 1.45% of box 5, at least 0), at most line 24. $1 at most from rounding. Line 24's RRTA part (line 23) is not computed by the engine.
5. **Line 19 with excess social security tax.** Not now: Schedule 3 line 11 is not computed. Line 19 is unsupported when a spouse with more than one W-2 had more than $10,918.20 withheld.
6. **Line 20 when the spouses do not agree.** Not now: the IRS formula splits joint estimated payments by each spouse's separate tax liability (irs-8379-inst-2025::sec::line-20::b01), and the engine does not figure separate returns. Unsupported when the fact says the spouses do not agree.
7. **Line 15 with a disaster loss.** Not now: the instructions split only the basic and the additional standard deduction (irs-8379-inst-2025::sec::basic-standard-deduction::b01). Unsupported when the standard deduction is increased by a net qualified disaster loss (Schedule A line 16).
8. **Schedule 1-A and the QBI deduction have no line.** Done: Form 1040 lines 13a and 13b are on no line. Line 15 is "Form 1040 or 1040-SR, line 12" (irs-8379-inst-2025::sec::line-15::b01), and "the IRS will generally use information reported with the jointly filed Form 1040 or 1040-SR to allocate the QBI deduction" (::future-developments::b01).
9. **Part I stops take the form off the return.** Done. "Stop here. Do not file this form" (irs-8379-face-2025::sec::face-part-i::b01 to ::b03). The Yes boxes of lines 5, 6, 8 and 9 are named in `filesOnlyWithAmountOn`; with none checked, the form leaves the return, even with the explicit decision.
10. **Part IV is blank.** Done. "Complete this part only if you are filing Form 8379 by itself and not with your tax return" (irs-8379-face-2025::sec::face-part-iv::b01). The engine attaches the form to the joint return.
11. **Form 8888 with Form 8379.** Not now: "You can't have your refund deposited into more than one account if you file Form 8379" (irs-8888-form-2025::sec::general-instructions::b01). A check across two forms is its own change; Cade must not record two accounts for such a filer (Form 8888 QUESTIONS.md item 5).
12. **Line 13a with Form 2106.** Done. Column (a) is Form 1040 line 1a, which also adds a Form 2106 excess reimbursement; column (b) is the injured spouse's W-2 box 1 (irs-8379-inst-2025::sec::line-13a::b01). An excess reimbursement falls in column (c).
13. **Line 3 with a joint federal tax debt.** Done. Line 3 asks about debts "owed only by your spouse", and its note sends a joint federal tax debt to innocent spouse relief (irs-8379-face-2025::sec::face-part-i::b01). The fact's `offsetForOtherSpouseDebt` is false for that debt, so line 3 is No and Part I stops.
14. **Line 15, one-half of an odd basic amount.** Done. Column (b) is one-half rounded by the IRS rule (50 cents up); column (c) is the rest, so "Column (a) must equal columns (b) + (c)" (irs-8379-face-2025::sec::face-part-iii::b01). A dependent's basic amount of $5,301 gives $2,651 and $2,650.
15. **Line 5 prints the state names.** Done. The form says "Enter the name(s) of the community property state(s)"; the fact holds two-letter codes, and the line prints "Texas, New Mexico".
16. **Line 13b, the type of each income.** Not now: the instructions say "Identify the type and amount" (irs-8379-inst-2025::sec::line-13b::b01), and the form has only the three amount cells. A statement attached to a form is a new kind of output (Proposals below).
17. **"Injured Spouse" on Form 1040 page 1.** Not now: "Enter 'Injured Spouse' in the upper left corner of page 1 of the joint return" (irs-8379-inst-2025::sec::how-to-file::b01). That is a change to Form 1040's header, which waits for a person (Proposals below).

## Pattern change

None. The form adds one fact kind (`refund.injured_spouse`) and reads the joint return's lines; it changes how no other form or fact works.

## Proposals for a discussion

- **Form 1040 header notation.** The 2025 Form 1040 has an "Other" box with an entry space in the upper left corner, and the engine leaves it unsupported. With Form 8379 on the return, the engine could check it and print "Injured Spouse"; no 1040 text says the box is the place, so a person should choose.
- **Attached statements.** Line 13b asks for the type of each income, and the form has no room for it. A small statement page made from the Form 1040 lines (interest, pension, and so on) would answer it; no form in the engine makes one yet.

## Second opinions

- PolicyEngine-US 2.154.0 (commit 363e9fc5, 2026-11-25) does not model Form 8379 or any split of a joint return between spouses. Its constants agree with the engine's: the 2025 joint basic standard deduction $31,500 (the base of decision A52), the 2025 additional amount $1,600 for a married filer, the Medicare rate 1.45%, and the 2025 social security wage base $176,100 at 6.2% ($10,918.20).
- It figures Additional Medicare Tax withholding as 0.9% of wages above $200,000. The engine reads each spouse's W-2 (box 6 less 1.45% of box 5), as Form 8959 lines 19 to 22 do. That is a scope difference: the form reads the W-2.
- IRS Direct File: no checkout is reachable from this project (issue #140). Not compared.
- Blind fill (14 cases, `.scratch/blind`): no dollar difference. One Part I difference (item 13) came from the engine run's input, not from a rule.

## Confidence

| Field group | Confidence |
| --- | --- |
| Part I lines 2 to 4, 5 | stated rule (the form's routing) |
| Part I lines 6 to 9 | own reading (items 2 and 3) |
| Part II lines 10 to 12 | stated rule |
| Part III column (a) | stated rule (each line names its Form 1040 lines); line 17 decision A53 |
| Line 13a column (b) | stated rule |
| Line 15 columns (b), (c), standard deduction | stated rule with decision A52; worksheet amounts printed in the instructions |
| Line 19 column (b) | stated rule; own reading for Form 8959 (item 4) |
| Lines 13b, 14, 15 itemized, 16, 17, 18, 20 column (b) | stated by the spouses (item 1) |
| Column (c) | stated rule: (a) less (b) |
| Part IV | stated rule (blank with the return) |
| Line 19 with excess social security, line 20 not agreed, line 15 with a disaster loss | unsupported |
