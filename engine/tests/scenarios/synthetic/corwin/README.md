# corwin — a moving reimbursement more than the cost (synthetic)

Corwin Marchetti is single and lives in Jacksonville, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He is a Navy petty officer. A military order moved him from Pensacola to Jacksonville: a permanent change of station. His W-2 shows the government's moving reimbursement in box 12 with code P, and it is more than the move cost him. Box 1 does not hold the excess. He drove his own car and paid for movers and one night of lodging. He takes the standard deduction. The return is federal only: Florida has no income tax.

The scenario renders a filled Form 3903 with the No box on line 5, and checks that the excess goes to Form 1040 line 1h. `tamsin` covers the Yes case (a deduction on Schedule 1 line 14).

Forms that file: Form 1040, Form 3903. Schedule 1 does not file: it has no amount.

## Why Form 3903 files with no deduction

- Line 5 has two answers. For No: "If line 3 is equal to or less than line 4, you don't have a moving expense deduction. Subtract line 3 from line 4 and, if the result is more than zero, enter it on Form 1040, 1040-SR, or 1040-NR, line 1h" (`irs-3903-inst-2025::sec::line-5::b01`). The printed No box says the same.
- A reimbursement over the cost that is not in W-2 box 1 "still must be included in gross income on Form 1040, 1040-SR, or 1040-NR, line 1h" (`irs-3903-inst-2025::sec::purpose-of-form::b02`).
- The only "Do not file Form 3903" rule is for storage fees alone after an earlier-year move (`irs-3903-inst-2025::sec::line-1::b01`). It does not apply.
- The engine files the form for each certified move (`federal/3903/resolveInfo.ts`). That agrees with the text.
- Schedule 1 line 14 takes only line 5 (`line-5::b01`, Yes branch). Line 5 is blank, so Schedule 1 has no line to fill.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Coastal Fleet Payroll Office | box 1 $52,300, box 2 $4,000, box 12 code P $4,200 |
| Household goods (packing, moving) | $2,789.65 |
| Travel | 360 miles, lodging $128.40, tolls $5.75 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 3903 certification box | a certified move | checked |
| 3903 line 1 | 2,789.65, nearest dollar | 2,790 |
| 3903 line 2 | 360 × $0.21 = 75.60; + 128.40 + 5.75 = 209.75 | 210 |
| 3903 line 3 | 2,790 + 210 | 3,000 |
| 3903 line 4 | W-2 box 12 code P | 4,200 |
| 3903 line 5 | 3,000 is not more than 4,200: No; no deduction | blank |
| 1040 line 1a | W-2 box 1 | 52,300 |
| 1040 line 1h | 3903 line 4 − line 3: 4,200 − 3,000 | 1,200 |
| 1040 line 1z, 9 | 52,300 + 1,200 | 53,500 |
| 1040 line 10 | no Schedule 1 | blank |
| 1040 line 11a, 11b | line 9 | 53,500 |
| 1040 line 12e, 14 | single standard deduction | 15,750 |
| 1040 line 15 | 53,500 − 15,750 | 37,750 |
| 1040 line 16 | tax table, 37,750–37,800 single | 4,295 |
| 1040 line 18, 22, 24 | line 16 | 4,295 |
| 1040 line 25a, 25d, 33 | W-2 box 2 | 4,000 |
| 1040 line 37 | 4,295 − 4,000 | 295 |

Line 16: the table row taxes the row's midpoint, 37,775. 10% of 11,925 is 1,192.50. 12% of 25,850 is 3,102. The sum, 4,294.50, rounds to 4,295.

The engine leaves the line 1h type blank: the engine does not fill that field (`form-1040.line.1h_type` is on the 1040's unsupported list).
