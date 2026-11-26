# pedron — a made-up owner of a low-income housing building (synthetic)

Pedron Ashgrove is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Pedron has one W-2. He owns a 24-unit building directly. It was placed in service in June 2018, and 2018 is the first year of its credit period, so 2025 is year 8. He claimed the low-income housing credit each year from 2018 to 2024. In 2021 the qualified basis grew, so that year's Form 8609-A completed line 7 (one Line 2 Worksheet). In 2023 a smaller decrease was recaptured ($400). In 2025 four units had tenants who were not income-qualified, and the qualified basis fell below its first-year amount. $3,000 of his credits were never used ($200 of them from the addition). The building was financed with tax-exempt bonds (item F). He takes the standard deduction. The return is federal only: Nevada has no income tax.

Forms that file: Form 1040, Schedule 2, Form 8611. Lines 8, 16 and 17 of Form 8611 stay blank: line 8 is for a recapture from a K-1, and lines 16 and 17 are for a section 42(j)(5) partnership. Line 15 is 0 because line 12 is more than line 13. The K-1 path and the other edges are unit tests (`tests/unit/federal/8611/`).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Sierra Meadow Engineering | box 1 $185,000, box 2 $36,000 |
| Credits, 2018 to 2024 (Forms 8586) | $9,000; $12,000; $12,000; $13,400; $12,000; $12,000; $12,000 |
| 2021 Form 8609-A | line 10 $700, line 11 $300, line 14 step 1 .25, line 15 12, line 16 9 |
| Qualified basis | first year $2,400,000; end of 2024 $2,520,000; end of 2025 $1,980,000 |
| Earlier recapture of the accelerated portion | $400 |
| Unused credits | $3,000; from additions $200 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Worksheet a, b, c, d | 700; × 2; 300; 1,400 − 300 | 700; 1,400; 300; 1,100 |
| Worksheet e, f, g | .250; 1,100 × .250; 1,100 − 275 | .250; 275; 825 |
| Worksheet h, i | 9 / 12; 825 × .750 = 618.75 | .750; 619 |
| 8611 line 1 | 9,000 + 12,000 × 5 + 13,400 | 82,400 |
| 8611 line 2 | worksheet i | 619 |
| 8611 line 3 | 82,400 − 619 | 81,781 |
| 8611 line 4 | year 8: years 2 through 11 | .333 |
| 8611 line 5 | 81,781 × .333 = 27,233.07 | 27,233 |
| 8611 line 6 | (2,400,000 − 1,980,000) / 2,400,000 | .175 |
| 8611 line 7 | 27,233 × .175 = 4,765.78 → 4,766, less 400 | 4,366 |
| 8611 line 9 | (3,000 − 200) × .333 × .175 = 163.17 | 163 |
| 8611 line 10 | 4,366 − 163 | 4,203 |
| 8611 line 11 | 4,203 shared by each year's credit less its worksheet i (81,781 in all), daily compound interest at the section 6621 rates from April 15 of the next year to April 15, 2026: 224.01 + 252.15 + 223.03 + 210.75 + 153.37 + 97.33 + 44.44 (checked day by day in a separate script) | 1,205 |
| 8611 line 12 | 4,203 + 1,205 | 5,408 |
| 8611 line 13 | 3,000 − 163 | 2,837 |
| 8611 line 14 | 5,408 − 2,837 | 2,571 |
| 8611 line 15 | 2,837 − 5,408, zero or less | 0 |
| Schedule 2 line 16, line 21 | 8611 line 14 | 2,571 |
| 1040 line 1a, 9, 11a | W-2 box 1 | 185,000 |
| 1040 line 12e | single standard deduction | 15,750 |
| 1040 line 15 | 185,000 − 15,750 | 169,250 |
| 1040 line 16 | rate schedule, single: 1,192.50 + 4,386 + 12,072.50 + 65,900 × 24% | 33,467 |
| 1040 line 23 | Schedule 2 line 21 | 2,571 |
| 1040 line 24 | 33,467 + 2,571 | 36,038 |
| 1040 line 25a, 33 | W-2 box 2 | 36,000 |
| 1040 line 37 | 36,038 − 36,000 | 38 |
