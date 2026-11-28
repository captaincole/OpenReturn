# Form 7207 — doubts and defaults

The instructions are `irs-7207-inst-2025` (Rev. December 2025). Each item says
the text, the default the engine applies, and whether it changes dollars.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in
`docs/rule-decisions.md`.

- **The 100:1 battery limit on line 5c (row A131).** The instructions name the
  limit for "a battery module using battery cells" (`line-5-2::b02`). The face
  prints "(limitations apply; see instructions)" for lines 5a to 5c, and the
  regulation applies it to both module kinds (`cfr-26-2025::sec::s1.45x-3::e-5`).
  The engine caps all three rows. Dollars: only for a module with no cells
  whose capacity is more than 100 times its maximum discharge. `lines.ts`.
- **Lines 1c and 1d (row A132).** The face prints line 1c as solar grade
  polysilicon ($3 per kilogram) and line 1d as polymeric backsheet ($0.40 per
  square meter). The instructions list "Line 1c. Polymeric backsheet" and
  "Line 1d. Solar grade polysilicon" (`line-1-2::b01`). The engine follows
  the face, whose units and rates match the statute (45X(b)(1)(C), (D)). No
  dollars change. `components.ts`.

## Should we do this now

1. **Column (d) of a capacity or quantity row keeps 3 decimal places.** Done.
   The form gives no rounding rule for watts, kilowatt-hours, square meters or
   kilograms. Column (e) multiplies the printed column (d), then rounds to the
   dollar. Dollars: under $1, only with fractional quantities.
2. **Column (e) rounds each row; line 8a adds the rounded rows.** Done. The
   form's arithmetic is on lines. Dollars: under $1 per row.
3. **Cents on Part III, Part IV and line 4a.** Done. Neither the form nor the
   instructions say how to round a sales price or a cost with cents. The
   engine rounds each entry to the dollar when it prints it, and the totals
   (Part III total, Part IV line 74) add the printed entries: "Total costs.
   Enter here and on Part II, line 6a, column (d)" is arithmetic on lines.
   Keeping the cents and rounding only the total can differ by $1 on the
   total (costs of $250,000.25, $410,000 and $90,000.49 give 750,000, not
   750,001) and by up to 10 cents before column (e) rounds. The blind fill
   made the same choice.
4. **Line 6b is blank.** Done for a calendar year. Metallurgical coal is an
   applicable critical mineral "For tax years beginning after July 4, 2025"
   (`what-s-new::b01`). A 2025 individual return covers a calendar year that
   began January 1, 2025, so the facility fact has no field for it. A fiscal
   year that begins after July 4, 2025 is not done now: the individual returns
   the engine prepares are calendar years.
5. **Lines 8b and 8c are blank.** Done. They are for an estate or trust (face
   line 8a: "Estates and trusts, go to line 8b ... All others, stop here").
6. **Phase-out and termination do not apply.** Done. The phase-outs start with
   components sold in 2030 (critical minerals produced in 2031), and wind
   components end after 2027 (`special-rules::b05`, `::b06`). No 2025 sale is
   reduced.
7. **The prohibited foreign entity rules do not apply.** Not now: they are
   "for tax years beginning after July 4, 2025" (`special-rules::b03`,
   `::b04`), so they start with 2026 for a calendar year. No input is asked.
8. **Eligibility is the taxpayer's statement.** Done. The facility fact holds
   only eligible components: produced in the United States, sold to an
   unrelated person or under the 45X(a)(3)(B) election, wafers of at least 240
   square centimeters, cells of at least 100 watt-hours per liter
   (`special-rules::b01`, `::b02`; `line-1-2::b01`; `line-5-2::b01`). The
   engine checks only what the numbers show: the battery minimums (12
   watt-hours, 7 kilowatt-hours, 1 for a hydrogen fuel cell vehicle) and each
   inverter line's capacity range (`line-3-2::b01`, `::b02`). An inverter
   outside its range is a gap, because the voltage that also decides the line
   is not stated.
9. **Tin, lines 64 and 65.** Not now: no dollars change when a cost is stated
   once. The instructions describe one mineral, tin purified to low alpha
   emitting tin "which has a purity of greater than 99.99% by mass, and
   possesses an alpha emission rate of not greater than 0.01 counts per hour
   per centimeter square" (`line-6-2::b04`). The form splits it into two
   lines. The engine prints each stated cost on its own line and adds both.
10. **The separate form for pass-through credits.** Done. "On a separate Form
    7207, enter 'Credits From Pass-Through Entities' on line 2 of Part I"
    (`line-7::b01`). The engine prints it only next to a facility's form, or
    alone when the decision `decisions.scope.must_file_7207` is true: a K-1
    alone "don't need to file Form 7207". Form 3800 takes each K-1 credit as
    its own source, so the separate form's line 8a never reaches Form 3800 a
    second time. Each K-1 rounds before line 7 adds, as Form 8586 line 4 does.
