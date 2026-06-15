import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame } from "@/lib/supabase/games";
import { getGameTop10, getGameStats } from "@/lib/supabase/scores";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params;

  const [game, scores, stats] = await Promise.all([
    getGame(id),
    getGameTop10(id),
    getGameStats(id),
  ]);

  if (!game) notFound();

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover} />
        </div>

        <div className="detail-info" style={{ marginTop: 20 }}>
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>

          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long_desc}</p>

          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">
                {stats.total_plays.toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: "var(--magenta)",
                  textShadow: "0 0 6px rgba(255,0,110,0.5)",
                }}
              >
                {stats.best_score.toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link href={`/games/${game.id}/play`} className="btn xl pulse">
              ▶&nbsp; JUGAR AHORA
            </Link>
            <Link href="/" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {scores.length === 0 ? (
            <div
              className="pixel"
              style={{
                color: "var(--ink-faint)",
                fontSize: 11,
                letterSpacing: "0.15em",
                paddingTop: 24,
                textAlign: "center",
              }}
            >
              SIN PUNTUACIONES AÚN
            </div>
          ) : (
            scores.map((r, i) => (
              <div
                key={r.player_name + i}
                className={
                  "lb-row" +
                  (i === 0
                    ? " top1"
                    : i === 1
                      ? " top2"
                      : i === 2
                        ? " top3"
                        : "")
                }
              >
                <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
                <div className="pl">{r.player_name}</div>
                <div className="sc">{r.best_score.toLocaleString("es-ES")}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
