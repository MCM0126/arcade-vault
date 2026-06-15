-- Tabla de catálogo de juegos
CREATE TABLE games (
  id         text PRIMARY KEY,
  title      text NOT NULL,
  short_desc text NOT NULL,
  long_desc  text NOT NULL,
  cat        text NOT NULL CHECK (cat IN ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  cover      text NOT NULL,
  color      text NOT NULL CHECK (color IN ('cyan', 'magenta', 'green', 'yellow')),
  sort_order int  NOT NULL DEFAULT 0
);

-- RLS: solo lectura pública, sin escritura desde cliente
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_public_read" ON games FOR SELECT USING (true);

-- Datos iniciales
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order) VALUES
  ('bloque-buster', 'BLOQUE BUSTER', 'Rebota la pelota y destruye muros de neón.', 'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?', 'ARCADE', 'cover-bricks', 'cyan', 1),
  ('caida', 'CAÍDA', 'Encaja las piezas antes de que el techo te aplaste.', 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.', 'PUZZLE', 'cover-tetro', 'magenta', 2),
  ('serpentina', 'SERPENTINA', 'Crece sin morder tu propia cola.', 'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.', 'ARCADE', 'cover-snake', 'green', 3),
  ('gloton', 'GLOTÓN', 'Devora puntos y escapa de los fantasmas.', 'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.', 'ARCADE', 'cover-glot', 'yellow', 4),
  ('invasores', 'INVASORES', 'Defiende el planeta de filas alienígenas.', 'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.', 'SHOOTER', 'cover-invaders', 'green', 5),
  ('rocas', 'ROCAS', 'Pulveriza asteroides en gravedad cero.', 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.', 'SHOOTER', 'cover-rocas', 'yellow', 6),
  ('asteroides', 'ASTEROIDES', 'Pulveriza rocas espaciales en gravedad cero.', 'Tu nave triangular flota en el vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Recoge el power-up 3x para triplicar tu cadencia de fuego.', 'SHOOTER', 'cover-rocas', 'yellow', 7),
  ('ranaria', 'RANARIA', 'Cruza la autopista de pixeles.', 'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.', 'ARCADE', 'cover-rana', 'green', 8),
  ('duelo-pixel', 'DUELO PIXEL', 'Dos paletas. Una pelota. Reflejos máximos.', 'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.', 'VERSUS', 'cover-duelo', 'cyan', 9);

-- RPC: stats de un juego específico
CREATE OR REPLACE FUNCTION get_game_stats(p_game_id text)
RETURNS TABLE(best_score int, total_plays int) AS $$
  SELECT COALESCE(MAX(score), 0)::int, COUNT(*)::int
  FROM scores WHERE game_id = p_game_id;
$$ LANGUAGE sql STABLE;

-- RPC: stats de todos los juegos (un solo round-trip)
CREATE OR REPLACE FUNCTION get_all_game_stats()
RETURNS TABLE(game_id text, best_score int, total_plays int) AS $$
  SELECT game_id, MAX(score)::int, COUNT(*)::int
  FROM scores GROUP BY game_id;
$$ LANGUAGE sql STABLE;
