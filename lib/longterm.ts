// 長期分析報告 — 讀取 content/longterm/*.mdx（frontmatter + markdown 正文）
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "longterm");

export type LongTermReport = {
  slug: string;
  title: string;
  date: string;
  updatedAt: string;
  tags: string[];
  summary: string;
  author: string;
  content: string; // 冇 frontmatter 嘅 markdown 正文
};

export function getLongTermReports(): LongTermReport[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  const reports = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    // gray-matter 會將 YAML 日期解析成 Date object，統一轉返 "YYYY-MM-DD" 字串
    const toDateStr = (v: unknown): string => {
      if (v instanceof Date) {
        const m = v.toISOString().slice(0, 10);
        return m === "1970-01-01" ? "" : m;
      }
      return typeof v === "string" ? v : "";
    };
    return {
      slug,
      title: (data.title as string) ?? slug,
      date: toDateStr(data.date),
      updatedAt: toDateStr(data.updatedAt) || toDateStr(data.date),
      tags: (data.tags as string[]) ?? [],
      summary: (data.summary as string) ?? "",
      author: (data.author as string) ?? "WSH 數據站",
      content,
    };
  });
  return reports.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getLongTermReport(slug: string): LongTermReport | undefined {
  return getLongTermReports().find((r) => r.slug === slug);
}
