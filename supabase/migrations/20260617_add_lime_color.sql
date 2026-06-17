ALTER TABLE games DROP CONSTRAINT games_color_check;
ALTER TABLE games ADD CONSTRAINT games_color_check CHECK (color = ANY (ARRAY['cyan'::text, 'magenta'::text, 'green'::text, 'yellow'::text, 'lime'::text]));
