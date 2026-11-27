# Form 8332: open doubts

Form 8332 has no amounts. The custodial parent signs it to let the other parent claim a child for the child tax credit and the credit for other dependents. The noncustodial parent attaches it. A custodial parent who revoked an earlier release attaches the Part III copy. No two official texts conflict on this form, so no row goes in `docs/rule-decisions.md`. Each doubt below is a default or a reading.

## Doubts

1. **Part I year with no answer.** The form: "for the tax year 20 __" (irs-8332-form-2025::sec::part-i-release-of-claim-to-exemption-for-current-year::b01). The release fact may leave `currentYear` out. Default: 2025, the release this return relies on. A copy of a form signed in an earlier year records its own year. No dollars change.

2. **A custodial parent who released the claim is never asked.** "If conditions (1) through (4) apply, only the noncustodial parent can claim the child for purposes of the child tax credit and credit for other dependents" (irs-1040-inst-2025::sec::definitions-and-special-rules::b02). The answer is `releasedToNoncustodialParent` on the dependent fact. Default: absent means no release, so no existing return gets a new question. Dollars change when the answer is wrong: $2,200 of child tax credit for each child.

3. **Decree pages instead of Form 8332.** "If the divorce decree or separation agreement went into effect after 1984 and before 2009, the noncustodial parent can attach certain pages from the decree or agreement instead of Form 8332" (special-rule-for-children-of::b03). A pre-1985 decree needs no form at all (::b02). Default: the engine files Form 8332 for every release. The decision `decisions.scope.must_file_8332` = false turns it off. No dollars change.

4. **The revocation copy "as a result of the revocation".** "You must attach a copy of the revocation to your tax return each year the exemption is claimed as a result of the revocation" (part-i-release-of-claim-to-exemption-for-current-year::b03). The engine does not know whether the earlier release covered 2025. Default: every recorded revocation that is effective for 2025 files a copy. No dollars change.

5. **A revocation that is not yet effective.** A revocation given in 2025 counts from 2026 (part-iii::b01). The engine files no copy for it. It does not then treat the child as released: the dependent fact's `releasedToNoncustodialParent` decides that. Dollars change when the two answers disagree.

6. **The 1040 head of household child's name.** "If the child isn't claimed as your dependent, enter the child's name in the entry space below qualifying surviving spouse" (irs-1040-inst-2025::sec::head-of-household::b03). The engine fills it only for a child released on Form 8332. Other children who are not dependents (Test 2 items 2 and 3, ::b02), and a qualifying surviving spouse's child, have no fact: the field is blank. With no named qualifying person, the first released child prints when no claimed dependent lived at home; otherwise the engine asks `filing_status.hoh_qualifying_person`. No dollars change.

7. **Multiple support agreement.** "If the support of the child is determined under a multiple support agreement, this special rule does not apply, and this form should not be used" (special-rule-for-children-of::b03). No fact holds it; it is Cade's question before recording a release. No dollars change in the engine.

8. **E-file.** "If you are filing your return electronically, you must file Form 8332 with Form 8453" (noncustodial-parent::b01). The engine prints no Form 8453. No dollars change.

9. **A child who lived with the taxpayer half the year or less, with no release.** Fixed after the blind fill (case 3). The engine gave this child the credit for other dependents. A qualifying relative is a person "Who wasn't a qualifying child (see Step 1) of any taxpayer for 2025" (irs-1040-inst-2025::sec::is-your-qualifying-relative::b01), and only the release moves the claim to the noncustodial parent (definitions-and-special-rules::b01, ::b02). So a child under 17 by relationship who lived here half the year or less with `form8332Release: false` is not a dependent now (`isOtherParentsQualifyingChild`): no Dependents row, no Schedule 8812 line 6, no Form 540 line 10. The same block has an exception the engine cannot see: "a person isn't a taxpayer if the person isn't required to file a U.S. income tax return and either doesn't file such a return or files only to get a refund". Default: the person the child lived with is a taxpayer. It can change $500 (and California's $475 dependent exemption credit).

10. **The years as printed.** "Write the specific future year(s) or 'all future years'" (part-ii::b01). The engine prints "2026", "2026 and 2027", "2026 through 2028" (the instructions' "2023 through 2027", part-iii::b01) and "all future years". No dollars change.

11. **California.** Form 540 line 10 and FTB 3853 read the claimed dependents too, so a released child leaves them. California follows the federal dependent. It can change the $475 dependent exemption credit.

12. **A stepchild on a joint return.** The release names the "noncustodial parent" (irs-8332-form-2025::sec::special-rule-for-children-of::b01). On a joint return the child's parent may be the spouse, and the taxpayer is a stepparent. The engine files the copy with the spouse as the noncustodial parent (`parent: "spouse"`) and gives the child tax credit; the blind fill (case 13) read it the same way. A reading that refused the claim would change $2,200.

## Confidence by field group

| Field group                                         | Confidence                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Header (noncustodial parent's name and SSN)         | stated rule (custodial-parent-and::b01)                                                                                 |
| Part I (child, year, custodial parent's SSN)        | stated rule (part-i::b01); the default year is own reading                                                              |
| Part II (child, future years, SSN)                  | stated rule (part-ii::b01); the printed text of the years is own reading                                                |
| Part III (child, revoked years, SSN)                | published example (part-iii::b01, years only, no dollars)                                                               |
| Who files, one copy for each child                  | stated rule (form-8332-rev-december-2025::b01, part-i…::b02 and ::b03)                                                  |
| Child tax credit moves, HOH/EIC/dependent care stay | stated rule (irs-1040-inst-2025 definitions-and-special-rules::b02, ::b03; irs-2441-inst-2025 qualifying-person-s::b03) |
| 1040 HOH child's name                               | stated rule (head-of-household::b03); the choice with no named person is own reading                                    |

No field is unsupported. A copy is a gap only when its facts disagree (a release that does not name 2025, or the spouse named as a parent on a return that is not joint).

## Second opinions

- **Blind fill (2026-11-26), 14 cases.** One difference, case 3 (no release, child lived here 3 months): the engine gave the credit for other dependents and listed the child; the blind fill did neither. The blind fill was right (doubt 9); the engine is fixed and all 14 cases now agree.
- **PolicyEngine-US 2.154.1 (commit 0fbed6ddb1).** It does not model Form 8332: "The model has no input for an IRC 152(e) release" (`credits/cdcc/cdcc_eligible.py`), and who is a dependent is a bare input (`is_tax_unit_dependent`). Its child tax credit tests match the engine's: under 17 and an SSN for the child (`ctc_qualifying_child_ignoring_filer_identification`). Its dependent care rule agrees that a custodial parent's child under 13 qualifies "even when the noncustodial parent claims the dependent" (IRC 21(e)(5)). Its EIC qualifying child is drawn from the tax unit's dependents (`is_eitc_qualifying_child`), so it cannot show a released child who stays the custodial parent's EIC child: a scope difference, not a lead. No constant or formula differs.
- **IRS Direct File.** The repo names no checkout of it; not compared.

## Proposals for a discussion

- **A qualifying child who is not a dependent.** The engine records a released child as a dependent fact with `releasedToNoncustodialParent`, and `getClaimedDependentFacts` leaves the child out. So "a dependent fact" now means a child on the return, claimed or not. A separate fact kind for a qualifying child who is not a dependent would also cover the other head of household cases in doubt 6. It would touch Schedule EIC, Form 2441 and FTB 3532. I kept the smaller change.
