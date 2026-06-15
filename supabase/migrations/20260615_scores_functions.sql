CREATE OR REPLACE FUNCTION get_global_top20()
RETURNS TABLE(game_id text, player_name text, best_score bigint)
LANGUAGE sql STABLE AS $$
  SELECT game_id, player_name, MAX(score) AS best_score
  FROM scores
  GROUP BY game_id, player_name
  ORDER BY best_score DESC
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION get_game_top10(p_game_id text)
RETURNS TABLE(player_name text, best_score bigint)
LANGUAGE sql STABLE AS $$
  SELECT player_name, MAX(score) AS best_score
  FROM scores
  WHERE game_id = p_game_id
  GROUP BY player_name
  ORDER BY best_score DESC
  LIMIT 10;
$$;
