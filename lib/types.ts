export type GameCat = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "green" | "yellow";

export interface Game {
  id: string;
  title: string;
  short_desc: string;
  long_desc: string;
  cat: GameCat;
  cover: string;
  color: GameColor;
  sort_order: number;
}

export interface GameWithStats extends Game {
  best_score: number;
  total_plays: number;
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}
