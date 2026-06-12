import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title,description,status,priority,due_date,created_at")
    .order("created_at", { ascending: false });

  return (
    <TasksClient
      initialTasks={tasks ?? []}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
