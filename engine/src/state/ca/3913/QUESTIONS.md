# FTB 3913: open questions

Each place where the form and its instructions do not settle a rule. Short answers; a person decides.

## 1. Line 4: all reimbursements, or only those outside W-2 box 1?

- Form: "Enter the total amount your employer or the government paid you ... that is **not** included in box 1 of your federal Form W-2 (wages)."
- Instructions: "Enter the total reimbursements and allowances you received from your employer or the government for the expenses you claimed on line 1 and line 2." (ca-3913-inst-2025::sec::line-4::b01)
- Default: the form's text. Line 4 is what the employer paid outside W-2 box 1 (the fact's `employerPaidNotInWages`). A reimbursement in box 1 is already income, so the full cost is deducted.
- Changes dollars: yes (line 4, line 5, Schedule CA lines 14 and 1h).

## 2. A non-military reimbursement outside box 1, federally

- Source: the general information says an excess "not included in your wages on federal Form W-2 ... still must be included in income on Schedule CA (540) ... line 1h, column C" (ca-3913-inst-2025::sec::general-information::b01).
- Default: the engine adds the excess (line 4 − line 3) on Schedule CA line 1h column C only. It does not put the payment in federal income. For 2025 a non-military moving reimbursement is federal wages; the engine has no fact for one paid outside box 1. The erith scenario shows the California side only.
- Changes dollars: no for FTB 3913. Possibly yes for the federal return, a case the FTB instructions do not address.

## 3. Line 1h column C and line 26 column C hold other items too

- Source: line 1h column C also takes other items (employer HSA contributions, ca-540-sched-ca-inst-2025::sec::h-other-earned-income::b02); line 26 column C adds lines 11 to 23 and 25 (line-11-through-line-25::b08).
- Default: with an FTB 3913, line 1h column C is the FTB 3913 excess, and line 26 column C adds the column C lines the engine figures (line 14, line 21). Lines 12, 19a, 20 and 25 column C have no facts and read as blank, as column B does. With no FTB 3913, all three lines keep their earlier unsupported reasons.
- Changes dollars: no for the covered returns.

## 4. More than one move

- Source: "If you qualify to deduct expenses for more than one move, use a separate form FTB 3913 for each move." (ca-3913-inst-2025::sec::a-purpose::b01)
- Default: the engine prints one copy, so with two moves the form's lines and the military question are unsupported. Schedule CA line 14 and line 1h still add each non-military form.
- Changes dollars: no (an engine limit).

## 5. Both vehicle methods on one move

- Source: "you can figure the expenses by using either: Actual out-of-pocket expenses for gas and oil, or Mileage at the rate of 21 cents a mile." (ca-3913-inst-2025::sec::line-2::b01)
- Default: a move that states both is unsupported, as on Form 3903.
- Changes dollars: yes, only for that input.

## 6. Military allowances that are not income

- Source: lines 1 and 2 leave out "any expenses that were reimbursed by an allowance you do not have to include in your income" (ca-3913-inst-2025::sec::storage-fees::b01, line-2::b01); line 4 leaves out a dislocation allowance (line-4::b01).
- Default: the Form 3903 rule (federal/3903/QUESTIONS.md question 2): the allowance comes off line 1, then line 2, up to the cost line 4 leaves unpaid.
- Changes dollars: printed lines 1 and 2 only; line 5 does not depend on the split.

## 7. The time test before it is met

- Source: "If you expect to meet the time test, you can deduct your moving expenses in the year you move." (ca-3913-inst-2025::sec::what-if-you-do-not-meet-the-time-test-before-your-return-is-due::b01)
- Default: the fact's `meetsTimeTest` is true when the test is met, expected, or an exception applies. False files no form. Absent, the form files and waits.
- Changes dollars: no (the taxpayer's answer).

## 8. A military move: who files

- Source: "Non-military and military taxpayers, prepare form FTB 3913." (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b01)
- Default: a certified Armed Forces move on a return that files Form 540 or 540NR files FTB 3913, with "military member" Yes and the Form 3903 lines at the same 21 cents. Schedule CA has no adjustment.
- Changes dollars: no.

## 9. Schedule CA (540NR)

- Default: FTB 3913 files with Form 540NR, but Schedule CA (540NR) has no rules yet, so its lines 14 and 1h do not take the result.
- Changes dollars: yes for a 540NR filer (an engine limit).

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header name and SSN | stated rule (the return's names and SSN) |
| Military member Yes/No | stated rule |
| Who files (distance test, time test) | published example with numbers (FTB distance test; Pub. 521 2017) |
| Lines 1 and 2 | published example with numbers (Pub. 521 2017, at its 17-cent rate); stated rule for 21 cents |
| Line 3 | published example with numbers |
| Line 4 | published example with numbers; own reading for the box 1 question (question 1) |
| Line 5 Yes/No and amount | published example with numbers (Yes); stated rule (No) |
| Schedule CA (540) line 14 column C | stated rule |
| Schedule CA (540) line 1h column C and type | stated rule; own reading for the other items (question 3) |
| Schedule CA (540) line 26 column C | stated rule; own reading for the unbound lines (question 3) |
| More than one move, both vehicle methods | unsupported |
