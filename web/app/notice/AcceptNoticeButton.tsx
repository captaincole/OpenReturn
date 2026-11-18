"use client";

import { useState } from "react";

export function AcceptNoticeButton() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (sending) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/notice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => null);
    if (!res?.ok) {
      setError("That did not work. Try again.");
      setSending(false);
      return;
    }
    window.location.assign("/");
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void accept()}
        disabled={sending}
        className="btn-primary w-full"
      >
        I understand
      </button>
      {error && <div className="px-1 text-center text-sm text-danger">{error}</div>}
    </div>
  );
}
