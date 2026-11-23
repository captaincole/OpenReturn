# Open questions: Form 7203

Each question has its source and the default the code uses now. The
computation is `figureBasis` in `federal/passThrough/basis.ts`; the corpus
has the December 2022 revision of the instructions (`irs-7203-inst-2025`).

1. **Who files: "an aggregate loss".** The form is filed by a shareholder
   "claiming a deduction for their share of an aggregate loss ... (including
   an aggregate loss not allowed last year because of basis limitations)", or
   who received a non-dividend distribution, disposed of stock, or received a
   loan repayment (irs-7203-inst-2025::sec::who-must-file::b01). Default: any
   loss or deduction item (a charitable contribution included), any carried
   basis loss, a distribution, a loan repayment or a disposal files it, one
   copy for each such K-1. A K-1 with only income and nondeductible expenses
   does not.
2. **The order of nondeductible expenses and losses.** Nondeductible expenses
   come off before losses unless the shareholder elects the reverse order
   under Regulations section 1.1367-1(g) (::basis-limitations::b02 to ::b04).
   Default: no election (item E blank and unsupported); no fact records one.
3. **One total for the loans.** Each formal note takes its own column, and an
   open account another (::part-ii::b01). Default: the holding gives one total
   (balance at the start, new loans, debt basis at the start), printed in
   column (d) only; columns (a) to (c) and the formal note and open account
   boxes are unsupported. Absent loan answers mean no loans; a shareholder
   with loans and no debt basis answer waits.
4. **A loan repayment.** Part II Section C figures the gain on a repayment of
   a loan with reduced basis (::line-34::b01). Default: a K-1 with box 16 code
   E is unsupported, so lines 19, 25, 26 and 32 to 34 are never filled.
5. **A distribution above stock basis.** "If the amount of the distribution
   is more than the stock basis before distributions, report the excess amount
   as a capital gain on Form 8949 ... and Schedule D" (::line-6::b01). The
   engine adds no Form 8949 row from a K-1 (it needs the holding period, box
   C or F, irs-8949-inst-2025::sec::part-ii::b14). Default: Form 7203 still
   prints, and the K-1 stops at the basis stage with the gain in its reason.
6. **Debt basis restoration.** The net increase is line 4 less lines 6, 9 and
   13 and line 47 columns (a) and (b), and restores debt basis up to the face
   of the loan (::line-23::b01, ::line-4::b01). Default: as written, on the
   one total (line 16 less line 21); with several loans the rule's order (a
   repaid debt first, then in proportion) does not arise.
7. **Lines 8 to 14 when line 7 is 0.** The form says to skip them and enter 0
   on line 15, while line 28 still takes nondeductible expenses "in excess of
   stock basis (line 9 minus line 7)" (::line-28::b01). Default: lines 8a to
   14 print blank, and line 28 uses the K-1's nondeductible expenses less line
   7.
8. **Rounding the proportion.** Part III allocates "on a pro rata basis"
   (::part-iii::b01, Regulations section 1.1366-2(a)(4)) and says column (c)
   "can't exceed" line 10 (::part-iii::b02); no block says how to round.
   Default: whole dollars, each running total rounded once
   (`prorateDollars` in `money.ts`), so the parts add up to the basis exactly.
9. **Line 38 holds two items.** "Net capital loss" is one line, but short-term
   and long-term losses keep their character when carried (::part-iii::b01).
   Default: each is its own row in the computation, and line 38 prints their
   sum; the holding carries them as `netShortTermCapitalLoss` and
   `netLongTermCapitalLoss`.
10. **Stock blocks and partial sales.** One form can cover all shares; a
    partial sale or redemption needs two forms (::item-c::b01, ::line-13::b01).
    Default: one form for all of the stock (item C blank); fewer shares at the
    end of the year than at the start stops the K-1 at the basis stage.
11. **Items whose basis effect is not modeled.** Credits (line 8c), credit
    recapture (line 3l), depletion (lines 3j, 8b) and a box the table does
    not know. Default: the computation is unsupported and names the item; such
    a K-1 also has an item with no route.
