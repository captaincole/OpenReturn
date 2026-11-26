# melaine — a home sale that pays back a mortgage subsidy (synthetic)

Melaine Ashgrove is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

In June 2020 she bought a home in Round Rock with a loan from a county housing finance corporation. The loan came from a tax-exempt mortgage bond. In August 2025 she sold the home and paid the loan off at the closing. The home was her main home for five years, so section 121 excludes the whole gain from her income. The recapture tax still applies. She has one W-2 and a 1099-INT with taxable and tax-exempt interest. She takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario fills every line of Form 8828. Line 18, the income percentage, is below 100. Line 22 is smaller than half the gain, so it is the tax. The tax goes to Schedule 2 line 17b and on to Form 1040 line 23. The rules for the other branches (a loss, line 17 zero or less, the repayment worksheet, the 9-year limit, a second home on its own copy) are unit tests (`tests/unit/federal/8828/`).

Forms that file: Form 1040, Schedule 2, Form 8828.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Caliche Ridge Engineering | box 1 $67,500, box 2 $14,000 |
| 1099-INT, Blackland Prairie Credit Union | box 1 $240.35, box 8 $409.80 |
| Recapture tax notice, Brazos Bend County Housing Finance Corporation (`docs/01-recapture-tax-notice.pdf`) | bond loan, closed 06/12/2020, federally subsidized amount $14,750, the 9-year table |
| Her answers: the sale | sold 08/29/2025, loan repaid the same day, price $330,000, expenses $19,800, basis $262,500, no gain in income, a household of 1 |

The notice comes from `generate-docs.ts` and the generator `tests/scenarios/documents/recaptureTaxNotice.ts`, with the values in `facts.ts`. The W-2 and the 1099-INT have no PDF.

## Compared with real examples

The notice is the first document of its type. The IRS publishes no form for it; each issuer draws its own.

- [CHFA Form 052-1195-S, "Notice to Mortgagor of Maximum Recapture Tax and Method to Compute Recapture Tax on Sale of Home"](https://www.chfa.org/assets/1/6/120_Recapture_Tax_(Federal)_Notice_to_Mortgagor-_Method_to_Compute_-_052-1195-S_Rev_1-25-23.pdf): borrower and loan number, the maximum recapture tax (6.25% of the highest principal), the method, and a 9-row table with the holding period percentage and the adjusted qualifying income for a household of 2 or less and of 3 or more. Ours has the same parts and the same table.
- [NJ HMFA "Notice to Mortgagor of Potential Federal Recapture Tax on Sale of Home"](https://www.nj.gov/dca/hmfa/lenders/docs/len_recapture_tax.pdf): the note that it applies to loans closed on or after January 1, 1991, the maximum recapture amount, the holding period schedule (20% up to 100% in year 5, down to 20% in year 9), and an attached chart of adjusted qualifying incomes. Ours adds that note.
- Changed after the comparison: the federally subsidized amount sits in its own box at the top, and the issuer (state, political subdivision, agency), the lender and the closing date are printed, because Form 8828 lines 3 to 5 ask for them. Neither real notice has signature lines that the engine needs, so ours has none. The property address is not on either real notice; it is her answer.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8828 line 1 | the sold home, not her current address | 1207 Larkspur Bend, Round Rock, TX 78664 |
| 8828 line 2a | the notice: a tax-exempt bond loan | checked |
| 8828 lines 3, 4 | the notice's issuer and lender | as printed |
| 8828 lines 5, 6, 8 | closed 06/12/2020; sold and repaid 08/29/2025 | 06 12 2020; 08 29 2025; 08 29 2025 |
| 8828 line 7 | June 12, 2020 to August 29, 2025 | 5 years, 2 full months |
| 8828 lines 9, 10, 11 | 330,000 − 19,800 | 330,000; 19,800; 310,200 |
| 8828 lines 12, 13, 14 | 310,200 − 262,500; half | 262,500; 47,700; 23,850 |
| 1040 lines 1a, 2a, 2b | W-2 box 1; 1099-INT box 8, box 1 | 67,500; 410; 240 |
| 1040 lines 9, 11a, 11b | 67,500 + 240 | 67,740 |
| 8828 line 15 | 67,740 + 410 − 0 | 68,150 |
| 8828 line 16 | the table's line 6 (5 years 2 months is 6 full and partial years), household of 2 or less | 65,218 |
| 8828 line 17 | 68,150 − 65,218 | 2,932 |
| 8828 line 18 | 2,932 / 5,000 = 58.64%, to the nearest whole percent | 59 |
| 8828 line 19 | the notice | 14,750 |
| 8828 line 20 | the table's line 6; no worksheet (line 8 is line 6) | 80 |
| 8828 line 21 | 14,750 × 80% | 11,800 |
| 8828 line 22 | 11,800 × 59% | 6,962 |
| 8828 line 23 | smaller of 23,850 and 6,962 | 6,962 |
| Schedule 2 lines 17b, 18, 21 | Form 8828 line 23 | 6,962 |
| 1040 lines 12e, 14, 15 | single standard deduction; 67,740 − 15,750 | 15,750; 51,990 |
| 1040 lines 16, 18, 22 | tax table, 51,950–52,000, single | 6,349 |
| 1040 line 23 | Schedule 2 line 21 | 6,962 |
| 1040 line 24 | 6,349 + 6,962 | 13,311 |
| 1040 lines 25a, 25d, 33 | W-2 box 2 | 14,000 |
| 1040 lines 34, 35a | 14,000 − 13,311 | 689 |
