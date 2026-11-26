# Schedule F: open questions

Each item gives the source text, the block id, the default the engine applies,
and whether the default can change a dollar amount. No filled Schedule F with
numbers is in the corpus; the published examples are in
`tests/unit/federal/schedule-f/lines.test.ts`.

## Two texts conflict

1. **Pub. 225's market gain example misprints line 1a.** "He reports the
   $5,000 sale on line 1a and the $4,000 basis on line 1b. After subtracting
   his basis from the sale, Mike will have a $1,200 gain for 2025 on Schedule
   F, line 1c" (irs-pub-225-2025::sec::market-gain::b03). The same block says
   the gain is "$1,200 ($5,200 – $4,000)". Decided: line 1c is line 1a less
   line 1b, as the form says; the engine takes line 1a as stated. Dollars: no.
   `DECISION` comment above `line1c` in `income.ts`; row A33 in
   `docs/rule-decisions.md`.

## Should we do this now

2. **The 1099 amounts are in the farm's totals.** "Include the Form 1099 or
   CCC-1099-G amounts in the total amount reported on that line"
   (irs-1040sf-inst-2025::sec::part-i::b02). The farm fact holds each line's
   total from the farmer's books; no Form 1099-PATR, CCC-1099-G or 1099-A fact
   kind exists, and the 1099-G and 1099-MISC facts' boxes 7, 9 (market gain)
   and 9 (crop insurance) are not read. Default: the stated totals. Dollars:
   no, when the totals include the forms. Not now: a 1099-PATR's box 4
   withholding would not reach Form 1040 line 25b, and the fix is a new
   family of input documents (P1).
3. **Line 5c under the CCC loan election.** "you generally won't have an
   entry on line 5c. But if the amount forfeited is different from your basis
   in the commodity, you may have an entry" (::lines-4a-and-4b::b02, ::b03).
   The text does not say the entry's sign. Default: the amount forfeited less
   the stated basis when the basis is lower; blank when no basis is stated or
   the basis is higher. Dollars: yes, for a forfeit below the basis (the loss
   is not taken on line 5c). Not now: no text says a loss goes on line 5c.
4. **Prepaid farm supplies and prepaid feed.** The 50% limit and the three
   feed tests (irs-1040sf-inst-2025::sec::part-ii::b05, ::b06, ::line-16::b01;
   Pub. 225's $55,000 / $100,000 example) decide what the farmer may deduct in
   2025. Default: lines 16, 17, 26 and 28 take the amounts the farmer states as
   deductible for 2025. Dollars: yes, if a stated amount ignores the limit.
   Not now: the limit needs the prepaid amounts and the prior three years'
   expenses, which no fact holds; Cade asks for the deductible amount.
5. **Lines 15 and 22 take the credits as stated.** Line 15 is reduced by the
   Form 8941 credit (::line-15::b01), line 22 by the credits of Forms 5884,
   8844, 8932 and 8994 (::line-22::b01). The engine fills none of those credit
   forms. Default: the stated credits reduce the lines, never below 0.
   Dollars: no on Schedule F; the credit itself does not reach Form 3800. Done
   for California: a stated credit makes Schedule CA line 6 columns B and C a
   gap (item 15).
6. **Line 21: no business interest limit.** "If you are required to limit
   your business interest expense, include only the amount you are allowed to
   deduct" (::lines-21a-and-21b::b01). Default: the stated interest is the
   deductible amount (a small business taxpayer, gross receipts of $31 million
   or less, ::part-ii::b02). Dollars: only above that size. Not now: Form 8990
   has no rules.
7. **Line 10 needs Form 4562 Part V.** "If you claim any car or truck expenses
   ... you must provide the information requested on Form 4562, Part V"
   (::line-10::b02). Line 10 is figured (70 cents a mile plus parking and
   tolls, or actual expenses); the engine does not fill Form 4562 for a farm.
   Default: line 10 prints; the attachment is missing. Dollars: no. Not now:
   it needs Form 4562 for a farm (P2).
8. **Line 14 is the stated depreciation.** Property placed in service in 2025,
   a section 179 election or amortization that begins in 2025 needs Form 4562
   (::line-14::b02, ::other-schedules-and-forms-you-may::b01). Default: the
   stated depreciation of older property prints; `newDepreciableProperty`
   true makes line 14 and line 34 a gap. Dollars: no. Not now: P2.
9. **Line E No is a gap.** With no prior-year unallowed passive losses, "If
   line 9 is more than line 33 ... subtract line 33 from line 9. The result is
   your net profit" (::line-34::b01). A passive farm's profit is passive
   income on Form 8582 and net investment income on Form 8960, which read no
   farm. Default: line 34 is a gap with line E No, profit or loss. Dollars: the
   whole line. Not now: P3.
10. **Line 49 for the cost methods.** The footnote applies only to the
    unit-livestock-price and farm-price methods. With another method and line
    48 above line 47, "Subtract line 48 from line 47" gives a negative line 49.
    Default: line 49 prints negative; line 50 is the same either way. With line
    48 above line 47 and no method stated, line 49 waits. Dollars: no. Done.
11. **Other expenses that do not fit.** Lines 32a to 32f hold six rows; line
    32f takes the section 263A amount when there is one (::part-ii::b03).
    Default: more rows than fit make the rows a gap; line 33 still adds every
    expense. Dollars: no. Not now: the instructions name no statement for more
    rows, and a second Schedule F is for a second farm, not more rows.
12. **Line 12's limit counts gains from breeding livestock.** "Gains from sales
    of draft, breeding, or dairy livestock are included. Gains from sales of
    assets such as farm machinery ... are not" (irs-pub-225-2025::sec::assessment-for-depreciable::b07).
    Default: line 9 plus the stated Form 4797 livestock gains; never below 0.
    The carryover to 2026 is figured (`conservationCarriedForward`) and not
    printed. Dollars: no. Done.
13. **Schedule SE with only the line 1b rule.** "file Schedule SE (completed
    through line 4c) with your tax return. Enter -0- on Schedule 2 (Form
    1040), line 4" (irs-1040sse-inst-2025::sec::line-1b::b01). Default:
    Schedule SE files and stops at line 4c; Schedule 2 line 4 is blank, not 0.
    Dollars: no. Not now: a 0 on Schedule 2 line 4 changes no tax, and it is a
    change to Schedule 2 for one rare return.
