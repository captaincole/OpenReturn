# morgan — synthetic, unverified

The Morgan family is made up. No filed return, benchmark case or IRS package stands behind it. The expected values are the engine's output, checked by hand against Form 8814, its 2025 instructions (`irs-8814-inst-2025`) and the 1040 instructions, then locked.

## The family

Avery and Riley Morgan file jointly and live in Round Rock, Texas, so there is no state return. Avery has one W-2. The couple has bank interest, fund dividends and one long-term stock sale. Their daughters Ellis (born 2011) and Wren (born 2015) have their own interest and dividends, and the parents elect to report both on Form 8814.

The daughters are under 17, so the return also claims the child tax credit on Schedule 8812. The engine supports it.

## What it covers

- Two copies of Form 8814, with box C checked on each.
- Ellis: interest, tax-exempt interest, ordinary and qualified dividends and capital gain distributions over $2,700. Lines 6 to 12 fill, and line 15 is the $135 maximum. The line 7 and 8 ratios round up at the third place.
- Wren: interest only, between $1,350 and $2,700. Lines 5 to 12 stay blank, and line 15 is 10% of line 14 ($73.50, rounded to $74).
- Schedule B files only because of Form 8814: the parents' own dividends ($1,240) are under $1,500, and Ellis's line 9 takes the total over it (`::line-9::b01`).
- Schedule D files, so Ellis's line 10 goes to Schedule D line 13 (`::line-10::b01`). Form 1040 line 7b still checks the child box and shows the amount (`irs-1040-inst-2025::sec::line-7b::b01`).

## Hand check of Form 8814

| Line | Ellis (copy 1) | Wren (copy 2) |
| --- | --- | --- |
| 1a | 1,237 | 2,085 |
| 1b | 318 | blank |
| 2a / 2b | 3,486 / 2,719 | blank |
| 3 | 897 | blank |
| 4 | 5,620 | 2,085 |
| 6 | 2,920 | blank |
| 7 | 2,719 / 5,620 = .484 | blank |
| 8 | 897 / 5,620 = .160 | blank |
| 9 | 2,920 × .484 = 1,413 | blank |
| 10 | 2,920 × .160 = 467 | blank |
| 11 | 1,880 | blank |
| 12 | 1,040 | blank |
| 14 | 4,270 | 735 |
| 15 | No: 135 | Yes: 74 |

The golden test checks only Ellis's copy: the engine evaluates the first copy of a form, and the other copies only render. Wren's amounts reach the return through Schedule 1, Schedule B and line 16, which the test checks.

## The lines that take Form 8814 amounts

- Form 1040 line 3a: 980 + 1,413 = 2,393. Line 3b: Schedule B line 6, 1,240 + 1,413 = 2,653. Line 3c boxes 1 and 2 are checked.
- Schedule D line 13: 215 + 467 = 682. Form 1040 line 7a: 6,957. Line 7b: the child box and 467.
- Schedule 1 line 8z: "Form 8814", 1,040.
- Form 1040 line 16: 16,039 (tax on 122,112, from the qualified dividends worksheet) + 135 + 74 = 16,248. Box 1 is checked.
