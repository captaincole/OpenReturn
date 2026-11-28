# Form 8941 — doubts and defaults

The engine fills Form 8941 for an individual: a sole proprietor or a farmer who pays health insurance premiums for employees through a SHOP Marketplace, and K-1 credits on line 15. One fact holds Worksheets 1 and 4 (`facts/kinds/smallEmployerHealthCredit.ts`). The instructions publish examples for the premiums (Examples 3 and 4) and the FTE count. The regulations (26 CFR 1.45R-3) publish examples for the phaseouts and the state subsidy limit. The IRS Q&A publishes one for the average premium limit. Each one is a unit test. The synthetic `jaim` (both phaseouts, a K-1) and `kenly` (no phaseout, California) fill every line.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, lines A to C | Stated rule (stated answers) |
| Line 1, line 2 (Worksheets 1 and 2) | Published example with numbers (48 half-time employees, 2.99) |
| Line 3 (Worksheet 3) | Published example with numbers ($2,999) |
| Line 4 | Published example with numbers (Example 3) |
| Line 5 (Worksheet 4 column (c)) | Published example with numbers (Example 4, regulation examples); the ratio is own reading (item 1) |
| Lines 6, 7 | Published example with numbers (regulation (c)(3) Example 1) |
| Lines 8, 9 (Worksheets 5 and 6) | Published example with numbers (regulation (c)(3) Example 2, another year's amount); the places are a decision (item 3) |
| Lines 10 to 12 | Published example with numbers (regulation (d)(4) Example 3) |
| Lines 13, 14 (Worksheet 7) | Stated rule |
| Line 15 | Stated rule; rounding each K-1 is a decision (item 6) |
| Line 16 | Stated rule |
| Lines 17 to 20 | Stated rule: blank for an individual |
| Schedule C line 14, Schedule F line 15 | Stated rule |
| Schedule CA line 3 column B | Stated rule |
| Form 3800 line 4h | Stated rule |

No field is unsupported. Lines 17 to 20 are blank because an individual is not a cooperative, an estate, a trust or a tax-exempt employer.

## Two texts conflict

### 3. The phaseout ratios keep every digit

- Source: Worksheet 5 line 4 and Worksheet 6 line 5: "Enter the result as a decimal (rounded to at least 3 places)" (`irs-8941-inst-2025::sec::worksheet-5-information-needed-to::b01`, `worksheet-6-information-needed-to::b01`). The regulation's example: "The credit reduction for FTEs in excess of 10 is $6,400 ($48,000 × 2/15)" (26 CFR 1.45R-3(c)(3), Example 2; the regulations are not in the corpus).
- Decision: every digit kept. The worksheet allows more than 3 places, and only the exact fraction gives the example's $6,400 (0.133 gives $6,384). `DECISION` comment in `lines.ts`; row A122 in `docs/rule-decisions.md`.
- Changes dollars: yes, a few dollars. jaim's line 8 is $22,610; at 3 places it is $22,619.

### 6. Line 15 rounds each K-1

- Source: line 15 takes the K-1 credits (`irs-8941-inst-2025::sec::line-15::b01`), with no rule for cents. The Form 1040 instructions round "only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). Form 3800 Part V lists each pass-through entity's whole-dollar amount (`irs-3800-inst-2025::sec::part-v-3::b01`).
- Decision: each K-1 rounds, then adds, as Forms 8846 (A96) and 8820 (A121) do. `DECISION` comment in `resolveInfo.ts`; row A123.
- Changes dollars: at most $1 for each K-1 with cents.

## Should we do this now

### 1. Worksheet 4 column (c) scales what the employer paid

- Source: column (c) is "the premiums you would've paid if the employee had enrolled in a plan or plans with a total premium equal to the average premium" (`column-a-enrolled-individuals::b03`). Example 4 applies the employer's 60% share of the plan's premium to the average premium, pay period by pay period (`::b04`).
- Default: column (c) is the employer's payment times the county average for the tier, over the plan's yearly premium for that tier. That equals the example's method when the employer's share is the same all year. The fact states each plan's yearly premium.
- The instructions also say "You'll need an additional set of calculations if the premium amounts changed during the tax year." The engine has one premium for each plan and year.
- Changes dollars: no for a premium that did not change. With a change in the year, the taxpayer states the coverage as two plans, one for each part of the year.
- Status: done.

### 2. One rating area

- Source: "The rating area in which an employee enrolls for coverage is generally the rating area where your business is located (based on your primary business address)"; employers with plans in more than one SHOP Marketplace may have different averages (`column-a-enrolled-individuals::b02`).
- Default: one pair of average premiums (employee-only, family) for the return, stated from the table row of the business's county.
- Changes dollars: no for an employer with one SHOP Marketplace.
- Status: done. More than one rating area is a proposal below.

### 4. Line 9 is never below 0

- Source: Worksheet 6 line 7 says only "Subtract line 6 from line 1". The instructions: the two limitations "will separately reduce your credit. This may reduce your credit to zero" (`eligible-small-employers::b02`, `::b03`).
- Default: line 9 is at least 0. Line 12 is then at least 0.
- Changes dollars: no; a negative credit has no line to go to.
- Status: done.

### 5. "$33,000" on the form, "$33,300" on Worksheet 6

- Source: line 9: "If line 3 is $33,000 or less, enter the amount from line 8" (`irs-8941-face-2025::sec::face-page-1::b03`). Worksheet 6: "Subtract $33,300 from line 3" (`worksheet-6-information-needed-to::b01`).
- Default: no conflict. Line 3 is a multiple of $1,000, so $33,000 or less and $33,300 or less are the same test. Above it, Worksheet 6 uses $33,300.
- Changes dollars: no.

### 7. Hours and FTEs round down

- Source: Worksheet 2: "generally round the result down to the next lowest whole number" (`worksheet-2-information-needed-to::b01`).
- Default: always round down; "less than one" is 1. The instructions name no case that rounds another way.
- Changes dollars: no.

### 8. The credit is more than the stated premiums line

- Source: "You must reduce your line 14 deduction by the amount of any credit" (`irs-1040sc-inst-2025::sec::line-14::b01`).
- Default: a credit larger than the stated Schedule C line 14 (or Schedule F line 15) is a gap: the line holds the premiums the credit reduces. A household employee's premiums count for the credit (`column-a-individuals-considered::b04`) but are not a business deduction; that case is the same gap.
- Changes dollars: no; the return waits for a person.

### 9. Hawaii

- Source: "Employers in Hawaii can't participate in the SHOP Marketplace or claim the credit" (`line-a::b02`).
- Default: a Hawaii employer answers line A "No", so the form does not file. The engine does not check the state.
- Changes dollars: no.

### 10. Other K-1 and cooperative sources of line 15

- Source: line 15 also takes Schedule K-1 (Form 1041) box 13 code G and Form 1099-PATR box 12 (`line-15::b01`).
- Default: the engine reads only partnership and S corporation K-1s (code BA). The trust table does not list box 13 code G, so that K-1 item is not modeled (`passThrough/README.md`). The engine does not read Form 1099-PATR box 12.
- Changes dollars: yes, for a trust beneficiary or a patron with this credit. Rare.
- Status: not now.

### 11. California and a farm

- Source: "For California purposes, the full amount of insurance is deductible" (`ftb-pub-1001-2025::sec::small-employer-health::b01`), entered on "line 3, column B" (`::enter-on-schedule-ca-540-part-i-or-10::b01`).
- Default: Schedule CA line 3 column B gives back the Schedule C reduction. The text names no line for a farm, so Schedule CA line 6 stays the gap it already is for a farm's Form 8941 credit (`state/ca/schedule-ca/answerLines.ts`).
- Changes dollars: no for a Schedule C business.

## Proposals for a discussion

- **Two Forms 8941 for spouses.** Two spouses with separate businesses that are not one employer "can file two Forms 8941 with a jointly filed Form 1040" (`eligible-small-employers::b04`). The fact is one per return. The change: a fact per employer group, and form copies as Form 8820 has.
- **More than one business or rating area.** A sole proprietor with two businesses files one Form 8941 for both (`eligible-small-employers::b03`), but each business deducts its own premiums. The fact names one activity, so the whole line 12 comes off that activity's line. The change: an activity and a rating area on each employee, and line 12 split by each activity's share of line 6.
