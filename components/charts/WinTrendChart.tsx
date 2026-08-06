"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WinTrendPoint = {
  label: string; // "6/1"
  wins: number; // 累積勝場
  losses: number; // 累積敗場
};

export function WinTrendChart({ data }: { data: WinTrendPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
          <XAxis
            dataKey="label"
            interval={Math.max(1, Math.floor(data.length / 8))}
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-zinc-400"
          />
          <YAxis
            allowDecimals={false}
            domain={[0, "dataMax + 10"]}
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-zinc-400"
          />
          <Tooltip
            formatter={(value, name) => {
              const label = name === "wins" ? "勝" : "敗";
              return [String(value), label];
            }}
            labelFormatter={(label) => `日期 ${label}`}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--foreground)",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          />
          <Line
            type="monotone"
            dataKey="wins"
            name="wins"
            stroke="#14225A"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="losses"
            name="losses"
            stroke="#AB0003"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
