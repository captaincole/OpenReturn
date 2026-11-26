# Law findings

This page lists the places where official texts disagree, checked against the text of the Internal Revenue Code in the law library. A person decides each one: the page records the texts, it does not rule.

How to read it:

- Each statute passage has its block id (`usc-26-2025::sec::s469::g-1` is section 469(g)(1)). `npm run corpus -- law read "<citation>"` prints it.
- Each instruction passage has its corpus block id. `npm run corpus -- read <blockId>` prints it.
- "Row" names a row of `docs/rule-decisions.md`. The library is the Code as of January 2026. It has no regulations, no California law and no statutory notes, so no effective date was checked.
- Checked on 2026-11-25.

## The form or its instructions disagree with the statute

### Schedule E line 28: the released passive loss (row 1)

- Instructions: "Enter on a separate line in column (g) of line 28 your total prior-year unallowed losses not reported on Form 8582" (`irs-1040se-inst-2025::sec::prior-year-unallowed-losses-from-a-passive::b01`). Column (g) is headed "(g) Passive loss allowed" (`irs-1040se-face-2025::sec::face-part-ii::b02`).
- Statute, section 469(g)(1)(A): on a full disposition, the excess loss "shall be treated as a loss which is not from a passive activity" (`usc-26-2025::sec::s469::g-1`).
- The Form 8582 instructions agree with the statute: "An overall loss from an entire disposition of a passive activity is a nonpassive loss if you have an aggregate loss from all other passive activities" (`irs-8582-inst-2025::sec::reporting-an-entire-disposition-on-form-4797-or::b01`).
- Engine: column (g), as the Schedule E instructions say (`engine/src/federal/schedule-e/partII.ts`).
- Dollars: none. Lines 32 and 41 are the same either way. Only the column label differs.
- Status: decided on 2026-11-24, row 1.

### Form 8824 line 21: the cap on section 1245 recapture (row A4)

