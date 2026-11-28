# nieda — a made-up short line railroad owner with a track maintenance credit (synthetic)

Nieda Kesterholt is single and lives in Amarillo, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Nieda owns Caprock Short Line Railroad, a Class III railroad she runs as a sole proprietorship (Schedule C). In 2025 it spends $412,500.40 on maintaining and rebuilding its track. It deducts $202,500.40 as repairs and capitalizes $210,000 as rebuilt track between mileposts 12 and 19, a 7-year asset placed in service in August. She elects out of the special depreciation allowance. The railroad owns 52.5 miles of track, assigns 8 miles to a grain shipper for the credit, and a connecting railroad assigns it 2.25 miles. Nieda also owns 25% of an S corporation grain terminal on the line. Its Schedule K-1 (Form 1120-S) reports ordinary income in box 1 and a track maintenance credit in box 13 code AJ. She takes the standard deduction and paid four estimated tax payments. The return is federal only: Texas has no income tax.

The scenario fills every line of Form 8900:

- Line 1 is the expenditures, rounded once; line 2 is 40% of it.
- Lines 3a to 3d are the miles: owned, less assigned to others, plus assigned to her.
- Line 4 is line 3d times $3,500, and it is smaller than line 2, so it is line 5.
- Line 6 is the K-1 credit, and line 7 goes to Form 3800 Part III line 4g, a specified credit.
- Line 5 lowers the basis of the rebuilt track on Form 4562. The deducted repairs do not change.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 4562, 8900, 8959 and 8995-A. Form 6251 does not file: line 4g is a specified credit, so Form 3800 needs no tentative minimum tax.

## Inputs

| Input | Amounts |
| --- | --- |
| Railroad (Schedule C), Caprock Short Line Railroad | receipts $3,400,000; wages $1,250,000; repairs $262,500.40; supplies $85,000; taxes $95,000; insurance $140,000; utilities $30,000; prior-year MACRS $180,000 |
| Rebuilt track (2025 asset) | cost $210,000; 7-year, 200% DB, half-year; placed in service 08/18/2025; elected out of the special allowance |
| Track maintenance | expenditures $412,500.40, of which $210,000 capitalized in the rebuilt track; miles owned 52.5, assigned to others 8, assigned to her 2.25 |
| K-1, Llano Grain Terminal, Inc. (00-0008900) | box 1 $48,000; box 13 AJ $2,450 |
| Estimated tax payments | 4 × $90,000 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1120-S) generator. The expenditures, the miles and the assignments are stated answers from the railroad's books and its assignment statements: no official form holds them.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8900 line 1 | 412,500.40, rounded | 412,500 |
| 8900 line 2 | 40% × 412,500 | 165,000 |
| 8900 lines 3a, 3b, 3c, 3d | 52.5 − 8 + 2.25 | 52.5; 8; 2.25; 46.75 |
| 8900 line 4 | 46.75 × 3,500 | 163,625 |
| 8900 line 5 | smaller of 165,000 and 163,625 | 163,625 |
| 8900 line 6 | K-1 code AJ | 2,450 |
| 8900 line 7 | 163,625 + 2,450 | 166,075 |
| Form 4562 line 19c basis | 210,000 − 163,625 (the credit, under the $210,000 capitalized) | 46,375 |
| Form 4562 line 19c, 22 | 46,375 ÷ 7 years × 2 × half-year = 6,625 (the engine's formula; the IRS table's 14.29% gives 6,627); plus 180,000 | 6,625; 186,625 |
| Schedule C line 21 | the deducted repairs, not reduced | 262,500 |
| Schedule C line 28, 31 | 2,049,125; 3,400,000 − 2,049,125 | 2,049,125; 1,350,875 |
| Schedule SE line 4a, 12, 13 | 1,350,875 × 92.35%; 21,836 + 36,178; half | 1,247,533; 58,014; 29,007 |
| 1040 line 9, 11a | 1,350,875 + 48,000; less 29,007 | 1,398,875; 1,369,868 |
| 1040 line 13a | 20% × (1,350,875 − 29,007) = 264,373.60 | 264,374 |
| 1040 line 15 | 1,369,868 − 15,750 − 264,374 | 1,089,744 |
| 1040 line 16 | 188,769.75 + 37% × (1,089,744 − 626,350) = 360,225.53 | 360,226 |
| Form 3800 line 4g (a), (e) | two items: the railroad and the K-1 | 2; 166,075 |
| Form 3800 line 13 | 25% × (360,226 − 25,000) = 83,806.50 | 83,807 |
| Form 3800 line 27, 37, 38 | 360,226 − 83,807; smaller of 276,419 and 166,075 | 276,419; 166,075; 166,075 |
| Schedule 3 line 6a, 8; 1040 line 20 | Form 3800 line 38 | 166,075 |
| 1040 line 22 | 360,226 − 166,075 | 194,151 |
| 1040 line 23 | SE tax 58,014 + Additional Medicare Tax 0.9% × (1,247,533 − 200,000) = 9,428 | 67,442 |
| 1040 line 24, 33, 34 | 194,151 + 67,442; payments 360,000; refund | 261,593; 360,000; 98,407 |

Form 3800 applies the whole credit: the K-1's $2,450 (Part V line 1) and the railroad's $163,625 (Part V line 2).
