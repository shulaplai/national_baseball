import Link from "next/link";
import { NAV } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#14225A] text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#AB0003] text-sm font-black">
            WSH
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-wide">
              華盛頓國民隊
            </span>
            <span className="block text-[11px] uppercase tracking-widest text-white/70">
              Nationals 數據站
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
