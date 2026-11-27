# Form 2210-F — open questions

The engine fills every field of Form 2210-F for a Form 1040 filer. No IRS
example with numbers exists for this form (the corpus and an irs.gov search,
2026-11-26). Each item names its source text, what the engine does, and whether
it changes dollars.

## Two texts conflict

1. **The decimal of line 7 (row A78 of `docs/rule-decisions.md`).** The form
   face: "Multiply line 6 by 66 2/3% (0.667)"
   (`irs-2210f-face-2025::sec::face-part-ii::b01`). Pub. 225: "66 2/3% (0.6667)"
   (`irs-pub-225-2025::sec::special-rules-for-qualified::b01`,
   `::required-annual-payment::b01`). The engine multiplies by 0.667: a form's
   own text decides how that form is filled. Changes dollars: yes, $3 for each
   $10,000 of line 6 against 0.6667.
   - The statute: section 6654(i)(1)(C) substitutes "66⅔ percent" for "90
     percent" (`usc-26-2025::sec::s6654::i-1`), the exact fraction. Both
     decimals round it up. For `docs/law-findings.md`.

2. **A part of line 13 paid before the rest.** The form has one date: "Enter
   the date the amount on line 13 was paid or April 15, 2026, whichever is
   earlier" (`irs-2210f-face-2025::sec::face-part-iii::b01`). The engine takes
   the day the whole of line 13 is paid (`line14Day` in `lines.ts`), so an
   earlier part does not shorten the count. Changes dollars: yes, a few dollars
   when a part is paid early.
   - The statute counts each part on its own: the period runs "with respect to
     any portion of the underpayment, the date on which such portion is paid"
     (`usc-26-2025::sec::s6654::b`, (b)(2)(B)). For `docs/law-findings.md`.
   - Form 2210's worksheet does the same: "If more than one payment was
     required to fully satisfy an underpayment amount, make a separate
     computation for each payment" (`irs-2210-inst-2025::sec::line-4::b01`).
     That text is for Form 2210, and the Form 2210-F instructions are silent,
     so the form's own line 16 arithmetic stands. The blind fill raised it (its
     case 12): line 13 $9,008, $3,000 paid February 5 and the rest April 10.
     The engine: $147 (one count of 85 days). A count for each part: $110.
     Unit test: "a part paid early" in `tests/unit/federal/2210-f/lines.test.ts`.

