# pritalle: a part-year resident on Form 540NR (synthetic)

Pritalle Moradin is single. She lived in Sacramento until June 30, 2025, then moved to Austin, Texas for good. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the instructions, then locked (`verification: "unverified"`).

She states that she is a part-year resident (`decisions.scope.ca_residency` = `part_year`). The engine does not test residency. She files Form 540NR, Schedule CA (540NR) and Schedule D (540NR), not Form 540. Schedule D (540NR) files because she has a capital gain; with no California difference, its lines 12a and 12b are blank. She states the California amount of each income line (Schedule CA (540NR) column E): what she received while a resident.

The scenario covers Schedule CA (540NR) Part I (the move out, the days, the prior residency), Part II columns A, D and E with three lines, Part IV, and Form 540NR lines 7 to 40, 42, 63, 74, 81, 82, 88, 91, 92 and 104 to 124. `rianna` covers a full-year nonresident.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Delta Orchard Analytics (Sacramento) | box 1 $64,000, box 15 CA, box 16 $64,000, box 17 $2,750 |
| W-2, Hill Country Data (Austin) | box 1 $52,000, no state box |
| 1099-INT, Golden Bear Credit Union | box 1 $1,400 |
| 1099-B, Sierra Pines Corp, sold March 11 | proceeds $21,500, basis $9,500, long-term |
| California estimated payment | $400 |
| Column E (stated) | line 1a $64,000, line 2b $650, line 7a $12,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 11b | 116,000 + 1,400 + 12,000 | 129,400 |
| 1040 line 16 | 101,650 ordinary at the 2025 rates (17,277) + 12,000 × 15% | 19,077 |
| Sch CA (540NR) line 1a A, D / E | W-2 box 1 / stated | 116,000 / 64,000 |
| line 2b A, D / E | 1099-INT / stated | 1,400 / 650 |
| line 7a A, D / E | Schedule D line 16 / stated | 12,000 / 12,000 |
| Sch D (540NR) lines 1a, 4, 8, 11 | 21,500 − 9,500, no California basis difference | 12,000 |
| Sch D (540NR) line 10 | 1040 line 7a | 12,000 |
| Sch D (540NR) lines 12a and 12b | line 10 equals line 11 | blank |
| line 7a columns B and C | Schedule D (540NR) lines 12a and 12b | blank |
| lines 10 and 27, D / E | 116,000 + 1,400 + 12,000 / 64,000 + 650 + 12,000 | 129,400 / 76,650 |
| Part III line 30 | standard deduction, single | 5,706 |
| Part IV line 3 | 76,650 ÷ 129,400 = .59235 | .5923 |
| Part IV line 4 | 5,706 × .5923 = 3,379.66 | 3,380 |
| Part IV line 5 = 540NR line 35 | 76,650 − 3,380 | 73,270 |
| 540NR line 12 | W-2 box 16 of the California W-2 | 64,000 |
| 540NR lines 13 and 17 | federal AGI, no California adjustment | 129,400 |
| 540NR line 19 | 129,400 − 5,706 | 123,694 |
| 540NR line 31 | rate schedule X: 3,201.97 + 9.3% × (123,694 − 72,724) = 7,942.18 | 7,942 |
| 540NR line 36 | 7,942 ÷ 123,694 = .064207 | .0642 |
| 540NR line 37 | 73,270 × .0642 = 4,703.93 | 4,704 |
| 540NR line 38 | 73,270 ÷ 123,694 = .59235 | .5923 |
| 540NR line 39 | 153 × .5923 = 90.62 | 91 |
| 540NR lines 40, 42, 63, 74 | 4,704 − 91 | 4,613 |
| 540NR line 81 | box 17 of the California W-2 | 2,750 |
| 540NR line 82 | the estimated payment | 400 |
| 540NR lines 88 and 92 | 2,750 + 400 | 3,150 |
| 540NR lines 104, 121, 124 | 4,613 − 3,150 | 1,463 |

FTB Pub. 1100 Example 1 is the same computation with 2024 amounts (`tests/unit/state/ca/540nr/lines.test.ts`).