11. **An estate's or trust's K-1 credit (box 13 code D) is a gap on line 7.**
    Not now: the pass-through layer has no route for a trust's credits yet
    (see "Pattern change").
12. **A section 48C project.** Done. "You can't claim the advanced
    manufacturing production credit for eligible components produced using
    any property that is part of a facility for which a credit under section
    48C was previously taken" (`line-6::b01`). Line 6 Yes means the stated
    sales leave those components out, as the records must show. Line 6 No
    with a filed Form 3468 Part III property at the same address (or the same
    coordinates) is a gap on line 8a. With no address or coordinates on one
    of them, the facts cannot tell: a gap too.
13. **The elective payment amount is the facility's whole credit.** Done. A
    section 6417(d)(1)(D) election is for the facility (`electing-taxpayers::b01`).
    Form 3800 columns (h) and (j) stay gaps, as for Form 3468.
14. **A transfer.** Done. Its stated amount goes to Form 3800 column (f). More
    than line 8a, a purchased credit on a facility's form, or a transfer next
    to an elective payment is a gap on Form 3800 line 1b (`credit-transfers::b01`).
15. **Part III holds 49 vessels.** Not now: more need "additional Parts III",
    and the copies mechanism repeats a whole form for each facility, not one
    Part. The engine prints one Part III, so the total is a named gap.
16. **A stated Form 3800 line 1b credit with no pass-through entity, next to a
    facility.** Done. Line 8a goes to Form 3800 line 1b once (face Part II line
    8a). A stated line 1b credit that names no entity may be the same credit,
    so the facility's source is a gap, as Forms 8586 and 5884 do. A stated
    credit that names its entity counts on line 7 (item 10).
17. **A malformed facility fact.** Done. The facility is stated, so Form 7207
    files and lists the fact key as a missing input, even when it is the only
    facility: "File a separate Form 7207 for each facility"
    (`general-instructions::b01`). Line 8a stays blank until the fact is whole.

## Pattern change

- **Route an estate's or trust's general business credits.** Before: a Form
  1041 K-1's box 13 codes C, D, E and J have no route to Form 3800
  (`passThrough/routing.ts`), so Form 8586 line 4 and Form 7207 line 7 are
  gaps for them. After: a `form_3800` route for the trust table's credit
  items would fix both; it changes the pass-through layer, so it waits for a
  discussion (see "Proposals for a discussion").

### Proposals for a discussion

- The trust credit route above.

## Confidence by field group

| Field group                                        | Confidence                                              |
| -------------------------------------------------- | ------------------------------------------------------- |
| Lines 1a, 1e, 2b, 3a, 5a, column (d) and (e)       | published example with numbers                          |
| Lines 1b to 1d, 1f, 1g, 2c to 2f, 3b to 3f, 5b, 5c | stated rule (same arithmetic as the examples)           |
| Line 2a and Part III                               | stated rule (`line-2::b01`)                             |
| Line 4a, line 6a and Part IV                       | stated rule (`line-4-2::b01`, `other-minerals::b01`)    |
| Battery limits on lines 5a to 5c                   | stated rule; line 5c by decision                        |
| Line 6b, lines 8b and 8c                           | stated rule: blank for a 2025 individual                |
| Line 7                                             | stated rule (`line-7::b01`); a trust K-1 is unsupported |
| Line 8a                                            | stated rule (face)                                      |
| Part I lines 1 to 6                                | stated rule                                             |
| Header                                             | stated rule                                             |

## Blind fill (2026-11-27)

A preparer filled 14 cases by hand from the blank form and the instructions.
Three cases differ in dollars; the engine stays as it is in each.

- **Case 9, Part IV line 74.** Blind 740,000, engine 750,000. The entries are
  250,000 + 410,000 + 90,000 = 750,000; the blind total is an addition slip,
  and its line 6a and 8a follow from it.
- **Case 12, line 5c.** Blind 9,600 kWh (no limit for a module with no cells),
  engine 4,800 kWh (100:1 limit). Decided above (row A131). The statute
  supports the engine: "the capacity determined under either subparagraph with
  respect to a battery cell or battery module shall not exceed a
  capacity-to-power ratio of 100:1" (`usc-26-2025::sec::s45x::b-4`), and the
  regulation says the same (`cfr-26-2025::sec::s1.45x-3::e-5`).
- **Case 13, line 6b.** Blind $12,500 of coal credit, engine blank. Item 4.

## Second opinions

- **PolicyEngine-US 2.154.2** (commit `c1fea42a`): it does not model the
  section 45X credit, Form 7207 or Form 3800, so it has no constant or formula
  to compare.
- No other reference implementation that the repository names models Form
  7207 (IRS Direct File has no business credits).
