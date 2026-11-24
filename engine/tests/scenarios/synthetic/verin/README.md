# verin — synthetic, unverified

The Castellanos family is made up. No filed return, benchmark case or FTB example stands behind it. The expected values are the engine's output, checked by hand against FTB 3803, its 2025 instructions (`ca-3803-inst-2025`), Form 8814 and the Form 540 and Schedule CA (540) instructions, then locked.

## The family

Verin and Dorian Castellanos file jointly and live in Sacramento all year. Verin has one W-2. Their daughters Lucia (born 2012) and Noor (born 2016) have their own interest and dividends. The parents report both girls' income on federal Form 8814 and on FTB 3803.

## Documents

Made by `generate-docs.ts` from each girl's investment income fact (fake data), with the girl as the recipient: Lucia's 1099-INT (`docs/01-…`, box 1 and box 8) and 1099-DIV (`docs/02-…`), and Noor's 1099-INT (`docs/03-…`; box 1 is her interest less the Treasury bill interest in box 3). The forms do not show which bonds are Oregon's: Lucia's $600 is the parents' answer, like the estimated tax and other income answers. The W-2 has no PDF.

## What it covers

- Two copies of FTB 3803, with the "more than one" box checked. The golden checks the first copy (Lucia).
- Lucia: $600 of her $900 tax-exempt interest is Oregon bond interest. California taxes it, so it moves to line 1a. Lines 1a to 9 are all filled, and line 9 is the $14 maximum.
- Noor: $250 of her $2,000 interest is Treasury bill interest. California does not tax it, so it moves to line 1b. Line 2 is 0, lines 5 and 6 are blank, and line 9 is 1% of line 8 ($4).
- Schedule CA (540) line 8z column C: FTB 3803 line 6 ($3,050) less Form 8814 line 6 ($2,450) is $600. Line 8z reads "Form 8814, FTB 3803".
- Form 540 line 31 adds $14 + $4 to the tax and checks the FTB 3803 box.
- No Schedule D (540): the child's capital gain distributions stay on line 6.

The second scenario, `tomas`, shows column B, which this family cannot show.

## Hand check of FTB 3803

| Line | Lucia (copy 1) | Noor (copy 2) |
| --- | --- | --- |
| 1a | 1,240 + 600 = 1,840 | 2,000 − 250 = 1,750 |
| 1b | 900 − 600 = 300 | 250 |
| 2 | 3,150 | 0 |
| 3 | 760 | blank |
| 4 | 1,840 + 3,150 + 760 = 5,750 | 1,750 |
| 5 | 2,700 | blank |
| 6 | 3,050 | blank |
| 7 | 1,350 | 1,350 |
| 8 | 4,400 | 400 |
| 9 | No: 14 | Yes: 4 |

## The lines that take FTB 3803 amounts

| Line | Value | Check |
| --- | --- | --- |
| Form 8814 line 6 (Lucia) | 2,450 | 1,240 + 3,150 + 760 − 2,700; Noor's line 4 is under 2,700 |
| Schedule CA line 8z col C | 600 | 3,050 − 2,450 |
| Schedule CA line 9a col C, line 10 col C, line 27 col C | 600 | only line 8z has a column C amount |
| Form 540 line 16 | 600 | Schedule CA line 27 col C |
| Form 540 line 17 | 171,450 | 170,850 + 600 |
| Form 540 line 19 | 160,038 | 171,450 − 11,412 |
| Form 540 line 31 | 7,779 | Schedule Y: 6,403.94 + 9.3% × 14,590 = 7,760.81 → 7,761; plus 14 + 4 |
