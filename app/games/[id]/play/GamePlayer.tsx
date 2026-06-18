"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Game } from "@/lib/types";
import { GAME_CANVASES } from "@/lib/games/registry";
import type { GameCallbacks, GameCanvasHandle } from "@/lib/games/types";
import type { SkinId } from "@/lib/games/skins";
import { DEFAULT_SKIN } from "@/lib/games/skins";
import SkinSelector from "./SkinSelector";
import { saveScoreAction } from "./actions";
import { getSession, getProfile } from "@/lib/supabase/auth";
import type { Profile } from "@/lib/supabase/types";

const SKIN_STORAGE_KEY = "arcade-vault:skin";

interface Props {
  game: Game;
}

export default function GamePlayer({ game }: Props) {
  const router = useRouter();

  // HUD values are kept in refs and written directly to the DOM to avoid
  // triggering React re-renders on every game tick.
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const scoreElRef = useRef<HTMLDivElement>(null);
  const livesElRef = useRef<HTMLDivElement>(null);
  const levelElRef = useRef<HTMLDivElement>(null);

  // Captured once at game-over so the modal can show the final score even
  // after scoreRef is reset by a subsequent restart().
  const [finalScore, setFinalScore] = useState(0);

  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skin, setSkin] = useState<SkinId>(DEFAULT_SKIN);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Read persisted skin preference on first mount (client-only).
  useEffect(() => {
    const stored = localStorage.getItem(SKIN_STORAGE_KEY) as SkinId | null;
    if (stored === "classic" || stored === "neon" || stored === "retro") {
      setSkin(stored);
    }
  }, []);

  // Load session + profile on mount so we know whether the user can save scores.
  useEffect(() => {
    getSession().then((session) => {
      if (session) getProfile(session.user.id).then(setProfile);
    });
  }, []);

  const astRef = useRef<GameCanvasHandle | null>(null);

  const callbacks = useMemo<GameCallbacks>(
    () => ({
      onScore: (s) => {
        scoreRef.current = s;
        if (scoreElRef.current)
          scoreElRef.current.textContent = s.toLocaleString("es-ES");
      },
      onLives: (l) => {
        livesRef.current = l;
        if (livesElRef.current)
          livesElRef.current.textContent =
            game.id === "caida"
              ? String(l)
              : "♥ ".repeat(Math.max(0, l)).trim() || "—";
      },
      onLevel: (lv) => {
        levelRef.current = lv;
        if (levelElRef.current)
          levelElRef.current.textContent = String(lv).padStart(2, "0");
      },
      onGameOver: (s) => {
        setFinalScore(s);
        setOver(true);
      },
    }),
    // scoreRef/livesRef/levelRef and their El counterparts are stable refs;
    // game.id is a stable prop — safe to capture with empty deps.
    []
  );

  // True when a real game engine is registered for this game.
  const Canvas = GAME_CANVASES[game.id] ?? null;

  // CRT mock auto-score — only runs for games without a real engine.
  // Level-up logic is fused into the same interval to avoid a reactive
  // useEffect dependency on score state.
  useEffect(() => {
    if (Canvas || over || paused) return;
    const t = setInterval(() => {
      const next = scoreRef.current + Math.floor(10 + Math.random() * 90);
      scoreRef.current = next;
      if (scoreElRef.current)
        scoreElRef.current.textContent = next.toLocaleString("es-ES");
      if (next > 0 && next % 2500 < 100) {
        const nextLevel = levelRef.current + 1;
        levelRef.current = nextLevel;
        if (levelElRef.current)
          levelElRef.current.textContent = String(nextLevel).padStart(2, "0");
      }
    }, 220);
    return () => clearInterval(t);
  }, [Canvas, over, paused]);

  const saveScore = async () => {
    if (!profile) return;
    await saveScoreAction(game.id, profile.username, finalScore);
    setSaved(true);
  };

  const restart = () => {
    // Reset refs so they're coherent before the engine's restart() fires its
    // own callbacks (which will also update the DOM via onScore/onLives/onLevel).
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    setPaused(false);
    setOver(false);
    setSaved(false);
    setFinalScore(0);
    astRef.current?.restart();
  };

  // Persist skin choice and hot-swap the palette in real time.
  const handleSkinChange = (next: SkinId) => {
    setSkin(next);
    localStorage.setItem(SKIN_STORAGE_KEY, next);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="flex gap-6 flex-wrap">
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {profile ? profile.username.toUpperCase() : "INVITADO"}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v" ref={scoreElRef}>
              0
            </div>
          </div>
          <div className="hud-stat lives">
            <div className="l">{game.id === "caida" ? "Líneas" : "Vidas"}</div>
            <div className="v" ref={livesElRef}>
              {game.id === "caida" ? "3" : "♥ ♥ ♥"}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v" ref={levelElRef}>
              01
            </div>
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
            <div className="final">{finalScore.toLocaleString("es-ES")}</div>

            {profile ? (
              // Authenticated — save directly with profile username
              !saved ? (
                <div className="input-row">
                  <button className="btn yellow" onClick={saveScore}>
                    GUARDAR PUNTUACIÓN
                  </button>
                </div>
              ) : (
                <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
              )
            ) : (
              // Guest — prompt to register
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  letterSpacing: "0.1em",
                }}
              >
                <div className="mono" style={{ marginBottom: 10 }}>
                  ¿QUIERES GUARDAR TU PUNTUACIÓN?
                </div>
                <div
                  style={{ display: "flex", gap: 8, justifyContent: "center" }}
                >
                  <Link href="/auth" className="btn">
                    CREAR CUENTA
                  </Link>
                  <Link href="/auth" className="btn ghost">
                    INICIAR SESIÓN
                  </Link>
                </div>
              </div>
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
