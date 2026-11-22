# gawyn — a made-up couple, each paid as a contractor (synthetic)

Gawyn and Mireille Ashcombe are married, file jointly, and live in Sacramento, California all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Gawyn is a glazier with a W-2. A builder also paid him cash for weekend site work; he filed Form SS-8 and has no reply (code G). A home-care agency paid Mireille on a 1099-NEC; an SS-8 letter says she was its employee (code A). Each spouse files a Form 8919. Form 1040 line 1g and Schedule 2 line 6 add both forms, and Schedule CA (540) line 1g copies line 1g. There are no input documents: the facts are the boxes and their answers.

The golden PDF holds the first copy (Gawyn). The second copy (Mireille) is checked in the unit tests (`tests/unit/federal/8919/form.test.ts`).

Forms that file: Form 1040, Schedule 2, Form 8919 (two copies), Form 540, Schedule CA (540).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Capitol Glass Works (Gawyn) | box 1, 3, 5, 16 $62,000; box 2 $5,000; box 17 $2,100 |
| 1099-NEC, Sierra Foothill Home Care (Mireille) | box 1 $24,500 (named by her firm) |
| Form 8919 firm, Gawyn | Delta Ridge Builders, code G, $18,000 |
| Form 8919 firm, Mireille | Sierra Foothill Home Care, code A (05/20/2025), $24,500 |

## Hand check

| Line | Rule | Gawyn | Mireille |
| --- | --- | --- | --- |
| 8919 line 6 | the firm | 18,000 | 24,500 |
| 8919 line 8 | own W-2 boxes 3 and 7 | 62,000 | 0 |
| 8919 line 9 | 176,100 − line 8 | 114,100 | 176,100 |
| 8919 line 10 | smaller of 6 and 9 | 18,000 | 24,500 |
| 8919 line 11 | × 6.2% | 1,116 | 1,519 |
| 8919 line 12 | × 1.45% (355.25) | 261 | 355 |
| 8919 line 13 | 11 + 12 | 1,377 | 1,874 |

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 1g | 18,000 + 24,500 | 42,500 |
| 1040 line 1z, 11a | 62,000 + 42,500 | 104,500 |
| 1040 line 15, 16 | 104,500 − 31,500; MFJ table | 73,000; 8,286 |
| Schedule 2 line 6, 7, 21 | 1,377 + 1,874 | 3,251 |
| 1040 line 24, 37 | 8,286 + 3,251; − 5,000 | 11,537; 6,537 |
| Schedule CA line 1g column A | 1040 line 1g | 42,500 |
| Schedule CA line 1z column A | 62,000 + 42,500 | 104,500 |
| 540 line 13, 17 | federal AGI, no adjustments | 104,500 |
| 540 line 19 | 104,500 − 11,412 | 93,088 |
