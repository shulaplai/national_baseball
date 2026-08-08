// 最新消息 — ESPN 公開 JSON API（免 key、免 CORS，server-side fetch）。
// 同 MLB 數據分開一個 file，因為係唔同 data source（ESPN 而非 statsapi.mlb.com）。

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAG } from "./constants";

export type NewsItem = {
  id: number;
  headline: string;
  description: string;
  published: string; // ISO string
  url: string;
};

// Washington Nationals 喺 ESPN 嘅 team id = 20
// 注意：path 一定要有 /site/（無 /site/ 嘅 variant 返回 404）
const ESPN_NEWS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news?team=20";

interface ESPNArticle {
  id: number;
  headline?: string;
  description?: string;
  published?: string;
  links?: { web?: { href?: string } };
}

/** 純 fetch + normalize（可在 Next runtime 外測試） */
export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(ESPN_NEWS_URL, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ESPN news ${res.status}`);
  const data = (await res.json()) as { articles?: ESPNArticle[] };
  return (data.articles ?? []).slice(0, 4).map((a) => ({
    id: a.id,
    headline: a.headline ?? "—",
    description: a.description ?? "",
    published: a.published ?? "",
    url: a.links?.web?.href ?? "https://www.espn.com/mlb/",
  }));
}

/**
 * 最新消息（快取 1 小時 + cacheTag("mlb") 跟 revalidate 一齊刷新）。
 * ESPN 係第三方，try/catch 兜底返回空陣列——新聞掛咗唔可以整死首頁。
 */
export async function getNews(): Promise<NewsItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAG);
  try {
    return await fetchNews();
  } catch {
    return [];
  }
}
