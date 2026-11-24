# sheriam — a made-up couple with three foreign funds (synthetic)

Sheriam and Tavin Okonde are married and file jointly. They live in Sarasota, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Sheriam has one W-2. The couple holds three foreign funds directly. The scenario covers the branches leane does not:

- **Alpine Balanced Fund** (Switzerland), bought in February 2025 and made a QEF the same year (Election A, line 2 date), with a section 1293(g) exclusion on line 6b and a section 1.1411-10(g) election: line 6c is net investment income on Form 8960 line 6, and line 7c stays on line 5a.
- **Cape Horizon Income Fund** (South Africa), a section 1291 fund owned jointly since 2022 and sold in September 2025. The gain is line 15f; line 16 spreads it over 1,337 days. No foreign tax, so line 16d is 0.
- **Baltic Tech Leaders ETF** (Estonia), marked to market since 2020. The year-end loss is more than the unreversed inclusions, so line 12 allows only $5,500.

Two lines this pull request fills stay empty here, on purpose. Form 8960 line 5b is blank: with the section 1.1411-10(g) election the QEF gain stays on line 5a (worksheet line 2(f) is 0), and the couple has no other line 5b item. Schedule 2 line 17z has no "1294DT": no section 1294 election ends, so Form 8621 line 23 is blank. Leane shows both lines with amounts.

The return is federal only: Florida has no income tax. Forms that file: Form 1040, Schedules 1, 2 and D, Forms 8621 (three copies), 8959 and 8960. The golden PDF holds the first copy of Form 8621.

## Input documents

Made by `generate-docs.ts` with `tests/scenarios/documents/pficFundStatement.ts`: `docs/01-pfic-alpine-balanced.pdf` (the PFIC Annual Information Statement), `docs/02-pfic-cape-horizon.pdf`, `docs/03-pfic-baltic-tech.pdf`. The basis, the unreversed inclusions and the elections are the couple's records, stated.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8621 (Alpine) 2, 4 | acquired 02/03/2025; $72,000 is box (b) | 02/03/2025; (b) |
| 8621 (Alpine) 6a–6c | 5,000 − 400 | 5,000; 400; 4,600 |
| 8621 (Alpine) 7a, 7c; 5b | 1,200; 4,600 + 1,200 | 1,200; 5,800 |
| 8621 (Cape) 15f | 48,000 − 39,500 | 8,500 |
| 8621 (Cape) 16b | 8,500 × 273 ÷ 1,337 (2025 days) | 1,736 |
| 8621 (Cape) 16c, 16d, 16e | 2022–2024 shares × 37%; no tax; 16c − 16d | 2,503; 0; 2,503 |
| 8621 (Cape) 16f | daily compound interest to 2026-04-15 (independent script) | 392 |
| 8621 (Baltic) 10a–12 | 61,000 − 70,000; inclusions 5,500 cap the loss | −9,000; 5,500; −5,500 |
| Schedule 1 line 8z; 1040 line 8 | 4,600 + 1,736 − 5,500 | 836 |
| Schedule D line 11, 15, 16; 1040 line 7a | line 7c | 1,200 |
| 1040 lines 9, 11a, 15 | 280,000 + 1,200 + 836; − 31,500 | 282,036; 250,536 |
| 1040 line 16 | tax on 249,336 ordinary (45,534.64) + 1,200 at 15% (180) = 45,715; + 2,503 (box 3) | 48,218 |
| Form 8960 line 6, header box | −5,500 + 8,500 + 4,600; the (g) election | 7,600; checked |
| Form 8960 lines 5a, 8, 17 | 1,200; 8,800; 3.8% of 8,800 | 1,200; 8,800; 334 |
| Form 8959 line 18 | 0.9% × (280,000 − 250,000) | 270 |
| Schedule 2 lines 17p, 18, 21 | 16f; 270 + 334 + 392 | 392; 392; 996 |
| 1040 lines 23, 24 | 996; 48,218 + 996 | 996; 49,214 |
| 1040 lines 25a, 25c, 33, 34 | 52,000; 720; 52,720; 52,720 − 49,214 | 3,506 refund |
