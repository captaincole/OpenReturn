/*
 * Form 982's arithmetic against every published example with numbers: the
 * Form 982 instructions, Pub. 4681 (2025) and Pub. 908 (2025). A test named by
 * its source checks the amounts the source prints; the other lines of that
 * test are the engine's reading of the same rules (QUESTIONS.md).
 */

import { describe, expect, it } from "vitest";
import { figureForm982, type Form982Outcome } from "../../../../src/federal/982/form.js";
import {
  insolvencyAmount,
  NO_ATTRIBUTES,
  PRINCIPAL_RESIDENCE_LIMIT,
  type Attributes,
  type DebtInput,
} from "../../../../src/federal/982/lines.js";
import { principalResidenceExclusion } from "../../../../src/federal/982/partOne.js";

const debt = (value: Partial<DebtInput> & Pick<DebtInput, "income">): DebtInput => ({
  key: "canceled_debt.test",
  kind: "personal",
  title11Case: false,
  insolventBefore: false,
  ...value,
});

const attrs = (value: Partial<Attributes>): Attributes => ({ ...NO_ATTRIBUTES, ...value });

function figured(outcome: Form982Outcome) {
  if (outcome.kind !== "figured") throw new Error(`expected figured, got ${outcome.reason}`);
  return outcome;
}

const run = (debts: DebtInput[], insolvency = 0, attributes = NO_ATTRIBUTES) =>
  figured(figureForm982(debts, insolvency, attributes, PRINCIPAL_RESIDENCE_LIMIT));

describe("insolvency (line 1b)", () => {
  it("irs-982-inst-2025 line-1b::b01 example: $5,000 card, $3,000 insolvent", () => {
    const result = run(
      [debt({ income: 5000, insolventBefore: true })],
      insolvencyAmount(10000, 7000),
    );
    expect(result.form?.line1b).toBe(true);
    expect(result.form?.line2).toBe(3000);
    expect(result.nonbusinessTaxable).toBe(2000);
  });

  it("irs-pub-4681-2025 Example 1 (price-reduced-after::b05–b06): insolvent by more than the debt", () => {
    const result = run(
      [debt({ income: 5000, insolventBefore: true })],
      insolvencyAmount(15000, 7000),
    );
    expect(result.form?.line2).toBe(5000);
    expect(result.nonbusinessTaxable).toBe(0);
  });

  it("irs-pub-4681-2025 Example 2 (price-reduced-after::b06–b07): $3,000 excluded, $2,000 on line 8c", () => {
    const result = run(
      [debt({ income: 5000, insolventBefore: true })],
      insolvencyAmount(10000, 7000),
    );
    expect(result.form?.line2).toBe(3000);
    expect(result.nonbusinessTaxable).toBe(2000);
  });

  it("irs-pub-4681-2025 Example 3 (part-iii::b02–b03): each spouse's share on a separate return", () => {
    const you = run(
      [debt({ income: 7500, insolventBefore: true })],
      insolvencyAmount(15000, 10000),
    );
    expect(you.form?.line2).toBe(5000);
    expect(you.nonbusinessTaxable).toBe(2500);
    const spouse = run(
      [debt({ income: 2500, insolventBefore: true })],
      insolvencyAmount(9000, 5000),
    );
    expect(spouse.form?.line2).toBe(2500);
    expect(spouse.nonbusinessTaxable).toBe(0);
  });

  it("irs-pub-4681-2025 bankruptcy-and-insolvency::b01–b04: line 10a is $100 (basis + money − liabilities)", () => {
    const result = run(
      [debt({ income: 1500, insolventBefore: true })],
      insolvencyAmount(14500, 11600),
      attrs({
        otherPropertyBasis: 5500,
        moneyAfterDischarge: 600,
        liabilitiesAfterDischarge: 6000,
      }),
    );
    expect(result.form?.line2).toBe(1500);
    expect(result.form?.line10a).toBe(100);
    // The nonbusiness chart: lines 1b, 2 and 10a only; line 3 is not asked.
    expect(result.form?.line3Yes).toBeUndefined();
    expect(result.form?.line3No).toBeUndefined();
  });

  it("the line 10a limit without the money would be 0 (the DECISION in form.ts counts it)", () => {
    const result = run(
      [debt({ income: 1500, insolventBefore: true })],
      2900,
      attrs({ otherPropertyBasis: 5500, liabilitiesAfterDischarge: 6000 }),
    );
    expect(result.form?.line10a).toBeUndefined();
  });
});

