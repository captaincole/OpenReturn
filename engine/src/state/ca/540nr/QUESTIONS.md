# Form 540NR: open questions

Form 540NR is the return of a part-year resident or a nonresident (issue #336). Residency is the taxpayer's statement. Column E of Schedule CA (540NR) is the taxpayer's statement too. Schedule CA (540NR) has its own file.

## Doubts with no conflicting text

1. **Who files without the decision.** The booklet's filing requirement compares gross income and AGI from all sources with charts (`ca-540nr-booklet-2025::sec::do-i-have-to-file::b01`). The resolver cannot see those amounts. Default: `decisions.scope.must_file_540nr` decides; a part-year resident, or a nonresident who states a California amount above 0, is asked; anyone else does not file. No dollars change.
2. **Form 540 on a Form 540NR return.** "Use Form 540NR if either you or your spouse/RDP were a nonresident or part-year resident" (`::which-form-to-use::b01`). Default: when Form 540NR files, Form 540 does not, even with `must_file_ca_540` true. The other California forms still follow `must_file_ca_540`; Cade should record it false for a part-year resident or a nonresident. No dollars change.
3. **Line 12 and line 81 read only California W-2s.** Line 81 says "Do not include ... tax withheld by other states" (`::line-81-california-income-tax-withheld::b01`). Default: a W-2 counts when its box 15 names California or no state, the rule Form 540 line 71 uses for the other forms. Form 540 itself still adds every W-2. Dollars change only for a W-2 of another state.
4. **Line 39 rounding.** Line 39 is line 11 (or worksheet line n) times line 38. The engine keeps the cents before it rounds (`money.ts`): 153 × .2843 = 43.4979, which is $43.50 to the cent, so line 39 is $44. One dollar at most.
5. **Line 36 and line 38 with no total taxable income.** Line 19 is 0: there is nothing to divide. Default: line 36 is 0.0000; line 38 is 1.0000 when line 35 is above 0, else 0.0000. No dollars change: the tax is 0.
6. **Line 72 and total taxable income.** The text says "If your taxable income or nonresident California source taxable income is more than $1,000,000"; its worksheet starts from line 35 (`::line-72-behavioral-health-services-tax::b01`). Default: the worksheet, so only line 35 over $1,000,000 owes the tax. A part-year resident with line 19 over $1,000,000 and line 35 under it owes none; the worksheet's line 3 would be negative.
7. **Lines 101, 103 and 125 print 0** when there is no overpayment, as Form 540 lines 97, 99 and 115 do (the same rules).

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

## Proposals for a discussion

1. **The forms that file with Form 540 only.** FTB 3506, 3510, 3514, 3800, 3801-CR, 3803, 3804-CR, 3805P, 3853, 5805, 5805F, 5870A, Schedule G-1, Schedule S and Schedule P (540) read Form 540's lines. Their resolvers file them with `must_file_ca_540`. The engine runs each resolver again as if the return were a full-year resident's (`californiaForms.ts`): a form that would file makes the Form 540NR line that takes it a named gap. The proposal: each form gets its Form 540NR rules (the 540NR line numbers and the prorated credits), one form at a time, and leaves this list.
2. **The head of household and dependent parent credits (lines 51 to 55).** No fact asks whether the taxpayer qualifies, on Form 540 or Form 540NR. The proposal: one fact kind for the three credits, read by Form 540 (lines 43 and 44, codes 170, 163 and 173), Form 540NR (lines 51 to 55) and Schedule P.
3. **Withholding on Forms 592-B and 593 (line 83).** A nonresident with California-source income often has it. The forms are input documents the product does not read yet.
4. **Proving nonresidency (noted for later).** The engine takes the stated residency. Cade may need more work to support a claim of nonresidency (the factors of FTB Pub. 1031); that is Cade's work, not the engine's.
5. **Where the other state's income comes from (noted for later).** Today the taxpayer states the California amount of each line. Later, the other state's return can be an input document, or, when the engine supports a second state, the two returns can split the income between them.
