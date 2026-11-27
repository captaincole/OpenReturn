# Form 8881: open questions

The instructions (`irs-8881-inst-2025`) publish no example with numbers, and
no IRS publication in the corpus has one. The unit tests check the stated
rules and their edges. Two readings with conflicting texts are decisions
(`docs/rule-decisions.md` rows A103 and A104); the doubts below have no
conflicting text.

## Doubts

1. **Line 6a above 100 employees.** The form: "If the number of employees
   entered on line 6a is 51–100, continue to line 6e(1)"
   (`irs-8881-face-2025::sec::face-part-i::b02`). It says nothing for more
   than 100. Default: line 6e runs, and line 6e(4) stops at 0, so the credit
   is 0. Section 45E(f)(2)(B) reduces the amount by 2 points for each
   employee over 50, so the statute gives 0 too. Dollars: no.
2. **California.** The engine takes the startup costs and contributions off
   Schedule C or F, so a California return starts from the reduced amounts.
   No California text names this credit: FTB Pub. 1001 and the Schedule CA
   list of "Business deductions related to" federal credits
   (`ca-540-sched-ca-inst-2025::sec::business-deductions-related-to::b01`)
   leave it out. Default: no Schedule CA adjustment. Dollars: yes, for a
   California resident, if California allows the full deduction.
3. **Where the startup costs are deducted.** "You must reduce your otherwise
   allowable deduction for startup costs by the credit amount on line 5"
   (`::no-deduction-allowed-for-credit-amount::b01`) names no line. The plan
   fact names the expense field (`deductedOn`). Part V other expenses
   (Schedule C line 27b, Schedule F line 32) are not a choice. Dollars: no.
4. **A stated deduction smaller than the credit.** The reduction stops at 0,
   and a field the activity does not state is not reduced. Dollars: no, for
   a fact stated as the books show it.
5. **Eligibility the form does not print.** No plan for the same employees in
   the 3 years before (`::section-1-small-employer-pension-plan::b01`), the
   100-employee test of Part II (`::how-to-figure-the-credit::b01`), a
   non-highly compensated employee, and a military spouse's status
   (`::how-to-figure-the-credit-2::b03`) are the taxpayer's claim: the plan
   fact holds only the credits the plan qualifies for. The engine applies the
   counts the form prints (line A, line 6a and the Part III caution).
   Dollars: no.
6. **The owner's own contributions.** Schedule C line 19 and Schedule F line
   23 hold contributions for employees; an owner's own go on Schedule 1 line
   16 (`irs-1040sc-inst-2025::sec::line-19::b01`). Default: the plan fact
   lists employees only, and line 6g reduces line 19 or 23. Dollars: no.
7. **One plan per return.** "All eligible employer plans of the same employer
   are treated as one eligible employer plan" (`::section-1-small-employer-pension-plan::b02`).
   A second plan fact makes both malformed, and Cade asks again. On a joint
   return the spouses can be two employers; the engine takes one. Dollars:
   no, while the facts are asked again.
8. **Line 6b blank, line 6c 0.** Line 6c says "If you do not make these types
   of contributions, enter -0-"; line 6b says nothing. Default: line 6b is
   blank with no employee at or under $1,000. Dollars: no.
9. **The first credit year election.** "you may elect to have the preceding
   tax year be the first credit year" (`::section-1-small-employer-pension-plan::b03`).
   The fact states the credit year as the taxpayer counts it. Dollars: no.
10. **The election not to claim.** "You may elect, however, to have section
    45E not apply ... by not claiming it" (`::part-i::b01`). The reductions
    read only the plan fact, as Form 5884's do, so the decision
    `decisions.scope.must_file_8881` = false takes the credit off Form 3800
    but still lowers the deductions. Default: the fact is the claim; to elect
    out, the plan fact is removed. Dollars: yes, if the decision is false and
    the fact stays.
11. **Rounding.** Line 1 and the contribution sums keep cents and round once;
    line 6e(3), line 6g and line 2 round to the dollar (CLAUDE.md). Line
    6e(2) prints two places ("0.16"). Dollars: at most $1.
12. **Wages of exactly $105,000.** Line 6b leaves out "contributions made to
    employees whose wages paid to the employee were in excess of $105,000"
    (`::section-2-small-employer-contributions::b02`). Default: wages of
    exactly $105,000 count; only more is left out. Dollars: yes, the
    employee's contribution, if "in excess of" were read as "at least".
13. **Line 12's three-year window.** Line 12 counts military spouses who
    "have not participated in the plan at any time prior to the 2 tax years
    preceding the tax year" (`::line-12::b01`). Default: in 2025 a spouse who
    began in 2023, 2024 or 2025 counts, and one who began in 2022 does not;
    line 13 leaves out that spouse's contributions too (`::line-13::b01`).
    Dollars: yes, $200 plus up to $300 a spouse, if the window were read
    another way.

## The statute and the instructions

For `docs/law-findings.md`: line 6c's third-year amount. Instructions: "do
not include contributions of more than $1,334 per employee"
(`irs-8881-inst-2025::sec::line-6c::b01`), and $1,334 x 75% = $1,000.50.
Statute: "The amount determined under paragraph (1) ... with respect to any
employee of the employer shall not exceed $1,000"
(`usc-26-2025::sec::s45e::f-2-A`). The engine follows the instructions
(decision A103).

## Second opinions

- **Blind fill** (15 cases, from the blank form and instructions only): no
  dollar difference. One blank against 0: case 8, line 6b (the engine blank,
  the blind fill 0) with no employee at or under $1,000 (item 8). The blind
  doubts that could change dollars (no credit outside the credit years, the
  $1,334 third-year amount, rounding, wages of exactly $105,000, line 12's
  window) match the engine's defaults (items 11 to 13, decision A103).
- **PolicyEngine-US 2.154.1** (commit 0fbed6ddb1): `variables/gov/irs` and
  `parameters/gov/irs` have no section 45E, Form 8881, startup cost,
  auto-enrollment or military spouse variable. `general_business_credit` is
  a bare input with no formula. Nothing to compare.
- **IRS Direct File** (IRS-Public/direct-file, commit e365f9f): its tree has
  no Form 8881, section 45E, Form 3800 or Schedule C file. Nothing to compare.

## Proposals for a discussion

- **A member of a controlled group.** "As a member, compute your credit based
  on your proportionate share ... Attach a statement" (`::member-of-controlled-group-or-business-under::b01`
  and the three like it). The engine writes no statements and has no fact
  for a group's share. A share field on the plan fact, with the statement,
  would need a pattern for attached statements.
- **Two employers on a joint return.** A plan fact for each spouse's
  business, each with its own limits, would let a joint return carry two
  Forms 8881 or one combined form. Which one the IRS expects is not stated.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Section 1, lines A to 5 | stated rule (form and instructions) |
| Section 2, lines 6a to 6g | stated rule; decisions A103 and A104 |
| Lines 7, 10 and 14 (K-1 codes AE, AF, AG) | stated rule |
| Totals, lines 8, 11 and 15 | stated rule |
| Part II, line 9 | stated rule |
| Part III, lines 12 and 13 | stated rule |
| Schedule C lines 17 and 19, Schedule F line 23 reductions | stated rule; the line is the fact's (item 3) |
| No line is unsupported; a plan whose sponsor is not a business or farm of the return is a gap | own reading |