3. **No 2024 tax, and no 2024 return (row A79 of `docs/rule-decisions.md`).**
   The exceptions: "You had no tax liability for 2024 ... and your 2024 return
   was (or would have been had you been required to file) for a full 12
   months" (`irs-2210f-inst-2025::sec::exceptions-to-the-penalty::b01`). Line
   10: "If you didn't file a return for 2024 ... enter the amount from line 7 on
   line 11. However, see Exceptions to the Penalty, earlier" (`line-10::b02`).
   The engine applies the exception through line 10, as Form 2210 does (row
   7): a recorded 2024 tax of 0 gives no penalty, and
   `prior_year.no_twelve_month_return` figures one from line 7. Changes
   dollars: yes, the whole penalty. The blind fill (its case 6, "neither spouse
   had to file") took the exception and owed nothing; the engine was given "no
   12-month return" and figured $90. With a 2024 tax of 0 it also owes nothing.
   The engine has no fact for full-year citizenship or residence.

## Defaults with no conflicting text

1. **Line 14 with no stated day.** The engine uses the dated estimated tax
   payments after January 15 (date order), then
   `farmer_estimated_tax.underpayment_paid_on`, else April 15, 2026, the
   latest day the line allows. A payment with the return or the extension
   payment has no date in the facts, so Cade records the day. Changes dollars:
   yes, the penalty is the highest when the day is not known.

2. **The waived amount has no box.** "Enter the amount you want waived in
   parentheses on the dotted line to the left of line 16"
   (`irs-2210f-inst-2025::sec::waiver-of-penalty::b01`). The blank PDF has no
   field there, so the amount does not print; line 16 is the penalty less it.
   The statement and the documents the waiver needs are not printed either.
   Changes dollars: no.

3. **A request to waive the whole penalty.** The fact `waiver_request` is
   "entire" or "part" (shared with Form 2210). "entire" waives all of line 16,
   so line 16 is 0 and Form 1040 line 38 is blank. Changes dollars: no.

4. **Box A only with an underpayment.** The waiver is for "an underpayment on
   line 13" (`waiver-of-penalty::b01`), and the note at line 11 and line 13 say
   "Don't file Form 2210-F unless you checked box B". So box A is clear when
   line 13 is 0, and the form then leaves the return. Changes dollars: no.

5. **Box B and the stops.** Lines 3, 6 and 9 say "don't file Form 2210-F", and
   the March 2 exception says "You won't have to pay the penalty or file this
   form" (`irs-2210f-inst-2025::sec::exceptions-to-the-penalty::b01`). Both
   boxes are clear then. The stops at the line 11 note and at line 13 keep box
   B. Changes dollars: no.

6. **Household employment taxes on line 2.** They count unless no income tax
   was withheld and "you wouldn't be required to make estimated tax payments
   even if the household employment taxes weren't included" (`line-2::b01`).
   The engine reads "required" as: without them the form reaches line 12 (line
   8 less than line 11). The same reading as Form 2210. Changes dollars: only
   for a household employer with no withholding.

7. **Section 965.** "You may exclude the amount of your section 965 net tax
   liability" (`line-1::b01`, `line-10::b02`). Form 1040 line 22 holds no
   section 965 amount in the engine (Schedule 2 line 20 is not in the total),
   and the 2024 tax is the taxpayer's answer. Nothing is taken out. Changes
   dollars: no.

8. **Section 1062.** Line 4 adds 75% of the applicable net tax liability of a
   section 1062(a) election (`line-4::b01–b02`). The engine has no Form 1062,
   so the taxpayer states the liability
   (`farmer_estimated_tax.section_1062_net_tax_liability`). Changes dollars:
   yes, with an election.

9. **The credit for tax paid to the USVI (Form 8689).** "You can include that
   credit here" on line 8 (`line-8::b01`). The engine has no Form 8689, so
   line 8 never includes it. Changes dollars: only for such a filer.

10. **Form 1040-NR and Form 1041 lines.** The engine fills Form 2210-F for Form
    1040 only. Changes dollars: no for a Form 1040 filer.

11. **Who files with no 2024 answer.** A farmer on a 2025 joint return files
    the form and waits for `prior_year.filed_joint_return`: box B turns on it.
    A joint 2024 return then takes the form off (unless box A applies). A
    single 2025 filer is asked only when Cade records a 2024 joint return, as
    for Form 2210 box E. Changes dollars: no; Form 1040 line 38 waits for the
    answer.

12. **Who is a farmer.** The two-thirds test reads the taxpayer's
    `farmer_or_fisherman.gross_income_<year>` facts (shared with FTB 5805F).
    The engine does not add up gross income from the return: Pub. 225 and Pub.
    505 count items the forms do not separate (crop shares, livestock gains,
    crew pay). Changes dollars: no, given the stated facts.

13. **Lines 3 and 9 do not stop the arithmetic.** They say "you don't owe a
    penalty; don't file Form 2210-F" but not "stop"; line 6, the note at line
    11 and line 13 say "stop" (`irs-2210f-face-2025::sec::face-part-ii::b01`).
    The exceptions say "complete lines 1 through 9"
    (`exceptions-to-the-penalty::b01`). So lines 4 and 6 fill after a line 3
    under $1,000 (line 6 then stops), and lines 10 to 13 fill after a line 9
    under $1,000, with no Part III. The form leaves the return either way.
    Changes dollars: no. (Changed after the blind fill, its cases 3, 4 and 10.)

14. **A federally declared disaster.** "Don't file Form 2210-F if your
    underpayment was due to a federally declared disaster"; the IRS applies
    the relief itself (`waiver-of-penalty::b03`). The engine has no fact for
    it: a waiver request with a reason figures the penalty less the amount
    asked, as for any casualty. Changes dollars: yes, for a filer in a covered
    area, whose whole penalty the IRS waives. Cade should not record a waiver
    request for such a disaster.

15. **The 2024 overpayment applied to 2025.** The Form 2210-F instructions do
    not name it. The engine counts
    `estimated_tax.prior_year_overpayment_applied` on line 12 as paid by
    January 15, 2026. Pub. 505: "If you timely file your 2024 return, treat
    the credit as a payment made on April 15, 2025"
    (`irs-pub-505-2025::sec::credit-an-overpayment::b01`). The engine does not
    check that the 2024 return was filed on time. The blind fill agrees (its
    case 13). Changes dollars: yes, when there is one.

16. **The March 2 exception needs both steps.** "You file your return and pay
    the tax due by March 2, 2026" (`exceptions-to-the-penalty::b01`). The
    engine asks one yes-or-no answer
    (`farmer_estimated_tax.filed_and_paid_by_march_2`) and does not infer it
    from the day the tax was paid. Changes dollars: yes, the whole penalty,
    when Cade records the answer wrongly.

## Second opinions

- **Blind fill** (15 cases, from the blank form and instructions only): four
  differences after the first run, all settled.
  - Cases 3 and 10, lines 4 and 6, and case 4, lines 10 and 11: the engine
    stopped at lines 3 and 9; the form says "stop" only at line 6, the line 11
    note and line 13. The engine now fills them (item 13). No dollars change.
  - Case 6, lines 14 to 16 ($90 against no penalty): the inputs differ, not the
    rule. The blind fill read "neither spouse had to file" as no 2024 tax; the
    engine was given "no 12-month return". With a 2024 tax of 0 the engine
    owes nothing too (conflict 3, row A79).
  - Case 12, line 16 ($147 against $110): the blind fill made a separate count
    for each part, from Form 2210's worksheet. The form's line 16 has one
    count; the engine keeps it (conflict 2).
  - Blind doubts with no dollar change (box A with no penalty, box B with a
    blank line 10, rounding the penalty before the waiver, 0 against blank on
    lines 4 and 8) match the engine's defaults.
- **PolicyEngine-US 2.154.1** (commit 0fbed6ddb1, 2026-11-26): a search of
  `variables/gov/irs` and `parameters/gov/irs` finds no 2210, 2210-F,
  underpayment, farmer or fisher variable. It does not model the estimated tax
  penalty, so the 66 2/3% share, the $1,000 floors, the January 15 due date and
  the 7% rate were not compared.
- **IRS Direct File** (IRS-Public/direct-file, commit e365f9f): its fact
  dictionary (`backend/src/main/resources/tax`) has no Form 2210 or 2210-F,
  underpayment, farmer or estimated tax penalty fact. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Box A, box B | stated rule |
| Lines 1, 2, 3, 4, 6, 8, 9 | stated rule (lists shared with Form 2210) |
| Line 7 | stated rule; decimal decided (row A78) |
| Lines 10, 11, 12, 13 | stated rule |
| Line 14 | stated rule; partial payments by own reading |
| Lines 15, 16 | stated rule; no published example |
| The two-thirds test | published example with numbers (Pub. 225 examples 1 and 2) |
