# berowyn — canceled debts in California (synthetic)

Berowyn Halloway is single and lives in Sacramento all of 2025. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`). She is a full-year California resident.

She earns $72,000 of wages. Three creditors canceled debts and sent a Form 1099-C each (`docs/01` to `docs/03`, made by `generate-docs.ts`):

- A credit card, settled in February. She was solvent: all $6,500 is income.
- Her home mortgage, reduced by $25,000 in August. She still lives in the home.
- The rest of her car loan after a repossession, $3,800, canceled in December while she was insolvent by $2,900.

She has no tax attributes other than the basis of personal-use property: the nonbusiness chart of the instructions. The scenario covers Form 982 lines 1b, 1e, 2, 10a and 10b, Schedule 1 line 8c, and Schedule CA line 8c columns A and C. California does not follow the federal exclusion for a home mortgage after 2017, so the $25,000 is California income. `ailil` covers the other Part II lines.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Delta River Water District | box 1 $72,000, box 2 $7,200, box 16 $72,000, box 17 $2,900 |
| 1099-C, Golden Bear Bank | box 2 $6,500 |
| 1099-C, Sierra Gold Mortgage | box 2 $25,000 |
| 1099-C, Delta Auto Finance | box 2 $3,800, box 7 $11,200 |
| Insolvency Worksheet, December 5 | liabilities $512,000, assets $509,100 |
| After December 5 | property basis $528,000 (home $520,000, household goods $8,000), cash $2,600, liabilities $508,200 |
| Home | loan $470,000, all qualified; basis $520,000 |

The car fact names `insolventBefore`; the card does not. Only one insolvent debt, so one worksheet date.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 982 line 1b | car: 3,800, insolvent by 512,000 − 509,100 = 2,900 | checked |
| 982 line 1e | mortgage: 25,000, nothing nonqualified | checked |
| 982 line 2 | 2,900 + 25,000 | 27,900 |
| 982 line 3 | nonbusiness chart: not asked | blank |
| 982 line 10a | smallest of 2,900, 528,000 − 25,000 (line 10b), and 528,000 + 2,600 − 508,200 = 22,400 | 2,900 |
| 982 line 10b | smaller of 25,000 and the $520,000 basis | 25,000 |
| Schedule 1 line 8c | card 6,500 + car 3,800 − 2,900 | 7,400 |
| 1040 line 9, 11a | 72,000 + 7,400 | 79,400 |
| 1040 line 15 | 79,400 − 15,750 | 63,650 |
| 1040 line 16 | tax table 63,650–63,700 single: 1,192.50 + 4,386 + 22% × 15,200 = 8,922.50 | 8,923 |
| 1040 line 37 | 8,923 − 7,200 | 1,723 |
| Schedule CA line 8c column A | Schedule 1 line 8c | 7,400 |
| Schedule CA line 8c column C | Form 982 line 1e amount (`ca-540-sched-ca-inst-2025::sec::line-8-other-income::b01`) | 25,000 |
| Schedule CA lines 9a, 10, 27 column C | line 8c column C | 25,000 |
| 540 line 16 | Schedule CA line 27 column C | 25,000 |
| 540 line 17 | 79,400 + 25,000 | 104,400 |
| 540 line 19 | 104,400 − 5,706 standard deduction | 98,694 |
| 540 line 31 | tax table, row 98,651–98,750: 3,201.97 + 9.3% × 25,976 = 5,617.74 | 5,618 |
| 540 line 33 | 5,618 − 153 exemption credit | 5,465 |
| 540 line 100 | 5,465 − 2,900 withheld | 2,565 |

Line 10a's limit counts her cash (decision A46 in `docs/rule-decisions.md`). Without it the limit would be 19,800, and line 10a would still be 2,900.

The 1099-C documents use the generator compared with real examples in `ailil`'s README.
