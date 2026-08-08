import type { Metadata } from "next";
import { getTeamHitting, getPlayerSplits } from "@/lib/mlb";
import { formatAvg } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import type { HittingStats, SituationSplit } from "@/lib/types";

export const metadata: Metadata = {
  title: "進階數據",
  description: "華盛頓國民隊打者情境數據：主客場、得點圈有人",
};

// person-level statSplits 實測可行嘅 sitCode（對左右投 / 其他情境 API 唔支援）
const SIT_CODES = ["h", "a", "risp"] as const;
type SitCode = (typeof SIT_CODES)[number];
const SIT_LABELS: Record<SitCode, string> = {
  h: "主場",
  a: "作客",
  risp: "得點圈有人",
};
const SIT_TIPS: Record<SitCode, string> = {
  h: "主場",
  a: "作客",
  risp: "RISP",
};

type Row = {
  personId: number;
  name: string;
  season: HittingStats;
  splits: Partial<Record<SitCode, SituationSplit | null>>;
};

export default async function SplitsPage() {
  const hitters = await getTeamHitting();
  const top = [...hitters]
    .filter((h) => (h.hitting?.plateAppearances ?? 0) >= 150)
    .sort((a, b) => (b.hitting?.plateAppearances ?? 0) - (a.hitting?.plateAppearances ?? 0))
    .slice(0, 10);

  const rows: Row[] = await Promise.all(
    top.map(async (h) => {
      const entries = await Promise.all(
        SIT_CODES.map(async (code) => [code, await getPlayerSplits(h.personId, code)] as const)
      );
      return {
        personId: h.personId,
        name: h.name,
        season: h.hitting!,
        splits: Object.fromEntries(entries) as Row["splits"],
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">進階打擊數據</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          前 10 打者（按打席）· 主客場及得點圈有人表現
        </p>
      </div>

      <Card
        title="情境打擊數據"
        subtitle="AVG（PA）· 得點圈有人 = 一、二、三壘有跑者時打擊"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="py-2 pr-4 font-medium">排名</th>
                <th className="py-2 pr-4 font-medium">球員</th>
                <th className="py-2 pr-4 text-right font-medium">全季</th>
                {SIT_CODES.map((code) => (
                  <th key={code} className="py-2 pr-4 text-right font-medium">
                    {SIT_LABELS[code]}
                  </th>
                ))}
                <th className="py-2 text-right font-medium">OPS（全季）</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.personId}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-400">{i + 1}</td>
                  <td className="py-2.5 pr-4 font-semibold">{r.name}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <SplitCell avg={r.season.avg} pa={r.season.plateAppearances} />
                  </td>
                  {SIT_CODES.map((code) => {
                    const sp = r.splits[code];
                    return (
                      <td key={code} className="py-2.5 pr-4 text-right">
                        {sp ? (
                          <SplitCell avg={sp.avg} pa={sp.plateAppearances} />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2.5 text-right">
                    <span className="tabular-nums font-semibold">{formatAvg(r.season.ops)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          數據為情境 splits（MLB person-level statSplits）。冇數據（—）= API 未有該情境記錄。
          {SIT_TIPS_ROW}
        </p>
      </Card>
    </div>
  );
}

const SIT_TIPS_ROW = SIT_CODES.map((c) => `${SIT_LABELS[c]}=${SIT_TIPS[c]}`).join(" · ");

function SplitCell({ avg, pa }: { avg: number; pa: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="tabular-nums font-semibold">{formatAvg(avg)}</span>
      <span className="text-[10px] tabular-nums text-zinc-400">{pa} PA</span>
    </span>
  );
}
