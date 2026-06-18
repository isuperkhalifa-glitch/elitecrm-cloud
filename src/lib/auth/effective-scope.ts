import { cookies } from "next/headers";
import { normalizeRole, type AppRole } from "@/lib/auth/permissions";

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

const scopeAdminRoles = new Set<AppRole>(["developer", "admin", "manager"]);

function parseScope(value?: string | null): StoredGlobalScope | null {
  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(value)) as StoredGlobalScope;
  } catch {
    try {
      return JSON.parse(value) as StoredGlobalScope;
    } catch {
      return null;
    }
  }
}

export async function getEffectiveScope(role?: string | null): Promise<EffectiveScope> {
  const realRole = normalizeRole(role);
  const base: EffectiveScope = {
    realRole,
    effectiveRole: realRole,
    scopedUserId: null,
    scopedCompanyId: null,
    previewAsUser: false,
  };

  if (!scopeAdminRoles.has(realRole)) return base;

  const cookieStore = await cookies();
  const savedScope = parseScope(cookieStore.get("elitecrm-scope")?.value);

  if (!savedScope || savedScope.mode === "all") return base;

  if (savedScope.mode === "user" && savedScope.targetId) {
    const previewAsUser = savedScope.previewMode === "selected";

    return {
      ...base,
      effectiveRole: previewAsUser ? normalizeRole(savedScope.targetRole) : realRole,
      scopedUserId: savedScope.targetId,
      previewAsUser,
    };
  }

  if (savedScope.mode === "company" && savedScope.targetId) {
    return {
      ...base,
      scopedCompanyId: savedScope.targetId,
    };
  }

  return base;
}