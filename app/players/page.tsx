import type { Metadata } from "next";
import { getTeamHitting, getTeamPitching, getTeamFielding } from "@/lib/mlb";
import { PlayersView } from "@/components/players/PlayersView";

export const metadata: Metadata = {
  title: "球員成績",
  description: "華盛頓國民隊 2026 球季打擊、投手、守備成績",
};

export default async function PlayersPage() {
  const [hitters, pitchers, fielders] = await Promise.all([
    getTeamHitting(),
    getTeamPitching(),
    getTeamFielding(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">球員成績</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          2026 球季 · 點擊欄位排序 · 點擊球員睇個人頁面
        </p>
      </div>
      <PlayersView hitters={hitters} pitchers={pitchers} fielders={fielders} />
    </div>
  );
}
