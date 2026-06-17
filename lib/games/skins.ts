/**
 * Skin system for Arcade Vault.
 *
 * Each game has three palette variants: classic (default), neon, and retro.
 * The motor receives a palette at start time and reads every color from it —
 * no hardcoded color literals remain in the engine files.
 *
 * To add a new game: define its GameSkins constant below and export it.
 */

export type SkinId = "neon" | "retro" | "classic";

export const DEFAULT_SKIN: SkinId = "classic";

/** A palette maps semantic role names to CSS color strings (hex / rgba). */
export type GamePalette = Record<string, string>;

/** All three palettes for one game. */
export type GameSkins = Record<SkinId, GamePalette>;

// ---------------------------------------------------------------------------
// Asteroides
// ---------------------------------------------------------------------------

export const ASTEROIDES_SKINS: GameSkins = {
  classic: {
    fondo: "#000000",
    nave: "#00ffff",
    bala: "#00ffff",
    asteroide: "#aaaaaa",
    "particula-explosion": "#ffaa00",
    "particula-nave": "#00ffff",
    "powerup-borde-a": "#ffff00",
    "powerup-borde-b": "#ffaa00",
    "powerup-texto": "#ffff00",
    "hud-primario": "#00ffff",
    "hud-powerup-activo": "#ffff00",
    "overlay-pausa-fondo": "rgba(0,0,0,0.55)",
  },

  neon: {
    fondo: "#05050f",
    nave: "#00f5ff",
    bala: "#ff006e",
    asteroide: "#8888cc",
    "particula-explosion": "#f5ff00",
    "particula-nave": "#00f5ff",
    "powerup-borde-a": "#00ff88",
    "powerup-borde-b": "#00cc66",
    "powerup-texto": "#00ff88",
    "hud-primario": "#00f5ff",
    "hud-powerup-activo": "#f5ff00",
    "overlay-pausa-fondo": "rgba(0,5,20,0.70)",
  },

  retro: {
    fondo: "#000000",
    nave: "#ffffff",
    bala: "#ffffff",
    asteroide: "#00ffff",
    "particula-explosion": "#ff00ff",
    "particula-nave": "#ffffff",
    "powerup-borde-a": "#ffff00",
    "powerup-borde-b": "#ff00ff",
    "powerup-texto": "#ffff00",
    "hud-primario": "#00ff00",
    "hud-powerup-activo": "#ffff00",
    "overlay-pausa-fondo": "rgba(0,0,0,0.75)",
  },
};
