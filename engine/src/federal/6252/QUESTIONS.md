# Form 6252: doubts and defaults

Each item says where the form and its instructions do not settle a rule, the
default the engine applies, and whether it can change a dollar amount. The items
keep their numbers under three headings. The two conflicts are decisions in
`docs/rule-decisions.md` (rows A1 and A2) and in the code.

## Two texts conflict

- **A1. Line 19's places.** "A decimal rounded to at least 4 digits" against
  lines 24 and 35, which multiply by line 19. Decided: exactly 4 places, and both
  lines multiply by the printed value (`lines.ts`). Changes dollars: under $1 for
  each $20,000 of payments.

4. **Marketable securities resold after the window (A2).** Pub. 537: the
   two-year limit "doesn't apply if the property involved is marketable
   securities" (irs-pub-537-2025::sec::sale-and-later-disposition::b02), and the
   form's special rule names only the line 29 conditions
   (installment-sales-to-related-party::b01). The form's note: complete Part III
   "for the year of sale and 2 years after the year of sale"
   (which-parts-to-complete::b01). Decided: Part III is completed in every year
   before the final payment for marketable securities (`relatedParty.ts`).
   Changes dollars: yes, the accelerated gain of such a resale.

## Should we do this now

1. **Line 21 and an amount an earlier line 34 counted.** Source: "If in prior
   years an amount was entered on the equivalent of line 34, don't include it on
   this line. Instead, enter it on line 23" (irs-6252-form-2025::sec::line-21::b01).
   Line 23 already includes "any other deemed payments from prior years", among
   them "A second disposition by a related party" (line-23::b01). Done: the fact
   states the part of this year's payments that an earlier line 34 counted; line
   21 leaves it out, and line 23 is the stated prior payments, with no second
   count. Pub. 537's 2026 and 2028 years (payment-from-2024-100-000::b01) match.
   Changes dollars: no.

2. **Line 29a: when "more than 2 years" starts.** Done: after the second
   anniversary of the first sale's date, so a resale on the anniversary itself is
   not more than 2 years. Changes dollars: only for a resale on that day.

3. **Part III after the final payment.** Source: "Don't complete if you received
   the final payment this tax year" (the form's Part III heading). Done: the final
   payment is received when lines 22 + 23 reach the contract price (line 18) with
   a payment this year. Changes dollars: no (line 34 is 0 then anyway).

5. **The unrecaptured section 1250 gain reported in earlier years.** Source: "the
   total unrecaptured section 1250 gain for the sale reduced by all gain reported
   in prior years (excluding section 1250 ordinary income recapture)"
   (irs-1040sd-inst-2025::sec::line-4::b02). Done: the earlier gain is line 23 ×
   line 19, rounded. Changes dollars: a dollar or two, when earlier years rounded
   each year's line 24.

6. **"Line 26 or line 37 ... whichever applies"** (line-4::b02). With a second
   disposition both apply. Done: the worksheet takes line 26 + line 37, up to the
   gain left. Changes dollars: no in common cases (the first gain is 1250 gain).

7. **Line 14 zero or less.** Source: "Don't file Form 6252 if line 14 is zero or
   less. Instead, report the entire sale on Form 4797, Form 8949, or the Schedule
   D" (line-14::b01). Not now: moving the sale needs a sale fact of the other
   form, so the form still files with lines 15 on a gap, and a sale stated as an
   installment sale is never dropped. Changes dollars: no (a gap).

8. **Line 1's code.** Done: the single text field takes the code and the
   description: "4 - Rental duplex". Changes dollars: no.

9. **Line 27's two rows.** Done: row 1 is the name; row 2 the address and
   identifying number. Changes dollars: no.

10. **Printed zeros.** Done: lines 5–26 print 0 when they are 0, as the form's
    "enter -0-" lines and the 1998 filled examples do; line 23 is blank in the
    year of sale ("Since 1998 is the year of sale, Mark makes no entry here").
    Changes dollars: no.

11. **Not checked: section 453(g).** A sale of depreciable property to a related
    person under section 453(g)(3) cannot use the installment method without the
    IRS's agreement (sale-of-depreciable-property-to::b01). Not now: the fact
    names a related party but not the kind of relation, and the check needs a new
    answer for a rare case; the engine trusts that the sale may use the method.
    Changes dollars: yes, if the sale cannot.

12. **Stated, not figured.** The pledge rule's deemed payments (pledge-rule::b01)
    are part of the stated line 21; the main home's excluded gain is the Pub. 523
    worksheet's result, checked only against the $250,000 / $500,000 maximum and
    line 14. Not now: each is its own worksheet with inputs no fact holds.
    Changes dollars: yes, if a statement is wrong.

13. **Interest on deferred tax (section 453A).** "The interest isn't figured on
    Form 6252" (interest-on-deferred-tax::b02). Not now: the $5 million test
    counts every obligation of the year of sale, also those paid off before 2025,
    which no fact lists. Schedule 2 line 15 stays unsupported. Changes dollars:
    yes, for a sale over $150,000 of a year with more than $5 million of
    obligations.

14. **Line 12 in a later year is copied, not figured again.** Source: "The
    ordinary income recapture is the amount on line 31 of Form 4797"
    (line-12::b01). Done: in a year after the sale, the fact states the year of
    sale's Form 4797 line 31 amount, and line 12 copies it. The engine does not
    check it against the depreciation allowed (line 9) and the gain. A blind fill
    raised this (a stated $55,000 next to $70,000 of depreciation). Changes
    dollars: yes, if the earlier Form 4797 was wrong.

