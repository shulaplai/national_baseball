import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      {title && (
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {subtitle && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
