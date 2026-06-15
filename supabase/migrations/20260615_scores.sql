CREATE TABLE scores (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id     text        NOT NULL,
  player_name text        NOT NULL,
  score       integer     NOT NULL CHECK (score >= 0),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX scores_game_id_idx ON scores (game_id);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_select_public" ON scores
  FOR SELECT USING (true);

CREATE POLICY "scores_insert_public" ON scores
  FOR INSERT WITH CHECK (true);
