# basel — a freight company owner claims the credit for employer differential wage payments (synthetic)

Basel Thornwick is single and lives in Waco, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 8932, the Schedule C instructions and the Form 3800 instructions, then locked (`verification: "unverified"`).

Basel runs a regional freight company (Schedule C) and materially participates in it. Three employees served on active duty for more than 30 days in 2025, and the company kept paying the difference between their military pay and their wages. Basel is also a general partner in a truck stop partnership. Its Schedule K-1 (Form 1065) reports only box 15 code AV, his share of the partnership's own credit. He takes the standard deduction and paid four estimated tax payments. The return is federal only: Texas has no income tax.

The scenario fills Form 8932 lines 1 to 4:

- Line 1 limits one employee to $20,000 and leaves out one who was not an employee for the 91 days before his orders.
- Line 2 is 20% of line 1. It also lowers Schedule C line 26.
- Line 3 takes the K-1 credit, and line 4 goes to Form 3800 Part III line 1w (two sources, so Part V lists both).
- Lines 5 and 6 are for cooperatives, estates and trusts, so they stay blank.

The farm branch (Schedule F line 22) is the `cilia` scenario: the engine figures the QBI deduction for one self-employed activity at a time.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 6251, 8932 and 8995. Form 6251 files because Form 3800 needs the tentative minimum tax.

## Inputs

| Employee | Service | 2025 differential wage payments | Qualified | Line 1 |
| --- | --- | --- | --- | --- |
| Joran Velde, driver | Army Reserve | $26,400 | yes | $20,000 |
| Marith Sone, dispatcher | Army National Guard | $8,450.50 | yes | $8,450.50 |
| Tavin Orrel, driver | hired 60 days before his orders | $5,200 | no | $0 |

| Input | Amounts |
| --- | --- |
| Freight company (Schedule C), Thornwick Freight | receipts $470,000; wages $214,000; vehicle rent $48,000; repairs $31,200; insurance $26,500; taxes $18,400; supplies $9,800 |
| Final order under the reemployment rights law, 2023 to 2025 | no |
| K-1, Brazos Valley Depot LLC (00-0008932) | box 15 AV $1,840 |
| Estimated tax payments | 4 × $9,000 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. The differential wage payments are stated answers from the payroll records and the military orders: no official form holds them per employee (the employer reports them in box 1 of each Form W-2, with the other wages).

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8932 line 1 | 20,000 + 8,450.50 + 0 = 28,450.50 | 28,451 |
| 8932 line 2 | 28,451 × 20% = 5,690.20 | 5,690 |
| 8932 line 3 | K-1 code AV | 1,840 |
| 8932 line 4 | 5,690 + 1,840 | 7,530 |
| Schedule C line 26 | 214,000 − 5,690 | 208,310 |
| Schedule C line 28, 31 | 48,000 + 26,500 + 31,200 + 9,800 + 18,400 + 208,310; 470,000 less it | 342,210; 127,790 |
| Schedule SE line 4a, 12, 13 | 127,790 × 92.35% = 118,014; 14,634 + 3,422; half | 118,014; 18,056; 9,028 |
| 1040 line 11a | 127,790 − 9,028 | 118,762 |
| 1040 line 13a | the smaller of 20% × 118,762 and 20% × (118,762 − 15,750) | 20,602 |
| 1040 line 15, 16 | 118,762 − 15,750 − 20,602; tax table, single | 82,410; 13,048 |
| Form 6251 line 4, 7 | 82,410 + 15,750; (98,160 − 88,100) × 26% | 98,160; 2,616 |
| Form 3800 line 1w (e), Part V | Form 8932 line 4: the K-1 $1,840 and line 2 $5,690 | 7,530 |
| Form 3800 line 16, 17, 38 | 13,048 − 2,616 = 10,432; the credit fits | 7,530 |
| Schedule 3 line 6a, 8; 1040 line 20 | Form 3800 line 38 | 7,530 |
| 1040 line 24, 34 | 13,048 − 7,530 + 18,056; 36,000 less it | 23,574; 12,426 |
