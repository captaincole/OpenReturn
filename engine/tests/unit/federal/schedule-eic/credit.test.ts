/* Source: irs-1040-inst-2025, lines 27a–27c (Steps 1–5, Worksheets A and B) and the 2025 EIC Table (§ line-9). */

import { describe, expect, it } from "vitest";
import eicTable2025 from "../../../../src/data/eic-table-2025.json" with { type: "json" };
import {
  FORM_8862_GAP,
  MARRIED_HOH_GAP,
  SELF_ONLY_EIC_GAP,
  earnedIncomeCredit,
  eicTableCredit,
  worksheetCredit,
  type EicAnswers,
  type EicReturn,
} from "../../../../src/federal/schedule-eic/credit.js";

/*
 * Rows copied from the printed table: phase-in, plateau, phase-out, the
 * footnoted rows (* , **, ***) and the last rows, for all eight columns
 * (single/HOH/QSS 0–3 children, then married filing jointly 0–3).
 */
const PRINTED_ROWS = `
1 50 2 9 10 11 2 9 10 11
50 100 6 26 30 34 6 26 30 34
2,450 2,500 189 842 990 1,114 189 842 990 1,114
5,000 5,050 384 1,709 2,010 2,261 384 1,709 2,010 2,261
8,450 8,500 649 2,882 3,390 3,814 649 2,882 3,390 3,814
8,500 8,550 649 2,899 3,410 3,836 649 2,899 3,410 3,836
10,600 10,650 649 3,613 4,250 4,781 649 3,613 4,250 4,781
10,650 10,700 645 3,630 4,270 4,804 649 3,630 4,270 4,804
12,700 12,750 488 4,328 5,090 5,726 649 4,328 5,090 5,726
12,750 12,800 484 4,328 5,110 5,749 649 4,328 5,110 5,749
15,000 15,050 312 4,328 6,010 6,761 649 4,328 6,010 6,761
17,850 17,900 94 4,328 7,152 8,046 638 4,328 7,152 8,046
17,900 17,950 90 4,328 7,152 8,046 634 4,328 7,152 8,046
19,050 19,100 2 4,328 7,152 8,046 546 4,328 7,152 8,046
19,150 19,200 0 4,328 7,152 8,046 538 4,328 7,152 8,046
23,300 23,350 0 4,328 7,152 8,046 221 4,328 7,152 8,046
23,350 23,400 0 4,324 7,147 8,041 217 4,328 7,152 8,046
26,250 26,300 0 3,861 6,536 7,430 0 4,328 7,152 8,046
30,450 30,500 0 3,189 5,651 6,545 0 4,328 7,152 8,046
30,500 30,550 0 3,181 5,641 6,535 0 4,319 7,140 8,034
33,650 33,700 0 2,678 4,978 5,872 0 3,816 6,477 7,371
40,000 40,050 0 1,663 3,640 4,534 0 2,801 5,140 6,034
45,000 45,050 0 864 2,587 3,481 0 2,002 4,087 4,981
50,450 50,500 0 0 1,439 2,333 0 1,131 2,939 3,833
68,600 68,650 0 0 0 0 0 0 0 11
`;

const parseRow = (line: string) => line.split(" ").map((cell) => Number(cell.replace(",", "")));
const rows = PRINTED_ROWS.trim().split("\n").map(parseRow);

/* The footnotes: [amount, children, joint, credit]; at or above the limit, no credit. */
const FOOTNOTES: Array<[number, number, boolean, number]> = [
  [19_103, 0, false, 0],
  [19_104, 0, false, 0],
  [26_213, 0, true, 1],
  [26_214, 0, true, 0],
  [50_433, 1, false, 3],
  [50_434, 1, false, 0],
  [57_309, 2, false, 1],
  [57_310, 2, false, 0],
  [57_553, 1, true, 0],
  [61_554, 3, false, 1],
  [61_555, 3, false, 0],
  [64_429, 2, true, 3],
  [64_430, 2, true, 0],
  [68_674, 3, true, 3],
  [68_675, 3, true, 0],
];

