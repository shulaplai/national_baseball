// 格式化 helper — MLB API 返回嘅百分比/比率係 string（如 ".273"），顯示時用呢度

/** ".273" → 0.273；null/undefined → null */
export function parsePercent(s: string | null | undefined): number | null {
  if (s === null || s === undefined || s === "") return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

/** 0.273 → ".273"（保留 3 位小數） */
export function formatAvg(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(3);
}

/** 0.327 → ".327" */
export function formatPct3(n: number | null | undefined): string {
  return formatAvg(n);
}

/** 0.483 → ".483" 勝率；0 → ".000" */
export function formatWinningPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(3);
}

/** 3.45 → "3.45"（ERA 兩位小數） */
export function formatEra(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

/** 1.23 → "1.23" */
export function formatTwo(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

/** "2026-08-01" → "2026/8/1"（zh-Hant） */
export function formatDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("zh-Hant", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(d);
}

/** "2026-08-01T19:05:00Z" → "8月1日 (六) 19:05" */
export function formatGameDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-Hant", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  }).format(d);
}

/** 中國式中文日期：只顯示「8/1」 */
export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** "59.1" 保持原樣；純數字 → 數字。用於顯示 */
export function formatIp(ip: string | null | undefined): string {
  if (ip === null || ip === undefined || ip === "") return "—";
  return ip;
}

/** 數字千分位分隔 */
export function formatInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}
