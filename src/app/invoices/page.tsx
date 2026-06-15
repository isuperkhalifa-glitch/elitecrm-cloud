import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { InvoicesClient } from "./invoices-client";
import { AppShell } from "@/components/app-shell";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { requirePageAccess } from "@/lib/auth/server-guards";

export default async function InvoicesPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "invoices");

  const systemSettings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(systemSettings, "features.invoices.enabled", true)) {
    return (
      <AppShell
        titleKey="invoices"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      >
        <div className="safe-card rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-8 text-amber-100">
          <h2 className="text-2xl font-black">الفواتير متوقفة حاليًا</h2>
          <p className="mt-3 text-sm leading-7 text-amber-100/80">
            تم إيقاف موديول الفواتير من مركز إعدادات النظام. يمكن للأدمن تشغيله مرة أخرى من Settings.
          </p>
        </div>
      </AppShell>
    );

  }

  const [{ data: invoices }, { data: companies }, { data: deals }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id,company_id,deal_id,invoice_number,amount,status,paid_at,created_at,due_date,notes,currency,owner_id,companies(id,name),deals(id,title,amount,stage,owner_id)")
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id,name")
        .order("name", { ascending: true }),
      supabase
        .from("deals")
        .select("id,title,amount,stage,company_id,companies(id,name)")
        .order("created_at", { ascending: false }),
    ]);

  return (
    <InvoicesClient
      initialInvoices={(invoices ?? []) as any}
      companies={(companies ?? []) as any}
      deals={(deals ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}


