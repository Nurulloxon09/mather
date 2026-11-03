"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function UnlockForm() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: code }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError(res ? "Wrong passcode" : "Couldn't reach the server");
      return;
    }
    const next = params.get("next") ?? "/";
    // Full navigation so every request from here on carries the new cookie.
    window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Passcode"
        className="w-full rounded-lg border border-bb-line px-3 py-2.5 outline-none focus:border-bb-blue"
      />
      {error && <p className="text-sm font-semibold text-bb-red">{error}</p>}
      <button className="bb-btn bb-btn-primary w-full" disabled={busy || !code}>
        {busy ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
