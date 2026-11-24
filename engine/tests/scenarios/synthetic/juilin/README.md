# juilin — an excess business loss (synthetic)

Juilin Torvane is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

She manages a shipping company (a W-2) and owns and runs a shipyard, an S corporation. The shipyard's K-1 shows a $650,000 ordinary loss. She also has a consulting business with a profit (Schedule C), capital gain distributions from a fund, a rental house and book royalties that are investments, not a trade or business, and a recovered bad debt of her closed design studio on Schedule 1 line 8z. Her business losses pass the $313,000 threshold, so Form 461 figures an excess business loss of $289,000, and Schedule 1 line 8p adds it back. The return is federal only: Nevada has no income tax.

The K-1 has no section 199A statement, so the only QBI business is the consulting business, which has a profit: the excess holds back no QBI loss, and Form 8995-A computes.

The documents have no PDFs: their facts are the boxes as they would print them. The answers that Form 461 reads: the rental is not a trade or business (`tradeOrBusiness: false`), the royalty is portfolio income, and the $6,000 recovery is business income (`business_loss_limit.other_business_income`).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Sea Folk Shipping Lines, Inc. | box 1 $380,000; box 2 $80,000; box 6 $7,130 |
| Schedule C, Torvane Harbor Consulting | receipts $60,000; expenses $18,000 |
| 1099-DIV, Illian Harbor Growth Fund | box 1a $2,400; box 1b $2,000; box 2a $30,000 |
| Schedule K-1 (Form 1120-S), Tanchico Dry Dock, Inc. | box 1 −$650,000; no statement |
| Holding answers | material participation; all at risk; stock basis at the start $900,000 |
| Rental house, 12 Mayene Street | rents $24,000; expenses $12,000; not a trade or business |
| Book royalty | royalties $2,000; legal fees $3,500; portfolio |
| Schedule 1 line 8z | $6,000 bad debt recovery, from a former business (Form 461 line 8) |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Sch C line 31; Sch 1 line 3 | 60,000 − 18,000 | 42,000 |
| Sch E line 26 | rental 24,000 − 12,000; royalty 2,000 − 3,500 | 12,000 − 1,500 = 10,500 |
| Sch E lines 32, 41; Sch 1 line 5 | the allowed K-1 loss (basis $900,000) | −650,000; −639,500 |
| 1040 line 7a | capital gain distributions, no Schedule D | 30,000 |
| 461 lines 2, 3, 5, 8 | Schedule 1 line 3, 1040 line 7a, Schedule 1 line 5, the recovery (irs-461-inst-2025::sec::line-2::b01 to ::line-8::b01) | 42,000; 30,000; −639,500; 6,000 |
| 461 line 9 | lines 1 to 8 combined (::line-9::b01) | −561,500 |
| 461 line 10 | the capital gain, no business part (::line-3::b01), and the rental's income | 30,000 + 12,000 = 42,000 |
| 461 line 11 | the royalty's loss (::line-11::b01) | 1,500 |
| 461 lines 12, 13 | 42,000 − 1,500; sign reversed | 40,500; −40,500 |
| 461 lines 14, 15, 16 | −561,500 − 40,500; single threshold (::who-must-file::b02); −602,000 + 313,000 | −602,000; 313,000; −289,000 |
| Sch 1 line 8p | line 16 as a positive number (irs-1040-inst-2025::sec::line-8p::b01) | 289,000 |
| Sch 1 lines 9, 10 | 6,000 + 289,000; 42,000 − 639,500 + 295,000 | 295,000; −302,500 |
| 1040 lines 8, 9 | 380,000 + 2,400 + 30,000 − 302,500 | −302,500; 109,900 |
| 1040 lines 10, 11a | half of SE tax 1,125 (all Medicare: wages pass the base) | 563; 109,337 |
| 8995-A line 2 (A) | 42,000 − 563 | 41,437 |
| 1040 lines 13, 14, 15 | 20% of 41,437; 15,750 + 8,287; 109,337 − 24,037 | 8,287; 24,037; 85,300 |
| 1040 line 16 | tax table on 53,300 ($6,646) plus 15% of 32,000 | 11,446 |
| Sch 2 lines 4, 11 | SE tax; 0.9% of 380,000 + 38,787 − 200,000 | 1,125; 1,969 |
| 1040 lines 24, 33, 34 | 11,446 + 3,094; 80,000 + 1,620 (box 6 over 1.45%); refund | 14,540; 81,620; 67,080 |

Form 461 lines 4 and 6 are blank: there is no Form 4797 or Schedule F. Form 8960 files from its upper bound and shows no tax: modified AGI is under $200,000.
