# Form 540NR: open questions

Form 540NR is the return of a part-year resident or a nonresident (issue #336). Residency is the taxpayer's statement. Column E of Schedule CA (540NR) is the taxpayer's statement too. Schedule CA (540NR) has its own file.

## Two texts conflict

1. **Rounding of the four-place ratios.** Decided: row A71 of `docs/rule-decisions.md` and the `DECISION` comment in `lines.ts` (rounded, the half up, for lines 36 and 38 and Schedule CA (540NR) Part IV line 3). The blind fill made the same choice.

## Should we do this now

1. **Who files without the decision.** The booklet's filing requirement compares gross income and AGI from all sources with charts (`ca-540nr-booklet-2025::sec::do-i-have-to-file::b01`). The resolver cannot see those amounts, so `decisions.scope.must_file_540nr` decides. Done: a part-year resident is asked; a nonresident is asked when a stated California amount is above 0 or a W-2 names California in box 15 with wages or withholding (the tax correctness review, 2026-11-26: before, a nonresident with only a California W-2 was never asked). Not now: a nonresident whose only California income is a rental or a K-1, with no stated amount, is not asked, because no fact names the source state of those items; Cade asks the residency questions and records the decision (issue #336).
2. **Form 540 on a Form 540NR return.** "Use Form 540NR if either you or your spouse/RDP were a nonresident or part-year resident" (`::which-form-to-use::b01`). Done: when Form 540NR files, Form 540 does not, even with `must_file_ca_540` true. The other California forms still follow `must_file_ca_540`; Cade should record it false for a part-year resident or a nonresident.
3. **Line 12 and line 81 read only California W-2s.** Line 81 says "Do not include ... tax withheld by other states" (`::line-81-california-income-tax-withheld::b01`). Done: a W-2 counts when its box 15 names California or no state, the rule Form 540 line 71 uses for the other forms. Form 540 itself still adds every W-2.
4. **Line 36 and line 38 with no total taxable income.** Line 19 is 0: there is nothing to divide. Done: line 36 is 0.0000; line 38 is 1.0000 when line 35 is above 0, else 0.0000. The tax is 0 either way.
5. **Line 72 and total taxable income.** The text says "If your taxable income or nonresident California source taxable income is more than $1,000,000"; its worksheet starts from line 35 (`::line-72-behavioral-health-services-tax::b01`). Both name the California taxable income of a Form 540NR filer, so the texts agree. Done: the worksheet, so only line 35 over $1,000,000 owes the tax.
6. **Lines 101, 103 and 125 print 0** when there is no overpayment, as Form 540 lines 97, 99 and 115 do (the same rules). Done.
7. **Line 37 uses the four-place rate, also when all income is California's.** The form says "Multiply line 35 by line 36" (`ca-540nr-face-2025::sec::face-page-2::b02`), and line 36 is rounded to four places (`ca-540nr-booklet-2025::sec::line-36-ca-tax-rate::b01`). A return with line 35 equal to line 19 can then show line 37 a few dollars away from line 31: in the blind fill's joint case, $208,588 × .0589 = $12,286 against a line 31 of $12,276. No text says to copy line 31. Done: the form's arithmetic. The blind fill made the same choice.
8. **More than three dependents (line 10).** The form has three rows. Line 10 is Form 540's rule: the count and the amount include every dependent, and the first three print. Not now: the statement for a fourth dependent is not printed on Form 540 either, so the fix belongs to both forms.

## Pattern change

1. **Line 39 rounding, and any amount times a four-place ratio.** Before: `roundDollars` (`money.ts`) snaps an amount to cents and then rounds, so 153 × .2843 = 43.4979 becomes $43.50 and prints $44 (rianna's line 39; one dollar on lines 40 to 124). After: the rule would round the exact product, which is under 50 cents and prints $43; a trial with a finer snap changed no other scenario of the golden suite, but the change is to the one money module of the engine, so a person decides.

## Field groups

| Group | Rule | Confidence |
| --- | --- | --- |
| Header, filing status, lines 7 to 11 | Form 540's rules | stated rule |
| Lines 12 to 19 | Form 540's rules; line 12 California W-2s only | stated rule |
| Lines 31 to 40 | tax on line 19, the California ratio, prorated exemptions | published example with numbers (Pub. 1100 Example 1) |
| Line 41, 50, 58 to 60, 71, 73, 85 to 87, 91 penalty, 123 | a named gap when the return needs a form figured for Form 540 only; else blank | stated rule |
| Lines 42, 62, 63, 72, 74, 81, 82, 88, 92, 93 | the form's arithmetic | stated rule |
| Lines 101 to 125 | Form 540's rules on the Form 540NR lines | stated rule |
| Lines 51 to 55, 61, 83, 84, 102, contributions, 120, 122, direct deposit, signing except email and phone, header extras, line 6 | unsupported, as on Form 540 | unsupported |

## Second opinions

- **Blind fill (2026-11-26).** A preparer filled 14 cases from the blank form and the booklet only: lines 19, 31, 35 to 40 and 72, and Schedule CA (540NR) Part IV lines 3 and 4. All 168 values match the engine; no blank-against-0 differences either.
- **PolicyEngine-US 2.154.1 (commit 0fbed6dd, 2026-11-26).** It models the California resident tax only: no Form 540NR, no California ratio, no Schedule CA (540NR) column E. So it checks only the constants this form shares with Form 540. They agree: exemption credits $153 and $475; the phase-out start $252,203 (single, separate), $504,411 (joint, surviving spouse), $378,310 (head of household); $6 for each $2,500 ($1,250 separate); the standard deduction $5,706 and $11,412; the 2025 single rate brackets; the 1% tax over $1,000,000. PolicyEngine applies that tax to resident taxable income; Form 540NR line 72 applies it to line 35 (item 5 above), a scope difference, not a lead.
- **Tax correctness review (2026-11-26).** Three findings stood and are fixed: line 10 column B failed on every Form 540NR return (so line 14 was always 0), a nonresident with a California W-2 was never asked whether Form 540NR files, and no scenario locked lines 14 and 16 or the ratio digits.
- No other reference implementation is named in the repository.

## Proposals for a discussion

1. **The forms that file with Form 540 only.** FTB 3506, 3510, 3514, 3800, 3801-CR, 3803, 3804-CR, 3805P, 3853, 5805, 5805F, 5870A, Schedule G-1, Schedule S and Schedule P (540) read Form 540's lines. Their resolvers file them with `must_file_ca_540`. The engine runs each resolver again as if the return were a full-year resident's (`californiaForms.ts`): a form that would file makes the Form 540NR line that takes it a named gap. The proposal: each form gets its Form 540NR rules (the 540NR line numbers and the prorated credits), one form at a time, and leaves this list.
2. **The head of household and dependent parent credits (lines 51 to 55).** No fact asks whether the taxpayer qualifies, on Form 540 or Form 540NR. The proposal: one fact kind for the three credits, read by Form 540 (lines 43 and 44, codes 170, 163 and 173), Form 540NR (lines 51 to 55) and Schedule P.
3. **Withholding on Forms 592-B and 593 (line 83).** A nonresident with California-source income often has it. The forms are input documents the product does not read yet.
4. **Proving nonresidency (noted for later).** The engine takes the stated residency. Cade may need more work to support a claim of nonresidency (the factors of FTB Pub. 1031); that is Cade's work, not the engine's.
5. **Where the other state's income comes from (noted for later).** Today the taxpayer states the California amount of each line. Later, the other state's return can be an input document, or, when the engine supports a second state, the two returns can split the income between them.
6. **The rounding of `roundDollars`** (Pattern change 1 above).
