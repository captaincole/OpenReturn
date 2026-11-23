# faile — the election to claim the credit without Form 1116 (synthetic)

Faile Bashere is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is a data analyst. A global equity fund (a mutual fund: its 1099-DIV leaves box 8 blank) withheld $118.40 of foreign tax, and a broker's 1099-INT shows $31.20 of Canadian tax on bond interest. All her foreign income is passive, all of it is on 1099s, and the tax is not over $300. The election applies (`irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b01`, `b02`): no Form 1116 files, and Schedule 3 line 1 takes "the smaller of (a) your total foreign tax, or (b) your regular tax" (`b03`). She takes the standard deduction. The return is federal only: Texas has no income tax.

`rand` covers Form 1116 itself.

## Documents

`generate-docs.ts` makes the fund's 1099-DIV (`docs/01-1099-div-pecos.pdf`, fake data). The W-2 and the 1099-INT have no PDF.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 9, 11a | 72,000 + 780 + 4,200 | 76,980 |
| 1040 line 15 | 76,980 − 15,750 | 61,230 |
| 1040 line 16 | QDCG: tax on 58,130 (table) 7,702; 15% of 3,100 is 465 | 8,167 |
| Schedule 3 line 1 | 118.40 + 31.20 = 149.60, rounded; smaller than 8,167 | 150 |
| Schedule 3 line 8, 1040 lines 20, 21 | line 1 | 150 |
| 1040 line 22, 24 | 8,167 − 150 | 8,017 |
| 1040 line 37 | 8,017 − 6,900 | 1,117 |
