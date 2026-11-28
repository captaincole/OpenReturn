# cilia — a grain farmer claims the credit for employer differential wage payments (synthetic)

Cilia Fenmarsh is single and lives in Brookings, South Dakota. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 8932 and the Schedule F instructions, then locked (`verification: "unverified"`).

Cilia runs a wheat and sorghum farm (Schedule F) and materially participates in it. Two hired hands served on active duty for more than 30 days in 2025, and the farm paid them differential wage payments. She takes the standard deduction and paid four estimated tax payments. The return is federal only: South Dakota has no income tax.

The scenario covers the branch that `basel` cannot: a farm, not a business.

- Form 8932 lines 1, 2 and 4. Line 3 is blank: no K-1.
- Schedule F line 22: labor hired less the credit. "Reduce your deduction by the amounts claimed on the following ... Form 8932" (`irs-1040sf-inst-2025::sec::line-22::b01`).
- Form 3800 Part III line 1w and Schedule 3 line 6a.

Forms that file: Form 1040, Schedules 1, 2, 3, F and SE, Forms 3800, 6251, 8932 and 8995.

## Inputs

| Employee | Service | 2025 differential wage payments | Qualified |
| --- | --- | --- | --- |
| Brenn Hollis | Army National Guard, federal orders March to September | $14,300.80 | yes |
| Orla Dunmore | Marine Corps Reserve, 45 days | $3,950 | yes |

| Input | Amounts |
| --- | --- |
| Farm (Schedule F), wheat and sorghum | sales $236,000; labor hired $64,000; fertilizer $31,500; fuel $18,200; chemicals $14,800; seeds $12,700; repairs $9,300; insurance $7,600; taxes $6,100 |
| Final order under the reemployment rights law, 2023 to 2025 | no |
| Estimated tax payments | 4 × $2,500 |

## Documents

None. The differential wage payments are stated answers from the payroll records and the military orders: no official form holds them per employee.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8932 line 1 | 14,300.80 + 3,950 = 18,250.80 | 18,251 |
| 8932 line 2, 4 | 18,251 × 20% = 3,650.20 | 3,650 |
| Schedule F line 22 | 64,000 − 3,650 | 60,350 |
| Schedule F line 33, 34 | the expenses; 236,000 less 160,550 | 160,550; 75,450 |
| Schedule SE line 4a, 12, 13 | 75,450 × 92.35% = 69,678; 8,640 + 2,021; half | 69,678; 10,661; 5,331 |
| 1040 line 11a | 75,450 − 5,331 | 70,119 |
| 1040 line 13a | the smaller of 20% × 70,119 and 20% × (70,119 − 15,750) | 10,874 |
| 1040 line 15, 16 | 70,119 − 15,750 − 10,874; tax table, single | 43,495; 4,979 |
| Form 6251 line 4 | 43,495 + 15,750, below the 88,100 exemption | 59,245 |
| Form 3800 line 1w (e), line 38 | Form 8932 line 4; the credit fits under 4,979 | 3,650 |
| Schedule 3 line 6a; 1040 line 20 | Form 3800 line 38 | 3,650 |
| 1040 line 24, 37 | 4,979 − 3,650 + 10,661; less 10,000 paid | 11,990; 1,990 |
