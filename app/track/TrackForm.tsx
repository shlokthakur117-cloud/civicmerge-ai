"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackForm() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const value = trackingId.trim();

    if (!value) {
      setMessage("Enter your tracking ID.");
      return;
    }

    const id = value.includes("/track/")
      ? value.split("/track/").pop()?.split(/[?#]/)[0] ?? value
      : value;

    router.push("/track/" + encodeURIComponent(id.trim()));
  }

  return (
    <form className="trackingForm" onSubmit={submit}>
      <label>
        Tracking ID
        <input
          value={trackingId}
          onChange={(event) => setTrackingId(event.target.value)}
          placeholder="Example: 900686e3-1db4-4834-be31-d7b165573efe"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </label>

      <button className="button" type="submit">
        Track complaint
      </button>

      {message && <div className="authMessage">{message}</div>}
    </form>
  );
}
