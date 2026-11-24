# Form 461: open questions

Each item: the source text, the block id, the default the engine applies, and
whether the default can change a dollar amount.

1. **Who must file is a bound.** "File Form 461 if ... (i) your net losses
   from all of your trades or businesses are more than $313,000 ($626,000 ...),
   or (ii) you would report a loss of more than $156,500 on any one of Form
   461, lines 1 through 8" (irs-461-inst-2025::sec::who-must-file::b01). The
   resolver cannot read the lines, so it adds the business losses without any
   income (`passThrough/excessBusinessLoss.ts`). Default: the form can file
   when the lines net below both limits. Line 16 is then 0 or more, and
   Schedule 1 line 8p stays blank. Dollars: no.
2. **Which capital gains are business gains.** Gains count only up to "the
   lesser of ... capital gain net income limited to only gains and losses
   attributable to a trade or business, or ... capital gain net income"
   (::line-3::b01, ::who-must-file::b02). The engine cannot tell a business
   capital asset from an investment. Default: the answer
   `business_loss_limit.business_capital_gain`; absent means no capital gain
   comes from a business, so the whole gain goes on line 10. Dollars: yes,
   when a K-1 or a sale holds a business capital gain and no answer says so.
3. **Pub. 225 counts Form 8949 business losses.** "Business gains and losses
   reported on Form 4797 and Form 8949 are included" (irs-pub-225-2025::sec::excess-business-loss::b01).
   The Form 461 instructions say "Losses from sales or exchanges of capital
   assets are not included" (::line-3::b01, ::line-11::b01). Default: the
   Form 461 instructions; every capital loss goes on line 11. Dollars: yes,
   for a business capital loss.
4. **Rentals, royalties and K-1 rentals.** A trade or business is decided by
   "facts and circumstances" (::who-must-file::b03); for a partnership or an
   S corporation "at that entity's level". Default: a rental property reads
   its fact's `tradeOrBusiness` (the section 162 answer Form 8960 reads); a
   portfolio royalty is not a business, a passive or nonpassive royalty is; a
   K-1 rental item reads `business_loss_limit.k1_rental_trade_or_business.<id>`.
   The lines wait while an answer is missing. Dollars: no (the taxpayer
   answers).
5. **A trust K-1.** The instructions put estates and trusts on line 5
   (::line-5::b01) but do not say whose trade or business a beneficiary's
   box 6 is. Default: box 6 (ordinary business income) is business, box 5
   ("other portfolio and nonbusiness income") is not, boxes 7 and 8 read the
   rental answer. Dollars: yes, for a box 6 amount.
6. **Guaranteed payments.** Not named in the instructions. A partner is not
   an employee, so they are not "services of an employee" (::who-must-file::b02).
   Default: business income. Dollars: yes, when a K-1 has guaranteed payments.
7. **Line 8.** "Any other trade or business income, gain, or loss not
   reported on lines 1 through 7 that you reported on your tax return"
   (::line-8::b01). The engine cannot find such an amount by itself.
   Default: the answer `business_loss_limit.other_business_income`; absent
   means none. Dollars: yes, when such an amount exists and no answer says so.
8. **Lines 4 and 6.** Schedule 1 lines 4 and 6 come from Form 4797 and
   Schedule F, which have no rules. Default: blank without those forms; a gap
   (and lines 9 to 16 too) when either files. Dollars: no.
9. **Rounding of K-1 rental amounts.** Line 10 or 11 adds each K-1's
   nonbusiness items by sign, rounded once per K-1. Schedule E rounds per row
   and column. Default: the K-1 rounding. Dollars: at most $1 per K-1.
10. **The excess and QBI.** Losses "suspended by ... 461(l)" are not QBI this
    year (irs-8995-inst-2025::sec::determining-your-qualified-business::b02),
    but no rule says which business's loss the excess is. Default
    (`qbi/excessBusinessLoss.ts`): with an excess and a QBI business with a
    loss, the QBI lines are a gap; with no losing QBI business the excess
    holds back no QBI. Dollars: no (a gap).
11. **The excess and Form 1116.** Line 16 adds back the disallowed loss "to
    the extent it is attributable to the separate category"
    (irs-1116-inst-2025::sec::line-16::b01). Default: with an excess, Form
    1116 line 16 is a gap. Dollars: no (a gap).
