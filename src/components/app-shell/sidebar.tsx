"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown, LayoutDashboard } from "lucide-react";
import { navGroups, roleLabel, routePath, type Role } from "./navigation";

type Company = { id: string; name: string };

type Props = {
  pathname: string;
  isArabic: boolean;
  currentRole: Role;
  fullName?: string | null;
  userEmail: string | null;
  companies: Company[];
  scopeMode: string;
  scopeTargetId: string;
  year: string;
  openGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  onCompanyChange: (companyId: string) => void;
  onYearChange: (year: string) => void;
  onClose: () => void;
};

export function AppSidebar({
  pathname,
  isArabic,
  currentRole,
  fullName,
  userEmail,
  companies,
  scopeMode,
  scopeTargetId,
  year,
  openGroups,
  onToggleGroup,
  onCompanyChange,
  onYearChange,
  onClose,
}: Props) {
  const visibleGroups = navGroups
    .filter((group) => group.roles.includes(currentRole))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(currentRole)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-[#29455f] text-white">
      <div className="border-b border-white/10 bg-white p-4">
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="text-center">
            <div className="text-xl font-black tracking-[0.2em] text-[#29455f]">ELITE</div>
            <div className="text-[9px] font-bold tracking-[0.35em] text-emerald-600">CRM</div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-4">
        <p className="truncate text-sm font-bold">{fullName ?? userEmail ?? "-"}</p>
        <p className="mt-1 text-xs text-slate-300">{roleLabel(currentRole, isArabic)}</p>
        <div className="mt-3 grid grid-cols-[1fr_78px] gap-2">
          <select
            value={scopeMode === "company" ? scopeTargetId : ""}
            onChange={(event) => onCompanyChange(event.target.value)}
            className="min-w-0 rounded border border-white/20 bg-[#35536d] px-2 py-2 text-xs text-white outline-none"
          >
            <option value="">{isArabic ? "كل المراكز" : "All centers"}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            className="rounded border border-white/20 bg-[#35536d] px-2 py-2 text-xs text-white outline-none"
          >
            {[0, 1, 2].map((offset) => {
              const value = String(new Date().getFullYear() - offset);
              return <option key={value}>{value}</option>;
            })}
          </select>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <TopLink
          href="/dashboard"
          active={pathname === "/dashboard"}
          icon={LayoutDashboard}
          label={isArabic ? "الرئيسية" : "Homepage"}
          close={onClose}
        />
        <TopLink
          href="/calendar"
          active={pathname.startsWith("/calendar")}
          icon={CalendarDays}
          label={isArabic ? "التقويم" : "Calendar"}
          close={onClose}
        />

        {visibleGroups.map((group) => {
          const Icon = group.icon;
          const expanded = openGroups[group.key] ?? false;
          const groupActive = group.items.some((item) => {
            const path = routePath(item.href);
            return pathname === path || pathname.startsWith(path + "/");
          });

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => onToggleGroup(group.key)}
                className={`flex w-full items-center gap-3 border-e-4 px-4 py-3 text-sm font-semibold transition ${
                  groupActive
                    ? "border-emerald-400 bg-[#365873]"
                    : "border-transparent hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-start">{isArabic ? group.ar : group.en}</span>
                <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded ? (
                <div className="bg-black/10 py-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const path = routePath(item.href);
                    const active = pathname === path || pathname.startsWith(path + "/");
                    return (
                      <Link
                        href={item.href}
                        key={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-8 py-2.5 text-xs transition ${
                          active
                            ? "bg-emerald-400/20 text-emerald-200"
                            : "text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                        <span>{isArabic ? item.ar : item.en}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function TopLink({
  href,
  active,
  icon: Icon,
  label,
  close,
}: {
  href: string;
  active: boolean;
  icon: typeof LayoutDashboard;
  label: string;
  close: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={close}
      className={`flex items-center gap-3 border-e-4 px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-emerald-400 bg-[#365873]"
          : "border-transparent hover:bg-white/10"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
