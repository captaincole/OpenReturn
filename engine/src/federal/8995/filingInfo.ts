import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8995AFilingInfo } from "../8995-a/filingInfo.js";

/* resolve8995AInfo fills these QBI slots whichever QBI form files. */
export interface Form8995FilingInfo
  extends
    BaseFilingInfo,
    Pick<Form8995AFilingInfo, "qbiBusinesses" | "qbiScheduleSEFiled" | "qualifiedReitDividends"> {}
