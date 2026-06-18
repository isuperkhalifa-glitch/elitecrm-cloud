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

export async function getEffectiveScope(role?: string | null): Promise<EffectiveScope> {
  const realRole = normalizeRole(role);
  return {
    realRole,
    effectiveRole: realRole,
    scopedUserId: null,
    scopedCompanyId: null,
    previewAsUser: false,
  };
}