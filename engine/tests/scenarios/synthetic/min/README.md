# min — an S corporation K-1 with a section 199A statement (synthetic)

Min and Thom Farshaw are married, file jointly and live in Spokane, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Min has one large W-2. She also owns 25% of an S corporation, Baerlon Bindery, and runs its restoration shop on weekends (material participation). Its K-1 shows a small box 1 income and the box 17 code V statement, so Form 8995 takes the corporation as one business. Thom took $3,000 out of his traditional IRA at 41 (code 1, no exception: the 10% additional tax goes on Schedule 2 line 8 with no Form 5329) and paid student loan interest. Min had jury duty pay. No dependents, standard deduction. The return is federal only: Washington has no income tax.

Forms that file: Form 1040, Schedules 1, 2 and E, Form 8995.

No input documents. The K-1 has no fake PDF yet: the engine has no K-1 document generator, so the facts are the boxes and the statement as Schedule K-1 (Form 1120-S) would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Caemlyn Analytics LLC (Min) | box 1 $148,000; box 2 $17,900; boxes 3 and 5 $152,000; box 12 D $4,000 |
| 1099-R, Two Rivers Credit Union (Thom's IRA) | boxes 1 and 2a $3,000; box 4 $300; code 1 |
| 1098-E, Tar Valon Student Lending (Thom) | box 1 $1,850 |
| Jury duty pay (Min) | $640 |
| Schedule K-1 (Form 1120-S), Baerlon Bindery, Inc. (Min) | box 1 $3,200; box 17 code V: QBI $3,200, W-2 wages $21,000, UBIA $9,500, not a specified service |
| Holding answers | Min's K-1; she materially participated |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Sch E line 28 A (a), (b), (d), (k) | name, "S", EIN; box 1 nonpassive (irs-1120sk1-inst-2025::sec::income-loss::b01) | Baerlon Bindery, Inc.; S; 00-0001121; 3,200 |
| Sch E lines 27, 29a (k), 30, 32, 41 | no prior-year loss; totals | No; 3,200 each |
| Sch 1 lines 5, 8h, 9, 10 | Schedule E line 41; jury duty pay | 3,200; 640; 640; 3,840 |
| Sch 1 line 21 | 1,850 (at most $2,500); worksheet line 4 is 154,840, under $170,000 (irs-1040-inst-2025::sec::line-24e::b02) | 1,850 |
| 1040 lines 1a, 4a, 4b | W-2 box 1; the IRA distribution | 148,000; 3,000; 3,000 |
| 1040 lines 8, 9, 10, 11 | 148,000 + 3,000 + 3,840; less 1,850 | 3,840; 154,840; 1,850; 152,990 |
| Form 8995 line 1 i | the statement's business: name, the corporation's EIN, its QBI (box-17-other-information::b11, ::b12) | Baerlon Bindery, Inc.; 00-0001121; 3,200 |
| Form 8995 lines 2, 4, 5, 10 | 3,200; 20% | 3,200; 640 |
| Form 8995 lines 11, 13, 14, 15 | 152,990 − 31,500; no qualified dividends or gains; 20%; the smaller | 121,490; 121,490; 24,298; 640 |
| 1040 lines 12e, 13a, 14, 15 | MFJ standard deduction; QBI deduction | 31,500; 640; 32,140; 120,850 |
| 1040 line 16 | Tax Computation Worksheet, MFJ: 2,385 + 8,772 + 22% × (120,850 − 96,950) | 16,415 |
| Sch 2 line 8 | 10% of 3,000, box checked: no Form 5329 for code 1 (irs-5329-inst-2025::sec::who-must-file::b01) | 300 |
| 1040 lines 23, 24 | 300; 16,415 + 300 | 300; 16,715 |
| 1040 lines 25a, 25b, 25d, 33 | W-2 box 2; 1099-R box 4 | 17,900; 300; 18,200; 18,200 |
| 1040 line 34 | 18,200 − 16,715 | 1,485 |

Taxable income before the QBI deduction is under the $394,600 threshold, so Form 8995 (not 8995-A) files, and the statement's W-2 wages and UBIA do not limit the deduction.
