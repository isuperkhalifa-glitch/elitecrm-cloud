"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";

export default function LoginPage() {
  const router = useRouter();
  const { t, dir } = useI18n();
  const [email, setEmail] = useState("admin@elitecrm.local");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(t("loginError"));
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6" dir={dir}>
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-emerald-400">{t("appName")}</p>
          <LanguageToggle />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("loginTitle")}</h1>
          <p className="text-sm text-slate-400 mt-2">{t("loginSubtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">{t("email")}</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              dir="ltr"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">{t("password")}</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              dir="ltr"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? t("loggingIn") : t("loginButton")}
          </button>
        </form>
      </section>
    </main>
  );
}
