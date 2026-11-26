# sorilea — a made-up taxpayer with IRA basis and a disaster (synthetic)

Sorilea Haldane is single, 64, and lives in Wenatchee, Washington. Every name, amount and disaster here is made up: DR-9930-WA is not a real FEMA number. The amounts follow Example 1 of the Form 8606 line 15b instructions (`irs-8606-inst-2025::sec::example-1-in-february-2025-an-11-000::b01`). There is no answer key. The expected values are the engine's output, checked by hand, then locked (`verification: "unverified"`).

She has $3,000 of basis in her traditional IRAs from earlier nondeductible contributions. In February 2025 she took $11,000, unrelated to the disaster. A wildfire damaged her home in March 2025. In September she took $22,000 and treats it as a qualified disaster distribution. Her IRAs are empty at year end. Washington has no income tax: the return is federal only.

The scenario shows the Form 8606 branch of Form 8915-F Part III: Form 8606 line 15b splits line 15a, line 17 is Yes, line 18 copies line 15b, and Form 1040 line 4b adds Form 8606 line 15c and Form 8915-F line 26. Agelmar shows the other branch (no Form 8606).

Forms that file: Form 1040, Form 8606, Form 8915-F.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Period | 179 days after 05/08/2025 | to 11/03/2025: the September distribution is in, February is before the fire |
| 8915-F 1e | one disaster, no earlier form: lines 1a–1d blank | 22,000 |
| 8915-F 3 (a), 3 (b), 5a | 11,000 + 22,000; the September 22,000; 11,000 | 33,000; 22,000; 11,000 |
| 8915-F 5b, 6, 7 | 22,000; 22,000; 33,000 − 22,000 | 22,000; 22,000; 11,000 |
| 8915-F 8 | no plan amount: No | No |
| 8606 lines 2, 3, 5 | basis | 3,000 |
| 8606 lines 6, 7, 9 | 0; 33,000; 33,000 | 0; 33,000; 33,000 |
| 8606 line 10, 12 | 3,000 ÷ 33,000 = .09091; 33,000 × .09091 | .09091; 3,000 |
| 8606 line 15a | 33,000 − 3,000 | 30,000 |
| 8606 line 15b | 30,000 × 22,000 ÷ 33,000 (the example) | 20,000 |
| 8606 line 15c | 30,000 − 20,000 | 10,000 |
| 8915-F 16, 17, 18 | Yes; on Form 8606, Yes; line 15b | Yes; Yes; 20,000 |
| 8915-F 20, 21, 22 | on Form 8606, blank; 20,000; 20,000 ÷ 3 | blank; 20,000; 6,667 |
| 8915-F 24, 26 | 6,667 | 6,667 |
| 1040 line 4a, 4b | 33,000; 8606 line 15c + 8915-F line 26 | 33,000; 16,667 |
| 1040 line 9, 15 | 40,000 + 16,667; − 15,750 | 56,667; 40,917 |
| 1040 line 16, 24 | tax table, 40,900–40,950, single | 4,673 |
| 1040 line 25a, 25b, 34 | 3,100; 1,100 + 2,200; 6,400 − 4,673 | 3,100; 3,300; 1,727 |
