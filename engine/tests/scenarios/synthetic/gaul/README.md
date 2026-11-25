# gaul — a related party land exchange and a divestiture (synthetic)

Gaul Renner is single and lives in San Marcos, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He works for a federal agency. In 2025 he traded investment land with his brother, through an intermediary, for other land. He also gave up some stock and got a used pickup truck and cash, and each side took over a mortgage. Nobody sold the land again in 2025. Under a certificate of divestiture he sold stock he held for five months and bought Treasury notes within 60 days. He takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario fills Parts I, II, III and IV of Form 8824 and checks that the gains reach Schedule D lines 4 and 11 and the tax. `dobraine` covers business property: recapture on line 21, lines 25a–25c, and Form 4797 lines 5 and 16. The published examples are unit tests (`tests/unit/federal/8824/`).

Forms that file: Form 1040, Schedule D, Form 8824.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Bureau of Range Survey | box 1 $98,000, box 2 $12,500 |
| Land given up | basis $84,000; mortgage $20,000 taken over by the brother; held since 03/14/2016 |
| Stock given up | FMV $6,000, basis $2,500 |
| Land received | FMV $150,000; mortgage $5,000 taken over by Gaul; identified 06/02/2025, received 08/15/2025 |
| Truck and cash received | $8,000 and $12,000 |
| Exchange expenses | $3,500 |
| Divested stock | received $48,600 less $100 expenses; basis $31,000; held 11/04/2024 to 04/02/2025 |
| Treasury notes bought | $44,000 |

No input documents: closing statements and broker records have no official form.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8824 line 5 | received 98 days after the transfer: the identification date | 06/02/2025 |
| 8824 line 7, 9, 10 | brother; nobody disposed of the property | Yes, No, No |
| 8824 lines 12, 13, 14 | stock: 6,000 − 2,500 | 6,000; 2,500; 3,500 |
| 8824 line 15 | 12,000 cash + 8,000 truck + (20,000 − 5,000 − 6,000) net liabilities − 3,500 | 25,500 |
| 8824 line 15a | what makes up line 15 | Used pickup truck; cash; liabilities |
| 8824 line 16, 17 | 150,000; + 25,500 | 150,000; 175,500 |
| 8824 line 18 | basis; nothing paid net; all expenses used on line 15 | 84,000 |
| 8824 line 19, 20 | 175,500 − 84,000; smaller of 25,500 and 91,500 | 91,500; 25,500 |
| 8824 line 21 | land: no recapture | blank |
| 8824 lines 22, 23, 24 | 25,500; 25,500; 91,500 − 25,500 | 25,500; 25,500; 66,000 |
| 8824 line 25 | 84,000 + 25,500 − 25,500 | 84,000 |
| 8824 lines 25a–25c | land is none of these | blank |
| 8824 line 26 | certificate 25-0417 | 25 – 0417 |
| 8824 lines 30–34 | 48,600 − 100; 31,000; 17,500; 44,000; 48,500 − 44,000 | 48,500; 31,000; 17,500; 44,000; 4,500 |
| 8824 lines 35, 36 | stock: no recapture; 4,500 − 0 | 0; 4,500 |
| 8824 lines 37, 38 | 17,500 − 4,500; 44,000 − 13,000 | 13,000; 31,000 |
| Schedule D line 4 | Part IV line 36, held 1 year or less | 4,500 |
| Schedule D line 11 | line 22 25,500 + line 14 3,500, both held more than 1 year | 29,000 |
| Schedule D line 16 | 4,500 + 29,000 | 33,500 |
| 1040 line 9, 11a | 98,000 + 33,500 | 131,500 |
| 1040 line 15 | 131,500 − 15,750 | 115,750 |
| 1040 line 16 | QDCG worksheet, below | 18,355 |
| 1040 line 37 | 18,355 − 12,500 | 5,855 |

Line 16: the net capital gain is the smaller of Schedule D lines 15 and 16, 29,000. Tax on 86,750 from the tax table (single) is 14,005. The 0% band ends at 48,350, below 86,750, so 29,000 × 15% = 4,350. Line 16 is 18,355.
