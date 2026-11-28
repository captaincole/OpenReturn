# jaim — a made-up landscaping company owner with employee health plans (synthetic)

Jaim Tavren is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Jaim owns a landscaping company (Schedule C) with fourteen employees. Eight of them are enrolled in SHOP health plans, and the company pays 60% of each plan's premium. Both plans cost more than the Travis County average premium. One employee worked over 2,080 hours, and one was a seasonal summer hand. A made-up state subsidy paid the insurer $1,200. Jaim is also a general partner in a plant nursery. Its Schedule K-1 (Form 1065) reports business income in box 1 and the same credit in box 15 code BA. The return is federal only: Texas has no income tax.

The scenario fills every line of Form 8941 that an individual fills:

- Lines A to C: SHOP coverage with a Marketplace identifier, the company's EIN on line B, no credit claimed before 2024.
- Lines 1 to 3: 14 employees, 12 FTEs, $37,000 of average wages.
- Lines 4 to 7: line 5 (the county average) is below line 4, so line 6 takes it.
- Lines 8 and 9: both phaseouts (Worksheets 5 and 6).
- Lines 10 to 16: the subsidy, lines 13 and 14, the K-1 on line 15.
- Lines 17 to 20 stay blank: they are for cooperatives, estates, trusts and tax-exempt employers.

Schedule C line 14 is the stated benefits less line 12. Form 3800 line 4h takes line 12 and the K-1 credit; the credit reaches Schedule 3 line 6a.

The Form 8941 amounts are stated answers from the payroll and the premium invoices: no information return reports them. The average premiums are the Travis County row of the instructions' table (`irs-8941-inst-2025::sec::line-19::b67`).

## Inputs

| Input | Amounts |
| --- | --- |
| Company (Schedule C), Tavren Landscape Works | receipts $1,020,000; wages $457,100; employee benefit programs $61,500 (premiums $58,500 and $3,000 of life insurance); other expenses $193,200 |
| Average premiums, Travis County | employee-only $8,000; family $21,482 |
| Plans | employee-only $9,000 a year, family $24,000 a year; the company pays 60% |
| State subsidy | $1,200 |
| K-1, Barton Creek Nursery Partners LLC (00-0018941) | box 1 $30,000; box 15 BA $1,850.40 |
| Estimated tax payments | 4 × $18,000 |

| Employees | Hours (Worksheet 1) | Wages | Paid (col. b) | Average (col. c) |
| --- | --- | --- | --- | --- |
| 2 family (one with 2,300 hours) | 2,080 + 2,080 | 110,000 | 28,800 | 2 × 14,400 × 21,482 / 24,000 = 25,778.40 |
| 5 employee-only, full year | 5 × 2,080 | 185,000 | 27,000 | 5 × 5,400 × 8,000 / 9,000 = 24,000 |
| 1 employee-only, 26 weeks | 2,080 | 32,000 | 2,700 | 2,400 |
| 5 not enrolled | 2,080 + 2,080 + 1,820 + 1,300 + 1,300 | 119,100 | — | — |
| 1 seasonal, not enrolled | 0 | 0 | — | — |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8941 line 1 | Worksheet 1 rows | 14 |
| 8941 line 2 | 25,220 hours ÷ 2,080 = 12.13, down | 12 |
| 8941 line 3 | 446,100 ÷ 12 = 37,175, down to $1,000 | 37,000 |
| 8941 line 4 | 28,800 + 27,000 + 2,700 | 58,500 |
| 8941 line 5 | 25,778.40 + 24,000 + 2,400 | 52,178 |
| 8941 line 6, 7 | smaller; × 50% | 52,178; 26,089 |
| 8941 line 8 | 26,089 − 26,089 × 2/15 (3,479) | 22,610 |
| 8941 line 9 | 22,610 − 26,089 × 3,700/33,300 (2,899) | 19,711 |
| 8941 line 10, 11 | subsidy; 58,500 − 1,200 | 1,200; 57,300 |
| 8941 line 12 | smaller of 19,711 and 57,300 | 19,711 |
| 8941 line 13, 14 | 8 enrolled; 16,640 ÷ 2,080 | 8; 8 |
| 8941 line 15, 16 | K-1 code BA; 19,711 + 1,850 | 1,850; 21,561 |
| Schedule C line 14 | 61,500 − 19,711 | 41,789 |
| Schedule C line 31 | 1,020,000 − 692,089 | 327,911 |
| 1040 line 8 | 327,911 + 30,000 | 357,911 |
| 1040 line 11a | 357,911 − 15,309 (half of SE tax 30,618) | 342,602 |
| 1040 line 15 | 342,602 − 15,750 − 62,520 (Form 8995-A) | 264,332 |
| 1040 line 16 | tax computation worksheet, single | 62,063 |
| Form 3800 line 4h (e), (g); line 38 | 19,711 + 1,850 | 21,561 |
| Schedule 3 line 6a; 1040 line 20 | Form 3800 line 38 | 21,561 |
| 1040 line 22 | 62,063 − 21,561 | 40,502 |
| 1040 line 24 | 40,502 + 30,618 + 925 (Form 8959) | 72,045 |
| 1040 line 37 | 72,045 − 72,000 | 45 |