- Instructions, line 21: the depreciation "(up to the amount of gain shown on line 19)" (`irs-8824-inst-2025::sec::line-21::b01`). The example: "the lesser of the property's depreciable basis of $35,000 or the amount realized of $55,000" (`irs-8824-inst-2025::sec::line-24::b01`).
- Statute, section 1245(a)(1): "if section 1245 property is disposed of the amount by which the lower of— (A) the recomputed basis of the property, or (B)(i) in the case of a sale, exchange, or involuntary conversion, the amount realized" ... "exceeds the adjusted basis of such property shall be treated as ordinary income" (`usc-26-2025::sec::s1245::a-1`).
- The statute measures the recapture on the section 1245 property itself, by its own amount realized. That is the example's arithmetic. The line instruction caps it by the gain of the whole property only. Section 1245(b)(4) adds a second cap for a like-kind exchange (`usc-26-2025::sec::s1245::b-4`); the engine applies that cap.
- Engine: the line instruction, because the fact does not hold the value of the section 1245 parts (`engine/src/federal/8824/lines.ts`).
- Dollars: only when the parts are worth less than their depreciation. Parts worth $20,000, with $35,000 of depreciation and an adjusted basis of 0: $35,000 (engine) against $20,000 (the example's arithmetic and section 1245(a)(1)).
- Status: decided by the author on 2026-11-24, row A4, waiting for a person.

### Form 6252 line 19 and FTB 3805E line 19: the gross profit percentage (rows A1, A16)

- Instructions: "Enter it as a decimal rounded to at least 4 digits" (`irs-6252-form-2025::sec::part-ii-installment-sale-income::b01`).
- Statute, section 453(c): the income is "that proportion of the payments received in that year which the gross profit (realized or to be realized when payment is completed) bears to the total contract price" (`usc-26-2025::sec::s453::c`). It has no rounding.
- The form allows more digits, so the form and the statute can agree. The engine keeps exactly 4 places, so its amount differs from the exact proportion.
- Engine: `engine/src/federal/6252/lines.ts`, and `engine/src/state/ca/3805e/bindings.ts` for California.
- Dollars: under $1 for each $20,000 of payments.
- Status: decided by the author on 2026-11-24, rows A1 and A16, waiting for a person. California's conformity was not checked.

### Form 2555 lines 35 and 39: the ratio that prorates the exclusions (row A28)

- Form: "rounded to at least three places" (`irs-2555-face-2025::sec::face-part-vi::b01`, `irs-2555-face-2025::sec::face-part-vii::b01`).
- Statute, section 911(b)(2)(A): the exclusion may not exceed "the amount of foreign earned income computed on a daily basis at an annual rate equal to the exclusion amount" (`usc-26-2025::sec::s911::b-2-A`). It has no rounding.
- The form allows more places, so the form and the statute can agree. The engine keeps exactly 3 places.
- Engine: `engine/src/federal/2555/lines.ts`.
- Dollars: 306 days give $108,940 with 0.838, against $108,986 by the day: $46 less exclusion (made-up taxpayer `romanda`).
- Status: decided by the author on 2026-11-25, row A28, waiting for a person.

## The statute supports a decision made between two instructions

### Form 461: a business's capital loss (row 2)

- Text A, Pub. 225: "Business gains and losses reported on Form 4797 and Form 8949 are included in the excess business loss calculation" (`irs-pub-225-2025::sec::excess-business-loss::b01`).
- Text B, Form 461 instructions: "Losses from sales or exchanges of capital assets are not included in the calculation of the total deductions from your trades or businesses" (`irs-461-inst-2025::sec::line-3::b01`).
- Statute, section 461(l)(3)(B)(i): "Deductions for losses from sales or exchanges of capital assets shall not be taken into account under subparagraph (A)(i)" (`usc-26-2025::sec::s461::l-3-B`).
- Engine: Text B (`engine/src/federal/461/lines.ts`). Decided on 2026-11-24.

### Form 461: a business gain next to an investment loss (row 3)

- Text A: "should be added back on line 11". Text B: gains "should not exceed the lesser of capital gain net income limited to only gains and losses attributable to a trade or business, or capital gain net income" (both `irs-461-inst-2025::sec::line-3::b01`).
- Statute, section 461(l)(3)(B)(ii): the capital gains counted "shall not exceed the lesser of— (I) the capital gain net income determined by taking into account only gains and losses attributable to a trade or business, or (II) the capital gain net income" (`usc-26-2025::sec::s461::l-3-B`).
- Engine: Text B, the cap; $20,000 in the code's example (`engine/src/federal/461/lines.ts`). Decided on 2026-11-24.

### Form 6198: last year's deducted loss (row 4)

- Text A: "Your prior tax year line 21 deductible loss reduces your at-risk investment as of the beginning of your current tax year" (`irs-6198-inst-2025::sec::line-14-2::b01`). Text B: line 18 takes decreases "since the end of your prior tax year" (`irs-6198-inst-2025::sec::line-18::b01`).
- Statute, section 465(b)(5): the amount at risk in later years "shall be reduced by that portion of the loss which (after the application of subsection (a)) is allowable as a deduction" (`usc-26-2025::sec::s465::b-5`).
- Engine: Text A (`engine/src/facts/kinds/atRisk.ts`). Decided on 2026-11-24.

### Form 2210: withholding in the penalty worksheet (row 6)

- Text A: "you are considered to have paid one-fourth of these amounts on each payment due date" (`irs-2210-inst-2025::sec::table-1-estimated-tax-payments::b01`). Text B: "Do not enter any withheld federal income tax" on line 1b (`irs-2210-inst-2025::sec::line-1b::b01`).
- Statute, section 6654(g)(1): "an equal part of such amount shall be deemed paid on each due date for such taxable year" (`usc-26-2025::sec::s6654::g`).
- Engine: Text A (`engine/src/federal/2210/penaltyWorksheet.ts`). Decided on 2026-11-24.

### Form 2210: no tax last year and no return (row 7)

- Text A: no penalty if "You had no tax liability for 2024" (`irs-2210-inst-2025::sec::exceptions-to-the-penalty::b01`). Text B: "If you didn’t file a return for 2024" (`irs-2210-inst-2025::sec::line-19::b03`), use this year's tax.
- Statute, section 6654(e)(2): "No addition to tax shall be imposed" if the preceding year was 12 months, "the individual did not have any liability for tax for the preceding taxable year", and the individual "was a citizen or resident of the United States throughout the preceding taxable year" (`usc-26-2025::sec::s6654::e-2`). Text B follows section 6654(d)(1)(B): "Clause (ii) shall not apply if ... the individual did not file a return for such preceding taxable year" (`usc-26-2025::sec::s6654::d-1-B`). The exception applies whatever the required payment is.
- Engine: the exception, when last year's tax is recorded as 0 (`engine/src/federal/2210/outcome.ts`). Decided on 2026-11-24.

### Form 8621: the rate for April 1 to 15, 2026 (row 8)

- Text A, Form 2210 instructions: "Rate Period 4: January 1, 2026–April 15, 2026" at 7% (`irs-2210-inst-2025::sec::tax-year-2025::b04`). Text B: Rev. Rul. 2026-5, 6% for the quarter (not in the corpus).
- Statute: section 1291(c)(3)(A) figures the interest "by using the rates and method applicable under section 6621 for underpayments of tax" (`usc-26-2025::sec::s1291::c-3`). Section 6621(b)(2)(B) carries the earlier rate into April only "In determining the addition to tax under section 6654" (`usc-26-2025::sec::s6621::b`).
- Engine: 6% (`engine/src/data/underpaymentRates.ts`). Decided on 2026-11-24. The rates themselves come from revenue rulings, not the statute.

### Forms 8801 and 8911: tentative minimum tax and the AMT foreign tax credit (rows 12, A14)

- Text A: the line is Form 6251 line 9, line 7 less line 8. Text B: "Leave line 8 blank" when line 10 is at least line 7 (`irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01`).
- Statute, section 55(b)(1)(A): the tentative minimum tax "shall be reduced by the alternative minimum tax foreign tax credit for the taxable year" (`usc-26-2025::sec::s55::b-1-A`). Section 53(c)(2) limits the Form 8801 credit by "the tentative minimum tax for the taxable year" (`usc-26-2025::sec::s53::c`); section 30C(d)(2)(B) limits the Form 8911 credit the same way (`usc-26-2025::sec::s30c::d`).
- Engine: after the credit (`engine/src/federal/8801/credit.ts`, `engine/src/federal/8911/credit.ts`). Row 12 decided on 2026-11-24; row A14 decided by the author, waiting for a person.

### Forms 6252 and FTB 3805E: a related party resells marketable securities late (rows A2, A17)

- Text A: complete Part III "for the year of sale and 2 years after the year of sale" (`irs-6252-form-2025::sec::which-parts-to-complete::b01`). Text B: the rule applies "before making all payments on the first disposition" (`irs-6252-form-2025::sec::installment-sales-to-related-party::b01`); Pub. 537: "This rule doesn’t apply if the property involved is marketable securities" (`irs-pub-537-2025::sec::sale-and-later-disposition::b02`).
- Statute, section 453(e)(2)(A): "Except in the case of marketable securities, paragraph (1) shall apply only if the date of the second disposition is not more than 2 years after the date of the first disposition" (`usc-26-2025::sec::s453::e-2`).
- Engine: Text B (`engine/src/federal/6252/relatedParty.ts`, `engine/src/state/ca/3805e/sale.ts`). Decided by the author, waiting for a person. California's conformity was not checked.

### Schedule D-1: farmland held 10 years or longer (row A11)

- Text A: "Enter 100% of line 30a on line 30b if your property was held for 10 years or longer" (`ca-540-sched-d1-inst-2025::sec::irc-section-1252-property::b01`). Text B, Form 4797: "Skip line 27 if you dispose of such farmland during the 10th or later year" (`irs-4797-inst-2025::sec::line-27::b01`).
- Statute, section 1252(a)(1): the rule applies "if farm land which the taxpayer has held for less than 10 years is disposed of"; the table in section 1252(a)(3) gives "0 percent" at "10 years or more years after it was acquired" (`usc-26-2025::sec::s1252::a-1`, `usc-26-2025::sec::s1252::a-3`).
- Engine: Text B (`engine/src/state/ca/schedule-d-1/lines.ts`). Decided by the author, waiting for a person. California's conformity was not checked.

### Schedule D-1: the years of listed property depreciation (row A13)

- Text A: "from the year it was placed in service to the current year" (`ca-540-sched-d1-inst-2025::sec::part-iv::b02`). Text B, Form 4797: "up to (but not including) the current year" (`irs-4797-inst-2025::sec::line-34::b01`).
- Statute, section 280F(b)(2)(B)(i): the depreciation "allowable with respect to the property for taxable years before the 1st taxable year in which the property was not predominantly used in a qualified business use" (`usc-26-2025::sec::s280f::b-2`).
- Engine: Text B (`engine/src/facts/kinds/section179Recapture.ts`). Decided by the author, waiting for a person. California's conformity was not checked.

### FTB 3800: the support test for a student aged 19 to 23 (row A7)

- Text A: the support test only for a child who "was age 18 at the end of 2025" (`ca-3800-inst-2025::sec::purpose::b01`). Text B, Form 8615: a full-time student "at least age 19 and under age 24 at the end of 2025" who "didn’t have earned income that was more than half of the child's support" (`irs-8615-inst-2025::sec::who-must-file::b01`).
- Statute, section 1(g)(2)(A)(ii): a child who "has attained age 18" and meets the age test of section 152(c)(3), and whose earned income "does not exceed one-half of the amount of the individual’s support" (`usc-26-2025::sec::s1::g-2`). Section 152(c)(3)(A)(ii) includes "a student who has not attained the age of 24" (`usc-26-2025::sec::s152::c-3`).
- Engine: Text B (`engine/src/state/ca/3800-ca/resolveInfo.ts`). Decided by the author, waiting for a person. This is the federal rule; California's conformity was not checked.

### Form 8828: a sale more than 9 years after the loan (row A18)

- Text A: who must file, with no time limit (`irs-8828-inst-2025::sec::who-must-file::b01`). Text B: recapture applies to a sale "during the first 9 years" (`irs-8828-inst-2025::sec::recapture-tax::b01`).
- Statute, section 143(m)(2)(B): the recapture "shall not apply to ... any disposition which is more than 9 years after the testing date" (`usc-26-2025::sec::s143::m-2`).
- Engine: Text B (`engine/src/federal/8828/lines.ts`). Decided by the author, waiting for a person.

### Form 8828 line 18: rounding the income percentage (row A19)

- Text A, the form: "Round to the nearest whole percentage" (`irs-8828-face-2025::sec::face-part-ii::b01`). Text B: an issuer's notice counts whole $50 steps (not in the corpus).
- Statute, section 143(m)(4)(E): "The percentage determined under the preceding sentence shall be rounded to the nearest whole percentage point" (`usc-26-2025::sec::s143::m-4-E`).
- Engine: Text A (`engine/src/federal/8828/lines.ts`). Decided by the author, waiting for a person.

### Form 4970: the years before age 21 (row A20)

- Text A, the line labels: line 4 "Taxes imposed on the trust on amounts from line 3" (`irs-4970-form-2025::sec::face-part-i::b01`). Text B: line 8 counts the "throwback years" with entries on the Schedule J lines (`irs-4970-form-2025::sec::line-8::b01`).
- Statute, section 665(b): "For purposes of section 667 ... the amounts specified in paragraph (2) of section 661(a) shall not include amounts ... accumulated before the birth of such beneficiary or before such beneficiary attains the age of 21" (`usc-26-2025::sec::s665::b`). Section 667(b)(1)(A) counts the years "on the last day of which an amount is deemed under section 666(a) to have been distributed" (`usc-26-2025::sec::s667::b-1-A`).
- One reading: the years that hold only income from before age 21 leave the count and the taxes, as Text A does. The statute does not name the form's lines.
- Engine: Text A (`engine/src/federal/4970/lines.ts`). Decided by the author, waiting for a person.

### Form 8978 Schedule A: which Form 8986 column (row A23)

- Text A: "enter amounts from Form 8986, Part V, column (h)" (`irs-8978-inst-2025::sec::specific-instructions-for-schedule-a::b02`). Text B: the column headings of Form 8986 (Rev. December 2024): column (g) is the adjustment, column (h) the corrected amount (not in the corpus).
- Statute, section 6226(b)(2)(A): the correction amount is the change in tax "if the partner’s share of the adjustments described in subsection (a) were taken into account" (`usc-26-2025::sec::s6226::b-2`). The statute takes the adjustments, not the corrected totals.
- Engine: column (g) (`engine/src/federal/8978/scheduleA.ts`). Decided by the author, waiting for a person. Modifications are not checked.

### Form 8915-F: what column (b) holds, and the 3-year income (rows A25, A27)

- Row A25, Text A: "enter the amounts on lines 2 through 4 and line 5b in column (a) on lines 2 through 4 and line 5b in column (b)" (`irs-8915f-inst-2025::sec::section-601-of-the-secure-2-0-act-of-2022::b02`). Text B: the form's line 5b arithmetic.
- Row A27, Text A: "do NOT include, in Part II or III later, amounts for disasters listed in the Part I Disaster Table" (`irs-8915f-face-2025::sec::face-part-i-2::b03`). Text B: "you must report income from those distributions" (`irs-8915f-inst-2025::sec::part-ii::b01`).
- Statute, section 72(t)(11)(D)(i): "In the case of any qualified disaster recovery distribution ... any amount required to be included in gross income for such taxable year shall be so included ratably over the 3-taxable year period beginning with such taxable year" (`usc-26-2025::sec::s72::t-11-D`). Only a qualified distribution is spread, and the spread goes on in the later years.
- Engine: Text B for both (`engine/src/federal/8915-f/lines.ts`, `engine/src/federal/8915-f/figure.ts`). Decided by the author, waiting for a person.

### Form 2555 line 44: the housing exclusion in the share (row A30)

- Text A, Pub. 54: the numerator is "your foreign earned income exclusion" (`irs-pub-54-2025::sec::how-to-report-deductions::b01`). Text B, Form 2555 instructions: the deductions "allocable to the excluded income" (`irs-2555-inst-2025::sec::line-44::b01`).
- Statute, section 911(d)(6): no deduction "shall be allowed to the extent such deduction ... is properly allocable to or chargeable against amounts excluded from gross income under subsection (a)" (`usc-26-2025::sec::s911::d-6`). Section 911(a) excludes "(1) the foreign earned income of such individual, and (2) the housing cost amount of such individual" (`usc-26-2025::sec::s911::a`).
- Engine: Text B, line 43 (`engine/src/federal/2555/lines.ts`). Decided by the author, waiting for a person.

### Form 2555 line 44: self-employment tax (row A31)

- Text A, Form 2555 instructions: deductions "such as the deductible part of self-employment tax" (`irs-2555-inst-2025::sec::line-44::b01`). Text B: Pub. 54 example 2 counts business expenses only (`irs-pub-54-2025::sec::how-to-report-deductions::b04`).
- Statute, section 164(f)(2): the deduction "shall be treated as attributable to a trade or business carried on by the taxpayer" (`usc-26-2025::sec::s164::f`). With section 911(d)(6) above, one reading makes its share allocable to the excluded business income. The statute gives no method of allocation.
- Engine: Text A (`engine/src/federal/2555/results.ts`). Decided by the author, waiting for a person.

## The statute disagrees with itself

None found yet.

## Checked, and the statute is silent

- Row 9, the source of daily exchange rates. Searched "functional currency", "exchange rate", "appropriate exchange rate". Section 985(a) and (b)(1)(A) make the dollar the functional currency; section 989(b) defines rates only for distributions, inclusions and business units abroad. Section 988 taxes currency gain or loss on a "section 988 transaction"; it sets no rate for income, and section 988(e)(1) excludes an individual's personal transactions.
- Row 10, which rate converts foreign income: the same passages.
- Row 11, the yearly average: section 989(c)(6) leaves "procedures for determining the average exchange rate for any period" to regulations.
- Rows 13 and 14, one Form 8824 for each exchange or sale: sections 1031 and 1043 have no rule on the printed forms.
- Row A3, lines 12 to 18 of Form 8824: section 1031(b) recognizes gain up to "the sum of such money and the fair market value of such other property"; the multi-asset rule is in regulations.
- Row A8, a business loss in the child's unearned income: section 1(g)(4)(A)(i) uses earned income "as defined in section 911(d)(2)", which names amounts received, not a loss.
- Row A12, which section 179 property is recaptured: section 179(d)(10) leaves it to regulations, for property "not used predominantly in a trade or business at any time". The instructions' Text A uses the same words.
- Row A24, which distributions count first under the $22,000 limit: section 72(t)(11)(B)(i) sets the limit and no order.
- Row A26, a disaster whose $22,000 was used: section 72(t)(11)(B)(i) caps the amount "in all taxable years"; both texts agree with that, and the statute has no rule on the form.
- Row A29, the fraction in line 44: section 911(d)(6) says "properly allocable" and gives no fraction.
- Row A32, a tax home that moves abroad late: section 911(d)(1) requires a tax home "in a foreign country"; section 911(d)(3) tests it "for any period". The statute has no "throughout" rule.

## Not checked, and why

- California rows: 5, A5, A6, A9, A10, A15, A21, A22, and the open Schedule S row. The library has no California law. The earlier pointers were written from memory and are not checked: R&TC 17560.5 (row 5), R&TC 61015 and Government Code 100705 (A5), R&TC 61000 (A6), R&TC 17041 (A7 to A9), R&TC 18151 (A11), R&TC 17201 (A12), R&TC 18031 and 18032 (A15), R&TC 17551 (A16, A17), R&TC 17276 (A21), R&TC 17276.24 and 17207.14 (A22). Row A10 was checked on a public copy of the code, outside the library.
- The California half of rows A7, A11, A13, A16 and A17: the federal rule was checked, California's conformity was not.
- Two federal models of California rows, for a person to weigh: section 5000A(c)(4)(A) counts the family size as each individual "for whom the taxpayer is allowed a deduction under section 151" (`usc-26-2025::sec::s5000a::c-4`), which reads like row A6's Text A. Sections 172(c) and (d)(1) figure the loss with "No net operating loss deduction" (`usc-26-2025::sec::s172::d-1`), which agrees with row A21's Text B.
- Regulations: Temporary Regulations 15a.453-1(b)(2) (A1), Regulations 1.1031(j)-1 (A3), 1.179-1(e) (A12), 301.6226-3 (A23), 1.911-2(a), 1.911-3(d) and 1.911-6(a) (A28 to A32), and 1.988-1(d) (row 9). The library holds none of them.
- Effective dates: the library has no statutory notes. Section 461(l)(3)(C), an inflation rule for years after 2025, looks recently amended. Section 72(t)(11) came with the SECURE 2.0 Act. Neither changes a row here.
- "Settled by the author, for the record" in `rule-decisions.md` (Forms 6198 and FTB 3801): no dollars change, so no statute was read.
