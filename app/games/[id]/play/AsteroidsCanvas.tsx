"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { startAsteroids } from "@/lib/games/asteroids";
import type {
  AsteroidsCallbacks,
  AsteroidsHandle,
} from "@/lib/games/asteroids";

interface Props {
  callbacks: AsteroidsCallbacks;
  paused: boolean;
}

export interface AsteroidsCanvasHandle {
  restart(): void;
}

const TOUCH_BUTTONS = [
  { label: "◄", code: "ArrowLeft", row: 0 },
  { label: "▲", code: "ArrowUp", row: 0 },
  { label: "►", code: "ArrowRight", row: 0 },
  { label: "FIRE", code: "Space", row: 1 },
];

function dispatch(code: string, type: "keydown" | "keyup") {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const AsteroidsCanvas = forwardRef<AsteroidsCanvasHandle, Props>(
  ({ callbacks, paused }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const handleRef = useRef<AsteroidsHandle | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const handle = startAsteroids(canvas, callbacks);
      handleRef.current = handle;
      return () => handle.cleanup();
    }, []); // callbacks is stable (useMemo in parent) — intentional empty deps

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