15. **Line 25 in a later year: the recapture left.** Source: "all remaining
    recapture from a prior year sale ... Don't enter on line 25 more than the
    amount shown on line 24" (line-25::b01). Done: the fact states the section
    1252, 1254 or 1255 recapture not reported yet; line 25 is the smaller of it
    and line 24. The rest waits for a later year, and the taxpayer states the new
    amount left on that year's fact; the engine does not carry it. Changes
    dollars: yes, if the stated amount left is wrong.

16. **Form 8960 and a business sale (worksheet line 2(d)).** Source: "Gains
    recognized in the current year for payments received on an installment sale
    obligation ... for the disposition of property used in a non-section 1411
    trade or business" come out of NII
    (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b06).
    Done: a business or ordinary sale's fact answers
    `nonSection1411TradeOrBusiness`; line 5b takes out its whole line 24 (and
    line 35), recapture included, and waits while the answer is missing. The
    engine takes the stated answer and does not check it against a Schedule C
    fact: the business may have ended before 2025. Changes dollars: yes, 3.8% of
    the gain, if the answer is wrong.

17. **California Schedule D (540) with a capital asset installment gain.**
    California's gain goes on line 1 from FTB 3805E line 26 or 37
    (ca-3805e-inst-2025::sec::line-26-and-line-37::b01), and FTB 3805E has no
    rules yet. Done for now: when Schedule D (540) files, its lines 4 to 12b are
    a gap while federal Schedule D line 4 or 11 holds a Form 6252 gain
    (`state/ca/schedule-d-ca/resolveInfo.ts`); the FTB 3805E branch adds the row.
    A business sale reaches federal Schedule D through Form 4797, which the
    existing Form 4797 gap already covers. Changes dollars: no (a gap).

18. **Form 8960 line 5c: an installment sale of a partnership interest or S
    corporation stock** (worksheet line 3(c), ::b09). Not now: the fact does not
    say the property is such an interest, and line 5c is unsupported on every
    return. Changes dollars: yes, for such a sale only.

## Pattern change

- **The installment sale fact carries one Form 8960 answer.** Before, Form 8960
  counted every installment gain as NII and named no business. After, a
  business or ordinary sale states `nonSection1411TradeOrBusiness`, and Form 8960
  lists the sale as a pending input until it does (item 16).

## Second opinions

- **Blind fill** (14 cases from the blank form and instructions only): every
  dollar amount matched. The only differences are line 23 in the year of sale
  (cases 1, 2, 3 and 14): the blind fill wrote 0, the engine leaves it blank
  (item 10). No dollars change. The blind fill's doubts that change dollars are
  items 1, 2, 14 and 15 and decision A1.
- **PolicyEngine-US 2.153.8** (commit b3edc0446b): it does not model Form 6252
  or the installment method. Its unrecaptured section 1250 gain before losses
  is an input, so the worksheet lines 4 and 12 that Form 6252 feeds have
  nothing to compare. No disagreement.
- **IRS Direct File:** the repo names no checkout, and Direct File does not
  support Form 6252. Not compared.

## Proposals for a discussion

- **Form 4797 Part III for an installment sale in its year of sale.** Line 12 is
  Form 4797 line 31 for the property, and line 25 in the year of sale is line
  27c, 28b or 29b (line-12::b01, line-25::b01). Today a 2025 sale with
  depreciation, or with section 1252–1255 recapture, makes lines 12 (or 25) on a
  gap. Proposal: let a business property sale fact name its installment sale; Form
  4797 places it in Part III as usual, sends line 31's part to line 13 and to Form
  6252 line 12, and leaves the property out of line 32 ("N/A"). That changes how
  Form 4797 places a property, so it waits for a discussion.
- **Several assets on one form.** Pub. 537 allows one Form 6252 with an attached
  schedule for assets sold together (reporting-an-installment-sale::b02), and
  figures a mortgage's excess per parcel (contingent-payment-sale::b04). Today each
  asset is its own fact and form.
- **A selling price reduced after the sale** (Pub. 537 Worksheet B,
  selling-price-reduced::b01), **a like-kind exchange with an installment note**
  (Form 8824, like-kind-exchange::b02) and **a contingent payment sale with no stated
  maximum**: each needs a new input; today the first two have no fact and the third
  is a gap.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, lines 1–4 | stated rule (line 1 format own reading, item 8) |
| Lines 5–18 | published example with numbers (Pub. 537 mortgage examples; 1998 Mark Moore) |
| Line 12 | later years: stated input; year of sale with depreciation: unsupported (proposal) |
| Line 15 | stated rule; the amount is the taxpayer's Pub. 523 result |
| Line 19 | stated rule; places decided (row A1) |
| Lines 20–26 | published example with numbers (1998 Mark Moore and Cora Blue; Pub. 537) |
| Line 25 | stated rule; year of sale with recapture: unsupported (proposal) |
| Lines 27–29 | stated rule; 29a date count own reading (item 2); marketable securities decided (row A2) |
| Lines 30–37 | published example with numbers (Pub. 537 Sale and Later Disposition, Examples 1 and 2) |
| Schedule D lines 4, 11 | stated rule (Pub. 537 reporting-an-installment-sale::b03) |
| Form 4797 lines 4, 10, 15 | stated rule (line-26::b01, line-25::b01) |
| Unrecaptured section 1250 gain (worksheet lines 4, 12) | stated rule; earlier gain own reading (items 5, 6) |
| Form 8960 line 5b (worksheet line 2(d)) | stated rule; the business answer is stated (item 16) |
| Schedule D (540) | gap until FTB 3805E has rules (item 17) |
