# varilin — a made-up holder of tax credit bonds (synthetic)

Varilin Ostrander is single and lives in Abilene, Texas. Every name, number and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

He has one W-2 and holds four tax credit bonds:

- a qualified school construction bond at a broker, whose credit a Form 1097-BTC reports;
- a clean renewable energy bond the cooperative issued, with its own Form 1097-BTC;
- a qualified energy conservation bond held directly, which matured on July 23, 2025, and that no form reports;
- a build America bond held directly, with no Form 1097-BTC; its paying agent's Form 1099-INT holds the cash interest and the credit.

He also carries $275 of unused 2024 credit forward. A world index fund pays dividends with $95 of foreign tax (Schedule 3 line 1, by the election).

Form 8912 files with Parts I to IV. Part III has two rows. Part IV has two copies: the QECB (copy 1, prorated for the maturity, 70% on line 20) and the BAB (copy 2, rendered only outside the golden). Line 12 reaches Schedule 3 line 6k. The QECB credit is interest no information return reports, so it is a Schedule B line 1 row. The published examples are unit tests (`tests/unit/federal/8912/`).

Forms checked: Form 8912, Schedule B, Schedule 3, Form 1040.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Callahan Plains Water Engineering | box 1 $168,000, box 2 $26,500 |
| Form 1097-BTC, Brazos Ridge Securities (docs/01) | box 1 $1,420.36, box 2a C, box 2b 99999QSB4, box 3 199 |
| Form 1097-BTC, Red River Electric Cooperative (docs/02) | box 1 $612.48, box 2a A, box 3 101; not from a pass-through entity |
| Form 1099-INT, Brazos Ridge Securities (docs/03) | box 1 $1,420.36 (the QSCB credit) |
| Form 1099-INT, Red River Electric Cooperative (docs/04) | box 1 $612.48 (the CREB credit) |
| Form 1099-INT, Lakeview Unified Water District (docs/05) | box 1 $4,320: $3,200 cash interest + $1,120 BAB credit |
| QECB, Pinecrest County Energy Authority (his records) | issued 05/01/2012, matured 07/23/2025, $50,000, rate 4.78%; on no Form 1099-INT |
| BAB, Lakeview Unified Water District (his records) | interest payable $1,600 on 04/01 and $1,600 on 10/01; on the Form 1099-INT |
| Carryforward from 2024 | $275 |
| 1099-DIV, Caprock World Index Fund | box 1a $1,300, box 1b $1,100, box 7 $95 |

## Input documents

`generate-docs.ts` makes the two Forms 1097-BTC (`documents/form1097Btc.ts`, the first document of its type) and the three Forms 1099-INT (`documents/form1099Int.ts`) from the facts' values.

### Compared with real examples

- [Form 1097-BTC, Rev. April 2025, Copy B](https://www.irs.gov/pub/irs-pdf/f1097btc.pdf): the same boxes in the same places: the issuer, its TIN and the recipient's on the left, the "Form 1097-BTC issuer is" checkboxes, boxes 1, 2a, 2b, 3, the shaded box 4, 5a to 5l and 6 on the right. Added after the comparison: the issuer checkbox and box 6, and the title on two lines.
- [Form 1097-BTC for 2012, Copy B](https://www.irs.gov/pub/irs-prior/f1097btc--2012.pdf): the same layout; it names the TINs "federal identification number". Nothing changed.
- [Instructions for Form 1097-BTC (04/2025)](https://www.irs.gov/instructions/i1097btc) and the Instructions for Recipient on the form: box 2a codes C, A and O; box 3 codes 101 and 199; box 1 only on the annual statement; for an NCREB or QECB, box 1 is after the 70%. The recipient's TIN may show the last four digits only, as ours does.

Every fact the engine reads is on the document: the issuer's name and TIN (Part III columns (a) and (b1)), box 2b (column (b2)), box 1 (column (c)) and box 3 (the CREB test). The pass-through answer is Varilin's, not printed.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8912 line 13 rows 1, 2 (c) | box 1 of each Form 1097-BTC, rounded | 1,420; 612 |
| 8912 line 14, line 1 | 1,420.36 + 612.48 = 2,032.84, rounded once (a document sum) | 2,033 |
| QECB line 18 (b), (c), (d) | $50,000 × 4.78% | 50,000; 4.78%; 2,390 |
| QECB line 18 (e) | March 15 25 + June 15 25 + 38/92 = 0.413 × 25 = 10 for September 15 | 60 |
| QECB line 18 (f), line 19 | 2,390 × 60% | 1,434 |
| QECB line 20 | QECB: 1,434 × 70% = 1,003.80 | 1,004 |
| BAB line 18 (b) to (f), each row | 1,600 × 35% = 560, × 100% | 560; 560 |
| BAB line 19, line 20 | 560 + 560; a BAB takes line 19 | 1,120 |
| 8912 line 2 | 1,004 + 1,120 | 2,124 |
| 8912 line 3 | the carryforward | 275 |
| 8912 line 4 | 2,033 + 2,124 + 275 | 4,432 |
| 8912 line 7 | 1040 line 16 + Schedule 2 line 1z (none) | 31,366 |
| 8912 line 8 | no Form 6251 | blank |
| 8912 line 9 | 31,366 + 0 | 31,366 |
| 8912 line 10a, 10e | Schedule 3 line 1 | 95 |
| 8912 line 11 | 31,366 − 95 | 31,271 |
| 8912 line 12, Schedule 3 line 6k, 7 | smaller of 4,432 and 31,271; no pass-through CREB | 4,432 |
| Schedule 3 line 8 | 95 + 4,432 | 4,527 |
| Schedule B line 1 rows | 1,420; 612; 4,320; and the QECB credit, 1,004 | |
| Schedule B line 2, 4; 1040 line 2b | 1,420.36 + 612.48 + 4,320 + 1,004 = 7,356.84 | 7,357 |
| 1040 line 3a, 3b | the fund's dividends | 1,100; 1,300 |
| 1040 line 9, 11a | 168,000 + 7,357 + 1,300 | 176,657 |
| 1040 line 12e, 15 | single standard deduction 15,750 | 160,907 |
| 1040 line 16 | QDCG worksheet: 159,807 × 24% − 7,153 = 31,200.68, + 1,100 × 15% = 165 | 31,366 |
| 1040 line 20, 21 | Schedule 3 line 8 | 4,527 |
| 1040 line 22, 24 | 31,366 − 4,527 | 26,839 |
| 1040 line 25a, 33 | W-2 box 2 | 26,500 |
| 1040 line 37 | 26,839 − 26,500 | 339 |

The Part III rows print 1,420 and 612 (2,032), and line 14 prints 2,033: line 14 keeps the cents until the total, as the IRS rule for a document sum says.
