// 網站文案字典 — 繁體中文（粵語風格），棒球術語保留英文

export const SITE = {
  name: "華盛頓國民隊數據站",
  nameEn: "WSH Nationals",
  tagline: "華盛頓國民隊 · 數據與分析",
  description:
    "華盛頓國民隊（Washington Nationals）球迷數據網站：即時球員成績、本季賽況、季後賽與長期戰力分析。",
};

export const NAV = [
  { href: "/", label: "概覽" },
  { href: "/players", label: "球員成績" },
  { href: "/schedule", label: "賽況" },
  { href: "/analysis", label: "分析" },
  { href: "/injuries", label: "傷兵交易" },
  { href: "/splits", label: "進階數據" },
] as const;

// 常見 stat 欄位中文名（打擊）
export const HITTING_LABELS: Record<string, string> = {
  games: "出賽",
  avg: "AVG",
  obp: "OBP",
  slg: "SLG",
  ops: "OPS",
  hr: "HR",
  rbi: "RBI",
  hits: "安打",
  runs: "得分",
  sb: "盜壘",
  bb: "保送",
  k: "三振",
  ab: "打數",
  pa: "打席",
  doubles: "二壘打",
  triples: "三壘打",
};

// 常見 stat 欄位中文名（投手）
export const PITCHING_LABELS: Record<string, string> = {
  games: "出賽",
  gamesStarted: "先發",
  wins: "勝",
  losses: "敗",
  era: "ERA",
  whip: "WHIP",
  inningsPitched: "局數",
  strikeouts: "三振",
  walks: "保送",
  homeRuns: "HR",
  saves: "救援",
  holds: "中繼",
  kPer9: "K/9",
  bbPer9: "BB/9",
};

// 常見 stat 欄位中文名（守備）
export const FIELDING_LABELS: Record<string, string> = {
  games: "出賽",
  putOuts: "刺殺",
  assists: "助殺",
  errors: "失誤",
  chances: "守備機會",
  fielding: "守備率",
  doublePlays: "雙殺",
};

export const MISC = {
  home: "主場",
  away: "作客",
  nextGame: "下場比賽",
  win: "勝",
  loss: "負",
  streak: "近況",
  lastTen: "近 10 場",
  divisionRank: "分區排名",
  wildCard: "外卡",
  gamesBack: "勝差",
  magicNumber: "魔術數字",
  eliminationNumber: "淘汰數字",
};
