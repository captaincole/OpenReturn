# alanna — Form 4797 on two copies, a lawn care business retires its equipment

A made-up taxpayer. Every name and amount is invented. Synthetic and
**unverified**: no answer key stands behind the expected values. They are the
engine's output, checked by hand line by line (below), then locked.

## Who

Alanna Corbray, single, a full-year Florida resident (no state return). Her
only income is her lawn and grounds care business (Schedule C, material
participation): gross receipts 96,000, expenses 26,000, net profit 70,000.

In 2025 the business retired seven pieces of equipment, all section 1245
property and all held more than a year. Each sale names the business.

- Five went to a used-equipment dealer at a gain: two mowers, a trailer, a
  leaf loader and a skid steer. Part III has four property columns, so the
  fifth goes on a second Form 4797: "If you have more than four properties to
  report, use additional forms" (irs-4797-inst-2025::sec::part-iii::b01).
- Two were worn out and scrapped for nothing: an edger and a set of hedge
  trimmers. An abandonment is not a sale or exchange, and its loss goes on
  line 10 (irs-4797-inst-2025::sec::line-10::b01).

## What it covers

Form 4797 on two copies: each part counts its own rows, so Part III takes two
copies and Part II one. The totals (lines 13 to 18b and 30 to 32) print on the
first copy and add all five properties; the instructions give no rule for
totals on an additional form, and line 30 is "Total gains for all
properties". The engine's golden run checks the first copy;
`tests/unit/federal/4797/copies.test.ts` checks the second. Also: Schedule 1
line 4 and the business's QBI (Form 8995) with the Form 4797 ordinary gain.

## Documents

None. The dealer's receipts and her depreciation schedule are her answers;
equipment sales have no Form 1099-B or 1099-S.

## Hand check

Part III (line 21 = cost + expense of sale; 23 = 21 − 22; 24 = 20 − 23; 25b =
smaller of 24 and 25a):

| Copy, column | Property | 20 | 21 | 22 | 23 | 24 | 25b |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1, A | mower 1 | 6,500 | 14,000 | 11,200 | 2,800 | 3,700 | 3,700 |
| 1, B | mower 2 | 6,000 | 14,000 | 11,200 | 2,800 | 3,200 | 3,200 |
| 1, C | trailer | 2,400 | 5,000 | 5,000 | 0 | 2,400 | 2,400 |
| 1, D | leaf loader | 3,100 | 8,000 | 6,400 | 1,600 | 1,500 | 1,500 |
| 2, A | skid steer | 30,500 | 30,500 | 30,000 | 500 | 30,000 | 30,000 |

| Line | Value | How |
| --- | --- | --- |
| 4797 30 | 40,800 | 3,700 + 3,200 + 2,400 + 1,500 + 30,000 (both copies) |
| 4797 31 | 40,800 | the five lines 25b |
| 4797 32 / 6 / 7 | 0 / blank / blank | 30 − 31: every gain is recapture, so no section 1231 gain and no line 8 answer |
| 4797 10 (g) | −576; −624 | edger 0 + 1,224 − 1,800; trimmers 0 + 576 − 1,200 |
| 4797 13 / 17 / 18b | 40,800 / 39,600 / 39,600 | line 31; −576 − 624 + 40,800 |
| Sch 1 4 / 10 | 39,600 / 109,600 | Form 4797 line 18b; + Schedule C 70,000 |
| Sch SE 4a / 12 / 13 | 64,645 / 9,891 / 4,946 | 70,000 × 92.35%; 8,016 + 1,875; half of 9,891 = 4,945.50 |
| 1040 11a | 104,654 | 109,600 − 4,946 |
| 8995 1i (c) | 104,654 | 70,000 + Form 4797 ordinary 39,600 − 4,946 (irs-8995-inst-2025::sec::determining-your-qualified-business::b06) |
| 8995 5 / 10 | 20,931 | 20% of 104,654 = 20,930.80 |
| 8995 11 / 13 / 14 / 15 | 88,904 / 88,904 / 17,781 / 17,781 | 104,654 − 15,750; no capital gain or qualified dividends; 20% = 17,780.80; smaller of 10 and 14 |
| 1040 14 / 15 | 33,531 / 71,123 | 15,750 + 17,781; 104,654 − 33,531 |
| 1040 16 | 10,562 | Tax Table, single, 71,100–71,150 |
| 1040 23 / 24 / 37 | 9,891 / 20,453 / 20,453 | SE tax; 10,562 + 9,891; no payments |
