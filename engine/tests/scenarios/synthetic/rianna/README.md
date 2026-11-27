# rianna: a nonresident on Form 540NR (synthetic)

Rianna Tolvane is single and lives in Reno, Nevada all of 2025. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the instructions, then locked (`verification: "unverified"`).

She states that she is a nonresident (`decisions.scope.ca_residency` = `non_resident`). She has California-source income: wages for 52 workdays at her employer's Truckee yard, and a rental house in Sacramento. She files Form 540NR and Schedule CA (540NR). She states the California amount of each income line (column E): the Truckee wages, all of the rental profit, and none of the Reno bank interest.

The scenario covers Schedule CA (540NR) Part I line 5 (a nonresident all year) and line 7 (California property), a line with a column E of 0 (line 2b), Section B line 5, Part IV, and Form 540NR with a California share under 30%. `pritalle` covers a part-year resident.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Sierra Crest Logistics (Reno) | box 1 $142,000, box 15 CA, box 16 $29,600, box 17 $1,180 |
| 1099-INT, Truckee Meadows Savings Bank | box 1 $900 |
| Rental house, Sacramento | rents $33,600; insurance 1,450, management 2,690, repairs 2,150, taxes 4,300, depreciation 7,600 |
| Column E (stated) | line 1a $29,600, line 2b $0, line 5 $15,410 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Schedule E line 21 | 33,600 − 18,190 | 15,410 |
| 1040 line 11b | 142,000 + 900 + 15,410 | 158,310 |
| 1040 line 16 | 142,560 at the 2025 rates: 17,651 + 24% × 39,210 | 27,061 |
| Sch CA (540NR) lines 1a, 2b, 5 D / E | federal amounts / stated | 142,000 / 29,600; 900 / 0; 15,410 / 15,410 |
| lines 10 and 27, D / E | 158,310 / 29,600 + 0 + 15,410 | 158,310 / 45,010 |
| Part IV line 3 | 45,010 ÷ 158,310 = .28432 | .2843 |
| Part IV line 4 | 5,706 × .2843 = 1,622.22 | 1,622 |
| Part IV line 5 = 540NR line 35 | 45,010 − 1,622 | 43,388 |
| 540NR line 12 | W-2 box 16 (CA) | 29,600 |
| 540NR line 19 | 158,310 − 5,706 | 152,604 |
| 540NR line 31 | rate schedule X: 3,201.97 + 9.3% × 79,880 = 10,630.81 | 10,631 |
| 540NR line 36 | 10,631 ÷ 152,604 = .069664 | .0697 |
| 540NR line 37 | 43,388 × .0697 = 3,024.14 | 3,024 |
| 540NR line 38 | 43,388 ÷ 152,604 = .28432 | .2843 |
| 540NR line 39 | 153 × .2843 = 43.4979, $43.50 to the cent | 44 |
| 540NR lines 40 to 74 | 3,024 − 44 | 2,980 |
| 540NR lines 81, 88, 92 | W-2 box 17 (CA) | 1,180 |
| 540NR lines 104, 121, 124 | 2,980 − 1,180 | 1,800 |

Line 39 keeps the cents before it rounds (`engine/src/money.ts`); see `engine/src/state/ca/540nr/QUESTIONS.md`.
