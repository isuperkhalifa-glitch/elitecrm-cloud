import { redirect } from "next/navigation";
import { canAccessPage, isAdmin, type PageKey } from "@/lib/auth/roles";

export function requirePageAccess(role: string | null | undefined, pageKey: PageKey) {
  if (!canAccessPage(role, pageKey)) {
    redirect("/dashboard");
  }
}

export function requireAdmin(role: string | null | undefined) {
  if (!isAdmin(role)) {
    redirect("/dashboard");
  }
}
