# meilyn — a made-up pilot and fuel dealer (synthetic)

Meilyn Ashvane is single and lives in Casper, Wyoming. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the Form 4136 instructions, then locked (`verification: "unverified"`). The return is federal only: Wyoming has no income tax.

She runs one Schedule C business, Ashvane Field & Air Services: crop dusting, farm and site work, a fuel depot that sells to the county and to bus lines, and some fuel exports. She also heats her home with kerosene. To fill as much of Form 4136 as one return can, her fuel log has one claim on every Part II row. Real taxpayers claim a few rows. Her Schedule C line 6 holds $2,150, the fuel tax credit she claimed on her 2024 return (decision A59 in `docs/rule-decisions.md`: this year's credit is next year's income). She paid $16,000 of estimated tax.

The scenario covers: the bracketed rows (1a-1c, 3a-3b, 4a-4b, 7a-7b), the bus rates of type of use 5 (11a, 14a), gallon equivalents from gallons and cubic feet (11a, 11c, 11g), line 13c taxed at $.244, the four dye exception boxes, the registration numbers, home kerosene in the 4a-4b bracket, Part I from the linked business, and line 17 with cents. The credit reaches Schedule 3 lines 12 and 15 and Form 1040 line 31.

No input documents: the IRS has no information return for fuel use. The facts are her books, her fuel log and her answers.

Forms checked: Form 4136, Schedule 3, Form 1040, Schedule C.

## Hand check

Each credit is rate × gallons, kept to the cent; a bracket adds its rows first.

| Line | Rule | Value |
| --- | --- | --- |
| Part I A, B | one business activity | Yes; 1 |
| Part I C, D, E | the linked business fact | Ashvane Field & Air Services; 00-0041360; 115110 |
| 1a-1c (e) | (1,200 + 800 + 300) × .183; (d) 4,140 + 2,760 + 1,035.50 | 420.90; 7,935.50 |
| 1d | 500 × .184 | 92.00 |
| 2a, 2b, 2c, 2d | 2,000 × .15; 400 × .193; 250 × .194; 1,000 × .001 | 300.00; 77.20; 48.50; 1.00 |
| 3a-3b (e) | (1,500 + 2,500) × .243 | 972.00 |
| 3c, 3d, 3e | 600 × .243; 900 × .17; 700 × .244 | 145.80; 153.00; 170.80 |
| 4a-4b (e) | (150 home + 300 farm) × .243; (d) 690.25 + 1,260 | 109.35; 1,950.25 |
| 4c, 4d, 4e, 4f | 200 × .17; 100 × .244; 400 × .043; 350 × .218 | 34.00; 24.40; 17.20; 76.30 |
| 5a-5e | 3,000 × .200; 1,000 × .175; 800 × .243; 600 × .218; 500 × .001 | 600.00; 175.00; 194.40; 130.80; 0.50 |
| 6a, 6b | 2,000 × .243; 1,500 × .17 | 486.00; 255.00 |
| 7a-7b (e), 7c | (400 + 600) × .243; 300 × .17 | 243.00; 51.00 |
| 8a-8f | 1,200 × .175; 1,000 × .200; 2,000 × .025; 700 × .243; 500 × .218; 300 × .001 | 210.00; 200.00; 50.00; 170.10; 109.00; 0.30 |
| 11a | 10,000 gal LPG ÷ 1.353 = 7,391 GGE × .109 (bus) | 805.62 |
| 11b, 11d, 11e, 11f, 11h | 500 × .183; 200 × .183; 300 × .243; 400 × .243; 250 × .183 | 91.50; 36.60; 72.90; 97.20; 45.75 |
| 11c | 123,570 cu ft ÷ 123.57 = 1,000 GGE × .183 | 183.00 |
| 11g | 1,710 gal LNG ÷ 1.71 = 1,000 DGE × .243 | 243.00 |
| 13a, 13b, 13c | 1,000 × .243; 800 × .243; 600 × .243 (taxed at $.244) | 243.00; 194.40; 145.80 |
| 14a, 14b | 1,000 × .124 (bus); 500 × .198 | 124.00; 99.00 |
| 15a | 10,000 × .046 | 460.00 |
| 16a, 16b | 5,000 × .001; 2,000 × .001 | 5.00; 2.00 |
| 17 | column (e) added | 8,366.32 |
| Schedule 3 line 12, 15 | line 17 to the nearest dollar | 8,366 |
| 1040 line 31, 32 | Schedule 3 line 15 | 8,366 |
| 1040 line 24 | tax and self-employment tax | 20,753 |
| 1040 line 26 | estimated tax | 16,000 |
| 1040 line 33 | 16,000 + 8,366 | 24,366 |
| 1040 line 34, 35a | 24,366 − 20,753 | 3,613 |

The printed rate on lines 11a, 14a and 13c stays the form's: the blank PDF has no widget for the bus rate or the "Taxed at $.244" note (`engine/src/federal/4136/QUESTIONS.md`, doubt 3).
