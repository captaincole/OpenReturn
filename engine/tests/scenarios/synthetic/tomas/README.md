# tomas — synthetic, unverified

The Albrecht family is made up. No filed return, benchmark case or FTB example stands behind it. The expected values are the engine's output, checked by hand against FTB 3803, its 2025 instructions (`ca-3803-inst-2025`), Form 8814 and the Form 540 and Schedule CA (540) instructions, then locked.

## The family

Tomas and Hana Albrecht file jointly and live in Oakland all year. Hana has one W-2. Their son Juniper (born 2010) has his own interest and dividends. The parents report his income on federal Form 8814 and on FTB 3803.

## Documents

Made by `generate-docs.ts` from Juniper's investment income fact (fake data), with Juniper as the recipient: his 1099-INT (`docs/01-…`; box 1 is his interest less the Treasury bill interest in box 3) and 1099-DIV (`docs/02-…`). The W-2 has no PDF.

## What it covers

- One FTB 3803: the "more than one" box is blank.
- $1,600 of Juniper's $3,400 interest is Treasury bill interest. California does not tax it, so it moves from line 1a to line 1b.
- No capital gain distributions: line 3 is blank.
- Schedule CA (540) line 8z column B: Form 8814 line 6 ($2,600) less FTB 3803 line 6 ($1,000) is $1,600. This is the branch `verin` cannot show.
- Form 540 line 31 adds $14 to the tax and checks the FTB 3803 box.

## Hand check of FTB 3803

| Line | Value | Check |
| --- | --- | --- |
| 1a | 1,800 | 3,400 − 1,600 |
| 1b | 1,600 | Treasury interest |
| 2 | 1,900 | |
| 3 | blank | |
| 4 | 3,700 | 1,800 + 1,900 |
| 5 | 2,700 | |
| 6 | 1,000 | |
| 7 | 1,350 | |
| 8 | 2,350 | |
| 9 | 14 | line 8 is $1,350 or more |

## The lines that take FTB 3803 amounts

| Line | Value | Check |
| --- | --- | --- |
| Form 8814 line 6 | 2,600 | 3,400 + 1,900 − 2,700 |
| Schedule CA line 8z col B | 1,600 | 2,600 − 1,000 |
| Schedule CA line 9a col B, line 10 col B, line 27 col B | 1,600 | |
| Form 540 line 14 | 1,600 | Schedule CA line 27 col B |
| Form 540 line 17 | 97,500 | 99,100 − 1,600 |
| Form 540 line 19 | 86,088 | 97,500 − 11,412 |
| Form 540 line 31 | 2,250 | tax table 2,236 (86,051–86,150, joint) + 14 |
