import type { Language } from "@/lib/i18n/translations";

export const leadStatusValues = [
  "interested",
  "not_interested",
  "need_offer",
  "missed",
  "wrong_number",
  "paid",
  "busy",
] as const;

export type LeadStatusValue = (typeof leadStatusValues)[number];

export const leadTypeValues = ["fresh", "retargeted", "redirected"] as const;
export type LeadTypeValue = (typeof leadTypeValues)[number];

export const leadStatusMeta: Record<LeadStatusValue, { ar: string; en: string; className: string }> = {
  interested: {
    ar: "مهتم",
    en: "Interested",
    className: "bg-emerald-400/10 text-emerald-300",
  },
  not_interested: {
    ar: "غير مهتم",
    en: "Not interested",
    className: "bg-red-500/10 text-red-300",
  },
  need_offer: {
    ar: "يحتاج عرض",
    en: "Need offer",
    className: "bg-sky-400/10 text-sky-300",
  },
  missed: {
    ar: "لم يتم الرد",
    en: "Missed",
    className: "bg-slate-400/10 text-slate-300",
  },
  wrong_number: {
    ar: "رقم خطأ",
    en: "Wrong number",
    className: "bg-orange-400/10 text-orange-300",
  },
  paid: {
    ar: "سدد",
    en: "Paid",
    className: "bg-emerald-500/10 text-emerald-300",
  },
  busy: {
    ar: "مشغول",
    en: "Busy",
    className: "bg-yellow-400/10 text-yellow-300",
  },
};

export const leadTypeMeta: Record<LeadTypeValue, { ar: string; en: string; className: string }> = {
  fresh: {
    ar: "جديد",
    en: "Fresh",
    className: "bg-emerald-400/10 text-emerald-300",
  },
  retargeted: {
    ar: "إعادة استهداف",
    en: "Retargeted",
    className: "bg-sky-400/10 text-sky-300",
  },
  redirected: {
    ar: "محول",
    en: "Redirected",
    className: "bg-yellow-400/10 text-yellow-300",
  },
};

export const countryCodes = [
  { code: "+966", ar: "السعودية", en: "Saudi Arabia" },
  { code: "+20", ar: "مصر", en: "Egypt" },
  { code: "+967", ar: "اليمن", en: "Yemen" },
  { code: "+91", ar: "الهند", en: "India" },
  { code: "+971", ar: "الإمارات", en: "UAE" },
  { code: "+965", ar: "الكويت", en: "Kuwait" },
  { code: "+974", ar: "قطر", en: "Qatar" },
  { code: "+973", ar: "البحرين", en: "Bahrain" },
  { code: "+968", ar: "عمان", en: "Oman" },
];

export const courseOptions = [
  { id: "pmp", ar: "PMP", en: "PMP" },
  { id: "grcp", ar: "GRCP", en: "GRCP" },
  { id: "power-bi-offline", ar: "Power BI Offline", en: "Power BI Offline" },
  { id: "kpi", ar: "KPI", en: "KPI" },
  { id: "pmp-offline", ar: "PMP Offline", en: "PMP Offline" },
  { id: "rmp", ar: "RMP", en: "RMP" },
  { id: "ai", ar: "AI", en: "AI" },
  { id: "aphri", ar: "aPHRi (HRCI)", en: "aPHRi (HRCI)" },
  { id: "social-media", ar: "Social Media", en: "Social Media" },
  { id: "financial-management", ar: "الإدارة المالية", en: "Financial Management" },
  { id: "ai-offline", ar: "AI Offline", en: "AI Offline" },
  { id: "excel", ar: "Excel", en: "Excel" },
  { id: "power-bi", ar: "Power BI", en: "Power BI" },
  { id: "cs", ar: "CS", en: "CS" },
  { id: "capm", ar: "CAPM", en: "CAPM" },
  { id: "english-club", ar: "English Club", en: "English Club" },
];

export function getLeadStatusLabel(value: string | null | undefined, language: Language = "ar") {
  const normalized = normalizeLeadStatus(value);
  return leadStatusMeta[normalized]?.[language] ?? value ?? "-";
}

export function getLeadTypeLabel(value: string | null | undefined, language: Language = "ar") {
  const normalized = normalizeLeadType(value);
  return leadTypeMeta[normalized]?.[language] ?? value ?? "-";
}

