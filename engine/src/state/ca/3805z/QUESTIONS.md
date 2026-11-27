# FTB 3805Z: open questions

The enterprise zones ended on January 1, 2014. For 2025 the form only uses
carryovers from before then: the hiring credit, the sales or use tax credit and
the EZ net operating loss (NOL). The engine fills it for an individual on Form
540. No filled example of the 2025 form exists; the booklet's examples with
numbers are unit tests (`tests/unit/state/ca/3805z/lines.test.ts`).

## Two texts conflict

Each is decided by the author, with a `DECISION` comment in the code and a row
in `docs/rule-decisions.md`.

1. **The order in Schedule P (540) Section B2** (row A78,
   `creditUsed.ts`). The zone credit comes after FTB 3541's film credits and
   before FTB 3801-CR's passive credits: a credit with a 10-year carryover
   before the research credit's unlimited one, low-income housing last.
2. **Schedule P (540) column (a) holds the credit up to Schedule Z line 7**
   (row A79, `creditUsed.ts`). The carryover to 2026 is on FTB 3805Z lines 8B
   and 9B column (g); Schedule P column (d) shows only what the tax left could
   not take.
3. **Business credits "before other credits"** (row A80, `creditUsed.ts`).
   The booklet: "Business credits should be applied against 'net tax' before
   other credits" (`ca-3805z-booklet-2025::sec::general-information::b02`).
   Schedule P (540): "complete each section before going to the next section"
   (`ca-540-sched-p-inst-2025::sec::to-complete-part-iii::b01`), with Sections
   A1, A2 and B1 before B2. The engine follows Schedule P. Dollars: only when
   the tax is short.

## Should we do this now

Defaults with no conflicting text, and cases the engine leaves open.

1. **Section A percentages keep four places, the rest dropped.** Done. No text
   gives a rule. The booklet's example prints 66.66% for $800,000 /
   $1,200,000 and 73.33% for the average, and its $183,325 is $250,000 ×
   0.7333 (`ca-3805z-booklet-2025::sec::apportionment::b07`). Dollars: small
   ($8 in the example against full precision).
2. **Line 2 is blank for an investor.** Done. "Individual investors receiving
   pass-through EZ credits, complete Worksheet I, Section B and Schedule Z"
   (`::how-to-claim-deductions-and-credit-carryovers::b01`): no Section A, so
   no percentage. The same block says "All other investors complete Worksheet
   I, Section A", which names no one the engine can tell apart. Dollars: no.
3. **Items E to H are blank for an investor.** Done. "Investors of
   pass-through entities, complete items A through D"
   (`::form-ftb-3805z-instructions-for-items-a-through-h::b01`). Dollars: no.
4. **Line 6a has no exemption credit.** Done. "Compute the tax as if the
   former EZ taxable income represented all of your taxable income", "Use the
   tax table or tax rate schedule" (`::part-i-computation-of-credit-limitations::b02`,
   `::individuals::b01`): the Tax Table or rate schedule on line 5, with no
   exemption credit. Dollars: up to the exemption credit ($153 for a single
   filer), when line 6a is the smaller line.
5. **Line 1d is 0.** Done. Only credit that the $5,000,000 limit disallows can
   be elected refundable (`::line-1d-credit-limitation::b01`). A credit
   available above $5,000,000 is unsupported. The limit counts all business
   credits together; the engine does not add the other business credits to
   this one, as FTB 3541 does not. Dollars: only above $5,000,000.
6. **The credit's name.** Done. The Credit Table lists "Enterprise Zone
   Hiring" and "Enterprise Zone Sales or Use Tax", both code 176
   (`ca-540-sched-p-inst-2025::sec::credit-table::b06`); one line takes both
   (`::credit-code::b01`). The engine prints "Enterprise Zone". Dollars: no.
