"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { CheckCircle2, Loader2, ShieldCheck, UserPlus, UsersRound, XCircle } from "lucide-react";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type Props = {
  initialUsers: UserRow[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

const roleOptions = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];
const emptyForm = { full_name: "", email: "", password: "User@12345", role: "sales" };

export function UsersClient({ initialUsers, currentUserId, userEmail, fullName, role }: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const canManage = role === "developer" || role === "admin";

  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState("");

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function roleLabel(value: string | null) {
    if (value === "developer") return tx("مطور النظام", "Developer");
    if (value === "admin") return tx("المدير العام", "General Manager");
    if (value === "manager") return tx("تيم ليدر سيلز", "Sales Team Leader");
    if (value === "moderator") return tx("الموديريتور", "Moderator");
    if (value === "marketer") return tx("المسوق", "Marketer");
    if (value === "sales") return tx("سيلز", "Sales");
    if (value === "finance") return tx("مالية / حسابات", "Finance");
    if (value === "data_analyst") return tx("محلل بيانات", "Data Analyst");
    return value ?? "-";
  }

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.full_name, user.email, roleLabel(user.role), user.role, user.is_active ? "active نشط" : "inactive متوقف"]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [users, search, isArabic]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.is_active).length,
      sales: users.filter((user) => user.role === "sales").length,
      admins: users.filter((user) => ["developer", "admin", "manager"].includes(user.role ?? "")).length,
    }),
    [users]
  );

  async function loadUsers() {
    setRefreshing(true);
    setError("");
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const result = await response.json();
    setRefreshing(false);

    if (!response.ok) {
      setError(result.error ?? tx("تعذر تحميل المستخدمين.", "Unable to load users."));
      return;
    }

    setUsers((result.users ?? []) as UserRow[]);
  }

  async function createUser() {
    setMessage("");
    setError("");

    if (!canManage) {
      setError(tx("هذه الصلاحية للمدير العام أو مطور النظام فقط.", "General manager or developer only."));
      return;
    }

    setCreating(true);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setCreating(false);

    if (!response.ok || !result.user) {
      setError(result.error ?? tx("تعذر إنشاء المستخدم.", "Unable to create user."));
      return;
    }

    setForm(emptyForm);
    setMessage(tx("تم إنشاء المستخدم بنجاح.", "User created successfully."));
    await loadUsers();
  }

  async function updateUser(userId: string, patch: Partial<UserRow>) {
    setMessage("");
    setError("");
    setSavingId(userId);

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...patch }),
    });
    const result = await response.json();
    setSavingId("");

    if (!response.ok || !result.user) {
      setError(result.error ?? tx("تعذر تحديث المستخدم.", "Unable to update user."));
      return;
    }

    setUsers((current) => current.map((user) => (user.id === userId ? (result.user as UserRow) : user)));
    setMessage(tx("تم تحديث المستخدم.", "User updated."));
  }

  return (
    <AppShell titleKey="users" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={tx("إجمالي المستخدمين", "Total users")} value={stats.total} tone="default" />
        <StatCard label={tx("نشط", "Active")} value={stats.active} tone="green" />
        <StatCard label={tx("سيلز", "Sales")} value={stats.sales} tone="blue" />
        <StatCard label={tx("الإدارة", "Management")} value={stats.admins} tone="yellow" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-300">{tx("إضافة مستخدم", "Add user")}</p>
              <h2 className="text-2xl font-black text-white">{tx("مستخدم جديد", "New user")}</h2>
            </div>
          </div>

          <div className="space-y-3">
            <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder={tx("اسم المستخدم", "Full name")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={tx("البريد الإلكتروني", "Email")} type="email" dir="ltr" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={tx("كلمة المرور", "Password")} type="text" dir="ltr" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
              {roleOptions.map((item) => <option key={item} value={item}>{roleLabel(item)}</option>)}
            </select>
            <button onClick={createUser} disabled={creating || !canManage} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60" type="button">
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              {tx("إنشاء مستخدم", "Create user")}
            </button>
            {error ? <Message tone="red" icon={<XCircle className="mt-0.5 h-4 w-4 shrink-0" />}>{error}</Message> : null}
            {message ? <Message tone="green" icon={<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}>{message}</Message> : null}
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{tx("الصلاحيات", "Permissions")}</p>
              <h2 className="text-2xl font-black text-white">{tx("المستخدمون", "Users")}</h2>
            </div>
            <div className="flex gap-2">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tx("بحث...", "Search...")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400 md:w-72" />
              <button type="button" onClick={loadUsers} disabled={refreshing} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-60">
                {refreshing ? tx("تحميل...", "Loading...") : tx("تحديث", "Refresh")}
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredUsers.map((item) => (
              <article key={item.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_220px_150px_130px] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UsersRound className="h-5 w-5 text-emerald-300" />
                      <h3 className="truncate text-lg font-black text-white">{item.full_name ?? item.email ?? "-"}</h3>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-400" dir="ltr">{item.email ?? "-"}</p>
                    {item.id === currentUserId ? <p className="mt-2 text-xs text-emerald-300">{tx("حسابك الحالي", "Current account")}</p> : null}
                  </div>

                  <select value={item.role ?? "sales"} onChange={(event) => updateUser(item.id, { role: event.target.value })} disabled={!canManage || savingId === item.id} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60">
                    {roleOptions.map((option) => <option key={option} value={option}>{roleLabel(option)}</option>)}
                  </select>

                  <span className={("inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold " + (item.is_active ? "bg-emerald-400/10 text-emerald-300" : "bg-red-500/10 text-red-300"))}>
                    <ShieldCheck className="h-4 w-4" /> {item.is_active ? tx("نشط", "Active") : tx("متوقف", "Inactive")}
                  </span>

                  <button type="button" disabled={!canManage || item.id === currentUserId || savingId === item.id} onClick={() => updateUser(item.id, { is_active: !item.is_active })} className="rounded-2xl border border-white/10 px-3 py-3 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40">
                    {savingId === item.id ? tx("حفظ...", "Saving...") : item.is_active ? tx("إيقاف", "Disable") : tx("تفعيل", "Enable")}
                  </button>
                </div>
              </article>
            ))}

            {!filteredUsers.length ? <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-400">{tx("لا يوجد مستخدمون مطابقون.", "No matching users.")}</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "default" | "green" | "blue" | "yellow" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : tone === "blue"
        ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
        : tone === "yellow"
          ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
          : "border-white/10 bg-white/[0.04] text-white";

  return (
    <div className={`safe-card rounded-[2rem] border p-5 ${toneClass}`}>
      <p className="text-sm opacity-80">{label}</p>
      <h2 className="mt-3 text-3xl font-black">{value}</h2>
    </div>
  );
}

function Message({ children, icon, tone }: { children: ReactNode; icon: ReactNode; tone: "red" | "green" }) {
  return (
    <div className={("flex gap-2 rounded-2xl border p-3 text-sm " + (tone === "red" ? "border-red-500/20 bg-red-500/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"))}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
