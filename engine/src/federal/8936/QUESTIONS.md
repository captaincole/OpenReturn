# Form 8936: open questions

Each item is a place where the form and the instructions do not settle a rule. The engine applies the default shown. Block ids are in `irs-8936-inst-2025` unless named.

## 1. A 2025 joint return after a 2024 return that was not joint

- Source: Schedule A lines 8d and 13c: "See instructions if your 2025 return is a joint return." The instructions for those lines say only "For additional information, see Part I under Specific Instructions for Form 8936, earlier" (`lines-8c-and-8d::b01`). Part I has the change-in-filing-status rule but no rule for which 2024 modified AGI a new joint return uses (`lines-1a-and-3a::b01`–`b03`).
- Default: when the 2025 return is joint, line 2 is over the limit, and the 2024 status is not joint, the Schedule A totals are unsupported. With a joint 2024 status, line 4 is the 2024 return's amount.
- Changes dollars: yes, for that case only.

## 2. Line 11 lists "6I"

- Source: "Enter the total, if any, credits from Schedule 3 (Form 1040), lines 1 through 4, 5b, 6d, 6I, and 6m" (`line-11::b01`; line 16 the same without 6m, `part-iv-credit-for-previously-owned::b01`).
- Default: "6I" is Schedule 3 line 6l (Form 8978). Schedule 3 has no line 6I.
- Changes dollars: no today (line 6l is not computed; a filed Form 8978 makes line 11 unsupported).

## 3. Lines 6 and 8 with personal use only

- Source: a personal-use claimant "must fill out Part II" of Schedule A (`part-iii-credit-for-personal-use-part::b01`), so Schedule A line 11 is 0. The form does not say whether Form 8936 line 6 then shows 0 or stays blank.
- Default: line 6 is the total of the Schedule A line 11 amounts, 0 included; line 8 is line 6 + line 7. Blank when no new vehicle reaches Schedule A line 11.
- Changes dollars: no.

## 4. Line 7 and line 20 (K-1 credits)

- Source: "All other filers figuring a separate credit on line 6 also report the above credits on line 7. All others not using line 6 ... can report the above credits directly on Form 3800" (`part-ii-credit-for-business::b01`; line 20 the same, `part-v-credit-for-qualified::b01`).
- Default: line 7 (20) takes the stated K-1 code AY (AZ) credit only when line 6 (19) prints. Otherwise it is blank and the credit belongs on Form 3800 directly.
- Changes dollars: no. Form 3800 takes line 8 (21) when it holds a credit, and checks that the K-1s' code AY (AZ) credits match the stated amount; with no line 8, a K-1 code AY credit is a gap there (the modified AGI test needs this form).

## 5. When to ask the 2024 answers

- Source: Schedule A lines 8d and 13c need Form 8936 lines 3–5 only when line 2 is over the limit.
- Default: the resolver cannot see Form 1040 line 11a, so it asks for the 2024 AGI and filing status whenever a new or previously owned vehicle reaches line 8c or 13b. Lines 3a–5 print only when a vehicle reaches 8d or 13c.
- Changes dollars: no.

## 6. The business-use credit goes to Form 3800

- Source: line 8 "report this amount on Form 3800, Part III, line 1y"; line 21 "... line 1aa".
- Default: lines 6–8 and 19–21 are figured. Lines 8 and 21 reach Form 3800 lines 1y and 1aa, and the allowed credit Schedule 3 line 6a (`3800/currentCredits.ts`). The basis reduction for depreciation (Schedule A lines 9, 17, 26) is not applied on Form 4562.
- Changes dollars: yes, for a return with business use: the basis reduction.

## 7. A transferred credit that lines 5–7 rule out

- Source: Schedule A line 7 "No. Stop here." The repayment steps are only on lines 8a, 8d, 13a and 13c.
- Default: unsupported (a vehicle acquired after September 30, 2025, or placed in service outside 2025, with a credit transferred to the dealer). A commercial vehicle with a transfer is unsupported too: Part V has no transfer step.
- Changes dollars: yes, for that case only.

## 8. The joint return in line 13d

- Source: line 13d "See instructions if you are filing a joint return." The instructions say nothing more.
- Default: the vehicle fact's answer (`claimedUsedCreditInPrior3Years`) stands as stated for the return.
- Changes dollars: only if Cade records it wrong.

## 9. Line 13e with cents

- Source: "Is the sales price of the vehicle more than $25,000?"
- Default: the stated price, cents kept: $25,000.01 is more than $25,000. Line 14 prints the whole-dollar price.
- Changes dollars: yes, at the edge only.