12. **Farming losses.** The threshold goes "first to the farming losses"
    (::ordering-rules::b01). Schedule F has no rules, so it is a gap (item 8).
    Dollars: no.
13. **California: needs a person.** Schedule CA line 8p column A copies
    Schedule 1 line 8p, as line 9a column A does. "Enter the amount from
    form FTB 3461, line 16 or line 17, whichever applies, on line 8p, column
    C ... Enter the amount of the federal excess business loss adjustment
    included on line 8p, column A, on line 8p, column B"
    (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04). FTB 3461 has
    no rules, so column C is a gap; column B is a gap too, because alone it
    would take the federal add-back out of California income. A gap counts
    as 0 in a total, so California AGI keeps the federal add-back: it is
    right only when FTB 3461 line 16 equals Form 461 line 16. They differ
    with a California business amount that differs from the federal one, or
    a California carryover on FTB 3461 line 14b (California carries the
    disallowed loss as an excess business loss, not an NOL;
    ca-3461-inst-2025::sec::line-16::b01). Default: California AGI computes
    on that assumption. The choice: give FTB 3461 its rules, or make
    California AGI wait while Schedule 1 line 8p holds an amount (a change
    to Form 540). Dollars: yes, when FTB 3461 differs from Form 461.

14. **A nonbusiness capital loss inside a positive line 3.** Line 3 holds
    the net of business and investment trades. "Losses from sales or
    exchanges of capital assets are not included ... added back on line 11",
    but gains "should not exceed the lesser of capital gain net income limited
    to only gains and losses attributable to a trade or business, or capital
    gain net income" (::line-3::b01). Example: line 3 is $40,000, business
    trades net $60,000, investment trades net -$20,000. Default (`lines.ts`,
    `capitalAdjustment`): apply the cap; the business gain counts as $40,000
    and lines 10 and 11 stay blank. Adding the -$20,000 back on line 11 would
    count $60,000, above the cap. The blind fill chose the same. Dollars: yes,
    $20,000 on line 14 in the example.
15. **The threshold for married filing separately, head of household and a
    qualifying surviving spouse.** "$313,000 ($626,000 for taxpayers filing a
    joint return)" (::who-must-file::b02). Settled by the text: $313,000 for
    every status but a joint return. The blind fill agreed. Dollars: no.

## Second opinions

- **Blind fill (14 cases, 2025).** No dollar difference with the engine.
  Lines 12 and 13 differ only as blank against 0 (cases 1, 5, 7, 8, 9: the
  engine leaves them blank when lines 10 and 11 are blank; "Subtract line 11
  from line 10", ::line-12::b01, gives no amount to enter).
- **PolicyEngine-US 2.153.8 (commit b3edc04).** `excess_business_loss`,
  `net_business_loss`, `limited_business_loss`, parameter
  `gov.irs.ald.loss.max`. The 2025 threshold agrees ($313,000; $626,000 joint
  only; $313,000 for a qualifying surviving spouse). The formula agrees:
  business losses over business income plus the threshold, wages left out.
  Three scope differences, where the IRS text decides for the engine: it
  counts every rental and estate amount as business (the engine asks, per
  ::who-must-file::b03, and keeps trust box 5 out, item 5); it leaves every
  capital gain out (the engine counts the business part up to the cap,
  ::line-3::b01); it counts Schedule F and Form 4797 amounts, which are
  gaps here (item 8). No engine change.
- **IRS Direct File.** Not compared: no checkout in the repo, and Direct File
  did not support business income, so it has no Form 461 logic.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Lines 2, 3, 5 (copies of the return's lines) | stated rule |
| Lines 4, 6 | unsupported when Form 4797 or Schedule F files; else blank (stated rule) |
| Line 8 | own reading (an answer the taxpayer gives) |
| Line 9 | published example with numbers (2024 TaxAct output) |
| Line 10 | stated rule (capital gains); own reading (rentals, K-1 items) |
| Line 11 | published example with numbers (capital loss); own reading (rentals, K-1 items) |
| Lines 12 to 16 | published example with numbers |
| Schedule 1 line 8p | published example with numbers |
| QBI forms, Form 1116 line 16 | unsupported with an excess (no rule settles the split) |
