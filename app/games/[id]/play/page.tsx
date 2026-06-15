import { notFound } from "next/navigation";
import { getGame } from "@/lib/supabase/games";
import GamePlayer from "./GamePlayer";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayPage({ params }: Props) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();
  return <GamePlayer game={game} />;
}
