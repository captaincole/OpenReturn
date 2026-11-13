import type {
  ActivityDepreciation,
  AmortizedCost,
  DepreciableAsset,
} from "@openreturn/engine/facts";
import { z } from "zod";

/* The depreciation answers of one business or rental (Form 4562, FTB 3885A), shared by record-business and record-rental. */

const amount = z.number().nonnegative();

/* A missing, extra or mistyped field (against the engine's type) fails to compile. */
const asset: { [K in keyof DepreciableAsset]-?: z.ZodType<DepreciableAsset[K]> } = {
  description: z.string().describe("What the asset is, e.g. 'Office furniture'"),
  placedInService: z.iso.date().describe("The date placed in service in 2025, YYYY-MM-DD"),
  cost: amount.describe("Cost or other basis, before the business-use share"),
  businessUsePercent: amount.max(100).optional().describe("Business or investment use, percent"),
  recoveryClass: z
    .enum([
      "3_year",
      "5_year",
      "7_year",
      "10_year",
      "15_year",
      "20_year",
      "25_year",
      "residential_rental",
      "nonresidential_real",
      "50_year",
    ])
    .describe("Form 4562 lines 19a–19j: the property's class (Pub. 946)"),
  method: z
    .enum(["200DB", "150DB", "SL"])
    .describe("200% or 150% declining balance, or straight line"),
  convention: z
    .enum(["HY", "MQ", "MM"])
    .describe(
      "Half-year, mid-quarter (over 40% placed in service in Oct–Dec), or mid-month (real property)",
    ),
  section179Elected: amount
    .optional()
    .describe("Part of the cost they elect to expense under section 179"),
  acquiredAfterJanuary19: z
    .boolean()
    .optional()
    .describe(
      "For an asset placed in service after January 19, 2025: was it acquired after that date?",
    ),
  electedOutOfSpecialAllowance: z
    .boolean()
    .optional()
    .describe("They elected not to take the special depreciation allowance for this class"),
  elected40PercentAllowance: z
    .boolean()
    .optional()
    .describe("For property acquired after January 19, 2025: they elected 40% instead of 100%"),
  listedProperty: z
    .boolean()
    .optional()
    .describe("A car or other listed property (Part V; not supported yet: say so)"),
  californiaBasis: amount
    .optional()
    .describe("California basis, only when it differs from federal"),
  californiaSection179Elected: amount
    .optional()
    .describe("California section 179 election (limit $25,000), only when they make one"),
};

const amortizedCost: { [K in keyof AmortizedCost]-?: z.ZodType<AmortizedCost[K]> } = {
  description: z.string().describe("What the costs are, e.g. 'Startup costs'"),
  beginsOn: z.iso.date().describe("The date the amortization begins in 2025, YYYY-MM-DD"),
  amount: amount.describe("The amortizable amount"),
  codeSection: z.string().describe("The Code section, e.g. '195'"),
  periodMonths: z.number().int().positive().describe("The amortization period in months"),
  californiaAmount: amount.optional().describe("California amount, only when it differs"),
};

const depreciation: { [K in keyof ActivityDepreciation]-?: z.ZodType<ActivityDepreciation[K]> } = {
  assets: z.array(z.object(asset)).optional().describe("Assets placed in service in 2025"),
  priorYearMacrs: amount
    .optional()
    .describe("Depreciation for 2025 on assets placed in service before 2025 (Form 4562 line 17)"),
  section179Carryover: amount
    .optional()
    .describe("Section 179 deduction carried over from 2024 (2024 Form 4562 line 13)"),
  amortizedCosts: z
    .array(z.object(amortizedCost))
    .optional()
    .describe("Costs whose amortization begins in 2025"),
  priorYearAmortization: amount
    .optional()
    .describe("Amortization for 2025 of costs that began before 2025 (Form 4562 line 43)"),
  californiaPriorYearDepreciation: amount
    .optional()
    .describe(
      "California depreciation on assets placed in service before 2025, only when it differs",
    ),
  californiaPriorYearAmortization: amount
    .optional()
    .describe("California amortization of costs that began before 2025, only when it differs"),
};

export const depreciationSchema = z
  .object(depreciation)
  .optional()
  .describe(
    "Form 4562: assets placed in service in 2025, older depreciation and amortization. Leave the line 13 or line 18 expense out when you pass this.",
  );
