import { getGames } from "@/lib/supabase/games";
import { getAllGameStats } from "@/lib/supabase/scores";
import type { GameWithStats } from "@/lib/types";
import GamesGrid from "./GamesGrid";

export default async function LibraryPage() {
  const [games, statsRows] = await Promise.all([getGames(), getAllGameStats()]);

  const statsMap = Object.fromEntries(
    statsRows.map((s) => [
      s.game_id,
      { best_score: s.best_score, total_plays: s.total_plays },
    ])
  );

  const gamesWithStats: GameWithStats[] = games.map((g) => ({
    ...g,
    best_score: statsMap[g.id]?.best_score ?? 0,
    total_plays: statsMap[g.id]?.total_plays ?? 0,
  }));

  return <GamesGrid games={gamesWithStats} />;
}
