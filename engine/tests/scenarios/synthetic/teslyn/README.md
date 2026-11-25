# teslyn (synthetic, unverified)

Teslyn Corrane is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, full-year California resident (Oakland).
- One W-2: $300,000 of wages. $40,000 of it is for weeks on a Salt Lake City
  project. She filed a Utah nonresident return, and Utah tax is $1,800.
- In 2024 she exercised incentive stock options and kept the shares. Her 2024
  Schedule P (540) shows $6,873 of AMT and a $1,200 credit carryover (the same
  2024 figures as `setalle`).
- She owns shares of two entities that elected to pay California's
  pass-through entity (PTE) elective tax, and carried $4,000 of PTE credit
  from 2024.
- Standard deduction. FTB 3510 makes Schedule P (540) file.

## Documents

None. The K-1s, the Utah return and her 2024 return are not in the engine:
their amounts are her answers. The W-2 has no PDF. Her K-1 income is left out
on purpose: the engine has no California K-1, so this scenario tests the
credits alone.

## What it covers

- Three other credits: Schedule P (540) Part III takes the credit for prior
  year AMT (line 10), the other state tax credit (line 20) and the PTE elective
  tax credit (line 21), in that order.
- Schedule P (540) line 21, columns (a) to (d), with a carryover in (d).
- FTB 3804-CR line 4 from Schedule P line 21 column (b).
- Form 540 line 45 holds the three credits; lines 43 and 44 stay blank.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 lines 31, 32, 35 | 23,808; 33; 23,775 | as `setalle` (same wages and status) |
| 3510 line 38 | 6,450 | as `setalle` |
| Sch P line 10 (b), (c); line 11 | 6,450; 2,817; 17,325 | as `setalle` |
| Sch S lines 2, 5, 6 | 17,325; 0.1333; 2,309 | 23,775 − 6,450; 40,000 / 300,000; 17,325 × 0.1333 |
| Sch S lines 11, 12 | 1,800; 1,800 | Utah tax × 1.0000; smaller of 2,309 and 1,800 |
| Sch P line 20 (a), (b), (c) | 1,800; 1,800; 15,525 | Schedule S line 12; smaller of 1,800 and 17,325; 17,325 − 1,800 |
| 3804-CR Part I lines 1a, 1b, 2 | 9,300; 4,650; 13,950 | the stated K-1 credits |
| 3804-CR Part II lines 1, 2, 3 | 13,950; 4,000; 17,950 | Part I line 2; 2024 line 5; 1 + 2 |
| Sch P line 21 (a), (b) | 17,950; 15,525 | 3804-CR line 3; smaller of 17,950 and line 20 (c) |
| Sch P line 21 (c), (d) | 0; 2,425 | 15,525 − 15,525; 17,950 − 15,525 |
| 3804-CR lines 4, 5 | 15,525; 2,425 | Schedule P line 21 (b); 17,950 − 15,525 |
| 540 line 45 | 23,775 | 6,450 + 1,800 + 15,525 (more than two credits) |
| 540 lines 43, 44 | blank | more than two credits go on line 45 |
| 540 lines 47, 48 | 23,775; 0 | line 45; 23,775 − 23,775 |
| 540 line 115 | 24,800 | W-2 box 17; no tax left |
