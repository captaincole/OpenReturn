// ITINs share the SSN brand: both are 9 digits on IRS forms.
export type SSN = string & { readonly __brand: "SSN" };

export const ssn = (s: string): SSN => {
  const digits = s.replace(/\D/g, "");
  if (digits.length !== 9) {
    throw new Error(`SSN must be 9 digits, got "${s}" (${digits.length} digits).`);
  }
  return digits as SSN;
};

export const SSN = {
  format: (s: SSN): string => `${s.slice(0, 3)}-${s.slice(3, 5)}-${s.slice(5)}`,
  digits: (s: SSN): string => s,
};

export type EIN = string & { readonly __brand: "EIN" };

export const ein = (s: string): EIN => {
  const digits = s.replace(/\D/g, "");
  if (digits.length !== 9) {
    throw new Error(`EIN must be 9 digits, got "${s}" (${digits.length} digits).`);
  }
  return digits as EIN;
};

export const EIN = {
  format: (e: EIN): string => `${e.slice(0, 2)}-${e.slice(2)}`,
  digits: (e: EIN): string => e,
};

export type Phone = string & { readonly __brand: "Phone" };

export const phone = (s: string): Phone => {
  const digits = s.replace(/\D/g, "");
  if (digits.length !== 10) {
    throw new Error(`Phone must be 10 digits, got "${s}" (${digits.length} digits).`);
  }
  return digits as Phone;
};

export const Phone = {
  format: (p: Phone): string => `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`,
  digits: (p: Phone): string => p,
  parens: (p: Phone): string => `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`,
};

export type ISODate = string & { readonly __brand: "ISODate" };

export const isoDate = (s: string): ISODate => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`ISODate must be YYYY-MM-DD, got "${s}".`);
  }
  return s as ISODate;
};

export const ISODate = {
  format: (d: ISODate): string => d,
  usSlash: (d: ISODate): string => {
    const [y, m, day] = d.split("-");
    return `${m}/${day}/${y}`;
  },
};

/*
 * Matches `decisions.scope.filing_status` and the tax-table column names.
 * Keep them aligned, so no translation table is needed.
 */

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household"
  | "qualifying_surviving_spouse";
