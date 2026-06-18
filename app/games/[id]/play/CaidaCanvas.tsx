"use client";

import {
  memo,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { startCaida } from "@/lib/games/caida";
import type {
  GameHandle,
  GameCanvasHandle,
  GameCanvasProps,
} from "@/lib/games/types";

function dispatch(code: string, type: "keydown" | "keyup") {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const CaidaCanvas = memo(
  forwardRef<GameCanvasHandle, GameCanvasProps>(
    ({ callbacks, paused }: GameCanvasProps, ref) => {
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
      const handleRef = useRef<GameHandle | null>(null);

      useEffect(() => {
        const canvas = canvasRef.current;
        const nextCanvas = nextCanvasRef.current;
        if (!canvas || !nextCanvas) return;
        const handle = startCaida(canvas, nextCanvas, callbacks);
        handleRef.current = handle;
        return () => handle.cleanup();
      }, []); // callbacks es estable (useMemo en el padre)

      useEffect(() => {
        handleRef.current?.setPaused(paused);
      }, [paused]);

      useImperativeHandle(ref, () => ({
        restart() {
          handleRef.current?.restart();
        },
      }));

      return (
        <div className="caida-wrap">
          <div className="caida-board-wrap">
            <canvas
              ref={canvasRef}
              width={300}
              height={600}
              className="asteroids-canvas"
            />
          </div>

          <div className="caida-next-wrap">
            <span className="caida-next-label">SIGUIENTE</span>
            <canvas
              ref={nextCanvasRef}
              width={120}
              height={120}
              className="caida-next-canvas"
            />
          </div>

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
                      onPointerDown={() => dispatch("ArrowDown", "keydown")}
                      onPointerUp={() => dispatch("ArrowDown", "keyup")}
                      onPointerLeave={() => dispatch("ArrowDown", "keyup")}
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
  )
);

CaidaCanvas.displayName = "CaidaCanvas";

export default CaidaCanvas;
