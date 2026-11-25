# Form 6252: doubts and defaults

Each item says where the form and its instructions do not settle a rule, the
default the engine applies, and whether it can change a dollar amount. The one
choice of method (line 19's places) is a decision in `docs/rule-decisions.md`
(row A1) and in `lines.ts`.

1. **Line 21 and an amount an earlier line 34 counted.** Source: "If in prior
   years an amount was entered on the equivalent of line 34, don't include it on
   this line. Instead, enter it on line 23" (irs-6252-form-2025::sec::line-21::b01).
   Line 23 already includes "any other deemed payments from prior years", among
   them "A second disposition by a related party" (line-23::b01). Default: the
   fact states the part of this year's payments that an earlier line 34 counted;
   line 21 leaves it out, and line 23 is the stated prior payments, with no
   second count. Pub. 537's 2026 and 2028 years (payment-from-2024-100-000::b01)
   match. Changes dollars: no.

2. **Line 29a: when "more than 2 years" starts.** Default: after the second
   anniversary of the first sale's date, so a resale on the anniversary itself
   is not more than 2 years. Changes dollars: only for a resale on that day.

3. **Part III after the final payment.** Source: "Don't complete if you received
   the final payment this tax year" (the form's Part III heading). Default: the
   final payment is received when lines 22 + 23 reach the contract price (line
   18) with a payment this year. Changes dollars: no (line 34 is 0 then anyway).

4. **Marketable securities resold after the window.** Pub. 537: the two-year
   limit "doesn't apply if the property involved is marketable securities"
   (irs-pub-537-2025::sec::sale-and-later-disposition::b02). The form: complete
   Part III "for the year of sale and 2 years after the year of sale"
   (which-parts-to-complete::b01). Default: such a resale makes lines 30–37 and
   what they send a gap. Changes dollars: no (a gap).

5. **The unrecaptured section 1250 gain reported in earlier years.** Source: "the
   total unrecaptured section 1250 gain for the sale reduced by all gain reported
   in prior years (excluding section 1250 ordinary income recapture)"
   (irs-1040sd-inst-2025::sec::line-4::b02). Default: the earlier gain is line 23
   × line 19, rounded. Changes dollars: a dollar or two, when earlier years rounded
   each year's line 24.

6. **"Line 26 or line 37 ... whichever applies"** (line-4::b02). With a second
   disposition both apply. Default: the worksheet takes line 26 + line 37, up to
   the gain left. Changes dollars: no in common cases (the first gain is 1250 gain).

7. **Line 14 zero or less.** Source: "Don't file Form 6252 if line 14 is zero or
   less. Instead, report the entire sale on Form 4797, Form 8949, or the Schedule
   D" (line-14::b01). Default: the form still files with lines 15 on a gap, so a
   sale stated as an installment sale is never dropped. Changes dollars: no (a gap).

8. **Line 1's code.** The single text field takes the code and the description:
   "4 - Rental duplex". Changes dollars: no.

9. **Line 27's two rows.** Row 1 is the name; row 2 the address and identifying
   number. Changes dollars: no.

10. **Printed zeros.** Lines 5–26 print 0 when they are 0, as the form's "enter
    -0-" lines and the 1998 filled examples do; line 23 is blank in the year of
    sale ("Since 1998 is the year of sale, Mark makes no entry here"). Changes
    dollars: no.

11. **Not checked: section 453(g).** A sale of depreciable property to a related
    person under section 453(g)(3) cannot use the installment method without the
    IRS's agreement (sale-of-depreciable-property-to::b01). The fact names a related
    party but not the kind of relation; the engine trusts that the sale may use the
    method. Changes dollars: yes, if the sale cannot.

12. **Stated, not figured.** The pledge rule's deemed payments (pledge-rule::b01)
    are part of the stated line 21; the main home's excluded gain is the Pub. 523
    worksheet's result, checked only against the $250,000 / $500,000 maximum and
    line 14. Changes dollars: yes, if a statement is wrong.

13. **Interest on deferred tax (section 453A).** "The interest isn't figured on
    Form 6252" (interest-on-deferred-tax::b02). Not modeled: a sale over $150,000
    with more than $5 million of obligations owes interest that no line carries.
    Changes dollars: yes, for those sales only.

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
| Lines 27–29 | stated rule; 29a date count own reading (item 2) |
| Lines 30–37 | published example with numbers (Pub. 537 Sale and Later Disposition, Examples 1 and 2) |
| Schedule D lines 4, 11 | stated rule (Pub. 537 reporting-an-installment-sale::b03) |
| Form 4797 lines 4, 10, 15 | stated rule (line-26::b01, line-25::b01) |
| Unrecaptured section 1250 gain (worksheet lines 4, 12) | stated rule; earlier gain own reading (items 5, 6) |
