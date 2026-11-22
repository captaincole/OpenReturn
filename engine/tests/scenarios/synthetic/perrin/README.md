# perrin — a made-up couple who are both in school (synthetic)

Perrin and Marisol Quillfeather are married and file jointly. They live in El Paso, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Perrin is a part-time degree student who finished two years of college long ago. Nobody has claimed the American opportunity credit for him. In 2025 he took a summer course at a community college and a fall term at a university, and he paid the spring 2026 term in December 2025. A $1,200 scholarship is tax free. He bought $380 of books online. Marisol is an MBA student with a bachelor's degree, so she takes the lifetime learning credit. She dropped a course and got $250 back. Their MAGI, $171,500, is in the joint phase-out. They take the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders a filled Form 8863 with Parts I and II, and two Parts III: Perrin's page has two institutions, and Marisol's page is a second copy of page 2 (the golden PDF holds the first copy). The refundable part reaches Form 1040 line 29; the nonrefundable part reaches Schedule 3 line 3. The published examples that check the rules are unit tests (`tests/unit/federal/8863/`).

Forms that file: Form 1040, Schedule 3, Form 8863.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Franklin Ridge Logistics (Perrin) | box 1 $58,000, box 2 $4,100 |
| W-2, Tularosa Basin Medical Group (Marisol) | box 1 $113,500, box 2 $11,900 |
| 1098-T, Rio Grande Valley State University (Perrin), `docs/01-rio-grande-valley-1098-t.pdf` | box 1 $5,100, box 5 $1,200, boxes 7 and 8 checked |
| 1098-T, Sunland Park Community College (Perrin), `docs/02-sunland-park-1098-t.pdf` | box 1 $650 |
| 1098-T, Franklin Mountains School of Business (Marisol), `docs/03-franklin-mountains-1098-t.pdf` | box 1 $7,400, boxes 7, 8 and 9 checked |
| Perrin's answers | lines 23–26: No, Yes, No, No; summer $650; fall $3,100 + $380 books − $1,200 scholarship; spring 2026 $2,000 |
| Marisol's answers | lines 23–25: No, Yes, Yes; fall $4,200 − $250 refund; spring 2026 $3,450; 2024 Form 1098-T had box 7 checked |

The three Forms 1098-T are made by `generate-docs.ts` from the fact values (`tests/scenarios/documents/form1098T.ts`, the first generator of its type). The W-2s have no PDFs.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Perrin's worksheets | 650; 3,100 + 380 − 1,200 = 2,280; 2,000 | 4,930 |
| 8863 line 27 | smaller of 4,930 and $4,000 | 4,000 |
| 8863 lines 28, 29, 30 | 4,000 − 2,000; × 25%; 2,000 + 500 | 2,000; 500; 2,500 |
| Marisol's worksheets, line 31 | 4,200 − 250 + 3,450 (no course materials for this credit) | 7,400 |
| 8863 line 1 | Perrin's line 30 | 2,500 |
| 8863 lines 2, 3, 4, 5 | MFJ; 1040 line 11b; 180,000 − 171,500; MFJ | 180,000; 171,500; 8,500; 20,000 |
| 8863 line 6 | 8,500 ÷ 20,000 | 0.425 |
| 8863 line 7 | 2,500 × 0.425 = 1,062.50, nearest dollar | 1,063 |
| 8863 line 8 | 1,063 × 40% = 425.20 | 425 |
| 8863 line 9 | 1,063 − 425 | 638 |
| 8863 lines 10, 11, 12 | Marisol's line 31; smaller of 7,400 and $10,000; × 20% | 7,400; 7,400; 1,480 |
| 8863 lines 13–17 | as lines 2–6 | 180,000; 171,500; 8,500; 20,000; 0.425 |
| 8863 line 18 | 1,480 × 0.425 | 629 |
| Credit Limit Worksheet | line 3: 629 + 638; line 6: 20,628 − 0; line 7 the smaller | 1,267 |
| 8863 line 19, Schedule 3 lines 3 and 8 | worksheet line 7 | 1,267 |
| 1040 lines 1a, 1z, 9, 11a, 11b | 58,000 + 113,500 | 171,500 |
| 1040 line 12e, 14 | joint standard deduction | 31,500 |
| 1040 line 15 | 171,500 − 31,500 | 140,000 |
| 1040 line 16, 18 | Tax Computation Worksheet, MFJ: 140,000 × 22% − 10,172 | 20,628 |
| 1040 lines 20, 21 | Schedule 3 line 8 | 1,267 |
| 1040 lines 22, 24 | 20,628 − 1,267 | 19,361 |
| 1040 lines 25a, 25d | 4,100 + 11,900 | 16,000 |
| 1040 lines 29, 32 | 8863 line 8 | 425 |
| 1040 line 33 | 16,000 + 425 | 16,425 |
| 1040 line 37 | 19,361 − 16,425 | 2,936 |