export function getLeadStatusClass(value: string | null | undefined) {
  return leadStatusMeta[normalizeLeadStatus(value)]?.className ?? "bg-white/10 text-slate-200";
}

export function getLeadTypeClass(value: string | null | undefined) {
  return leadTypeMeta[normalizeLeadType(value)]?.className ?? "bg-white/10 text-slate-200";
}

export function normalizeLeadStatus(value: string | null | undefined): LeadStatusValue {
  const normalized = String(value ?? "").trim().toLowerCase();

  const legacyMap: Record<string, LeadStatusValue> = {
    new: "interested",
    assigned: "interested",
    contacted: "interested",
    qualified: "interested",
    converted: "paid",
    registered: "interested",
    follow_up: "busy",
    no_answer: "missed",
    no_reply: "missed",
    waitingorconnecting: "busy",
    noreplyorclosed: "missed",
    notinterested: "not_interested",
    wrongnumber: "wrong_number",
    needoffer: "need_offer",
    lost: "not_interested",
    canceled: "not_interested",
    saded: "paid",
    "سدد": "paid",
  };

  if (leadStatusValues.includes(normalized as LeadStatusValue)) {
    return normalized as LeadStatusValue;
  }

  return legacyMap[normalized] ?? "interested";
}

export function normalizeLeadType(value: string | null | undefined): LeadTypeValue {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (leadTypeValues.includes(normalized as LeadTypeValue)) {
    return normalized as LeadTypeValue;
  }

  return "fresh";
}

export function normalizePhoneInput(countryCode: string, phoneNumber: string) {
  const cleanCountryCode = String(countryCode || "+966").trim().replace(/[^\d+]/g, "") || "+966";
  const cleanPhoneNumber = String(phoneNumber || "").replace(/\D/g, "").replace(/^0+/, "");
  const compactCountry = cleanCountryCode.replace(/^\+/, "");

  return {
    country_code: cleanCountryCode,
    phone_number: cleanPhoneNumber,
    phone: cleanPhoneNumber ? `${compactCountry}${cleanPhoneNumber}` : "",
  };
}

export function splitPhone(phone: string | null | undefined) {
  const raw = String(phone ?? "").replace(/[^\d+]/g, "").replace(/^00/, "+");

  if (!raw) {
    return { country_code: "+966", phone_number: "" };
  }

  const withPlus = raw.startsWith("+") ? raw : `+${raw}`;

  const matched = countryCodes
    .map((country) => country.code)
    .sort((a, b) => b.length - a.length)
    .find((code) => withPlus.startsWith(code));

  if (!matched) {
    return { country_code: "+966", phone_number: raw.replace(/^0+/, "") };
  }

  return {
    country_code: matched,
    phone_number: withPlus.slice(matched.length).replace(/^0+/, ""),
  };
}

export function getCourseName(courseId: string | null | undefined, language: Language = "ar") {
  if (!courseId) return "-";
  const course = courseOptions.find((item) => item.id === courseId);
  return course?.[language] ?? courseId;
}

export function guessCourseId(value: string | null | undefined) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;

  const direct = courseOptions.find((course) => {
    return (
      course.id.toLowerCase() === text ||
      course.ar.toLowerCase() === text ||
      course.en.toLowerCase() === text
    );
  });

  if (direct) return direct.id;

  if (text.includes("power") && text.includes("offline")) return "power-bi-offline";
  if (text.includes("power")) return "power-bi";
  if (text.includes("pmp") && text.includes("offline")) return "pmp-offline";
  if (text.includes("pmp")) return "pmp";
  if (text.includes("capm")) return "capm";
  if (text.includes("rmp")) return "rmp";
  if (text.includes("grcp")) return "grcp";
  if (text.includes("excel")) return "excel";
  if (text.includes("english")) return "english-club";
  if (text.includes("مالي") || text.includes("financial")) return "financial-management";
  if (text.includes("social")) return "social-media";
  if (text.includes("ai") && text.includes("offline")) return "ai-offline";
  if (text.includes("ai")) return "ai";
  if (text.includes("kpi")) return "kpi";
  if (text === "cs") return "cs";

  return null;
}