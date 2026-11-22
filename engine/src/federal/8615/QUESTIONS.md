# Form 8615 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount.

## 1. Who files: unearned income from facts

- Text: "The child had more than $2,700 of unearned income" (irs-8615-inst-2025::sec::who-must-file::b01).
- The gap: a resolver cannot read line 1.
- Default: the form files when the 1099-INT taxable interest, the 1099-DIV ordinary dividends and the capital gain distributions add to more than $2,700, or when Cade recorded the parent's return. A child whose unearned income comes from sales, a trust or rents, with no parent's return recorded, does not file; the explicit decision `decisions.scope.must_file_8615` still files it.
- Changes dollars: yes, for that child (the regular tax is used).

## 2. Condition 2: the child must file

- Text: "The child is required to file a tax return" (::who-must-file::b01).
- Default: the engine figures the child's return, so the condition holds. A child who files without having to has taxable income of 0 or close to it, and line 5 then stops the form.
- Changes dollars: no.

## 3. A child someone can claim as a dependent

- Text: "These rules apply whether or not the child is a dependent" (::who-must-file::b01).
- The gap: Form 1040 line 12e has no Standard Deduction Worksheet for Dependents (a KNOWN GAP of Form 1040, `line.12a_you_as_dependent` is unsupported). Line 4 reads line 15, which then uses the full standard deduction.
- Default: none on this form. The nynaeve scenario is a child nobody can claim.
- Changes dollars: yes, for a dependent child.

## 4. Earned income from a business

- Text: earned income includes "a reasonable allowance for compensation for personal services, but not more than 30% of the child's share of the net profits" when capital is a material factor (::line-1::b01); "Generally, your child's earned income is the total of the amounts reported on Form 1040 ... line 1z; and Schedule 1 (Form 1040), lines 3 and 6 (if ... a loss, use zero)" (::alternate-worksheet-for-form-8615-line-1::b01).
- Default: Form 1040 line 1z plus Schedule 1 lines 3 and 6, a loss as zero. The 30% limit and a taxable distribution from a qualified disability trust (::line-1::b02) are not modeled.
- Changes dollars: yes, for a child with a business where capital matters, or a disability trust.

## 5. The Alternate Worksheet's losses

- Text: line B is "the total of any net loss from self-employment, any net operating loss deduction, any foreign earned income exclusion, and any foreign housing exclusion" (::alternate-worksheet-for-form-8615-line-1::b01).
- Default: a loss on Schedule 1 line 3, a loss on line 6, and the net operating loss deduction on line 8a, each as a positive number. Form 2555 makes the form unsupported.
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
- Changes dollars: by a dollar at most.

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

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, lines A–C | stated rule |
| Line 1 | published example (Amanda Black, Roger, Eleanor; Pub. 929 (2012) Joshua) |
| Line 2 | published example (Roger, Eleanor) |
| Lines 3–5 | stated rule; Pub. 929 (2012) Joshua |
| Line 6 | stated rule |
| Line 7 | published example (Persimmon) |
| Line 8 and its parts (Line 5 Worksheet #1) | published example (Pub. 929 (2012) Joshua, Randy) |
| Line 5 Worksheets #2 and #3 | own reading of the stated rule |
| Line 9 and its box | stated rule (the Qualified Dividends and Capital Gain Tax Worksheet) |
| Line 10 and its box | stated rule; the box is own reading (item 12) |
| Lines 11–13 | published example (Sharon Persimmon; Pub. 929 (2012) Randy, Joshua) |
| Lines 14–18 and the boxes | stated rule; Pub. 929 (2012) Joshua for the arithmetic |
| Schedule D Tax Worksheet, Schedule J, Form 2555, Form 4952 election | unsupported |
