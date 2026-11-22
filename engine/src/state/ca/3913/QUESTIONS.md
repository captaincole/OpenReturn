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
- Blind fill (2026-11-22, case 8: movers $2,500, lodging $300, a $400 dislocation allowance): the blind preparer left lines 1 and 2 as paid (line 5 $2,800); the engine takes the $400 off line 1 (line 5 $2,400). The engine stands: line-2::b01 and storage-fees::b01 say "do not include any expenses that were reimbursed by an allowance you do not have to include in your income", and Pub. 3 deducts only the expenses "that exceed your reimbursements and allowances (including dislocation allowances ...)" (irs-pub-3-2025::sec::how-to-report-moving-expenses::b01). The case did not say the allowance paid for no moving cost.
- Open: an allowance that pays for no cost on lines 1 and 2 (meals, deposits). The default takes the whole allowance off.
- Changes dollars: line 5 for a military member (no Schedule CA adjustment, so no California dollars). The split between lines 1 and 2 changes the printed lines only.

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

## 10. Whole-dollar rounding

- Source: the FTB 3913 and Schedule CA instructions give no rounding rule for this form.
- Default: the IRS nearest-dollar rule, as on Form 3903: lines 1, 2 and 4 keep cents while adding and round the total; line 3 adds the rounded lines 1 and 2. The blind fill made the same choice.
- Changes dollars: at most $1 on line 3 against one rounding of the unrounded total. No blind case differs.

## 11. W-2 box 12 code P for a military member

- Source: line-4::b01 leaves the allowances off line 4, then says "This excluded amount should be identified on federal Form W-2, box 12, with code P for excludable moving expense reimbursements paid directly to a member of the U.S. Armed Forces."
- Default: a government reimbursement shown with code P is not in box 1, so it is on line 4 (the form's line 4 text, and Form 3903). "This excluded amount" is not read as "leave code P off line 4". The blind fill agrees (case 7).
- Changes dollars: line 5 for a military member only (no Schedule CA adjustment).

## 12. A remote worker's old workplace

- Source: distance-test::b01 covers a filer with no old workplace: the new workplace "must be at least 50 miles from your old home". It does not say what the old workplace is for someone who worked from home.
- Default: the taxpayer's stated miles to the old workplace (0 for a home office). The blind fill agrees (case 11).
- Changes dollars: yes, whether the form files at all, for a move near the 50-mile edge.

## Second opinions

- PolicyEngine-US 2.152.16 (commit 794e17e6, 2026-11-22; sparse checkout of `variables` and `parameters` under `gov/irs` and `gov/states/ca`): no moving expense variable or parameter, federal or California. Nothing to compare.
- IRS Direct File: federal only, no FTB 3913, and the repo names no checkout of its tax logic (issue #140). Not compared.

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
