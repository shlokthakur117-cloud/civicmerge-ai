"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(result.message ?? "Could not create the administrator.");
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
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>

      <label>
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>

      <button className="button" disabled={busy}>
        {busy ? "Creating admin..." : "Create first administrator"}
      </button>

      {message && <div className="authMessage">{message}</div>}
    </form>
  );
}
