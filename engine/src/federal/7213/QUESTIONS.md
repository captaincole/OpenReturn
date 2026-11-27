# Form 7213 — open questions

Form 7213 claims two credits for electricity a taxpayer's own nuclear facility produces and sells: Part I for an advanced facility (section 45J), Part II for an older facility (section 45U). The instructions publish no example with numbers. The engine follows the lines. Two choices that conflict with a text are decided in the code and in `docs/rule-decisions.md` (rows A110 and A111): the 2025 rate on Part II line 7, and the capacity on Part I line 2.

## Doubts with no conflicting text

1. **One form for each facility, and the K-1 credits on a separate form.** "You must file a separate Form 7213 for each advanced nuclear power facility or each qualified nuclear power facility" (`irs-7213-inst-2025::sec::who-must-file::b01`). Each facility fact is one copy, and its copy fills only its part. The K-1 credits go on one more copy, headed "Credit From Pass-Through Entities" (Part I line 1a) or "Credits From Pass-Through Entities" (Part II line 2a) (`line-10::b01`, `line-12::b01`). The engine prints a part's K-1 credits only when the taxpayer also claims a facility's credit in that part. Line 10 says so for Part I. For Part II, line 12 says: "If the only credit allocated to you is the zero-emission nuclear power production credit, do not report the credit on Form 7213". The engine reads "only" as "only from a K-1". Default: the K-1 credits of a part with no facility go to Form 3800 directly. **No dollars change**: Form 3800 takes each K-1 credit as its own source either way.
2. **Line 12 names the wrong Form 3800 line.** "Instead, report the credit directly on Form 3800, Part III, line 1x" (`line-12::b01`). Line 1x of Form 3800 is Form 8933. The form face and the K-1 instructions name line 1u. Default: line 1u (`3800/k1Credits.ts`). **No dollars change.**
3. **Part I line 3 has no rounding rule.** "Divide line 1 by line 2" (`irs-7213-face-2025::sec::face-part-i::b02`), printed as a percent. Default: the ratio to 4 decimal places (the percent to 2), and line 5a multiplies by the printed value. This is the rule of row A1 in `docs/rule-decisions.md` (Form 6252), so the engine rounds every printed ratio one way. **Changes dollars slightly**: 1 MW of 3 MW prints 33.33%, and 3,000,000 kWh make 999,900 kWh on line 5a, not 1,000,000, so line 5b is $17,998, not $18,000.
4. **Kilowatt hours print whole.** Lines 4 and 5a (Part I) and line 1 (Part II) are in kWh, with no rule for a fraction. Default: the nearest whole kWh. **Changes no dollars** except by a fraction of a cent.
5. **Megawatts keep their decimals.** Part I line 6a is line 1 divided by 1,000, so it is usually under 1. Default: lines 1, 2 and 6a print up to 6 decimal places ("0.0004"), not whole dollars. Section 1 lines 5 and 6 print the capacity with "MW". **No dollars change.**
6. **The 8-year credit period.** Qualifying electricity is produced "during the 8-year period beginning on the date the facility is placed in service" (`credit-for-the-production-of-electricity::b02`); line 4 says only "produced and sold to unrelated persons during tax year" (`line-4::b01`). Default: the fact's kWh are the qualifying kWh (`facts/kinds/nuclearFacility.ts`), and Cade asks for the kWh within the period. **No dollars change** for a facility inside its period.
7. **The section 45J phase-out has no line.** Section 45J(c)(2) reduces the credit when the reference price is above 8 cents (adjusted). The form has no line for it. Default: no reduction, as the form. **Changes dollars only if the reference price passes the limit.**
8. **An eligible project partner.** Line 8 lets a partner of a qualified public entity claim a transferred 45J credit with the election statement (`line-8::b01`). The instructions do not say how such a partner fills Section 2. Default: Part I Section 2 is unsupported for the partner, and so is Form 3800 line 1cc.
9. **Part II for a facility placed in service on or after August 16, 2022.** "Complete Part II only if the facility was placed in service prior to August 16, 2022" (`face-part-ii::b01`). Default: such a fact makes Part II Section 2 unsupported, because the fact is likely wrong (the facility is not a qualified facility).
10. **Elective payment.** Only an applicable entity can treat the section 45U credit as a payment (`credit-for-zero-emission-nuclear::b03`). An individual is not one. Default: a fact with an elective payment makes Part II line 13 unsupported, as Form 3468 does for a part with no election.
11. **Part II line 1, the registration number.** "If making an elective payment election or transfer election, enter the IRS-issued registration number" (face-part-ii::b01). Default: it prints only with a transfer (or an elective payment) on the fact. **No dollars change.**
12. **Estates and trusts.** Lines 10, 11, 14 and 15 are for an estate or trust ("All others, stop here", face). The engine prepares an individual's return, so they stay blank. Line 14's instruction says "Allocate the credit on line 11", while the form's line 14 follows line 13; it does not matter for an individual.
13. **Prohibited foreign entities.** No 45U credit for a specified foreign entity for tax years beginning after July 4, 2025 (`what-s-new::b01`). The engine does not ask: the rule is for entities, and the engine prepares an individual's return.

