"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(result.message ?? "Could not create administrator.");
      setBusy(false);
      return;
    }

    event.currentTarget.reset();
    setSuccess(true);
    setMessage("New administrator created successfully.");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="authForm">
      <label>
        New admin email
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          required
        />
      </label>

      <label>
        Temporary password
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
        {busy ? "Creating administrator..." : "Add administrator"}
      </button>

      {message && (
        <div className={success ? "authSuccess" : "authMessage"}>
          {message}
        </div>
      )}
    </form>
  );
}
