import { getGames } from "@/lib/supabase/games";
import HomeContent from "@/components/HomeContent";

export default async function HomePage() {
  const games = await getGames();
  return <HomeContent previewGames={games.slice(0, 6)} />;
}
