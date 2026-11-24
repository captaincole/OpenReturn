import { ToolSearchProcessor, type ToolSearchProcessorOptions } from "@mastra/core/processors";
import { ingest1095A } from "./ingest1095A";
import { ingest1098 } from "./ingest1098";
import { ingest1098E } from "./ingest1098E";
import { ingest1098T } from "./ingest1098T";
import { ingest1099B } from "./ingest1099B";
import { ingest1099BFutures } from "./ingest1099BFutures";
import { ingest1099Div, ingest1099Int, ingest1099Misc } from "./ingest1099Forms";
import { ingest1099G } from "./ingest1099G";
import { ingest1099K } from "./ingest1099K";
import { ingest1099Ltc } from "./ingest1099Ltc";
import { ingest1099Nec } from "./ingest1099Nec";
import { ingest1099R } from "./ingest1099R";
import { ingest1099SA } from "./ingest1099SA";
import { ingest3921 } from "./ingest3921";
import { ingestCareProviderStatement } from "./ingestCareProviderStatement";
import { recordChildInvestmentAnswers } from "./ingestChild1099";
import { ingestCleanVehicleReport } from "./ingestCleanVehicleReport";
import { ingestEnergyInvoice } from "./ingestEnergyInvoice";
import { ingestForeignIncomeStatement } from "./ingestForeignIncomeStatement";
import { ingestHouseholdW2 } from "./ingestHouseholdW2";
import { ingestMortgageCreditCertificate } from "./ingestMortgageCreditCertificate";
import { ingestSavingsBondRecord } from "./ingestSavingsBondRecord";
import { ingestScheduleK1 } from "./ingestScheduleK1";
import { ingestSsa1099 } from "./ingestSsa1099";
import { ingestW2 } from "./ingestW2";
import { ingestW2G } from "./ingestW2G";
import { recordBusiness } from "./recordBusiness";
import { recordDependent } from "./recordDependent";
import { recordK1Holding } from "./recordK1Holding";
import { recordRental } from "./recordRental";

export const ingestTools = {
  ingestW2,
  ingest1099Int,
  ingest1099Div,
  ingest1099Misc,
  ingest1099B,
  ingest1099R,
  ingest1099SA,
  ingestSsa1099,
  ingest1098,
  ingest1098E,
  ingestHouseholdW2,
  ingestEnergyInvoice,
  ingestW2G,
  ingest1099K,
  ingest1099Nec,
  ingest1099G,
  ingest1095A,
  ingest3921,
  ingest1098T,
  ingestForeignIncomeStatement,
  ingestCleanVehicleReport,
  ingest1099BFutures,
  ingestCareProviderStatement,
  ingestScheduleK1,
  ingestMortgageCreditCertificate,
  ingestSavingsBondRecord,
  ingest1099Ltc,
  recordBusiness,
  recordDependent,
  recordRental,
  recordK1Holding,
  recordChildInvestmentAnswers,
};

/*
 * The ingest tools stay out of the prompt until Cade loads one by name
 * (`load_tool`); each skill names its tools. "context" storage: a tool is
 * loaded while its `load_tool` result is in the conversation, so the loaded
 * set follows the thread's messages and survives a restart.
 */
export const ingestToolLoader = () =>
  new ToolSearchProcessor({
    /* The processor's type has no request context; each tool still validates its own. */
    tools: ingestTools as unknown as ToolSearchProcessorOptions["tools"],
    storage: "context",
  });

/* Twice the SDK's 4,096: a 20-trade ingest-1099-b call is about 4,300 tokens. */
export const INGEST_MAX_OUTPUT_TOKENS = 8192;
