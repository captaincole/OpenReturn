# katerine (synthetic, unverified)

Katerine Vossbeck is a made-up taxpayer. No filed return, benchmark case or
answer key stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Sacramento).
- One W-2: $300,000 of wages. $40,000 of it is for weeks on a Salt Lake City
  project. She filed a Utah nonresident return, and Utah tax is $1,800.
- She owns shares of Folsom Lake Components, Inc., an S corporation that
  employs inmates under an approved joint venture. Its K-1 passes through a
  $12,000 prison inmate labor credit.
- She owns part of American River Storage LLC, which elected to pay the PTE
  elective tax: a $4,000 credit.
- She pays no wages herself and had no FTB 3507 in 2024.

## Documents

None. The K-1s and the Utah return are not in the engine: their amounts are
her answers. The W-2 has no PDF. The K-1 income is left out on purpose: the
engine has no California K-1, so this scenario tests the credits alone.

## What it covers

- The credit is more than the tax above tentative minimum tax. Schedule P
  (540) line 4 column (b) stops at line 3, and FTB 3507 line 7 carries the
  rest (decision A68 in `docs/rule-decisions.md`).
- Section B starts from TMT: line 11 is line 2 plus a column (c) of 0.
- Schedule S line 2 leaves out code 162's credit along with the others.
- Three other credits: Form 540 line 45 holds them; lines 43 and 44 stay blank.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 lines 31, 32, 35 | 23,808; 33; 23,775 | as `teslyn` (same wages and status) |
| Sch P lines 21, 23, 24 | 300,000; 207,251; 14,508 | AMTI; less 92,749; × 7% |
| Sch P Part III line 3 | 9,267 | 23,775 − 14,508 |
| 3507 lines 1 to 5 | 0; 0; 12,000; 0; 12,000 | no wages; K-1; no carryover |
| Sch P line 4 (a), (b), (c) | 12,000; 9,267; 0 | line 5; smaller of 12,000 and 9,267; 9,267 − 9,267 |
| 3507 lines 6a, 6b, 6c, 7 | 9,267; 0; 0; 2,733 | Sch P line 4 (b); not a corporation; no election; 12,000 − 9,267 |
| Sch P line 11 | 14,508 | 14,508 + 0 |
| Sch S lines 2, 5, 6 | 14,508; 0.1333; 1,934 | 23,775 − 9,267; 40,000 / 300,000; 14,508 × 0.1333 |
| Sch S lines 11, 12 | 1,800; 1,800 | Utah tax × 1.0000; smaller of 1,934 and 1,800 |
| Sch P line 20 (a), (b), (c) | 1,800; 1,800; 12,708 | Schedule S line 12; 14,508 − 1,800 |
| Sch P line 21 (a), (b), (c) | 4,000; 4,000; 8,708 | 3804-CR line 3; 12,708 − 4,000 |
| 540 line 45 | 15,067 | 9,267 + 1,800 + 4,000 (more than two credits) |
| 540 lines 47, 48 | 15,067; 8,708 | line 45; 23,775 − 15,067 |
| 540 line 115 | 16,092 | 24,800 withheld − 8,708 |
