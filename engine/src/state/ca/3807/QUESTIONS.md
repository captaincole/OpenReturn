# FTB 3807 — open points

FTB 3807 carries the repealed LAMBRA credits and NOL forward. The engine
fills it for an individual on Form 540. Each point below says what the texts
leave open, what the engine does, and whether it changes dollars.

## Doubts

1. **Schedule P (540) column (a) for code 198.** The texts: Schedule P column
   (a) is "the amount of credit available to offset tax"
   (`ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01`).
   FTB 3807 line 8A column (f) is the credit "used on Schedule P ... The amount
   cannot be greater than the amount on line 8A, column (e) or the amount
   computed on line 8B, column (d)"
   (`ca-3807-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01`).
   Default: column (a) is the credit already limited by line 7, so column (b)
   never passes line 7. Column (d) then carries only the part Schedule P
   limits; FTB 3807 line 9B column (g) carries all of it ("This carryover
   includes both the Schedule P ... limitation and the limitation based on
   LAMBRA business income", `::b04`). Dollars: no tax changes; only Schedule
   P column (d).
2. **One Schedule P line for both credits.** Both credits use code 198
   (`ca-540-sched-p-inst-2025::sec::credit-table::b06`), and "Do not enter the
   same credit code or name on more than one line within a section"
   (`::to-complete-part-iii::b01`). Default: one line, named "LAMBRA", with
   line 1c. The hiring credit takes the line's column (b) first (line 9A
   column (e) is line 8A column (e) less line 8B column (e)). Dollars: none;
   the total is the same either way (`lines.ts`, creditOffered).
3. **Line 6a and the exemption credits.** "Compute the tax as if the former
   LAMBRA taxable income represented all of your taxable income"
   (`ca-3807-booklet-2025::sec::part-i-computation-of-credit-limitations::b02`);
   individuals "Use the tax table or tax rate schedule" (`::individuals::b01`).
   Default: the table or schedule on line 5, with no exemption credit taken
   off. Dollars: yes, the exemption credit ($153 single) when line 6a is the
   smaller line.
4. **Line 1 when Worksheet I line 14 is a loss.** "If the amount is negative,
   you do not have any business income attributable to the former LAMBRA and
   you cannot utilize any LAMBRA NOL carryover or credit carryover(s)"
   (`::located-within-and-outside-the-former-lambra-and-california::b03`).
   Default: Schedule Z line 1 is 0 and every credit carries forward. Dollars:
   none.
5. **Decimal places of line 2.** No text sets them. The combined report
   example prints 73.33% and gets $183,325 from $250,000
   (`::corporations-filing-a-combined-report::b03`). Default: four places, the
   half up, from the unrounded factors. Dollars: under $1 for each $10,000.
6. **Carryover periods are not checked.** A credit "remaining for carryover to
   taxable years beginning on or after January 1, 2014, shall be carried over
   only to the succeeding 10 taxable years"
   (`::lambra-credits-carryover-period::b01`), extended only for the part the
   $5,000,000 limit disallowed (`::general-information::b03`). An NOL carries
   15 or 20 years, extended by each suspension (`::part-iii-...::b03` to
   `::b05`). Default: the engine takes each carryover as last year's form
   states it. Dollars: yes, for a carryover that expired.
7. **NOL deduction above the return's income.** Worksheet II limits the
   deduction to the modified taxable income, which is the LAMBRA business
   income (`::instructions-for-worksheet-ii-...::b02`, `::b05`), not to
   California AGI. Default: no other limit, as the worksheet says. Dollars:
   only when the LAMBRA business income is above California AGI (the
   self-employment tax deduction can do that).
8. **The NOL suspension test.** The booklet repeats FTB 3805V's rule
   (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b01`, `::b02`).
   Default: the engine uses FTB 3805V's test and its decision on disaster loss
   carryovers (`state/ca/3805v/figures.ts`), so a disaster loss does not free
   a LAMBRA NOL. Dollars: yes, above $1,000,000 of income.
9. **The $5,000,000 limit.** Line 1d is 0 when Form 540 line 35 is $5,000,000
   or less: credits cannot reduce that tax by more than $5,000,000. Above it,
   lines 1d and the credit offered on Schedule P are unsupported. The engine
   does not share the limit with other business credits. Dollars: none below
   the limit.
10. **Without Schedule P (540).** A LAMBRA credit attaches Schedule P. With an
    explicit decision that Schedule P does not file, Form 540 lines 43 to 48
    and FTB 3807 Part I are unsupported. FTB 3801-CR and FTB 3804-CR, which
    figure their tax left without Schedule P, do not subtract the LAMBRA
    credit then. Dollars: only with that contrary decision.
11. **Two NOL deductions.** With an FTB 3805V NOL deduction on Schedule CA
    line 9b2, line 9b3 is unsupported: no text orders the two deductions.

## Proposals for a discussion

- **More than one LAMBRA business.** "Attach a separate form FTB 3807 for each
  LAMBRA business" (`::how-to-claim-deductions-and-credit-carryovers::b01`).
  The engine fills one form, so the facts hold one business. A repeating form
  (issue #174) would let each business have its own form, Worksheet I and
  Schedule Z. The credits of all the forms would add on one Schedule P line.
- **Form 540NR.** Line 6b is Form 540NR line 42 and line 3b goes to Schedule
  CA (540NR). Both forms have no rules for this path yet.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, items A to D | stated rule |
| Items E to H | stated rule (operators only) |
| Line 2 (Worksheet I, Section A) | published example with numbers |
| Worksheet I, Section B (Schedule Z line 1, 3) | published example with numbers |
| Part III, Worksheet II (lines 3a to 3c, Schedule Z line 4) | published example with numbers |
| Schedule Z lines 5 to 7 | stated rule; line 6a is own reading (item 3) |
| Schedule Z Part II, lines 1a to 1c | published example with numbers |
| Line 1d | own reading (item 9) |
| Schedule Z line 2, column (c), Parts III and IV | stated rule (blank for an individual) |
| Schedule P (540) Section A2 row | own reading (items 1, 2) |
