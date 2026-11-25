# domon (synthetic, unverified)

Domon Tallvane is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind his values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who he is

- Single, full-year California resident (San Diego).
- One W-2: $260,000 of wages. $35,000 of it is for weeks on a Denver contract.
  He filed a Colorado nonresident return, and Colorado tax is $1,540.
- He owns shares of ten entities that elected to pay California's
  pass-through entity (PTE) elective tax. Each K-1 statement prints his credit.
- His 2024 FTB 3804-CR carried $2,140 of unused credit to 2025.
- He takes the standard deduction, so Schedule P (540) does not file.

## Documents

None. The K-1s and the Colorado return are not in the engine: each credit,
entity name and number, and the Colorado amounts are his answers. The W-2 has
no PDF. His K-1 income is left out on purpose: the engine has no California
K-1, so this scenario tests the credit alone.

## What it covers

- FTB 3804-CR: all ten Part I rows, Part I line 2, and Part II lines 1 to 5.
- Line 4 limited by the tax left after the other state tax credit, with no
  Schedule P: line 5 carries $12,551 to 2026.
- Form 540 line 43 (other state tax credit, code 187) and line 44 (PTE
  elective tax credit, code 242), lines 47 and 48.
- `teslyn` covers Schedule P (540) line 21 and Form 540 line 45.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 lines 17, 18, 19 | 260,000; 5,706; 254,294 | wages; single standard deduction |
| 540 line 31 | 20,088 | 2025 rate schedule, 9.3% bracket (setalle's 23,808 less 40,000 × 9.3%) |
| 540 line 32 | 129 | 153 less 6 × 4 steps (7,797 over $252,203, each $2,500 or part) |
| 540 line 35 | 19,959 | 20,088 − 129 |
| Sch S lines 2, 5, 6 | 19,959; 0.1346; 2,686 | line 35, no other credits; 35,000 / 260,000; 19,959 × 0.1346 |
| Sch S lines 11, 12 | 1,540; 1,540 | Colorado tax × 1.0000; smaller of 2,686 and 1,540 |
| 3804-CR line 1a–1j (c) | 9,300 … 465 | the stated K-1 credits |
| 3804-CR Part I line 2 | 28,830 | 9,300 + 6,975 + 1,116 + 2,325 + 1,860 + 930 + 1,395 + 744 + 3,720 + 465 |
| 3804-CR Part II lines 1, 2, 3 | 28,830; 2,140; 30,970 | Part I line 2; 2024 line 5; 1 + 2 |
| 3804-CR line 4 | 18,419 | smaller of 30,970 and 19,959 − 1,540 (after the other state tax credit) |
| 3804-CR line 5 | 12,551 | 30,970 − 18,419 |
| 540 line 43 | Other State Tax, 187, 1,540 | Schedule S line 12 |
| 540 line 44 | PTE Elective Tax, 242, 18,419 | FTB 3804-CR line 4 |
| 540 lines 45, 47, 48 | blank; 19,959; 0 | two credits only; 1,540 + 18,419; 19,959 − 19,959 |
| 540 lines 71, 115 | 21,000; 21,000 | W-2 box 17; no tax left, so all withholding is refunded |
