# Form 7211 — open doubts

The form and its instructions (Rev. December 2025) leave these points open.
Each says the source text, the default the engine applies, and whether it
changes dollars. The decisions with two conflicting texts are rows A110 to
A112 of `docs/rule-decisions.md`.

## Doubts

- **The 2025 rate is not in the instructions.** The instructions say the
  factor is "published in the Federal Register (FR). For more information, see
  90 FR 41477" (`irs-7211-inst-2025::sec::applicable-amount::b02`). That notice
  (FR Doc. 2025-16249) gives the factor 1.9971 and the amounts 0.6 cents and 3
  cents. The engine commits the factor and figures the amounts with the
  instructions' rounding; a test checks both against the notice. The notice is
  not in the corpus. No dollar change.
- **Line 2 stays blank.** "Enter the calendar year related to the kWh on line 1
  or line 2" (`irs-7211-inst-2025::sec::part-ii-clean-electricity-production::b01`).
  An individual's tax year is calendar year 2025, so every kWh is on line 1. A
  fiscal year would need the 2026 factor; the engine has none. No dollar change
  for a calendar-year return.
- **Line 7: more than one Yes box.** "Check the appropriate box on line 7"
  (`irs-7211-inst-2025::sec::line-7::b01`). The statement for the alternative
  amount lists one item for each box that is checked (`::b01`, `::b02`). The
  engine checks every box that applies (a, b, c), and d only when none does. No
  dollar change: any Yes gives the alternative amount.
- **Line 7b comes from line 3.** The box says "the facility's construction
  began before January 29, 2023" (`irs-7211-face-2025::sec::face-part-i::b01`).
  The engine checks it from the line 3 date, so the two lines agree. No dollar
  change.
- **Line 9 for an individual.** An individual cannot make the section 6417
  election for this credit: only applicable entities can, and the credits a
  taxpayer may elect for are 45Q, 45V, 45X and 48D
  (`irs-3800-inst-2025::sec::elective-payment-of-certain-business-credits::b01`,
  `::b03`). So line 9 is line 8b, and an elective payment on the fact makes
  line 9 a gap. The form and the instructions also name different exceptions:
  the form says "section 45Y(g)(12)(B)(ii)"
  (`irs-7211-face-2025::sec::face-part-ii-2::b02`); the instructions say "does
  not have a maximum net output of less than 1 megawatt ... or meet an exception
  under section 45Y(g)(12)(D)" and add 0% for construction after 2025
  (`irs-7211-inst-2025::sec::line-9-2::b01`). The engine applies neither, since
  no individual reaches the phaseout. No dollar change for an individual.
- **Line 10 next to a facility only.** "If the only credit allocated to you is
  the clean electricity production credit, don't report the credit on Form
  7211. Instead, report the credit directly on Form 3800, Part III, line 1gg"
  (`irs-7211-inst-2025::sec::line-10::b01`). The engine reads this as "a
  taxpayer whose only source is a pass-through entity", as the general
  instructions say (`general-instructions::b01`). With a facility, the separate
  form prints the K-1 credits on line 10; Form 3800 keeps each K-1 as its own
  row, so line 1gg counts it once. No dollar change.
- **A trust's credit (Form 1041 K-1 box 13 code E).** The pass-through layer
  routes no trust credit yet, so line 10 is a gap when a trust K-1 has it, as
  Form 8586 line 4 is. Changes dollars only for a beneficiary.
- **The same facility on Form 3468.** "You can't claim a section 45Y credit for
  the same qualified facility for which you are claiming a credit under section
  45, 45J, 45Q, 45U, 48, 48A, or 48E for the tax year or any prior tax year"
  (`irs-7211-inst-2025::sec::how-to-claim-the-credit::b01`). The facility fact
  answers it (`otherCreditClaimed`); the engine also makes line 11 a gap when a
  Form 3468 Part V or Part VI property has the same address, coordinates or
  registration number. A property at another place is taken as another
  facility.
