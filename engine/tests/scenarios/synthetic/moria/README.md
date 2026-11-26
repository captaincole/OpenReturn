# moria (synthetic, unverified)

Moria Veltane is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Santa Monica). One W-2: $240,000,
  of which $30,000 was for weeks filmed in Utah; Utah tax $1,350.
- A program 3.0 motion picture credit (certificate 7488) from Long Shadow
  Features LP: a $3,000 share for 2025 and $1,500 left from 2024.
- Standard deduction. Two credits and no AMT, so no Schedule P (540).

## Documents

None. The K-1 statement and the Utah return are not in the engine: their
amounts are her answers. The W-2 has no PDF. Her K-1 income is left out on
purpose.

## What it covers

- FTB 3541 lines 2, 5a, 11, 12a, 12b and 13, with no Schedule P (540).
- Form 540 lines 43 (the film credit) and 44 (the Utah credit), 47 and 48.
- Schedule S line 2 after the film credit.
- Not covered: Schedule P (540) and the election (`lyrelle`).

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 lines 19, 31, 35 | 234,294; 18,228; 18,075 | 240,000 − 5,706; rate schedule; less 153 |
| 3541 lines 2, 5a, 11 | 3,000; 1,500; 4,500 | |
| 3541 lines 12a, 12b, 13 | 4,500; 0; 0 | the tax left (18,075) is more than the credit |
| 540 line 43 | Program 3.0 Motion Picture, 239, 4,500 | |
| Sch S line 2 | 13,575 | 18,075 − 4,500 |
| Sch S lines 5, 6 | 0.125; 1,697 | 30,000 ÷ 240,000; 13,575 × 0.125 |
| Sch S lines 11, 12 | 1,350; 1,350 | smaller of 1,697 and 1,350 |
| 540 lines 44, 47, 48 | 1,350; 5,850; 12,225 | 4,500 + 1,350; 18,075 − 5,850 |
