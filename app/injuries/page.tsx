import type { Metadata } from "next";
import { getInjuryReport, getRecentTransactions } from "@/lib/mlb";
import { formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import type { InjuryReportItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "傷兵交易",
  description: "華盛頓國民隊 40-man 名單傷兵報告與近期交易動態",
};

const IL_STYLE: Record<InjuryReportItem["ilCode"], string> = {
  IL10: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  IL15: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  IL60: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default async function InjuriesPage() {
  const [injuries, transactions] = await Promise.all([
    getInjuryReport(),
    getRecentTransactions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">傷兵與交易</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          40-man 名單傷兵狀態 · 近期重要交易／異動
        </p>
      </div>

      <Card title="傷兵報告" subtitle={`${injuries.length} 名受傷球員`}>
        {injuries.length === 0 ? (
          <p className="text-sm text-zinc-500">暫時冇傷兵。</p>
        ) : (
          <ul className="space-y-2">
            {injuries.map((p) => (
              <li
                key={p.personId}
                className="flex items-center gap-3 rounded-lg bg-zinc-50 px-4 py-2.5 dark:bg-zinc-800/60"
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${IL_STYLE[p.ilCode]}`}
                >
                  {p.ilCode}
                </span>
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-zinc-400">
                  #{p.jerseyNumber} · {p.position}
                </span>
                <span className="ml-auto text-xs text-zinc-400">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="近期交易 / 異動" subtitle="本季至今">
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">本季暫時冇重要交易。</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {transactions.map((t, i) => (
              <li key={i} className="flex gap-4 py-2.5 text-sm">
                <span className="w-20 shrink-0 tabular-nums text-zinc-400">
                  {formatDate(t.date)}
                </span>
                <span className="w-32 shrink-0 text-xs font-semibold text-[#AB0003]">
                  {t.type}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">{t.description}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
