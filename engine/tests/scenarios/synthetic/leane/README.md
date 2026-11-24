# leane — a made-up taxpayer with three foreign funds (synthetic)

Leane Varrow is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Leane has one W-2 and holds three foreign funds directly, each a passive foreign investment company (PFIC):

- **Rhine Valley Equity Fund** (Luxembourg), a section 1291 fund held since March 2021. Two 2025 distributions in euros, with tax withheld at source, exceed 125% of the 2022–2024 average. The excess goes through Part V and line 16: tax at the top rate for each earlier year, the foreign tax credit, and interest.
- **Nordic Broad Index ETF** (Sweden), marked to market since 2019. A year-end gain (Part IV line 10c), and a sale of some shares at a loss within the unreversed inclusions (lines 13a–14b).
- **Pacific Rim Growth Fund** (Hong Kong, a U.S. dollar share class), a QEF (Part III). Two section 1294 elections from earlier years are outstanding (Part VI). A 2025 distribution larger than the year's earnings ends the most recent one, the 2023 election, in part.

The return is federal only: Texas has no income tax. Forms that file: Form 1040, Schedules 1, 2, 3, B and D, Forms 1116, 8621 (three copies), 8959 and 8960. The golden PDF holds the first copy of Form 8621; all three render with `renderScenario.ts` (no `--golden`).

## Input documents

Made by `generate-docs.ts` from the fund facts:

- `docs/01-pfic-rhine-valley.pdf`, `docs/02-pfic-nordic-index.pdf`, `docs/04-pfic-pacific-rim-account.pdf`: each fund's year-end account statement (`tests/scenarios/documents/fundAccountStatement.ts`): the transactions and the holding at December 31, in the fund's currency. Rhine Valley and Nordic have no QEF election, so they send nothing more: no PFIC statement exists for them.
- `docs/03-pfic-pacific-rim.pdf`: the QEF's PFIC Annual Information Statement (`tests/scenarios/documents/pficFundStatement.ts`). Its parts follow the statements fund companies publish: the notice to U.S. holders, then (1) the fund's tax year, (2) ordinary earnings and net capital gain per unit per day in U.S. dollars, (3) distributions per unit, (4) the promise to let the holder inspect the books, and an officer's signature. It names no holder.

The basis, exchange rates, earlier distributions, unreversed inclusions, unit days and section 1294 elections are Leane's records, stated.

Each fund prints its amounts in its own currency, and the fact holds them that way: the Rhine Valley fund in euros (the distributions, the tax withheld, the year-end value), the other two in U.S. dollars. Leane's rate for each date converts them (`yearEndUsdPerUnit`, each distribution's `usdPerUnit`). For example, the June distribution is EUR 6,000 × 1.15 = $6,900, and the year-end value is EUR 155,000 × 1.1742 = $182,001.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8621 (Rhine) 4 | EUR 155,000 × 1.1742 USD per euro on 12/31/2025 = $182,001 | box (d) |
| 8621 (Rhine) 15a–15d | EUR 6,000 + 4,000; 9,600; 9,600 ÷ 3; × 1.25 (all in euros) | 10,000; 9,600; 3,200; 4,000 |
| 8621 (Rhine) 15e(1), 15e(2) | 10,000 − 4,000; EUR 3,600 × 1.15 + EUR 2,400 × 1.17 | 6,000; 6,948 |
| 8621 (Rhine) 16b | the 2025 days' share of each excess part (independent script) | 1,015 |
| 8621 (Rhine) 16c, 16d, 16e | 2021–2024 shares × 37%; the excess taxes, capped per year; 16c − 16d | 2,195; 890; 1,305 |
| 8621 (Rhine) 16f | daily compound interest on each year's net increase to 2026-04-15 | 252 |
| 8621 (Rhine) 5a | 15e(2) | 6,948 |
| 8621 (Nordic) 10a–10c | 268,450 − 241,300 | 27,150 |
| 8621 (Nordic) 13a–14b | 30,000 − 34,500; loss within 6,200 of inclusions | −4,500; 6,200; −4,500 |
| 8621 (Nordic) 5c | 27,150 − 4,500 | 22,650 |
| 8621 (Pacific Rim) 6a, 6c | $0.0087685388 a unit a day × 438,000 unit days (1,200 × 365) = 3,840.62 | 3,841; 3,841 |
| 8621 (Pacific Rim) 7a, 7c | $0.0050579909 × 438,000 = 2,215.40 | 2,215; 2,215 |
| 8621 (Pacific Rim) 17–19 | 2022: 5,000, 1,850; 2023: 3,200, 1,184 | as stated |
| 8621 (Pacific Rim) 22 (2023 column) | distribution $6.75 × 1,200 = 8,100; first out of 2025's earnings 3,841 + 2,215 = 6,056; the rest from the most recent election | 2,044 |
| 8621 (Pacific Rim) 23–25 (2023 column) | 1,184 × 2,044 ÷ 3,200 = 756.28; interest 2024-04-15 to 2026-04-15; 1,184 − 756 | 756; 119; 428 |
| Schedule 1 line 8z | 1,015 + 27,150 − 4,500 + 3,841 | 27,506 |
| Schedule B line 5, 6; 1040 line 3b | nonexcess EUR 2,400 × 1.15 + EUR 1,600 × 1.17 | 4,632 |
| Schedule D line 11, 15, 16; 1040 line 7a | line 7c | 2,215 |
| 1040 lines 9, 11a | 310,000 + 4,632 + 2,215 + 27,506 | 344,353 |
| 1040 line 15 | 344,353 − 15,750 | 328,603 |
| 1040 line 16 | tax on 326,388 ordinary (83,783.05) + 2,215 at 15% (332.25) = 84,115; + 1,305 (box 3, "1291TAX 1,305") | 85,420 |
| Form 1116 lines 1a, 8, 35 | 4,632 + 1,015; tax 694.80 + 152.25 general-rules part | 5,647; 847; 847 |
| Schedule 3 line 1; 1040 lines 20, 22 | 847; 85,420 − 847 | 847; 84,573 |
| Form 8960 lines 2, 5a, 5b, 6 | 4,632; 2,215; −2,215; 22,650 + 6,948 | 4,632; 2,215; −2,215; 29,598 |
| Form 8960 lines 8, 17 | 34,230; 3.8% of 34,230 | 34,230; 1,301 |
| Form 8959 line 18 | 0.9% × (310,000 − 200,000) | 990 |
| Schedule 2 lines 17p, 17q, 17z | 16f; line 24; line 23 "1294DT" | 252; 119; 756 |
| Schedule 2 lines 18, 21; 1040 line 23 | 252 + 119 + 756; 990 + 1,301 + 1,127 | 1,127; 3,418 |
| 1040 line 24 | 84,573 + 3,418 | 87,991 |
| 1040 lines 25a, 25c, 33, 37 | 64,000; 990; 64,990; 87,991 − 64,990 | 23,001 owed |