describe("Pub. 908 (2025), Charlie Jones: insolvent, $10,000 forgiven", () => {
  const charlie = attrs({
    netOperatingLoss: 5000, // $2,000 for 2025 + $3,000 from 2022
    netCapitalLoss: 5000,
    depreciableBasis: 40000, // the condominium less its $10,000 land
    otherPropertyBasis: 10000,
    moneyAfterDischarge: 0,
    liabilitiesAfterDischarge: 110000,
  });
  const debts = [debt({ income: 10000, insolventBefore: true, kind: "other_business" })];

  it("elects to reduce basis first: line 5 is $10,000", () => {
    const result = run(debts, insolvencyAmount(120000, 100000), {
      ...charlie,
      electedDepreciableBasisReduction: 10000,
    });
    expect(result.form?.line2).toBe(10000);
    expect(result.form?.line5).toBe(10000);
    expect(result.form?.line6).toBeUndefined();
    expect(result.form?.line9).toBeUndefined();
    expect(result.form?.line3No).toBe(true);
  });

  it("without the election the NOLs, then the capital loss carryover", () => {
    const result = run(debts, 20000, charlie);
    expect(result.form?.line6).toBe(5000);
    expect(result.form?.line9).toBe(5000);
    expect(result.form?.line5).toBeUndefined();
  });
});

describe("qualified farm indebtedness (line 1c)", () => {
  const farmDebt = (value: Partial<DebtInput> = {}) =>
    debt({ income: 10000, kind: "farm", ...value });

  it("irs-pub-4681-2025 Example 1 (qualified-farm-indebtedness::b04–b05): $8,000 excluded, $2,000 income", () => {
    const result = run([farmDebt()], 0, attrs({ netOperatingLoss: 5000, depreciableBasis: 3000 }));
    expect(result.form?.line1c).toBe(true);
    expect(result.form?.line2).toBe(8000);
    expect(result.businessTaxable).toBe(2000);
    expect(result.form?.line6).toBe(5000);
    expect(result.form?.line11a).toBe(3000);
  });

  it("irs-pub-4681-2025 Example 2 (b05–b06): insolvency first, then the farm exclusion, line 2 $10,000", () => {
    const result = run(
      [farmDebt({ insolventBefore: true })],
      insolvencyAmount(11000, 7000),
      attrs({ netOperatingLoss: 7000, depreciableBasis: 4000 }),
    );
    expect(result.form?.line1b).toBe(true);
    expect(result.form?.line1c).toBe(true);
    expect(result.form?.line2).toBe(10000);
    expect(result.businessTaxable).toBe(0);
    expect(result.form?.line6).toBe(7000);
    expect(result.form?.line11a).toBe(3000);
  });

  it("irs-pub-4681-2025 Example 3 (b06–b07): insolvent by the whole debt, only line 1b", () => {
    const result = run(
      [farmDebt({ insolventBefore: true })],
      10000,
      attrs({ netOperatingLoss: 7000, depreciableBasis: 4000 }),
    );
    expect(result.form?.line1b).toBe(true);
    expect(result.form?.line1c).toBeUndefined();
    expect(result.form?.line2).toBe(10000);
  });

  it("the farm pass order: lines 6 to 9, then 11a, 11b, 11c, 12, 13 (line-1c::b02)", () => {
    const result = run(
      [farmDebt({ income: 20000 })],
      0,
      attrs({
        netCapitalLoss: 1000,
        depreciableBasis: 2000,
        farmLandBasis: 3000,
        otherQualifiedPropertyBasis: 4000,
        passiveActivityLoss: 5000,
        foreignTaxCredit: 2000,
      }),
    );
    expect(result.form?.line9).toBe(1000);
    expect(result.form?.line11a).toBe(2000);
    expect(result.form?.line11b).toBe(3000);
    expect(result.form?.line11c).toBe(4000);
    expect(result.form?.line12).toBe(5000);
    expect(result.form?.line13).toBe(5000);
    expect(result.form?.line10a).toBeUndefined();
    expect(result.form?.line2).toBe(20000);
  });

  it("a basis reduction on line 10a before a farm exclusion is a gap", () => {
    const outcome = figureForm982(
      [debt({ income: 1000, insolventBefore: true }), farmDebt()],
      1000,
      attrs({ otherPropertyBasis: 5000, moneyAfterDischarge: 5000, depreciableBasis: 9000 }),
      PRINCIPAL_RESIDENCE_LIMIT,
    );
    expect(outcome.kind).toBe("gap");
  });
});