## Blind fill

A preparer filled 14 cases by hand from the blank form and the instructions only. The engine and the blind fill agree on cases 1 to 3, 5, 13 and 14, and on the blind preparer's choices for line 2 of a co-owner (row A111), a blank line 5 with no ZEC payments, and the K-1 credits (item 1). Two choices change dollars:

- **Part I line 3 (case 4).** The blind fill multiplies line 4 by the exact ratio 1/3 (line 5b $18,000); the engine multiplies by the printed 33.33% ($17,998). No text sets the precision (item 3). The engine keeps its default, the rule of row A1.
- **Part II line 7 (cases 6 to 12).** The blind fill uses the printed $0.025. The engine uses $0.026 (row A110). The engine is right: the instructions say "2.5 cents (adjusted for inflation)" (`credit-for-zero-emission-nuclear::b02`), section 45U(c)(1) adjusts it for the calendar year of the sale and rounds to 0.1 cent (`usc-26-2025::sec::s45u::c-1`), and Notice 2025-37 (Internal Revenue Bulletin 2025-30) gives the 2025 factor 1.0242, so 2.5605 cents rounds to 2.6 cents. The IRS page "Section 45U, zero-emission nuclear power production credit reduction amount rate has been updated by the inflation adjustment" says the form's $0.025 is the 2024 rate.

One doubt follows from that page: it gives $0.026 for electricity "sold during the portion of calendar year 2025". A tax year that spans two calendar years would use two rates. The engine uses one rate, because an individual's tax year is the calendar year. **No dollars change** for an individual.

## Second opinions

- **PolicyEngine-US** (version 2.154.2, commit `c1fea42a38`): it does not model either credit. A search of `variables/gov/irs` and `parameters/gov/irs` for "nuclear", "45U" and "45J" finds nothing, so there is nothing to compare.
- **IRS Direct File**: it handles no business credits, so it has no rule for this form.

## The statute

The law library was read for row A110 (`usc-26-2025::sec::s45u::c-1`, which supports the $0.026) and row A111 (`usc-26-2025::sec::s45j::b-1`, silent on a co-owner's share). No instruction here disagrees with the statute, so there is no entry for `docs/law-findings.md`.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I Section 1 (lines 1a to 9) | stated rule |
| Part I Section 2 lines 1, 4 to 7 | stated rule (the form's arithmetic) |
| Part I Section 2 line 2 | own reading (DECISION, row A111) |
| Part I Section 2 line 3 | own reading (rounding, item 3) |
| Part I lines 8 and 9 | stated rule (the pass-through copy, item 1) |
| Part I lines 10 and 11 | stated rule: blank for an individual |
| Part I Section 2 for an eligible project partner | unsupported (item 8) |
| Part II Section 1 (lines 1 to 4) | stated rule |
| Part II lines 1, 3 to 6, 8 to 11 | stated rule (the form's arithmetic) |
| Part II line 7 | own reading (DECISION, row A110) |
| Part II lines 12 and 13 | stated rule (the pass-through copy, item 1) |
| Part II lines 14 and 15 | stated rule: blank for an individual |
| Part II for a late facility or an elective payment | unsupported (items 9, 10) |

No published example with numbers exists for any field.
