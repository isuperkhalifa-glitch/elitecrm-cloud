import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mergeSystemSettings } from "@/lib/settings/defaults";

const selectColumns = "key,label,group_name,value,description,is_public,updated_at";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("system_settings")
      .select(selectColumns)
      .eq("is_public", true)
      .order("group_name", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      return NextResponse.json({
        settings: mergeSystemSettings([]),
        warning: error.message,
      });
    }

    return NextResponse.json({ settings: mergeSystemSettings((data ?? []) as any) });
  } catch (error) {
    const warning = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ settings: mergeSystemSettings([]), warning });
  }
}
