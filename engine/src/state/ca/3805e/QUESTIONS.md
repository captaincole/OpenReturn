# FTB 3805E: doubts and defaults

California sends most lines to federal Form 6252 ("Generally, California law
is the same as federal law concerning installment sales",
ca-3805e-inst-2025::sec::purpose::b02). So the engine runs Form 6252's
arithmetic (`federal/6252/lines.ts`) on California's amounts. The federal
form's doubts apply here too (`federal/6252/QUESTIONS.md`). This file lists
only what California adds.

## Two texts conflict

- **A3. Line 19's places.** "A decimal rounded to at least 4 digits"
  (line-19::b01) against lines 24 and 35, which multiply by line 19. Decided as
  federal row A1: exactly 4 places (`bindings.ts`, rule-decisions row A3).
  Changes dollars: under $1 for each $20,000 of payments.
- **A4. Marketable securities resold after the window.** The form's line 3
  ("2 years after the year of the sale") against the special rule and line 29a
  (installment-sales-to-related-party::b01). Decided as federal row A2: Part III
  is completed until the final payment (`sale.ts`, rule-decisions row A4).
  Changes dollars: yes, for such a resale.

## Should we do this now

1. **Who files.** The instructions say who uses the form (purpose::b01), and
   Schedule D (540) is filed "only if there is a difference between your
   California and federal capital gains and losses"
   (ca-540-sched-d-inst-2025::sec::purpose::b01). Done: with Form 540, the form
   files when a sale with a form this year states a California amount that is
   not the federal one, or when Schedule D (540) files and a capital asset sale
   needs its line 1 row. A sale with the same amounts on both returns and
   nothing else files no California form. A later year with no payment and no
   Part III files nothing, even with a different California basis (item 5).
   Changes dollars: no; the California gain is the federal gain then.
2. **California amounts on line 8.** The form says "Use California amounts" on
   line 9 and line 15 only, and sends line 8 to federal Form 6252
   (specific-line-instructions::b01). Schedule D (540) says the California basis
   can differ (ca-540-sched-d-inst-2025::sec::line-1::b02). Done: the fact may
   state a California basis, and line 8 takes it. Changes dollars: yes, when
   stated.
3. **Line 12 in a later year.** Part I is not printed then, but line 19 needs
   the year of sale's line 12. Done: the stated California recapture; the
   federal one when neither basis nor depreciation differs; 0 with no
   depreciation; else the form waits for it. Changes dollars: yes, if the
   stated amount is wrong.
4. **Part I in a later year.** The form: "Complete this part for the year of
   sale only." Federal Form 6252 completes it every year. Done: lines 5–18 are
   blank after the year of sale; line 19 prints the year of sale's percentage
   (line-19::b01). Changes dollars: no.
5. **A later year with no payment.** "For Years After the Year of Sale –
   Complete Part II for any year you receive a payment"
   (other-parts-to-be-completed::b01). Done: such a sale has no form, unless
   Part III applies (line 3), and its different California amounts do not make
   FTB 3805E or Schedule D (540) file (`differsThisYear` in `sale.ts`). Changes
   dollars: no (line 24 would be 0).
6. **The Schedule D (540) line 1 row.** "Enter this amount on Schedule D (540
   or 540NR), line 1" (line-26-and-line-37::b01) names no column. Done: one row
   per form, "(FTB 3805E)" after the description, line 26 plus line 37 in
   column (e); columns (b) and (c) blank. Line 1 has 22 rows (a–v); with more
   sales and forms than that, every row is unsupported and the totals still add
   every row (`schedule-d-ca/lines.ts`, `MORE_ROWS_GAP`). Changes dollars: no.
7. **Lines 25 and 36 together.** California: "The amounts on line 25 and line
   36 may not exceed the total of the amounts on line 24 and line 35"
   (line-25-and-line-36::b01). Done: line 25 is at most line 24 and line 36 at
   most line 35, as the form's own text says ("the part of line 24"). The total
   limit then always holds. Changes dollars: no.
8. **Line 29e.** The box asks for the Franchise Tax Board's satisfaction. The
   fact has one answer for both returns. Done: the federal answer checks box e.
   Not now for a separate answer: no example has the two agencies decide
   differently. Changes dollars: yes, if they do.
9. **Line 27.** One box for name, address and number. Done: the name on the
   first row; address and number on the second. Changes dollars: no.
10. **Line 3 before 1981.** The form asks about a related party "after
    December 31, 1980". Done: a sale before 1981 answers "No". Changes
    dollars: no.
11. **Residents who moved.** California taxes a resident on payments received
    while a resident, also for a sale made before the move
    (general-information::b02; ftb-pub-1100-2025 examples 4 and 5). Done for a
    full-year resident: the engine prepares a full-year resident's Form 540, so
    every 2025 payment counts. Not now for a part-year resident: Form 540NR is
    not modeled here. Changes dollars: no for a full-year resident.
12. **Interest on deferred tax (section 453A) for California.** "The interest
    is not figured on form FTB 3805E" and goes on Form 540 line 63
    (how-to-report-the-interest::b01). Not now: the $5 million test needs every
    obligation of the year, which no fact lists (federal item 13). Changes
    dollars: yes, for a sale over $150,000 in a year with more than $5 million
    of obligations.
13. **A sale with no gain.** The form's line 14: "If zero or less, stop here.
    Do not complete the rest of this form." The instructions: "Do not file form
    FTB 3805E if the amount calculated for line 24 is less than zero. Instead,
    report the entire sale on Schedule D (540 ...) or Schedule D-1"
    (line-24::b01). Line 24 cannot be below zero, so both say the same thing:
    a loss is not reported on this form. Not now: the engine still prints line
    14 and makes lines 15 on a gap (`NO_GAIN` in `sale.ts`), as on federal Form
    6252 (federal item 7), because it does not move the sale to Schedule D
    (540) or Schedule D-1; dropping the form would drop the sale with no
    warning. Changes dollars: no (the return is not finished while the gap
    stands).
