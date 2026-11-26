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
- The low-income housing credit's offset with no dollar limit (decision A56):
  line 17 adds line 7 to line 6, so every credit is allowed. Worksheet 6
  shares the offset; Worksheets 8 and 9 have no unallowed credit to share
  (`kiruna` shares one).
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
| Housing offset | 2,298 | smaller of line 2c (2,400) and line 7 − line 16 (2,298 − 0); no dollar limit (decision A56) |
| 3801-CR 17 | 3,600 | line 6 + line 16 (blank) + 2,298, which is line 5 |
| Worksheet 6 | 575; 1,723 | the 2,298 offset by 600 : 1,800; column (d) 25, 77 |
| Worksheet 8 | 0; 0; 0 | 3,600 − 3,600 = 0 over 25, 77, 1,200 |
| Worksheet 9 | housing 600 + 1,800 = 2,400; research 1,200 | each credit less its share |
| 540 line 43 | Research, 183, 1,200 | first in the order of use (decision A57) |
| 540 line 44 | Low-Income Housing, 172, 2,400 | the tax left (4,684 − 1,200) covers it |
| 540 lines 47, 48 | 3,600; 1,084 | 1,200 + 2,400; 4,684 − 3,600 |
| 540 line 115 | 2,516 | 3,600 withheld − 1,084 |
