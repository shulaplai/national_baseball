import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { getLongTermReport, getLongTermReports } from "@/lib/longterm";

// 靜態生成所有報告頁（Cache Components 模式唔用 dynamicParams config）
export function generateStaticParams() {
  return getLongTermReports().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/analysis/longterm/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const report = getLongTermReport(slug);
  return {
    title: report?.title ?? "長期分析報告",
    description: report?.summary,
  };
}

export default async function LongTermReportPage({ params }: PageProps<"/analysis/longterm/[slug]">) {
  const { slug } = await params;
  const report = getLongTermReport(slug);
  if (!report) notFound();

  const { content } = await compileMDX({ source: report.content });

  return (
    <article className="space-y-6">
      <div>
        <Link href="/analysis/longterm" className="text-sm text-[#AB0003] hover:underline">
          ← 全部長期分析
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {report.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#14225A]/10 px-2 py-0.5 text-[11px] font-bold text-[#14225A] dark:bg-[#14225A]/40 dark:text-white"
            >
              {t}
            </span>
          ))}
        </div>
        <h1 className="mt-3 text-3xl font-black">{report.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          更新日期 {report.updatedAt} · 作者 {report.author}
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:leading-7 [&_p]:text-zinc-700 [&_p]:dark:text-zinc-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_strong]:text-zinc-900 [&_strong]:dark:text-white">
          {content}
        </div>
      </div>
    </article>
  );
}
