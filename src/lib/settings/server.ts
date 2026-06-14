import { mergeSystemSettings, type SystemSetting } from "@/lib/settings/defaults";

type SupabaseLike = {
  from: (table: string) => any;
};

export async function loadPublicSystemSettings(supabase: SupabaseLike) {
  const { data, error } = await supabase
    .from("system_settings")
    .select("key,label,group_name,value,description,is_public,updated_at")
    .eq("is_public", true)
    .order("group_name", { ascending: true })
    .order("key", { ascending: true });

  if (error) return mergeSystemSettings([]);
  return mergeSystemSettings((data ?? []) as SystemSetting[]);
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;
  }

  return fallback;
}

export function isFeatureEnabled(
  settings: SystemSetting[],
  key: string,
  fallback = true
) {
  const value = settings.find((setting) => setting.key === key)?.value ?? fallback;
  return normalizeBoolean(value, fallback);
}
