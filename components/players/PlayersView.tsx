"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PlayerStatLine } from "@/lib/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatAvg, formatEra, formatIp, formatTwo, ipToDecimal } from "@/lib/formatters";

type Tab = "hitting" | "pitching";

// 位置分組
const POS_GROUPS: Record<string, string[]> = {
  全部: [],
  內野: ["1B", "2B", "3B", "SS"],
  外野: ["LF", "CF", "RF"],
  捕手: ["C"],
  指定打擊: ["DH"],
};

export function PlayersView({
  hitters,
  pitchers,
}: {
  hitters: PlayerStatLine[];
  pitchers: PlayerStatLine[];
}) {
  const [tab, setTab] = useState<Tab>("hitting");
  const [posFilter, setPosFilter] = useState("全部");

  const playerLink = (row: PlayerStatLine) => `/players/${row.personId}`;

  const nameCol = (sub?: (row: PlayerStatLine) => string): Column<PlayerStatLine> => ({
    key: "name",
    label: "球員",
    render: (row) => (
      <span className="flex items-center gap-2">
        <Link
          href={`/players/${row.personId}`}
          className="font-semibold text-zinc-800 hover:text-[#AB0003] hover:underline dark:text-zinc-100"
        >
          {row.name}
        </Link>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {row.position}
        </span>
        {sub && (
          <span className="hidden text-xs text-zinc-400 md:inline">{sub(row)}</span>
        )}
      </span>
    ),
  });

  const hittingColumns: Column<PlayerStatLine>[] = [
    nameCol(),
    { key: "games", label: "出賽", align: "right", tabular: true, accessor: (r) => r.hitting?.games ?? 0 },
    { key: "avg", label: "AVG", align: "right", tabular: true, accessor: (r) => r.hitting?.avg ?? 0, render: (r) => formatAvg(r.hitting?.avg) },
    { key: "hr", label: "HR", align: "right", tabular: true, accessor: (r) => r.hitting?.homeRuns ?? 0 },
    { key: "rbi", label: "RBI", align: "right", tabular: true, accessor: (r) => r.hitting?.rbi ?? 0 },
    { key: "runs", label: "得分", align: "right", tabular: true, accessor: (r) => r.hitting?.runs ?? 0 },
    { key: "hits", label: "安打", align: "right", tabular: true, accessor: (r) => r.hitting?.hits ?? 0 },
    { key: "sb", label: "盜壘", align: "right", tabular: true, accessor: (r) => r.hitting?.stolenBases ?? 0 },
    { key: "bb", label: "保送", align: "right", tabular: true, accessor: (r) => r.hitting?.walks ?? 0 },
    { key: "ops", label: "OPS", align: "right", tabular: true, accessor: (r) => r.hitting?.ops ?? 0, render: (r) => formatAvg(r.hitting?.ops) },
  ];

  const pitchingColumns: Column<PlayerStatLine>[] = [
    nameCol((r) => (r.pitching?.gamesStarted && r.pitching.gamesStarted > 0 ? "先發" : "後援")),
    { key: "w", label: "勝-敗", align: "right", tabular: true, accessor: (r) => (r.pitching?.wins ?? 0) * 1000 + (r.pitching?.losses ?? 0), render: (r) => `${r.pitching?.wins ?? 0}-${r.pitching?.losses ?? 0}` },
    { key: "era", label: "ERA", align: "right", tabular: true, accessor: (r) => r.pitching?.era ?? 999, render: (r) => formatEra(r.pitching?.era) },
    { key: "whip", label: "WHIP", align: "right", tabular: true, accessor: (r) => r.pitching?.whip ?? 999, render: (r) => formatTwo(r.pitching?.whip) },
    { key: "g", label: "出賽", align: "right", tabular: true, accessor: (r) => r.pitching?.games ?? 0 },
    { key: "gs", label: "先發", align: "right", tabular: true, accessor: (r) => r.pitching?.gamesStarted ?? 0 },
    { key: "ip", label: "局數", align: "right", tabular: true, accessor: (r) => ipToDecimal(r.pitching?.inningsPitched), render: (r) => formatIp(r.pitching?.inningsPitched) },
    { key: "k", label: "三振", align: "right", tabular: true, accessor: (r) => r.pitching?.strikeouts ?? 0 },
    { key: "bb", label: "保送", align: "right", tabular: true, accessor: (r) => r.pitching?.walks ?? 0 },
    { key: "sv", label: "救援", align: "right", tabular: true, accessor: (r) => r.pitching?.saves ?? 0 },
    { key: "k9", label: "K/9", align: "right", tabular: true, accessor: (r) => r.pitching?.kPer9 ?? 0, render: (r) => formatTwo(r.pitching?.kPer9) },
  ];

  const filteredHitters = useMemo(() => {
    const groups = POS_GROUPS[posFilter];
    if (!groups || groups.length === 0) return hitters;
    return hitters.filter((h) => groups.includes(h.position));
  }, [hitters, posFilter]);

  const filteredPitchers = useMemo(() => {
    if (posFilter === "先發") return pitchers.filter((p) => (p.pitching?.gamesStarted ?? 0) > 0);
    if (posFilter === "後援") return pitchers.filter((p) => (p.pitching?.gamesStarted ?? 0) === 0 && (p.pitching?.games ?? 0) > 0);
    return pitchers;
  }, [pitchers, posFilter]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "hitting", label: "打擊", count: hitters.length },
    { key: "pitching", label: "投手", count: pitchers.length },
  ];

  const filters = tab === "pitching" ? ["全部", "先發", "後援"] : Object.keys(POS_GROUPS);

  return (
    <div className="space-y-4">
      {/* 分頁 */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPosFilter("全部"); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-[#14225A] text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${tab === t.key ? "text-white/70" : "text-zinc-400"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 位置篩選 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400">篩選：</span>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setPosFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              posFilter === f
                ? "bg-[#AB0003] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 表格 */}
      {tab === "hitting" && (
        <DataTable
          columns={hittingColumns}
          rows={filteredHitters}
          defaultSortKey="avg"
          rowLink={playerLink}
        />
      )}
      {tab === "pitching" && (
        <DataTable
          columns={pitchingColumns}
          rows={filteredPitchers}
          defaultSortKey="era"
          defaultSortDir="asc"
          rowLink={playerLink}
        />
      )}
    </div>
  );
}
