# dyelin — a fisher's first joint return (synthetic)

Dyelin Tarvanek fishes for crab and halibut out of Homer, Alaska. She married Elyas, a boatyard mechanic, in June 2025, and they file jointly. Each filed a single return for 2024. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the Form 2210-F instructions, then locked (`verification: "unverified"`). The return is federal only: Alaska has no income tax.

She is a fisher for the penalty: on the joint return, $300,000 of the $340,000 gross income is from fishing (88%). They paid $10,000 on January 14, 2026, and $25,000 on February 20, 2026. The second payment covers the underpayment and leaves a refund.

The scenario covers Form 2210-F box B (a joint return for 2025 but not for 2024, and line 10 smaller than line 7), line 14 from a dated payment after January 15, and the penalty on Form 1040 line 38 taken out of the line 35a refund. Form 2210 does not file: a fisher uses Form 2210-F. `cerandin` covers box A and line 4.

No input documents: the W-2 holds its boxes as printed, and the rest are the boat's books and their answers.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1 | Form 1040 line 22 (tax on 105,152, joint) | 12,961 |
| 2 | Schedule 2 line 4, self-employment tax (14,887 + 3,482) | 18,369 |
| 3 | 12,961 + 18,369 | 31,330 |
| 4 | no refundable credits | 0 |
| 6 | 31,330 − 0 | 31,330 |
| 7 | 31,330 × 0.667 = 20,897.11 | 20,897 |
| 8 | Form 1040 line 25d | 3,000 |
| 9 | 31,330 − 3,000 | 28,330 |
| 10 | both 2024 separate returns: 15,000 + 3,500 | 18,500 |
| 11 | smaller of 20,897 and 18,500 | 18,500 |
| 12 | $10,000 paid January 14, 2026, + 3,000 | 13,000 |
| 13 | 18,500 − 13,000 | 5,500 |
| 14 | the February 20 payment ($25,000) covers 5,500 | 02/20/26 |
| 15 | January 15 to February 20: 16 + 20 | 36 |
| 16 | 5,500 × 36 / 365 × 0.07 = 37.97 | 38 |
| Box B | joint 2025, separate 2024; 18,500 < 20,897 | checked |
| Form 1040 line 38 | Form 2210-F line 16 | 38 |
| Form 1040 line 34 | 38,000 − 31,330 | 6,670 |
| Form 1040 line 35a | 6,670 − 38 | 6,632 |
