export function FormDots({ results, label }: { results: ("W" | "L")[]; label?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>}
      <div className="flex gap-1">
        {results.map((r, i) => (
          <span
            key={i}
            title={r === "W" ? "勝" : "負"}
            className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white ${
              r === "W" ? "bg-[#0a7d3a]" : "bg-[#AB0003]"
            }`}
          >
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
