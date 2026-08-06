// 分析計算模組 — 全部係純函數（無 IO），可以用 tsx 直接測試。
// 用種子化 PRNG（mulberry32）令 Monte Carlo 模擬係決定性：同一份數據
// 一定出同一結果，唔受 prerender 影響。

import type { Game, StandingRow } from "./types";

// ---------------------------------------------------------------------------
// Pythagorean expectation
// ---------------------------------------------------------------------------

/** 預計勝率：RS^x / (RS^x + RA^x)，x = 1.83（MLB 常用） */
export function pythagorean(rs: number, ra: number, x = 1.83): number {
  if (rs <= 0) return 0;
  const prs = Math.pow(rs, x);
  const pra = Math.pow(ra, x);
  return prs / (prs + pra);
}

// ---------------------------------------------------------------------------
// 餘下賽季預測
// ---------------------------------------------------------------------------

export type TeamProj = {
  teamId: number;
  name: string;
  divisionName: string;
  wins: number;
  losses: number;
  remaining: number;
  /** 餘下每場預計勝率 */
  pRos: number;
};

/** 每隊餘下賽季勝率預測 */
export function projectRestOfSeason(teams: StandingRow[]): TeamProj[] {
  return teams.map((t) => {
    const games = t.wins + t.losses;
    const remaining = Math.max(0, 162 - games);
    const pyth = pythagorean(t.runsScored, t.runsAllowed);
    const current = games > 0 ? t.wins / games : 0.5;
    // 0.7 × 能力（Pythag）+ 0.3 × 現有戰績
    let pRos = 0.7 * pyth + 0.3 * current;
    // 收縮去 .500：剩餘場次越少，加權越多（sample size 愈細愈保守）
    const shrinkWeight = Math.min(0.5, remaining / 40);
    pRos = pRos * (1 - shrinkWeight) + 0.5 * shrinkWeight;
    return { teamId: t.teamId, name: t.name, divisionName: t.divisionName, wins: t.wins, losses: t.losses, remaining, pRos };
  });
}

// ---------------------------------------------------------------------------
// 季後賽機率 — Monte Carlo 模擬
// ---------------------------------------------------------------------------

/** 種子化 PRNG（mulberry32），保證模擬決定性 */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PlayoffSimResult = {
  divisionPct: number;
  wildCardPct: number;
  playoffPct: number;
  projectedWins: number;
  winsStd: number;
  projTable: { teamId: number; name: string; projectedWins: number; playoffPct: number }[];
};

/**
 * Monte Carlo 季後賽機率模擬。
 * 模型：每隊餘下賽事用 normal approximation 模擬勝場，
 * 每分區最高勝者 = 分區冠軍，餘下 15 隊前 3 = 外卡。
 * 對球迷網站足夠準確；要更精細可以日後加 matchup-aware 模型。
 */
