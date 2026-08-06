# 華盛頓國民隊數據站 (WSH Nationals)

華盛頓國民隊（Washington Nationals）球迷數據與分析網站。繁體中文（粵語風格）界面，棒球術語保留英文。

## 功能

- **概覽**：本季戰績、國聯東區排名、團隊攻守排名、勝場趨勢圖、下場比賽
- **球員成績**：打擊 / 投手 / 守備可排序表格、位置篩選、個人成績頁
- **賽況**：完整賽程（按月）、近 10 場、主客場、對各隊對戰紀錄
- **分析**：
  - 短期 — Monte Carlo 季後賽機率、外卡形勢、魔術數字、剩餘賽程難度
  - 長期 — 農場系統、新秀、薪資、3-5 年戰力展望報告

## 技術

- **Next.js 16**（App Router + TypeScript + Cache Components）
- **Tailwind CSS v4**、**Recharts**
- 數據來源：**MLB Stats API**（免費、無 API key）

## 開發

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npx tsx scripts/verify-api.ts   # 數據層驗證
npm run build
```

## 部署 + 自動更新

1. 部署到 Vercel，設定環境變數 `REVALIDATE_SECRET`（見 `.env.example`）。
2. GitHub repo Settings → Actions → Variables 加 `SITE_URL`、Secrets 加 `REVALIDATE_SECRET`。
3. `.github/workflows/revalidate.yml` 賽季期每 15 分鐘自動觸發 `/api/revalidate`，數據自動保持最新。

詳細開發指引見 `CLAUDE.md`。
