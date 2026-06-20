import { cookies } from "next/headers";
import { normalizeRole, type AppRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type StoredGlobalScope = {
  mode?: "all" | "user" | "company";
  targetId?: string;
  targetName?: string;
  targetRole?: string;
  previewMode?: "admin" | "selected";
};

export type EffectiveScope = {
  realRole: AppRole;
  effectiveRole: AppRole;
  scopedUserId: string | null;
  scopedCompanyId: string | null;
  previewAsUser: boolean;
};

function defaultScope(realRole: AppRole): EffectiveScope {
  return {
    realRole,
    effectiveRole: realRole,
    scopedUserId: null,
    scopedCompanyId: null,
    previewAsUser: false,
  };
}

function parseStoredScope(value?: string | null): StoredGlobalScope | null {
  if (!value) return null;

  const candidates = [value];
  try {
    candidates.unshift(decodeURIComponent(value));
  } catch {
    // Keep the raw cookie value as a fallback.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as StoredGlobalScope;
      if (parsed.mode === "user" || parsed.mode === "company" || parsed.mode === "all") {
        return parsed;
      }
    } catch {
      // Try the next representation.
    }
  }

  return null;
}

export async function getEffectiveScope(role?: string | null): Promise<EffectiveScope> {
  const realRole = normalizeRole(role);
  const fallback = defaultScope(realRole);

  if (realRole !== "developer" && realRole !== "admin") return fallback;

  const cookieStore = await cookies();
  const stored = parseStoredScope(cookieStore.get("elitecrm-scope")?.value);
  if (!stored || stored.mode === "all" || !stored.targetId) return fallback;

  const admin = createAdminClient();

  if (stored.mode === "user") {
    const { data: targetUser } = await admin
      .from("profiles")
      .select("id,role,is_active")
      .eq("id", stored.targetId)
      .maybeSingle();

    if (!targetUser || targetUser.is_active === false) return fallback;

    const previewAsUser = stored.previewMode === "selected";
    return {
      realRole,
      effectiveRole: previewAsUser ? normalizeRole(targetUser.role) : realRole,
      scopedUserId: targetUser.id,
      scopedCompanyId: null,
      previewAsUser,
    };
  }

  const { data: company } = await admin
    .from("companies")
    .select("id")
    .eq("id", stored.targetId)
    .maybeSingle();

  if (!company) return fallback;

  return {
    realRole,
    effectiveRole: realRole,
    scopedUserId: null,
    scopedCompanyId: company.id,
    previewAsUser: false,
  };
}
