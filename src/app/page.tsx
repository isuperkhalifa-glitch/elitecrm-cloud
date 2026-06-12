import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true });

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <p className="text-sm text-emerald-400 mb-3">EliteCRM Cloud</p>

        <h1 className="text-3xl font-bold mb-4">
          Supabase Connection Test
        </h1>

        {error ? (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-200">
            <p className="font-semibold">Connection Failed</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-200">
            <p className="font-semibold">Connection Successful</p>
            <p className="text-sm mt-2">
              Companies table is ready. Current rows: {count ?? 0}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
