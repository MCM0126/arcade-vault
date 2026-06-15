import Link from "next/link";
import { getGlobalTop20, getGameTop10 } from "@/lib/supabase/scores";
import { getGames } from "@/lib/supabase/games";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function HallOfFamePage() {
  const games = await getGames();
  const gameIdToTitle = Object.fromEntries(games.map((g) => [g.id, g.title]));

  const [globalTop, perGameResults] = await Promise.all([
    getGlobalTop20(),
    Promise.all(games.map((g) => getGameTop10(g.id))),
  ]);

  const perGame = games.map((g, i) => ({ game: g, rows: perGameResults[i] }));

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      {/* Global top 20 */}
      <section className="hall-section">
        <div className="hall-section-title">TOP 20 GLOBAL</div>
        <div className="hall-table">
          <div className="th">
            <div>RANGO</div>
            <div>JUEGO</div>
            <div>JUGADOR</div>
            <div>PUNTUACIÓN</div>
          </div>
          {globalTop.length === 0 ? (
            <div className="hall-empty">
              Aún no hay puntuaciones registradas. ¡Sé el primero en entrar al
              salón!
            </div>
          ) : (
            globalTop.map((row, i) => (
              <div
                key={`${row.game_id}-${row.player_name}-${i}`}
                className={`tr${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="rk">
                  {i < 3 ? (
                    <span className="hall-rank-medal">{MEDALS[i]}</span>
                  ) : (
                    `#${String(i + 1).padStart(2, "0")}`
                  )}
                </div>
                <div className="pl">
                  {gameIdToTitle[row.game_id] ?? row.game_id}
                </div>
                <div className="pl">{row.player_name}</div>
                <div className="sc">
                  {row.best_score.toLocaleString("es-ES")}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <hr className="hall-divider" />

      {/* Per-game top 10 */}
      <div className="hall-games-label">TOP 10 POR JUEGO</div>
      <div className="hall-games-grid">
        {perGame.map(({ game, rows }) => (
          <div key={game.id} className="hall-game-card">
            <div className="hall-section-subtitle">{game.title}</div>
            {rows.length === 0 ? (
              <div className="hall-empty">Sin puntuaciones todavía.</div>
            ) : (
              <div className="hall-table">
                <div
                  className="th"
                  style={{ gridTemplateColumns: "60px 1fr 110px" }}
                >
                  <div>RANGO</div>
                  <div>JUGADOR</div>
                  <div>PUNTUACIÓN</div>
                </div>
                {rows.map((row, i) => (
                  <div
                    key={`${row.player_name}-${i}`}
                    className={`tr${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}
                    style={{
                      gridTemplateColumns: "60px 1fr 110px",
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    <div className="rk">
                      {i < 3 ? (
                        <span className="hall-rank-medal">{MEDALS[i]}</span>
                      ) : (
                        `#${String(i + 1).padStart(2, "0")}`
                      )}
                    </div>
                    <div className="pl">{row.player_name}</div>
                    <div className="sc">
                      {row.best_score.toLocaleString("es-ES")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link href="/" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
