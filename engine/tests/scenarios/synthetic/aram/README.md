# aram — Form 3468 on two copies, a solar array and a rehabilitated mill

A made-up taxpayer. Every name and amount is invented. Synthetic and
**unverified**: no answer key stands behind the expected values. They are the
engine's output, checked by hand line by line (below), then locked.

## Who

Aram Pellingham, single, a full-year Texas resident (no state return). His
income is his furniture shop (Schedule C, material participation): gross
receipts 610,000, expenses 288,000, net profit 322,000. The shop is in a
historic mill he owns.

- In 2025 he put a 60 kW dc (50 kW ac) rooftop solar array in service. It is
  under 1 MW, so the 30% rate and the 10% bonuses apply. It has a 45 kW
  low-income community allocation, and a city loan from tax-exempt bonds paid
  for part of it.
- The mill's certified rehabilitation was placed in service in March 2024.
  2025 is the second of its five years.

## What it covers

Two Forms 3468: copy 1 is Part VI section B and section N; copy 2 is Part
VII. The golden run checks copy 1; `tests/unit/federal/3468/form.test.ts`
checks copy 2. Form 3800 takes Part VI line 32 on line 4a and Part VII line 3
on line 4k, both specified credits. The credit is more than Form 3800 allows,
so line 38 is the limit and the rest carries forward. Schedule 3 line 6a and
Form 1040 line 20 take line 38.

## Documents

None. The basis, the allocation and the bond financing are his answers from
the shop's fixed asset records, the allocation letter and the loan statement;
the rehabilitation amounts are from his records and the NPS certification.
No IRS form reports them.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 3468 3a / 3b / 3c | 120,000 / 30 / 36,000 | basis; line 7a checked; 120,000 × 30% |
| 3468 3d / 3e / 3g / 3h | 10 / 45 / 0.75 / 7.5% | line 11a; allocation; 45 ÷ 60 kW dc; 10% × 0.75 |
| 3468 3i / 3j | 9,000 / 9,000 | 120,000 × 7.5%; 60 kW is more than 45 kW |
| 3468 3k / 3l, 3m / 3n | 10 / 12,000, 10 / 12,000 | lines 9a and 10a: 10% each |
| 3468 4 / 27 | 69,000 / 69,000 | 36,000 + 9,000 + 12,000 + 12,000 |
| 3468 28a / 28b / 28c / 28d / 28e | 0.125 / 8,625 / 10,350 / 8,625 / 60,375 | 15,000 ÷ 120,000; 69,000 × 0.125; × 15%; smaller; 69,000 − 8,625 |
| 3468 29 / 30 / 32 | 60,375 | bonds used; no elective payment; no cooperative credit |
| 3468 copy 2: 1e / 1f / 1g / 1j / 3 | 180,000 / 250,000 / 250,000 / 10,000 / 10,000 | 250,000 is more than 180,000; 250,000 × 4% |
| 3800 4a / 4k / 5 (e) | 60,375 / 10,000 / 70,375 | Form 3468 lines 32 and 3 |
| 3800 7 / 12 / 13 | 51,564 / 51,564 / 6,641 | Form 1040 line 16; 25% × (51,564 − 25,000) |
| 3800 27 / 37 / 38 | 44,923 / 44,923 / 44,923 | 51,564 − 6,641; smaller of 44,923 and 70,375 |
| Sch 3 6a / 1040 20 / 22 | 44,923 / 44,923 / 6,641 | Form 3800 line 38; 51,564 − 44,923 |
