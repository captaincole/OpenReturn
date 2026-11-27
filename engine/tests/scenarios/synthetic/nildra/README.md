# nildra: a part-year resident with a California capital loss (synthetic)

Nildra Venhollow is single. She lived in Portland, Oregon until August 31, 2025, then moved to San Diego for good. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the instructions, then locked (`verification: "unverified"`).

She files Form 540NR, Schedule CA (540NR) and Schedule D (540NR). One sale has a higher California basis: Lakeshore Freight was an S corporation before 1987, and California did not recognize S corporations then (`ca-540nr-sched-d-inst-2025::sec::line-1::b03`). Her California carryover is restated as if she had always been a resident (line 6). California ends in a loss larger than the federal one, so line 12a goes to Schedule CA (540NR) line 7a column B.

The scenario covers Schedule D (540NR) lines 1a to 1c, 3 to 12a, and Schedule CA (540NR) line 7a column B. `olmira` covers line 12b (column C). Line 2 is blank: no Schedule K-1.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Willamette Gearworks (Portland) | box 1 $78,000, box 15 OR |
| W-2, Point Loma Marine Systems (San Diego) | box 1 $36,000, box 15 CA, box 16 $36,000, box 17 $1,400 |
| 1099-DIV, Harbor Light Brokerage | box 1a $2,400, box 1b $1,800, box 2a $1,500 |
| 1099-B, Cascade Timber, long-term | proceeds $40,000, basis $30,000 |
| 1099-B, Lakeshore Freight, long-term | proceeds $12,000, basis $20,000; California basis $26,000 |
| 1099-B, Northwind Solar ETF, short-term | proceeds $6,200, basis $7,000 |
| Carryovers from 2024 | federal short-term $2,000; California (as a resident) $6,500 |
| Column E (stated) | line 1a $36,000, line 3b $800, line 7a ($3,000) |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Federal Schedule D line 7 | −800 − 2,000 | −2,800 |
| Federal Schedule D line 15 | 10,000 − 8,000 + 1,500 | 3,500 |
| 1040 line 7a | −2,800 + 3,500 | 700 |
| 1040 line 16 | tax table on 98,850 ordinary (16,667) + 15% × 2,500 | 17,042 |
| Sch D (540NR) line 1a, 1b, 1c | 40,000 − 30,000; 26,000 − 12,000; 7,000 − 6,200 | 10,000 gain; 14,000 loss; 800 loss |
| line 3 | 1099-DIV box 2a | 1,500 |
| line 4 | 10,000 + 1,500 | 11,500 |
| line 5 | 14,000 + 800 | 14,800 |
| line 6 | stated | 6,500 |
| line 7 | 14,800 + 6,500 | 21,300 |
| line 8 | 11,500 − 21,300 | −9,800 |
| line 9 | smaller of 9,800 and 3,000 | 3,000 |
| line 10 | 1040 line 7a | 700 |
| line 11 | the loss on line 9 | −3,000 |
| line 12a | 700 − (−3,000) | 3,700 |
| Sch CA (540NR) line 7a A / B / D / E | 700 / 12a / 700 − 3,700 / stated | 700 / 3,700 / −3,000 / −3,000 |
| 540NR line 14 | line 27 column B | 3,700 |
| 540NR line 17 | 117,100 − 3,700 | 113,400 |
| 540NR line 31 | 3,201.97 + 9.3% × (107,694 − 72,724) | 6,454 |
| 540NR line 32 | 36,000 + 800 − 3,000 | 33,800 |
| 540NR line 35 | 33,800 − 5,706 × .2981 (1,701) | 32,099 |
| 540NR line 37 | 32,099 × .0599 | 1,923 |
| 540NR lines 40, 74 | 1,923 − 153 × .2981 (46) | 1,877 |
| 540NR line 104 | 1,877 − 1,400 | 477 |
