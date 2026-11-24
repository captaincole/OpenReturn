# thom — foreign taxes on a beneficiary's K-1 (synthetic)

Thom Merrilin is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

He has a W-2 from the theater where he works. He is a beneficiary of a family trust. Its Schedule K-1 (Form 1041) shows interest, ordinary dividends (part of them qualified) and box 14 code B foreign taxes of $640 on the trust's Canadian shares. The trustee's statement gives the foreign-source dividends behind the tax: $5,200, of which $4,100 are qualified. No dependents, standard deduction. The return is federal only: Nevada has no income tax.

A K-1 (Form 1041) is a qualified payee statement (`irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02`), but $640 is over the $300 single limit, so the election does not apply and Form 1116 files, passive category, with the trust as its one source. `mat` covers a trust K-1 with no foreign tax; the election case (a small foreign tax, no Form 1116) is an integration test (`tests/integration/passThroughK1.test.ts`).

Forms that file: Form 1040, Schedules B and 3, Form 1116.

No input documents. The engine has no K-1 document generator, so the facts are the boxes and the statement as the K-1 and the trustee would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Truth Street Playhouse Inc. | box 1 $152,000; box 2 $27,500; boxes 3 and 5 $160,000; box 12 D $8,000 |
| Schedule K-1 (Form 1041), Owyn Family Trust | box 1 $1,600; box 2a $8,400; box 2b $6,300; box 14 code B $640 |
| Trustee's foreign income statement | foreign-source dividends $5,200, qualified $4,100; Canada |
| Holding answers | Thom's K-1 |
| Prior year | no foreign tax carryover; no foreign or domestic loss account |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Sch B lines 1, 2, 4 | the trust as payer (irs-1041k1-inst-2025::sec::box-1-interest-income::b01) | Owyn Family Trust 1,600; 1,600 |
| Sch B lines 5, 6 | box 2a (box-2a-ordinary-dividends::b01) | Owyn Family Trust 8,400; 8,400 |
| Sch B lines 7a, 8 | Part III is required over $1,500; a U.S. trust | No; No |
| 1040 lines 1a, 1z | W-2 box 1 | 152,000 |
| 1040 lines 2b, 3a, 3b | Schedule B line 4; box 2b; Schedule B line 6 | 1,600; 6,300; 8,400 |
| 1040 lines 9, 11a, 11b | 152,000 + 1,600 + 8,400 | 162,000 |
| 1040 lines 12e, 14, 15 | single standard deduction; 162,000 − 15,750 | 15,750; 15,750; 146,250 |
| 1040 line 16 | QDCG worksheet: line 5 is 146,250 − 6,300 = 139,950, above the $48,350 0% limit, so 15% × 6,300 = 945; tax on 139,950 is 24% × 139,950 − 7,153 = 26,435; 945 + 26,435 = 27,380, less than the tax on 146,250 (27,947) | 27,380 |
| 1116 line i, column (l) | the statement's country; a K-1 reports the tax in U.S. dollars, a "similar statement" (irs-1116-inst-2025::sec::part-ii-foreign-taxes-paid-or::b04) | Canada; 1099 taxes |
| 1116 line 1a | 5,200, not adjusted: foreign qualified dividends are under $20,000 and QDCG line 5 is below the 37% bracket, the adjustment exception (individuals-who-completed-a-qualified-dividends::b01) | 5,200 |
| 1116 lines 3a, 3c | the standard deduction; no line 3b deductions | 15,750 |
| 1116 lines 3d, 3e | the column's gross; 1040 lines 1z + 2b + 3b | 5,200; 162,000 |
| 1116 lines 3f, 3g | 5,200 / 162,000 = 0.0321 (four places); 15,750 × 0.0321 | 0.0321; 506 |
| 1116 lines 4a, 6, 7 | no interest to apportion; 506; 5,200 − 506 | blank; 506; 4,694 |
| 1116 Part II (q), (u); lines 8, 9, 11, 14 | box 14 code B; no carryover, no reduction | 640 |
| 1116 line 13 | not high-taxed: 640 is under 37% × (5,200 − 506) = 1,737 | blank |
| 1116 lines 15, 17, 18 | line 7; no line 16 adjustment; 1040 line 11b − line 14 | 4,694; 4,694; 146,250 |
| 1116 lines 19, 20, 21 | 4,694 / 146,250 = 0.0321; 1040 line 16; 27,380 × 0.0321 | 0.0321; 27,380; 879 |
| 1116 lines 23, 24 | 879; the smaller of 640 and 879 | 879; 640 |
| 1116 lines 27, 32, 33, 35 | passive category credit; the smaller of 640 and 27,380 | 640 |
| Sch 3 lines 1, 8 | Form 1116 line 35 | 640 |
| 1040 lines 20, 21, 22, 24 | Schedule 3 line 8; 27,380 − 640 | 640; 640; 26,740; 26,740 |
| 1040 lines 25a, 25d, 33 | W-2 box 2 | 27,500 |
| 1040 lines 34, 35a | 27,500 − 26,740 | 760 |

Modified AGI is $162,000, under the $200,000 single threshold, so Form 8960 does not file. The golden PDF of Form 1116 is its one copy.
