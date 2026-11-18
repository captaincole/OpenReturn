import { describe, expect, it } from "vitest";
import { readLoginForm, readSetupForm } from "./authForms";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const FILLED = {
  displayName: " Alex Rivera ",
  email: " alex@example.com ",
  password: "long-enough",
  confirm: "long-enough",
};

describe("readSetupForm", () => {
  it("returns the values, with the name and the email trimmed", () => {
    expect(readSetupForm(form(FILLED))).toEqual({
      values: { displayName: "Alex Rivera", email: "alex@example.com", password: "long-enough" },
    });
  });

  it("names the first thing that is missing", () => {
    expect(readSetupForm(form({ ...FILLED, displayName: " " }))).toEqual({
      error: "Enter your name.",
    });
    expect(readSetupForm(form({ ...FILLED, email: "" }))).toEqual({ error: "Enter your email." });
    expect(readSetupForm(form({}))).toEqual({ error: "Enter your name." });
  });

  it("refuses a short password and a confirmation that differs", () => {
    expect(readSetupForm(form({ ...FILLED, password: "short", confirm: "short" }))).toEqual({
      error: "The password needs 8 or more characters.",
    });
    expect(readSetupForm(form({ ...FILLED, confirm: "long-enougj" }))).toEqual({
      error: "Passwords don't match.",
    });
  });
});

describe("readLoginForm", () => {
  it("returns the password as typed, or asks for it", () => {
    expect(readLoginForm(form({ password: " pass word " }))).toEqual({
      values: { password: " pass word " },
    });
    expect(readLoginForm(form({}))).toEqual({ error: "Enter your password." });
  });
});