describe("eicTableCredit", () => {
  it.each(rows)("matches the printed row %d–%d in every column", (atLeast, lessThan, ...cells) => {
    for (const [index, credit] of cells.entries()) {
      const joint = index >= 4;
      const children = index % 4;
      expect(eicTableCredit(atLeast!, children, joint)).toBe(credit);
      expect(eicTableCredit(lessThan! - 1, children, joint)).toBe(credit);
    }
  });

  it.each(FOOTNOTES)(
    "follows the footnote at %d (%d children, joint %s)",
    (amount, children, joint, credit) => {
      expect(eicTableCredit(amount, children, joint)).toBe(credit);
    },
  );

  it("covers $1 to $68,700 in $50 rows with no gap, and counts four or more children as three", () => {
    const table = eicTable2025.rows;
    expect(table[0]!.slice(0, 2)).toEqual([1, 50]);
    for (const [index, row] of table.slice(1).entries()) {
      expect(row[0]).toBe(table[index]![1]);
      expect(row[1]! - row[0]!).toBe(50);
    }
    expect(table.at(-1)![1]).toBe(68_700);
    expect(eicTableCredit(0, 1, false)).toBe(0);
    expect(eicTableCredit(68_000, 4, true)).toBe(eicTableCredit(68_000, 3, true));
  });
});

describe("worksheetCredit (Worksheet A lines 1–6)", () => {
  it("takes the smaller of the earned income and AGI lookups above the line 4 amount", () => {
    // HOH, one child: earned 32,000 (2,942), AGI 33,650 (2,678).
    expect(worksheetCredit(32_000, 33_650, 1, false)).toBe(2_678);
  });

  it("uses the earned income lookup when AGI equals it or is under the line 4 amount", () => {
    expect(worksheetCredit(20_000, 20_000, 1, false)).toBe(4_328);
    expect(worksheetCredit(5_000, 9_000, 0, false)).toBe(384);
    expect(worksheetCredit(5_000, 17_000, 0, true)).toBe(384);
  });
});

const ANSWERED: EicAnswers = {
  qualifyingChildren: 1,
  childrenWithSsn: 1,
  childrenOpen: false,
  nonresidentAlien: false,
  qualifyingChildOfAnother: false,
  mainHomeInUs: true,
  claimableAsDependent: false,
  deniedInEarlierYear: false,
  barredByIrs: false,
};

const HOH: EicReturn = {
  filingStatus: "head_of_household",
  agi: 33_650,
  investmentIncome: 0,
  earnedIncome: 32_000,
  worksheetB: false,
  taxpayerSsn: "400-00-0001",
  taxpayerDob: "01/01/1981",
};

const WAITING_OUTCOME = { kind: "waiting" };
const NO_CHILD: EicAnswers = { ...ANSWERED, qualifyingChildren: 0, childrenWithSsn: 0 };
const SINGLE: EicReturn = { ...HOH, filingStatus: "single", agi: 9_000, earnedIncome: 9_000 };

