import { ingest1098 } from "./ingest1098";
import { ingest1099B } from "./ingest1099B";
import { ingest1099Div, ingest1099Int, ingest1099Misc } from "./ingest1099Forms";
import { ingest1099K } from "./ingest1099K";
import { ingest1099Nec } from "./ingest1099Nec";
import { ingest1099R } from "./ingest1099R";
import { ingest1099SA } from "./ingest1099SA";
import { ingestEnergyInvoice } from "./ingestEnergyInvoice";
import { ingestHouseholdW2 } from "./ingestHouseholdW2";
import { ingestSsa1099 } from "./ingestSsa1099";
import { ingestW2 } from "./ingestW2";
import { ingestW2G } from "./ingestW2G";
import { recordBusiness } from "./recordBusiness";
import { recordDependent } from "./recordDependent";
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
  ingestHouseholdW2,
  ingestEnergyInvoice,
  ingestW2G,
  ingest1099K,
  ingest1099Nec,
  recordBusiness,
  recordDependent,
  recordRental,
};

/* Twice the SDK's 4,096: a 20-trade ingest-1099-b call is about 4,300 tokens. */
export const INGEST_MAX_OUTPUT_TOKENS = 8192;
