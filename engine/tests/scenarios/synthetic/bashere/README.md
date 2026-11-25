# bashere — a seasonal business that pays its estimated tax late (synthetic)

Bashere Calloway is single and lives in San Antonio, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Bashere installs holiday and event lighting: most of the business's profit comes from September to December. A part-time job paid wages from January to June. In February Bashere took $8,000 out of a traditional IRA at 35 (code 1, no exception). Bashere itemizes (mortgage interest and the January property tax) and takes the American opportunity credit for a fall course. Estimated tax went in late: nothing in April, $100 on Monday, June 16 (it counts on Sunday, June 15), $1,500 in September and $4,000 in January 2026, plus $300 of the 2024 overpayment. The return is federal only: Texas has no income tax.

Bashere states the income, deductions, taxes and credits of each Schedule AI period (January 1 through March 31, May 31 and August 31). The annualized income installment method lowers the penalty, so box C is checked and Schedule AI, with its Part II, is filled. The penalty goes on Form 1040 line 38 and into line 37.

Forms that file: Form 1040, Schedules 1, 2, 3, A, C and SE, Forms 8995, 8863 and 2210.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Riverwalk Event Rentals | box 1 $24,000, box 2 $1,800 |
| 1099-R, Alamo Heights Savings Bank | box 1 and 2a $8,000, box 4 $800, code 1, IRA |
| Calloway Lights (Schedule C) | receipts $55,000, expenses $10,000 |
| Form 1098 and property tax | interest $9,800; real estate tax $6,500 |
| 1098-T, Mission Trail Community College, `docs/01-mission-trail-1098-t.pdf` | box 1 $4,000 |
| Estimated tax | 2024 overpayment $300; 6/16/25 $100; 9/15/25 $1,500; 1/15/26 $4,000 |
| 2024 | tax $9,000, AGI $70,000, not a joint return |
| Schedule AI periods (a), (b), (c) | AGI $21,859, $31,717, $40,364; itemized $8,950, $10,583, $13,033; QBI deduction $1,487, $1,784, $2,509; other taxes $800 each; credits $0, $0, $2,500; business profit $2,000, $4,000, $9,000; social security wages $12,000, $20,000, $24,000 |

The Form 1098-T is made by `generate-docs.ts` from the fact value. The other documents have no PDFs.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 2210 line 1 | Form 1040 line 22 | 4,233 |
| 2210 line 2 | Schedule 2 lines 4 ($6,358) and 8 ($800) | 7,158 |
| 2210 line 3 | Form 1040 line 29 | 1,000 |
| 2210 lines 4, 5 | 4,233 + 7,158 − 1,000; × 90% = 9,351.90 | 10,391; 9,352 |
| 2210 lines 6, 7 | Form 1040 line 25d; 10,391 − 2,600 | 2,600; 7,791 |
| 2210 lines 8, 9 | 2024 tax (AGI not over $150,000); smaller of 9,352 and 9,000 | 9,000; 9,000 |
| Schedule AI column (a) | 21,859 × 4; 8,950 × 4 = 35,800 (more than $15,750); 87,436 − 35,800 − 1,487; Tax Table on 50,149 | 87,436; 50,149; 5,942 |
| Schedule AI column (a) Part II | 2,000 × 92.35% = 1,847; 0.496 × 1,847; 0.116 × 1,847 | 916 + 214 = 1,130 |
| Schedule AI column (a) lines 17–27 | 5,942 + 1,130 + 800; × 22.5%; smaller of 1,771 and 2,250 | 7,872; 1,771; 1,771 |
| Schedule AI column (b) | 31,717 × 2.4; 10,583 × 2.4 = 25,399; − 1,784; tax on 48,938 | 76,121; 48,938; 5,678 |
| Schedule AI column (b) lines 17–27 | 5,678 + 1,356 + 800 = 7,834 × 45% = 3,525; − 1,771; 2,250 + 479 | 1,754; 2,729; 1,754 |
| Schedule AI column (c) | 40,364 × 1.5; 13,033 × 1.5 = 19,550; − 2,509; tax on 38,487 | 60,546; 38,487; 4,379 |
| Schedule AI column (c) lines 17–27 | 4,379 + 1,908 + 800 − 2,500 = 4,587 × 67.5% = 3,096; − 3,525 is below 0 | 0 |
| Schedule AI column (d) | Form 1040 lines 11a, 12e, 13a, 15, 16; Schedule SE line 12; credits 1,500 + 1,000 | 73,821; 49,157; 5,733; 6,358; 2,500 |
| Schedule AI column (d) lines 19–27 | 10,391 (= line 4); × 90% = 9,352; − 3,525; 2,250 + 3,225 | 5,827; 5,475; 5,475 |
| 2210 line 10 | Schedule AI line 27 | 1,771; 1,754; 0; 5,475 |
| 2210 line 11 | 300 + 650 withheld; 100 + 650; 1,500 + 650; 4,000 + 650 | 950; 750; 2,150; 4,650 |
| 2210 column (a) | line 17 = 1,771 − 950 | 821 |
| 2210 column (b) | line 15 = 750 − 821 → 0; line 16 = 71; line 17 = 1,754 | 0; 71; 1,754 |
| 2210 column (c) | line 14 = 71 + 1,754; line 15 = 2,150 − 1,825; line 18 = 325 − 0 | 1,825; 325; 325 |
| 2210 column (d) | line 13 = 4,650 + 325; line 17 = 5,475 − 4,975 | 4,975; 500 |
| 2210 line 19 | (750 × 61 + 71 × 153 + 1,754 × 92 + 500 × 90) × 0.07 ÷ 365 = 50.43 | 50 |
| 1040 line 26 | 300 + 100 + 1,500 + 4,000 | 5,900 |
| 1040 line 38 | Form 2210 line 19 | 50 |
| 1040 line 37 | 11,391 − 9,500 + 50 | 1,941 |

The regular method (four installments of $2,250) gives a higher penalty, so box C is checked.
