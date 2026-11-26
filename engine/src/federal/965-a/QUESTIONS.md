# Form 965-A: open questions

Form 965-A is the yearly report of the section 965 transition tax of 2017 to 2020. For 2025 the taxpayer states last year's form; the engine adds the 2025 installment. Two decisions with conflicting texts are in `docs/rule-decisions.md` (A68 Part I column (j), A69 Schedule 2 line 20). The doubts below have no conflicting text.

## Doubts

1. **The 2025 payment is the scheduled installment.** "If, for any reason, the actual payment differs from the schedule, report the actual payment made" (`irs-965a-inst-2025::sec::line-1::b01`). The return is prepared before the payment, so the engine enters the installment due. A different payment is the fact's `paidThisYear`. Changes dollars only when the taxpayer pays another amount.

2. **Installments are whole dollars.** The audit example prints cents: "$22.50 (15% of the adjusted $150 liability) ... $37.50" (`lines-1-through-8::b10`). The engine rounds each year's cumulative share to the nearest dollar and subtracts what was paid, so the eight payments still add up to the liability. Changes dollars by less than $1 a year.

3. **A prorated adjustment is paid as "share due to date less paid".** The instructions: "For the part of the adjustment prorated to installments whose payment date has already arrived, adjust the payment for the reporting year" (`line-1::b04`, `b05`). The engine pays cumulative percent × (column (f) + column (j)) − earlier payments. This gives the example's $28, $22.50, $30, $37.50 exactly. It assumes the earlier years were paid on schedule. No dollars change in the example.

4. **A transfer in pays the remaining amount's share of the installments left.** The transferee pays "in the same manner as if the taxpayer were the transferor" (`lines-1-through-8::b02`), but the line does not show the original liability. The engine pays remaining × this year's percent ÷ the percents still to come. This gives the example's $15, $20, $25 (`b03`). It assumes the transferor paid on schedule.

5. **Who files: any section 965 fact.** "Any individual taxpayer ... who has a net 965 tax liability for any tax year or has any net 965 tax liability remaining unpaid at any time during a tax year must file this form" (`who-must-file::b01`). A 2017 liability whose last installment was paid in April 2025 was unpaid for part of 2025, so it still reports. The engine files the form for any fact and does not test the dates. No dollars change.

6. **Part III column (d) is Part I column (c).** "This should equal the taxpayer's net tax liability without section 965 amounts for the corresponding tax year reported in Part I, column (c)" (`lines-1-through-4::b02`). The engine takes Part I column (c), and waits for that line's fact when it is missing. No dollars change.

7. **Column (d) and Part III column (e) are never below 0.** Both are "the excess" of the "with" over the "without" calculation (`lines-1-through-8::b07`, `lines-1-through-4::b02`). Column (f) is also at least 0. No dollars change for a real liability.

8. **A transfer in has no column (g) box.** "Skip columns (b) through (i)" (`lines-1-through-8::b02`). The engine treats the assumed liability as an installment liability (it is one by definition). No dollars change.

9. **The amended box is blank.** The box is for "an amended return that is filed to change any reporting related to section 965" (`specific-instructions::b01`). The engine prepares the original return. No dollars change.

10. **Part II column (j) prints 0 for a line paid in full.** The instructions ask for the amount "remaining unpaid after the payment for the reporting year" (`line-1::b05`). A line that reports prints its balance, 0 included. No dollars change.

## Unsupported cases

- **A triggering event in 2025.** The triggered liability adds to Form 1040 line 16 (box 3, "965INC"), and an installment election puts the deferred part on Schedule 3 line 13d (`irs-1040-inst-2025::sec::single-1::b02`, `line-13d::b01`). The engine does not change those lines. A Part I line triggered in 2025 makes its Part II line, the Part II totals and Schedule 2 line 20 unsupported. A Part IV amount triggered in 2025 makes Part IV columns (f) and (i) and the total unsupported.
- **More lines than one form holds** (5 or more other liabilities, 5 or more S corporations in a year, 11 or more Part IV lines): "an additional Form 965-A should be used" (`lines-1-through-8::b06`). Every field is unsupported.
- **A balance still unpaid after year 8**, or **an unpaid balance with no installment election after year 1**: the instructions give no column or schedule for it. That line's Part II is unsupported.
- **Last year's payments that already name 2025 or a later installment year**: the engine cannot tell this year's payment. That line's Part II is unsupported.

## Proposals for a discussion

- **A triggering event in 2025.** Form 1040 line 16 would add each Part I line triggered in 2025 (box 3 with "965INC" and the amount), and Schedule 3 line 13d would take column (i) less the year 1 installment. This is a Form 1040 change, so it waits for a person.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN, year) | stated rule |
| Part I columns (b) to (f), (h), (i), (k) | stated rule |
| Part I column (j) | own reading (decision A68) |
| Part II columns (b) to (i), 2025 installment | published example with numbers (`line-1::b02`, `lines-1-through-8::b03`, `b10`) |
| Part II column (j) | stated rule |
| Part II column (k), totals, Schedule 2 line 20 | stated rule, with decision A69 |
| Part III | stated rule |
| Part IV columns (a) to (e), (g) to (i) | stated rule |
| Part IV column (f), a 2025 triggering event | unsupported |
| Amended box | own reading |
