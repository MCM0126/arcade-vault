"use client";

/**
 * Registry that maps game IDs to their Canvas components.
 *
 * To add a new game: import its Canvas component and add one entry here.
 * GamePlayer.tsx reads this map — no other platform file needs to change.
 */

import React from "react";
import type { GameCanvasProps, GameCanvasHandle } from "./types";
import AsteroidsCanvas from "@/app/games/[id]/play/AsteroidsCanvas";
import SnakeCanvas from "@/app/games/[id]/play/SnakeCanvas";

type CanvasComponent = React.ForwardRefExoticComponent<
  GameCanvasProps & React.RefAttributes<GameCanvasHandle>
>;

// Partial so missing keys return `undefined` — GamePlayer.tsx checks for this.
export const GAME_CANVASES: Partial<Record<string, CanvasComponent>> = {
  asteroides: AsteroidsCanvas,
  snake: SnakeCanvas,
};
