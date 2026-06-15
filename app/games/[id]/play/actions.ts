"use server";

import { insertScore } from "@/lib/supabase/scores";

export async function saveScoreAction(
  gameId: string,
  playerName: string,
  score: number
): Promise<void> {
  await insertScore(gameId, playerName, score);
}
