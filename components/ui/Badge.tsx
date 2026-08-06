export function Badge({
  tone,
  children,
}: {
  tone: "win" | "loss" | "neutral" | "live" | "scheduled";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    win: "bg-[#0a7d3a] text-white",
    loss: "bg-[#AB0003] text-white",
    neutral: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
    live: "bg-sky-600 text-white animate-pulse",
    scheduled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <span
      className={`inline-flex min-w-[2rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
