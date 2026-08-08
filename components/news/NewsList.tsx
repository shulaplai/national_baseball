import { Card } from "@/components/ui/Card";
import { formatShortDate } from "@/lib/formatters";
import { getNews } from "@/lib/news";

/** 首頁最新消息卡 — ESPN MLB 新聞，冇新聞就唔渲染 */
export async function NewsList() {
  const news = await getNews();
  if (news.length === 0) return null;

  return (
    <Card title="最新消息" subtitle="ESPN MLB">
      <ul className="space-y-3">
        {news.map((n) => (
          <li key={n.id}>
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <p className="text-sm font-semibold text-zinc-900 transition-colors group-hover:text-[#AB0003] dark:text-zinc-100 dark:group-hover:text-[#e04249]">
                {n.headline}
              </p>
              {n.description && (
                <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {n.description}
                </p>
              )}
              {n.published && (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {formatShortDate(n.published.slice(0, 10))}
                </p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
