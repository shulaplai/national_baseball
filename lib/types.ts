// 數據型別定義 — 對應 MLB Stats API 返回結構

export type GameStatus = "Final" | "Live" | "Scheduled" | "Postponed" | "Other";

export type Game = {
  gamePk: number;
  date: string; // "2026-08-01"
  gameDateTime: string | null; // ISO datetime（開賽時間，Scheduled 用）
  gameType: string; // 'R' 例行賽, 'P' 春訓, 'S' 季後賽...
  status: GameStatus;
  venue: string;
  awayTeamId: number;
  homeTeamId: number;
  awayTeamName: string;
  homeTeamName: string;
  awayScore: number | null;
  homeScore: number | null;
  isNatsHome: boolean;
  natsWon: boolean | null;
  seriesSummary: string; // "Game 3 of 4"
};

export type StandingRow = {
  teamId: number;
  name: string; // short name e.g. "Nationals"
  divisionName: string;
  leagueRank: number;
  divisionRank: number;
  wins: number;
  losses: number;
  winningPercentage: number; // 0.483
  gamesBack: number | null;
  wildCardGamesBack: number | null;
  runDifferential: number;
  runsScored: number;
  runsAllowed: number;
  magicNumber: number | null;
  eliminationNumber: number | null;
  wildCardEliminationNumber: number | null;
  clinched: boolean;
  streak: { type: "wins" | "losses" | null; number: number };
  last10Wins?: number; // 由 schedule 計（standings API 唔提供）
  last10Losses?: number;
};

export type HittingStats = {
  games: number;
  plateAppearances: number;
  atBats: number;
  hits: number;
  runs: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  walks: number;
  strikeouts: number;
  avg: number; // .273
  obp: number;
  slg: number;
  ops: number;
};

export type PitchingStats = {
  games: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  era: number;
  whip: number;
  inningsPitched: string; // "59.1"（MLB 特有 .1/.2）
  strikeouts: number;
  walks: number;
  homeRuns: number;
  saves: number;
  holds: number;
  kPer9: number;
  bbPer9: number;
};

export type FieldingStats = {
  games: number;
  putOuts: number;
  assists: number;
  errors: number;
  chances: number;
  fielding: number; // 0.980
  doublePlays: number;
};

export type PlayerStatLine = {
  personId: number;
  name: string;
  position: string; // "1B", "P"...
  positionType: "hitter" | "pitcher" | "fielder";
  hitting?: HittingStats;
  pitching?: PitchingStats;
  fielding?: FieldingStats;
};

export type RosterPlayer = {
  personId: number;
  fullName: string;
  position: string; // "1B"
  positionType: "Hitter" | "Pitcher" | "Fielder";
  status: string; // "Active", "Injured List"...
  jerseyNumber: string;
};

export type TeamStatsRank = {
  teamId: number;
  name: string;
  runs: number;
  homeRuns: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  strikeouts: number;
  // pitching
  era?: number;
  whip?: number;
};

export type TeamInfo = {
  id: number;
  name: string;
  teamName: string;
  abbreviation: string;
  venue: string;
  locationName: string;
};

// 球員基本資料（/people/{id}）
export type PlayerInfo = {
  personId: number;
  fullName: string;
  birthDate: string | null;
  currentAge: number | null;
  height: string | null; // "6' 0\""
  weight: number | null; // lb
  batSide: string | null; // "L" / "R" / "S"
  pitchHand: string | null; // "R" / "L"
  mlbDebutDate: string | null;
  draftYear: number | null;
  primaryPosition: string | null; // "SS"
};

// 比賽時間（用嚟顯示開賽時間）
export type GameDateTime = {
  date: string;
  time: string; // "7:05 PM"
};

// 傷兵報告（40-man 名單傷兵狀態）
export type InjuryReportItem = {
  personId: number;
  name: string;
  position: string; // "P", "1B"...
  jerseyNumber: string;
  ilCode: "IL10" | "IL15" | "IL60";
  status: string; // "Injured 15-Day"
};

// 交易 / 異動
export type TransactionItem = {
  date: string; // "2026-08-01"
  type: string;
  description: string;
};

// 情境 splits（主客場 / 得點圈有人）— person-level statSplits
export type SituationSplit = {
  situationCode: string | null;
  situationDescription: string | null;
  plateAppearances: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  homeRuns: number;
};
