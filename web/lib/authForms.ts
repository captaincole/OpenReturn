/*
 * What the setup and login forms hold when they are sent. The pages read the
 * form itself, not React state: a password manager or the browser's autofill
 * can fill a field with no input event, and state would still be empty.
 */

export const MIN_PASSWORD_LENGTH = 8;

export interface SetupValues {
  displayName: string;
  email: string;
  password: string;
}

export type FormRead<Values> = { values: Values } | { error: string };

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

export function readSetupForm(form: FormData): FormRead<SetupValues> {
  const displayName = field(form, "displayName").trim();
  const email = field(form, "email").trim();
  const password = field(form, "password");
  if (!displayName) return { error: "Enter your name." };
  if (!email) return { error: "Enter your email." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `The password needs ${MIN_PASSWORD_LENGTH} or more characters.` };
  }
  if (password !== field(form, "confirm")) return { error: "Passwords don't match." };
  return { values: { displayName, email, password } };
}

export function readLoginForm(form: FormData): FormRead<{ password: string }> {
  const password = field(form, "password");
  return password ? { values: { password } } : { error: "Enter your password." };
}
