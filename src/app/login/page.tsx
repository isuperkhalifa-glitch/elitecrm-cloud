"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Database,
  Fingerprint,
  Lock,
  Mail,
  Radar,
  ShieldCheck,
  Sparkles,
  Zap,
  Orbit,
  ScanLine,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const { t, dir, language } = useI18n();
  const isArabic = language === "ar";

  const [email, setEmail] = useState("admin@elitecrm.local");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message || t("loginError"));
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setError("تم تسجيل الدخول لكن لم يتم إنشاء الجلسة. أعد المحاولة.");
        setLoading(false);
        return;
      }

      window.location.href = "/customers";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginError"));
      setLoading(false);
    }
  }

  const cards = [
    {
      icon: ShieldCheck,
      title: isArabic ? "حماية متقدمة" : "Advanced Security",
      text: isArabic ? "صلاحيات محمية وتسجيل دخول آمن" : "Protected roles and secure access",
    },
    {
      icon: Database,
      title: isArabic ? "بيانات متصلة" : "Connected Data",
      text: isArabic ? "كل شيء مربوط بقاعدة بيانات حقيقية" : "Everything backed by real database",
    },
    {
      icon: Activity,
      title: isArabic ? "تشغيل مباشر" : "Live Operations",
      text: isArabic ? "جاهز لإدارة العمل اليومي" : "Ready for daily operations",
    },
  ];

  return (
    <main
      className="elite-login-stage relative min-h-[100svh] overflow-x-hidden bg-slate-950 text-white"
      dir={dir}
    >
      <div className="elite-cyber-grid" />
      <div className="elite-login-scan" />
      <div className="elite-login-orb elite-login-orb-one" />
      <div className="elite-login-orb elite-login-orb-two" />
      <div className="elite-login-orb elite-login-orb-three" />

      <div className="pointer-events-none absolute inset-0">
        <span className="elite-particle left-[12%] top-[18%]" />
        <span className="elite-particle left-[24%] top-[72%]" />
        <span className="elite-particle left-[68%] top-[16%]" />
        <span className="elite-particle left-[82%] top-[64%]" />
        <span className="elite-particle left-[48%] top-[42%]" />
      </div>

      <section className="relative z-10 grid min-h-[100svh] w-full max-w-full items-center gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:px-12 xl:px-20">
        <div className="elite-login-hero mx-auto w-full min-w-0 max-w-3xl text-center lg:text-start">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200 sm:text-sm lg:mx-0">
            <Sparkles className="h-4 w-4" />
            <span>
              {isArabic ? "مركز تشغيل ذكي للمبيعات والعملاء" : "Smart CRM Command Center"}
            </span>
          </div>

          <h1 className="elite-glow-title break-words text-3xl font-black leading-tight sm:text-5xl xl:text-7xl">
            {isArabic
              ? "تحكم في المبيعات من مركز واحد"
              : "Control your sales from one command center"}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-lg lg:mx-0">
            {isArabic
              ? "واجهة تشغيل متقدمة، حركة تفاعلية، بيانات متصلة، وصلاحيات محمية لتجربة إدارة احترافية."
              : "Advanced operating interface, interactive motion, connected data, and protected roles."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {cards.map((card, index) => {
              const Icon = card.icon;

              return (
                <div
                  className="elite-floating-card rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-start backdrop-blur-xl sm:p-5"
                  style={{ animationDelay: `${index * 120}ms` }}
                  key={card.title}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white sm:text-base">{card.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                    {card.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-auto w-full min-w-0 max-w-[28rem]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-emerald-300">{t("appName")}</p>
              <p className="truncate text-xs text-slate-500">
                {isArabic ? "بوابة الدخول الآمنة" : "Secure access gateway"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <section className="elite-login-card relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-2xl sm:rounded-[2rem] sm:p-8">
            <div className="elite-card-border-flow" />

            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black sm:text-3xl">{t("loginTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {t("loginSubtitle")}
                  </p>
                </div>

                <div className="elite-core-pulse flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 sm:h-14 sm:w-14">
                  <Fingerprint className="h-7 w-7" />
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                    <Mail className="h-4 w-4 text-emerald-300" />
                    {t("email")}
                  </span>
                  <input
                    className="elite-input w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    dir="ltr"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                    <Lock className="h-4 w-4 text-emerald-300" />
                    {t("password")}
                  </span>
                  <input
                    className="elite-input w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400"
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
                  className="elite-login-button group mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                  type="submit"
                >
                  {loading ? (
                    <>
                      <Radar className="h-5 w-5 animate-spin" />
                      {t("loggingIn")}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 transition group-hover:scale-110" />
                      {t("loginButton")}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <Orbit className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
                  <p className="text-xs text-slate-500">{isArabic ? "تشغيل" : "Live"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <ScanLine className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
                  <p className="text-xs text-slate-500">{isArabic ? "مراقبة" : "Scan"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
                  <p className="text-xs text-slate-500">{isArabic ? "حماية" : "Safe"}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