describe("qualified real property business indebtedness (line 1d)", () => {
  const store = (value: Partial<DebtInput> = {}) =>
    debt({
      income: 20000,
      kind: "real_property_business",
      realProperty: {
        principalBeforeDischarge: 185000,
        propertyValue: 165000,
        otherQualifiedDebt: 0,
      },
      ...value,
    });

  it("irs-pub-4681-2025 qualified-real-property::b05–b07: the whole $20,000 on lines 2 and 4", () => {
    const result = run(
      [store()],
      0,
      attrs({ depreciableBasis: 260000, depreciableRealPropertyBasis: 210000 }),
    );
    expect(result.form?.line1d).toBe(true);
    expect(result.form?.line2).toBe(20000);
    expect(result.form?.line4).toBe(20000);
    expect(result.businessTaxable).toBe(0);
  });

  it("irs-pub-4681-2025 qualified-real-property-2 Example 1 (b01–b04): line 4 $8,000 and line 5 $12,000", () => {
    const result = run(
      [store({ insolventBefore: true })],
      12000,
      attrs({
        netOperatingLoss: 3000,
        netCapitalLoss: 2000,
        depreciableBasis: 260000,
        depreciableRealPropertyBasis: 210000,
        electedDepreciableBasisReduction: 12000,
      }),
    );
    expect(result.form?.line1b).toBe(true);
    expect(result.form?.line1d).toBe(true);
    expect(result.form?.line4).toBe(8000);
    expect(result.form?.line5).toBe(12000);
    expect(result.form?.line2).toBe(20000);
  });

  it("irs-pub-4681-2025 qualified-real-property-2 Example 2 (b04–b05): line 2 $14,000, line 4 $4,000, line 6 $10,000", () => {
    const result = run(
      [
        debt({
          income: 14000,
          kind: "real_property_business",
          insolventBefore: true,
          realProperty: {
            principalBeforeDischarge: 134000,
            propertyValue: 120000,
            otherQualifiedDebt: 0,
          },
        }),
      ],
      10000,
      attrs({
        netOperatingLoss: 15000,
        depreciableBasis: 145000,
        depreciableRealPropertyBasis: 145000,
      }),
    );
    expect(result.form?.line2).toBe(14000);
    expect(result.form?.line4).toBe(4000);
    expect(result.form?.line6).toBe(10000);
  });

  it("the first limit: principal less the property's value net of other qualified debt", () => {
    const result = run(
      [
        store({
          realProperty: {
            principalBeforeDischarge: 185000,
            propertyValue: 175000,
            otherQualifiedDebt: 5000,
          },
        }),
      ],
      0,
      attrs({ depreciableRealPropertyBasis: 210000 }),
    );
    expect(result.form?.line4).toBe(15000);
    expect(result.businessTaxable).toBe(5000);
  });

  it("the second limit when nothing else reduces basis: the real property basis", () => {
    const result = run([store()], 0, attrs({ depreciableRealPropertyBasis: 6000 }));
    expect(result.form?.line4).toBe(6000);
  });

  it("the second limit after another basis reduction that may fall on it is a gap", () => {
    const outcome = figureForm982(
      [store({ insolventBefore: true })],
      12000,
      attrs({
        depreciableBasis: 30000,
        depreciableRealPropertyBasis: 15000,
        electedDepreciableBasisReduction: 12000,
      }),
      PRINCIPAL_RESIDENCE_LIMIT,
    );
    expect(outcome.kind).toBe("gap");
  });
});

describe("qualified principal residence indebtedness (line 1e)", () => {
  it("irs-pub-4681-2025 Example 3 (qualified-principal::b05–b06): $5,000 excluded, $110,000 on line 8c", () => {
    const result = run([
      debt({
        income: 115000,
        kind: "principal_residence",
        residence: { loanBalance: 735000, qualifiedPart: 625000, keepsHome: false, excluded: true },
      }),
    ]);
    expect(result.form?.line1e).toBe(true);
    expect(result.form?.line2).toBe(5000);
    expect(result.nonbusinessTaxable).toBe(110000);
    expect(result.form?.line10b).toBeUndefined();
  });

  it("irs-982-inst-2025 line-1e::b03 ordering example: $100,000 before the cap", () => {
    expect(principalResidenceExclusion(300000, 1000000, 800000, 2000000).excluded).toBe(100000);
  });

  it("the same example with the $750,000 cap (DECISION in partOne.ts): $50,000", () => {
    expect(principalResidenceExclusion(300000, 1000000, 800000, 750000).excluded).toBe(50000);
  });

  it("irs-pub-4681-2025 qualified-real-property-2::b08–b09: $2,000 forgiven at foreclosure is excluded", () => {
    const result = run([
      debt({
        income: 2000,
        kind: "principal_residence",
        residence: { loanBalance: 180000, qualifiedPart: 180000, keepsHome: false, excluded: true },
      }),
    ]);
    expect(result.form?.line2).toBe(2000);
    expect(result.nonbusinessTaxable).toBe(0);
  });

  it("line 10b is the smaller of the exclusion and the home's basis (line-10b::b01)", () => {
    const home = (homeBasis: number) =>
      run([
        debt({
          income: 40000,
          kind: "principal_residence",
          residence: {
            loanBalance: 300000,
            qualifiedPart: 300000,
            keepsHome: true,
            homeBasis,
            excluded: true,
          },
        }),
      ]).form?.line10b;
    expect(home(250000)).toBe(40000);
    expect(home(30000)).toBe(30000);
  });

  it("married filing separately: the $375,000 cap", () => {
    const outcome = figured(
      figureForm982(
        [
          debt({
            income: 100000,
            kind: "principal_residence",
            residence: {
              loanBalance: 450000,
              qualifiedPart: 450000,
              keepsHome: false,
              excluded: true,
            },
          }),
        ],
        0,
        NO_ATTRIBUTES,
        375000,
      ),
    );
    expect(outcome.form?.line2).toBe(25000);
    expect(outcome.nonbusinessTaxable).toBe(75000);
  });

  it("an election of insolvency instead: line 1b, not 1e", () => {
    const result = run(
      [
        debt({
          income: 20000,
          kind: "principal_residence",
          insolventBefore: true,
          residence: {
            loanBalance: 200000,
            qualifiedPart: 200000,
            keepsHome: false,
            excluded: false,
          },
        }),
      ],
      30000,
    );
    expect(result.form?.line1e).toBeUndefined();
    expect(result.form?.line1b).toBe(true);
    expect(result.principalResidenceExcluded).toBe(0);
  });
});

