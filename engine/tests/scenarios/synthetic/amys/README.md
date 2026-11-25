# amys — foreign accounts and holdings on Form 8938 (synthetic)

Amys and Corin Halloran are married and file jointly. They live in Austin, Texas, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are worked out by hand from the instructions, then checked against the engine and locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

Amys earns wages. The couple holds six foreign assets:

- a joint time-deposit savings account in Bologna (EUR): interest, an early withdrawal penalty and Italian tax withheld;
- Amys's custody account at a London broker (GBP), opened in 2025: dividends and one short-term sale;
- Amys's current account in Basel (CHF), closed in June: no income;
- Corin's shares of a Norwegian company (NOK), on the company's register: dividends and Norwegian tax withheld;
- Amys's U.S.-dollar note of a Dutch company, bought in March: interest in dollars;
- Amys's units of a Luxembourg mutual fund that she reports on Form 8621 (Part IV), so they are not in Part VI.

The scenario fills Parts I to VI of Form 8938 with three copies of page 2, ties Part III to Schedules B, D, 1 and 3, and fills Schedule B line 7 from the asset facts. Each asset outside Part V carries the couple's answer whether it is a financial account for Schedule B and FinCEN Form 114 (`financialAccount`): the fund units are (a mutual fund, `irs-1040sb-inst-2025::sec::line-7a-question-1-check-the-yes-box-if-at-any-time::b01`); the shares on the register and the note are not.

## Documents

`generate-docs.ts` makes six year-end statements in `docs/` with the generator `documents/foreignAssetStatement.ts`. Each prints only the account's currency, as a foreign bank does: the balances, the month-end balances of an account (the highest is the Form 8938 maximum value, `valuing-financial-accounts::b01`), and on page 2 the income (each dividend with its date; the Bologna interest as one year total with no date), each penalty and withholding with its date, and each sale with its trade and settlement dates. No statement prints a dollar amount or an exchange rate.

## Currencies and rates

The income facts hold the amounts and their dates as the statements print them (`foreignCurrency` on each fact); no fact holds a rate. The engine looks each rate up in its tables (`engine/src/data/exchange-rates/`), converts, keeps the cents, and each form rounds its own lines. An amount with a date takes the H.10 rate of its day; an income amount with no date takes the IRS yearly average. The scenario shows both: the Bologna statement prints the year's interest as one total with no date, and every dividend with its date. All rates are real, as the Federal Reserve, the IRS and the Treasury publish them (`federal/8938/QUESTIONS.md` questions 15 and 18).

| What | Table and day | Rate as printed | Rule |
| --- | --- | --- | --- |
| Balances (Form 8938) | Treasury, 12/31/2025 | EUR 0.851, GBP 0.743, CHF 0.792, NOK 10.072 (units per dollar) | `irs-8938-inst-2025::sec::currency-determination-date::b01` |
| Bologna interest (no date) | IRS yearly average, 2025 | EUR 0.886 (euros per dollar) | an amount with no date |
| Bologna penalty | H.10, 09/15/2025 | EUR 1.1772 | an event: its day |
| Italian tax withheld | H.10, 12/31/2025 | EUR 1.1736 | `irs-1116-inst-2025::sec::foreign-currency-conversion::b01` |
| London dividends | H.10, 06/13/2025 and 11/14/2025 | GBP 1.3594, 1.3156 (dollars per pound) | each dividend: its day |
| London sale | H.10, settled 09/24/2025 (sale) and 03/12/2025 (purchase) | GBP 1.3450, 1.2970 | 26 CFR 1.988-2(a)(2)(iv) |
| Fjordline dividend and tax | H.10, 05/22/2025 | NOK 10.2100 (units per dollar) | its day |

## Why the form files

The year-end total is $383,666.01: 114,218.57 (Bologna, EUR 97,200 ÷ 0.851) + 64,333.78 (London, GBP 47,800 ÷ 0.743) + 0 (Basel) + 109,213.66 (Norway, NOK 1,100,000 ÷ 10.072) + 75,900 (note) + 20,000 (fund). The fund counts toward the threshold although Form 8621 reports it (`special-rules::b01`). A joint return in the United States files above $100,000 on the last day (`types-of-reporting-thresholds::b01`). Living abroad, they would not file: $383,666 is not above $400,000, and the sum of the maximums, $541,396, is not above $600,000.

## Hand check

The conversions, in the account's currency, the rate with its table and day, and dollars kept to the cent. A rate printed in dollars per unit multiplies; one in units per dollar divides.

