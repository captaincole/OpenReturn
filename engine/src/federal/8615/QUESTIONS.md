# Form 8615 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount.

## 1. Who files: unearned income from facts

- Text: "The child had more than $2,700 of unearned income" (irs-8615-inst-2025::sec::who-must-file::b01).
- The gap: a resolver cannot read line 1.
- Text: unearned income "includes taxable interest, dividends, capital gains (including capital gain distributions), rents, royalties, pension and annuity income, taxable scholarship and fellowship grants not reported on Form W-2, unemployment compensation" (::unearned-income::b01).
- Default: the form files when the 1099-INT taxable interest, the 1099-DIV ordinary dividends and the capital gain distributions add to more than $2,700, or when Cade recorded the parent's return. A child whose unearned income comes from sales, unemployment, a pension, a trust, rents or a scholarship, with no parent's return recorded, does not file; the explicit decision `decisions.scope.must_file_8615` still files it.
- Changes dollars: yes, for that child (the regular tax is used). Example: a 17-year-old with a $20,000 W-2 and a $12,000 long-term gain, parents at 15% on gains: Form 1040 line 16 is $428; with Form 8615 it is $1,823 (unit test "a gain from a sale").
- Needs a person: counting the net 1099-B gain, 1099-G unemployment and 1099-R taxable amounts in the fallback was tried and reverted. It files Form 8615 on the alejandro scenario (a CPA answer key: age 22, W-2, stock sales, no Form 8615), which then waits on the full-time student and support answers and blanks Form 1040 line 16. Choose: add those two answers to alejandro (his values stay the same) and count the sales, or keep the fallback as it is.

## 2. Condition 2: the child must file

- Text: "The child is required to file a tax return" (::who-must-file::b01).
- Default: the engine figures the child's return, so the condition holds. A child who files without having to has taxable income of 0 or close to it, and line 5 then stops the form.
- Changes dollars: no.

## 3. A child someone can claim as a dependent

- Text: "These rules apply whether or not the child is a dependent" (::who-must-file::b01).
- The gap: Form 1040 line 12e has no Standard Deduction Worksheet for Dependents (a KNOWN GAP of Form 1040, `line.12a_you_as_dependent` is unsupported). Line 4 reads line 15, which then uses the full standard deduction.
- Default: the form asks `child_unearned_income.claimable_as_dependent`. When the answer is yes, every line of Form 8615 and Form 1040 line 16 are unsupported until Form 1040 line 12e has the worksheet (irs-1040-inst-2025::sec::line-16::b03), and the parent's return is not asked for. The nynaeve scenario answers no.
- Changes dollars: no (the lines are unsupported, not wrong). The worksheet itself is a change to Form 1040 and waits for a person.

## 4. Earned income from a business

- Text: earned income includes "a reasonable allowance for compensation for personal services, but not more than 30% of the child's share of the net profits" when capital is a material factor (::line-1::b01); "Generally, your child's earned income is the total of the amounts reported on Form 1040 ... line 1z; and Schedule 1 (Form 1040), lines 3 and 6 (if ... a loss, use zero)" (::alternate-worksheet-for-form-8615-line-1::b01).
- Default: Form 1040 line 1z plus Schedule 1 lines 3 and 6, a loss as zero. The 30% limit and a taxable distribution from a qualified disability trust (::line-1::b02) are not modeled.
- Changes dollars: yes, for a child with a business where capital matters, or a disability trust.

## 5. The Alternate Worksheet's losses

- Text: line B is "the total of any net loss from self-employment, any net operating loss deduction, any foreign earned income exclusion, and any foreign housing exclusion" (::alternate-worksheet-for-form-8615-line-1::b01).
- Default: a loss on Schedule 1 line 3, a loss on line 6, and the net operating loss deduction on line 8a, each as a positive number. Form 2555 makes the form unsupported.
- Any loss on Schedule 1 line 3 counts as a "net loss from self-employment" (::line-1::b01), so it moves line 1 to the Alternate Worksheet. The blind check (case 13: wages $16,000, a $2,000 Schedule C loss) read it the same way: line 1 = $14,000, not the $12,000 of the ordinary worksheet.
- Changes dollars: yes, when a child has both a profit and a loss.

## 6. The stops

