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

    return (
      <div className="asteroids-wrap">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="asteroids-canvas"
        />
        <div className="touch-controls">
          <div className="gp">
            <div className="gp-body">
              <div className="gp-col gp-col-left">
                <div className="gp-dpad">
                  <button
                    className="dp dp-up"
                    onPointerDown={() => dispatch("ArrowUp", "keydown")}
                    onPointerUp={() => dispatch("ArrowUp", "keyup")}
                    onPointerLeave={() => dispatch("ArrowUp", "keyup")}
                  >
                    <svg className="dp-arrow" viewBox="0 0 24 24">
                      <path d="M12 4 L20 16 L4 16 Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    className="dp dp-right"
                    onPointerDown={() => dispatch("ArrowRight", "keydown")}
                    onPointerUp={() => dispatch("ArrowRight", "keyup")}
                    onPointerLeave={() => dispatch("ArrowRight", "keyup")}
                  >
                    <svg className="dp-arrow" viewBox="0 0 24 24">
                      <path d="M8 4 L20 12 L8 20 Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    className="dp dp-down"
                    onPointerDown={() => dispatch("KeyS", "keydown")}
                    onPointerUp={() => dispatch("KeyS", "keyup")}
                    onPointerLeave={() => dispatch("KeyS", "keyup")}
                  >
                    <svg className="dp-arrow" viewBox="0 0 24 24">
                      <path d="M4 8 L20 8 L12 20 Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    className="dp dp-left"
                    onPointerDown={() => dispatch("ArrowLeft", "keydown")}
                    onPointerUp={() => dispatch("ArrowLeft", "keyup")}
                    onPointerLeave={() => dispatch("ArrowLeft", "keyup")}
                  >
                    <svg className="dp-arrow" viewBox="0 0 24 24">
                      <path d="M16 4 L16 20 L4 12 Z" fill="currentColor" />
                    </svg>
                  </button>
                  <div className="dp-hub">
                    <span className="dp-hub-gem" />
                  </div>
                </div>
              </div>
              <div className="gp-col gp-col-right">
                <div className="gp-actions">
                  <button
                    className="ab a"
                    onPointerDown={() => dispatch("Space", "keydown")}
                    onPointerUp={() => dispatch("Space", "keyup")}
                    onPointerLeave={() => dispatch("Space", "keyup")}
                  >
                    <span className="ab-ring" />
                    <span className="ab-letter">A</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AsteroidsCanvas.displayName = "AsteroidsCanvas";

export default AsteroidsCanvas;
