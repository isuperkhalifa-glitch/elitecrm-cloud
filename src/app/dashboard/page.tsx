import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const [
    companies,
    contacts,
    leads,
    deals,
    tasks,
    invoices,
    commissions,
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
    supabase.from("commissions").select("id", { count: "exact", head: true }),
  ]);

  return (
    <DashboardClient
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
      stats={{
        companies: companies.count ?? 0,
        contacts: contacts.count ?? 0,
        leads: leads.count ?? 0,
        deals: deals.count ?? 0,
        tasks: tasks.count ?? 0,
        invoices: invoices.count ?? 0,
        commissions: commissions.count ?? 0,
      }}
    />
  );
}
