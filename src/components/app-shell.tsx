"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Building2,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  UserCog,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AdminEditButton } from "@/components/admin-edit-button";
import { GlobalScopeSwitcher, ScopeBanner } from "@/components/global-scope-switcher";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { NotificationBell } from "@/components/notification-bell";
import { useScope } from "@/components/scope-provider";
import { useSystemSettings } from "@/components/system-settings-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

type AppShellProps = {
  titleKey: string;
  userEmail: string | null;
  fullName?: string | null;
  role?: string | null;
  children: ReactNode;
};

type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";

type NavItem = {
  href: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  roles: Role[];
  featureKey?: string;
};

type NavGroup = {
  labelAr: string;
  labelEn: string;
  items: NavItem[];
};

const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];
const adminRoles: Role[] = ["developer", "admin"];

const navGroups: NavGroup[] = [
  {
    labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ±ط·آ·ط¢آ¦ط·آ¸ط¸آ¹ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ·ط¢آ©",
    labelEn: "Overview",
    items: [{ href: "/dashboard", labelAr: "ط·آ¸أ¢â‚¬â€چط·آ¸ط«â€ ط·آ·ط¢آ­ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ­ط·آ¸ط¦â€™ط·آ¸أ¢â‚¬آ¦", labelEn: "Dashboard", icon: LayoutDashboard, roles: allRoles }],
  },
  {
    labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ´ط·آ·ط·â€؛ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬â€چ",
    labelEn: "Operations",
    items: [
      { href: "/customers", labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’", labelEn: "Customers", icon: UsersRound, roles: allRoles },
      { href: "/registrations", labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ³ط·آ·ط¢آ¬ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¯ط·آ¸ط¸آ¾ط·آ¸ط«â€ ط·آ·ط¢آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾", labelEn: "Registrations & Payments", icon: Receipt, roles: ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"] },
      { href: "/courses", labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¯ط·آ¸ط«â€ ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¹آ¾", labelEn: "Courses", icon: BookOpen, roles: ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"] },
      { href: "/training-centers", labelAr: "ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¦â€™ط·آ·ط¢آ² ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ¯ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ¨", labelEn: "Training Centers", icon: Building2, roles: ["developer", "admin", "manager", "data_analyst"] },
    ],
  },
  {
    labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¯ط·آ·ط¢آ®ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ·ط¢آ²ط·آ¸ط¸آ¹ط·آ·ط¢آ¹",
    labelEn: "Intake & Assignment",
    items: [
      { href: "/imports", labelAr: "ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ¸ط¸آ¹ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¢آ¯ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’", labelEn: "Imports", icon: FileSpreadsheet, roles: ["developer", "admin", "moderator", "marketer"] },
      { href: "/distribution", labelAr: "ط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ·ط¢آ²ط·آ¸ط¸آ¹ط·آ·ط¢آ¹ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’", labelEn: "Distribution", icon: UsersRound, roles: ["developer", "admin", "manager", "moderator"] },
    ],
  },
  {
    labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ±",
    labelEn: "Reports",
    items: [
      { href: "/commissions", labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ±", labelEn: "Commissions & Reports", icon: BadgeDollarSign, featureKey: "features.commissions.enabled", roles: ["developer", "admin", "manager", "finance", "sales", "data_analyst"] },
    ],
  },
  {
    labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¸ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦",
    labelEn: "System",
    items: [
      { href: "/users", labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ·ط¢آ®ط·آ·ط¢آ¯ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ¸أ¢â‚¬آ  ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آµط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾", labelEn: "Users & Roles", icon: UserCog, roles: adminRoles },
      { href: "/settings", labelAr: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ·ط¢آ¯ط·آ·ط¢آ§ط·آ·ط¢آ¯ط·آ·ط¢آ§ط·آ·ط¹آ¾", labelEn: "Settings", icon: Settings, roles: adminRoles },
      { href: "/customize", labelAr: "ط·آ·ط¹آ¾ط·آ·ط¢آ®ط·آ·ط¢آµط·آ¸ط¸آ¹ط·آ·ط¢آµ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¸ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦", labelEn: "Customizer", icon: BarChart3, roles: adminRoles },
    ],
  },
];

const pageTitles: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: "ط·آ¸أ¢â‚¬â€چط·آ¸ط«â€ ط·آ·ط¢آ­ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ­ط·آ¸ط¦â€™ط·آ¸أ¢â‚¬آ¦", en: "Dashboard" },
  customers: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’", en: "Customers" },
  registrations: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ³ط·آ·ط¢آ¬ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¯ط·آ¸ط¸آ¾ط·آ¸ط«â€ ط·آ·ط¢آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾", en: "Registrations & Payments" },
  courses: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¯ط·آ¸ط«â€ ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¹آ¾", en: "Courses" },
  trainingCenters: { ar: "ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¦â€™ط·آ·ط¢آ² ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ¯ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ¨", en: "Training Centers" },
  imports: { ar: "ط·آ·ط¢آ§ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ¸ط¸آ¹ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¢آ¯ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’", en: "Imports" },
  distribution: { ar: "ط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ·ط¢آ²ط·آ¸ط¸آ¹ط·آ·ط¢آ¹ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’", en: "Distribution" },
  commissions: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط¹آ¾ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ±", en: "Commissions & Reports" },
  users: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ·ط¢آ®ط·آ·ط¢آ¯ط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ¸أ¢â‚¬آ  ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آµط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ·ط¹آ¾", en: "Users & Roles" },
  settings: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ·ط¢آ¯ط·آ·ط¢آ§ط·آ·ط¢آ¯ط·آ·ط¢آ§ط·آ·ط¹آ¾", en: "Settings" },
  customize: { ar: "ط·آ·ط¹آ¾ط·آ·ط¢آ®ط·آ·ط¢آµط·آ¸ط¸آ¹ط·آ·ط¢آµ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¸ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦", en: "Customizer" },
};

