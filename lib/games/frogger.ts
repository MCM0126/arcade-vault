import type { GameCallbacks, GameHandle } from "./types";
import {
  FROGGER_SKINS,
  DEFAULT_SKIN,
  type SkinId,
  type GamePalette,
} from "./skins";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLS = 16;
const ROWS = 14;
const CELL = 40; // px per cell

const CANVAS_W = COLS * CELL; // 640
const CANVAS_H = ROWS * CELL; // 560

// Row indices (0 = top)
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

const JUMP_MS = 120; // animation duration per hop
const ROUND_TIME_BASE = 15_000; // ms — time per round at level 1
const SPEED_SCALE_PER_LEVEL = 0.15; // +15 % speed per level

// Goal slot column starts (each slot is 2 cols wide, 5 slots = cols 1,4,7,10,13)
const GOAL_COLS = [1, 4, 7, 10, 13] as const;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type Direction = "up" | "down" | "left" | "right";

interface Entity {
  col: number; // fractional — world position in cell units
  width: number; // in cells
  type: "car" | "truck" | "log" | "turtle";
  submerged?: boolean;
  submergeTimer?: number; // ms remaining in current submerge phase
  submergePhase?: "visible" | "under"; // current turtle phase
}

interface Lane {
  row: number;
  speedCells: number; // cells per ms
  dir: 1 | -1; // +1 = left→right, -1 = right→left
  entities: Entity[];
}

interface Frog {
  col: number; // integer grid position
  row: number;
  animating: boolean;
  animT: number; // ms elapsed in current jump animation
  targetCol: number;
  targetRow: number;
  prevCol: number; // used for interpolation during jump
  prevRow: number;
}

// ---------------------------------------------------------------------------
// Lane builder
// ---------------------------------------------------------------------------

