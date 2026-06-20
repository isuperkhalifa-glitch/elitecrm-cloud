export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 p-6" dir="rtl">
      <div className="mx-auto mt-20 max-w-6xl space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-white" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}