- Text: line 3 "If zero or less, stop"; line 5 "If zero, stop; ... do attach it" (::line-3::b01, ::line-5::b01).
- Default: line 3 prints the result, which can be negative. After a stop the later lines are blank, the form still files, and Form 1040 line 16 is the regular tax.
- Changes dollars: no.

## 7. Line 7 with no amount

- Text: "Enter the total, if any" (::line-7::b01); "If line 7 is blank, skip lines 12a and 12b" (::line-11::b01).
- Default: no other child, or other children whose line 5 totals 0, leave line 7 blank.
- Changes dollars: no (line 13 is line 11 either way).

## 8. Line 12b's places

- Text: "rounded to at least three places" (::lines-12a-and-12b::b01).
- Default: three places. When three places give 1.000 (line 5 is almost all of line 12a), the engine keeps up to six, so the form's "× ." prints the digits. Line 13 rounds to the dollar.
- Changes dollars: by a dollar at most. Blind check case 14: line 11 $1,944 × .333 = $647; with 1/3 exactly it is $648.

## 9. The Line 5 Worksheets' rounding

- Text: the ratios are "rounded to at least three places"; the products have no rounding rule (::line-8::b04 through ::line-8::b10).
- Default: three places for each ratio, and each product rounds to the nearest dollar. The Pub. 929 (2012) example rounds $1,900 × .375 = $712.50 to $713, so Worksheet #1 follows a published example. Worksheets #2 and #3 have no published example: own reading.
- Changes dollars: by a few dollars of preferential income.

## 10. Worksheet #3 line 11

- Text: "If the child itemized deductions, enter the child's itemized deductions not directly connected with the production of the income shown on line 3 of this worksheet. Otherwise, enter the child's standard deduction" (::line-8::b09).
- Default: for a child who itemizes, Schedule A line 17 less the stated amount directly connected with the dividends and gain; otherwise Form 1040 line 12e. The qualified business income deduction and Schedule 1-A are not on the worksheet, so they stay off.
- Changes dollars: yes, for a child with those deductions.

## 11. Directly connected deductions

- Text: deductions "for expenses to produce or collect taxable income or to manage, conserve, or maintain property held for producing income"; miscellaneous itemized deductions are suspended (::line-2::b01).
- The gap: the instructions name no Schedule A line.
- Default: the child states both amounts (`child_unearned_income.itemized_for_unearned_income`, `…itemized_for_dividends_and_gains`); Form 8615 asks for them only when the child itemizes.
- Changes dollars: yes.

## 12. The line 10 box

- Text: "If the Qualified Dividends and Capital Gain Tax Worksheet, Schedule D Tax Worksheet, or Schedule J ... was used to figure the tax, check here" (form, line 10).
- Default: checked when the parent's return has qualified dividends, net capital gain, Schedule J, or 28% or section 1250 gain. The parent states no box.
- Changes dollars: no.

## 13. The parent's return is an answer

- Text: "If a child can't get the required information about their parent's tax return, the child ... can request the necessary information from the IRS" (::incomplete-information-for-filing::b01).
- Default: the parent's name, SSN, filing status, line 15, line 16, qualified dividends and net capital gain, and each other child's line 5, are one stated answer (`child_unearned_income.parent_return`). No input document is made: the create-input-documents skill does not make a Form 1040.
- Changes dollars: no.

## 14. A Form 4952 election

- Text: for line 9, "On line 3, enter the total of the amounts, if any, on line 4g of all Forms 4952 filed by the child, the parent, or any other child" (::using-the-qualified-dividends-and-capital-gain-tax-worksheet::b03).
- Default: the child's election (Form 4952 line 4g above 0) makes lines 9 and 15 unsupported; the parent's stated election makes line 9 unsupported. Line 17 uses the same worksheet inputs as Form 1040 line 16.
- Changes dollars: no (those lines are unsupported).

## 15. 28% rate gain and unrecaptured section 1250 gain

- Text: "if the child, the parent, or any other child has 28% rate gain or unrecaptured section 1250 gain, use the Schedule D Tax Worksheet" (::line-9::b01).
- Default: the child's 1099-DIV box 2b or 2d above 0, or a stated gain of the parent or another child, makes the lines that need the worksheet unsupported. A collectibles gain from a sale is not detected (Schedule D line 18 is unsupported in the engine).
- Changes dollars: yes, for a child with a collectibles sale.

## 16. Form 8814 on the same return

