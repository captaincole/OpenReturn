"use client";

import { lawHref } from "@/lib/law";
import { useRouter } from "next/navigation";
import { useState } from "react";

/* A section number, or a full citation such as 469(g)(1) or 1.469-5T(a), opens that section's page. */
export function GoToSection() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const go = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const href = lawHref(value);
    if (!href) {
      setProblem("Type a section number, such as 469, 199A or the regulation 1.469-5T.");
      return;
    }
    router.push(href);
  };

  return (
    <form onSubmit={go} className="card space-y-3 p-5">
      <label htmlFor="law-section" className="block text-[14px] font-medium text-ink-primary">
        Go to a section
      </label>
      <div className="flex gap-3">
        <input
          id="law-section"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setProblem(null);
          }}
          placeholder="469 or 1.469-5T"
          autoComplete="off"
          spellCheck={false}
          className="input-base max-w-xs font-mono"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Open
        </button>
      </div>
      {problem && <p className="text-[13px] text-danger">{problem}</p>}
    </form>
  );
}
