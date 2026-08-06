export function OddsBar({
  pct,
  label,
  sub,
  color = "bg-[#AB0003]",
}: {
  pct: number;
  label: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
        <span className="text-xl font-black tabular-nums">{(pct * 100).toFixed(1)}%</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(2, Math.round(pct * 100))}%` }}
        />
      </div>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}