function normalizeRole(role?: string | null): Role {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
  if (role === "finance") return "finance";
  if (role === "data_analyst") return "data_analyst";
  return "sales";
}

function roleName(role: Role, isArabic: boolean) {
  const labels: Record<Role, { ar: string; en: string }> = {
    developer: { ar: "ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ·ط·آ¸ط«â€ ط·آ·ط¢آ± ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¸ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦", en: "Developer" },
    admin: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¯ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦", en: "General Manager" },
    manager: { ar: "ط·آ·ط¹آ¾ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬آ¦ ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ط·آ·ط¢آ¯ط·آ·ط¢آ± ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ²", en: "Sales Team Leader" },
    moderator: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ¸ط«â€ ط·آ·ط¢آ¯ط·آ¸ط¸آ¹ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ·ط¢آ±", en: "Moderator" },
    marketer: { ar: "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ³ط·آ¸ط«â€ ط·آ¸أ¢â‚¬ع‘", en: "Marketer" },
    sales: { ar: "ط·آ·ط¢آ³ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ²", en: "Sales" },
    finance: { ar: "ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ط·آ·ط¢آ© / ط·آ·ط¢آ­ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ¨ط·آ·ط¢آ§ط·آ·ط¹آ¾", en: "Finance" },
    data_analyst: { ar: "ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ­ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬â€چ ط·آ·ط¢آ¨ط·آ¸ط¸آ¹ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ ط·آ·ط¢آ§ط·آ·ط¹آ¾", en: "Data Analyst" },
  };
  return isArabic ? labels[role].ar : labels[role].en;
}