7. **The NOL suspension test is FTB 3805V's.** Done. The booklet repeats FTB
   3805V's rule: individuals with net business income or modified AGI under
   $1,000,000 are not affected
   (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b01`). The
   engine reads both tests as FTB 3805V does (`state/ca/3805v/figures.ts`).
   Dollars: no change from FTB 3805V's reading.
8. **The age of an EZ NOL is not checked.** Not now: the stated amounts come
   from last year's Worksheet II, which already dropped an expired loss. A
   loss carries 15 years (before 2008) or 20 years, plus the suspension years
   (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b05`). The
   engine takes last year's Worksheet II column (e) as stated, for 2001 to
   2013. Dollars: no, when the stated amounts are right.
9. **FTB 3805V does not see the EZ NOL.** Not now: no text says which NOL
   comes first, and no scenario has both. FTB 3805V's modified taxable income
   starts from California AGI before lines 9b1 and 9b2 (`schedule-ca/line10.ts`);
   line 9b3 is not subtracted there either. Dollars: only with both a general
   and an EZ NOL.
10. **The NOL deduction for AMT (Schedule P (540) line 20).** Not now: it
    needs a person (see "Proposals for a discussion"). Line 16 adds back the
    NOL deductions of Schedule CA lines 9b1 to 9b3 ("16 Net operating loss
    (NOL) deductions from Schedule CA (540), Part I, Section B, line 9b1, line
    9b2, and line 9b3, column B", `ca-540-sched-p-face-2025::sec::face-part-i::b02`),
    and line 20 subtracts the AMT NOL: "use Schedule P ... to compute the NOL
    for alternative minimum tax purposes" (`::alternative-minimum-tax::b01`),
    "Enter on line 20 the lesser of the NOL carryover from Step 2 or 90% of the
    amount on line 19" (`ca-540-sched-p-inst-2025::sec::step-3-amt-nol-deduction-for-the-current-year::b01`).
    Line 20 is unsupported and line 21 reads it as 0, so with Schedule P (540)
    filed (an itemizer, an ISO exercise) and an EZ NOL deducted, AMTI is too
    high by up to the AMT NOL. The same is true on main for FTB 3805V's lines
    9b1 and 9b2. Dollars: 7% of the AMT NOL on the tentative minimum tax; tax
    changes only when the tentative minimum tax is near the regular tax, or
    for a Section A credit. No scenario files Schedule P with an NOL deduction.
11. **The hiring credit takes the tax left first.** Done. Both carryovers
    share one Schedule P (540) line (code 176), and each row's column (f) is
    the credit "used on Schedule P ... column (b)"
    (`::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01`,
    `::b03`). Line 9A column (e) is line 7 less line 8B column (e), so the
    form's order puts the hiring row first: the tax left caps 8A(f) plus 9A(f)
    together, hiring first. Dollars: only the split of the carryover between
    8B(g) and 9B(g), never the credit used.
12. **Schedule Z line 1 holds a loss.** Done. Section B line 14: "If the amount
    is negative, you do not have any business income attributable to the
    former EZ" (`::part-iii-taxpayer-s-trade-or-business::b04`), with no word
    on what line 1 shows. The form face says to enter Section B line 14 column
    (c). The loss prints on lines 1, 3 and 5; line 6a is then $0. Dollars:
    lines 1 and 5 only; line 7 and Part II do not change.
13. **Line 8B column (b) names line 9B.** Done. The booklet says line 8B
    column (b) takes "prior year's Schedule Z, Part II, line 9B, column (g)"
    (`::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01`),
    the same words as line 9B column (b). The hiring carryover is last year's
    line 8B column (g), the row of the same credit. Dollars: no, when the
    stated carryover is right.
14. **FTB 3541 Part IV with an enterprise zone credit.** Done (tax review,
    2026-11-26). The program 4.0 refundable election takes line 21, the tax
    after every nonrefundable credit except program 4.0 ("Subtract any
    non-refundable credits (except program 4.0) from your current year tax
    liability", `ca-3541-inst-2025::sec::part-iv-program-4-0-refundable-credit-election::b02`),
    and the zone credit comes after program 4.0 in Section B2. As for the
    passive, other state and PTE credits, line 21 is unsupported when a zone
    credit carryover above 0 is stated (`3541/partIV.ts`); an EZ NOL alone
    takes no credit and leaves line 21 figured.
15. **Rows past the form's limit.** Not now. Schedule Z has one row for each
    credit, and Worksheet II one row for each loss year from 2001 to 2013; a
    row outside those years is asked again. Schedule P (540) Section B2 has
    lines 16 to 19, and the engine fills 16 to 18: a fourth Section B2 credit
    is a named gap (`NO_SECTION_B2_LINE`, `TOO_MANY_B2_CREDITS`). Line 19 is
    Schedule P's, shared with FTB 3541 and FTB 3801-CR, so it belongs in its
    own change. A second zone business needs a second form (below).

## Pattern change

None in this form. The proposals below would change one.

## Second opinions

- PolicyEngine-US 2.154.1 (commit `0fbed6ddb1`, read 2026-11-26): the
  California variables and parameters (`policyengine_us/variables/gov/states/ca`,
  `parameters/gov/states/ca`) have no enterprise zone credit, no FTB 3805Z and
  no California NOL. Nothing to compare.
- IRS Direct File has no California return, so it has no comparison for this
  form. The repo names no other reference implementation of a California
  credit.

## Blind fill (2026-11-26)

- 14 cases. 40 values differ only as blank against 0: Schedule Z line 4 and
  Side 1 lines 3a to 3c with no EZ NOL (blind blank, engine 0). No value
  differs in dollars.
- The blind doubts that change dollars are items 1 (four places), 11 (the
  carryover split) and 12 (a loss on line 1) of "Should we do this now".

## Proposals for a discussion

- **The AMT NOL deduction (Schedule P (540) line 20).** Before: line 20 is
  unsupported and line 21 reads it as 0, while line 16 adds back every NOL
  deduction, for FTB 3805V and FTB 3805Z alike. After, one of two: (a) facts
  for last year's AMT NOL carryovers (a second FTB 3805V and FTB 3805Z
  figured for AMT) and a line 20 rule from the Schedule P steps; or (b) line
  21 a gap whenever line 16 holds an NOL deduction, with the gap carried
  through Part II lines 22 to 26, Part III line 2 and Form 540 lines 61 and
  64, which now read a blank AMT as "waits". Either changes Schedule P (540)
  and Form 540 for every NOL, so a person picks.
- **Read Worksheet I from the return.** Column (a) of Worksheet I, Section B
  is stated by the taxpayer (wages, Schedule C, K-1 income). The engine could
  read the zone employer's W-2 box 16 and Schedule C line 31 with its Schedule
  CA adjustment instead. That needs a link from a W-2 or business fact to the
  zone business: a change to how facts work.
- **More than one zone business.** "Attach a separate form FTB 3805Z for each
  EZ business" (`::how-to-claim-deductions-and-credit-carryovers::b01`), each
  with its own line 7. The engine has one business fact and one form. Copies
  of the form (as FTB 3804-CR has) with one business fact each would cover it.
- **Entity filers.** Schedule Z Parts III and IV and column (c) are for
  corporations and S corporations, which the engine does not file.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header, items A to D | stated rule |
| Items E to H | stated rule |
| Part I lines 1a to 1c | published example with numbers (Schedule Z Part II example) |
| Line 1d | stated rule (0 below the limit; unsupported above it) |
| Part II line 2 (Section A) | published example with numbers (Corporations A and B); four places is own reading |
| Part III lines 3a to 3c (Worksheet II) | published example with numbers (Worksheet II example) |
| Schedule Z line 1 (Section B line 14) | published example with numbers (the Andersons, three K-1s) |
| Schedule Z lines 2 to 5 | stated rule |
| Schedule Z lines 6a, 6b, 7 | stated rule; no exemption credit on 6a is own reading |
| Schedule Z Part II, lines 8 and 9 | published example with numbers (Schedule Z Part II example) |
| Schedule Z Parts III and IV | stated rule (blank for an individual) |
