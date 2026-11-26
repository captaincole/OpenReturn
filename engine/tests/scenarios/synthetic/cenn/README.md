# cenn — California tax on a trust's accumulation distribution, Part I (synthetic)

Cenn Tallowmere is single and lives in Fresno all of 2025. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He is an irrigation designer with one W-2. His grandmother's Tallowmere Family Trust filed Form 541 and paid California tax on income it kept in five earlier years. In 2025 it paid that income to him, and the trustee gave him Part IV of Schedule J (541). He was under 21 all of 2015, so that year leaves every line (decision A43). In 2018 two other trusts' distributions to him count in the same year, so that year's tax leaves line 2. The 2022 year is under a quarter of the average, so line 9 counts 3 years, not 4. He takes the standard deduction.

Forms that file: Form 1040, Schedule CA (540), FTB 5870A, Form 540.

## Input documents

| Document | Made from |
| --- | --- |
| `docs/01-schedule-j-541-part-iv.pdf` | `tests/scenarios/documents/scheduleJ541PartIV.ts`, run by `generate-docs.ts` with the fact's value |

The earlier years' taxable income, tax and filing status are his answers from his 2020 to 2024 California returns. The product does not read last year's return (#79).

## Compared with real examples

- [Schedule J (541), 2025](https://www.ftb.ca.gov/forms/2025/2025-541-j.pdf), [2024](https://www.ftb.ca.gov/forms/2024/2024-541-j.pdf) and [2023](https://www.ftb.ca.gov/forms/2023/2023-541-j.pdf), Part IV: the same in all three years. Ours has the same fields: the trust's name and FEIN, the beneficiary's name, identifying number and address, lines 26 to 29 with a throwback year each, columns (a) Part II line 13, (b) line 14 and (c) line 16 allocated to the beneficiary, the line 30 totals, and line 31 (nonresident, Yes or No).
- Changed: ours adds the trust's address under its name (FTB 5870A's header asks for it), a "Beneficiary's copy" title, and a fifth row as an attached schedule. Parts I to III stay off: the trustee keeps them.
- Line 30 prints the column totals the form defines. They include the 2015 row, which the beneficiary leaves out because of his age; the form does not.
- Every fact the engine reads from the document is on it: the year and columns (a), (b), (c) of each throwback year. A column with no amount in the fact stays blank, as on the real form.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2 | box 1 and box 16 $140,000; box 17 $8,900 |
| Part IV, 2015 | (a) $6,000, (b) $300 (before age 21) |
| Part IV, 2018 | (a) $14,000, (b) $700 (two other trusts) |
| Part IV, 2019 | (a) $12,000, (b) $650, (c) $200 |
| Part IV, 2020 | (a) $9,000, (b) $400, (c) $300 |
| Part IV, 2022 | (a) $2,000, (b) $90 |
| Earlier years, taxable income | 2024 $118,000; 2023 $104,000; 2022 $96,000; 2021 $84,000; 2020 $79,000 |
| Earlier years, tax | 2023 $6,325; 2022 $5,681; 2021 $4,814 (and 2024, 2020, not used) |
| 2022 | credits up $200 |
| 2021 | AMT change +$150 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 5870A header | names, SSN, trust, FEIN, address, 1 trust | as printed |
| line 1 | 14,000 + 12,000 + 9,000 + 2,000 (2015 out) | 37,000 |
| line 2 | 650 + 400 + 90 (2018 under the multiple trust rule) | 1,140 |
| line 3 | 37,000 + 1,140 | 38,140 |
| line 4 | 200 + 300 | 500 |
| line 5 | 38,140 − 500 | 37,640 |
| line 6 | 2018, 2019, 2020, 2022 | 4 |
| line 7 | 37,000 / 4 | 9,250 |
| line 8 | 9,250 × 25% = 2,312.50 | 2,313 |
| line 9 | 2022's 2,000 is less than 2,313: 4 − 1 | 3 |
| line 10 | 37,640 / 3 = 12,546.67 | 12,547 |
| line 11 | 2024 to 2020 | 118,000; 104,000; 96,000; 84,000; 79,000 |
| line 12 | drop 2024 (highest) and 2020 (lowest) | 2023 104,000; 2022 96,000; 2021 84,000 |
| line 13, 14 | line 10; 12 + 13 | 12,547; 116,547; 108,547; 96,547 |
| line 15 (a) | 2023 X: 3,009.40 + 9.3% × 48,197 | 7,492 |
| line 15 (b) | 2022 X: 2,918.91 + 9.3% × 42,252 | 6,848 |
| line 15 (c) | 2021 Tax Table row 96,451 to 96,550: 2,695.19 + 9.3% × 35,286 | 5,977 |
| line 16 | stated | 6,325; 5,681; 4,814 |
| line 17 | 15 − 16 | 1,167; 1,167; 1,163 |
| line 18, 19 | credits up 200 in 2022: subtract | 200 (b); 1,167; 967; 1,163 |
| line 20, 21 | AMT +150 in 2021 | 150 (c); 1,167; 967; 1,313 |
| line 22 | 1,167 + 967 + 1,313 | 3,447 |
| line 23 | 3,447 / 3 | 1,149 |
| line 24 | 1,149 × 3 | 3,447 |
| line 25 | line 2 | 1,140 |
| line 26 | 3,447 − 1,140 | 2,307 |
| 540 line 17, 19 | wages; less 5,706 | 140,000; 134,294 |
| 540 line 31 | 2025 X: 3,201.97 + 9.3% × 61,570 | 8,928 |
| 540 line 32, 33 | exemption credit | 153; 8,775 |
| 540 line 34 | FTB 5870A line 26, box checked | 2,307 |
| 540 line 35, 48, 64 | 8,775 + 2,307 | 11,082 |
| 540 line 71, 78 | W-2 box 17 | 8,900 |
| 540 line 100, 111 | 11,082 − 8,900 | 2,182 |

The federal return does not change: the trust was created after 1984, so Form 4970 does not file.
