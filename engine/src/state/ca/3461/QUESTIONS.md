# FTB 3461: open questions

Each item: the source text, the block id, the default the engine applies, and
whether the default can change a dollar amount. The instructions publish no
example with numbers. The federal Form 461 questions
(`federal/461/QUESTIONS.md`) apply too, where California reads the same
sorting of business and nonbusiness amounts.

1. **Who must file is a bound.** "File form FTB 3461 if ... your net losses
   from all of your trades or businesses are more than $313,000"
   (ca-3461-inst-2025::sec::b-who-must-file::b01). The resolver cannot read
   the lines, so it adds the business losses without any income, as federal
   Form 461 does. California has no $156,500 rule for one line. A carryover
   from 2024 files the form too: line 14b and its rules are on this form.
   Default: the form can file with line 16 at 0 or more. "Do not attach this
   form" then (the form, line 16), but the engine still prints it. Dollars: no.
2. **Line 3 with no Schedule D (540).** Line 3 is Schedule CA line 7a,
   column A minus B plus C. Schedule CA leaves columns B and C a gap when
   Schedule D (540) does not file (`schedule-ca/capitalGain.ts`). Schedule D
   (540) files only with a California difference the engine knows. Default:
   columns B and C are 0, as California AGI already takes them. Dollars: yes,
   when a California capital difference exists that the engine does not
   model.
3. **Which capital loss is a business loss.** "If the loss from your trade or
   business is less than ($3,000), enter the difference between ($3,000) and
   your trade or business loss. Do not enter any loss amount on this line ...
   if the loss from your trade or business is equal to or greater than
   ($3,000)" (::line-11::b01). Federal Form 461 puts every capital loss on
   line 11. Default: the business part is the stated
   `business_loss_limit.business_capital_gain`, the federal amount; it has
   the sign of line 3 and is never larger (`lines.ts`, `capitalSplit`). The
   note is read for any loss on line 3, limited or not. For a gain (or 0),
   the business part is the whole stated business net, gain or loss: the
   federal cap at capital gain net income (irs-461-inst-2025::sec::line-3::b01)
   is a CARES Act rule, and "California does not conform to those
   amendments" (::excess-business-loss-limitation::b01). A $5,000 business
   capital loss and a $15,000 investment gain put $15,000 on line 10, not
   $10,000 (changed 2026-11-24 after the tax review). Dollars: yes, when the California business capital
   amount differs from the federal one, or for a loss line 3 that is not
   limited.
4. **Using the carryover against business income.** Line 14b: "If you have
   excess business loss carryover from prior years on line 14b and do not
   have any current year business loss ... enter the line 14b amount (up to
   the business income amount) on Schedule CA (540) ... line 8z, column B"
   (::line-14b::b01, ::adjustments::b01). Line 15: "When ... line 14a,
   current year business loss (positive number), does not exceed line 15
   ... subtract line 14a (positive number) from line 15 and enter the result
   on ... line 8z, column B ... less than or equal to the amount on line 14b"
   (::line-15::b01). Line 16 carries forward line 14c + line 15. With business
   income and a carryover larger than it, "up to the business income amount"
   uses less than line 16 leaves: $100,000 of income and a $500,000 carryover
   use $100,000, and line 16 carries $87,000, so $313,000 is lost. Default:
   one rule for both, line 14a + line 15, from 0 to line 14b
   (`carryoverUsed`); what is used and what line 16 carries add up to line
   14b. Dollars: yes, only with business income smaller than the carryover.
   The text does not settle it. Line 16 also says: "If there is business
   income in the subsequent year, but not enough to fully offset all of the
   excess business loss carryover, then any remaining balance will continue
   to carryover" (::line-16::b01), which reads as $100,000 used and $400,000
   carried, but the form's own sum on line 16 carries $87,000. The blind fill
   (2026-11-24) took the line 14b words: line 8z column B $100,000, not the
   engine's $413,000, with line 16 at $87,000. The tax review (2026-11-24)
   read it the same way as the blind fill. A person decides; the
   difference here is $313,000 of California AGI. No scenario reaches it:
   nisao has a business loss on line 14a.
5. **"Included as income in prior years".** Line 17 subtracts "the excess
   business loss adjustment amount included as income in prior years"
   (::line-17::b01). The text does not say whether an amount already used in
   an earlier year still counts. Default: the taxpayer states the amount
   (`ca_business_loss_limit.prior_year_adjustments_included`), asked with a
   carryover. Dollars: yes, through the stated amount.
6. **Line 17 equal to the prior adjustments.** The form covers "more than"
   and "less than". Default: equal gives 0, so no adjustment (blank).
   Dollars: no.
