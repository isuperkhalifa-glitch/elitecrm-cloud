import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { processCall } from "./process-call";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getCurrentUserProfile();
    const scope = await getEffectiveScope(profile?.role);
    if (scope.previewAsUser) {
      return NextResponse.json({ status: "error", message: "معاينة المستخدم للعرض فقط." }, { status: 403 });
    }
    const { id } = await context.params;
    return await processCall(request, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export const PATCH = POST;
