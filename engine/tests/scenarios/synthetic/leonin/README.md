# leonin (synthetic, unverified)

Leonin Castellane is a made-up taxpayer. No filed return, benchmark case or
IRS test package stands behind his values. The lines below were checked by
hand against the forms and their instructions, then the engine's output was locked.

## Who he is

- Single, a full-year California resident (Fresno). One W-2: $82,000.
- A rental house he manages, with net income of $14,000. No carryover, so
  FTB 3801 does not file (it is for passive losses).
- California credits from passive activities, as the credit forms figure them:
  - Low-income housing (172) through Fulton Housing Partners, an interest he
    bought in 1988: $600 this year and $1,800 unallowed in 2024 (Worksheet 2).
  - Research (183) from Kings River Ag Analytics LP, a business he does not
    work in: $1,200.
- Standard deduction. No Schedule P (540): two credits, no AMT item.

## Documents

None. The W-2 has no PDF. The rental, the credits and last year's unallowed
credit are his answers; the credit forms (FTB 3521, 3523) are not in the engine.

## What it covers

- FTB 3801-CR lines 2a to 2c (an interest acquired before 1990), 4a and 4c,
  5 to 7 and 17. Line 6 comes from the rental's California net income because
  FTB 3801 does not file. Part II is skipped: there is no amount on line 1c.
- Worksheets 8 and 9 share the unallowed credit between the two credits.
- Form 540 lines 43 and 44 with no Schedule P (540): each credit's name, code
  and amount, up to the tax left. Lines 47 and 48.
- Not covered: Part II and Schedule P (540) (`kiruna`), line 13 and Part IV
  (unit tests).

## Hand check

| Line | Value | How |
| --- | --- | --- |
| Sch E line 21; 1040 line 11 | 14,000; 96,000 | 26,400 − 12,400; 82,000 + 14,000 |
| 540 lines 19, 31, 35 | 90,294; 4,837; 4,684 | 96,000 − 5,706; Tax Table; less 153 |
| 3801-CR 2a, 2b, 2c | 600; 1,800; 2,400 | Worksheet 2 |
| 3801-CR 4a, 4c | 1,200; 1,200 | Worksheet 4 |
| 3801-CR 5 | 3,600 | 2,400 + 1,200 |
| 3801-CR 6 | 1,302 | 9.3% × 14,000 (90,294 and 76,294 in the 9.3% bracket) |
| 3801-CR 7 | 2,298 | 3,600 − 1,302 |
| 3801-CR 17 | 1,302 | line 6 + line 16 (blank) |
| Worksheet 8 | 383; 1,149; 766 | 2,298 over 600, 1,800, 1,200 |
| Worksheet 9 | housing 217 + 651 = 868; research 434 | each credit less its share |
| 540 line 43 | Research, 183, 434 | first in the order of use (decision A48) |
| 540 line 44 | Low-Income Housing, 172, 868 | the tax left (4,684 − 434) covers it |
| 540 lines 47, 48 | 1,302; 3,382 | 434 + 868; 4,684 − 1,302 |
| 540 line 115 | 218 | 3,600 withheld − 3,382 |
