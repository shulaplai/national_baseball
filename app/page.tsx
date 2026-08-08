import Link from "next/link";
import { Suspense } from "react";
import { getStandings, getSeasonSchedule, getTeamHittingRanks, getTeamPitchingRanks, getTeamInfo } from "@/lib/mlb";
import { formatDate, formatShortDate, formatWinningPct, formatAvg, formatEra } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FormDots } from "@/components/schedule/FormDots";
import { WinTrendChart, type WinTrendPoint } from "@/components/charts/WinTrendChart";
import { NewsList } from "@/components/news/NewsList";
import { projectRestOfSeason, simulatePlayoffOdds, magicNumber } from "@/lib/analysis";
import { NATIONALS_ID } from "@/lib/constants";

// 數據刷新時機由 lib/mlb.ts 嘅 cacheLife 控制（Cache Components 模式）
export default async function HomePage() {
  const [team, standings, sched, hitRanks, pitchRanks] = await Promise.all([
    getTeamInfo(),
    getStandings(),
    getSeasonSchedule(),
    getTeamHittingRanks(),
    getTeamPitchingRanks(),
  ]);

  const nats = standings.find((t) => t.teamId === NATIONALS_ID) ?? standings[0];
  const nlEast = standings
    .filter((t) => t.divisionName.includes("East"))
    .sort((a, b) => a.divisionRank - b.divisionRank);

  // 累積勝場趨勢（只計例行賽已完場）
  const finished = sched.games.filter((g) => g.gameType === "R" && g.status === "Final");
  const trend: WinTrendPoint[] = [];
  let w = 0;
  let l = 0;
  for (const g of finished) {
    if (g.natsWon) w++;
    else l++;
    trend.push({ label: formatShortDate(g.date), wins: w, losses: l });
  }

  const winningPct = nats.wins + nats.losses > 0 ? nats.wins / (nats.wins + nats.losses) : 0;
  const nextGame = sched.nextGame;

  // 季後賽機率模擬 + 魔術數字（同分析頁同一套計算）
  const sim = simulatePlayoffOdds(projectRestOfSeason(standings), NATIONALS_ID, 10000);
  const eastLeader = standings.find(
    (t) => t.divisionName.includes("East") && t.divisionRank === 1
  );
  const leaderRemaining = eastLeader ? 162 - eastLeader.wins - eastLeader.losses : 0;
  const divMagic = eastLeader
    ? (eastLeader.magicNumber ?? magicNumber(eastLeader.wins, leaderRemaining, nats.wins))
    : null;

  // 最新戰果日期（最後一場已完賽）
  const lastFinal =
    finished.length > 0 ? [...finished].sort((a, b) => b.date.localeCompare(a.date))[0] : null;

  return (
    <div className="space-y-6">
      {/* Hero — 戰績總覽 */}
      <section className="relative overflow-hidden rounded-2xl bg-[#14225A] p-6 text-white shadow-md">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#AB0003]/30 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm text-white/70">
              2026 球季 · {team.venue}
              {lastFinal && (
                <span className="ml-2 text-white/50">
                  · 最新戰果 {formatShortDate(lastFinal.date)}
                </span>
              )}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              華盛頓國民隊 <span className="text-white/60">({team.abbreviation})</span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-white/80">
              <Badge tone="neutral">
                NL East 第 {nats.divisionRank} 位
              </Badge>
              <Badge tone={winningPct >= 0.5 ? "win" : "loss"}>
                {formatWinningPct(winningPct)} 勝率
              </Badge>
              {nats.streak.type && (
                <span>
                  連{nats.streak.type === "wins" ? "勝" : "敗"} {nats.streak.number}
                </span>
              )}
              {nats.clinched && <Badge tone="win">已鎖定季後賽</Badge>}
              <PlayoffPill pct={sim.playoffPct} />
              {nats.divisionRank === 1 && divMagic != null && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
                  封王魔術數字 {divMagic}
                </span>
              )}
              {nats.divisionRank > 1 && nats.eliminationNumber != null && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
                  分區淘汰 E{nats.eliminationNumber}
                </span>
              )}
              {nats.wildCardEliminationNumber != null && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
                  外卡淘汰 E{nats.wildCardEliminationNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-white/60">勝負</p>
              <p className="text-4xl font-black tabular-nums">
                <span className="text-emerald-400">{nats.wins}</span>
                <span className="mx-1 text-white/40">-</span>
                <span className="text-red-400">{nats.losses}</span>
              </p>
            </div>
            <div className="hidden text-center sm:block">
              <p className="text-xs uppercase tracking-widest text-white/60">勝差</p>
              <p className="text-4xl font-black tabular-nums">
                {nats.gamesBack == null ? "—" : nats.gamesBack}
              </p>
            </div>
            <div className="hidden text-center sm:block">
              <p className="text-xs uppercase tracking-widest text-white/60">外卡差</p>
              <p className="text-4xl font-black tabular-nums">
                {nats.wildCardGamesBack == null ? "—" : nats.wildCardGamesBack}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 最新消息（ESPN，掛咗都唔阻其他內容） */}
      <Suspense fallback={null}>
        <NewsList />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 下場比賽 */}
        <Card title="下場比賽" subtitle="主場為後方" className="lg:col-span-1">
          {nextGame ? (
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatDate(nextGame.date)} · {nextGame.venue}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
                <div className="text-center">
                  <p className="text-sm font-semibold">{nextGame.awayTeamName}</p>
                  <p className="text-xs text-zinc-400">作客</p>
                </div>
                <span className="text-zinc-300 dark:text-zinc-600">@</span>
                <div className="text-center">
                  <p className="text-sm font-semibold">{nextGame.homeTeamName}</p>
                  <p className="text-xs text-zinc-400">主場</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">系列賽：{nextGame.seriesSummary}</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">今季賽程已結束。</p>
          )}
        </Card>

        {/* 本季戰績明細 */}
        <Card title="本季戰績" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label="主場" value={`${sched.homeRecord.w}-${sched.homeRecord.l}`} />
            <Stat label="作客" value={`${sched.awayRecord.w}-${sched.awayRecord.l}`} />
            <Stat label="得失分" value={`${nats.runsScored}-${nats.runsAllowed}`} />
            <Stat label="得失分差" value={nats.runDifferential > 0 ? `+${nats.runDifferential}` : String(nats.runDifferential)} />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">近 10 場</span>
            <FormDots results={sched.lastTen} />
          </div>
        </Card>

        {/* 團隊攻守排名 */}
        <Card title="團隊攻守排名" subtitle="全聯盟 30 隊" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">打擊</p>
              <ul className="space-y-1.5">
                {hitRanks.slice(0, 4).map((r) => (
                  <li key={r.statKey} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-300">{r.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-zinc-400">
                        {r.value < 1 ? formatAvg(r.value) : r.value}
                      </span>
                      <RankBadge rank={r.rank} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">投手</p>
              <ul className="space-y-1.5">
                {pitchRanks.map((r) => (
                  <li key={r.statKey} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-300">{r.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-zinc-400">
                        {r.value < 1 ? formatEra(r.value) : r.value}
                      </span>
                      <RankBadge rank={r.rank} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* 勝場趨勢 */}
        <Card title="勝場趨勢" subtitle="2026 球季" className="lg:col-span-2">
          <WinTrendChart data={trend} />
        </Card>
      </div>

      {/* NL East 排名表 */}
      <Card title="國聯東區排名" subtitle="National League East">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="py-2 pr-4 font-medium">排名</th>
                <th className="py-2 pr-4 font-medium">球隊</th>
                <th className="py-2 pr-4 text-right font-medium">勝-負</th>
                <th className="py-2 pr-4 text-right font-medium">勝率</th>
                <th className="py-2 pr-4 text-right font-medium">勝差</th>
                <th className="hidden py-2 pr-4 text-right font-medium sm:table-cell">得失分差</th>
                <th className="py-2 text-right font-medium">近況</th>
              </tr>
            </thead>
            <tbody>
              {nlEast.map((t) => (
                <tr
                  key={t.teamId}
                  className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                    t.teamId === NATIONALS_ID ? "bg-[#14225A]/5 dark:bg-[#14225A]/20" : ""
                  }`}
                >
                  <td className="py-2.5 pr-4 tabular-nums">{t.divisionRank}</td>
                  <td className="py-2.5 pr-4">
                    <span className={t.teamId === NATIONALS_ID ? "font-bold text-[#AB0003]" : ""}>
                      {t.name}
                    </span>
                    {t.teamId === NATIONALS_ID && (
                      <span className="ml-2 rounded bg-[#14225A] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        我哋
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {t.wins}-{t.losses}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {formatWinningPct(t.winningPercentage)}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {t.gamesBack == null ? "—" : t.gamesBack}
                  </td>
                  <td className="hidden py-2.5 pr-4 text-right tabular-nums sm:table-cell">
                    {t.runDifferential > 0 ? `+${t.runDifferential}` : t.runDifferential}
                  </td>
                  <td className="py-2.5 text-right">
                    {t.streak.type ? (
                      <Badge tone={t.streak.type === "wins" ? "win" : "loss"}>
                        {t.streak.type === "wins" ? "W" : "L"}
                        {t.streak.number}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          <Link href="/schedule" className="text-[#AB0003] hover:underline">
            睇完整賽況 →
          </Link>
        </p>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color =
    rank <= 10 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
    : rank <= 20 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${color}`}>
      #{rank}
    </span>
  );
}

/** 季後賽機率 pill（hero 用，按機率轉色） */
function PlayoffPill({ pct }: { pct: number }) {
  const color =
    pct >= 0.5 ? "bg-emerald-500 text-white"
    : pct >= 0.1 ? "bg-amber-500 text-white"
    : "bg-zinc-500 text-white";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${color}`}>
      季後賽機率 {(pct * 100).toFixed(0)}%
    </span>
  );
}
