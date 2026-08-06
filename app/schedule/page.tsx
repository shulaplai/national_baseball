import type { Metadata } from "next";
import { getSeasonSchedule, getStandings } from "@/lib/mlb";
import { Card } from "@/components/ui/Card";
import { FormDots } from "@/components/schedule/FormDots";
import { GameRow } from "@/components/schedule/GameRow";
import { NATIONALS_ID } from "@/lib/constants";

export const metadata: Metadata = {
  title: "賽況",
  description: "華盛頓國民隊 2026 球季完整賽程、近況、主客場與對戰紀錄",
};

export default async function SchedulePage() {
  const [sched, standings] = await Promise.all([getSeasonSchedule(), getStandings()]);

  // 隊名 map（含所有對過嘅隊）
  const teamNames = new Map<number, string>();
  for (const g of sched.games) {
    teamNames.set(g.homeTeamId, g.homeTeamName);
    teamNames.set(g.awayTeamId, g.awayTeamName);
  }
  for (const s of standings) teamNames.set(s.teamId, s.name);

  // 對戰紀錄（只顯示 NL East + 對過 >= 5 場嘅隊）
  const h2hEntries = Object.entries(sched.headToHead)
    .map(([id, rec]) => ({
      teamId: Number(id),
      name: teamNames.get(Number(id)) ?? "—",
      w: rec.w,
      l: rec.l,
      isNLEast: standings.some((s) => s.teamId === Number(id) && s.divisionName.includes("East")),
    }))
    .filter((e) => e.isNLEast || e.w + e.l >= 5)
    .sort((a, b) => b.w + b.l - (a.w + a.l));

  // 完整賽程，按月份分組（只例行賽）
  const regularSeason = sched.games.filter((g) => g.gameType === "R");
  const byMonth = new Map<string, typeof regularSeason>();
  for (const g of regularSeason) {
    const month = g.date.slice(0, 7); // "2026-08"
    const list = byMonth.get(month) ?? [];
    list.push(g);
    byMonth.set(month, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">賽況</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          2026 球季 · {sched.playedGames} 場已完，剩餘 {sched.remainingCount} 場
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 近況 */}
        <Card title="近況" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">近 10 場</span>
              <FormDots results={sched.lastTen} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">連{sched.streak.type === "W" ? "勝" : "敗"}</span>
              <span className="text-lg font-bold tabular-nums">
                {sched.streak.type ? sched.streak.number : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">主場</span>
              <span className="text-lg font-bold tabular-nums">
                {sched.homeRecord.w}-{sched.homeRecord.l}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">作客</span>
              <span className="text-lg font-bold tabular-nums">
                {sched.awayRecord.w}-{sched.awayRecord.l}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">總戰績</span>
              <span className="text-lg font-bold tabular-nums">
                {sched.wins}-{sched.losses}
              </span>
            </div>
          </div>
        </Card>

        {/* 對戰紀錄 */}
        <Card title="對戰紀錄" subtitle="對各隊本季成績" className="lg:col-span-2">
          <ul className="grid gap-2 sm:grid-cols-2">
            {h2hEntries.map((e) => (
              <li key={e.teamId} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                <span className="flex items-center gap-2 text-sm">
                  {e.name}
                  {e.teamId === NATIONALS_ID && <span className="text-[10px] text-zinc-400">（我哋）</span>}
                </span>
                <span className={`text-sm font-bold tabular-nums ${e.w > e.l ? "text-emerald-600 dark:text-emerald-400" : e.w < e.l ? "text-red-500" : ""}`}>
                  {e.w}-{e.l}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-400">顯示國聯東區同對陣 5 場以上嘅對手</p>
        </Card>
      </div>

      {/* 完整賽程 */}
      <Card title="完整賽程" subtitle="2026 例行賽">
        {Array.from(byMonth.entries()).map(([month, games]) => (
          <div key={month} className="mb-6 last:mb-0">
            <h3 className="mb-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">
              {new Date(`${month}-01T12:00:00`).toLocaleDateString("zh-Hant", { year: "numeric", month: "long" })}
            </h3>
            <div>
              {games.map((g) => (
                <GameRow key={g.gamePk} game={g} />
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
