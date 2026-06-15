-- Inserta el juego 'caida' (CAÍDA, tipo Tetris) en el catálogo de Arcade Vault.
-- La fila ya estaba documentada en 20260615_games.sql, pero esa migración nunca
-- se aplicó completa contra la base de datos remota (solo insertó 'asteroides').
-- Esta migración inserta únicamente la fila que falta, con los mismos valores.
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order)
VALUES (
  'caida',
  'CAÍDA',
  'Encaja las piezas antes de que el techo te aplaste.',
  'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.',
  'PUZZLE',
  'cover-tetro',
  'magenta',
  2
)
ON CONFLICT (id) DO NOTHING;
