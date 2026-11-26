# elza — a refund of look-back interest, simplified method (synthetic)

Elza Marrowind is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`). The return is federal only: Nevada has no income tax.

She runs a steel fabrication business (Schedule C, accrual method). She built a pedestrian bridge from 2021 to 2023 on the percentage of completion method. In 2025 the price came down in a final settlement, a post-completion adjustment, so she applies the look-back method again. She has elected the simplified marginal impact method (Form 8697 Part II). She filed and paid her 2025 return on March 2, 2026, and wants the refund in her checking account. She has no input documents.

The scenario renders a filled Form 8697 Part II with three prior years. Column (a) hits the line 6 ceiling. Column (c) takes the AMT amount on line 5, because it is larger. The interest to be refunded is more than the interest due, so line 10a has the net; the form is filed by itself, with the address and the deposit lines, and Schedule 2 line 17n stays blank. The 2021 year starts its interest on April 16, 2022, the quarter Table 1 leaves out (row A69: 4%). The dagdara scenario covers Part I.

Forms that file: Form 1040, Schedules 1, 2, C and SE, Form 8995, Form 8697.

## Inputs

| Input | Amounts |
| --- | --- |
| Business, Marrowind Steel Fabrication | receipts $190,000; supplies $70,000, insurance $6,000, utilities $4,000 |
| Look-back, 2021 | regular −$20,000; AMTI −$20,000; total tax $5,000 |
| Look-back, 2022 | regular −$30,000; AMTI −$30,000; total tax $40,000 |
| Look-back, 2023 | regular +$6,000; AMTI +$10,000; total tax $38,000 |
| Filed and paid | March 2, 2026 |
| Refund account | checking, routing 321270742, account 8697-4410-23 |

## Hand check

Rates by accrual period (first day): 4% (April 16, 2022), 7% (2023), 8% (2024), 7% (2025). The last period ends March 2, 2026. Each day grows by the rate over 365, or 366 in 2024.

| Line | Rule | Value |
| --- | --- | --- |
| 8697 Part II line 1 (a), (b), (c) | stated | −20,000; −30,000; 6,000 |
| line 2 | line 1 × 37% | −7,400; −11,100; 2,220 |
| line 3 | stated | −20,000; −30,000; 10,000 |
| line 4 | line 3 × 28% | −5,600; −8,400; 2,800 |
| line 5 | both negative: the larger by size; else the larger | −7,400; −11,100; 2,800 |
| line 6 (a), (b) | total tax, where line 5 is negative | 5,000; 40,000 |
| line 7 | the smaller of 5 and 6, as negative; line 5 where line 6 is blank | −5,000; −11,100; 2,800 |
| line 9 (a) | 5,000 × (e^0.251519 − 1) = 5,000 × 0.285977 | 1,430 |
| line 9 (b) | 11,100 × (e^0.211521 − 1) = 11,100 × 0.235557 | 2,615 |
| line 8 (c) | 2,800 × (e^0.141391 − 1) = 2,800 × 0.151875 | 425 |
| line 8 (d), 9 (d) | totals, cents kept (1,429.89 + 2,614.68) | 425; 4,045 |
| line 10a | 4,045 − 425 | 3,620 |
| lines 10b–10d | the account | 321270742, checking, 8697-4410-23 |
| Schedule 2 line 17n | a refund is claimed on the form itself | blank |
