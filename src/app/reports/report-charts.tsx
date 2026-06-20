"use client";

import type { DistributionPoint, SourcePoint, TaskPoint } from "./reports-types";

const palette = ["#0f766e", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#65a30d", "#ea580c"];

export function SourceDonut({ data, emptyText }: { data: SourcePoint[]; emptyText: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <EmptyChart text={emptyText} />;

  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-center">
      <div className="relative mx-auto h-[260px] w-[260px]">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="28" />
          {data.map((item, index) => {
            const length = (item.value / total) * circumference;
            const element = (
              <circle
                key={item.name}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={palette[index % palette.length]}
                strokeWidth="28"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += length;
            return element;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-800">{total}</span>
          <span className="text-xs text-slate-500">إجمالي العملاء</span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
              <span className="truncate text-sm text-slate-700">{item.name}</span>
            </div>
            <div className="ms-3 text-end">
              <p className="text-sm font-bold text-slate-900">{item.value}</p>
              <p className="text-[11px] text-slate-500">{((item.value / total) * 100).toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DistributionBars({ data, emptyText }: { data: DistributionPoint[]; emptyText: string }) {
  const max = Math.max(1, ...data.map((item) => item.total));
  if (!data.length) return <EmptyChart text={emptyText} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <Legend color="#2563eb" label="جديد" />
        <Legend color="#f59e0b" label="إعادة استهداف" />
        <Legend color="#7c3aed" label="محوّل" />
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="grid gap-2 md:grid-cols-[190px_1fr_52px] md:items-center">
            <div className="truncate text-sm font-semibold text-slate-700" title={item.name}>{item.name}</div>
            <div className="h-8 overflow-hidden rounded bg-slate-100">
              <div className="flex h-full" style={{ width: `${Math.max(3, (item.total / max) * 100)}%` }}>
                {item.fresh ? <div className="flex h-full items-center justify-center bg-blue-600 px-2 text-xs font-bold text-white" style={{ width: `${(item.fresh / item.total) * 100}%` }}>{item.fresh}</div> : null}
                {item.retargeted ? <div className="flex h-full items-center justify-center bg-amber-500 px-2 text-xs font-bold text-white" style={{ width: `${(item.retargeted / item.total) * 100}%` }}>{item.retargeted}</div> : null}
                {item.redirected ? <div className="flex h-full items-center justify-center bg-violet-600 px-2 text-xs font-bold text-white" style={{ width: `${(item.redirected / item.total) * 100}%` }}>{item.redirected}</div> : null}
              </div>
            </div>
            <div className="text-end text-sm font-black text-slate-900">{item.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompletedTasksBars({ data, emptyText }: { data: TaskPoint[]; emptyText: string }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  if (!data.length) return <EmptyChart text={emptyText} />;

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.id} className="grid gap-2 md:grid-cols-[190px_1fr_52px] md:items-center">
          <div className="truncate text-sm font-semibold text-slate-700" title={item.name}>{item.name}</div>
          <div className="h-9 overflow-hidden rounded bg-slate-100">
            <div
              className="flex h-full items-center justify-center rounded bg-orange-400 px-2 text-sm font-black text-slate-950"
              style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }}
            >
              {item.count}
            </div>
          </div>
          <div className="text-end text-sm font-black text-slate-900">{item.count}</div>
        </div>
      ))}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}

function EmptyChart({ text }: { text: string }) {
  return <div className="flex min-h-[260px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">{text}</div>;
}
