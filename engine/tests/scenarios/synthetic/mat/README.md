# mat — a beneficiary's K-1 from a family trust (synthetic)

Mat and Leilwin Damodred are married, file jointly and live in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Each has a W-2, and their joint savings account paid a little interest. Leilwin is a beneficiary of her family's trust. Its Schedule K-1 (Form 1041) shows interest, ordinary dividends (part of them qualified), a net long-term capital gain, and the box 14 code I statement with section 199A (REIT) dividends. No foreign tax and no box 14 code H. No dependents, standard deduction. The return is federal only: Texas has no income tax.

The trust's items join the couple's own lines. None of them goes on Schedule E: Part III takes only boxes 5 to 8, so Schedule E does not file.

Forms that file: Form 1040, Schedules B and D, Form 8995.

One made input document: `docs/01-schedule-k1-shandalle-family-trust.pdf`, Leilwin's Schedule K-1 (Form 1041) with the box 14 code I statement (section 199A dividends) on its second page, from `generate-docs.ts` with the same fact object `facts.ts` uses. The fiduciary's name and address and Leilwin's masked number are made up for the page. The two W-2s and the 1099-INT have no PDF: their facts are the boxes as they would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Ebou Dar Logistics LLC (Mat) | box 1 $118,000; box 2 $17,500; boxes 3 and 5 $124,000; box 12 D $6,000 |
| W-2, Tanchico Harbor Engineering Inc. (Leilwin) | box 1 $92,000; box 2 $12,800; boxes 3 and 5 $96,000; box 12 D $4,000 |
| 1099-INT, Hinderstap Savings Bank (joint) | box 1 $420 |
| Schedule K-1 (Form 1041), Shandalle Family Trust (Leilwin) | box 1 $1,850; box 2a $3,600; box 2b $2,900; box 4a $5,400; box 14 code I: section 199A dividends $480 |
| Holding answers | Leilwin's K-1 |

The $480 of section 199A dividends is part of box 2a and not part of box 2b: REIT dividends are not qualified dividends.

## Hand check

The block ids are after `irs-1041k1-inst-2025::sec::` unless another document is named.

| Line | Rule | Value |
| --- | --- | --- |
| Sch B line 1 | each payer's name and amount (irs-1040sb-inst-2025::sec::line-1::b01); box 1 goes on Schedule B line 1 (box-1-interest-income::b01) | Hinderstap Savings Bank 420; Shandalle Family Trust 1,850 |
| Sch B lines 2, 4 | 420 + 1,850; no savings bond exclusion | 2,270 |
| Sch B lines 5, 6 | box 2a goes on line 5 (box-2a-ordinary-dividends::b01) | Shandalle Family Trust 3,600; 3,600 |
| Sch B lines 7a, 8 | Part III is required: line 4 and line 6 are over $1,500 (irs-1040sb-inst-2025::sec::general-instructions::b01); a U.S. trust is not a foreign trust | No; No |
| Sch D line 12 | box 4a (boxes-3-and-4a-net-short-term-and-net::b01) | 5,400 |
| Sch D lines 7, 15, 16 | no short-term items; 5,400 | 0; 5,400; 5,400 |
| Sch D lines 17, 20 | both gains: Yes; lines 18 and 19 blank, no Form 4952: Yes | Yes; Yes |
| 1040 lines 1a, 1z | 118,000 + 92,000 | 210,000 |
| 1040 line 2b | Schedule B line 4 | 2,270 |
| 1040 line 3a | box 2b (box-2b-qualified-dividends::b01) | 2,900 |
| 1040 line 3b | Schedule B line 6 | 3,600 |
| 1040 line 7a | Schedule D line 16 | 5,400 |
| 1040 lines 9, 11 | 210,000 + 2,270 + 3,600 + 5,400 | 221,270 |
| 1040 line 12e | MFJ standard deduction | 31,500 |
| Form 8995 lines 6, 8, 9 | the statement's section 199A dividends (box-14-other-information::b05); 20% | 480; 480; 96 |
| Form 8995 line 10 | no QBI from a business; line 9 | 96 |
| Form 8995 line 11 | 221,270 − 31,500 | 189,770 |
| Form 8995 line 12 | qualified dividends plus the smaller of Schedule D lines 15 and 16 (irs-8995-inst-2025::sec::line-12::b01): 2,900 + 5,400 | 8,300 |
| Form 8995 lines 13, 14, 15 | 189,770 − 8,300; 20%; the smaller of lines 10 and 14 | 181,470; 36,294; 96 |
| 1040 lines 13a, 14, 15 | QBI deduction; 31,500 + 96; 221,270 − 31,596 | 96; 31,596; 189,674 |
| 1040 line 16 | Qualified Dividends and Capital Gain Tax Worksheet, MFJ: line 5 is 189,674 − 8,300 = 181,374, all of the 8,300 is above the $96,700 0% limit, so 15% × 8,300 = 1,245; tax on 181,374 by the Tax Computation Worksheet is 22% × 181,374 − 10,172 = 29,730; the sum 30,975 is less than the tax on 189,674 (31,556) | 30,975 |
| 1040 lines 22, 24 | no credits, no other taxes | 30,975 |
| 1040 lines 25a, 25d, 33 | 17,500 + 12,800 | 30,300 |
| 1040 line 37 | 30,975 − 30,300 | 675 |

Taxable income before the QBI deduction is under the $394,600 threshold, so Form 8995 (not 8995-A) files. Modified AGI is $221,270, under the $250,000 joint threshold, so Form 8960 does not file. The amount owed is under $1,000, so Form 2210 does not file.
