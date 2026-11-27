# ghealdan — a made-up couple who claim the EIC again with no child (synthetic)

Corin and Nessa Abelard are married, file jointly and live in Elko, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Both work (two W-2s, $15,500 together). They have no children. The IRS disallowed their 2023 EIC: Corin reported side-job wages wrong and lived abroad most of that year. No child was on the 2023 Schedule EIC, so the exception for a denial only for a child does not apply. No ban. In 2025 Corin's main home was in the United States all year, Nessa's 300 days. They claim the EIC without a qualifying child, so the return attaches Form 8862 with Part II, Section B. The return is federal only: Nevada has no income tax.

The sister scenario `lini` fills Section A and Parts III and IV.

Forms that file: Form 1040, Form 8862.

## Inputs

| Input | Values |
| --- | --- |
| W-2, Ruby Valley Feed and Tack (Corin) | box 1 $9,000, box 2 $180 |
| W-2, Lamoille Canyon Lodge (Nessa) | box 1 $6,500, box 2 $95 |
| Dates of birth | Corin 07/21/1994, Nessa 11/03/1997 |
| EIC answers | not nonresidents, main home in the United States, denied in an earlier year, no ban |
| Form 8862 answers | not only for a child; line 3 No; line 9a 365, line 9b 300 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8862 line 2 | the EIC only | EIC checked |
| 8862 line 3 | wages and residency, not only income | No |
| 8862 line 4 | a joint return: no one's qualifying child | No |
| 8862 lines 5–8 | Section A, skipped | blank |
| 8862 lines 9a, 9b | stated days | 365; 300 |
| 8862 lines 10a, 10b | 2025 − 1994; 2025 − 1997 | 31; 28 |
| 8862 lines 11a, 11b | a joint return: no one's dependent | No; No |
| 8862 Parts III, IV | not claimed | blank |
| 1040 line 1a, 9, 11b | 9,000 + 6,500 | 15,500 |
| 1040 line 12e, 14 | joint standard deduction | 31,500 |
| 1040 lines 15, 16, 24 | 15,500 − 31,500 is below 0 | 0 |
| 1040 line 25a, 25d | 180 + 95 | 275 |
| 1040 line 27a, 32 | EIC table, joint, no child, 15,500 (under 17,730: no second lookup) | 649 |
| 1040 lines 33–35a | 275 + 649 | 924 |
