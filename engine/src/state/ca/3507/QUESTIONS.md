# FTB 3507 — open questions

The 2025 instructions have no example with numbers. The rules were written from
the form and its instructions (`ca-3507-form-2025`) and Schedule P (540)
(`ca-540-sched-p-inst-2025`).

## Decided by the author

### 1. Line 7 keeps the credit the tax could not use

- Text A: "Generally, there is no provision for carryover of any unused Prison Inmate Labor Credit ... However, for taxable years 2024 through 2026, taxpayers are allowed to carryover the amount of credit disallowed due to the $5,000,000 business credit limitation" (`ca-3507-form-2025::sec::credit-limitation::b02`). Schedule P (540): "only the disallowed portion of the credit may be carried over" (`ca-540-sched-p-inst-2025::sec::section-a1-instructions::b01`).
- Text B: line 7, "Credit limited by your tax liability ... can, however, be carried over for future years. Include any such amounts here" (`ca-3507-form-2025::sec::line-7::b01`), and the form's arithmetic, line 5 less lines 6a to 6c.
- Done: Text B. The form's arithmetic wins over a sentence that breaks it. The `DECISION` comment is above line 7 in `bindings.ts`; the row is in `docs/rule-decisions.md`.
- Dollars: no change to this year's tax. Line 7 prints the rest of the credit. In `katerine` it prints $2,733; Text A would print $0.
- The law library was not installed, so the statute was not read.

## Defaults with no conflicting text

### 2. The $5,000,000 limit applies to Schedule P (540) line 4 column (b)

- Source: "The total of all business credits ... may not reduce the 'net tax' ... by more than $5,000,000" (`ca-3507-form-2025::sec::credit-limitation::b01`). The Schedule P (540) face puts the asterisk ("column (b) cannot exceed $5,000,000") on line 5 (b), not on line 4 (b) (`ca-540-sched-p-face-2025::sec::face-part-iii::b01`).
- Default: the limit applies to line 4 too. The credit is not on the list of credits the limit leaves out (`ca-540-sched-p-inst-2025::sec::how-to-compute-the-limitation::b01`), and Section A holds line 4.
- Dollars: only for a credit used above $5,000,000.

### 3. Code 162 uses the limit first

- Source: "Business credits should be applied against 'net tax' before other credits" (`::credit-limitation::b01`). Line 4 is the first row of Schedule P (540) Part III.
- Default: no other business credit has used the limit before code 162. A later business credit (FTB 3801-CR's research credit, Section B2) does not count this credit against the limit: that is the open item 8 of `3801-cr/QUESTIONS.md`.
- Dollars: only when the business credits together are above $5,000,000.

### 4. The FTB 3870 election is one answer for the return

- Source: "you must make the same election for all other credits you claimed this year that were also disallowed due to the $5,000,000 credit limitation" (`::line-6c::b01`).
- Default: one fact, `ca_business_credit_limitation.elect_refundable`. Cade is asked for it only when line 5 is above $5,000,000. With no answer the line waits; under the limit line 6c is 0.
- Dollars: none below the limit.

### 5. Lines that print 0

- Line 6b prints 0: "If you are not a corporation, enter -0-" (the form). The engine figures individual returns only.
- Line 6c prints 0 with no election or nothing disallowed. Line 7 prints 0 when line 5 is used in full. Lines 1 to 4 print 0 when the stated amount is 0.
- Dollars: none.

### 6. Line 3 rounds once

- Source: "add the amounts and enter the total" (`::line-3::b01`).
- Default: the stated K-1 credits keep their cents while adding, and only the total is rounded, as for any document sum (CLAUDE.md).
- Dollars: at most $1.

### 7. Line 4 is the stated carryover

- Source: "Enter the amount of credit carryover from 2024 on line 4" (`::line-4::b01`).
- Default: the engine takes last year's line 7 as the taxpayer states it. It does not check that the amount came from the $5,000,000 limit (decision 1).
- Dollars: none this year beyond the stated amount.

### 8. The header

- The name is the names on the return, the box is "SSN or ITIN", and the number is the taxpayer's SSN. The Secretary of State file number belongs to an LLC or a corporation, so it is blank.

### 9. Order on Form 540 lines 43 and 44

- Source: "If you claim one or two other credits, enter the name, code, and amount of the credit from column (b) on Form 540, line 43 and/or line 44" (`ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01`).
- Default: code 162 comes first, in Schedule P (540) Part III order. The name is the Credit Table's, "Prison Inmate Labor".
- Dollars: none.

## Unsupported

| Case | Why |
| --- | --- |
| Line 6a, 6c and 7 for wages or a K-1 credit through a disregarded single member LLC | "the usable credit amount ... is limited to the difference between the taxpayer's regular tax figured with the income of the disregarded entity, and the taxpayer's regular tax figured without" (`::c-limitations::b01`). The engine does not figure the tax twice. |
| Line 6a on Form 540NR | Form 540NR and Schedule P (540NR) have no credit rules yet. |
| Line 6a with no Form 540 (a Form 541, 100S, 565 or 568 return) | Those returns are not in the engine. |
| Line 6a when a decision says Schedule P (540) does not file | Only Schedule P (540) figures the tentative minimum tax that limits the credit (`::c-limitations::b02`). A Section A1 credit attaches the schedule (`ca-540-sched-p-inst-2025::sec::b-who-must-file::b01`), so the engine files it on its own; only an explicit "no" leads here. FTB 3801-CR and FTB 3804-CR, which read `540/creditBalance.ts` without Schedule P, then do not see this credit; Form 540 lines 43 to 48 carry the gap. |

## Proposals for a discussion

- The disregarded SMLLC limit needs the regular tax figured twice: with and without the LLC's income. That is a new way of evaluating a return (a second pass), so it waits for a discussion. FTB 3804-CR has the same gap.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header | stated rule |
| Lines 1 to 5 | stated rule |
| Line 6a, Schedule P (540) line 4 | stated rule (the TMT floor and the column rules); the $5,000,000 limit is own reading (2) |
| Line 6b | stated rule |
| Line 6c | stated rule, own reading of the one answer (4) |
| Line 7 | decided by the author (1) |
| SMLLC, Form 540NR, other returns | unsupported |
