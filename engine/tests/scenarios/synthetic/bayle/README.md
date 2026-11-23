# bayle — a partner who sold his whole interest (synthetic)

Bayle Domon is single and lives in Bellingham, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Bayle was a limited partner in Snow Goose Shipping LP and never worked in it. Form 8582 carried $9,000 of its passive losses from 2024. On November 14, 2025 he sold his whole interest to an unrelated buyer for $18,000 in cash. The final K-1 has a $6,000 business loss. With the $4,000 gain on the sale, the activity has an overall loss, so it is not entered on Form 8582: the current loss and the carried loss are allowed in full. Schedule E shows this year's loss on the K-1's row and the carried loss on its own "PYA" row, both in column (g). The return is federal only: Washington has no income tax.

Forms that file: Form 1040, Schedules 1, D and E, Form 8949.

No input documents: the engine has no K-1 document generator. The sale has no 1099-B; the facts record it as a trade fact with the Form 8949 box F decision.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Illian Freight Brokers | box 1 and 5 $95,000; box 2 $11,000 |
| Schedule K-1 (Form 1065), Snow Goose Shipping LP | final K-1; limited partner; box 1 −$6,000 |
| Holding answers | no material participation; all at risk; basis at the start $20,000; carried passive loss $9,000; the entire interest disposed of; gain on the sale $4,000 |
| The sale | acquired 05/01/2018, sold 11/14/2025; proceeds $18,000; basis $14,000; Form 8949 box F |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Partner's basis worksheet lines 1, 11a, 15a (D), 18 | the loss is under the basis | 20,000; 20,000; 6,000 allowed; 14,000 (the basis on Form 8949) |
| Overall gain or loss | −6,000 + 4,000 − 9,000: combine all income and losses, the gain and the prior-year loss included (irs-8582-inst-2025::sec::reporting-an-entire-disposition-on-form-4797-or::b01) | −11,000, an overall loss |
| Form 8582 | an overall loss from an entire disposition is not entered on it; every loss is allowed in full (same block) | does not file |
| Sch E line 27 | a prior-year passive loss not reported on Form 8582 (irs-1040se-inst-2025::sec::prior-year-unallowed-losses-from-a-passive::b01) | Yes |
| Sch E line 28 A (g) | this year's passive loss, not on Form 8582, in the applicable column (irs-1040se-inst-2025::sec::line-28::b01) | 6,000 |
| Sch E line 28 B (a), (g) | the prior-year passive loss on a separate line, "PYA" in column (a), not netted with this year's amounts (irs-1040se-inst-2025::sec::prior-year-unallowed-losses-from-a-passive::b01) | PYA Snow Goose Shipping LP; 9,000 |
| Sch E lines 29b (g), 31, 32, 41 | 6,000 + 9,000 | 15,000; 15,000; −15,000; −15,000 |
| 8949 Part II box F row 1 | 18,000 − 14,000 | 18,000; 14,000; 4,000 |
| Sch D lines 10, 15, 16 | | 4,000 |
| 1040 lines 1a, 7a, 8, 9, 11a | 95,000 + 4,000 − 15,000 | 95,000; 4,000; −15,000; 84,000; 84,000 |
| 1040 lines 12e, 15 | 2025 single standard deduction | 15,750; 68,250 |
| 1040 line 16 | Qualified Dividends and Capital Gain Tax Worksheet: ordinary 64,250 by the tax table (9,055) plus 4,000 at 15% (600) | 9,655 |
| 1040 lines 25a, 34, 35a | 11,000 − 9,655 | 11,000; 1,345; 1,345 |
