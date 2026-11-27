# pevin: a part-year resident's minimum tax on Schedule P (540NR) (synthetic)

Pevin Ardlow is single. She lived in San Jose until September 30, 2025, then moved to Reno, Nevada for good. In June, while still a California resident, she exercised incentive stock options and kept the shares. She itemizes. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the instructions, then locked (`verification: "unverified"`).

She states that she is a part-year resident (`decisions.scope.ca_residency` = `part_year`) and files Form 540NR. She states the California amount of each income line (Schedule CA (540NR) column E) and the California part of the option spread (`ca_540nr.amt_california_amount.iso_exercise_spread`): all of it, since she exercised while a resident.

The scenario covers Schedule P (540NR) Part I lines 2, 3, 5, 10, 14, 15, 18, 19 and 21, Part II lines 22 to 25, 28 to 30, 32 to 45, and Part III lines 1 to 3, 11, 22 and 25; and Form 540NR lines 63, 71 and 74, which take the schedule's amounts. No input documents: the facts are the boxes as the forms would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Lumen Ridge Systems (San Jose) | box 1 $262,000, box 15 CA, box 16 $262,000, box 17 $22,800 |
| 1099-INT, Bay Harbor Credit Union | box 1 $3,000 |
| 1099-DIV, Truckee Index Funds | box 1a $16,000, box 1b $12,000 |
| Form 3921, Lumen Ridge Systems | 4,000 shares, $8 price, $58 value: a $200,000 spread, held at year end |
| Form 1098, Sierra Home Loans (the Reno house) | box 1 $5,500 |
| Answers | medical $26,000, real estate tax $2,400, gifts $9,000, investment fees $7,000 |
| Column E (stated) | line 1a $262,000, line 2b $2,250, line 3b $4,000 |
| California part of the spread (stated) | $200,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 11b | 262,000 + 3,000 + 16,000 | 281,000 |
| Sch CA (540NR) Part III line 28 | 44,625 − 22,800 state tax + 1,380 fees (7,000 − 2% × 281,000) | 23,205 |
| Sch CA (540NR) Part III line 29 | 23,205 − 6% × (281,000 − 252,203) = 23,205 − 1,728 | 21,477 |
| 540NR line 19 | 281,000 − 21,477 | 259,523 |
| 540NR line 37 | California taxable income 247,748 × .0793 | 19,646 |
| 540NR line 42 | 19,646 − 77 exemption credit | 19,569 |
| Sch P line 2 | smaller of Schedule A line 4 (4,925) or 2.5% × 281,000 (7,025) | 4,925 |
| Sch P line 3 | real estate tax | 2,400 |
| Sch P line 5 | Sch CA (540NR) Part III line 25 | 1,380 |
| Sch P line 10 | the spread | 200,000 |
| Sch P line 14 | 4,925 + 2,400 + 1,380 + 200,000 | 208,705 |
| Sch P line 15 | 540NR line 19 | 259,523 |
| Sch P line 18 | line 28 less line 29 of Sch CA (540NR) Part III | 1,728 |
| Sch P lines 19 and 21 | 208,705 + 259,523 − 1,728 | 466,500 |
| Sch P line 22 | 92,749 − 25% × (466,500 − 347,808) = 92,749 − 29,673 | 63,076 |
| Sch P line 23 | 466,500 − 63,076 | 403,424 |
| Sch P lines 24 and 41 | 403,424 × 7% = 28,239.68 | 28,240 |
| Sch P lines 25 and 28 | Sch CA (540NR) Part IV line 1: 262,000 + 2,250 + 4,000 | 268,250 |
| Sch P lines 29d and 29 | the stated California part | 200,000 |
| Sch P lines 30 and 32 | 268,250 + 200,000 | 468,250 |
| Sch P line 33 | Sch CA (540NR) Part III line 28 | 23,205 |
| Sch P line 34 (a, b, d) | 4,925 + 2,400 + 1,380 | 8,705 |
| Sch P line 35 | 23,205 − 8,705 | 14,500 |
| Sch P line 36 | Part I line 21 | 466,500 |
| Sch P line 37 | 14,500 + 466,500 | 481,000 |
| Sch P line 38 | 468,250 ÷ 481,000 = .97349 | .9735 |
| Sch P line 39 | 14,500 × .9735 = 14,115.75 | 14,116 |
| Sch P line 40 | 468,250 − 14,116 | 454,134 |
| Sch P line 42 | 28,240 ÷ 466,500 = .060536 | .0605 |
| Sch P line 43 | 454,134 × .0605 = 27,475.11 | 27,475 |
| Sch P line 44 | 540NR line 37 | 19,646 |
| Sch P line 45 | 27,475 − 19,646 | 7,829 |
| Sch P Part III line 1 | 540NR line 42 | 19,569 |
| Sch P Part III line 2 | line 43 | 27,475 |
| Sch P Part III line 3 | 19,569 − 27,475, not below 0 | 0 |
| Sch P Part III line 11 | line 3 is 0: line 1 | 19,569 |
| Sch P Part III lines 22 and 25 | line 45; no Section C credit | 7,829 |
| 540NR line 63 | line 42, no credits | 19,569 |
| 540NR line 71 | Sch P Part III line 25 | 7,829 |
| 540NR line 74 | 19,569 + 7,829 | 27,398 |
| 540NR lines 104, 121, 124 | 27,398 − 22,800 withheld | 4,598 |

FTB Pub. 1100 Example 43 is the same Part II computation with 2023 amounts (`tests/unit/state/ca/schedule-p-540nr/lines.test.ts`).
