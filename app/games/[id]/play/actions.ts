"use server";

import { createClient } from "@/lib/supabase/server";
import { insertScore } from "@/lib/supabase/scores";

export async function saveScoreAction(
  gameId: string,
  playerName: string,
  score: number
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await insertScore(gameId, playerName, score, user.id);
}
