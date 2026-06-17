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

// ---------------------------------------------------------------------------
// Frogger
// ---------------------------------------------------------------------------

export const FROGGER_SKINS: GameSkins = {
  classic: {
    "fondo-safe": "#1a4a1a",
    "fondo-road": "#1a1a1a",
    "fondo-river": "#0a2a5a",
    "fondo-goal": "#0a3a0a",
    "lane-divider": "#444444",
    "goal-mouth": "#0d5c0d",
    "goal-border": "#ffd700",
    "goal-frog": "#5aff5a",
    "car-a": "#e63946",
    "car-b": "#ffd166",
    "car-c": "#118ab2",
    "car-wheel": "#222222",
    "truck-body": "#6b6b6b",
    "truck-cab": "#999999",
    "truck-wheel": "#222222",
    "log-body": "#7c4a1e",
    "log-grain": "#5a3310",
    "turtle-body": "#2d8a2d",
    "turtle-ring": "#1a5c1a",
    "frog-body": "#39d939",
    "frog-eye-white": "#ffffff",
    "frog-eye-pupil": "#000000",
    "frog-leg": "#39d939",
    "hud-bg": "rgba(0,0,0,0.6)",
    "hud-text": "#ffffff",
    "hud-life": "#39d939",
    "timer-bar-bg": "#333333",
    "timer-ok": "#39d939",
    "timer-warn": "#ffd166",
    "timer-danger": "#e63946",
    "pause-bg": "rgba(0,0,0,0.55)",
    "pause-text": "#ffd166",
  },

  neon: {
    "fondo-safe": "#051a05",
    "fondo-road": "#0a0a0a",
    "fondo-river": "#020d1a",
    "fondo-goal": "#031403",
    "lane-divider": "#1a3a1a",
    "goal-mouth": "#0a3d0a",
    "goal-border": "#f5ff00",
    "goal-frog": "#00ff88",
    "car-a": "#ff006e",
    "car-b": "#f5ff00",
    "car-c": "#00f5ff",
    "car-wheel": "#111111",
    "truck-body": "#1a1a2e",
    "truck-cab": "#3a3a5e",
    "truck-wheel": "#111111",
    "log-body": "#2a1a08",
    "log-grain": "#1a0d04",
    "turtle-body": "#00cc44",
    "turtle-ring": "#008833",
    "frog-body": "#39ff14",
    "frog-eye-white": "#e0ffe0",
    "frog-eye-pupil": "#001a00",
    "frog-leg": "#39ff14",
    "hud-bg": "rgba(0,5,0,0.75)",
    "hud-text": "#00f5ff",
    "hud-life": "#39ff14",
    "timer-bar-bg": "#111111",
    "timer-ok": "#39ff14",
    "timer-warn": "#f5ff00",
    "timer-danger": "#ff006e",
    "pause-bg": "rgba(0,10,0,0.70)",
    "pause-text": "#f5ff00",
  },

  retro: {
    "fondo-safe": "#000000",
    "fondo-road": "#111111",
    "fondo-river": "#0000aa",
    "fondo-goal": "#000000",
    "lane-divider": "#555555",
    "goal-mouth": "#005500",
    "goal-border": "#ffff00",
    "goal-frog": "#00ff00",
    "car-a": "#ff0000",
    "car-b": "#ffff00",
    "car-c": "#00aaaa",
    "car-wheel": "#000000",
    "truck-body": "#555555",
    "truck-cab": "#aaaaaa",
    "truck-wheel": "#000000",
    "log-body": "#aa5500",
    "log-grain": "#7f3f00",
    "turtle-body": "#00aa00",
    "turtle-ring": "#005500",
    "frog-body": "#00ff00",
    "frog-eye-white": "#ffffff",
    "frog-eye-pupil": "#000000",
    "frog-leg": "#00ff00",
    "hud-bg": "rgba(0,0,0,0.8)",
    "hud-text": "#ffffff",
    "hud-life": "#00ff00",
    "timer-bar-bg": "#333333",
    "timer-ok": "#00ff00",
    "timer-warn": "#ffff00",
    "timer-danger": "#ff0000",
    "pause-bg": "rgba(0,0,0,0.75)",
    "pause-text": "#ffff00",
  },
};

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
