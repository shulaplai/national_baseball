import { cacheLife, cacheTag } from "next/cache";
import {
  CACHE_LIFE_LIVE,
  CACHE_TAG,
  MLB_API_BASE,
  NATIONALS_ID,
  NL_LEAGUE_ID,
  SEASON,
  SEASON_END,
  SEASON_START,
} from "./constants";
import { parsePercent } from "./formatters";
import type {
  Game,
  GameStatus,
  PlayerInfo,
  PlayerStatLine,
  RosterPlayer,
  StandingRow,
  TeamInfo,
} from "./types";

// ---------------------------------------------------------------------------
// MLB Stats API 原始回應型別
// ---------------------------------------------------------------------------

interface MLBTeamRecord {
  team: { id: number; name: string };
  wins: number;
  losses: number;
  winningPercentage: string | null;
  gamesBack: string | number | null;
  wildCardGamesBack: string | number | null;
  divisionRank: string | number;
  leagueRank: string | number;
  runsScored: number;
  runsAllowed: number;
  magicNumber: string | number | null;
  eliminationNumber: string | number | null;
  wildCardEliminationNumber: string | number | null;
  clinched: boolean;
  streak: { type: "wins" | "losses"; number: number };
}

interface MLBStandingsResponse {
  records: {
    division: { id: number } | null;
    standingsType: "regularSeason" | "wildCard" | string;
    teamRecords: MLBTeamRecord[];
  }[];
}

interface MLBScheduleGame {
  gamePk: number;
  officialDate: string;
  gameDate: string;
  gameType: string;
  abstractGameState: string | null;
  status: { detailedState: string; codedGameState: string };
  teams: {
    away: { team: { id: number; name: string }; score: number | null; isWinner: boolean };
    home: { team: { id: number; name: string }; score: number | null; isWinner: boolean };
  };
  venue: { name: string } | null;
  seriesSummary: { gameNumber: number; totalGames: number } | null;
  seriesGameNumber?: number;
}

interface MLBScheduleResponse {
  dates: { date: string; games: MLBScheduleGame[] }[];
}

/** MLB stat 物件——大部分係 number，百分比/比率係 string */
interface MLBStat {
  gamesPlayed?: number;
  plateAppearances?: number;
  atBats?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  stolenBases?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  gamesStarted?: number;
  wins?: number;
  losses?: number;
  saves?: number;
  holds?: number;
  avg?: string;
  obp?: string;
  slg?: string;
  ops?: string;
  era?: string;
  whip?: string;
  inningsPitched?: string;
  strikeoutsPer9Inn?: string;
  walksPer9Inn?: string;
  putOuts?: number;
  assists?: number;
  errors?: number;
  chances?: number;
  fielding?: string;
  doublePlays?: number;
}

interface MLBStatsSplit {
  stat: MLBStat;
  player: { id: number; fullName: string };
  position?: { abbreviation: string };
  team?: { id: number; name: string };
}

interface MLBStatsResponse {
  stats: { splits: MLBStatsSplit[] }[];
}

interface MLBRosterResponse {
  roster: {
    person: { id: number; fullName: string };
    position: { abbreviation: string; type: string };
    status: { description: string };
    jerseyNumber: string;
  }[];
}

interface MLBTeamsResponse {
  teams: { id: number; name: string; teamName: string; abbreviation: string; locationName: string; venue: { name: string } | null }[];
}

// 分區 id → 名稱（standings API 嘅 division 物件冇 name，要自己 map）
const DIVISION_NAMES: Record<number, string> = {
  203: "National League West",
  204: "National League East",
  205: "National League Central",
};

