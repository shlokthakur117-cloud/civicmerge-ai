import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, hasAnyAdmins } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const hasAdmins = await hasAnyAdmins();
  if (!hasAdmins) redirect("/admin/setup");

  return (
    <main className="authPage">
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <Link className="button secondary" href="/report">Citizen report</Link>
      </nav>

      <section className="card authCard">
        <div className="eyebrow">Protected municipal access</div>
        <h2>Admin sign in</h2>
        <p className="muted">
          Sign in to manage departments, status changes, analytics, and demo controls.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