14. **The section 263A amount is already inside lines 10 to 32e.** "If you
    capitalize your expenses, don't reduce your deductions on lines 10 through
    32e by the capitalized expenses. Instead, enter the total amount
    capitalized in parentheses on line 32f" (irs-1040sf-inst-2025::sec::part-ii::b03).
    So `section263ACapitalized` is a part of the expenses the farmer states on
    the other lines, not a further expense. Default: line 32f is the amount in
    parentheses and line 33 subtracts it. Dollars: yes, if a fact states the
    capitalized costs only on `section263ACapitalized` and not in the line
    amounts (blind case 15: $2,000 of supplies with $1,500 capitalized gives
    line 33 $500; a separate $1,500 would give $2,000). Done: Cade must record
    the full expense on its line and the capitalized part here.
15. **Schedule CA (540) line 6 columns B and C.** The adjustments come from
    "depreciation methods, special credits, NOLs, and accelerated write-offs"
    (ca-540-sched-ca-inst-2025::sec::line-6-farm-income-or-loss::b01), and the
    business deductions that differ include the "Employer wage expense for the
    federal Work Opportunity Credit" and the "Small Employer Health Insurance
    Credit" (::business-deductions-related-to::b01). Default: blank when no
    farm deducts depreciation or states a wage credit (`employmentCredits`,
    `smallEmployerHealthCredit`); a gap when one does. Dollars: yes, if another
    California difference applies (none is modeled). Done for the credits;
    not now for depreciation (P2 and FTB 3885F).
16. **FTB 3514 lines 18a to 18e with a farm.** "use the information from the
    schedule with the largest net profit (loss)" (ca-3514-inst-2025::sec::worksheet-3::b01).
    The farm fact holds no business name or address. Default: the lines are a
    gap while a farm is on the return. Dollars: no. Not now: a farm name and
    address are new farm answers that only this line reads.
17. **A cooperative's patron (line 3a).** "You aren't a patron in a specified
    agricultural or horticultural cooperative" is a condition for Form 8995
    (irs-8995-inst-2025::sec::who-can-take-the-deduction::b01), and "If you
    received qualified payments reported to you on Form 1099-PATR from a
    specified agricultural or horticultural cooperative, you must reduce your
    QBI by the patron reduction and use Form 8995-A"
    (::determining-your-qualified-business::b07). The farm fact does not say
    whether the cooperative is a specified one. Default: any line 3a amount
    takes the deduction to Form 8995-A (the same result at or below the
    threshold); the farm asks for its qualified payments
    (`cooperativeQualifiedPayments`, Form 1099-PATR box 7); 0 keeps line 14
    blank; an amount above 0 makes the farm's QBI a gap (`qbi/farms.ts`).
    Dollars: no while the answer is 0. Done; the reduction itself waits for P1.