function buildLanes(level: number): Lane[] {
  const s = 1 + (level - 1) * SPEED_SCALE_PER_LEVEL;
  const lanes: Lane[] = [];

  // Road: rows 8-12 (ROW_ROAD_TOP..ROW_ROAD_BOT)
  const roadDefs: {
    speed: number;
    dir: 1 | -1;
    type: "car" | "truck";
    count: number;
    width: number;
  }[] = [
    { speed: 0.0025, dir: -1, type: "car", count: 3, width: 1 },
    { speed: 0.004, dir: 1, type: "truck", count: 2, width: 2 },
    { speed: 0.003, dir: -1, type: "car", count: 3, width: 1 },
    { speed: 0.002, dir: 1, type: "car", count: 4, width: 1 },
    { speed: 0.0035, dir: -1, type: "truck", count: 2, width: 3 },
  ];
  roadDefs.forEach((def, i) => {
    const row = ROW_ROAD_BOT - i;
    const gap = Math.floor(COLS / def.count);
    const entities: Entity[] = Array.from({ length: def.count }, (_, k) => ({
      col: k * gap,
      width: def.width,
      type: def.type,
    }));
    lanes.push({ row, speedCells: def.speed * s, dir: def.dir, entities });
  });

  // River: rows 1-6 (ROW_RIVER_TOP..ROW_RIVER_BOT)
  const riverDefs: {
    speed: number;
    dir: 1 | -1;
    type: "log" | "turtle";
    count: number;
    width: number;
  }[] = [
    { speed: 0.002, dir: 1, type: "log", count: 3, width: 3 },
    { speed: 0.0015, dir: -1, type: "turtle", count: 3, width: 2 },
    { speed: 0.003, dir: 1, type: "log", count: 2, width: 4 },
    { speed: 0.0025, dir: -1, type: "turtle", count: 4, width: 2 },
    { speed: 0.002, dir: 1, type: "log", count: 3, width: 2 },
    { speed: 0.0018, dir: -1, type: "turtle", count: 3, width: 3 },
  ];
  riverDefs.forEach((def, i) => {
    const row = ROW_RIVER_BOT - i;
    const gap = Math.floor(COLS / def.count);
    const entities: Entity[] = Array.from({ length: def.count }, (_, k) => {
      const e: Entity = { col: k * gap, width: def.width, type: def.type };
      if (def.type === "turtle") {
        e.submergePhase = "visible";
        e.submergeTimer = 3000 + Math.random() * 1000;
      }
      return e;
    });
    lanes.push({ row, speedCells: def.speed * s, dir: def.dir, entities });
  });

  return lanes;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function cx(col: number) {
  return col * CELL;
}
function cy(row: number) {
  return row * CELL;
}

function drawZones(ctx: CanvasRenderingContext2D, palette: GamePalette) {
  // Safe areas (start + mid)
  ctx.fillStyle = palette["fondo-safe"];
  ctx.fillRect(0, cy(ROW_SAFE_MID), CANVAS_W, CELL);
  ctx.fillRect(0, cy(ROW_START), CANVAS_W, CELL);

  // Road
  ctx.fillStyle = palette["fondo-road"];
  for (let r = ROW_ROAD_TOP; r <= ROW_ROAD_BOT; r++) {
    ctx.fillRect(0, cy(r), CANVAS_W, CELL);
  }
  // Lane dividers
  ctx.strokeStyle = palette["lane-divider"];
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  for (let r = ROW_ROAD_TOP + 1; r <= ROW_ROAD_BOT; r++) {
    ctx.beginPath();
    ctx.moveTo(0, cy(r));
    ctx.lineTo(CANVAS_W, cy(r));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // River
  ctx.fillStyle = palette["fondo-river"];
  for (let r = ROW_RIVER_TOP; r <= ROW_RIVER_BOT; r++) {
    ctx.fillRect(0, cy(r), CANVAS_W, CELL);
  }

  // Goal row
  ctx.fillStyle = palette["fondo-goal"];
  ctx.fillRect(0, cy(ROW_GOALS), CANVAS_W, CELL);
}

function drawGoals(
  ctx: CanvasRenderingContext2D,
  occupied: Set<number>,
  palette: GamePalette
) {
  GOAL_COLS.forEach((gc) => {
    const x = cx(gc);
    const y = cy(ROW_GOALS);
    // Mouth opening
    ctx.fillStyle = palette["goal-mouth"];
    ctx.fillRect(x, y, CELL * 2, CELL);
    ctx.strokeStyle = palette["goal-border"];
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, CELL * 2 - 2, CELL - 2);
    if (occupied.has(gc)) {
      // Small frog silhouette
      ctx.fillStyle = palette["goal-frog"];
      ctx.beginPath();
      ctx.ellipse(x + CELL, y + CELL / 2, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawEntity(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  lane: Lane,
  palette: GamePalette
) {
  const x = cx(e.col);
  const y = cy(lane.row);
  const w = e.width * CELL;

  switch (e.type) {
    case "car": {
      const colorIdx = Math.floor(Math.abs(e.col) * 3) % 3;
      ctx.fillStyle =
        colorIdx === 0
          ? palette["car-a"]
          : colorIdx === 1
            ? palette["car-b"]
            : palette["car-c"];
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 6, w - 4, CELL - 12, 6);
      ctx.fill();
      ctx.fillStyle = palette["car-wheel"];
      ctx.beginPath();
      ctx.arc(x + 6, y + CELL - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w - 10, y + CELL - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "truck": {
      ctx.fillStyle = palette["truck-body"];
      ctx.fillRect(x + 2, y + 4, w - 4, CELL - 8);
      ctx.fillStyle = palette["truck-cab"];
      ctx.fillRect(x + 2, y + 4, CELL - 2, CELL - 8);
      ctx.fillStyle = palette["truck-wheel"];
      ctx.beginPath();
      ctx.arc(x + 8, y + CELL - 7, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w - 12, y + CELL - 7, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "log": {
      ctx.fillStyle = palette["log-body"];
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 5, w - 2, CELL - 10, 4);
      ctx.fill();
      // Grain lines
      ctx.strokeStyle = palette["log-grain"];
      ctx.lineWidth = 1;
      for (let i = 1; i < e.width; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * CELL, y + 6);
        ctx.lineTo(x + i * CELL, y + CELL - 6);
        ctx.stroke();
      }
      break;
    }
    case "turtle": {
      const alpha = e.submergePhase === "under" ? 0.35 : 1;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < e.width; i++) {
        const tx = x + i * CELL + CELL / 2;
        const ty = y + CELL / 2;
        ctx.fillStyle = palette["turtle-body"];
        ctx.beginPath();
        ctx.arc(tx, ty, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = palette["turtle-ring"];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tx, ty, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
}

function drawFrog(
  ctx: CanvasRenderingContext2D,
  frog: Frog,
  palette: GamePalette
) {
  let drawCol: number;
  let drawRow: number;

  if (frog.animating && JUMP_MS > 0) {
    const t = Math.min(frog.animT / JUMP_MS, 1);
    drawCol = frog.prevCol + (frog.targetCol - frog.prevCol) * t;
    drawRow = frog.prevRow + (frog.targetRow - frog.prevRow) * t;
  } else {
    drawCol = frog.col;
    drawRow = frog.row;
  }

  const x = cx(drawCol) + CELL / 2;
  const y = cy(drawRow) + CELL / 2;

  // Body
  ctx.fillStyle = palette["frog-body"];
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  [
    [-7, -6],
    [7, -6],
  ].forEach(([ex, ey]) => {
    ctx.fillStyle = palette["frog-eye-white"];
    ctx.beginPath();
    ctx.arc(x + ex, y + ey, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette["frog-eye-pupil"];
    ctx.beginPath();
    ctx.arc(x + ex + 1, y + ey, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Legs (extended during jump)
  if (frog.animating) {
    ctx.strokeStyle = palette["frog-leg"];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 8);
    ctx.lineTo(x - 16, y + 16);
    ctx.moveTo(x + 10, y + 8);
    ctx.lineTo(x + 16, y + 16);
    ctx.stroke();
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  lives: number,
  level: number,
  timeLeft: number,
  roundTime: number,
  palette: GamePalette
) {
  // Background strip
  ctx.fillStyle = palette["hud-bg"];
  ctx.fillRect(0, 0, CANVAS_W, 20);

  ctx.font = "bold 13px monospace";
  ctx.fillStyle = palette["hud-text"];
  ctx.textBaseline = "top";

  // Score top-left
  ctx.textAlign = "left";
  ctx.fillText(`${score}`, 6, 3);

  // Level top-center
  ctx.textAlign = "center";
  ctx.fillText(`LV ${level}`, CANVAS_W / 2, 3);

  // Lives top-right (green circles)
  const lifeR = 6;
  const lifeY = 10;
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = palette["hud-life"];
    ctx.beginPath();
    ctx.arc(CANVAS_W - 10 - i * (lifeR * 2 + 3), lifeY, lifeR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Time bar (bottom of HUD strip = top 20px)
  const ratio = Math.max(0, timeLeft / roundTime);
  const barColor =
    ratio > 0.5
      ? palette["timer-ok"]
      : ratio > 0.25
        ? palette["timer-warn"]
        : palette["timer-danger"];
  ctx.fillStyle = palette["timer-bar-bg"];
  ctx.fillRect(0, 18, CANVAS_W, 4);
  ctx.fillStyle = barColor;
  ctx.fillRect(0, 18, CANVAS_W * ratio, 4);
}

// ---------------------------------------------------------------------------
// Collision / support helpers
// ---------------------------------------------------------------------------

function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
  for (const lane of lanes) {
    if (lane.row < ROW_ROAD_TOP || lane.row > ROW_ROAD_BOT) continue;
    if (lane.row !== frog.row) continue;
    for (const e of lane.entities) {
      if (frog.col >= e.col && frog.col < e.col + e.width) return true;
    }
  }
  return false;
}

function getSupport(frog: Frog, lanes: Lane[]): Entity | null {
  for (const lane of lanes) {
    if (lane.row < ROW_RIVER_TOP || lane.row > ROW_RIVER_BOT) continue;
    if (lane.row !== frog.row) continue;
    for (const e of lane.entities) {
      if (frog.col >= e.col && frog.col < e.col + e.width) {
        if (e.type === "turtle" && e.submergePhase === "under") return null;
        return e;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main exported engine
// ---------------------------------------------------------------------------

export function startFrogger(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  skin?: SkinId
): GameHandle {
  const ctx = canvas.getContext("2d")!;
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // Active palette — mutated in place by setSkin() for hot-swap without restart.
  const activePalette: GamePalette = {
    ...FROGGER_SKINS[skin ?? DEFAULT_SKIN],
  };

  let paused = false;

  let running = true;
  let rafId = 0;
  let lastTs = 0;

  let score = 0;
  let lives = 3;
  let level = 1;
  let roundTime = ROUND_TIME_BASE;
  let timeLeft = roundTime;

  let lanes = buildLanes(level);
  const occupiedGoals = new Set<number>();

  let frog: Frog = {
    col: Math.floor(COLS / 2),
    row: ROW_START,
    animating: false,
    animT: 0,
    targetCol: Math.floor(COLS / 2),
    targetRow: ROW_START,
    prevCol: Math.floor(COLS / 2),
    prevRow: ROW_START,
  };

  let pendingDir: Direction | null = null;

  function emitScore(n: number) {
    if (n !== score) {
      score = n;
      callbacks.onScore(score);
    }
  }
  function emitLives(n: number) {
    lives = n;
    callbacks.onLives(lives);
  }

  // -- Death / round management --

  function resetFrog() {
    frog = {
      col: Math.floor(COLS / 2),
      row: ROW_START,
      animating: false,
      animT: 0,
      targetCol: Math.floor(COLS / 2),
      targetRow: ROW_START,
      prevCol: Math.floor(COLS / 2),
      prevRow: ROW_START,
    };
    pendingDir = null;
    timeLeft = roundTime;
  }

  function killFrog() {
    const newLives = lives - 1;
    emitLives(newLives);
    if (newLives <= 0) {
      running = false;
      callbacks.onGameOver(score);
      return;
    }
    resetFrog();
  }

  function completeRound() {
    occupiedGoals.clear();
    level++;
    roundTime = Math.max(8_000, ROUND_TIME_BASE - (level - 1) * 1_000);
    lanes = buildLanes(level);
    callbacks.onLevel(level);
    resetFrog();
  }

  function checkGoal() {
    if (frog.row !== ROW_GOALS) return;
    const slot = GOAL_COLS.find((gc) => frog.col === gc || frog.col === gc + 1);
    if (slot === undefined) {
      killFrog();
      return;
    }
    if (occupiedGoals.has(slot)) {
      killFrog();
      return;
    }
    occupiedGoals.add(slot);
    const bonus = Math.floor((timeLeft / roundTime) * 500);
    emitScore(score + 50 + bonus);
    if (occupiedGoals.size === GOAL_COLS.length) {
      completeRound();
      return;
    }
    resetFrog();
  }

  // -- Input --

  function onKeyDown(e: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      pendingDir = map[e.code];
    }
  }

  document.addEventListener("keydown", onKeyDown);

  // -- Update --

  function update(dt: number) {
    // Advance entities
    for (const lane of lanes) {
      for (const e of lane.entities) {
        e.col += lane.speedCells * lane.dir * dt;
        if (lane.dir === 1 && e.col > COLS) e.col = -e.width;
        if (lane.dir === -1 && e.col < -e.width) e.col = COLS;
      }
      // Turtle submersion cycle
      if (lane.entities[0]?.type === "turtle") {
        for (const e of lane.entities) {
          if (e.submergeTimer === undefined) continue;
          e.submergeTimer -= dt;
          if (e.submergeTimer <= 0) {
            if (e.submergePhase === "visible") {
              e.submergePhase = "under";
              e.submergeTimer = 1_500;
            } else {
              e.submergePhase = "visible";
              e.submergeTimer = 3_000 + Math.random() * 1_000;
            }
          }
        }
      }
    }

    // Frog jump animation
    if (frog.animating) {
      frog.animT += dt;
      if (frog.animT >= JUMP_MS) {
        frog.col = frog.targetCol;
        frog.row = frog.targetRow;
        frog.animating = false;
        frog.animT = 0;
        resolveCell();
      }
    } else {
      // Start jump from pending input
      if (pendingDir) {
        const dir = pendingDir;
        pendingDir = null;
        const nc =
          dir === "left"
            ? frog.col - 1
            : dir === "right"
              ? frog.col + 1
              : frog.col;
        const nr =
          dir === "up"
            ? frog.row - 1
            : dir === "down"
              ? frog.row + 1
              : frog.row;
        if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
          frog.prevCol = frog.col;
          frog.prevRow = frog.row;
          frog.targetCol = nc;
          frog.targetRow = nr;
          frog.animating = true;
          frog.animT = 0;
          if (nr < frog.row) emitScore(score + 10); // advancing up
        }
      }
      // River drift
      if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
        const support = getSupport(frog, lanes);
        if (!support) {
          killFrog();
          return;
        }
        const driftLane = lanes.find((l) => l.row === frog.row)!;
        frog.col += driftLane.speedCells * driftLane.dir * dt;
        // Out of bounds → die
        if (frog.col < 0 || frog.col >= COLS) {
          killFrog();
          return;
        }
      }
      // Road collision (only when not animating and on road)
      if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
        if (checkRoadCollision(frog, lanes)) {
          killFrog();
          return;
        }
      }
    }

    // Timer
    if (frog.row !== ROW_START && frog.row !== ROW_SAFE_MID) {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        killFrog();
        return;
      }
    }
  }

  function resolveCell() {
    if (frog.row === ROW_GOALS) {
      checkGoal();
      return;
    }
    if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
      if (checkRoadCollision(frog, lanes)) {
        killFrog();
        return;
      }
    }
  }

  // -- Draw --

  function draw() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawZones(ctx, activePalette);
    drawGoals(ctx, occupiedGoals, activePalette);
    for (const lane of lanes) {
      for (const e of lane.entities) drawEntity(ctx, e, lane, activePalette);
    }
    drawFrog(ctx, frog, activePalette);
    drawHUD(ctx, score, lives, level, timeLeft, roundTime, activePalette);

    if (paused) {
      ctx.fillStyle = activePalette["pause-bg"];
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = activePalette["pause-text"];
      ctx.font = "bold 28px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EN PAUSA", CANVAS_W / 2, CANVAS_H / 2);
    }
  }

  // -- Loop --

  function loop(ts: number) {
    if (!running) return;
    if (lastTs === 0) lastTs = ts;
    const dt = Math.min(ts - lastTs, 50); // cap dt to avoid spiral on tab-switch
    lastTs = ts;
    if (!paused) update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else if (running && !paused) {
      lastTs = 0;
      rafId = requestAnimationFrame(loop);
    }
  }

  document.addEventListener("visibilitychange", onVisibilityChange);

  rafId = requestAnimationFrame(loop);
  callbacks.onScore(0);
  callbacks.onLives(3);
  callbacks.onLevel(1);

  return {
    cleanup() {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
    setPaused(p: boolean) {
      paused = p;
    },
    restart() {
      running = false;
      cancelAnimationFrame(rafId);
      score = 0;
      lives = 3;
      level = 1;
      roundTime = ROUND_TIME_BASE;
      timeLeft = roundTime;
      lanes = buildLanes(1);
      occupiedGoals.clear();
      pendingDir = null;
      callbacks.onScore(0);
      callbacks.onLives(3);
      callbacks.onLevel(1);
      lastTs = 0;
      running = true;
      resetFrog();
      rafId = requestAnimationFrame(loop);
    },
    setSkin(s: SkinId) {
      Object.assign(activePalette, FROGGER_SKINS[s]);
    },
  };
}
