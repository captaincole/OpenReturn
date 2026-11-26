# seaine — tax on a trust's accumulation distribution (synthetic)

Seaine Corvell is single and lives in Spokane, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is a software tester with one W-2. Her grandfather set up the Corvell Family Trust in 1979. In 2025 the trust paid her income it had kept in five earlier years, and the trustee gave her Part IV of its Schedule J (Form 1041). She was under 21 all of 2014, so that year is out of the tax (line 2). The 2020 year is under a quarter of the average, so line 11 counts 3 years, not 4. Her 2023 return had qualified dividends and an education credit that the distribution would let her use more of. Her 2022 minimum tax falls by $300 when refigured. She takes the standard deduction. The return is federal only: Washington has no income tax.

Forms that file: Form 1040, Schedule 2, Form 4970.

## Input documents

| Document | Made from |
| --- | --- |
| `docs/01-schedule-j-part-iv.pdf` | `tests/scenarios/documents/scheduleJForm1041PartIV.ts`, run by `generate-docs.ts` with the fact's value |

The earlier years' taxable income, tax and filing status are her answers from her 2020 to 2024 returns. The product does not read last year's return (#79).

## Compared with real examples

- [Schedule J (Form 1041), 2026](https://www.irs.gov/pub/irs-pdf/f1041sj.pdf) and [2024](https://www.irs.gov/pub/irs-prior/f1041sj--2024.pdf), Part IV: the same in both years. Ours has the same fields: the trust's name and EIN, the beneficiary's name, identifying number and address, lines 32 to 36 with a throwback year each, columns (a) share of line 13, (b) share of line 14, (c) share of line 16, and the line 37 totals.
- Changed: ours adds the trust's address under its name (Form 4970 item C asks for it) and a "Beneficiary's copy" title. Parts I to III stay off: the trustee keeps them, and Form 4970 reads only Part IV.
- Line 37 prints the column totals the form defines. They are the sums of lines 32 to 36, so they cannot disagree with the fact.
- Every fact the engine reads from the document is on it: the year and columns (a), (b), (c) of each throwback year.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Riverpoint Test Labs | box 1 $96,000, box 2 $13,800 |
| Part IV, 2014 | (a) $6,000, (b) $1,500, (c) $400 |
| Part IV, 2017 | (a) $18,000, (b) $4,200, (c) $900 |
| Part IV, 2018 | (a) $22,000, (b) $5,100, (c) $1,100 |
| Part IV, 2019 | (a) $20,000, (b) $4,800, (c) $0 |
| Part IV, 2020 | (a) $3,000, (b) $600, (c) $200 |
| Earlier years, taxable income | 2024 $88,000; 2023 $82,000; 2022 $61,000; 2021 $54,000; 2020 $47,000 |
| Earlier years, tax before credits | 2023 $13,070; 2022 $9,038; 2021 $7,629 (and 2024, 2020, not used) |
| 2023 | qualified dividends $4,000; credit increase $250 |
| 2022 | AMT change −$300 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 4970 header | names, SSN, trust, EIN, Domestic, date of birth, 1 trust | as printed |
| 4970 line 1 | Part IV line 37 (a): 6,000 + 18,000 + 22,000 + 20,000 + 3,000 | 69,000 |
| 4970 line 2 | 2014: she reached 21 in 2016 | 6,000 |
| 4970 line 3 | 69,000 − 6,000 | 63,000 |
| 4970 line 4 | taxes of the years on line 3: 4,200 + 5,100 + 4,800 + 600 (decision A18) | 14,700 |
| 4970 line 5 | 63,000 + 14,700 | 77,700 |
| 4970 line 6 | 900 + 1,100 + 0 + 200 | 2,200 |
| 4970 line 7 | 77,700 − 2,200 | 75,500 |
| 4970 line 8 | 2017, 2018, 2019, 2020 | 4 |
| 4970 line 9 | 63,000 / 4 | 15,750 |
| 4970 line 10 | 15,750 × 25% = 3,937.50 | 3,938 |
| 4970 line 11 | 2020's 3,000 is less than 3,938: 4 − 1 | 3 |
| 4970 line 12 | 75,500 / 3 = 25,166.67 | 25,167 |
| 4970 line 13 | 2024 to 2020 | 88,000; 82,000; 61,000; 54,000; 47,000 |
| 4970 line 14 | drop 2024 (highest) and 2020 (lowest) | 2023 82,000; 2022 61,000; 2021 54,000 |
| 4970 line 15 | line 12 | 25,167 each |
| 4970 line 16 | line 14 + line 15 | 107,167; 86,167; 79,167 |
| 4970 line 17 (a) | 2023 single, $4,000 at 15%: ordinary 103,167 → 1,100 + 4,047 + 11,143 + 1,870.08 = 18,160; + 600 | 18,760 |
| 4970 line 17 (b) | 2022 single: 1,027.50 + 3,780 + 9,766.24 | 14,574 |
| 4970 line 17 (c) | 2021 single: 995 + 3,669 + 8,501.24 | 13,165 |
| 4970 line 18 | stated | 13,070; 9,038; 7,629 |
| 4970 line 19 | 17 − 18 | 5,690; 5,536; 5,536 |
| 4970 line 20 | stated (a) | 250; blank; blank |
| 4970 line 21 | 19 − 20 | 5,440; 5,536; 5,536 |
| 4970 line 22 | stated (b) | blank; −300; blank |
| 4970 line 23 | 21 + 22 | 5,440; 5,236; 5,536 |
| 4970 line 24 | 5,440 + 5,236 + 5,536 | 16,212 |
| 4970 line 25 | 16,212 / 3 | 5,404 |
| 4970 line 26 | 5,404 × 3 | 16,212 |
| 4970 line 27 | line 4 | 14,700 |
| 4970 line 28 | 16,212 − 14,700 | 1,512 |
| Schedule 2 line 17l, 18, 21 | Form 4970 line 28 | 1,512 |
| 1040 line 1a, 9, 11a | W-2 box 1 | 96,000 |
| 1040 line 12e, 14 | single standard deduction | 15,750 |
| 1040 line 15 | 96,000 − 15,750 | 80,250 |
| 1040 line 16 | tax table, 80,250–80,300 single: 1,192.50 + 4,386 + 6,996 = 12,574.50 | 12,575 |
| 1040 line 23 | Schedule 2 line 21 | 1,512 |
| 1040 line 24 | 12,575 + 1,512 | 14,087 |
| 1040 line 25a, 33 | W-2 box 2 | 13,800 |
| 1040 line 37 | 14,087 − 13,800 | 287 |

Line 17 uses each year's Tax Rate Schedule (Rev. Procs. 2020-45, 2021-45, 2022-38): the bracket amounts in the line 17 rows. In 2023 her $4,000 of dividends stays in the 15% band: the 0% band ends at $44,625, below her ordinary income.

Under the other reading of decision A18 (line 4 = Part IV line 37 (b), $16,200), line 28 would be $0.
