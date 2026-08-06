@AGENTS.md

# 華盛頓國民隊數據站 — 開發指引

## 項目概要

華盛頓國民隊（Washington Nationals）球迷數據網站。四大頁面：**概覽**（首頁）、**球員成績**、**賽況**、**分析**（短期季後賽 + 長期 3-5 年報告）。繁體中文界面，棒球術語保留英文。

## 技術棧

- **Next.js 16**（App Router + TypeScript + Turbopack）
- **Cache Components**：`next.config.ts` 開咗 `cacheComponents: true`
- **Tailwind CSS v4**、**Recharts**（首頁勝場趨勢圖）
- 數據來源：**MLB Stats API**（免費、無 API key）`https://statsapi.mlb.com/api/v1`

## ⚠️ Next 16 重要注意事項

1. **唔好用 `export const revalidate` 或 `dynamicParams` route config** — 同 `cacheComponents` 唔兼容，會 build error。
2. 數據刷新時機靠 `'use cache'` + `cacheLife` + `cacheTag`，寫喺數據函數入面。
3. `cacheLife("自訂名")` 有 TS 問題 → 用 object 形式 `cacheLife({ stale, revalidate, expire })`（見 `CACHE_LIFE_LIVE`）。
4. `Math.random()`/`Date.now()` 喺 prerender 會報錯 → 分析模組用種子化 PRNG。

## 數據層架構

- `lib/mlb.ts`：核心函數（`fetch*`，純 fetch+normalize，可用 `npx tsx scripts/verify-api.ts` 測試）+ cached wrappers（`get*`，加 `'use cache'`）。
- `lib/analysis.ts`：純函數分析（Pythagorean、Monte Carlo 季後賽機率、賽程難度）。
- `lib/constants.ts`：`NATIONALS_ID=120`、`NL_LEAGUE_ID=104`、`SEASON=2026`、快取常數。

## MLB API 端點（已實測）

| 函數 | 端點 | 快取 |
|---|---|---|
| `getStandings` | `/standings?leagueId=104&season=2026&standingsTypes=regularSeason,wildCard` | 5 分鐘 |
| `getSeasonSchedule` | `/schedule?sportId=1&teamId=120&startDate=2026-02-01&endDate=2026-11-30` | 5 分鐘 |
| `getRoster` | `/teams/120/roster?season=2026` | 1 小時 |
| `getTeamHitting/Pitching/Fielding` | `/stats?stats=season&group=X&teamId=120&season=2026&playerPool=All` | 1 小時 |
| `getTeamHittingRanks/PitchingRanks` | `/teams/stats?group=X&stats=season&season=2026&sportIds=1` | 1 小時 |

## 實測踩坑（改數據層時留意）

1. **Standings**：`records[]` 最後一個係 `standingsType='wildCard'`，佢嘅 `division` 欄位唔可靠（寫咗 NL Central id），只更新外卡欄位，唔好覆寫分區資料。主客場/近10場/連勝 API 唔提供，要由 schedule 計。
2. **狀態分類**：某啲端點 `abstractGameState` 係 `null`！要用 `status.detailedState` + `codedGameState`（見 `mapStatus`）。
3. **AVG/ERA/OBP 等係 string**（`.273`）→ `parsePercent` 轉 number。
4. **`inningsPitched` 係 `"59.1"`** 格式，排序用 `ipToDecimal`。
5. **Scheduled 比賽冇 `seriesSummary`**，用 `seriesGameNumber` fallback。

## 驗證

```bash
npx tsx scripts/verify-api.ts   # 數據層 + 分析計算驗證
npm run lint
npm run build
```

## 自動更新

- `/api/revalidate?secret=X` → `revalidateTag('mlb')` 立即刷新所有數據快取。
- `.github/workflows/revalidate.yml` 賽季期每 15 分鐘自動觸發。
- Vercel env：`REVALIDATE_SECRET`；GitHub Actions 用 `SITE_URL` var + `REVALIDATE_SECRET` secret。

## 長期分析報告

- 放 `content/longterm/*.mdx`（frontmatter：title/date/updatedAt/tags/summary/author）。
- `/analysis/longterm` 自動列出 + 渲染。新報告直接加 `.mdx` 就得。
