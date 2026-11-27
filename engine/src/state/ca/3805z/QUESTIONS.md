# FTB 3805Z: open questions

The enterprise zones ended on January 1, 2014. For 2025 the form only uses
carryovers from before then: the hiring credit, the sales or use tax credit and
the EZ net operating loss (NOL). The engine fills it for an individual on Form
540. No filled example of the 2025 form exists; the booklet's examples with
numbers are unit tests (`tests/unit/state/ca/3805z/lines.test.ts`).

## Doubts

1. **Section A percentages keep four places, the rest dropped.** No text gives
   a rule. The booklet's example prints 66.66% for $800,000 / $1,200,000 and
   73.33% for the average, and its $183,325 is $250,000 × 0.7333
   (`ca-3805z-booklet-2025::sec::apportionment::b07`). Default: follow the
   example. Dollars: yes, small ($8 in the example against full precision).
2. **Line 2 is blank for an investor.** "Individual investors receiving
   pass-through EZ credits, complete Worksheet I, Section B and Schedule Z"
   (`::how-to-claim-deductions-and-credit-carryovers::b01`): no Section A, so
   no percentage. The same block says "All other investors complete Worksheet
   I, Section A", which names no one the engine can tell apart. Default:
   blank. Dollars: no.
3. **Items E to H are blank for an investor.** "Investors of pass-through
   entities, complete items A through D"
   (`::form-ftb-3805z-instructions-for-items-a-through-h::b01`). Dollars: no.
4. **Line 6a has no exemption credit.** "Compute the tax as if the former EZ
   taxable income represented all of your taxable income", "Use the tax table
   or tax rate schedule" (`::part-i-computation-of-credit-limitations::b02`,
   `::individuals::b01`). Default: the Tax Table or rate schedule on line 5,
   with no exemption credit. Dollars: yes, up to the exemption credit ($153
   for a single filer), when line 6a is the smaller line.
5. **Line 1d is 0.** Only credit that the $5,000,000 limit disallows can be
   elected refundable (`::line-1d-credit-limitation::b01`). A credit available
   above $5,000,000 is unsupported. The limit counts all business credits
   together; the engine does not add the other business credits to this one,
   as FTB 3541 does not. Dollars: only above $5,000,000.
6. **The credit's name.** The Credit Table lists "Enterprise Zone Hiring" and
   "Enterprise Zone Sales or Use Tax", both code 176
   (`ca-540-sched-p-inst-2025::sec::credit-table::b06`); one line takes both
   (`::credit-code::b01`). Default: "Enterprise Zone". Dollars: no.
7. **The NOL suspension test is FTB 3805V's.** The booklet repeats FTB
   3805V's rule: individuals with net business income or modified AGI under
   $1,000,000 are not affected
   (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b01`). The
   engine reads both tests as FTB 3805V does (`state/ca/3805v/figures.ts`).
   Dollars: no change from FTB 3805V's reading.
8. **The age of an EZ NOL is not checked.** A loss carries 15 years (before
   2008) or 20 years, plus the suspension years
   (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b05`). The
   engine takes last year's Worksheet II column (e) as stated, for 2001 to
   2013. Dollars: no, when the stated amounts are right.
9. **FTB 3805V does not see the EZ NOL.** FTB 3805V's modified taxable income
   starts from California AGI before lines 9b1 and 9b2 (`schedule-ca/line10.ts`);
   line 9b3 is not subtracted there either. No text says which NOL comes
   first. Dollars: only with both a general and an EZ NOL; no scenario has
   both.
10. **Business credits "before other credits".** The booklet: "Business
    credits should be applied against 'net tax' before other credits"
    (`::general-information::b02`). Schedule P (540) applies Sections A1 and
    B1 (child care, renter's) before Section B2. The engine follows Schedule P,
    as for every other credit. Dollars: only when the tax is short.
11. **The NOL deduction for AMT.** "use Schedule P ... to compute the NOL for
    alternative minimum tax purposes" (`::alternative-minimum-tax::b01`).
    Schedule P (540) line 20 stays unsupported, as it is for FTB 3805V.

## Proposals for a discussion

- **Read Worksheet I from the return.** Column (a) of Worksheet I, Section B
  is stated by the taxpayer (wages, Schedule C, K-1 income). The engine could
  read the zone employer's W-2 box 16 and Schedule C line 31 with its Schedule
  CA adjustment instead. That needs a link from a W-2 or business fact to the
  zone business: a change to how facts work.
- **More than one zone business.** "Attach a separate form FTB 3805Z for each
  EZ business" (`::how-to-claim-deductions-and-credit-carryovers::b01`), each
  with its own line 7. The engine has one business fact and one form. Copies
  of the form (as FTB 3804-CR has) with one business fact each would cover it.
- **Entity filers.** Schedule Z Parts III and IV and column (c) are for
  corporations and S corporations, which the engine does not file.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header, items A to D | stated rule |
| Items E to H | stated rule |
| Part I lines 1a to 1c | published example with numbers (Schedule Z Part II example) |
| Line 1d | stated rule (0 below the limit; unsupported above it) |
| Part II line 2 (Section A) | published example with numbers (Corporations A and B); four places is own reading |
| Part III lines 3a to 3c (Worksheet II) | published example with numbers (Worksheet II example) |
| Schedule Z line 1 (Section B line 14) | published example with numbers (the Andersons, three K-1s) |
| Schedule Z lines 2 to 5 | stated rule |
| Schedule Z lines 6a, 6b, 7 | stated rule; no exemption credit on 6a is own reading |
| Schedule Z Part II, lines 8 and 9 | published example with numbers (Schedule Z Part II example) |
| Schedule Z Parts III and IV | stated rule (blank for an individual) |
