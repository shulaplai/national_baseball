import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CACHE_TAG } from "@/lib/constants";

/**
 * 手動觸發重新生成所有 MLB 數據快取。
 * 用法：GET /api/revalidate?secret=xxx
 * GitHub Actions 定時調用，確保數據（賽果/排名）保持最新。
 *
 * 保安：必須帶正確 secret（環境變數 REVALIDATE_SECRET）。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 'max'：標記為 stale，下一個訪客會觸發背景重新生成（stale-while-revalidate）
  revalidateTag(CACHE_TAG, "max");

  return NextResponse.json({
    revalidated: true,
    tag: CACHE_TAG,
    now: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
