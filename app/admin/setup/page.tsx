import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, hasAnyAdmins } from "@/lib/admin-auth";
import SetupForm from "./SetupForm";

export default async function AdminSetupPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const hasAdmins = await hasAnyAdmins();
  if (hasAdmins) redirect("/admin/login");

  return (
    <main className="authPage">
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <Link className="button secondary" href="/report">Citizen report</Link>
      </nav>

      <section className="card authCard">
        <div className="eyebrow">One-time secure setup</div>
        <h2>Create the first administrator</h2>
        <p className="muted">
          This setup closes automatically after the first admin account is created.
        </p>
        <SetupForm />
      </section>
    </main>
  );
}
