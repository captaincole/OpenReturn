import { recordAssumptions } from "./assumptions";
import {
  answerLifeQuestions,
  closeDeductions,
  getDeductions,
  recordNamedExpenses,
} from "./deductions";
import { dismissRequestedAction } from "./dismissRequestedAction";
import { ingest1098 } from "./ingest1098";
import { requestDocumentUploadFor } from "./requestDocument";
import { recordTaxFacts } from "./taxFacts";

/* The tools of the deductions conversation: its agent's, and its eval's (evals/deductions). */
export const deductionsTools = {
  getDeductions,
  answerLifeQuestions,
  recordNamedExpenses,
  recordTaxFacts,
  recordAssumptions,
  ingest1098,
  requestDocumentUpload: requestDocumentUploadFor("deductions"),
  dismissRequestedAction,
  closeDeductions,
};
