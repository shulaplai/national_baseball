import type { Metadata } from "next";
import Link from "next/link";
import { getLongTermReports } from "@/lib/longterm";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "長期分析",
  description: "華盛頓國民隊未來 3-5 年戰力展望：農場系統、新秀、合約結構深度分析",
};

export default function LongTermIndexPage() {
  const reports = getLongTermReports();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/analysis" className="text-sm text-[#AB0003] hover:underline">
          ← 返回短期分析
        </Link>
        <h1 className="mt-2 text-2xl font-black">長期分析 · 未來 3-5 年展望</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          農場系統、新秀潛力、薪資結構與 2026-2029 戰力展望
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">未有報告，製作緊。</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((r) => (
            <Link
              key={r.slug}
              href={`/analysis/longterm/${r.slug}`}
              className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#14225A]/10 px-2 py-0.5 text-[11px] font-bold text-[#14225A] dark:bg-[#14225A]/40 dark:text-white"
                  >
                    {t}
                  </span>
                ))}
                <span className="text-xs text-zinc-400">{r.updatedAt}</span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-zinc-900 transition-colors group-hover:text-[#AB0003] dark:text-zinc-100">
                {r.title}
              </h2>
              {r.summary && (
                <p className="mt-2 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {r.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
