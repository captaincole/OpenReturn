# tam — a passive partner with income and investment items (synthetic)

Tam and Kari Thorne are married, file jointly and live in Amarillo, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Tam is a limited partner in Two Rivers Timber Fund LP and does not work in it, so its business income is passive income. The fund also passes through interest, dividends, a long-term gain and tax-exempt interest, pays a cash distribution, and gives a section 199A statement. Their modified AGI is over $250,000, so Form 8960 taxes the excess. The return is federal only: Texas has no income tax.

Forms that file: Form 1040, Schedules 1, 2, B, D and E, Forms 8959 (no tax), 8960 and 8995.

No input documents: the engine has no K-1 document generator, so the facts are the boxes as Schedule K-1 (Form 1065) would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Emond Field Milling Co. (Tam) | box 1 and 5 $240,000; box 2 $48,000 |
| Schedule K-1 (Form 1065), Two Rivers Timber Fund LP | limited partner; box 1 $40,000; box 5 $1,200; box 6a $3,000; box 6b $2,000; box 9a $6,000; box 18 code A $500; box 19 code A $20,000; box 20 code Z: QBI $40,000 |
| Holding answers | Tam's K-1; no material participation; all at risk; basis at the start $100,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Partner's basis worksheet lines 1, 4o, 7, 8a, 11a | start; boxes 1, 5, 6a, 9a and 18A (irs-1065k1-inst-2025::sec::line-4::b01); less box 19A (::line-8a::b01) | 100,000; 50,700; 150,700; 20,000; 130,700 (no loss to limit) |
| Sch E line 28 A (h) | box 1 income of a business he did not materially participate in (irs-1065k1-inst-2025::sec::income-loss::b01, item 2a) | 40,000 |
| Sch E lines 29a (h), 30, 32, 41 | | 40,000 |
| Form 8582 | passive income only, no passive deductions (irs-8582-inst-2025::sec::who-must-file::b01) | does not file |
| Sch B lines 1, 2, 4; 5, 6 | box 5 (irs-1065k1-inst-2025::sec::box-5-interest-income::b01); box 6a (::box-6a-ordinary-dividends::b01), the fund named as payer | 1,200; 3,000 |
| Sch D lines 12, 15, 16 | box 9a (::box-9a-net-long-term-capital-gain-loss::b01) | 6,000 |
| 1040 lines 1a, 2a, 2b, 3a, 3b, 7a, 8 | box 18A on 2a (::box-18-tax-exempt-income-and::b01); box 6b on 3a | 240,000; 500; 1,200; 2,000; 3,000; 6,000; 40,000 |
| 1040 lines 9, 11a | 240,000 + 1,200 + 3,000 + 6,000 + 40,000 | 290,200 |
| 1040 line 12e | 2025 joint standard deduction | 31,500 |
| 8995 lines 1(c), 2, 4, 5 | the statement's QBI, 20% | 40,000; 8,000 |
| 8995 lines 11 to 15 | 290,200 − 31,500; net capital gain 6,000 + 2,000; 258,700 − 8,000; 20%; the smaller | 258,700; 8,000; 250,700; 50,140; 8,000 |
| 1040 lines 13a, 14, 15 | | 8,000; 39,500; 250,700 |
| 1040 line 16 | Qualified Dividends and Capital Gain Tax Worksheet: ordinary 242,700 by the joint schedule (2,385 + 8,772 + 24,145 + 8,640 = 43,942) plus 8,000 at 15% (1,200) | 45,142 |
| 8960 lines 1, 2, 4a, 4c, 5a, 5d, 8, 12 | interest; dividends; Schedule 1 line 5, passive, so no line 4b adjustment (irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01); the gain | 1,200; 3,000; 40,000; 40,000; 6,000; 6,000; 50,200; 50,200 |
| 8960 lines 13 to 17 | MAGI; joint threshold; 290,200 − 250,000; the smaller; 3.8% | 290,200; 250,000; 40,200; 40,200; 1,528 |
| Sch 2 lines 12, 21; 1040 lines 23, 24 | | 1,528; 1,528; 1,528; 46,670 |
| 1040 lines 25a, 34, 35a | 48,000 − 46,670 | 48,000; 1,330; 1,330 |
