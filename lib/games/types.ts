/**
 * Generic game-engine interfaces shared by all canvas games on Arcade Vault.
 *
 * Every game module exports `start<Game>(canvas, callbacks): GameHandle`.
 * Every canvas React component accepts `GameCanvasProps` and exposes
 * `GameCanvasHandle` through `forwardRef` / `useImperativeHandle`.
 */

import type { SkinId } from "./skins";

/** Push-based callbacks the game engine fires when state changes. */
export interface GameCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onGameOver(finalScore: number): void;
}

/** Control surface returned by `start<Game>()`. */
export interface GameHandle {
  cleanup(): void;
  setPaused(paused: boolean): void;
  restart(): void;
  /** Hot-swap the visual palette without restarting the game session. */
  setSkin?(skin: SkinId): void;
}

/** The ref interface exposed by every `<*Canvas>` component. */
export interface GameCanvasHandle {
  restart(): void;
}

/** Props accepted by every `<*Canvas>` component. */
export interface GameCanvasProps {
  callbacks: GameCallbacks;
  paused: boolean;
  /** Visual palette variant. Defaults to 'classic' when omitted. */
  skin?: SkinId;
}