14. **Line 12 in the year of sale with California depreciation.** It comes from
    Schedule D-1, Part III and Part IV (line-12::b01). Not now: Schedule D-1
    figures Part III only for a business property sale fact, not for an
    installment sale, so lines 12 on are a gap for that form (proposal below).
15. **Line 25 in the year of sale with section 1252, 1254 or 1255 recapture**
    (Schedule D-1, Part IV). Not now, for the same reason: lines 25 on are a gap
    for that form.
16. **Business property and ordinary gains.** Lines 26 and 37 go to Schedule D-1
    line 4 or 10, lines 25 and 36 to line 15 (line-26-and-line-37::b01). Not
    now: Schedule D-1 has rules, but its lines 4 and 15 do not take this form's
    amounts. The 3805E lines are figured; Schedule CA (540) line 4 columns B and
    C, where the difference would land, are a gap with this route as the reason
    (`SCHEDULE_D1_GAP` in `totals.ts`, read by `schedule-ca/otherGains.ts`), and
    Schedule D-1 lines 7 to 21 are a gap for such a sale (`salesForScheduleD1`,
    read from the facts because Schedule D-1 resolves before FTB 3805E's
    decision is known). A total that adds an unsupported line
    still adds the others (Schedule CA line 10, Form 540 lines 14 and 16), so
    the difference is missing there; that is how every gap in the engine
    behaves today. Changes dollars: yes, the California difference of a
    business sale.
17. **Line 14 zero or less, a contingent sale with no maximum, a sale date after
    2025.** Not now: as on federal Form 6252 (a gap from line 15 or line 5).

## Pattern change

- **A California form reads the federal fact.** Before, a California form read
  its own facts or the federal form's printed lines. After, FTB 3805E reads the
  federal installment sale fact with an optional `california` block of the
  amounts that differ, and runs Form 6252's arithmetic on them.
- **FTB 3805E and Schedule D (540) read each other.** Before, Schedule D (540)
  resolved alone and FTB 3805E was a form with no rules. After, FTB 3805E gives
  Schedule D (540) its line 1 rows (`form3805ETotalsOf`), and Schedule D (540)
  filing (`schedule-d-ca/mustFile.ts`) makes a capital asset sale file FTB
  3805E. FTB 3805E's resolver sits at the end of `state/ca/laterForms.ts`;
  resolvers read only the facts, so the order does not matter.

## Proposals for a discussion

- **Schedule D-1 takes this form's amounts.** Schedule D-1 has rules now. Its
  Part III and Part IV for an installment sale would let line 12 and line 25
  compute in the year of sale, and its lines 4, 10 and 15 would take this
  form's business amounts. That changes Schedule D-1's resolver, so it waits.

## Second opinions

- **Blind fill** (15 cases from the blank form and instructions only): every
  dollar amount on a filed form matched, including the California basis (case
  2), California depreciation in a later year (case 13), the line 19 places
  (cases 3 and 12), the section 1252 recapture left (case 6) and Part III
  (cases 7, 8, 9 and 14). Two kinds of difference, no dollars:
  - Line 23 in the year of sale (cases 1, 2, 3, 4, 7, 12 and 15): the blind
    fill wrote 0, the engine leaves it blank (federal item 10).
  - Case 10, line 14 zero or less: the blind fill files no form; the engine
    prints line 14 (−3,000) and makes lines 15 on a gap. The text agrees with
    the blind fill on the correct return (item 13); the engine keeps the gap
    because it does not move the sale to Schedule D (540).
  The blind fill's doubts that change dollars are decision A3 (line 19's
  places) and item 3 (California recapture in a later year). Its other doubts
  change no dollars: item 5 (a later year with no payment; the federal reading
  would file a form with line 24 = 0), and federal items 2, 10 and 15.
- **PolicyEngine-US 2.153.8** (commit b3edc0446b): its California model
  (`variables/gov/states/ca`) has no installment sale, no FTB 3805E and no
  Schedule D (540) adjustment; California AGI starts from federal AGI with a
  short list of additions and subtractions. Nothing to compare. No
  disagreement.
- **IRS Direct File:** the repo names no checkout, and Direct File prepares no
  California return. Not compared.
- **Page check (second pass):** joline (two copies, Part III) and uno (a later
  year) printed every value of FTB 3805E, Schedule D (540), Schedule CA (540)
  line 7a and Form 540 as worked by hand; no value in a wrong box, no text cut
  off.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, lines 1–4 | stated rule (line 27 layout and line 3 date: own reading, items 9 and 10) |
| Lines 5–18 | published example with numbers (Pub. 537, through the California path); California basis own reading (item 2) |
| Line 9 | stated rule ("Use California amounts") |
| Line 12 | later years: stated input (item 3); year of sale with depreciation: unsupported |
| Line 15 | stated rule; the amount is the taxpayer's |
| Line 19 | published example with numbers (line-19::b01); places decided (A3) |
| Lines 20–26 | published example with numbers (Pub. 537) |
| Lines 27–29 | stated rule; marketable securities decided (A4); box e own reading (item 8) |
| Lines 30–37 | published example with numbers (Pub. 537 Examples 1 and 2) |
| Schedule D (540) line 1 row | stated rule; columns own reading (item 6) |
| Schedule D-1 route | unsupported |