- **Placed in service before 2025.** A qualified facility is "placed in service
  after 2024"; an older one qualifies only for a new unit or added capacity, "to
  the extent of the increased amount of electricity produced"
  (`irs-7211-inst-2025::sec::applicable-amount::b04`). The engine does not split
  the output, so line 11 is a gap. Changes dollars for such a facility.
- **Line 2b has two widgets.** The engine prints the address on the first and
  the technical description on the second
  (`irs-7211-inst-2025::sec::lines-2b-and-2c::b01`). No dollar change.
- **The prohibited foreign entity rules** apply to tax years beginning after
  July 4, 2025, and the material assistance rule to construction after 2025
  (`irs-7211-inst-2025::sec::what-s-new::b01`, `::b02`). A calendar 2025 return
  and a facility in service in 2025 meet neither, so the engine asks nothing.
- **The bond ratio** keeps every digit and prints 6 places, Form 3468's
  decision (`3468/lines.ts`), since the two forms state the same fraction. No
  dollar change beyond the rounding of line 6b.
- **Where the lines round.** The form does not say. The engine rounds each
  dollar line to the nearest dollar (lines 1(c), 5a, 6b, 6c, 8a), and each
  later line uses the rounded amounts, as Form 3468 does. Changes dollars by
  $1 at most: in the `tad` case line 5a is $3,853.50, printed $3,854. The blind
  fill rounded at the same points.
- **The two boundaries of line 7.** Box 7b says construction "began before
  January 29, 2023" (`irs-7211-inst-2025::sec::applicable-amount::b01`), so a
  start on January 29, 2023 takes the base amount. Box 7a says "less than 1
  megawatt", so 1 MW exactly takes the base amount; the fact holds the answer
  as a yes or no. Changes dollars (the base amount is one fifth of the
  alternative), but the text is plain; the blind fill read both the same way.

## Statute read (2026-11-27)

The law library was read for the three decisions (rows A110 to A112). The
statute agrees with the form each time, so nothing goes to
`docs/law-findings.md`.

- Line 5a: "the applicable amount ... shall be increased by an amount equal to
  10 percent of the amount otherwise in effect" (`usc-26-2025::sec::s45y::g-7`).
- Line 8a: "increased by an amount equal to 10 percent of the amount so
  determined (as determined without application of paragraph (7))"
  (`usc-26-2025::sec::s45y::g-11-A`; the regulation says the same,
  `cfr-26-2025::sec::s1.45y-1::b-5`). That is the form's 0.0909091 on line 7.
- Lines 6a to 6d: "Rules similar to the rules of section 45(b)(3) shall
  apply" (`usc-26-2025::sec::s45y::g-8`), "the lesser of 15 percent or a
  fraction" of bond proceeds over capital account additions, "for the taxable
  year and all prior taxable years" (`usc-26-2025::sec::s45::b-3`).

## Second opinions

- **PolicyEngine-US 2.154.1** (commit 0fbed6dd, 2026-11-26): it does not
  model section 45Y. Its IRS variables and parameters have no clean
  electricity, energy community, domestic content or prevailing wage terms,
  so it cannot check a constant or a line here.
- **Other projects:** the repository names no other reference implementation.
  IRS Direct File does not cover business credits.
- **Blind fill** (14 cases, from the blank form and the instructions only):
  every line matched the engine, with no difference in dollars or in blank
  against 0. The blind preparer took the 2025 amounts from Form 8835's section
  45 rate, as the notice was not in the corpus; the notice's factor (1.9971)
  gives the same 0.6 and 3 cents.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header, Part I lines 1 to 9 | Stated rule |
| Line 1 column (b), the 2025 amounts | Published numbers (90 FR 41477) |
| Lines 1(a), 1(c), 3, 5a, 5b | Stated rule (form arithmetic) |
| Lines 6a to 7 | Stated rule, Form 3468's arithmetic |
| Lines 8a, 8b | Stated rule (form arithmetic, row A112) |
| Line 9 | Own reading: line 8b for an individual; elective payment unsupported |
| Line 2 | Own reading: blank for a calendar-year return |
| Lines 10, 11 | Stated rule; a trust's code E unsupported |
| Lines 12, 13 | Stated rule: blank (cooperatives, estates and trusts only) |