export function AppShell({ titleKey, userEmail, fullName, role, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useI18n();
  const { scope } = useScope();
  const { getBooleanSetting } = useSystemSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isArabic = language === "ar";
  const currentRole = normalizeRole(role);
  const canUseScope = currentRole === "developer" || currentRole === "admin";

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(currentRole) && (!item.featureKey || getBooleanSetting(item.featureKey, true))),
    }))
    .filter((group) => group.items.length > 0);

  function pageTitle(key: string) {
    const entry = pageTitles[key];
    if (entry) return isArabic ? entry.ar : entry.en;
    return t(key);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 pb-6">
      <div className="rounded-[1.7rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
        <p className="text-xs text-emerald-300">{isArabic ? "ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ³ط·آ·ط¢آ§ط·آ·ط¢آ­ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چ" : "Workspace"}</p>
        <h2 className="mt-1 truncate text-lg font-black">{fullName ?? userEmail ?? "-"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{roleName(currentRole, isArabic)}</span>
          {scope.mode !== "all" && canUseScope ? (
            <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-300">{scope.targetName}</span>
          ) : null}
        </div>
      </div>

      <nav className="space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.labelEn}>
            <p className="mb-2 px-3 text-xs font-bold text-slate-500">{isArabic ? group.labelAr : group.labelEn}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={
                      "elite-nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition " +
                      (active ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-300 hover:bg-white/10 hover:text-white")
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{isArabic ? item.labelAr : item.labelEn}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
        {isArabic ? "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¸ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦ ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¨ط·آ·ط¢آ³ط·آ·ط¢آ· ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¢ط·آ¸أ¢â‚¬آ : ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬آ¦ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط·إ’ط·آ·ط¥â€™ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ·ط¢آ³ط·آ·ط¢آ¬ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ§ط·آ·ط¹آ¾ط·آ·ط¥â€™ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¯ط·آ¸ط«â€ ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ·ط¹آ¾ط·آ·ط¥â€™ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ±ط·آ·ط¢آ§ط·آ¸ط¦â€™ط·آ·ط¢آ²ط·آ·ط¥â€™ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸ط«â€ ط·آ·ط¢آ²ط·آ¸ط¸آ¹ط·آ·ط¢آ¹ط·آ·ط¥â€™ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¹آ¾ط·آ¸أ¢â‚¬ع‘ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ¸ط¸آ¹ط·آ·ط¢آ±ط·آ·ط¥â€™ ط·آ¸ط«â€ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¹ط·آ·ط¢آ¯ط·آ·ط¢آ§ط·آ·ط¢آ¯ط·آ·ط¢آ§ط·آ·ط¹آ¾." : "Clean CRM workspace: customers, registrations, courses, centers, assignment, reports, and settings."}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
        <div className="flex min-h-20 items-center gap-3 px-4 lg:px-6">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 lg:hidden"
            type="button"
            aria-label="menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-emerald-300">
              {scope.mode === "user" && canUseScope ? (isArabic ? "ط·آ·ط¢آ¹ط·آ·ط¢آ±ط·آ·ط¢آ¶ ط·آ¸ط¦â€™ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ³ط·آ·ط¹آ¾ط·آ·ط¢آ®ط·آ·ط¢آ¯ط·آ¸أ¢â‚¬آ¦" : "Viewing as user") : isArabic ? "ط·آ·ط¢آ±ط·آ·ط¢آ¤ط·آ¸ط¸آ¹ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¸ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦" : "System view"}
            </p>
            <h1 className="truncate text-lg font-black md:text-xl">{pageTitle(titleKey)}</h1>
          </div>

          <div className="flex max-w-[65vw] items-center gap-2 overflow-x-auto py-2 lg:max-w-none">
            <GlobalScopeSwitcher role={role ?? null} />
            <NotificationBell />
            <LanguageToggle />
            <ThemeToggle />
            <button
              className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/10 md:flex"
              type="button"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              {isArabic ? "ط·آ·ط¹آ¾ط·آ·ط¢آ³ط·آ·ط¢آ¬ط·آ¸ط¸آ¹ط·آ¸أ¢â‚¬â€چ ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ®ط·آ·ط¢آ±ط·آ¸ط«â€ ط·آ·ط¢آ¬" : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed right-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-72 border-l border-white/10 bg-slate-950/95 pt-4 backdrop-blur-2xl lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={closeMobile}>
          <aside className="absolute right-0 top-20 h-[calc(100vh-5rem)] w-80 max-w-[88vw] border-l border-white/10 bg-slate-950 pt-4" onClick={(event) => event.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <main className="pt-24 lg:pr-72">
        <div className="px-4 pb-8 lg:px-6">
          <ScopeBanner />
          <AdminEditButton role={role ?? null} />
          {children}
        </div>
      </main>
    </div>
  );
}
