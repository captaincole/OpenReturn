# kiruna (synthetic, unverified)

Kiruna Vashelle is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (San Jose). One W-2: $118,000.
- Two rentals she manages (active participation): a duplex with net income of
  $28,000 and a house with a net loss of $6,000. No carryovers.
- California credits from passive activities, as the credit forms figure them:
  - Research (183) from the duplex, $1,200, and $300 unallowed in 2024. A
    research credit from a rental is unusual; it is here so Part II shows.
  - Low-income housing (172) from Coyote Creek Family Apartments LP (placed in
    service after 1989), $4,000, and $1,500 unallowed in 2024.
  - Research (183) from Alviso Robotics Partners LP, a business she does not
    work in, $2,500.
  - Orphan drug carryover (185) from Saratoga Biologics LLC, $800 unallowed in 2024.
- Standard deduction. Schedule P (540) files: she has more than two credits.

## Documents

None. The W-2 has no PDF. The rentals, the credits and last year's unallowed
credits are her answers; the credit forms (FTB 3521, 3523, 3540) are not in the engine.

## What it covers

- FTB 3801-CR lines 1a to 1c, 3a to 12, 14 to 17: net passive income on
  line 6, the special allowance in Part II, Worksheets 5 to 9.
- Schedule P (540) Section B2 lines 16 to 18, all four columns, in the order
  research, orphan drug, low-income housing (decision A48).
- Form 540 line 45 (more than two credits), lines 47 and 48.
- Not covered: lines 2a to 2c and Form 540 lines 43 and 44 (`leonin`), line 13
  and Part IV (unit tests).

## Hand check

| Line | Value | How |
| --- | --- | --- |
| Sch E line 21 A, B; 8582 and 3801 line 3 | 28,000; −6,000; 22,000 | net income; all losses allowed |
| 1040 line 11 | 140,000 | 118,000 + 22,000 |
| 540 lines 19, 31, 35 | 134,294; 8,928; 8,775 | 140,000 − 5,706; rate schedule; less 153 |
| 3801-CR 1a, 1b, 1c | 1,200; 300; 1,500 | Worksheet 1 |
| 3801-CR 3a, 3b, 3c | 4,000; 1,500; 5,500 | Worksheet 3 (after 1989) |
| 3801-CR 4a, 4b, 4c | 2,500; 800; 3,300 | Worksheet 4 |
| 3801-CR 5 | 10,300 | 1,500 + 5,500 + 3,300 |
| 3801-CR 6 | 2,046 | 9.3% × 22,000 (134,294 and 112,294 in the 9.3% bracket) |
| 3801-CR 7, 8 | 8,254; 1,500 | 10,300 − 2,046; smaller of 1,500 and 8,254 |
| 3801-CR 9, 10, 11, 12 | 150,000; 140,000; 10,000; 5,000 | federal 8582-CR line 10 = AGI with the net passive income |
| 3801-CR 13, 14 | blank; 5,000 | FTB 3801 line 3 is income, so no line 9 |
| 3801-CR 15, 16 | 465; 465 | 9.3% × 5,000; smaller of 1,500 and 465 |
| 3801-CR 17 | 2,511 | 2,046 + 465 |
| Worksheet 5 | 372; 93 | 465 by 1,200 : 300; column (d) 828, 207 |
| Worksheet 8 | 656, 164, 3,168, 1,188, 1,979, 634 | 10,300 − 2,511 = 7,789 over 828, 207, 4,000, 1,500, 2,500, 800 |
| Worksheet 9 | research 544 + 136 + 521 = 1,201; housing 832 + 312 = 1,144; orphan drug 166 | each credit less its share |
| Sch P line 11 | 8,775 | line 2 (3,308) + line 3 (5,467) |
| Sch P line 16 (a) to (d) | 1,201; 1,201; 7,574; 0 | code 183 |
| Sch P line 17 (a) to (d) | 166; 166; 7,408; 0 | code 185 |
| Sch P line 18 (a) to (d) | 1,144; 1,144; 6,264; 0 | code 172 |
| 540 line 45, 47, 48 | 2,511; 2,511; 6,264 | column (b) total; 8,775 − 2,511 |
| 540 line 115 | 1,136 | 7,400 withheld − 6,264 |
