/**
 * 數據層驗證腳本 — 印出各函數返回嘅關鍵數據，對照已實測數值。
 *
 * 用法： npx tsx scripts/verify-api.ts
 *
 * 注意：'use cache' 喺 Next.js runtime 先有作用；呢度用 tsx 跑，只驗證
 *       fetch + normalization 邏輯正確。cacheLife/cacheTag 喺非 Next
 *       環境會被 ignore（唔影響數據正確性）。
 */
import {
  fetchStandings,
  fetchSeasonSchedule,
  fetchRoster,
  fetchTeamHitting,
  fetchTeamPitching,
  fetchTeamHittingRanks,
  fetchTeamPitchingRanks,
} from "../lib/mlb";
import { formatAvg, formatEra } from "../lib/formatters";

async function main() {
  console.log("=== 1. 國民隊排名 ===");
  const standings = await fetchStandings();
  const nats = standings.find((t) => t.name === "Nationals") ?? standings[0];
  console.log(
    `${nats.name}: ${nats.wins}W-${nats.losses}L, division rank ${nats.divisionRank}, GB ${nats.gamesBack}, WCGB ${nats.wildCardGamesBack}, RS/RA ${nats.runsScored}/${nats.runsAllowed}`
  );
  console.log(`   NL 隊數: ${standings.length}`);
  const divisionLeader = standings.filter((t) => t.divisionRank === 1);
  console.log(
    `   分區龍頭: ${divisionLeader.map((t) => `${t.name} (${t.wins}W)`).join(", ")}`
  );

  console.log("\n=== 2. 賽程 ===");
  const sched = await fetchSeasonSchedule();
  console.log(
    `已完場: ${sched.playedGames} 場, ${sched.wins}W-${sched.losses}L, 剩餘 ${sched.remainingCount} 場`
  );
  console.log(`近 10 場: ${sched.lastTen.join("")}`);
  console.log(
    `連勝/敗: ${sched.streak.type ?? "-"} ${sched.streak.number}, 主場 ${sched.homeRecord.w}-${sched.homeRecord.l}, 作客 ${sched.awayRecord.w}-${sched.awayRecord.l}`
  );
  if (sched.nextGame) {
    console.log(
      `下場: ${sched.nextGame.awayTeamName} @ ${sched.nextGame.homeTeamName} (${sched.nextGame.date})`
    );
  }
  const nlEastOpps = standings
    .filter((t) => t.divisionName.includes("East") && t.teamId !== nats.teamId)
    .map((t) => {
      const h2h = sched.headToHead[t.teamId];
      return `${t.name}: ${h2h ? `${h2h.w}W-${h2h.l}L` : "未對過"}`;
    });
  console.log(`對 NL East: ${nlEastOpps.join(" | ")}`);

  console.log("\n=== 3. 名單 ===");
  const roster = await fetchRoster();
  console.log(`名單人數: ${roster.length}`);
  const posCount: Record<string, number> = {};
  for (const r of roster) posCount[r.position] = (posCount[r.position] ?? 0) + 1;
  console.log(`位置分佈: ${JSON.stringify(posCount)}`);

  console.log("\n=== 4. 打擊成績 ===");
  const hitters = await fetchTeamHitting();
  console.log(`打者數: ${hitters.length}`);
  const sortedByAvg = [...hitters].sort((a, b) => (b.hitting?.avg ?? 0) - (a.hitting?.avg ?? 0));
  const top5 = sortedByAvg.slice(0, 5);
  for (const h of top5) {
    const st = h.hitting!;
    console.log(
      `${h.name} (${h.position}): AVG ${formatAvg(st.avg)}, HR ${st.homeRuns}, RBI ${st.rbi}, OPS ${formatAvg(st.ops)}`
    );
  }

  console.log("\n=== 5. 投手成績 ===");
  const pitchers = await fetchTeamPitching();
  console.log(`投手數: ${pitchers.length}`);
  const sortedEra = [...pitchers]
    .filter((p) => (p.pitching?.games ?? 0) > 5) // 至少出賽 5 場
    .sort((a, b) => (a.pitching?.era ?? 999) - (b.pitching?.era ?? 999));
  const top5p = sortedEra.slice(0, 5);
  for (const p of top5p) {
    const st = p.pitching!;
    console.log(
      `${p.name}: ERA ${formatEra(st.era)}, IP ${st.inningsPitched}, W-L ${st.wins}-${st.losses}, K ${st.strikeouts}`
    );
  }

  console.log("\n=== 6. 團隊攻守排名 ===");
  const hitRanks = await fetchTeamHittingRanks();
  for (const r of hitRanks) {
    const v = typeof r.value === "number" && r.value < 1 ? formatAvg(r.value) : r.value;
    console.log(`打擊 ${r.name}: #${r.rank}/30 (${v})`);
  }
  const pitchRanks = await fetchTeamPitchingRanks();
  for (const r of pitchRanks) {
    const v = typeof r.value === "number" && r.value < 1 ? formatEra(r.value) : r.value;
    console.log(`投手 ${r.name}: #${r.rank}/30 (${v})`);
  }

  console.log("\n✅ 驗證完成");
}

main().catch((err) => {
  console.error("❌ 驗證失敗:", err);
  process.exit(1);
});
