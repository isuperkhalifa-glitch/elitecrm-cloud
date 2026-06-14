import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { DealsClient } from "./deals-client";
import { AppShell } from "@/components/app-shell";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";

export default async function DealsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const systemSettings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(systemSettings, "features.deals.enabled", false)) {
    return (
      <AppShell
        titleKey="deals"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      >
        <div className="safe-card rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-8 text-amber-100">
          <h2 className="text-2xl font-black">الصفقات متوقفة حاليًا</h2>
          <p className="mt-3 text-sm leading-7 text-amber-100/80">
            تم تبسيط النظام مؤقتًا وإخفاء صفحة الصفقات. رحلة العميل الأساسية الآن من صفحة عملائي.
          </p>
        </div>
      </AppShell>
    );
  }
  requirePageAccess(profile?.role, "deals");

  const [{ data: deals }, { data: companies }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("deals")
        .select("id,title,company_id,contact_id,owner_id,stage,amount,expected_close_date,probability,created_at,companies(id,name),contacts(id,full_name,company_id)")
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id,name")
        .order("name", { ascending: true }),
      supabase
        .from("contacts")
        .select("id,full_name,company_id")
        .order("full_name", { ascending: true }),
    ]);

  return (
    <DealsClient
      initialDeals={(deals ?? []) as any}
      companies={(companies ?? []) as any}
      contacts={(contacts ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