7. **Line 16 at 0 or more.** "If the result is zero or greater, you do not
   have excess business loss ... If the result is a negative amount, enter
   it here" (the form, line 16). Settled by the form: line 16 is blank at 0
   or more (changed 2026-11-24 after the blind fill; it printed the signed
   sum before). Lines 17 and 8p still read the sum, so they do not change.
   Dollars: no.
8. **Line 5 with a California adjustment and nonbusiness rentals.** Line 5 is
   Schedule CA line 5, column A minus B plus C. The California adjustment
   (FTB 3801 or FTB 3885A) has no split between business and nonbusiness
   properties. Default: lines 10 to 17 are a gap when Schedule CA line 5 has
   a column B or C amount and Schedule E holds a nonbusiness amount; with no
   nonbusiness amount, the adjustment is all business. Nonbusiness amounts
   are the federal ones. Dollars: no (a gap).
9. **Lines 4 and 6.** Schedule CA lines 4 and 6 come from Form 4797 and
   Schedule F, which have no rules. Default: blank without those forms, a
   gap (and lines 9 to 17 too) when either files. Dollars: no.
10. **Line 8.** "Any other trade or business income, gain, or loss not
    reported on line 1 through line 6" (::line-8::b01). Default: the federal
    Form 461 line 8 answer, at its federal amount. Dollars: yes, when the
    California amount of that item differs.
11. **Form 540NR.** Part I then reads Schedule CA (540NR) column E
    (::line-2::b01 to ::line-6::b01), which the engine does not fill.
    Default: every line is a gap. Dollars: no.
12. **Line 9a column C and line 8z column B with other items.** Schedule CA
    line 9a column C was a gap with no child's income on line 8z. Default:
    with a line 8p column C amount, it adds its rows, a gap row as 0, as
    column B does. Line 8z column B adds the carryover used to a child's
    amount; with another line 8z item it stays a gap. Dollars: yes, when an
    unmodeled line 8 column C item exists.
13. **A carryover with line 14a above line 15.** No block gives a line 8z
    amount then; the carryover goes into line 16, and line 17 subtracts only
    the prior adjustments (::line-17::b01), not the whole carryover. A $650,000
    loss, a $300,000 carryover and $100,000 of prior adjustments give line 17
    $537,000. Default: no line 8z amount; line 17 as written. The blind fill
    read it the same way. Dollars: yes, if another reading is right.
14. **The size of a capital loss on line 11.** "If the loss from your trade
    or business is less than ($3,000)" (::line-11::b01) does not say whether
    it compares sizes or signed numbers. Default: sizes (a $1,000 loss is
    less than $3,000; no business capital loss counts as $0). The blind fill
    read it the same way. Dollars: yes, up to $3,000 on line 11.

## Second opinions

- No published example with numbers (searched the corpus and ftb.ca.gov).
- Blind fill (2026-11-24, 14 cases from the blank form and the
  instructions): every dollar amount matched but three. Line 16 printed a
  positive sum in two cases; the form says to enter only a negative amount,
  so the engine changed (item 7). Line 8z column B with business income
  smaller than the carryover is item 4 (engine default kept). The other
  differences were a blank against 0 on lines 12 and 13 with nothing on
  lines 10 and 11 (the engine leaves them blank).
- PolicyEngine-US 2.153.8 (commit b3edc044): it does not model FTB 3461.
  California AGI there is federal AGI plus additions less subtractions, so
  the federal excess business loss carries into it unchanged, and it has no
  carryover. Its section 461(l) threshold for 2025 is $313,000 and $626,000
  joint, the same as line 15 (::c-definitions::b01). Its federal limit is
  business income plus the threshold, the same shape as lines 14a to 16.
  No lead.
- IRS Direct File: it prepares no California return and no Form 461, so it
  has nothing to compare.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Lines 2, 3, 5 (Schedule CA columns) | stated rule; line 3 with no Schedule D (540) own reading (item 2) |
| Lines 4, 6 | unsupported when Form 4797 or Schedule F files; else blank (stated rule) |
| Line 8 | own reading (the federal answer) |
| Line 9 | stated rule |
| Line 10 | stated rule (capital gain); own reading (rentals, K-1 items at federal amounts) |
| Line 11 | stated rule (the capital loss note); own reading (rentals, K-1 items) |
| Lines 12 to 16 | stated rule (line 16 blank at 0 or more: the form) |
| Line 17 | stated rule; the prior adjustments are a stated answer (item 5) |
| Schedule CA line 8p columns B and C | stated rule |
| Schedule CA line 8z column B | stated rule with a loss (line 15); own reading with business income (item 4) |
| Schedule CA line 9a column C | own reading (item 12) |
