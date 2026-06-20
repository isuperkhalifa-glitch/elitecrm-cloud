import { cookies } from "next/headers";

const COOKIE_NAME = "elitecrm-year";

export function normalizeYear(value?: string | null) {
  const currentYear = new Date().getFullYear();
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > currentYear + 1) {
    return currentYear;
  }
  return parsed;
}

export async function getEffectiveYear() {
  const cookieStore = await cookies();
  return normalizeYear(cookieStore.get(COOKIE_NAME)?.value);
}

export function yearDateRange(year: number) {
  return {
    from: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).toISOString(),
    to: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)).toISOString(),
  };
}

export const effectiveYearCookieName = COOKIE_NAME;
