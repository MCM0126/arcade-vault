import { createClient } from "@/lib/supabase/server";

export async function insertScore(
  gameId: string,
  playerName: string,
  score: number,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scores")
    .insert({
      game_id: gameId,
      player_name: playerName,
      score,
      user_id: userId,
    });
  if (error) throw new Error(error.message);
}

export async function getGlobalTop20(): Promise<
  { game_id: string; player_name: string; best_score: number }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_global_top20");
  if (error) throw new Error(error.message);
  return (data ?? []) as {
    game_id: string;
    player_name: string;
    best_score: number;
  }[];
}

export async function getGameTop10(
  gameId: string
): Promise<{ player_name: string; best_score: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_game_top10", {
    p_game_id: gameId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as { player_name: string; best_score: number }[];
}

export async function getAllGameStats(): Promise<
  { game_id: string; best_score: number; total_plays: number }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_all_game_stats");
  if (error) throw new Error(error.message);
  return (data ?? []) as {
    game_id: string;
    best_score: number;
    total_plays: number;
  }[];
}

export async function getGameStats(
  gameId: string
): Promise<{ best_score: number; total_plays: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_game_stats", {
    p_game_id: gameId,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as {
    best_score: number;
    total_plays: number;
  }[];
  return rows[0] ?? { best_score: 0, total_plays: 0 };
}
