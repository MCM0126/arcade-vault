import { createClient } from "@/lib/supabase/server";

export async function insertScore(
  gameId: string,
  playerName: string,
  score: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player_name: playerName, score });
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
