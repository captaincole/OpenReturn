# olmira: a nonresident with a larger California gain (synthetic)

Olmira Strandmoor is single and lives in Reno, Nevada all of 2025. She left Sacramento in 2022. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the instructions, then locked (`verification: "unverified"`).

She files Form 540NR, Schedule CA (540NR) and Schedule D (540NR). Her California-source income is the wages for 60 workdays in Truckee. One sale has a lower California basis: a California credit she claimed in 2019 reduced it ("Special Credits", `ca-540nr-sched-d-inst-2025::sec::line-1::b03`). California's gain is larger than the federal one, so line 12b goes to Schedule CA (540NR) line 7a column C. Her stock gains have no California source, so line 7a column E is 0.

The scenario covers Schedule D (540NR) line 12b and Schedule CA (540NR) line 7a column C. `nildra` covers lines 6, 9 and 12a.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Donner Pass Surveying (Truckee) | box 1 $90,000, box 15 CA, box 16 $22,500, box 17 $700 |
| 1099-DIV, Comstock Brokerage | box 1a $1,000, box 1b $600, box 2a $800 |
| 1099-B, High Desert Mining, long-term | proceeds $50,000, basis $35,000; California basis $28,000 |
| 1099-B, Silver State Utilities, long-term | proceeds $5,000, basis $6,000 |
| Column E (stated) | line 1a $22,500, line 3b $0, line 7a $0 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 7a | 15,000 − 1,000 + 800 | 14,800 |
| 1040 line 16 | tax table on 74,650 ordinary (11,343) + 15% × 15,400 | 13,653 |
| Sch D (540NR) line 1a, 1b | 50,000 − 28,000; 6,000 − 5,000 | 22,000 gain; 1,000 loss |
| line 3 | 1099-DIV box 2a | 800 |
| line 4 | 22,000 + 800 | 22,800 |
| lines 5 and 7 | no carryover | 1,000 |
| line 8 = line 11 | 22,800 − 1,000 | 21,800 |
| line 10 | 1040 line 7a | 14,800 |
| line 12b | 21,800 − 14,800 | 7,000 |
| Sch CA (540NR) line 7a A / C / D / E | 14,800 / 12b / 14,800 + 7,000 / stated | 14,800 / 7,000 / 21,800 / 0 |
| 540NR line 16 | line 27 column C | 7,000 |
| 540NR line 17 | 105,800 + 7,000 | 112,800 |
| 540NR line 31 | 3,201.97 + 9.3% × (107,094 − 72,724) | 6,398 |
| 540NR line 35 | 22,500 − 5,706 × .1995 (1,138) | 21,362 |
| 540NR line 37 | 21,362 × .0597 | 1,275 |
| 540NR line 40 | 1,275 − 153 × .1995 (31) | 1,244 |
