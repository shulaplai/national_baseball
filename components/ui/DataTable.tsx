"use client";

import { useState } from "react";
import Link from "next/link";

export type Column<T> = {
  key: string;
  label: string;
  /** 排序取嘅值；冇就唔 sortable */
  accessor?: (row: T) => number | string | null;
  render?: (row: T) => React.ReactNode;
  className?: string; // header class
  cellClassName?: string; // cell class
  align?: "left" | "right";
  /** 數值用唔用 tabular-nums（monospace 數字） */
  tabular?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  defaultSortKey,
  defaultSortDir = "desc",
  rowLink,
}: {
  columns: Column<T>[];
  rows: T[];
  defaultSortKey: string;
  defaultSortDir?: "asc" | "desc";
  rowLink?: (row: T) => string;
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);

  const col = columns.find((c) => c.key === sortKey);
  const sorted = [...rows].sort((a, b) => {
    const av = col?.accessor ? col.accessor(a) : null;
    const bv = col?.accessor ? col.accessor(b) : null;
    if (av == null || bv == null) return 0;
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    const as = String(av);
    const bs = String(bv);
    return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
  });

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
            {columns.map((c) => {
              const active = c.key === sortKey;
              const sortable = Boolean(c.accessor);
              return (
                <th
                  key={c.key}
                  className={`whitespace-nowrap py-2 pr-4 font-medium ${
                    c.align === "right" ? "text-right" : ""
                  } ${sortable ? "cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-200" : ""} ${c.className ?? ""}`}
                  onClick={sortable ? () => handleSort(c.key) : undefined}
                >
                  {c.label}
                  {active && (
                    <span className="ml-0.5 inline-block text-[10px] text-[#AB0003]">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const rowContent = (
              <>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap py-2 pr-4 ${
                      c.align === "right" ? "text-right" : ""
                    } ${c.tabular ? "tabular-nums" : ""} ${c.cellClassName ?? ""}`}
                  >
                    {c.render ? c.render(row) : (row as Record<string, unknown>)[c.key] as React.ReactNode}
                  </td>
                ))}
              </>
            );
            const href = rowLink?.(row);
            return (
              <tr
                key={i}
                className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                  href ? "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50" : ""
                }`}
              >
                {href ? (
                  <Link href={href} className="contents">
                    {rowContent}
                  </Link>
                ) : (
                  rowContent
                )}
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-zinc-400">
                冇符合條件嘅球員
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
