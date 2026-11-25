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
  federal row A1: exactly 4 places. Changes dollars: under $1 for each $20,000
  of payments.
- **A4. Marketable securities resold after the window.** The form's line 3
  ("2 years after the year of the sale") against the special rule and line 29a
  (installment-sales-to-related-party::b01). Decided as federal row A2: Part III
  is completed until the final payment. Changes dollars: yes, for such a resale.

## Defaults with no conflicting text

1. **Who files.** The instructions say who uses the form
   (purpose::b01), and Schedule D (540) is filed "only if there is a difference
   between your California and federal capital gains and losses"
   (ca-540-sched-d-inst-2025::sec::purpose::b01). Default: with Form 540, the
   form files when a sale states a California amount that is not the federal
   one, or when Schedule D (540) files and a capital asset sale needs its line 1
   row. A sale with the same amounts on both returns and nothing else files no
   California form. Changes dollars: no; the California gain is the federal
   gain then.
2. **California amounts on line 8.** The form says "Use California amounts" on
   line 9 and line 15 only, and sends line 8 to federal Form 6252
   (specific-line-instructions::b01). Schedule D (540) says the California basis
   can differ (ca-540-sched-d-inst-2025::sec::line-1::b02). Default: the fact
   may state a California basis, and line 8 takes it. Changes dollars: yes, when
   stated.
3. **Line 12 in a later year.** Part I is not printed then, but line 19 needs
   the year of sale's line 12. Default: the stated California recapture; the
   federal one when neither basis nor depreciation differs; 0 with no
   depreciation; else the form waits for it. Changes dollars: yes, if the
   stated amount is wrong.
4. **Part I in a later year.** The form: "Complete this part for the year of
   sale only." Federal Form 6252 completes it every year. Default: lines 5–18
   are blank after the year of sale; line 19 prints the year of sale's
   percentage (line-19::b01). Changes dollars: no.
5. **A later year with no payment.** "For Years After the Year of Sale –
   Complete Part II for any year you receive a payment"
   (other-parts-to-be-completed::b01). Default: such a sale has no form, unless
   Part III applies (line 3). Changes dollars: no (line 24 would be 0).
6. **The Schedule D (540) line 1 row.** "Enter this amount on Schedule D (540
   or 540NR), line 1" (line-26-and-line-37::b01) names no column. Default: one
   row per form, "(FTB 3805E)" after the description, line 26 plus line 37 in
   column (e); columns (b) and (c) blank. Changes dollars: no.
7. **Lines 25 and 36 together.** California: "The amounts on line 25 and line
   36 may not exceed the total of the amounts on line 24 and line 35"
   (line-25-and-line-36::b01). Default: line 25 is at most line 24 and line 36
   at most line 35, as the form's own text says ("the part of line 24"). The
   total limit then always holds. Changes dollars: no.
8. **Line 29e.** The box asks for the Franchise Tax Board's satisfaction. The
   fact has one answer for both returns. Default: the federal answer checks box
   e. Changes dollars: yes, if the two agencies decide differently.
9. **Line 27.** One box for name, address and number. Default: the name on the
   first row; address and number on the second. Changes dollars: no.
10. **Line 3 before 1981.** The form asks about a related party "after
    December 31, 1980". Default: a sale before 1981 answers "No". Changes
    dollars: no.
11. **Residents who moved.** California taxes a resident on payments received
    while a resident, also for a sale made before the move
    (general-information::b02; ftb-pub-1100-2025 examples 4 and 5). The engine
    prepares a full-year resident's Form 540, so every 2025 payment counts. A
    part-year resident (Form 540NR) is not modeled here. Changes dollars: no for
    a full-year resident.
12. **Interest on deferred tax (section 453A) for California.** "The interest
    is not figured on form FTB 3805E" and goes on Form 540 line 63
    (how-to-report-the-interest::b01). Not figured: the $5 million test needs
    every obligation of the year, which no fact lists (federal item 13).
    Changes dollars: yes, for a sale over $150,000 in a year with more than
    $5 million of obligations.
13. **A sale with no gain.** The form's line 14: "If zero or less, stop here.
    Do not complete the rest of this form." The instructions: "Do not file form
    FTB 3805E if the amount calculated for line 24 is less than zero. Instead,
    report the entire sale on Schedule D (540 ...) or Schedule D-1"
    (line-24::b01). Line 24 cannot be below zero, so both say the same thing:
    a loss is not reported on this form. The correct return has no FTB 3805E
    for the sale. Default: the engine still prints line 14 and makes lines 15
    on a gap (`NO_GAIN` in `sale.ts`), as on federal Form 6252 (federal item
    7), because it does not move the sale to Schedule D (540) or Schedule D-1;
    dropping the form would drop the sale with no warning. Changes dollars: no
    (the return is not finished while the gap stands).

## Unsupported

- **Line 12 in the year of sale with California depreciation.** It comes from
  Schedule D-1, Part III and Part IV (line-12::b01), which has no rules. Lines
  12 on are a gap for that form.
- **Line 25 in the year of sale with section 1252, 1254 or 1255 recapture**
  (Schedule D-1, Part IV). Lines 25 on are a gap for that form.
- **Business property and ordinary gains.** Lines 26 and 37 go to Schedule D-1
  line 4 or 10, lines 25 and 36 to line 15 (line-26-and-line-37::b01). The
  engine has no Schedule D-1 rules, so Schedule CA (540) line 4 columns B and C
  stay unsupported (`totals.ts`, `SCHEDULE_D1_GAP`). The 3805E lines themselves
  are figured.
- **Line 14 zero or less, a contingent sale with no maximum, a sale date after
  2025:** as on federal Form 6252.

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

## Proposals for a discussion

- **Schedule D-1 rules.** Part III (recapture) and Part IV would let line 12 and
  line 25 compute in the year of sale, and lines 4, 10 and 15 would take this
  form's business amounts. That is a new form's rules, so it waits.

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