| Item | Foreign amount | Rate (table, day) | Dollars |
| --- | --- | --- | --- |
| Bologna interest (year total, no date) | EUR 1,180.40 | ÷ 0.886 (IRS yearly average, 2025) | 1,332.28 |
| Bologna early withdrawal penalty | EUR 40.00 | × 1.1772 (H.10, 09/15/2025) | 47.09 |
| Bologna Italian tax withheld | EUR 118.04 | × 1.1736 (H.10, 12/31/2025) | 138.53 |
| London dividend (qualified) | GBP 520.30 | × 1.3594 (H.10, 06/13/2025) | 707.30 |
| London dividend (qualified) | GBP 580.40 | × 1.3156 (H.10, 11/14/2025) | 763.57 |
| London dividends, total | GBP 1,100.70 | | 1,470.87 |
| London sale proceeds | GBP 13,616.00 | × 1.3450 (H.10, settled 09/24/2025) | 18,313.52 |
| London sale cost | GBP 9,402.00 | × 1.2970 (H.10, settled 03/12/2025) | 12,194.39 |
| Fjordline dividend (qualified) | NOK 12,880.00 | ÷ 10.2100 (H.10, 05/22/2025) | 1,261.51 |
| Fjordline Norwegian tax withheld | NOK 1,932.00 | ÷ 10.2100 (H.10, 05/22/2025) | 189.23 |
| Polder note interest | USD 1,912.50 | none | 1,912.50 |
| Bologna maximum value | EUR 104,000 | ÷ 0.851 (Treasury, 12/31/2025) | 122,209.17 |
| London maximum value | GBP 61,200 | ÷ 0.743 (Treasury) | 82,368.78 |
| Basel maximum value | CHF 13,400 | ÷ 0.792 (Treasury) | 16,919.19 |
| Fjordline maximum value | NOK 2,240,000 | ÷ 10.072 (Treasury) | 222,398.73 |

The lines:

| Line | Rule | Value |
| --- | --- | --- |
| 8938 header | three page 2s: 2 additional statements | box checked, 2 |
| 8938 3a | a Form 1040 filer | checked |
| 8938 23 (Bologna, Basel, London) | the maximum values above, rounded | 122,209; 16,919; 82,369 |
| 8938 25 (Bologna) | currency and the Treasury rate | Euro (EUR), 0.851 |
| 8938 5, 6 | two deposit accounts: 122,209 + 16,919 | 2, 139,128 |
| 8938 7, 8 | one custodial account | 1, 82,369 |
| 8938 9 | Basel closed | Yes |
| 8938 32, 34 (Fjordline) | over $200,000; Norwegian krone (NOK), 10.072 | 32e 222,399 |
| 8938 32 (note) | USD 76,500 | box b |
| 8938 10, 11 | two assets: 222,399 + 76,500 | 2, 298,899 |
| 8938 12 | note bought in 2025 | Yes |
| 8938 13a | Bologna interest 1,332.28 | 1,332, Form 1040 line 2b, Schedule B line 1 |
| 8938 13b | London dividends 1,470.87 | 1,471, line 3b, Schedule B line 5 |
| 8938 13e | 18,314 − 12,194 (Form 8949 box C row) | 6,120, line 7a, Schedule D line 3 |
| 8938 13f | penalty 47.09 | 47, line 10, Schedule 1 line 18 |
| 8938 13g | Italian tax 138.53; the election credit is claimed | 139, line 20, Schedule 3 line 1 |
| 8938 14a | note interest 1,912.50 | 1,913 |
| 8938 14b, 14g | Fjordline dividend 1,261.51, tax 189.23 | 1,262; 189 |
| 8938 18 | one Form 8621 | 1 |
| 8938 22c, 22d | Bologna joint; Basel has no tax item | checked on their pages |
| Schedule B 1, 2, 4 | 1,332.28 + 1,912.50 = 3,244.78 | rows 1,332 and 1,913; 3,245 |
| Schedule B 5, 6 | 1,470.87 + 1,261.51 = 2,732.38 | rows 1,471 and 1,262; 2,732 |
| Schedule B 7a | Form 8938 accounts and the fund units; Bologna alone is over $10,000 | Yes, Yes |
| Schedule B 7b | the accounts' countries, in the order recorded | Italy; United Kingdom, Switzerland, Luxembourg |
| Form 8949 row 1 (box C) | 18,313.52 and 12,194.39, each rounded | 18,314; 12,194; 6,120 |
| Schedule D 3, 7, 16 | from Form 8949 box C | 6,120 |
| Schedule 1 18, 26 | the penalty | 47 |
| Schedule 3 1, 8 | election: the smaller of 327.76 (138.53 + 189.23) and the tax | 328 |
| 1040 2b, 3a, 3b, 7a | Schedule B 4 and 6; qualified 2,732.38; Schedule D 16 | 3,245; 2,732; 2,732; 6,120 |
| 1040 9, 10, 11 | 172,400 + 3,245 + 2,732 + 6,120; 47 | 184,497; 47; 184,450 |
| 1040 15 | 184,450 − 31,500 standard deduction | 152,950 |
| 1040 16 | QDCG worksheet: 150,218 × 22% − 10,172 = 22,875.96 → 22,876; 2,732 × 15% = 409.80 → 410 | 23,286 |
| 1040 20, 22, 24 | Schedule 3 line 8; 23,286 − 328 | 328; 22,958; 22,958 |
| 1040 34, 35a | 27,850 withheld − 22,958 | 4,892 |

History of the key lines:

- Rates stated on the facts (partly made up): Schedule B 2 3,245 and 6 2,690; Schedule D 16 6,266; Form 1040 line 11 184,556, line 16 23,313, line 24 22,987, line 34 4,863.
- The first tables, with the Board's G.5A average for the interest under the couple's chosen method (EUR 1,180.40 × 1.1306 = 1,334.56): Schedule B 2 3,247; Form 1040 line 11 184,452; lines 16, 24 and 34 as now.

The golden PDF holds page 1 and the first page 2 (Bologna, Norway). A plain render prints all three page 2s.
