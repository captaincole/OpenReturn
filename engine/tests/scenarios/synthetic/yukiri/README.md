# yukiri — one tax credit bond and no Schedule B (synthetic)

Yukiri Thornbury is single and lives in Spokane, Washington. Every name, number and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand, then locked (`verification: "unverified"`). The return is federal only: Washington has no income tax.

She has one W-2 and one qualified school construction bond, held all year. No Form 1097-BTC or 1099-INT reports its credit, so she adds the credit as interest herself (rule decision A64). It is her only interest and less than $1,500, so Schedule B does not file: Form 1040 line 2b takes the credit itself. The varilin scenario covers the other branch, with Schedule B.

Forms checked: Form 8912, Schedule 3, Form 1040. No input document: the bond's facts come from her own records.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Inland Empire Library Services | box 1 $58,000, box 2 $5,200 |
| QSCB, Cascade Valley School District No. 41 (her records) | issued 11/01/2010, matures 11/01/2027, $20,000, rate 4.55%, on no Form 1099-INT |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8912 line 18 (b), (c), (d) | $20,000 × 4.55% | 20,000; 4.55%; 910 |
| 8912 line 18 (e) | four credit allowance dates × 25% | 100 |
| 8912 line 18 (f), 19, 20, line 2, line 4 | 910 × 100%; a QSCB takes line 19 | 910 |
| 8912 line 7, 9, 11 | 1040 line 16; no AMT, no other credit | 4,943 |
| 8912 line 12, Schedule 3 line 6k, 7, 8 | smaller of 910 and 4,943 | 910 |
| 1040 line 2b | the credit, without Schedule B | 910 |
| 1040 line 9, 11a | 58,000 + 910 | 58,910 |
| 1040 line 15 | 58,910 − 15,750 | 43,160 |
| 1040 line 16 | tax table, 43,150–43,200 single: 1,192.50 + 12% × 31,250 | 4,943 |
| 1040 line 22, 24 | 4,943 − 910 | 4,033 |
| 1040 line 34, 35a | 5,200 − 4,033 | 1,167 |