export function simulatePlayoffOdds(
  projs: TeamProj[],
  natsId = 120,
  nSims = 10000
): PlayoffSimResult {
  const rand = mulberry32(20260806);
  const divisions = new Map<string, number[]>();
  for (const p of projs) {
    const list = divisions.get(p.divisionName) ?? [];
    list.push(p.teamId);
    divisions.set(p.divisionName, list);
  }

  // per-team 累計
  const winSums = new Map<number, number>();
  const winSqSums = new Map<number, number>();
  const playoffCounts = new Map<number, number>();
  let natsDiv = 0;
  let natsWC = 0;

  for (let sim = 0; sim < nSims; sim++) {
    const finalWins = new Map<number, number>();
    for (const p of projs) {
      const mean = p.wins + p.pRos * p.remaining;
      const sd = Math.sqrt(p.remaining * p.pRos * (1 - p.pRos));
      // Box-Muller 產生 normal
      let u1 = rand();
      if (u1 < 1e-12) u1 = 1e-12;
      const u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      finalWins.set(p.teamId, Math.max(0, Math.round(mean + sd * z)));
    }

    // 分區冠軍
    const divWinners = new Set<number>();
    for (const ids of divisions.values()) {
      let best = ids[0];
      for (const id of ids) {
        if ((finalWins.get(id) ?? 0) > (finalWins.get(best) ?? 0)) best = id;
      }
      divWinners.add(best);
    }

    // 外卡：非分區冠軍，勝場前 3
    const wcCandidates = projs
      .filter((p) => !divWinners.has(p.teamId))
      .sort((a, b) => (finalWins.get(b.teamId) ?? 0) - (finalWins.get(a.teamId) ?? 0));
    const wcWinners = wcCandidates.slice(0, 3).map((p) => p.teamId);

    // 統計
    for (const p of projs) {
      const fw = finalWins.get(p.teamId) ?? 0;
      winSums.set(p.teamId, (winSums.get(p.teamId) ?? 0) + fw);
      winSqSums.set(p.teamId, (winSqSums.get(p.teamId) ?? 0) + fw * fw);
      if (divWinners.has(p.teamId) || wcWinners.includes(p.teamId)) {
        playoffCounts.set(p.teamId, (playoffCounts.get(p.teamId) ?? 0) + 1);
      }
    }
    if (divWinners.has(natsId)) natsDiv++;
    else if (wcWinners.includes(natsId)) natsWC++;
  }

  const projTable = projs.map((p) => {
    const mean = (winSums.get(p.teamId) ?? 0) / nSims;
    return {
      teamId: p.teamId,
      name: p.name,
      projectedWins: Math.round(mean * 10) / 10,
      playoffPct: (playoffCounts.get(p.teamId) ?? 0) / nSims,
    };
  });

  const nwMean = (winSums.get(natsId) ?? 0) / nSims;
  const nwSqMean = (winSqSums.get(natsId) ?? 0) / nSims;
  const winsStd = Math.sqrt(Math.max(0, nwSqMean - nwMean * nwMean));

  return {
    divisionPct: natsDiv / nSims,
    wildCardPct: natsWC / nSims,
    playoffPct: (natsDiv + natsWC) / nSims,
    projectedWins: Math.round(nwMean * 10) / 10,
    winsStd: Math.round(winsStd * 10) / 10,
    projTable: projTable.sort((a, b) => b.projectedWins - a.projectedWins),
  };
}

// ---------------------------------------------------------------------------
// 魔術數字 / 淘汰數字（官方值優先，呢度做 fallback）
// ---------------------------------------------------------------------------

/** 魔術數字：龍頭仲要（贏幾多場 + 對手輸幾多場）先攞到第一 */
export function magicNumber(leaderWins: number, leaderGamesLeft: number, teamWins: number): number {
  return leaderWins + leaderGamesLeft - teamWins + 1;
}

/** 淘汰數字：隊再輸幾多（+ 龍頭贏幾多）就確定出局 */
export function eliminationNumber(teamWins: number, teamGamesLeft: number, leaderWins: number): number {
  return teamWins + teamGamesLeft - leaderWins + 1;
}

// ---------------------------------------------------------------------------
// 剩餘賽程難度（SOS）
// ---------------------------------------------------------------------------

export type ScheduleDifficulty = {
  avgOppWpct: number;
  vsAbove500: number;
  totalGames: number;
  gamesByOpp: { oppId: number; oppName: string; games: number; oppWpct: number }[];
};

/** 剩餘賽程難度：餘下對手平均勝率、對 >.500 隊數 */
export function scheduleDifficulty(
  remainingGames: Game[],
  standingsByTeam: Map<number, StandingRow>
): ScheduleDifficulty {
  const oppMap = new Map<number, { games: number; wpct: number }>();
  let total = 0;
  let sum = 0;
  let vsAbove500 = 0;
  for (const g of remainingGames) {
    const opp = g.isNatsHome ? g.awayTeamId : g.homeTeamId;
    const s = standingsByTeam.get(opp);
    if (!s) continue;
    const wpct = s.winningPercentage;
    total++;
    sum += wpct;
    const entry = oppMap.get(opp) ?? { games: 0, wpct };
    entry.games++;
    entry.wpct = wpct;
    oppMap.set(opp, entry);
    if (wpct > 0.5) vsAbove500++;
  }
  return {
    avgOppWpct: total ? sum / total : 0,
    vsAbove500,
    totalGames: total,
    gamesByOpp: Array.from(oppMap.entries())
      .map(([oppId, v]) => ({ oppId, oppName: standingsByTeam.get(oppId)?.name ?? "—", games: v.games, oppWpct: v.wpct }))
      .sort((a, b) => b.games - a.games),
  };
}
