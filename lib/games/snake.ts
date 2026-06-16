import type { GameCallbacks, GameHandle } from "./types";

const W = 800;
const H = 600;
const CELL = 20;
const COLS = W / CELL; // 40
const ROWS = H / CELL; // 30
const FRUITS_PER_LEVEL = 5;
const BASE_TICK_MS = 160;
const MIN_TICK_MS = 70;
const TICK_STEP_MS = 8;

interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Point {
  x: number;
  y: number;
}

const FRUIT_SPRITES: Record<string, SpriteRect> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

const FRUIT_NAMES = Object.keys(FRUIT_SPRITES);

const DIRS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

function isOpposite(a: Point, b: Point): boolean {
  return a.x === -b.x && a.y === -b.y;
}

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function startSnake(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks
): GameHandle {
  const ctx = canvas.getContext("2d")!;

  const img = new Image();
  img.src = "/snake/fruits.png";
  let imgLoaded = false;

  let score = 0;
  let level = 1;
  let eaten = 0;
  let snake: Point[];
  let dir: Point;
  let nextDir: Point;
  let food: Point;
  let foodSprite: string;
  let tickIntervalMs: number;
  let tickAcc = 0;
  let state: "playing" | "gameover" = "playing";
  let paused = false;

  function placeFood() {
    const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
    let x: number, y: number;
    do {
      x = randInt(COLS);
      y = randInt(ROWS);
    } while (occupied.has(`${x},${y}`));
    food = { x, y };
    foodSprite = FRUIT_NAMES[randInt(FRUIT_NAMES.length)];
  }

  function initGame() {
    score = 0;
    level = 1;
    eaten = 0;
    tickIntervalMs = BASE_TICK_MS;
    tickAcc = 0;
    state = "playing";
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    placeFood();
    callbacks.onScore(0);
    callbacks.onLives(1);
    callbacks.onLevel(1);
  }

  function tick() {
    if (!isOpposite(nextDir, dir)) dir = nextDir;

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    if (
      newHead.x < 0 ||
      newHead.x >= COLS ||
      newHead.y < 0 ||
      newHead.y >= ROWS
    ) {
      gameOver();
      return;
    }

    if (snake.some((p) => p.x === newHead.x && p.y === newHead.y)) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      callbacks.onScore(score);
      eaten++;
      if (eaten % FRUITS_PER_LEVEL === 0) {
        level++;
        callbacks.onLevel(level);
        tickIntervalMs = Math.max(
          MIN_TICK_MS,
          BASE_TICK_MS - (level - 1) * TICK_STEP_MS
        );
      }
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    state = "gameover";
    callbacks.onLives(0);
    callbacks.onGameOver(score);
  }

  function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    if (imgLoaded) {
      const spr = FRUIT_SPRITES[foodSprite];
      ctx.drawImage(
        img,
        spr.x,
        spr.y,
        spr.w,
        spr.h,
        food.x * CELL,
        food.y * CELL,
        CELL,
        CELL
      );
    }

    snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#9fffa0" : "#22dd55";
      ctx.fillRect(p.x * CELL, p.y * CELL, CELL, CELL);
    });

    ctx.font = "16px monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#0ff";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE: ${score}`, 10, 10);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, W / 2, 10);

    if (paused) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#0ff";
      ctx.font = "bold 42px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EN PAUSA", W / 2, H / 2);
    }
  }

  let lastTime = 0;

  function loop(time: number) {
    if (lastTime === 0) lastTime = time;
    const dt = time - lastTime;
    lastTime = time;

    if (!paused && state === "playing") {
      tickAcc += dt;
      while (tickAcc >= tickIntervalMs) {
        tick();
        tickAcc -= tickIntervalMs;
        if (state !== "playing") break;
      }
    }

    draw();
    rafId = requestAnimationFrame(loop);
  }

  function onKeyDown(e: Event) {
    const ke = e as KeyboardEvent;
    const d = DIRS[ke.code];
    if (!d) return;
    e.preventDefault();
    nextDir = d;
  }

  document.addEventListener("keydown", onKeyDown);

  initGame();
  img.onload = () => {
    imgLoaded = true;
  };
  let rafId = requestAnimationFrame(loop);

  return {
    cleanup() {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", onKeyDown);
    },
    setPaused(p: boolean) {
      paused = p;
    },
    restart() {
      initGame();
    },
  };
}
