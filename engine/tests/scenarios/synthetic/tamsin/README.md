# tamsin — a made-up Armed Forces move (synthetic)

Tamsin Halloway is single and lives in Killeen, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is an Army staff sergeant. A military order moved her from Colorado Springs to Killeen: a permanent change of station. Her W-2 shows the government's moving reimbursement in box 12 with code P. She drove her own car, paid for lodging and tolls on the way, and paid part of the household goods move herself. She takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders a filled Form 3903 and checks that line 5 reaches Schedule 1 line 14 and the tax on Form 1040. Line 4 is not stated, so the form takes the W-2 code P amount. The published example and the other branches are unit tests (`tests/unit/federal/3903/`).

Forms that file: Form 1040, Schedule 1, Form 3903.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Frontier Garrison Payroll Office | box 1 $58,400, box 2 $4,100, box 12 code P $3,150 |
| Household goods (packing, moving, in-transit storage) | $2,860.45 |
| Travel | 820 miles, lodging $612.40, parking and tolls $18.50 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 3903 certification box | a certified move | checked |
| 3903 line 1 | 2,860.45, nearest dollar | 2,860 |
| 3903 line 2 | 820 × $0.21 = 172.20; + 612.40 + 18.50 = 803.10 | 803 |
| 3903 line 3 | 2,860 + 803 | 3,663 |
| 3903 line 4 | W-2 box 12 code P | 3,150 |
| 3903 line 5 | 3,663 > 3,150: Yes; 3,663 − 3,150 | 513 |
| Schedule 1 line 14 | 3903 line 5 | 513 |
| Schedule 1 line 26 | line 14 only | 513 |
| 1040 line 1a, 1z, 9 | W-2 box 1 | 58,400 |
| 1040 line 10 | Schedule 1 line 26 | 513 |
| 1040 line 11a | 58,400 − 513 | 57,887 |
| 1040 line 12e | single standard deduction | 15,750 |
| 1040 line 15 | 57,887 − 15,750 | 42,137 |
| 1040 line 16 | tax table, 42,100–42,150 single | 4,817 |
| 1040 line 37 | 4,817 − 4,100 withheld | 717 |

Line 16: the table row taxes the row's midpoint, 42,125. 10% of 11,925 is 1,192.50. 12% of 30,200 is 3,624. The sum, 4,816.50, rounds to 4,817.
