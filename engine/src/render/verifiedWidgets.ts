/*
 * Hand-verified widget names. AI labeling fence-posts on clustered widgets
 * (taxpayer vs spouse name, line 9 vs 10), so this map wins over the
 * catalog's pdfWidgetName. TODO(forms-pipeline): delete it once extraction
 * pairs labels and widgets reliably.
 */

export const VERIFIED_WIDGETS: Record<string, Record<string, string>> = {
  "form-1040": {
    "form-1040.header.first_name": "topmostSubform[0].Page1[0].f1_14[0]",
    "form-1040.header.last_name": "topmostSubform[0].Page1[0].f1_15[0]",
    "form-1040.header.ssn": "topmostSubform[0].Page1[0].f1_16[0]",

    "form-1040.header.address_street": "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_20[0]",
    "form-1040.header.address_apt": "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_21[0]",
    "form-1040.header.address_city": "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_22[0]",
    "form-1040.header.address_state": "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_23[0]",
    "form-1040.header.address_zip": "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_24[0]",

    "form-1040.header.filing_status_single":
      "topmostSubform[0].Page1[0].Checkbox_ReadOrder[0].c1_8[0]",
    "form-1040.header.filing_status_mfj":
      "topmostSubform[0].Page1[0].Checkbox_ReadOrder[0].c1_8[1]",
    "form-1040.header.filing_status_mfs":
      "topmostSubform[0].Page1[0].Checkbox_ReadOrder[0].c1_8[2]",
    "form-1040.header.filing_status_hoh": "topmostSubform[0].Page1[0].c1_8[0]",
    "form-1040.header.filing_status_qss": "topmostSubform[0].Page1[0].c1_8[1]",

    "form-1040.line.1a": "topmostSubform[0].Page1[0].f1_47[0]",
    "form-1040.line.1z": "topmostSubform[0].Page1[0].f1_57[0]",
    "form-1040.line.3a": "topmostSubform[0].Page1[0].f1_60[0]",
    "form-1040.line.3b": "topmostSubform[0].Page1[0].f1_61[0]",
    "form-1040.line.7a": "topmostSubform[0].Page1[0].f1_70[0]",
    "form-1040.line.9": "topmostSubform[0].Page1[0].f1_73[0]",
    "form-1040.line.10": "topmostSubform[0].Page1[0].f1_74[0]",
    "form-1040.line.11a": "topmostSubform[0].Page1[0].f1_75[0]",

    "form-1040.line.11b": "topmostSubform[0].Page2[0].f2_01[0]",
    "form-1040.line.12e": "topmostSubform[0].Page2[0].f2_02[0]",
    "form-1040.line.14": "topmostSubform[0].Page2[0].f2_05[0]",
    "form-1040.line.15": "topmostSubform[0].Page2[0].f2_06[0]",
    "form-1040.line.16": "topmostSubform[0].Page2[0].f2_08[0]",
    "form-1040.line.18": "topmostSubform[0].Page2[0].f2_10[0]",
    "form-1040.line.22": "topmostSubform[0].Page2[0].f2_14[0]",
    "form-1040.line.24": "topmostSubform[0].Page2[0].f2_16[0]",
    "form-1040.line.25a": "topmostSubform[0].Page2[0].f2_17[0]",
    "form-1040.line.25d": "topmostSubform[0].Page2[0].f2_20[0]",
    "form-1040.line.33": "topmostSubform[0].Page2[0].f2_29[0]",
    "form-1040.line.34": "topmostSubform[0].Page2[0].f2_30[0]",
    "form-1040.line.35a": "topmostSubform[0].Page2[0].f2_31[0]",
    "form-1040.line.37": "topmostSubform[0].Page2[0].f2_35[0]",

    /*
     * The catalog swaps these: the wide widget is occupation, the narrow
     * maxLength=6 one is the IP PIN. Signature dates have no widget.
     */
    "form-1040.signing.taxpayer_occupation": "topmostSubform[0].Page2[0].f2_40[0]",
    "form-1040.signing.spouse_occupation": "topmostSubform[0].Page2[0].f2_42[0]",
  },
};

export function verifiedWidget(formId: string, fieldId: string): string | null {
  return VERIFIED_WIDGETS[formId]?.[fieldId] ?? null;
}