- Text: line 18 goes "on the child's Form 1040 ... line 16" (::line-18::b01); line 16 also adds "Tax from Form(s) 8814" (irs-1040-inst-2025::sec::line-16::b01).
- Default: Form 1040 line 16 is line 18 plus each Form 8814 line 15.
- Changes dollars: no.

## 17. The alternative minimum tax

- Text: "A child may be subject to AMT" (::alternative-minimum-tax-amt::b01). The 2025 Form 6251 instructions give a child no other exemption.
- Default: nothing changes on Form 6251.
- Changes dollars: no.

## 18. Other children's qualified dividends and net capital gain

- Text: "The qualified dividends included on line 7 are the total of the amounts of qualified dividends included on line 5 of the other children's Forms 8615" (::line-8::b03); the net capital gain on line 7 likewise (::line-8::b02).
- The gap: the parent's return answer can give an other child's line 5 with no split.
- Default: an absent `qualifiedDividends` or `netCapitalGain` on an other child is 0, so all of that child's line 5 is taxed at ordinary rates on line 9.
- Changes dollars: yes, when an other child has qualified dividends or net capital gain on line 5 and the answer leaves them out.

## 19. Worksheet #1 and deductions connected with dividends and gains

- Text: "Use this worksheet only if line 2 of the child's Form 8615 is $2,700 and lines 3 and 5 are the same amount" (::line-8::b04). The worksheet has no line for itemized deductions directly connected with the dividends and gain.
- Default: when line 2 is $2,700 (the connected deductions are $1,350 or less), the engine uses Worksheet #1 and leaves out the deductions connected with the dividends and gain. The blind check (case 8: $300 connected, $200 of it with the dividends) did the same.
- Changes dollars: no under the text. A reading that took the $200 off the dividends (Worksheet #2's lines 1–9) would move a little preferential income to ordinary rates.

## Confidence by field group

| Field group                                                         | Confidence                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Header, lines A–C                                                   | stated rule                                                              |
| Line 1                                                              | published example (Amanda Black, Roger, Eleanor; Pub. 929 (2012) Joshua) |
| Line 2                                                              | published example (Roger, Eleanor)                                       |
| Lines 3–5                                                           | stated rule; Pub. 929 (2012) Joshua                                      |
| Line 6                                                              | stated rule                                                              |
| Line 7                                                              | published example (Persimmon)                                            |
| Line 8 and its parts (Line 5 Worksheet #1)                          | published example (Pub. 929 (2012) Joshua, Randy)                        |
| Line 5 Worksheets #2 and #3                                         | own reading of the stated rule                                           |
| Line 9 and its box                                                  | stated rule (the Qualified Dividends and Capital Gain Tax Worksheet)     |
| Line 10 and its box                                                 | stated rule; the box is own reading (item 12)                            |
| Lines 11–13                                                         | published example (Sharon Persimmon; Pub. 929 (2012) Randy, Joshua)      |
| Lines 14–18 and the boxes                                           | stated rule; Pub. 929 (2012) Joshua for the arithmetic                   |
| Schedule D Tax Worksheet, Schedule J, Form 2555, Form 4952 election | unsupported                                                              |

## Blind check

A preparer filled 15 cases by hand from the blank form and the instructions only. All 360 values (24 per case) match the engine: no dollar difference and no blank-against-zero difference. The preparer's doubts that can move dollars are items 5, 8, 9, 18 and 19.

## Second opinions

- **PolicyEngine-US 2.152.16** (commit 794e17e6): it does not compute the Form 8615 tax. It models only who the rule covers (`amt_kiddie_tax_applies`), for the Form 6251 child exemption limit. Compared:
  - The age groups (under 18; 18 with earned income not over half of support; 19 to 23 and a full-time student) and the joint-return exclusion match the resolver. PolicyEngine treats the support test as met when no support is reported; the engine asks.
  - It switches the child exemption limit off from 2018 (`amt/exemption/child/in_effect.yaml`), which matches item 17.
  - The $1,350 dependent standard deduction for 2025 matches `ITEMIZED_BASE`; line 2's $2,700 is twice that.
  - No disagreement on a constant or a formula. No engine change.
- **IRS Direct File** (IRS-Public/direct-file): its product docs say Form 8615 is out of scope ("The kiddie tax requires either form 8814 or 8615, neither of which Direct File supports"). Nothing to compare.
