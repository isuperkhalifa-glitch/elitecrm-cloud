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
        { status: "error", message: "Invalid lead status." },
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
        { status: "error", message: "Lead not found." },
        { status: 404 }
      );
    }

    const role = profile?.role ?? "sales";
    const canUpdate =
      ["admin", "manager", "moderator", "finance"].includes(role) ||
      lead.owner_id === user.id;

    if (!canUpdate) {
      return NextResponse.json(
        { status: "error", message: "Not allowed." },
        { status: 403 }
      );
    }

    const patch: Record<string, unknown> = {
      status,
      customer_status: status,
      status_updated_at: new Date().toISOString(),
    };

    if (status === "paid") {
      patch.registration_status = "registered";
      patch.payment_status = "paid";
    }

    const { data, error } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { status: "error", message: error?.message ?? "Unable to update lead." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Lead status updated successfully.",
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export const PATCH = PUT;