describe("title 11 (line 1a) and the limits", () => {
  it("a title 11 discharge is excluded in full and takes no other box", () => {
    const result = run(
      [
        debt({
          income: 12000,
          title11Case: true,
          insolventBefore: true,
          kind: "principal_residence",
        }),
      ],
      50000,
      attrs({ netOperatingLoss: 4000 }),
    );
    expect(result.form?.line1a).toBe(true);
    expect(result.form?.line1b).toBeUndefined();
    expect(result.form?.line1e).toBeUndefined();
    expect(result.form?.line2).toBe(12000);
    expect(result.form?.line6).toBe(4000);
  });

  it("a credit takes at most 3 times its amount (331/3 cents per dollar)", () => {
    const result = run(
      [debt({ income: 9000, title11Case: true })],
      0,
      attrs({
        generalBusinessCredit: 1000,
        minimumTaxCredit: 500,
        passiveActivityCredit: 200,
        foreignTaxCredit: 300,
      }),
    );
    expect(result.form?.line7).toBe(3000);
    expect(result.form?.line8).toBe(1500);
    expect(result.form?.line12).toBe(600);
    expect(result.form?.line13).toBe(900);
  });

  it("with enough attributes, lines 5 to 13 (not 10b) add up to line 2", () => {
    const result = run(
      [debt({ income: 30000, title11Case: true })],
      0,
      attrs({
        electedDepreciableBasisReduction: 2000,
        depreciableBasis: 5000,
        netOperatingLoss: 6000,
        generalBusinessCredit: 1000,
        minimumTaxCredit: 1000,
        netCapitalLoss: 4000,
        otherPropertyBasis: 20000,
        moneyAfterDischarge: 20000,
      }),
    );
    const form = result.form!;
    const parts = [
      form.line5,
      form.line6,
      form.line7,
      form.line8,
      form.line9,
      form.line10a,
      form.line12,
      form.line13,
    ];
    expect(parts.reduce<number>((total, each) => total + (each ?? 0), 0)).toBe(form.line2);
  });

  it("with too few attributes, Part II is less than line 2 (line-2::b01)", () => {
    const result = run(
      [debt({ income: 30000, title11Case: true })],
      0,
      attrs({ netOperatingLoss: 1000 }),
    );
    expect(result.form?.line2).toBe(30000);
    expect(result.form?.line6).toBe(1000);
  });

  it("line 3 Yes with the election; its basis joins line 5", () => {
    const result = run(
      [debt({ income: 8000, title11Case: true })],
      0,
      attrs({
        realPropertyForSaleBasis: 6000,
        treatRealPropertyForSaleAsDepreciable: true,
        electedDepreciableBasisReduction: 8000,
      }),
    );
    expect(result.form?.line3Yes).toBe(true);
    expect(result.form?.line3No).toBeUndefined();
    expect(result.form?.line5).toBe(6000);
  });

  it("nothing excluded: no form, the whole debt taxable", () => {
    const result = run([debt({ income: 4321.6 })]);
    expect(result.form).toBeUndefined();
    expect(result.nonbusinessTaxable).toBe(4321.6);
  });

  it("each total rounds to the nearest dollar", () => {
    const result = run(
      [
        debt({ income: 1000.5, insolventBefore: true }),
        debt({ income: 999.25, insolventBefore: true }),
      ],
      5000,
    );
    expect(result.form?.line2).toBe(2000);
  });
});
