import { ingest1099B } from "./ingest1099B";
import { ingest1099Div, ingest1099Int, ingest1099Misc } from "./ingest1099Forms";
import { ingest1099R } from "./ingest1099R";
import { ingest1099SA } from "./ingest1099SA";
import { ingestEnergyInvoice } from "./ingestEnergyInvoice";
import { ingestHouseholdW2 } from "./ingestHouseholdW2";
import { ingestSsa1099 } from "./ingestSsa1099";
import { ingestW2 } from "./ingestW2";

/*
 * Every document-ingest tool. Cade registers these, and the ingest eval
 * (evals/ingest/run.ts) runs the same set, so a new tool lands in both.
 */
export const ingestTools = {
  ingestW2,
  ingest1099Int,
  ingest1099Div,
  ingest1099Misc,
  ingest1099B,
  ingest1099R,
  ingest1099SA,
  ingestSsa1099,
  ingestHouseholdW2,
  ingestEnergyInvoice,
};

/*
 * The output limit an ingest call needs: twice the SDK's 4,096. One
 * ingest-1099-b call carries up to 20 trades, about 4,300 tokens; at
 * 4,096 a call with 21 trades came back with no trades.
 */
export const INGEST_MAX_OUTPUT_TOKENS = 8192;
