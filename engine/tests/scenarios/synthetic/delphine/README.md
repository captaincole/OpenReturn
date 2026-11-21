# delphine — a made-up server with unreported tips (synthetic)

Delphine Arceneaux is single and lives in Las Vegas, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has three W-2s from tipped jobs. She kept a daily tip record at two of them. At the third, a casino, she has no record, so its W-2 box 8 allocated tips count as unreported. She also got concert tickets as a tip (a noncash tip). She takes the standard deduction. The return is federal only: Nevada has no income tax.

The scenario renders a filled Form 4137 and checks that its results reach Form 1040 line 1c and Schedule 2 line 5. The published example that checks the rules is a unit test (`tests/unit/federal/4137/`).

The engine does not model the 2025 deduction for qualified tips (Schedule 1-A Part II), so Form 1040 line 13b stays blank (QUESTIONS.md item 8 in `src/federal/4137/`).

Forms that file: Form 1040, Schedule 2, Form 4137.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Silver Sage Bistro | box 1 $37,400, box 2 $2,100, box 3 $28,000, box 7 $9,400 |
| Tip record, Silver Sage | received $12,650.40, reported $9,400 |
| W-2, Desert Bloom Catering | box 1 $7,350, box 2 $300, box 3 $6,200, box 7 $1,150 |
| Tip record, Desert Bloom | received $1,489.75, reported $1,150, $52 in months under $20, $240 noncash |
| W-2, Copper Canyon Casino | box 1 $22,050, box 2 $1,500, box 3 $19,000, box 7 $3,050, box 8 $1,320 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 4137 row A (c), (d) | 12,650.40 rounded; reported | 12,650; 9,400 |
| 4137 row B (c), (d) | 1,489.75 rounded; reported | 1,490; 1,150 |
| 4137 row C (c), (d) | box 7 + box 8 = 3,050 + 1,320; box 7 | 4,370; 3,050 |
| 4137 line 2 | 12,650 + 1,490 + 4,370 | 18,510 |
| 4137 line 3 | 9,400 + 1,150 + 3,050 | 13,600 |
| 4137 line 4 | 18,510 − 13,600 | 4,910 |
| 4137 line 5 | months under $20 (Desert Bloom) | 52 |
| 4137 line 6 | 4,910 − 52 | 4,858 |
| 4137 line 8 | boxes 3 and 7: 37,400 + 7,350 + 22,050 | 66,800 |
| 4137 line 9 | 176,100 − 66,800 | 109,300 |
| 4137 line 10 | smaller of 4,858 and 109,300 | 4,858 |
| 4137 line 11 | 4,858 × 6.2% = 301.20 | 301 |
| 4137 line 12 | 4,858 × 1.45% = 70.44 | 70 |
| 4137 line 13 | 301 + 70 | 371 |
| 1040 line 1a | 37,400 + 7,350 + 22,050 | 66,800 |
| 1040 line 1c | 4137 line 4 + 240 noncash | 5,150 |
| 1040 line 1z, 9, 11a | 66,800 + 5,150 | 71,950 |
| 1040 line 15 | 71,950 − 15,750 | 56,200 |
| 1040 line 16 | tax table, 56,200–56,250, single | 7,284 |
| Schedule 2 lines 5, 7, 21 | 4137 line 13 | 371 |
| 1040 line 23 | Schedule 2 line 21 | 371 |
| 1040 line 24 | 7,284 + 371 | 7,655 |
| 1040 line 25a | 2,100 + 300 + 1,500 | 3,900 |
| 1040 line 37 | 7,655 − 3,900 | 3,755 |