## 10. Schedule 2 line 1b or 1c for a previously owned vehicle

- Source: the Schedule A line 4 instructions say "If directed by line 8a, 8d, 13a, or 13c, you must report this amount on Schedule 2 (Form 1040), line 1b" (`line-4::b01`). The printed Schedule A lines 13a and 13c say "line 1c", and so do the Form 1040 instructions (`irs-1040-inst-2025::sec::line-1c-2::b01`).
- Default: line 1b for a new vehicle (lines 8a, 8d), line 1c for a previously owned vehicle (lines 13a, 13c). Two sources against one sentence that names all four lines.
- Changes dollars: the line only; Schedule 2 line 1z adds both, so the total tax does not change.

## Blind fill (2026-11-22)

A blind preparer filled 15 cases from the blank Form 8936 and the instructions, without the blank Schedule A. Every credit and repayment matched. The differences:

- Line 2 in a case that stops at Schedule A line 7 (acquired after September 30, 2025) or line 13a (resold within 30 days): the blind fill entered the 2025 modified AGI; the engine leaves it blank. The printed Schedule A decides: line 7 "No. Stop here." and line 13a "Yes. Stop here." come before lines 8c and 13b, which say "Complete Form 8936, lines 1 and 2." Engine kept. No credit changes.
- Lines 9 and 13 with 100% business use: blank in the engine, 0 in the blind fill. Schedule A line 11: "If you entered 100% on line 10, stop here." Engine kept.

The blind doubts that change a dollar amount, and what settles each:

- Part III subtracts the Part IV credit, not the reverse: line 11 adds Schedule 3 line 6m (`line-11::b01`), line 16 does not (`part-iv-credit-for-previously-owned::b01`). Stated rule.
- A resale 20 days after delivery repays a transferred credit: Schedule A line 13a asks "Did you resell the vehicle within 30 days of the placed-in-service date shown on line 3?" Stated rule (printed Schedule A).
- A contract and payment on October 3, 2025 is too late: a vehicle is "acquired" when "a written binding contract is entered into and a payment has been made" (`what-s-new::b01`). Stated rule.
- The repaid amount is the transferred amount: Schedule A line 4a holds it ("Yes. Enter the transferred amount shown on the seller's report"); line 4b is the check box. Stated rule (printed Schedule A).
- Schedule 2 line 1b or 1c: item 10.

## Second opinions

- PolicyEngine-US 2.152.16 (commit 794e17e6): it models the new and the previously owned credits (`variables/gov/irs/credits/clean_vehicle/`), not the commercial credit or the business-use part. Constants agree: the MAGI limits for both charts, 30% of the sales price, the $4,000 maximum and the $25,000 price limit. Logic agrees: either year's MAGI under its own year's status limit qualifies; the previously owned credit comes before the new one in the tax limit (Form 8936 line 11 adds line 6m). Its credits before the clean vehicle credits are Schedule 3 lines 1–4, 5b and 6d, without 6l (Form 8978): a scope difference, since the engine makes line 11 unsupported while Form 8978 files. Differences that are scope, not a rule: it allows both credits for all of 2025 and ends them from 2026, with no September 30 cutoff (its own note calls this an approximation); it figures the new credit from battery components, not the seller report; and it has no rule for a 2025 joint return after a 2024 return that was not joint (item 1). Nothing to change.
- IRS Direct File (IRS-Public/direct-file): a code search finds no Form 8936 or clean vehicle credit. Nothing to compare.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I lines 1a, 1b, 2, 3a–3e, 4, 5 | stated rule; the change-in-status rule has a published example (`lines-1a-and-3a::b03`) |
| Lines 1c, 1d, 1e | unsupported while Form 2555 or 4563 files (no rules); blank otherwise |
| Part II lines 6, 8 | stated rule (line 10's partial-year rule has a published example, `line-10::b02`); line 6 at 0 is own reading (3) |
| Lines 7, 20 | own reading (4) |
| Part III lines 9–13 | stated rule; "6I" is own reading (2) |
| Part IV lines 14–18 | stated rule |
| Part V lines 19, 21 | stated rule |
| Schedule A (not printed: no catalog) | stated rule; the 2025 joint-return case is unsupported (1) |
| Schedule 2 lines 1b, 1c; Schedule 3 lines 6f, 6m | stated rule (irs-1040-inst-2025 line-1b-2, line-1c-2, line-6f, line-6m) |
