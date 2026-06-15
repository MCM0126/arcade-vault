"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { startCaida } from "@/lib/games/caida";
import type {
  GameHandle,
  GameCanvasHandle,
  GameCanvasProps,
} from "@/lib/games/types";

const TOUCH_BUTTONS = [
  { label: "◄", code: "ArrowLeft", row: 0 },
  { label: "▲", code: "ArrowUp", row: 0 },
  { label: "►", code: "ArrowRight", row: 0 },
  { label: "▼", code: "ArrowDown", row: 1 },
  { label: "DROP", code: "Space", row: 1 },
];

function dispatch(code: string, type: "keydown" | "keyup") {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const CaidaCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
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

    const row0 = TOUCH_BUTTONS.filter((b) => b.row === 0);
    const row1 = TOUCH_BUTTONS.filter((b) => b.row === 1);

    return (
      <div className="caida-wrap">
        <div className="caida-board-wrap">
          <canvas
            ref={canvasRef}
            width={300}
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
            <div className="touch-row">
              {row1.map(({ label, code }) => (
                <button
                  key={code}
                  className={
                    code === "Space" ? "touch-btn touch-btn-fire" : "touch-btn"
                  }
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

        <div className="caida-next-wrap">
          <span className="caida-next-label">SIGUIENTE</span>
          <canvas
            ref={nextCanvasRef}
            width={120}
            height={120}
            className="caida-next-canvas"
          />
        </div>
      </div>
    );
  }
);

CaidaCanvas.displayName = "CaidaCanvas";

export default CaidaCanvas;
