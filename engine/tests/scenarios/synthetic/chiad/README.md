# chiad — a made-up home seller on installments (synthetic)

Chiad Marrowby is single and lives in Sarasota, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has one W-2 and two installment sales of capital assets in 2025, so she files two Forms 6252. She takes the standard deduction. The return is federal only: Florida has no income tax.

- Her main home, sold in April 2025. She excludes $250,000 of gain (line 15). The buyer took over her $500,000 mortgage, which is more than her installment sale basis (lines 17 and 20).
- A sculpture bought in January 2025 and sold in October 2025: a short-term gain (Schedule D line 4).

This scenario covers what `bain` cannot: the year of sale (line 20), a main home's excluded gain (line 15), and Schedule D lines 4 and 11 from Form 6252. The interest on her two notes is left out: it goes on Schedule B, not Form 6252.

Forms that file: Form 1040, Schedules 2 and D, Forms 6252 (two copies) and 8960.

## Input documents

None. The facts come from the sales contracts, the closing statement and the Pub. 523 worksheet. The W-2 has no PDF.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Home 6252 lines 5–8, 10, 11 | stated | 1,200,000; 500,000; 700,000; 400,000; 400,000; 60,000 |
| Home lines 13, 14 | 400,000 + 60,000; 1,200,000 − 460,000 | 460,000; 740,000 |
| Home lines 15, 16 | excluded gain; 740,000 − 250,000 | 250,000; 490,000 |
| Home lines 17, 18 | 500,000 − 460,000; 700,000 + 40,000 | 40,000; 740,000 |
| Home line 19 | 490,000 ÷ 740,000 = 0.66216 | 0.6622 |
| Home lines 20, 21, 22 | the year of sale: line 17; stated; sum | 40,000; 200,000; 240,000 |
| Home line 24, 26 | 240,000 × 0.6622 | 158,928 |
| Sculpture lines 13, 14, 19 | 60,000 + 4,500; 90,000 − 64,500; 25,500 ÷ 90,000 | 64,500; 25,500; 0.2833 |
| Sculpture line 24, 26 | 30,000 × 0.2833 | 8,499 |
| Schedule D line 4, 7 | the sculpture, held 1 year or less | 8,499 |
| Schedule D line 11, 15 | the home, held more than 1 year | 158,928 |
| Schedule D line 16; 1040 line 7a | 8,499 + 158,928 | 167,427 |
| 1040 line 9, 11a | 72,000 + 167,427 | 239,427 |
| 1040 line 15 | 239,427 − 15,750 | 223,677 |
| 1040 line 16 | QDCG worksheet: tax on 64,749 (9,154) + 15% of 158,928 (23,839.20) | 32,993 |
| 8960 lines 5a, 12, 15–17 | 167,427; 239,427 − 200,000 = 39,427 × 3.8% | 167,427; 39,427; 1,498 |
| 1040 line 24, 37 | 32,993 + 1,498; less 7,900 withheld | 34,491; 26,591 |
