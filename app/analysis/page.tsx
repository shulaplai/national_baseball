import type { Metadata } from "next";
import Link from "next/link";
import { getStandings, getSeasonSchedule } from "@/lib/mlb";
import {
  projectRestOfSeason,
  simulatePlayoffOdds,
  scheduleDifficulty,
  magicNumber,
} from "@/lib/analysis";
import { Card } from "@/components/ui/Card";
import { OddsBar } from "@/components/analysis/OddsBar";
import { NATIONALS_ID } from "@/lib/constants";

export const metadata: Metadata = {
  title: "分析",
  description: "華盛頓國民隊季後賽機率、魔術數字、剩餘賽程難度分析",
};

export default async function AnalysisPage() {
  const [standings, sched] = await Promise.all([getStandings(), getSeasonSchedule()]);

  const nats = standings.find((t) => t.teamId === NATIONALS_ID) ?? standings[0];
  const standMap = new Map(standings.map((t) => [t.teamId, t]));

  // 季後賽模擬
  const projs = projectRestOfSeason(standings);
  const sim = simulatePlayoffOdds(projs, NATIONALS_ID, 10000);

  // 賽程難度
  const sos = scheduleDifficulty(sched.remainingGames, standMap);

  // 外卡形勢（NL 全部隊，按外卡距離）
  const nlTeams = standings.filter((t) => t.divisionName !== "—");
  const wcSorted = [...nlTeams]
    .filter((t) => t.wildCardGamesBack != null)
    .sort((a, b) => (a.wildCardGamesBack ?? 999) - (b.wildCardGamesBack ?? 999));

  // 分區龍頭（魔術數字用）
  const eastLeader = standings.find(
    (t) => t.divisionName.includes("East") && t.divisionRank === 1
  )!;
  const leaderRemaining = 162 - eastLeader.wins - eastLeader.losses;
  const divMagic = eastLeader.magicNumber ?? magicNumber(eastLeader.wins, leaderRemaining, nats.wins);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">分析</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          季後賽形勢（Monte Carlo 模擬 10,000 次）· 數據每日更新
        </p>
      </div>

      {/* 季後賽機率 hero */}
      <section className="rounded-2xl bg-[#14225A] p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm text-white/70">季後賽機率</p>
            <p className="mt-1 text-5xl font-black tabular-nums">
              {(sim.playoffPct * 100).toFixed(1)}
              <span className="text-2xl">%</span>
            </p>
            <p className="mt-2 text-sm text-white/70">
              預計最終成績：<span className="font-bold text-white">{sim.projectedWins} 勝</span>
              <span className="ml-1 text-white/50">±{sim.winsStd}</span>
            </p>
          </div>
          <div className="grid w-full gap-4 sm:w-auto sm:min-w-[300px]">
            <OddsBar pct={sim.divisionPct} label="分區冠軍" color="bg-sky-400" />
            <OddsBar pct={sim.wildCardPct} label="外卡" color="bg-emerald-400" />
            <OddsBar pct={sim.playoffPct} label="總季後賽機率" color="bg-red-500" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 外卡形勢 */}
        <Card title="外卡形勢" subtitle="NL · 前 3 位入季後賽">
          <ul className="space-y-1">
            {wcSorted.map((t, i) => (
              <li
                key={t.teamId}
                className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm ${
                  t.teamId === NATIONALS_ID
                    ? "bg-[#14225A]/10 font-semibold text-[#AB0003] dark:bg-[#14225A]/30"
                    : i < 3
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : ""
                }`}
              >
                <span className="w-6 text-right tabular-nums text-zinc-400">{i + 1}</span>
                <span className="flex-1 truncate">{t.name}</span>
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                  {t.wins}-{t.losses}
                </span>
                <span className="w-12 text-right tabular-nums">
                  {t.wildCardGamesBack == null ? "—" : t.wildCardGamesBack === 0 ? "0" : `${t.wildCardGamesBack}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-400">
            國民隊外卡距離：<span className="font-bold text-[#AB0003]">{nats.wildCardGamesBack ?? "—"} 場</span>
            {nats.wildCardEliminationNumber != null && (
              <span> · 淘汰數字 {nats.wildCardEliminationNumber}</span>
            )}
          </p>
        </Card>

        {/* 魔術數字 + 賽程難度 */}
        <div className="space-y-6">
          <Card title="魔術數字 / 淘汰數字">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/60">
                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                  {eastLeader.name} 封王魔術數字
                </span>
                <span className="text-2xl font-black tabular-nums">{divMagic}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/60">
                <span className="text-sm text-zinc-600 dark:text-zinc-300">國民隊外卡淘汰數字</span>
                <span className="text-2xl font-black tabular-nums">
                  {nats.wildCardEliminationNumber ?? "—"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                魔術數字 = 龍頭每贏 1 場（或你每輸 1 場）就減 1，到 0 就封王。
                淘汰數字同理，到 0 就出局。
              </p>
            </div>
          </Card>

          <Card title="剩餘賽程難度">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">餘下對手平均勝率</span>
                <span className="text-2xl font-black tabular-nums">
                  {(sos.avgOppWpct * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">對 {">"}.500 隊</span>
                <span className="text-2xl font-black tabular-nums">
                  {sos.vsAbove500}<span className="text-sm text-zinc-400">/{sos.totalGames} 場</span>
                </span>
              </div>
              <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  對陣最多嘅對手
                </p>
                <ul className="space-y-1">
                  {sos.gamesByOpp.slice(0, 4).map((g) => (
                    <li key={g.oppId} className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-300">{g.oppName}</span>
                      <span className="tabular-nums text-zinc-400">
                        ×{g.games} · 勝率 {(g.oppWpct * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 15 隊機率表 */}
      <Card title="NL 15 隊季後賽機率" subtitle="Monte Carlo 模擬 10,000 次">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="py-2 pr-4 font-medium">排名</th>
                <th className="py-2 pr-4 font-medium">球隊</th>
                <th className="py-2 pr-4 text-right font-medium">分區</th>
                <th className="py-2 pr-4 text-right font-medium">預計勝場</th>
                <th className="py-2 text-right font-medium">季後賽機率</th>
              </tr>
            </thead>
            <tbody>
              {sim.projTable.map((t, i) => (
                <tr
                  key={t.teamId}
                  className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                    t.teamId === NATIONALS_ID ? "bg-[#14225A]/5 dark:bg-[#14225A]/20" : ""
                  }`}
                >
                  <td className="py-2 pr-4 tabular-nums text-zinc-400">{i + 1}</td>
                  <td className="py-2 pr-4">
                    <span className={t.teamId === NATIONALS_ID ? "font-bold text-[#AB0003]" : ""}>
                      {t.name}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right text-xs text-zinc-400">
                    {standMap.get(t.teamId)?.divisionName.replace("National League ", "")}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{t.projectedWins}</td>
                  <td className="py-2 text-right">
                    <span className="inline-block w-40">
                      <span className="float-right text-sm font-bold tabular-nums">
                        {(t.playoffPct * 100).toFixed(0)}%
                      </span>
                      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span
                          className={`block h-full rounded-full ${t.playoffPct > 0.5 ? "bg-emerald-500" : t.playoffPct > 0.1 ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                          style={{ width: `${Math.max(2, Math.round(t.playoffPct * 100))}%` }}
                        />
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          模型用 Pythagorean expectation 預測每隊餘下勝率，模擬 10,000 次。
          <Link href="/analysis/longterm" className="ml-1 text-[#AB0003] hover:underline">
            睇長期（3-5 年）分析 →
          </Link>
        </p>
      </Card>

      {/* 短期總結 */}
      <Card title="短期總結（截至 2026-08-06）">
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          國民隊以 <strong>56-60</strong>（勝率 .483）位列國聯東區第 4，距離外卡席位{" "}
          <strong>{nats.wildCardGamesBack} 場</strong>。雖然擁有全聯盟最強打線之一（得分、全壘打均排第一），
          但投手自責分率 <strong>4.75（第 27 位）</strong>拖累戰績，得失分差僅 +14。
          模擬顯示季後賽機率約 <strong>{(sim.playoffPct * 100).toFixed(1)}%</strong>，預計以{" "}
          <strong>{sim.projectedWins} 勝</strong>結束球季。餘下 46 場賽程難度中等
          （對手平均勝率 {Math.round(sos.avgOppWpct * 1000) / 10}%），
          要入季後賽需要打者保持火熱，同時寄望投手群大幅回勇。
        </p>
      </Card>
    </div>
  );
}