18. **Patronage dividends in QBI.** Amounts on Form 1099-PATR "aren't
    automatically included in your QBI", only "to the extent they are ...
    reported to you by the cooperative as qualified income items"
    (irs-8995-inst-2025::sec::determining-your-qualified-business::b06).
    Default: line 3b is in the farm's QBI with line 34. Dollars: yes, when the
    cooperative does not report the dividends as qualified items (box 8). Not
    now: it needs the 1099-PATR boxes (P1).

## Pattern change

### Proposals for a discussion

- **P1. Input documents for farm payments.** Before: the farmer states each
  line's total, and the 1099-PATR, 1099-G and CCC-1099-G boxes are not facts.
  After: a Form 1099-PATR fact kind (boxes 1 to 13) linked to its farm, as a
  1099-MISC names its business, with box 4 on Form 1040 line 25b, boxes 6 to
  9 on Form 8995-A and its Schedule D, and the 1099-G boxes 7 and 9 linked the
  same way.
- **P2. Form 4562 for a farm.** Before: line 14 is the stated depreciation,
  and new property makes it a gap. After: a third kind of activity next to the
  business and the rental in `Form4562Activity`, so line 14 comes from the
  farm's assets; FTB 3885A leaves the farm out (California uses FTB 3885F for
  a farm), and the section 179 business income limit adds the farm.
- **P3. A passive farm.** Before: line E No makes line 34 a gap. After: Form
  8582 and Form 8960 read a farm with line E No, as the rentals: its income or
  loss as a passive activity, its prior-year unallowed losses, and Form 8960
  line 4a without the line 4b adjustment; FTB 3801 the same on the California
  side.
- **P4. A spouse's Schedule SE.** Before: a farm (or business) the spouse owns
  on a joint return leaves Schedule SE's must-file answer open. After: a
  second Schedule SE for the spouse, and both spouses' Schedules SE for a
  qualified joint venture.

## Second opinions

- **Blind fill (2026-11-25).** 15 cases filled by hand from the blank form,
  the instructions and Pub. 225: cooperative distributions, the CCC loan
  election both ways, crop insurance deferral, the mileage rate and a wage
  credit, the conservation limit (with a breeding livestock gain), both
  inventory methods of Part III, the at-risk limit, a hedge loss and a
  section 263A amount. No dollar difference and no blank-or-zero difference on
  any of the 15 lines checked. The doubts that can change dollars are items
  3 (line 5c), 12 (line 12's limit) and 14 (the section 263A amount).
- **PolicyEngine-US 2.154.0 (commit 363e9fc5).** It takes Schedule F line 34
  as one input (`farm_operations_income`) and has no formula or constant for
  the lines themselves: no mileage rate, no conservation limit, no CCC loans,
  no Part III. What it does with line 34 agrees with the engine: Schedule SE
  takes it at 92.35% with the $400 floor; it is in gross income, qualified
  business income, the excess business loss limit and EIC earned income (less
  half of SE tax). It also limits the self-employed health insurance deduction
  by farm profit; the engine leaves Schedule 1 line 17 unsupported, so this is
  a scope difference. It does not take Conservation Reserve Program payments
  off Schedule SE (Schedule SE line 1b); the engine follows the Schedule SE
  instructions. No disagreement on a constant or a formula.
- **IRS Direct File.** Not compared: no checkout in reach, and its scope did
  not include Schedule F.
- **Tax review, second pass (2026-11-25).** Every page of daise and edarra
  worked again by hand from the facts: no difference. The farm branches of EIC
  Worksheet B, Form 2441 lines 4 and 5, and FTB 3514 line 18 now have tests
  with a farm amount (no scenario prints one).

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN, A to G) | stated rule |
| Part I lines 1a to 1c | published example with numbers |
| Lines 3a, 3b | stated rule |
| Lines 4a, 4b | published example with numbers |
| Lines 5a to 5c | stated rule (5c with the election: own reading) |
| Lines 6a to 6d | published example (6a, 6b, 6c), stated rule (6d) |
| Lines 7, 8, 9 | stated rule |
| Line 10 | stated rule (2025 rate) |
| Line 12 | published example with numbers |
| Lines 11, 13, 14, 16 to 21b, 23 to 31 | stated rule (stated amounts) |
| Lines 15, 22 | stated rule |
| Lines 32a to 32f, 33 | stated rule |
| Line 34, box 36 | stated rule; Form 6198 published example (6198 tests) |
| Part III lines 37 to 50 | stated rule (line 49 footnote: own reading for the cost methods) |
