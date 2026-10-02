import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, hasAnyAdmins } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminCreateForm from "./AdminCreateForm";

type AdminUser = {
  user_id: string;
  email: string;
  created_at: string;
};

export default async function AdminManagementPage() {
  const session = await getAdminSession();

  if (!session) {
    const hasAdmins = await hasAnyAdmins();
    redirect(hasAdmins ? "/admin/login" : "/admin/setup");
  }

  const supabase = getSupabaseAdmin();
  let admins: AdminUser[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("admin_users")
      .select("user_id,email,created_at")
      .order("created_at", { ascending: true });

    admins = (data ?? []) as AdminUser[];
  }

  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <div className="actions">
          <Link className="button secondary" href="/admin">
            Back to dashboard
          </Link>
        </div>
      </nav>

      <div className="eyebrow">Access management</div>
      <h2>Administrators</h2>
      <p className="muted">
        Create separate administrator accounts so each municipal operator can
        sign in with their own credentials.
      </p>

      <section className="adminManagementGrid">
        <div className="card">
          <div className="eyebrow">Add administrator</div>
          <h2>Create another admin</h2>
          <p className="muted">
            The new administrator can sign in immediately at /admin/login.
          </p>
          <AdminCreateForm />
        </div>

        <div className="card">
          <div className="sectionHeader">
            <div>
              <div className="eyebrow">Current access</div>
              <h2>{admins.length} admin{admins.length === 1 ? "" : "s"}</h2>
            </div>
          </div>

          <div className="adminList">
            {admins.map((admin, index) => (
              <div className="adminListItem" key={admin.user_id}>
                <div>
                  <strong>{admin.email}</strong>
                  <div className="muted adminCreated">
                    {index === 0 ? "Primary admin" : "Administrator"} • Added{" "}
                    {new Date(admin.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
                {admin.user_id === session.userId && (
                  <span className="currentAdminBadge">You</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
