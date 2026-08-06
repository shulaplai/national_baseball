import type { Game } from "@/lib/types";
import { formatShortDate, formatGameDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";

export function GameRow({ game }: { game: Game }) {
  const opponent = game.isNatsHome ? game.awayTeamName : game.homeTeamName;
  const natsScore = game.isNatsHome ? game.homeScore : game.awayScore;
  const oppScore = game.isNatsHome ? game.awayScore : game.homeScore;

  return (
    <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800">
      <div className="text-center">
        <p className="text-sm font-semibold tabular-nums">{formatShortDate(game.date)}</p>
        <p className="text-[10px] text-zinc-400">{game.isNatsHome ? "主" : "客"}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
          vs {opponent}
          <span className="ml-2 text-xs text-zinc-400">{game.venue}</span>
        </p>
        {game.status === "Scheduled" && game.gameDateTime && (
          <p className="text-xs text-zinc-400">
            {formatGameDateTime(game.gameDateTime)}
          </p>
        )}
      </div>

      <div className="text-right">
        {game.status === "Final" ? (
          <span className="flex items-center justify-end gap-2">
            <span className={`text-sm font-bold tabular-nums ${game.natsWon ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}>
              {natsScore}-{oppScore}
            </span>
            <Badge tone={game.natsWon ? "win" : "loss"}>{(game.natsWon ? "W" : "L")}</Badge>
          </span>
        ) : game.status === "Live" ? (
          <Badge tone="live">直播中</Badge>
        ) : game.status === "Postponed" ? (
          <Badge tone="neutral">延期</Badge>
        ) : (
          <Badge tone="scheduled">未賽</Badge>
        )}
      </div>
    </div>
  );
}
