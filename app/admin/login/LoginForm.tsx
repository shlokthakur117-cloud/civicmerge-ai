"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(result.message ?? "Could not sign in.");
      setBusy(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="authForm">
      <label>
        Admin email
        <input name="email" type="email" autoComplete="email" required />
      </label>

      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      <button className="button" disabled={busy}>
        {busy ? "Signing in..." : "Sign in to command center"}
      </button>

      {message && <div className="authMessage">{message}</div>}
    </form>
  );
}
