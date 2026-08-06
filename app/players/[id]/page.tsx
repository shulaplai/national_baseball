import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlayerStats, getPlayerInfo, playerHeadshotUrl } from "@/lib/mlb";
import { formatAvg, formatDate, formatEra, formatIp, formatTwo } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "球員資料",
};

// 動態路由：params 係 runtime 數據，用 Suspense 包住等 shell 可以 prerender
export default function PlayerPage({ params }: PageProps<"/players/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-zinc-400">載入中...</p>}>
      <PlayerContent params={params} />
    </Suspense>
  );
}

async function PlayerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const personId = Number(id);
  const [player, info] = await Promise.all([
    getPlayerStats(personId),
    getPlayerInfo(personId),
  ]);
  if (!player) notFound();

  const h = player.hitting;
  const p = player.pitching;
  const f = player.fielding;

  const bats = info?.batSide === "L" ? "左" : info?.batSide === "R" ? "右" : info?.batSide === "S" ? "兩" : null;
  const throws = info?.pitchHand === "L" ? "左" : info?.pitchHand === "R" ? "右" : null;

  return (
    <div className="space-y-5">
      <Link href="/players" className="text-sm text-[#AB0003] hover:underline">
        ← 返回球員成績
      </Link>

      <section className="rounded-2xl bg-[#14225A] p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center gap-6">
          <Image
            src={playerHeadshotUrl(personId)}
            alt={player.name}
            width={140}
            height={140}
            className="h-28 w-28 rounded-full border-4 border-white/20 object-cover"
            priority
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black">{player.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/70">
              <span className="rounded bg-[#AB0003] px-2 py-0.5 font-bold text-white">
                {player.position}
              </span>
              <span>華盛頓國民隊 · 2026 球季</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
              {info?.currentAge != null && <span>年齡 {info.currentAge}</span>}
              {info?.height && <span>身高 {info.height}</span>}
              {info?.weight && <span>體重 {info.weight} lb</span>}
              {bats && <span>打 {bats}</span>}
              {throws && <span>投 {throws}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/60">
              {info?.mlbDebutDate && <span>MLB 出道：{formatDate(info.mlbDebutDate)}</span>}
              {info?.draftYear && <span>選秀年：{info.draftYear}</span>}
              {info?.birthDate && <span>生日：{formatDate(info.birthDate)}</span>}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {h && (
          <Card title="打擊成績">
            <div className="grid grid-cols-3 gap-y-4 sm:grid-cols-4">
              <StatBox label="AVG" value={formatAvg(h.avg)} />
              <StatBox label="OBP" value={formatAvg(h.obp)} />
              <StatBox label="SLG" value={formatAvg(h.slg)} />
              <StatBox label="OPS" value={formatAvg(h.ops)} />
              <StatBox label="出賽" value={String(h.games)} />
              <StatBox label="打席" value={String(h.plateAppearances)} />
              <StatBox label="打數" value={String(h.atBats)} />
              <StatBox label="安打" value={String(h.hits)} />
              <StatBox label="全壘打" value={String(h.homeRuns)} />
              <StatBox label="打點" value={String(h.rbi)} />
              <StatBox label="得分" value={String(h.runs)} />
              <StatBox label="盜壘" value={String(h.stolenBases)} />
              <StatBox label="二壘打" value={String(h.doubles)} />
              <StatBox label="三壘打" value={String(h.triples)} />
              <StatBox label="保送" value={String(h.walks)} />
              <StatBox label="三振" value={String(h.strikeouts)} />
            </div>
          </Card>
        )}

        {p && (
          <Card title="投手成績">
            <div className="grid grid-cols-3 gap-y-4 sm:grid-cols-4">
              <StatBox label="ERA" value={formatEra(p.era)} />
              <StatBox label="WHIP" value={formatTwo(p.whip)} />
              <StatBox label="勝-敗" value={`${p.wins}-${p.losses}`} />
              <StatBox label="出賽" value={String(p.games)} />
              <StatBox label="先發" value={String(p.gamesStarted)} />
              <StatBox label="局數" value={formatIp(p.inningsPitched)} />
              <StatBox label="三振" value={String(p.strikeouts)} />
              <StatBox label="保送" value={String(p.walks)} />
              <StatBox label="救援" value={String(p.saves)} />
              <StatBox label="中繼" value={String(p.holds)} />
              <StatBox label="K/9" value={formatTwo(p.kPer9)} />
              <StatBox label="BB/9" value={formatTwo(p.bbPer9)} />
            </div>
          </Card>
        )}

        {f && (
          <Card title="守備成績" className={h && p ? "md:col-span-2" : ""}>
            <div className="grid grid-cols-3 gap-y-4 sm:grid-cols-6">
              <StatBox label="出賽" value={String(f.games)} />
              <StatBox label="守備率" value={formatAvg(f.fielding)} />
              <StatBox label="刺殺" value={String(f.putOuts)} />
              <StatBox label="助殺" value={String(f.assists)} />
              <StatBox label="失誤" value={String(f.errors)} />
              <StatBox label="雙殺" value={String(f.doublePlays)} />
            </div>
          </Card>
        )}

        {!h && !p && (
          <Card title="冇數據">
            <p className="text-sm text-zinc-500">呢位球員今季暫時冇打擊或投手數據。</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