/** 內部 fetch helper */
async function fetchMLB<T>(path: string): Promise<T> {
  const res = await fetch(`${MLB_API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`MLB API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// 球隊資料
// ---------------------------------------------------------------------------

/** 國民隊基本資料 — GET /teams?sportId=1 */
export async function fetchTeamInfo(): Promise<TeamInfo> {
  const data = await fetchMLB<MLBTeamsResponse>(`/teams?sportId=1`);
  const t = data.teams.find((t) => t.id === NATIONALS_ID);
  if (!t) throw new Error("Nationals team not found");
  return {
    id: t.id,
    name: t.name,
    teamName: t.teamName,
    abbreviation: t.abbreviation,
    venue: t.venue?.name ?? "—",
    locationName: t.locationName ?? "Washington",
  };
}

// ---------------------------------------------------------------------------
// 排名
// ---------------------------------------------------------------------------

/** 全 NL 排名（常規賽 + 外卡，按 teamId merge）
 *  — GET /standings?leagueId=104&season=2026&standingsTypes=regularSeason,wildCard
 */
export async function fetchStandings(): Promise<StandingRow[]> {
  const data = await fetchMLB<MLBStandingsResponse>(
    `/standings?leagueId=${NL_LEAGUE_ID}&season=${SEASON}&standingsTypes=regularSeason,wildCard`
  );

  const byTeam = new Map<number, StandingRow>();
  for (const record of data.records ?? []) {
    const isWildCard = record.standingsType === "wildCard";
    for (const tr of record.teamRecords ?? []) {
      const teamId = tr.team.id;
      const prev = byTeam.get(teamId);
      const divId = record.division?.id;

      // 外卡記錄（standingsType='wildCard'）只更新外卡欄位，
      // 唔好覆寫分區/排名資料（外卡記錄嘅 division 欄位唔可靠）
      if (isWildCard) {
        const wcGb = tr.wildCardGamesBack;
        byTeam.set(teamId, {
          ...(prev ?? ({} as StandingRow)),
          teamId,
          name: prev?.name ?? tr.team.name,
          wildCardGamesBack:
            wcGb == null
              ? prev?.wildCardGamesBack ?? null
              : wcGb === "-"
                ? null
                : Number(wcGb),
          wildCardEliminationNumber:
            tr.wildCardEliminationNumber == null
              ? prev?.wildCardEliminationNumber ?? null
              : Number(tr.wildCardEliminationNumber),
        });
        continue;
      }

      const divRank = Number(tr.divisionRank) || 99;
      byTeam.set(teamId, {
        teamId,
        name: tr.team.name,
        divisionName: divId != null ? DIVISION_NAMES[divId] ?? `Division ${divId}` : "—",
        leagueRank: Number(tr.leagueRank) || 99,
        divisionRank: divRank,
        wins: tr.wins ?? 0,
        losses: tr.losses ?? 0,
        winningPercentage: parsePercent(tr.winningPercentage) ?? 0,
        gamesBack:
          tr.gamesBack == null || tr.gamesBack === "-"
            ? null
            : Number(tr.gamesBack),
        wildCardGamesBack: prev?.wildCardGamesBack ?? null,
        runDifferential: (tr.runsScored ?? 0) - (tr.runsAllowed ?? 0),
        runsScored: tr.runsScored ?? 0,
        runsAllowed: tr.runsAllowed ?? 0,
        magicNumber: tr.magicNumber == null ? null : Number(tr.magicNumber),
        eliminationNumber:
          tr.eliminationNumber == null ? null : Number(tr.eliminationNumber),
        wildCardEliminationNumber: prev?.wildCardEliminationNumber ?? null,
        clinched: Boolean(tr.clinched),
        streak: {
          type: tr.streak?.type ?? null,
          number: tr.streak?.number ?? 0,
        },
      });
    }
  }
  return Array.from(byTeam.values()).sort(
    (a, b) => a.divisionRank - b.divisionRank || a.teamId - b.teamId
  );
}

// ---------------------------------------------------------------------------
// 賽程 / 賽果
// ---------------------------------------------------------------------------

/**
 * 比賽狀態分類。MLB API 嘅 status 欄位：
 * - detailedState: "Final" | "Scheduled" | "Cancelled" | "Postponed" | "In Progress" ...
 * - abstractGameState: "Final" | "Live" | "Preview"（某啲端點可能係 null！）
 * - codedGameState: 'F' | 'S' | 'L' ...
 * 用 detailedState 做主，codedGameState 做後備。
 */
function mapStatus(detailed: string, coded: string, abstract: string): GameStatus {
  if (
    detailed.includes("Postponed") ||
    detailed.includes("Suspended") ||
    detailed === "Cancelled" ||
    coded === "PPD" ||
    coded === "C"
  ) {
    return "Postponed";
  }
  if (detailed === "Final" || coded === "F" || abstract === "Final") return "Final";
  if (abstract === "Live" || coded === "L" || detailed === "In Progress") return "Live";
  return "Scheduled";
}

export type SeasonSchedule = {
  games: Game[];
  playedGames: number;
  wins: number;
  losses: number;
  lastTen: ("W" | "L")[];
  streak: { type: "W" | "L" | null; number: number };
  homeRecord: { w: number; l: number };
  awayRecord: { w: number; l: number };
  headToHead: Record<number, { w: number; l: number }>;
  nextGame: Game | null;
  remainingGames: Game[];
  remainingCount: number;
};

/** 國民隊整季賽程（已完場 + 未賽） — GET /schedule?sportId=1&teamId=120&startDate&endDate */
export async function fetchSeasonSchedule(): Promise<SeasonSchedule> {
  const data = await fetchMLB<MLBScheduleResponse>(
    `/schedule?sportId=1&teamId=${NATIONALS_ID}&startDate=${SEASON_START}&endDate=${SEASON_END}`
  );

  const games: Game[] = [];
  for (const d of data.dates ?? []) {
    for (const g of d.games ?? []) {
      const status = mapStatus(
        g.status?.detailedState ?? "",
        g.status?.codedGameState ?? "",
        g.abstractGameState ?? ""
      );
      const away = g.teams?.away;
      const home = g.teams?.home;
      const isNatsHome = home?.team?.id === NATIONALS_ID;
      games.push({
        gamePk: g.gamePk,
        date: g.officialDate ?? g.gameDate?.slice(0, 10) ?? "",
        gameDateTime: g.gameDate ?? null,
        gameType: g.gameType ?? "R",
        status,
        venue: g.venue?.name ?? "—",
        awayTeamId: away?.team?.id ?? 0,
        homeTeamId: home?.team?.id ?? 0,
        awayTeamName: away?.team?.name ?? "—",
        homeTeamName: home?.team?.name ?? "—",
        awayScore: away?.score ?? null,
        homeScore: home?.score ?? null,
        isNatsHome,
        natsWon:
          status === "Final"
            ? isNatsHome
              ? (home?.isWinner ?? false)
              : (away?.isWinner ?? false)
            : null,
        seriesSummary:
          g.seriesSummary != null
            ? `${g.seriesSummary.gameNumber}/${g.seriesSummary.totalGames}`
            : g.seriesGameNumber != null
              ? `第 ${g.seriesGameNumber} 場`
              : "—",
      });
    }
  }

  // 只計例行賽（gameType === 'R'）嘅已完場比賽
  const finished = games.filter((g) => g.gameType === "R" && g.status === "Final");
  const wins = finished.filter((g) => g.natsWon).length;
  const losses = finished.length - wins;

  const lastTen = finished
    .slice(-10)
    .map((g) => (g.natsWon ? ("W" as const) : ("L" as const)));

  // 連勝/連敗
  let streak: { type: "W" | "L" | null; number: number } = { type: null, number: 0 };
  if (lastTen.length > 0) {
    const last = lastTen[lastTen.length - 1];
    let n = 0;
    for (let i = finished.length - 1; i >= 0; i--) {
      const r = finished[i].natsWon ? "W" : "L";
      if (r === last) n++;
      else break;
    }
    streak = { type: last, number: n };
  }

  const homeRecord = { w: 0, l: 0 };
  const awayRecord = { w: 0, l: 0 };
  for (const g of finished) {
    if (g.isNatsHome) {
      if (g.natsWon) homeRecord.w++;
      else homeRecord.l++;
    } else {
      if (g.natsWon) awayRecord.w++;
      else awayRecord.l++;
    }
  }

  const headToHead: Record<number, { w: number; l: number }> = {};
  for (const g of finished) {
    const opp = g.isNatsHome ? g.awayTeamId : g.homeTeamId;
    const rec = (headToHead[opp] ??= { w: 0, l: 0 });
    if (g.natsWon) rec.w++;
    else rec.l++;
  }

  const remainingGames = games.filter(
    (g) => g.gameType === "R" && (g.status === "Scheduled" || g.status === "Live")
  );
  const nextGame =
    games.find((g) => g.gameType === "R" && g.status === "Scheduled") ?? null;

  return {
    games,
    playedGames: finished.length,
    wins,
    losses,
    lastTen,
    streak,
    homeRecord,
    awayRecord,
    headToHead,
    nextGame,
    remainingGames,
    remainingCount: remainingGames.length,
  };
}

// ---------------------------------------------------------------------------
// 名單
// ---------------------------------------------------------------------------

/** 現役名單 — GET /teams/120/roster?season=2026 */
export async function fetchRoster(): Promise<RosterPlayer[]> {
  const data = await fetchMLB<MLBRosterResponse>(`/teams/${NATIONALS_ID}/roster?season=${SEASON}`);
  return (data.roster ?? []).map((r) => ({
    personId: r.person?.id ?? 0,
    fullName: r.person?.fullName ?? "—",
    position: r.position?.abbreviation ?? "—",
    positionType: (r.position?.type ?? "Fielder") as RosterPlayer["positionType"],
    status: r.status?.description ?? "Active",
    jerseyNumber: r.jerseyNumber ?? "",
  }));
}

// ---------------------------------------------------------------------------
// 球員成績 — 用 playerPool=All 一次過攞全隊
// ---------------------------------------------------------------------------

/** 全隊打擊成績 — GET /stats?stats=season&group=hitting&teamId=120&season=2026&playerPool=All */
export async function fetchTeamHitting(): Promise<PlayerStatLine[]> {
  const data = await fetchMLB<MLBStatsResponse>(
    `/stats?stats=season&group=hitting&teamId=${NATIONALS_ID}&season=${SEASON}&playerPool=All&sportIds=1`
  );
  const out: PlayerStatLine[] = [];
  for (const sp of data.stats?.[0]?.splits ?? []) {
    const st = sp.stat ?? {};
    const hits = Number(st.hits) || 0;
    const atBats = Number(st.atBats) || 0;
    out.push({
      personId: sp.player?.id ?? 0,
      name: sp.player?.fullName ?? "—",
      position: sp.position?.abbreviation ?? "—",
      positionType: "hitter",
      hitting: {
        games: Number(st.gamesPlayed) || 0,
        plateAppearances: Number(st.plateAppearances) || 0,
        atBats,
        hits,
        runs: Number(st.runs) || 0,
        doubles: Number(st.doubles) || 0,
        triples: Number(st.triples) || 0,
        homeRuns: Number(st.homeRuns) || 0,
        rbi: Number(st.rbi) || 0,
        stolenBases: Number(st.stolenBases) || 0,
        walks: Number(st.baseOnBalls) || 0,
        strikeouts: Number(st.strikeOuts) || 0,
        avg: parsePercent(st.avg) ?? (atBats ? hits / atBats : 0),
        obp: parsePercent(st.obp) ?? 0,
        slg: parsePercent(st.slg) ?? 0,
        ops: parsePercent(st.ops) ?? 0,
      },
    });
  }
  return out;
}

/** 全隊投手成績 — GET /stats?stats=season&group=pitching&teamId=120&season=2026&playerPool=All */
export async function fetchTeamPitching(): Promise<PlayerStatLine[]> {
  const data = await fetchMLB<MLBStatsResponse>(
    `/stats?stats=season&group=pitching&teamId=${NATIONALS_ID}&season=${SEASON}&playerPool=All&sportIds=1`
  );
  const out: PlayerStatLine[] = [];
  for (const sp of data.stats?.[0]?.splits ?? []) {
    const st = sp.stat ?? {};
    out.push({
      personId: sp.player?.id ?? 0,
      name: sp.player?.fullName ?? "—",
      position: sp.position?.abbreviation ?? "P",
      positionType: "pitcher",
      pitching: {
        games: Number(st.gamesPlayed) || 0,
        gamesStarted: Number(st.gamesStarted) || 0,
        wins: Number(st.wins) || 0,
        losses: Number(st.losses) || 0,
        era: parsePercent(st.era) ?? 0,
        whip: parsePercent(st.whip) ?? 0,
        inningsPitched: st.inningsPitched ?? "0",
        strikeouts: Number(st.strikeOuts) || 0,
        walks: Number(st.baseOnBalls) || 0,
        homeRuns: Number(st.homeRuns) || 0,
        saves: Number(st.saves) || 0,
        holds: Number(st.holds) || 0,
        kPer9: parsePercent(st.strikeoutsPer9Inn) ?? 0,
        bbPer9: parsePercent(st.walksPer9Inn) ?? 0,
      },
    });
  }
  return out;
}

/** 全隊守備成績 — GET /stats?stats=season&group=fielding&teamId=120&season=2026&playerPool=All */
export async function fetchTeamFielding(): Promise<PlayerStatLine[]> {
  const data = await fetchMLB<MLBStatsResponse>(
    `/stats?stats=season&group=fielding&teamId=${NATIONALS_ID}&season=${SEASON}&playerPool=All&sportIds=1`
  );
  const out: PlayerStatLine[] = [];
  for (const sp of data.stats?.[0]?.splits ?? []) {
    const st = sp.stat ?? {};
    out.push({
      personId: sp.player?.id ?? 0,
      name: sp.player?.fullName ?? "—",
      position: sp.position?.abbreviation ?? "—",
      positionType: "fielder",
      fielding: {
        games: Number(st.gamesPlayed) || 0,
        putOuts: Number(st.putOuts) || 0,
        assists: Number(st.assists) || 0,
        errors: Number(st.errors) || 0,
        chances: Number(st.chances) || 0,
        fielding: parsePercent(st.fielding) ?? 0,
        doublePlays: Number(st.doublePlays) || 0,
      },
    });
  }
  return out;
}

/** 個人成績（單一球員，用喺個人頁） — GET /people/{id}/stats */
export async function fetchPlayerStats(personId: number): Promise<PlayerStatLine | null> {
  const [hit, pitch, field] = await Promise.all([
    fetchMLB<MLBStatsResponse>(`/people/${personId}/stats?stats=season&group=hitting&season=${SEASON}`),
    fetchMLB<MLBStatsResponse>(`/people/${personId}/stats?stats=season&group=pitching&season=${SEASON}`),
    fetchMLB<MLBStatsResponse>(`/people/${personId}/stats?stats=season&group=fielding&season=${SEASON}`),
  ]);

  const getSplit = (d: MLBStatsResponse) => d.stats?.[0]?.splits?.[0] ?? null;
  const hs = getSplit(hit);
  const ps = getSplit(pitch);
  const fs = getSplit(field);

  if (!hs && !ps && !fs) return null;

  const name = hs?.player?.fullName ?? ps?.player?.fullName ?? "—";
  const position = hs?.position?.abbreviation ?? ps?.position?.abbreviation ?? "—";

  const line: PlayerStatLine = { personId, name, position, positionType: "hitter" };
  if (hs) {
    const st = hs.stat;
    const hits = Number(st.hits) || 0;
    const atBats = Number(st.atBats) || 0;
    line.hitting = {
      games: Number(st.gamesPlayed) || 0,
      plateAppearances: Number(st.plateAppearances) || 0,
      atBats,
      hits,
      runs: Number(st.runs) || 0,
      doubles: Number(st.doubles) || 0,
      triples: Number(st.triples) || 0,
      homeRuns: Number(st.homeRuns) || 0,
      rbi: Number(st.rbi) || 0,
      stolenBases: Number(st.stolenBases) || 0,
      walks: Number(st.baseOnBalls) || 0,
      strikeouts: Number(st.strikeOuts) || 0,
      avg: parsePercent(st.avg) ?? (atBats ? hits / atBats : 0),
      obp: parsePercent(st.obp) ?? 0,
      slg: parsePercent(st.slg) ?? 0,
      ops: parsePercent(st.ops) ?? 0,
    };
  }
  if (ps) {
    const st = ps.stat;
    line.positionType = "pitcher";
    line.pitching = {
      games: Number(st.gamesPlayed) || 0,
      gamesStarted: Number(st.gamesStarted) || 0,
      wins: Number(st.wins) || 0,
      losses: Number(st.losses) || 0,
      era: parsePercent(st.era) ?? 0,
      whip: parsePercent(st.whip) ?? 0,
      inningsPitched: st.inningsPitched ?? "0",
      strikeouts: Number(st.strikeOuts) || 0,
      walks: Number(st.baseOnBalls) || 0,
      homeRuns: Number(st.homeRuns) || 0,
      saves: Number(st.saves) || 0,
      holds: Number(st.holds) || 0,
      kPer9: parsePercent(st.strikeoutsPer9Inn) ?? 0,
      bbPer9: parsePercent(st.walksPer9Inn) ?? 0,
    };
  }
  if (fs) {
    const st = fs.stat;
    line.positionType = line.pitching ? "pitcher" : "hitter";
    line.fielding = {
      games: Number(st.gamesPlayed) || 0,
      putOuts: Number(st.putOuts) || 0,
      assists: Number(st.assists) || 0,
      errors: Number(st.errors) || 0,
      chances: Number(st.chances) || 0,
      fielding: parsePercent(st.fielding) ?? 0,
      doublePlays: Number(st.doublePlays) || 0,
    };
  }
  return line;
}

// ---------------------------------------------------------------------------
// 球員基本資料
// ---------------------------------------------------------------------------

interface MLBPersonResponse {
  people: {
    id: number;
    fullName: string;
    birthDate: string | null;
    currentAge: number | null;
    height: string | null;
    weight: number | null;
    batSide?: { code: string } | null;
    pitchHand?: { code: string } | null;
    mlbDebutDate: string | null;
    draftYear: number | null;
    primaryPosition?: { abbreviation: string } | null;
  }[];
}

/** 球員基本資料（相片 URL 由 personId 生成） — GET /people/{id} */
export async function fetchPlayerInfo(personId: number): Promise<PlayerInfo | null> {
  const data = await fetchMLB<MLBPersonResponse>(`/people/${personId}`);
  const p = data.people?.[0];
  if (!p) return null;
  return {
    personId: p.id,
    fullName: p.fullName ?? "—",
    birthDate: p.birthDate ?? null,
    currentAge: p.currentAge ?? null,
    height: p.height ?? null,
    weight: p.weight ?? null,
    batSide: p.batSide?.code ?? null,
    pitchHand: p.pitchHand?.code ?? null,
    mlbDebutDate: p.mlbDebutDate ?? null,
    draftYear: p.draftYear ?? null,
    primaryPosition: p.primaryPosition?.abbreviation ?? null,
  };
}

/** MLB 官方頭像 URL */
export function playerHeadshotUrl(personId: number, size = 160): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_${size},d_people:generic:clipart:alt:1.0,q_auto:best,f_auto/people/${personId}/headshot/silo/current`;
}

// ---------------------------------------------------------------------------
// 團隊攻守排名（全聯盟 30 隊，自己 sort）
// ---------------------------------------------------------------------------

export type TeamRank = { rank: number; name: string; value: number; statKey: string };

/** 全聯盟打擊排名（每項 sort 出 rank） — GET /teams/stats?group=hitting&stats=season */
export async function fetchTeamHittingRanks(): Promise<TeamRank[]> {
  const data = await fetchMLB<MLBStatsResponse>(
    `/teams/stats?group=hitting&stats=season&season=${SEASON}&sportIds=1`
  );
  const rows = (data.stats?.[0]?.splits ?? []).map((sp) => {
    const st = sp.stat ?? {};
    return {
      teamId: sp.team?.id ?? 0,
      name: sp.team?.name ?? "—",
      runs: Number(st.runs) || 0,
      homeRuns: Number(st.homeRuns) || 0,
      avg: parsePercent(st.avg) ?? 0,
      obp: parsePercent(st.obp) ?? 0,
      slg: parsePercent(st.slg) ?? 0,
      ops: parsePercent(st.ops) ?? 0,
      strikeouts: Number(st.strikeOuts) || 0,
    };
  });

  const rank = (
    arr: typeof rows,
    key: "runs" | "homeRuns" | "avg" | "obp" | "slg" | "ops"
  ) => [...arr].sort((a, b) => b[key] - a[key]);

  const result: TeamRank[] = [];
  const keys = [
    ["runs", "得分"],
    ["homeRuns", "全壘打"],
    ["avg", "打擊率"],
    ["obp", "上壘率"],
    ["slg", "長打率"],
    ["ops", "OPS"],
  ] as const;
  for (const [key, label] of keys) {
    const sorted = rank(rows, key);
    const natsIdx = sorted.findIndex((r) => r.teamId === NATIONALS_ID);
    result.push({
      rank: natsIdx + 1,
      name: `${label} (${key.toUpperCase()})`,
      value: sorted[natsIdx][key],
      statKey: key,
    });
  }
  return result;
}

/** 全聯盟投手排名 — GET /teams/stats?group=pitching&stats=season */
export async function fetchTeamPitchingRanks(): Promise<TeamRank[]> {
  const data = await fetchMLB<MLBStatsResponse>(
    `/teams/stats?group=pitching&stats=season&season=${SEASON}&sportIds=1`
  );
  const rows = (data.stats?.[0]?.splits ?? []).map((sp) => {
    const st = sp.stat ?? {};
    return {
      teamId: sp.team?.id ?? 0,
      name: sp.team?.name ?? "—",
      era: parsePercent(st.era) ?? 0,
      whip: parsePercent(st.whip) ?? 0,
      strikeouts: Number(st.strikeOuts) || 0,
      walks: Number(st.baseOnBalls) || 0,
    };
  });

  const result: TeamRank[] = [];
  // ERA / WHIP 越低越好
  const desc = ["strikeouts"];
  for (const [key, label] of [
    ["era", "自責分率"],
    ["whip", "WHIP"],
    ["strikeouts", "三振"],
  ] as const) {
    const sorted = [...rows].sort((a, b) =>
      desc.includes(key) ? b[key] - a[key] : a[key] - b[key]
    );
    const natsIdx = sorted.findIndex((r) => r.teamId === NATIONALS_ID);
    result.push({
      rank: natsIdx + 1,
      name: `${label} (${key.toUpperCase()})`,
      value: sorted[natsIdx][key],
      statKey: key,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Cached wrappers — 供 Next.js Server Components 使用。
// 核心邏輯喺 fetch* 函數（可喺 Next runtime 外測試），呢度用
// 'use cache' + cacheLife + cacheTag 做快取（需要 cacheComponents: true）。
// ---------------------------------------------------------------------------

/** 國民隊基本資料（快取 1 日） */
export async function getTeamInfo(): Promise<TeamInfo> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAG);
  return fetchTeamInfo();
}

/** 全 NL 排名（快取 5 分鐘） */
export async function getStandings(): Promise<StandingRow[]> {
  "use cache";
  cacheLife(CACHE_LIFE_LIVE);
  cacheTag(CACHE_TAG);
  return fetchStandings();
}

/** 國民隊整季賽程（快取 5 分鐘） */
export async function getSeasonSchedule(): Promise<SeasonSchedule> {
  "use cache";
  cacheLife(CACHE_LIFE_LIVE);
  cacheTag(CACHE_TAG);
  return fetchSeasonSchedule();
}

/** 現役名單（快取 1 小時） */
export async function getRoster(): Promise<RosterPlayer[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  return fetchRoster();
}

/** 全隊打擊成績（快取 1 小時） */
export async function getTeamHitting(): Promise<PlayerStatLine[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  return fetchTeamHitting();
}

/** 全隊投手成績（快取 1 小時） */
export async function getTeamPitching(): Promise<PlayerStatLine[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  return fetchTeamPitching();
}

/** 全隊守備成績（快取 1 小時） */
export async function getTeamFielding(): Promise<PlayerStatLine[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  return fetchTeamFielding();
}

/** 個人成績（快取 1 小時） */
export async function getPlayerStats(personId: number): Promise<PlayerStatLine | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  return fetchPlayerStats(personId);
}

/** 球員基本資料（快取 1 日） */
export async function getPlayerInfo(personId: number): Promise<PlayerInfo | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAG);
  return fetchPlayerInfo(personId);
}

/** 全聯盟打擊排名（快取 1 小時） */
export async function getTeamHittingRanks(): Promise<TeamRank[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  return fetchTeamHittingRanks();
}

/** 全聯盟投手排名（快取 1 小時） */
export async function getTeamPitchingRanks(): Promise<TeamRank[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  return fetchTeamPitchingRanks();
}
