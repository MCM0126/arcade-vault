"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/lib/types";
import { GAME_CANVASES } from "@/lib/games/registry";
import type { GameCallbacks, GameCanvasHandle } from "@/lib/games/types";
import type { SkinId } from "@/lib/games/skins";
import { DEFAULT_SKIN } from "@/lib/games/skins";
import SkinSelector from "./SkinSelector";
import { saveScoreAction } from "./actions";

const SKIN_STORAGE_KEY = "arcade-vault:skin";

interface Props {
  game: Game;
}

export default function GamePlayer({ game }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [skin, setSkin] = useState<SkinId>(DEFAULT_SKIN);

  // Read persisted skin preference on first mount (client-only).
  useEffect(() => {
    const saved = localStorage.getItem(SKIN_STORAGE_KEY) as SkinId | null;
    if (saved === "classic" || saved === "neon" || saved === "retro") {
      setSkin(saved);
    }
  }, []);

  const astRef = useRef<GameCanvasHandle | null>(null);

  const callbacks = useMemo<GameCallbacks>(
    () => ({
      onScore: (s) => setScore(s),
      onLives: (l) => setLives(l),
      onLevel: (lv) => setLevel(lv),
      onGameOver: (s) => {
        setScore(s);
        setOver(true);
      },
    }),
    []
  );

  // True when a real game engine is registered for this game.
  const Canvas = GAME_CANVASES[game.id] ?? null;

  // CRT mock auto-score — only runs for games without a real engine.
  useEffect(() => {
    if (Canvas || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220
    );
    return () => clearInterval(t);
  }, [Canvas, over, paused]);

  useEffect(() => {
    if (Canvas) return;
    if (score > 0 && score % 2500 < 100) setLevel((l) => l + 1);
  }, [Canvas, score]);

  const saveScore = async () => {
    await saveScoreAction(game.id, name, score);
    setSaved(true);
  };

  const restart = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    astRef.current?.restart();
  };

  // Persist skin choice and restart the engine so the new palette takes effect.
  const handleSkinChange = (next: SkinId) => {
    setSkin(next);
    localStorage.setItem(SKIN_STORAGE_KEY, next);
    // Restart so startAsteroids is re-called with the new skin.
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    astRef.current?.restart();
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="flex gap-6 flex-wrap">
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name || "—"}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">{game.id === "caida" ? "Líneas" : "Vidas"}</div>
            <div className="v">
              {game.id === "caida" ? lives : "♥ ".repeat(lives).trim() || "—"}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={() => setOver(true)}>
            FIN
          </button>
          <button
            className="btn ghost"
            onClick={() => router.push(`/games/${game.id}`)}
          >
            SALIR
          </button>
          {Canvas && (
            <SkinSelector
              gameId={game.id}
              skin={skin}
              onChange={handleSkinChange}
            />
          )}
        </div>
      </div>

      {Canvas ? (
        <Canvas
          ref={astRef}
          callbacks={callbacks}
          paused={paused}
          skin={skin}
        />
      ) : (
        <div className="crt">
          <div className="crt-screen">
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
              <div className="player-ship" />
            </div>
            {paused && (
              <div
                className="crt-content"
                style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
              >
                <div>
                  <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                    EN PAUSA
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      marginTop: 10,
                      letterSpacing: "0.16em",
                    }}
                  >
                    PULSA REANUDAR PARA CONTINUAR
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="crt-bottom">
            <span className="led">SEÑAL OK</span>
            <span>{game.title} · CRT-83 · 60 HZ</span>
            <span>CARGA · 1MB</span>
          </div>
        </div>
      )}

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 30))
                  }
                  placeholder="TU NOMBRE"
                  maxLength={30}
                />
                <button
                  className="btn yellow"
                  onClick={saveScore}
                  disabled={name.trim() === ""}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button className="btn magenta" onClick={() => router.push("/")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
