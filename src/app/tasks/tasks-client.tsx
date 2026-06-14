"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";
import { createClient } from "@/lib/supabase/client";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  owner_id: string | null;
  related_type?: string | null;
  related_id?: string | null;
  created_at: string;
};

type TasksClientProps = {
  initialTasks: Task[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type TaskForm = {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: "",
};

export function TasksClient({
  initialTasks,
  currentUserId,
  userEmail,
  fullName,
  role,
}: TasksClientProps) {
  const { t } = useI18n();
  const { scope } = useScope();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const scopedTasks = useMemo<Task[]>(() => {
    if (scope.mode === "user" && scope.targetId) {
      return tasks.filter((task) => task.owner_id === scope.targetId);
    }

    if (scope.mode === "company" && scope.targetId) {
      return tasks.filter(
        (task) =>
          task.related_type === "company" &&
          task.related_id === scope.targetId
      );
    }

    return tasks;
  }, [tasks, scope]);

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return scopedTasks;

    return scopedTasks.filter((task) =>
      [
        task.title,
        task.description,
        getStatusLabel(task.status),
        getPriorityLabel(task.priority),
        getDueLabel(task.due_date),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [scopedTasks, search]);

  const summary = useMemo(() => {
    const now = new Date();

    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      done: tasks.filter((task) => task.status === "done").length,
      overdue: tasks.filter((task) => {
        if (!task.due_date || task.status === "done" || task.status === "canceled") {
          return false;
        }

        return new Date(task.due_date) < now;
      }).length,
    };
  }, [scopedTasks]);

  function getStatusLabel(status: string) {
    if (status === "in_progress") return t("inProgressTask");
    if (status === "done") return t("doneTask");
    if (status === "canceled") return t("canceledTask");
    return t("todoTask");
  }

  function getPriorityLabel(priority: string) {
    if (priority === "low") return t("lowPriority");
    if (priority === "high") return t("highPriority");
    if (priority === "urgent") return t("urgentPriority");
    return t("mediumPriority");
  }

  function getDueLabel(dueDate: string | null) {
    if (!dueDate) return "-";

    const date = new Date(dueDate);
    const now = new Date();

    const dateOnly = date.toDateString();
    const todayOnly = now.toDateString();

    if (date < now) return t("overdueTask");
    if (dateOnly === todayOnly) return t("todayTask");
    return t("upcomingTask");
  }

  function formatDueDate(dueDate: string | null) {
    if (!dueDate) return "-";

    return new Date(dueDate).toLocaleString();
  }

  function updateField(field: keyof TaskForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setMessage("");
    setError("");

    const dueValue = task.due_date
      ? new Date(task.due_date).toISOString().slice(0, 16)
      : "";

    setForm({
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "todo",
      priority: task.priority ?? "medium",
      due_date: dueValue,
    });
  }

  async function saveTask() {
    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError(t("requiredField"));
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      owner_id: scope.mode === "user" && scope.targetId ? scope.targetId : currentUserId,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", editingId)
        .select("id,title,description,status,priority,due_date,created_at")
        .single();

      setSaving(false);

      if (error || !data) {
        console.error(error);
        setError(error?.message ?? t("taskSaveError"));
        return;
      }

      const updatedTask = data as Task;

      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );

      setMessage(t("taskUpdated"));
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select("id,title,description,status,priority,due_date,created_at")
      .single();

    setSaving(false);

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? t("taskSaveError"));
      return;
    }

    setTasks((current) => [data as Task, ...current]);
    setMessage(t("taskSaved"));
    resetForm();
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm(t("confirmDeleteTask"))) return;

    const supabase = createClient();

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== taskId));
    setMessage(t("taskDeleted"));
  }

  async function quickStatus(taskId: string, status: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId)
      .select("id,title,description,status,priority,due_date,created_at")
      .single();

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? t("taskSaveError"));
      return;
    }

    const updatedTask = data as Task;

    setTasks((current) =>
      current.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  }

  return (
    <AppShell
      titleKey="tasks"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{t("totalTasks")}</p>
          <h2 className="mt-2 text-3xl font-black">{summary.total}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{t("todoTask")}</p>
          <h2 className="mt-2 text-3xl font-black">{summary.todo}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{t("inProgressTask")}</p>
          <h2 className="mt-2 text-3xl font-black">{summary.inProgress}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{t("doneTask")}</p>
          <h2 className="mt-2 text-3xl font-black">{summary.done}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm text-red-200">{t("overdueTask")}</p>
          <h2 className="mt-2 text-3xl font-black text-red-200">{summary.overdue}</h2>
        </div>
      </div>

      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <p className="text-sm text-emerald-300">
            {editingId ? t("editTask") : t("addTask")}
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">{t("taskTitle")}</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{t("taskDescription")}</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{t("taskStatus")}</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  <option value="todo">{t("todoTask")}</option>
                  <option value="in_progress">{t("inProgressTask")}</option>
                  <option value="done">{t("doneTask")}</option>
                  <option value="canceled">{t("canceledTask")}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{t("taskPriority")}</span>
                <select
                  value={form.priority}
                  onChange={(event) => updateField("priority", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  <option value="low">{t("lowPriority")}</option>
                  <option value="medium">{t("mediumPriority")}</option>
                  <option value="high">{t("highPriority")}</option>
                  <option value="urgent">{t("urgentPriority")}</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm text-slate-300">{t("dueDate")}</span>
              <input
                value={form.due_date}
                onChange={(event) => updateField("due_date", event.target.value)}
                type="datetime-local"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                dir="ltr"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={saveTask}
                disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                type="button"
              >
                {editingId ? t("updateTask") : t("addTask")}
              </button>

              {editingId ? (
                <button
                  onClick={resetForm}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
                  type="button"
                >
                  {t("cancelEdit")}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{t("totalTasks")}</p>
              <h2 className="mt-1 text-3xl font-bold">{tasks.length}</h2>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchTasks")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400 md:max-w-sm"
            />
          </div>

          <div className="grid gap-3">
            {filteredTasks.map((task) => {
              const dueLabel = getDueLabel(task.due_date);
              const overdue = dueLabel === t("overdueTask");

              return (
                <article
                  key={task.id}
                  className={`elite-motion-card rounded-3xl border p-5 ${
                    overdue
                      ? "border-red-500/25 bg-red-500/10"
                      : "border-white/10 bg-slate-900/70"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">{task.title}</h3>

                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                          {getStatusLabel(task.status)}
                        </span>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                          {getPriorityLabel(task.priority)}
                        </span>

                        {task.due_date ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              overdue
                                ? "bg-red-500/15 text-red-200"
                                : "bg-sky-400/10 text-sky-200"
                            }`}
                          >
                            {dueLabel}
                          </span>
                        ) : null}
                      </div>

                      {task.description ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                          {task.description}
                        </p>
                      ) : null}

                      <p className="mt-3 text-xs text-slate-500" dir="ltr">
                        {formatDueDate(task.due_date)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {task.status !== "done" ? (
                        <button
                          onClick={() => quickStatus(task.id, "done")}
                          className="rounded-xl border border-emerald-400/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-400/10"
                          type="button"
                        >
                          {t("doneTask")}
                        </button>
                      ) : null}

                      <button
                        onClick={() => startEdit(task)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                        type="button"
                      >
                        {t("edit")}
                      </button>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                        type="button"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredTasks.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-400">
                {t("noTasks")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}







