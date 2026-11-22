# riley — synthetic, unverified

Riley Quinn is a made-up taxpayer. Every name, number and amount is invented.
No filed return, benchmark case or IRS test package stands behind it.

## The taxpayer

- Single, born 1985 (age 40, under 59½ all of 2025), no dependents.
- Lived in Reno, Nevada all year. Nevada has no income tax: federal only.
- One W-2: $68,000 of wages, $9,800 of federal tax withheld.
- Two early distributions from employer 401(k) plans, each with box 7 code 1:
  - Tallow & Pine 401(k) (a former employer): $12,000, $2,400 withheld.
    Exception 23 (emergency personal expense) covers $1,000 of it.
  - Sagebrush Instruments 401(k) (the current employer): an $8,000 hardship
    withdrawal, $800 withheld. Exception 05 (medical expenses) covers $2,900:
    $9,500 of unreimbursed medical bills less 7.5% of the $88,000 AGI.
- Standard deduction.

## What it covers

Form 5329 Part I files, because an exception covers part of a code 1
distribution (irs-5329-inst-2025::sec::who-must-file::b02). Two exceptions
apply, so line 2's number is 99 (irs-5329-inst-2025::sec::line-2::b01). Line 4
goes to Schedule 2 line 8, and line 8's "not required" box stays clear.

Forms checked: Form 5329, Schedule 2, Form 1040.

## Hand check

Each value was figured by hand from the blank forms and the 2025 instructions,
then matched to the engine and to the rendered PDF.

| Line | Value | How |
| --- | --- | --- |
| 5329 line 1 | 20,000 | 12,000 + 8,000, both box 2a |
| 5329 line 2 | 3,900 (99) | 1,000 (exception 23) + 2,900 (exception 05) |
| 5329 line 3 | 16,100 | line 1 − line 2 |
| 5329 line 4 | 1,610 | 10% of line 3 |
| Schedule 2 line 8 | 1,610 | Form 5329 line 4 |
| Schedule 2 line 21 | 1,610 | only line 8 |
| 1040 line 1a, 1z | 68,000 | W-2 box 1 |
| 1040 line 5a, 5b | 20,000 | 401(k) plans, not IRAs |
| 1040 line 9, 11a, 11b | 88,000 | 68,000 + 20,000 |
| 1040 line 12e, 14 | 15,750 | single standard deduction |
| 1040 line 15 | 72,250 | 88,000 − 15,750 |
| 1040 line 16, 18, 22 | 10,815 | tax table, single, 72,250–72,300 |
| 1040 line 23 | 1,610 | Schedule 2 line 21 |
| 1040 line 24 | 12,425 | 10,815 + 1,610 |
| 1040 line 25a | 9,800 | W-2 box 2 |
| 1040 line 25b | 3,200 | 1099-R box 4: 2,400 + 800 |
| 1040 line 25d, 33 | 13,000 | 9,800 + 3,200 |
| 1040 line 34, 35a | 575 | refund: 13,000 − 12,425 |

The values in `expected.ts` are locked engine output. A failure means the
engine changed, not that it is wrong.
