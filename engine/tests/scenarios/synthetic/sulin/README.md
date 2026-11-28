# sulin — a made-up sugar beet farmer with employee health plans (synthetic)

Sulin Korrow is single and lives on her farm near Torrington, Wyoming. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Sulin grows sugar beets and corn (Schedule F, cash method) with four farm hands. Three of them are enrolled in SHOP health plans, and the farm pays 50% of each plan's premium. Both plans cost more than the Goshen County average premium, so line 5 is below line 4. She has no state subsidy and no K-1. The return is federal only: Wyoming has no income tax.

This scenario covers what jaim and kenly do not: the credit comes off a farm. "You must reduce your line 15 deduction by the amount of any credit for small employer health insurance premiums determined on Form 8941" (`irs-1040sf-inst-2025::sec::line-15::b01`). Schedule F line 15 is the stated premiums less Form 8941 line 12.

The Form 8941 amounts are stated answers from the payroll and the premium invoices: no information return reports them. The average premiums are the Goshen County row of the instructions' table (`irs-8941-inst-2025::sec::line-19::b76`).

## Inputs

| Input | Amounts |
| --- | --- |
| Farm (Schedule F), sugar beets and corn | product sales $480,000; labor hired $98,000; employee benefit programs $24,800 (the premiums); other expenses $179,700 |
| Average premiums, Goshen County | employee-only $9,933; family $26,086 |
| Plans | employee-only $10,800 a year, family $28,000 a year; the farm pays 50% |
| Estimated tax payments | 4 × $9,000 |

| Employee | Hours | Wages | Paid (col. b) | Average (col. c) |
| --- | --- | --- | --- | --- |
| Corin, family | 2,080 | 32,000 | 14,000 | 14,000 × 26,086 / 28,000 = 13,043 |
| Lida, employee-only | 2,080 | 30,000 | 5,400 | 5,400 × 9,933 / 10,800 = 4,966.50 |
| Hugo, employee-only | 2,080 | 26,000 | 5,400 | 4,966.50 |
| Pell, not enrolled | 1,040 | 10,000 | — | — |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8941 line 1, 2 | 4 rows; 7,280 ÷ 2,080 = 3.5, down | 4; 3 |
| 8941 line 3 | 98,000 ÷ 3 = 32,666, down to $1,000 | 32,000 |
| 8941 line 4 | 14,000 + 5,400 + 5,400 | 24,800 |
| 8941 line 5 | 13,043 + 4,966.50 + 4,966.50 | 22,976 |
| 8941 line 6, 7 | smaller; × 50% | 22,976; 11,488 |
| 8941 line 8, 9 | line 2 ≤ 10, line 3 ≤ $33,000 | 11,488 |
| 8941 line 10, 11, 12 | 0; 24,800; smaller | 0; 24,800; 11,488 |
| 8941 line 13, 14 | 3 enrolled; 6,240 ÷ 2,080 | 3; 3 |
| 8941 line 16 | line 12 | 11,488 |
| Schedule F line 15 | 24,800 − 11,488 | 13,312 |
| Schedule F line 33, 34 | 302,500 − 11,488; 480,000 − 291,012 | 291,012; 188,988 |
| Schedule SE line 12, 13 | 21,642 + 5,061; half | 26,703; 13,352 |
| 1040 line 11a | 188,988 − 13,352 | 175,636 |
| 1040 line 15 | 175,636 − 15,750 − 31,977 (Form 8995) | 127,909 |
| 1040 line 16 | tax computation worksheet, single | 23,545 |
| Form 3800 line 4h (e), (g); line 38 | Form 8941 line 12 | 11,488 |
| Schedule 3 line 6a; 1040 line 20 | Form 3800 line 38 | 11,488 |
| 1040 line 22, 24 | 23,545 − 11,488; + 26,703 | 12,057; 38,760 |
| 1040 line 37 | 38,760 − 36,000 | 2,760 |
