"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { startAsteroids } from "@/lib/games/asteroids";
import type {
  GameCallbacks,
  GameHandle,
  GameCanvasHandle,
  GameCanvasProps,
} from "@/lib/games/types";
import type { SkinId } from "@/lib/games/skins";

// Legacy alias so any existing import of AsteroidsCanvasHandle keeps working.
export type AsteroidsCanvasHandle = GameCanvasHandle;

const TOUCH_BUTTONS = [
  { label: "◄", code: "ArrowLeft", row: 0 },
  { label: "▲", code: "ArrowUp", row: 0 },
  { label: "►", code: "ArrowRight", row: 0 },
  { label: "FIRE", code: "Space", row: 1 },
];

function dispatch(code: string, type: "keydown" | "keyup") {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const AsteroidsCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ callbacks, paused, skin }: GameCanvasProps, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const handleRef = useRef<GameHandle | null>(null);
    // Track the initial skin for engine startup.
    const skinRef = useRef<SkinId | undefined>(skin);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const handle = startAsteroids(canvas, callbacks, skinRef.current);
      handleRef.current = handle;
      return () => handle.cleanup();
    }, []); // callbacks is stable (useMemo in parent) — intentional empty deps

    // Hot-swap the palette whenever the skin prop changes — no restart needed.
    useEffect(() => {
      if (skin !== undefined) {
        skinRef.current = skin;
        handleRef.current?.setSkin?.(skin);
      }
    }, [skin]);

    useEffect(() => {
      handleRef.current?.setPaused(paused);
    }, [paused]);

    useImperativeHandle(ref, () => ({
      restart() {
        handleRef.current?.restart();
      },
    }));

    const row0 = TOUCH_BUTTONS.filter((b) => b.row === 0);
    const row1 = TOUCH_BUTTONS.filter((b) => b.row === 1);

    return (
      <div className="asteroids-wrap">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="asteroids-canvas"
        />
        <div className="touch-controls">
          <div className="touch-row">
            {row0.map(({ label, code }) => (
              <button
                key={code}
                className="touch-btn"
                onPointerDown={() => dispatch(code, "keydown")}
                onPointerUp={() => dispatch(code, "keyup")}
                onPointerLeave={() => dispatch(code, "keyup")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="touch-row touch-row-fire">
            {row1.map(({ label, code }) => (
              <button
                key={code}
                className="touch-btn touch-btn-fire"
                onPointerDown={() => dispatch(code, "keydown")}
                onPointerUp={() => dispatch(code, "keyup")}
                onPointerLeave={() => dispatch(code, "keyup")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

AsteroidsCanvas.displayName = "AsteroidsCanvas";

export default AsteroidsCanvas;
