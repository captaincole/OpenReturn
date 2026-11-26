# beldeine — a made-up investor with passive credits and passive income (synthetic)

Beldeine Harrowgate is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Beldeine is an engineering director with a high W-2. She invested in a bakery partnership she does not work in, so its income and its credits are passive. She also owns a share of a low-income housing building, and last year's Form 8582-CR left some credits unallowed. She takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario covers the lines that `arram` cannot, because a return has either net passive income or a passive loss:

- Line 6: the tax on the bakery's $10,000 of net passive income. Form 8582 does not file: the activity has no loss.
- Worksheet 4 (lines 4a to 4c): the bakery's empowerment zone and work opportunity credits from its K-1, and last year's unallowed work opportunity credit.
- Worksheet 3 (lines 3a to 3c): the low-income housing credit and last year's unallowed one.
- Part IV: the low-income housing credit has no income limit, so a high income still gets the tax on $25,000 (35%).
- Worksheets 7 to 9 share line 6's tax among the credits Part IV leaves. Form 3800 takes the allowed credit on lines 24 and 33.

Simplifications: the K-1 prints no section 199A statement, so there is no QBI deduction. The low-income housing credit is stated, as Form 8586 would figure it. Last year's unallowed credits are stated answers (#79).

Forms that file: Form 1040, Schedules 1, 2, 3 and E, Forms 8582-CR, 3800, 6251, 8959 and 8960.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Colorado River Software Inc. | box 1 $380,000, box 2 $88,000, box 6 $7,130 |
| K-1, Llano Bakery Partners LLC (00-0858302), no material participation | box 1 $10,000; box 15 L $1,500, J $3,000 |
| Credit, Mesa Verde Senior Housing (Worksheet 3, placed in service 2018) | Form 8586 $9,000; 2024 carryover $2,000 |
| Carryover, Llano Bakery (Worksheet 4) | 2024 Form 5884 $600 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 11, 15 | 380,000 + 10,000; less 15,750 | 390,000; 374,250 |
| 1040 line 16 | 57,231 + 35% × (374,250 − 250,525) | 100,535 |
| 8582-CR 3a, 3b, 3c | 9,000; 2,000 | 11,000 |
| 8582-CR 4a, 4b, 4c | 1,500 + 3,000; 600 | 4,500; 600; 5,100 |
| 8582-CR 5 | 11,000 + 5,100 | 16,100 |
| 8582-CR 6 | 35% × 10,000 (both incomes in the 35% bracket) | 3,500 |
| 8582-CR 7 | 16,100 − 3,500 | 12,600 |
| 8582-CR 31 to 34 | line 7 less line 16 (none); line 30 none; smaller of 3c | 12,600; 0; 12,600; 11,000 |
| 8582-CR 35, 36 | 35% × 25,000 | 8,750 |
| 8582-CR 37 | 3,500 + 8,750 | 12,250 |
| Worksheet 7 | 8,750 by 9,000 : 2,000; column (d) | 7,159, 1,591; 1,841, 409 |
| Worksheet 8 | line C 16,100 − 12,250 = 3,850 over 1,841, 1,500, 3,000, 409, 600 | 964, 786, 1,571, 215, 314 |
| Worksheet 9 | allowed | 8,036; 714; 1,429; 1,785; 286 |
| 3800 line 23, 24 | Part III line 3 (d); allowed | 1,500; 714 |
| 3800 line 32, 33 | 3,000 + 9,000 + 600 + 2,000; 1,429 + 8,036 + 286 + 1,785 | 14,600; 11,536 |
| 3800 line 26, 37, 38 | smaller of line 21 (40,722); smaller of line 29 (80,937); 714 + 11,536 | 714; 11,536; 12,250 |
| Schedule 3 line 6a; 1040 line 22 | 3800 line 38; 100,535 − 12,250 | 12,250; 88,285 |
| 1040 line 23 | 8959 0.9% × 180,000 + 8960 3.8% × 10,000 | 2,000 |
| 1040 line 37 | 90,285 − (88,000 + 1,620) | 665 |
