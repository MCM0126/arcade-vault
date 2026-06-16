"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { startSnake } from "@/lib/games/snake";
import type {
  GameHandle,
  GameCanvasHandle,
  GameCanvasProps,
} from "@/lib/games/types";

function dispatch(code: string, type: "keydown" | "keyup") {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const SnakeCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ callbacks, paused }: GameCanvasProps, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const handleRef = useRef<GameHandle | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const handle = startSnake(canvas, callbacks);
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
            <button
              className="touch-btn"
              onPointerDown={() => dispatch("ArrowUp", "keydown")}
              onPointerUp={() => dispatch("ArrowUp", "keyup")}
              onPointerLeave={() => dispatch("ArrowUp", "keyup")}
            >
              ▲
            </button>
          </div>
          <div className="touch-row">
            <button
              className="touch-btn"
              onPointerDown={() => dispatch("ArrowLeft", "keydown")}
              onPointerUp={() => dispatch("ArrowLeft", "keyup")}
              onPointerLeave={() => dispatch("ArrowLeft", "keyup")}
            >
              ◄
            </button>
            <button
              className="touch-btn"
              onPointerDown={() => dispatch("ArrowDown", "keydown")}
              onPointerUp={() => dispatch("ArrowDown", "keyup")}
              onPointerLeave={() => dispatch("ArrowDown", "keyup")}
            >
              ▼
            </button>
            <button
              className="touch-btn"
              onPointerDown={() => dispatch("ArrowRight", "keydown")}
              onPointerUp={() => dispatch("ArrowRight", "keyup")}
              onPointerLeave={() => dispatch("ArrowRight", "keyup")}
            >
              ►
            </button>
          </div>
        </div>
      </div>
    );
  }
);

SnakeCanvas.displayName = "SnakeCanvas";

export default SnakeCanvas;