describe("earnedIncomeCredit", () => {
  it("credits a head of household with one qualifying child", () => {
    expect(earnedIncomeCredit(HOH, ANSWERED)).toEqual({ kind: "credit", amount: 2_678 });
  });

  it("stops at Step 1 over the AGI limit before any answer is read", () => {
    expect(
      earnedIncomeCredit(
        { ...HOH, agi: 400_000 },
        { qualifyingChildren: 1, childrenWithSsn: 1, childrenOpen: false },
      ),
    ).toEqual({
      kind: "none",
      checkLine27c: false,
    });
  });

  it("waits while an answer or a dependent's test is open", () => {
    expect(earnedIncomeCredit(HOH, { ...ANSWERED, nonresidentAlien: undefined })).toEqual({
      kind: "waiting",
    });
    expect(earnedIncomeCredit(HOH, { ...ANSWERED, childrenOpen: true })).toEqual({
      kind: "waiting",
    });
  });

  it("checks line 27c where the steps say to", () => {
    expect(earnedIncomeCredit(HOH, { ...ANSWERED, nonresidentAlien: true })).toEqual({
      kind: "none",
      checkLine27c: true,
    });
    expect(earnedIncomeCredit(HOH, { ...ANSWERED, qualifyingChildOfAnother: true })).toEqual({
      kind: "none",
      checkLine27c: true,
    });
  });

  it("stops over the investment income limit, and on an IRS ban; an earlier denial (Form 8862) is unsupported", () => {
    expect(earnedIncomeCredit({ ...HOH, investmentIncome: 11_951 }, ANSWERED)).toEqual({
      kind: "none",
      checkLine27c: false,
    });
    expect(earnedIncomeCredit(HOH, { ...ANSWERED, barredByIrs: true }).kind).toBe("none");
    expect(earnedIncomeCredit(HOH, { ...ANSWERED, deniedInEarlierYear: true })).toEqual({
      kind: "unsupported",
      reason: FORM_8862_GAP,
    });
  });

  it("does not model the EIC without a qualifying child when no child has a valid SSN", () => {
    const underNoChildLimit = { ...HOH, agi: 9_000, earnedIncome: 9_000 };
    expect(earnedIncomeCredit(underNoChildLimit, { ...ANSWERED, childrenWithSsn: 0 })).toEqual({
      kind: "unsupported",
      reason: SELF_ONLY_EIC_GAP,
    });
  });

  describe("Step 3, questions 4 and 5, married filing separately", () => {
    const MFS: EicReturn = { ...HOH, filingStatus: "married_filing_separately" };
    const credit = earnedIncomeCredit(HOH, ANSWERED);

    it("goes on to question 6 when the spouses lived apart the last 6 months", () => {
      expect(earnedIncomeCredit(MFS, { ...ANSWERED, livedApartLastSixMonths: true })).toEqual(
        credit,
      );
    });

    it("waits on question 4, then on question 5", () => {
      expect(earnedIncomeCredit(MFS, ANSWERED)).toEqual(WAITING_OUTCOME);
      expect(earnedIncomeCredit(MFS, { ...ANSWERED, livedApartLastSixMonths: false })).toEqual(
        WAITING_OUTCOME,
      );
    });

    it("goes on when legally separated and apart at year end, and stops otherwise", () => {
      const together = { ...ANSWERED, livedApartLastSixMonths: false };
      expect(
        earnedIncomeCredit(MFS, { ...together, legallySeparatedApartAtYearEnd: true }),
      ).toEqual(credit);
      // "No. STOP You can't take the credit": no line 27c box.
      expect(
        earnedIncomeCredit(MFS, { ...together, legallySeparatedApartAtYearEnd: false }),
      ).toEqual({ kind: "none", checkLine27c: false });
    });
  });

  it("credits a single filer with no qualifying child aged 25 to 64", () => {
    expect(earnedIncomeCredit(SINGLE, NO_CHILD)).toEqual({ kind: "credit", amount: 649 });
  });

  it("applies Step 4 to a filer with no qualifying child", () => {
    const old = { ...SINGLE, taxpayerDob: "12/31/1960" };
    expect(earnedIncomeCredit(old, NO_CHILD)).toEqual({ kind: "none", checkLine27c: false });
    expect(earnedIncomeCredit(SINGLE, { ...NO_CHILD, mainHomeInUs: false })).toEqual({
      kind: "none",
      checkLine27c: true,
    });
    expect(earnedIncomeCredit(SINGLE, { ...NO_CHILD, claimableAsDependent: true })).toEqual({
      kind: "none",
      checkLine27c: false,
    });
    expect(
      earnedIncomeCredit({ ...SINGLE, filingStatus: "married_filing_separately" }, NO_CHILD).kind,
    ).toBe("none");
    // No fact says whether a head of household is married (Step 4, question 1).
    expect(earnedIncomeCredit({ ...SINGLE, filingStatus: "head_of_household" }, NO_CHILD)).toEqual({
      kind: "unsupported",
      reason: MARRIED_HOH_GAP,
    });
  });

  it("stops on earned income at the limit; Worksheet B checks line 27c then", () => {
    expect(earnedIncomeCredit({ ...SINGLE, earnedIncome: 19_104, agi: 18_000 }, NO_CHILD)).toEqual({
      kind: "none",
      checkLine27c: false,
    });
    const worksheetB = { ...SINGLE, worksheetB: true };
    expect(
      earnedIncomeCredit({ ...worksheetB, earnedIncome: 19_104, agi: 18_000 }, NO_CHILD),
    ).toEqual({ kind: "none", checkLine27c: true });
    expect(earnedIncomeCredit({ ...worksheetB, earnedIncome: -500 }, NO_CHILD)).toEqual({
      kind: "none",
      checkLine27c: true,
    });
  });

  describe("earned income at the limit with AGI under it", () => {
    // MFJ, six children with SSNs (limit $68,675): wages 69,000, AGI 62,000.
    const SIX: EicAnswers = { qualifyingChildren: 6, childrenWithSsn: 6, childrenOpen: false };
    const MFJ: EicReturn = {
      ...HOH,
      filingStatus: "married_filing_jointly",
      agi: 62_000,
      earnedIncome: 69_000,
      spouseSsn: "400-00-0002",
    };

    it("stops without the answers the filer is never asked; Step 5 leaves line 27c blank", () => {
      expect(earnedIncomeCredit(MFJ, SIX)).toEqual({ kind: "none", checkLine27c: false });
      expect(earnedIncomeCredit({ ...MFJ, earnedIncome: 68_675 }, SIX).kind).toBe("none");
      expect(earnedIncomeCredit({ ...MFJ, earnedIncome: 68_674 }, SIX)).toEqual(WAITING_OUTCOME);
    });

    it("checks line 27c on Worksheet B (line 5: No)", () => {
      expect(earnedIncomeCredit({ ...MFJ, worksheetB: true }, SIX)).toEqual({
        kind: "none",
        checkLine27c: true,
      });
    });

    it("keeps an answered step that stops first, and waits on AGI", () => {
      // Head of household (limit $61,555): Step 1, question 4 checks the box.
      const hoh = { ...HOH, agi: 60_000, earnedIncome: 62_000 };
      expect(earnedIncomeCredit(hoh, SIX)).toEqual({ kind: "none", checkLine27c: false });
      expect(earnedIncomeCredit(hoh, { ...SIX, nonresidentAlien: true })).toEqual({
        kind: "none",
        checkLine27c: true,
      });
      expect(earnedIncomeCredit({ ...MFJ, agi: undefined }, SIX)).toEqual(WAITING_OUTCOME);
    });

    it("uses the largest limit while a dependent's test is open", () => {
      const open: EicAnswers = { qualifyingChildren: 1, childrenWithSsn: 1, childrenOpen: true };
      expect(earnedIncomeCredit({ ...MFJ, earnedIncome: 60_000 }, open)).toEqual(WAITING_OUTCOME);
      expect(earnedIncomeCredit(MFJ, open)).toEqual({ kind: "none", checkLine27c: false });
    });

    it("stops on line 1z while the combat pay election is not modeled", () => {
      const reason = "no election fact";
      const combat = { ...MFJ, earnedIncome: undefined, earnedIncomeGap: reason };
      expect(earnedIncomeCredit({ ...combat, earnedIncomeAtLeast: 69_000 }, SIX)).toEqual({
        kind: "none",
        checkLine27c: false,
      });
      // Every answer in, so Step 5 is reached.
      const answered = { ...ANSWERED, ...SIX };
      expect(earnedIncomeCredit({ ...combat, earnedIncomeAtLeast: 60_000 }, answered)).toEqual({
        kind: "unsupported",
        reason,
      });
    });
  });
});
