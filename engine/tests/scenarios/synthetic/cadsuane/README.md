# cadsuane — a passive loss that Form 8582 holds back (synthetic)

Cadsuane Melaidhrin is single and lives in Tampa, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

She is a limited partner in two partnerships and works in neither. Tar Valon Boatworks LP has a business loss of $30,000; Caemlyn Apartments LP has rental income of $12,000, a cash distribution, and her share of the building's mortgage, which went down by $10,000. Both are passive. The rental income frees $12,000 of the loss; Form 8582 carries the other $18,000 to 2026. Form 8995 counts only the allowed part of the boatyard's QBI loss and carries it forward. The return is federal only: Florida has no income tax.

Forms that file: Form 1040, Schedules 1 and E, Forms 8582 and 8995.

No input documents: the engine has no K-1 document generator, so the facts are the boxes as Schedule K-1 (Form 1065) would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, White Tower Consulting Group | box 1 and 5 $180,000; box 2 $32,000 |
| Schedule K-1 (Form 1065), Tar Valon Boatworks LP | limited partner; box 1 −$30,000; box 20 code Z: QBI −$30,000 |
| Schedule K-1 (Form 1065), Caemlyn Apartments LP | limited partner; box 2 $12,000; box 19 code A $8,000; item K1 qualified nonrecourse financing $200,000 at the start, $190,000 at the end |
| Holding answers | no material participation in either; not a real estate professional; all at risk; basis at the start $50,000 (boatyard) and $60,000 (apartments); no carried losses |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Boatyard basis worksheet lines 1, 11a, 14, 15a (D), 18 | start; the loss is under the basis (irs-1065k1-inst-2025::sec::line-14::b03) | 50,000; 50,000; 50,000; 30,000 allowed; 20,000 |
| Apartments basis worksheet lines 1, 4b, 7, 3c, 9a, 8a, 10, 11a | start; box 2; 190,000 − 200,000 is a decrease (::line-3e::b01, ::line-9a::b01); box 19A | 60,000; 12,000; 72,000; −10,000; 10,000; 8,000; 18,000; 54,000 |
| 8582 Part V rows 1 and 2 | each K-1 is one passive activity of "all other" kinds (irs-8582-inst-2025::sec::part-v::b01); a limited partner cannot actively participate (irs-1065k1-inst-2025::sec::passive-activity-limitations::b16), so the rental is in Part V | (b) 30,000, (e) 30,000; (a) 12,000, (d) 12,000 |
| 8582 lines 2a, 2b, 2d, 3 | | 12,000; 30,000; −18,000; −18,000 |
| 8582 lines 4 to 9 | Part II needs a loss on line 1d (irs-8582-inst-2025::sec::part-ii-special-allowance-for-rental::b01): no Part IV row | blank |
| 8582 lines 10, 11 | line 2a; line 9 blank plus line 10 | 12,000; 12,000 |
| 8582 Part VII row 1 | the only overall loss: ratio 1.00000, line 3 less line 9 (::part-vii-allocation-of-unallowed-losses::b02) | 30,000; 1.00000; 18,000 |
| 8582 Part VIII row 1 | 30,000 − 18,000 (::part-viii-allowed-losses::b01) | 30,000; 18,000; 12,000 |
| Sch E line 28 A (g); B (h) | Part VIII column (c) (irs-8582-inst-2025::sec::how-to-report-allowed-losses::b04); box 2 passive income (irs-1065k1-inst-2025::sec::box-2-net-rental-real-estate-income-loss::b02, item 4) | 12,000; 12,000 |
| Sch E lines 30, 31, 32, 41 | 12,000 − 12,000 | 12,000; 12,000; 0; 0 |
| 1040 lines 1a, 8, 9, 11a | | 180,000; 0; 180,000; 180,000 |
| 1040 lines 12e, 15 | 2025 single standard deduction | 15,750; 164,250 |
| 8995 lines 1(c), 2 | the statement's QBI times the allowed share of the loss, −30,000 × 12,000 / 30,000 (irs-8995-inst-2025::sec::determining-your-qualified-business::b03) | −12,000 |
| 8995 lines 4, 15, 16 | line 4 is 0 when zero or less; carryforward | 0; 0; (12,000) |
| 1040 line 16 | single schedule on 164,250: 1,192.50 + 4,386 + 12,072.50 + 14,616 | 32,267 |
| 1040 lines 25a, 37 | 32,267 − 32,000 | 32,000; 267 |

Carried to 2026: $18,000 of the boatyard's passive loss (Part VII column (c)).
