import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { parseLeadStatus } from "@/lib/crm/customer-core";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile } = await getCurrentUserProfile();
    const { id } = await context.params;
    const body = await request.json();
    const status = parseLeadStatus(String(body.status ?? ""));

    if (!status) {
      return NextResponse.json(
        { status: "error", message: "حالة العميل غير صحيحة." },
        { status: 422 }
      );
    }

    if (status === "paid") {
      return NextResponse.json(
        {
          status: "error",
          message: "لا يمكن تسجيل السداد من حالة العميل. أنشئ تسجيلًا وحدّث المبلغ المدفوع من صفحة التسجيلات.",
        },
        { status: 422 }
      );
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id,owner_id")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { status: "error", message: "العميل غير موجود أو خارج نطاق صلاحيتك." },
        { status: 404 }
      );
    }

    const canUpdate =
      ["developer", "admin", "manager", "moderator"].includes(profile.role) ||
      lead.owner_id === user.id;

    if (!canUpdate) {
      return NextResponse.json(
        { status: "error", message: "لا تملك صلاحية تعديل حالة هذا العميل." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .update({
        status,
        customer_status: status,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { status: "error", message: error?.message ?? "تعذر تحديث حالة العميل." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "تم تحديث حالة العميل بنجاح.",
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export const PATCH = PUT;
