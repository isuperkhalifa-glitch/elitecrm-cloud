export const enhancedFields = [
  "id",
  "customer_code",
  "full_name",
  "phone",
  "country_code",
  "phone_number",
  "owner_id",
  "status",
  "customer_status",
  "lead_type",
  "source",
  "program",
  "course_id",
  "priority",
  "next_follow_up_at",
  "last_contact_at",
  "last_call_at",
  "last_note",
  "created_at",
  "assigned_by",
  "intake_by",
  "queue_type",
  "redirected_date",
  "call_sender_id",
  "call_receiver_id",
  "connection_type",
  "caller_mobile",
  "second_number",
  "system_source",
  "received_at",
  "call_deadline_at",
  "call_done_at",
  "call_done_description",
  "education_level",
  "city",
].join(",");

export const fallbackFields = [
  "id",
  "customer_code",
  "full_name",
  "phone",
  "country_code",
  "phone_number",
  "owner_id",
  "status",
  "customer_status",
  "lead_type",
  "source",
  "program",
  "course_id",
  "priority",
  "next_follow_up_at",
  "last_contact_at",
  "last_call_at",
  "last_note",
  "created_at",
  "assigned_by",
  "intake_by",
  "queue_type",
  "redirected_date",
].join(",");

export function normalizeLegacyCall(row: Record<string, unknown>) {
  const leadType = typeof row.lead_type === "string" ? row.lead_type : null;
  const source = typeof row.source === "string" ? row.source : null;
  const queueType = typeof row.queue_type === "string" ? row.queue_type : null;
  const ownerId = typeof row.owner_id === "string" ? row.owner_id : null;
  const redirectedDate = typeof row.redirected_date === "string" ? row.redirected_date : null;

  let connectionType = "manual";
  if (leadType === "redirected" || redirectedDate) connectionType = "redirected";
  else if ((source ?? "").toLowerCase().includes("ivr")) connectionType = "ivr";
  else if (queueType === "manual") connectionType = "manual";
  else if (ownerId) connectionType = "distributed";

  return {
    ...row,
    call_sender_id: row.assigned_by ?? row.intake_by ?? null,
    call_receiver_id: row.owner_id ?? null,
    connection_type: connectionType,
    caller_mobile: row.phone ?? row.phone_number ?? null,
    second_number: null,
    system_source: row.queue_type ?? row.source ?? "manual",
    received_at: row.created_at ?? null,
    call_deadline_at: row.next_follow_up_at ?? null,
    call_done_at: row.last_call_at ?? row.last_contact_at ?? null,
    call_done_description: row.last_note ?? null,
    education_level: null,
    city: null,
  };
}
