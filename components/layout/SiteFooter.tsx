import { SITE } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          {SITE.name} — 數據來源：<a
            href="https://statsapi.mlb.com"
            className="text-[#AB0003] underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            MLB Stats API
          </a>{" "}
          （免費公開數據）
        </p>
        <p className="text-xs">
          唔係官方網站，數據僅供參考。棒球術語保留英文（AVG、HR、ERA 等）。
        </p>
      </div>
    </footer>
  );
}
