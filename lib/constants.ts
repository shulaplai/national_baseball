// MLB 常用常數

export const NATIONALS_ID = 120;
export const NL_LEAGUE_ID = 104;
export const AL_LEAGUE_ID = 103;

export const NL_EAST_IDS = [120, 121, 143, 144, 146]; // Nats, Mets, Phillies, Braves, Marlins
export const NL_EAST_TEAMS = [
  { id: 144, name: "Braves", fullName: "Atlanta Braves" },
  { id: 143, name: "Phillies", fullName: "Philadelphia Phillies" },
  { id: 146, name: "Marlins", fullName: "Miami Marlins" },
  { id: 120, name: "Nationals", fullName: "Washington Nationals" },
  { id: 121, name: "Mets", fullName: "New York Mets" },
];

export const SEASON = 2026;

// 賽季日期範圍（2 月春訓到 11 月世界大賽）
export const SEASON_START = `${SEASON}-02-01`;
export const SEASON_END = `${SEASON}-11-30`;

export const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

// 快取 tag：用於 on-demand revalidateTag
export const CACHE_TAG = "mlb";

// 即時數據（賽果/排名）快取 profile — stale 60s, revalidate 300s (5分鐘), expire 1小時
// 用 object 形式（唔用自訂 profile 名，避免 TS 對 string union 嘅解析問題）
export const CACHE_LIFE_LIVE = {
  stale: 60,
  revalidate: 300,
  expire: 3600,
} as const;
