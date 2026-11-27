# Form 3468 — open questions

The rules follow the 2025 form (`irs-3468-face-2025`) and its instructions
(`irs-3468-inst-2025`). The instructions publish one example with numbers:
the Part II basis reduction (`part-ii-qualifying-advanced-coal::b02`). The
decisions with two conflicting texts are rows A96 to A100 of
`docs/rule-decisions.md`, each with a `DECISION` comment in the code.

## Doubts with no conflicting text

1. **An individual makes no elective payment under section 6417.** Lines 8
   and 30 are for an elective payment election "for applicable entities"
   (`line-8::b01`, `line-30::b01`; `applicable-entities::b01`). The engine
   enters line 7 on line 8 and line 29 on line 30. An elective payment stated
   on Parts III, V or VI is a gap on the part's total line. Part IV, the
   section 48D election, is open to any taxpayer (`elective-payment-under-section::b01`).
   Dollars: no.
2. **A transfer is for Parts III, V and VI only** (`credit-transfers::b01`). A
   transfer on another part is a gap on its total line. Dollars: no.
3. **A rehabilitated building outside its 5 years.** Line 1j is "allowed
   ratably over a 5-year period beginning in the tax year that the qualified
   rehabilitated building is placed in service" (`line-1j::b01`). A building
   placed in service before 2021 gets 0 on line 1j. Dollars: yes, but such a
   building files no Form 3468 for 2025.
4. **A building that is not substantially rehabilitated** (line 1f not more
   than the greater of $5,000 and line 1e, `part-vii-rehabilitation-credit-under::b02`)
   is not a qualified rehabilitated building. Line 1j is 0. The form has no
   line for the test. Dollars: yes.
5. **Progress expenditures for a building not yet in service** (the section
   47(d)(5) election, line 1c). The instructions do not say how the 5-year
   ratable rule applies. Line 1j and line 3 are unsupported. The same for
   Parts II to VI: a property not placed in service in 2025 is a gap.
6. **Percentages print without "%".** The form prints "%" after each
   percentage box, so the box holds "30", "7.5" or "1.2". Lines 1l, 3h, 11k,
   17h and 23h have no printed "%"; they print "7.5%". Dollars: no.
7. **Part I prints only the lines the instructions' table names for the part**
   (`part-i-information-on-qualified::b02`). A stated answer on another line is
   not printed. Dollars: no.
8. **Line 3d** fills its comb boxes: the latitude's degrees in 2 digits, the
   longitude's in 3 ("097"), and 6 digits after the point. Dollars: no.
9. **Part V Section A capacity.** When more than one of lines 12a(i), 12b and
   12c(ii) is filled, the low-income lines read the solar entry first, then
   wind, then other. Dollars: only for a facility with two kinds.
10. **Section M with box 8a or 8d.** The form gives a rate for 8b and 8c only.
    Any answer but 8b takes the lower rate. Dollars: yes, for an unusual answer.
11. **Section C line 5a** has no beginning-of-construction caution: its basis
    is from 2006 to October 2008. Dollars: no.
12. **A stated Form 3800 credit for a Form 3468 line** (`general_business_credit.current.*`
    with source "3468 Part …") still reaches Form 3800 and files no Form
    3468. A return that states both counts the credit twice. Dollars: yes, if
    both are stated.
13. **Basis reductions on other forms.** The energy credit reduces the
    property's depreciable basis by half the credit, the rehabilitation credit
    by all of it (`part-vi-energy-credit-under-section::b03`,
    `part-vii-rehabilitation-credit-under::b01`). The business's depreciation
    is a stated answer; the engine does not lower it. Dollars: yes, on Form 4562.
14. **Recapture** (`recapture-of-credit::b01` to `::b05`) is Form 4255's.

## Proposals for a discussion

- **K-1 box 20 codes D and E** (qualified rehabilitation expenditures other
  than rental real estate, and the basis of energy property) are
  `other_information` items with no route, so the K-1 stays unsupported
  (passThrough README, "Nothing is dropped"). Proposal: a `form_3468` route
  for these details, taken when a property fact names the K-1 (`k1Key`), as
  box 15 code E is today. It changes the routing layer, so it waits for a
  discussion.
- **The allocation letter and the NPS certification** are not documents the
  product reads. The property fact holds their numbers as the filer's answers.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Part I, lines 1 to 13 | stated rule (the table, lines 7 to 11 instructions) |
| Part II, lines 1a to 7 | published example with numbers (basis reduction); the form's rates |
| Part III, lines 1a to 3 | stated rule |
| Part IV, lines 1a to 3 | stated rule (25% before 2026, 35% after) |
| Part V, sections A to C | stated rule; line 1j for a smaller capacity: own reading (A96); line 8: own reading (item 1) |
| Part VI, sections A to M | stated rule; the rate tables; no bonus at 0%: own reading (A97) |
| Part VI, section N | stated rule; line 30: own reading (item 1) |
| Part VII, lines 1a to 3 | stated rule; line 1j at 0: own reading (items 3 and 4) |
| Cooperative lines (II 6, III 2, IV 2, V 10, VI 31, VII 2) | stated rule (K-1 codes P to U, stated cooperative facts) |
| Ratio lines | own reading (A98) |
| Line 1j and 3 with the 47(d)(5) election before service | unsupported (item 5) |
