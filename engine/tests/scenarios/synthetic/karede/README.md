# karede — a made-up California child whose unearned income is taxed at her parents' rate (synthetic)

Karede Ashfordly is 17 and single. She lives in Sacramento, California, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She works at a bookshop (one W-2). She has bank interest and dividends from a fund with capital gain distributions. She pays more than half of her own support, so nobody can claim her as a dependent. She takes the standard deduction. Her parents file jointly and told her the amounts from their federal and California returns. Her brother Lucan files his own Form 8615 and FTB 3800.

The scenario renders an FTB 3800 with every line filled. Line 1 uses the worksheet (she has wages). Line 7 holds her brother's line 5, so lines 12a and 12b fill. Line 9 uses Tax Rate Schedule Y; lines 15 and 17 use the tax table. Line 18 goes to Form 540 line 31, and the FTB 3800 box on line 31 is checked. The header's parent comes from the federal Form 8615 fact, because the California fact names none. Form 8615 files on the federal return too. The rules are also checked by unit tests (`tests/unit/state/ca/3800-ca/`).

Forms that file: Form 1040, Schedule B, Form 8615, Schedule CA (540), FTB 3800, Form 540.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Delta Lantern Books | box 1 $18,000, box 2 $600, box 16 $18,000, box 17 $250 |
| 1099-INT, American River Savings Bank | box 1 $3,200 |
| 1099-DIV, Sierra Foothill Growth Fund | box 1a $8,000, box 1b $5,000, box 2a $1,800 |
| Answer: a parent alive at the end of 2025 | yes |
| Answer: someone can claim her as a dependent | no |
| Answer: the parents' 2025 joint Form 1040 | Galen R. Ashfordly, MFJ; line 15 $296,000; line 16 $56,464; line 3a $3,000 |
| Answer: the parents' 2025 joint Form 540 | line 19 $280,000; line 31 $18,917 |
| Answer: her brother's line 5 | Form 8615 $4,500; FTB 3800 $4,200 |

The parents' Form 540 line 31 is Schedule Y on $280,000: 6,403.94 + 9.3% × 134,552 = 18,917.28.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 540 line 13, 17 | 18,000 + 3,200 + 8,000 + 1,800; no California adjustments | 31,000 |
| 540 line 19 | 31,000 − 5,706 | 25,294 |
| 3800 line 1 | worksheet: 540 line 17 less earned income, 31,000 − 18,000 | 13,000 |
| 3800 line 2 | no itemized deductions | 2,700 |
| 3800 line 3 | 13,000 − 2,700 | 10,300 |
| 3800 line 4 | 540 line 19 | 25,294 |
| 3800 line 5 | smaller of 10,300 and 25,294 | 10,300 |
| 3800 line 6 | parents' 540 line 19 | 280,000 |
| 3800 line 7 | brother's FTB 3800 line 5 | 4,200 |
| 3800 line 8 | 10,300 + 280,000 + 4,200 | 294,500 |
| 3800 line 9 | Schedule Y: 6,403.94 + 9.3% × 149,052 = 20,265.78 | 20,266 |
| 3800 line 10 | parents' 540 line 31, no FTB 3803 tax | 18,917 |
| 3800 line 11 | 20,266 − 18,917 | 1,349 |
| 3800 line 12a | 10,300 + 4,200 | 14,500 |
| 3800 line 12b | 10,300 / 14,500 = .710344, four places | .7103 |
| 3800 line 13 | 1,349 × .7103 = 958.19 | 958 |
| 3800 line 14 | 25,294 − 10,300 | 14,994 |
| 3800 line 15 | tax table, single, 14,951–15,050 | 189 |
| 3800 line 16 | 958 + 189 | 1,147 |
| 3800 line 17 | tax table, single, 25,251–25,350 | 395 |
| 3800 line 18 | larger of 1,147 and 395 | 1,147 |
| 540 line 31 (FTB 3800 box) | FTB 3800 line 18 | 1,147 |
| 540 line 33, 35, 48, 64 | 1,147 − 153 exemption credit | 994 |
| 540 line 100, 111, 114 | 994 − 250 withheld | 744 |
