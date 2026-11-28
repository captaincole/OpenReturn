# kenly — a made-up bicycle shop owner in California with employee health plans (synthetic)

Kenly Marwood is single and lives in Sacramento, California, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Kenly owns a bicycle repair shop (Schedule C) with six employees. Five are enrolled in SHOP health plans, and the shop pays 75% of each plan's premium. Both plans cost less than the Sacramento County average premium. One enrolled employee is a seasonal spring mechanic: no hours and no wages on Worksheet 1, but the premiums count. The shop has no state subsidy and no K-1.

This scenario covers the branches that jaim does not:

- Line 2 is 10 or less and line 3 is $33,000 or less: lines 8 and 9 equal line 7.
- Line 5 is above line 4, so line 6 is line 4.
- Line 10 is 0, and line 15 is blank.
- California gives the deduction back: "For California purposes, the full amount of insurance is deductible" (`ftb-pub-1001-2025::sec::small-employer-health::b01`). Schedule CA line 3 column B is line 12.

The Form 8941 amounts are stated answers from the payroll and the premium invoices. The average premiums are the Sacramento County row of the instructions' table (`irs-8941-inst-2025::sec::line-19::b08`). Kenly made federal estimated payments only, so California shows a balance due.

## Inputs

| Input | Amounts |
| --- | --- |
| Shop (Schedule C), Marwood Cycle Works | receipts $480,000; wages $138,000; employee benefit programs $31,837.50 (the premiums); other expenses $128,800 |
| Average premiums, Sacramento County | employee-only $8,406; family $27,555 |
| Plans | employee-only $7,800 a year, family $21,000 a year; the shop pays 75% |
| Estimated tax payments (federal) | 4 × $9,000 |

| Employee | Hours | Wages | Paid (col. b) | Average (col. c) |
| --- | --- | --- | --- | --- |
| Talia, employee-only | 2,080 | 34,000 | 5,850 | 5,850 × 8,406 / 7,800 = 6,304.50 |
| Wes, family | 2,080 | 31,000 | 15,750 | 15,750 × 27,555 / 21,000 = 20,666.25 |
| Nora, employee-only | 2,080 | 28,000 | 5,850 | 6,304.50 |
| Arlo, employee-only, half year | 1,560 | 22,000 | 2,925 | 3,152.25 |
| Sima, not enrolled | 1,040 | 14,000 | — | — |
| Bram, seasonal, three months | 0 | 0 | 1,462.50 | 1,576.13 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8941 line 1, 2 | 6 rows; 8,840 ÷ 2,080 = 4.25, down | 6; 4 |
| 8941 line 3 | 129,000 ÷ 4 = 32,250, down to $1,000 | 32,000 |
| 8941 line 4 | 5,850 + 15,750 + 5,850 + 2,925 + 1,462.50 = 31,837.50 | 31,838 |
| 8941 line 5 | 38,003.63 | 38,004 |
| 8941 line 6, 7 | smaller; × 50% | 31,838; 15,919 |
| 8941 line 8, 9 | line 2 ≤ 10, line 3 ≤ $33,000 | 15,919 |
| 8941 line 10, 11, 12 | 0; 31,838; smaller | 0; 31,838; 15,919 |
| 8941 line 13, 14 | 5 enrolled; 7,800 ÷ 2,080 = 3.75, down | 5; 3 |
| 8941 line 16 | line 12 | 15,919 |
| Schedule C line 14 | 31,837.50 − 15,919 | 15,919 |
| Schedule C line 31 | 480,000 − 282,719 | 197,281 |
| 1040 line 16, 20, 22 | tax; Form 3800 line 38; 25,097 − 15,919 | 25,097; 15,919; 9,178 |
| 1040 line 24, 37 | 9,178 + 27,119 (SE tax); 36,297 − 36,000 | 36,297; 297 |
| Schedule CA line 3 column B | line 12 given back | 15,919 |
| 540 line 13, 17 | federal AGI; 183,721 − 15,919 | 183,721; 167,802 |
| 540 line 64, 111 | tax; no California payments | 11,361 |
