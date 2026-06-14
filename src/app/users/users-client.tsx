"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserPlus,
  UsersRound,
  XCircle,
} from "lucide-react";

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

const roleOptions = ["admin", "manager", "moderator", "sales", "finance"];

const emptyForm = {
  full_name: "",
  email: "",
  password: "User@12345",
  role: "sales",
};

export function UsersClient({
  initialUsers,
  currentUserId,
  userEmail,
  fullName,
  role,
}: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const canManage = role === "admin";

  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState("");

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function roleLabel(value: string | null) {
    if (value === "admin") return tx("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", "Admin");
    if (value === "manager") return tx("ظ…ط¯ظٹط±", "Manager");
    if (value === "moderator") return tx("ظ…ظˆط¯ظٹط±ظٹطھظˆط±", "Moderator");
    if (value === "finance") return tx("ظ…ط§ظ„ظٹط©", "Finance");
    return tx("ط³ظٹظ„ط²", "Sales");
  }

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) =>
      [
        user.full_name,
        user.email,
        user.role,
        user.is_active ? "active" : "inactive",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [users, search]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.is_active).length,
      sales: users.filter((user) => user.role === "sales").length,
      admins: users.filter((user) => ["admin", "manager"].includes(user.role ?? "")).length,
    };
  }, [users]);

  async function createUser() {
    setMessage("");
    setError("");

    if (!canManage) {
      setError(tx("ظ‡ط°ظ‡ ط§ظ„طµظ„ط§ط­ظٹط© ظ„ظ„ط£ط¯ظ…ظ† ظپظ‚ط·.", "Admin only."));
      return;
    }

    setCreating(true);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? tx("طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط³طھط®ط¯ظ….", "Unable to create user."));
      setCreating(false);
      return;
    }

    setUsers((current) => [result.user as UserRow, ...current]);
    setForm(emptyForm);
    setMessage(tx("طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ†ط¬ط§ط­.", "User created successfully."));
    setCreating(false);
  }

  async function updateUser(userId: string, patch: Partial<UserRow>) {
    setMessage("");
    setError("");

    if (!canManage) {
      setError(tx("ظ‡ط°ظ‡ ط§ظ„طµظ„ط§ط­ظٹط© ظ„ظ„ط£ط¯ظ…ظ† ظپظ‚ط·.", "Admin only."));
      return;
    }

    setSavingId(userId);

    const response = await fetch("/api/admin/users/" + encodeURIComponent(userId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });

    const result = await response.json();

    if (!response.ok || !result.user) {
      setError(result.error ?? tx("طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ظ…ط³طھط®ط¯ظ….", "Unable to update user."));
      setSavingId("");
      return;
    }

    setUsers((current) =>
      current.map((user) => (user.id === userId ? (result.user as UserRow) : user))
    );

    setMessage(tx("طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ط³طھط®ط¯ظ….", "User updated."));
    setSavingId("");
  }

  return (
    <AppShell
      titleKey="users"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{tx("ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†", "Total users")}</p>
          <h2 className="mt-2 text-3xl font-black text-white">{stats.total}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-sm text-emerald-300">{tx("ظ†ط´ط·ظٹظ†", "Active")}</p>
          <h2 className="mt-2 text-3xl font-black text-emerald-300">{stats.active}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-sky-400/20 bg-sky-400/10 p-5">
          <p className="text-sm text-sky-300">{tx("ط³ظٹظ„ط²", "Sales")}</p>
          <h2 className="mt-2 text-3xl font-black text-sky-300">{stats.sales}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="text-sm text-yellow-300">{tx("ط¥ط¯ط§ط±ط©", "Admins")}</p>
          <h2 className="mt-2 text-3xl font-black text-yellow-300">{stats.admins}</h2>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-300">{tx("ط¥ط¶ط§ظپط© ظ…ط³طھط®ط¯ظ…", "Add user")}</p>
              <h2 className="text-2xl font-black text-white">{tx("ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯", "New User")}</h2>
            </div>
          </div>

          <div className="space-y-3">
            <input
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              placeholder={tx("ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…", "Full name")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />

            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder={tx("ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ", "Email")}
              type="email"
              dir="ltr"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />

            <input
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={tx("ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±", "Password")}
              type="text"
              dir="ltr"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />

            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              {roleOptions.map((item) => (
                <option key={item} value={item}>
                  {roleLabel(item)}
                </option>
              ))}
            </select>

            <button
              onClick={createUser}
              disabled={creating || !canManage}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
              type="button"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              {tx("ط¥ظ†ط´ط§ط، ظ…ط³طھط®ط¯ظ…", "Create user")}
            </button>

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {message}
              </div>
            ) : null}
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{tx("ط§ظ„طµظ„ط§ط­ظٹط§طھ", "Permissions")}</p>
              <h2 className="text-2xl font-black text-white">{tx("ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†", "Users")}</h2>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tx("ط¨ط­ط«...", "Search...")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400 md:max-w-sm"
            />
          </div>

          <div className="grid gap-3">
            {filteredUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"
              >
                <div className="grid gap-4 xl:grid-cols-[1fr_220px_140px_130px] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <UsersRound className="h-4 w-4 text-emerald-300" />
                      <p className="truncate font-bold text-white">
                        {user.full_name ?? "-"}
                      </p>

                      {user.id === currentUserId ? (
                        <span className="rounded-full bg-sky-400/10 px-2 py-1 text-xs text-sky-300">
                          {tx("ط£ظ†طھ", "You")}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-slate-400" dir="ltr">
                      {user.email ?? user.id}
                    </p>
                  </div>

                  <select
                    value={user.role ?? "sales"}
                    disabled={!canManage || savingId === user.id}
                    onChange={(event) =>
                      updateUser(user.id, { role: event.target.value })
                    }
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400 disabled:opacity-60"
                  >
                    {roleOptions.map((item) => (
                      <option key={item} value={item}>
                        {roleLabel(item)}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!canManage || savingId === user.id}
                    onClick={() =>
                      updateUser(user.id, { is_active: !user.is_active })
                    }
                    className={"rounded-2xl border px-4 py-3 text-sm font-bold transition disabled:opacity-60 " +
                      (user.is_active
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300")}
                    type="button"
                  >
                    {savingId === user.id
                      ? tx("ط¬ط§ط±ظٹ...", "Saving...")
                      : user.is_active
                        ? tx("ظ†ط´ط·", "Active")
                        : tx("ظ…ظˆظ‚ظˆظپ", "Inactive")}
                  </button>

                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    {roleLabel(user.role)}
                  </div>
                </div>
              </article>
            ))}

            {filteredUsers.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
                {tx("ظ„ط§ ظٹظˆط¬ط¯ ظ…ط³طھط®ط¯ظ…ظٹظ†.", "No users found.")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
