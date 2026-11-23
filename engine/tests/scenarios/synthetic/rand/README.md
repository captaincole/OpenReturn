# rand — two Forms 1116: passive and general (synthetic)

Rand Ostrander is single and lives in Seattle, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He is an optical engineer. His employer sent him to London for three months, and the UK taxed those wages: general category income. He also owns an international index fund (a mutual fund, so its 1099-DIV leaves box 8 blank and line i says "RIC"), Dutch shares, and Australian bonds: passive category income. His foreign tax is far over $300, so the election does not apply and Form 1116 files, one copy for each category. Foreign qualified dividends are over $20,000, so the adjustment exception does not apply: line 1a adjusts them and line 18 comes from the Worksheet for Line 18. He itemizes (mortgage, property tax, sales tax), so lines 3a and 4a take Schedule A amounts. The return is federal only: Washington has no income tax.

`faile` covers the election (Schedule 3 line 1 with no Form 1116).

## Documents

Made by `generate-docs.ts` from the fact values (fake data): the two 1099-DIVs (`docs/01-…`, `docs/03-…`) and the fund's foreign income statement (`docs/02-…`). The 1099-DIV fact does not hold box 8: the Netherlands is in the Northgate statement fact. The W-2, the 1099-INTs and the Form 1098 have no PDF.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 15 | 224,085 − 27,535 itemized | 196,550 |
| 1040 line 16 | QDCG: tax on 168,245 is 33,226; 15% of 28,305 is 4,246 | 37,472 |
| 1116 line 3a | Schedule A line 4 (0) + line 5e | 9,555 |
| 1116 line 3b | Schedule 1 line 26 (early withdrawal penalty) | 85 |
| 1116 line 3e | 185,000 + 6,140 + 31,790 + 1,240 | 224,170 |
| General col. A 3f, 3g, 4a | 42,500 / 224,170 = 0.1896; 9,640 × 0.1896; 16,480 × 0.1896 | 0.1896, 1,828, 3,125 |
| General line 7 | 42,500 − 4,953 | 37,547 |
| General line 8, 14 | UK tax | 9,860 |
| Line 18 | Worksheet: 196,550 − 28,305 × 0.5946 (16,830) | 179,720 |
| General line 19, 21 | 37,547 / 179,720 = 0.2089; × 37,472 | 0.2089, 7,828 |
| General line 24 | smaller of 9,860 and 7,828 | 7,828 |
| Passive col. A 1a | 26,880.25 − 21,412.60 + 21,412.60 × 0.4054 | 14,148 |
| Passive col. B 1a | 3,150 × 0.4054 | 1,277 |
| Passive col. C 1a | interest, not adjusted | 4,280 |
| Passive line 6 | (1,156 + 1,976) + (136 + 232) + (184 + 315) | 3,999 |
| Passive line 7 | 19,705 − 3,999 | 15,706 |
| Passive line 8, 10, 14 | 2,437 + 473 + 428; carryover 310 | 3,338; 310; 3,648 |
| Passive line 19, 21, 24 | 15,706 / 179,720 = 0.0874; × 37,472; smaller of 3,648 | 0.0874, 3,275, 3,275 |
| Part IV lines 27, 28, 32, 33, 35 | on the general copy (the larger line 24) | 3,275; 7,828; 11,103 |
| Schedule 3 lines 1, 8 | Form 1116 line 35 | 11,103 |
| 1040 lines 20, 21 | Schedule 3 line 8 | 11,103 |
| 1040 line 22 | 37,472 − 11,103 | 26,369 |

Line 20 leaves out the net investment income tax (Form 8960, 915): it is not regular tax (`irs-1116-inst-2025::sec::line-20::b01`). The golden PDF of Form 1116 is copy 0, the general copy; the passive copy renders after it.
