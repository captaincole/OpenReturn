/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { BusinessFactValue } from "../../facts/index.js";
import { SSN } from "../../values.js";
import type { ScheduleCFilingInfo } from "./filingInfo.js";
import type { ScheduleC } from "./types.js";

const LINE_J =
  "No fact says whether the required Forms 1099 were or will be filed; line J applies only when line I is Yes.";
const OTHER_METHOD = "The business fact has no field that names an 'other' accounting method.";

/* The business this copy is for. */
export function businessOf(info: ScheduleCFilingInfo): BusinessFactValue | undefined {
  return info.businesses?.[info.scheduleCCopyIndex ?? 0];
}

// A business with no owner belongs to the taxpayer (Schedule SE reads it the same way).
function ownerOf(info: ScheduleCFilingInfo): "taxpayer" | "spouse" | undefined {
  const business = businessOf(info);
  return business ? (business.owner ?? "taxpayer") : undefined;
}

const yes = (value: boolean | undefined) => value;
const no = (value: boolean | undefined) => (value === undefined ? undefined : !value);

function method(info: ScheduleCFilingInfo, which: "cash" | "accrual" | "other") {
  const chosen = businessOf(info)?.accountingMethod;
  return chosen === undefined ? undefined : chosen === which;
}

export function register(): void {
  defineForm<ScheduleC, ScheduleCFilingInfo>("schedule-c", {
    bindings: {
      // A joint return names only the spouse who owns this business.
      "0.header.name": (_, info) => {
        const owner = ownerOf(info);
        const first = owner === "spouse" ? info.spouseFirstName : info.taxpayerFirstName;
        const last = owner === "spouse" ? info.spouseLastName : info.taxpayerLastName;
        return owner && first && last ? `${first} ${last}` : undefined;
      },
      "0.header.ssn": (_, info) => {
        const owner = ownerOf(info);
        if (!owner) return undefined;
        return owner === "spouse" ? info.spouseSSN : info.taxpayerSSN;
      },
      "0.line.a_principal_business": (_, info) => businessOf(info)?.activity,
      "0.line.b_business_code": (_, info) => businessOf(info)?.code,
      "0.line.c_business_name": (_, info) => businessOf(info)?.name,
      // The EIN widget is a 9-box comb: digits only.
      "0.line.d_ein": (_, info) => businessOf(info)?.ein?.replace(/\D/g, ""),
      "0.line.e_business_address": (_, info) => businessOf(info)?.address?.street,
      "0.line.e_city_state_zip": (_, info) => {
        const address = businessOf(info)?.address;
        return address ? `${address.city}, ${address.state} ${address.zip}` : undefined;
      },
      "0.line.f_cash": (_, info) => method(info, "cash"),
      "0.line.f_accrual": (_, info) => method(info, "accrual"),
      "0.line.f_other": (_, info) => method(info, "other"),
      "0.line.g_yes": (_, info) => yes(businessOf(info)?.materiallyParticipated),
      "0.line.g_no": (_, info) => no(businessOf(info)?.materiallyParticipated),
      "0.line.h_started_or_acquired": (_, info) => businessOf(info)?.startedThisYear,
      "0.line.i_yes": (_, info) => yes(businessOf(info)?.paymentsRequire1099),
      "0.line.i_no": (_, info) => no(businessOf(info)?.paymentsRequire1099),
    },
    formatters: {
      // The SSN renders with dashes; this form has no comb widget.
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
    unsupported: {
      "0.line.f_other_specify": OTHER_METHOD,
      "0.line.j_yes": LINE_J,
      "0.line.j_no": LINE_J,
    },
  });
}
