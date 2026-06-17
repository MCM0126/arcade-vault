import type { GameCallbacks, GameHandle } from "./types";
import { ASTEROIDES_SKINS, DEFAULT_SKIN } from "./skins";
import type { SkinId, GamePalette } from "./skins";

// Re-export under legacy names so existing imports keep working.
export type AsteroidsCallbacks = GameCallbacks;
export type AsteroidsHandle = GameHandle;

const W = 800;
const H = 600;
const SCORE_BY_SIZE = [0, 100, 50, 25]; // index by size (1=small,2=med,3=large)

function wrap(v: number, lo: number, hi: number): number {
  const r = hi - lo;
  if (v < lo) return v + r;
  if (v > hi) return v - r;
  return v;
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

// ---------------------------------------------------------------------------

class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life = 55;
  private palette: GamePalette;

  constructor(x: number, y: number, angle: number, palette: GamePalette) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * 9;
    this.vy = Math.sin(angle) * 9;
    this.palette = palette;
  }

  update() {
    this.x = wrap(this.x + this.vx, 0, W);
    this.y = wrap(this.y + this.vy, 0, H);
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.palette["bala"];
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------

class Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  rot: number;
  size: number;
  radius: number;
  verts: { x: number; y: number }[];
  private palette: GamePalette;

  constructor(
    x: number,
    y: number,
    size: number,
    palette: GamePalette,
    vx?: number,
    vy?: number
  ) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = size === 3 ? 48 : size === 2 ? 26 : 13;
    this.palette = palette;

    if (vx !== undefined && vy !== undefined) {
      this.vx = vx;
      this.vy = vy;
    } else {
      const spd = rand(0.6, 1.4) * (4 - size);
      const a = rand(0, Math.PI * 2);
      this.vx = Math.cos(a) * spd;
      this.vy = Math.sin(a) * spd;
    }

    this.angle = rand(0, Math.PI * 2);
    this.rot = rand(-0.025, 0.025);

    const n = 9 + randInt(0, 4);
    this.verts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.75, 1.25);
      return { x: Math.cos(a) * r, y: Math.sin(a) * r };
    });
  }

  update() {
    this.x = wrap(this.x + this.vx, 0, W);
    this.y = wrap(this.y + this.vy, 0, H);
    this.angle += this.rot;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.palette["asteroide"];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this.verts.forEach((v, i) =>
      i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)
    );
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------

class Ship {
  x = W / 2;
  y = H / 2;
  vx = 0;
  vy = 0;
  angle = -Math.PI / 2;
  invincible = 180;
  private palette: GamePalette;

  constructor(palette: GamePalette) {
    this.palette = palette;
  }

  update(keys: Set<string>) {
    if (keys.has("ArrowLeft") || keys.has("KeyA")) this.angle -= 0.065;
    if (keys.has("ArrowRight") || keys.has("KeyD")) this.angle += 0.065;
    if (keys.has("ArrowUp") || keys.has("KeyW")) {
      this.vx += Math.cos(this.angle) * 0.22;
      this.vy += Math.sin(this.angle) * 0.22;
    }
    this.vx *= 0.985;
    this.vy *= 0.985;
    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 7) {
      this.vx = (this.vx / spd) * 7;
      this.vy = (this.vy / spd) * 7;
    }
    this.x = wrap(this.x + this.vx, 0, W);
    this.y = wrap(this.y + this.vy, 0, H);
    if (this.invincible > 0) this.invincible--;
  }

  draw(ctx: CanvasRenderingContext2D, frame: number) {
    if (this.invincible > 0 && frame % 6 < 3) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.palette["nave"];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    const a = rand(0, Math.PI * 2);
    const s = rand(1, 4);
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.maxLife = this.life = randInt(20, 45);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------

class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life = 300;
  readonly type = "3x";
  private palette: GamePalette;

  constructor(x: number, y: number, palette: GamePalette) {
    this.x = x;
    this.y = y;
    this.palette = palette;
    const a = rand(0, Math.PI * 2);
    this.vx = Math.cos(a) * rand(0.5, 1.5);
    this.vy = Math.sin(a) * rand(0.5, 1.5);
  }

  update() {
    this.x = wrap(this.x + this.vx, 0, W);
    this.y = wrap(this.y + this.vy, 0, H);
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D, frame: number) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle =
      frame % 20 < 10
        ? this.palette["powerup-borde-a"]
        : this.palette["powerup-borde-b"];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = this.palette["powerup-texto"];
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3×", 0, 0);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------

function spawnAsteroids(lvl: number, palette: GamePalette): Asteroid[] {
  const count = 2 + lvl;
  const list: Asteroid[] = [];
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    do {
      x = Math.random() * W;
      y = Math.random() * H;
    } while (dist(x, y, W / 2, H / 2) < 150);
    list.push(new Asteroid(x, y, 3, palette));
  }
  return list;
}

// ---------------------------------------------------------------------------

export function startAsteroids(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  skin: SkinId = DEFAULT_SKIN
): GameHandle {
  const ctx = canvas.getContext("2d")!;
  const palette = ASTEROIDES_SKINS[skin];

  let score = 0;
  let lives = 3;
  let level = 1;
  let state: "playing" | "dead" | "gameover" = "playing";
  let frame = 0;
  let paused = false;
  let tripleFireTimer = 0;
  let fireTimer = 0;
  let deadTimer = 0;

  let ship: Ship;
  let asteroids: Asteroid[];
  let bullets: Bullet[];
  let particles: Particle[];
  let powerups: PowerUp[];

  const keys = new Set<string>();

  function initGame() {
    score = 0;
    lives = 3;
    level = 1;
    frame = 0;
    tripleFireTimer = 0;
    fireTimer = 0;
    deadTimer = 0;
    state = "playing";
    ship = new Ship(palette);
    asteroids = spawnAsteroids(1, palette);
    bullets = [];
    particles = [];
    powerups = [];
    callbacks.onScore(0);
    callbacks.onLives(3);
    callbacks.onLevel(1);
  }

  function nextLevel() {
    level++;
    callbacks.onLevel(level);
    ship = new Ship(palette);
    bullets = [];
    powerups = [];
    tripleFireTimer = 0;
    fireTimer = 0;
    asteroids = spawnAsteroids(level, palette);
  }

  function explode(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
  }

  function killShip() {
    if (ship.invincible > 0) return;
    explode(ship.x, ship.y, 20, palette["particula-nave"]);
    lives--;
    callbacks.onLives(lives);
    if (lives <= 0) {
      state = "gameover";
      callbacks.onGameOver(score);
    } else {
      state = "dead";
      deadTimer = 120;
    }
  }

  function update() {
    frame++;

    if (state === "dead") {
      deadTimer--;
      particles.forEach((p) => p.update());
      particles = particles.filter((p) => p.life > 0);
      if (deadTimer <= 0) {
        state = "playing";
        ship = new Ship(palette);
        bullets = [];
      }
      return;
    }

    if (state === "gameover") {
      particles.forEach((p) => p.update());
      particles = particles.filter((p) => p.life > 0);
      return;
    }

    // Fire
    if (fireTimer > 0) fireTimer--;
    if (keys.has("Space") && fireTimer === 0) {
      if (tripleFireTimer > 0) {
        [-0.15, 0, 0.15].forEach((spread) =>
          bullets.push(new Bullet(ship.x, ship.y, ship.angle + spread, palette))
        );
      } else {
        bullets.push(new Bullet(ship.x, ship.y, ship.angle, palette));
      }
      fireTimer = tripleFireTimer > 0 ? 7 : 22;
    }
    if (tripleFireTimer > 0) tripleFireTimer--;

    ship.update(keys);

    bullets.forEach((b) => b.update());
    bullets = bullets.filter((b) => b.life > 0);

    asteroids.forEach((a) => a.update());

    particles.forEach((p) => p.update());
    particles = particles.filter((p) => p.life > 0);

    powerups.forEach((pu) => pu.update());
    powerups = powerups.filter((pu) => pu.life > 0);

    // Bullet-asteroid collisions
    const hitAsteroids = new Set<Asteroid>();
    const nextBullets: Bullet[] = [];

    for (const b of bullets) {
      let hit = false;
      for (const a of asteroids) {
        if (!hitAsteroids.has(a) && dist(b.x, b.y, a.x, a.y) < a.radius) {
          hitAsteroids.add(a);
          hit = true;
          explode(a.x, a.y, a.size * 5, palette["particula-explosion"]);
          score += SCORE_BY_SIZE[a.size];
          callbacks.onScore(score);
          if (a.size === 3 && Math.random() < 0.2) {
            powerups.push(new PowerUp(a.x, a.y, palette));
          }
          if (a.size > 1) {
            const spreadBase = Math.atan2(a.vy, a.vx);
            const spd = Math.hypot(a.vx, a.vy) * 1.4;
            [0.5, -0.5].forEach((offset) => {
              const angle = spreadBase + offset;
              asteroids.push(
                new Asteroid(
                  a.x,
                  a.y,
                  a.size - 1,
                  palette,
                  Math.cos(angle) * spd,
                  Math.sin(angle) * spd
                )
              );
            });
          }
        }
      }
      if (!hit) nextBullets.push(b);
    }

    bullets = nextBullets;
    asteroids = asteroids.filter((a) => !hitAsteroids.has(a));

    // Ship-asteroid collision
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < a.radius + 12) {
        killShip();
        break;
      }
    }

    // Ship-powerup collision
    powerups = powerups.filter((pu) => {
      if (dist(ship.x, ship.y, pu.x, pu.y) < 20) {
        tripleFireTimer = 300;
        return false;
      }
      return true;
    });

    if (asteroids.length === 0) nextLevel();
  }

  function draw() {
    ctx.fillStyle = palette["fondo"];
    ctx.fillRect(0, 0, W, H);

    asteroids.forEach((a) => a.draw(ctx));
    bullets.forEach((b) => b.draw(ctx));
    if (state === "playing") ship.draw(ctx, frame);
    particles.forEach((p) => p.draw(ctx));
    powerups.forEach((pu) => pu.draw(ctx, frame));

    // Canvas HUD
    ctx.font = "16px monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = palette["hud-primario"];
    ctx.textAlign = "left";
    ctx.fillText(`SCORE: ${score}`, 10, 10);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, W / 2, 10);
    ctx.textAlign = "right";
    ctx.fillText(`${"♥ ".repeat(Math.max(0, lives)).trim()}`, W - 10, 10);

    if (tripleFireTimer > 0) {
      ctx.fillStyle = palette["hud-powerup-activo"];
      ctx.textAlign = "center";
      ctx.fillText("3× FUEGO", W / 2, 35);
    }

    if (paused) {
      ctx.fillStyle = palette["overlay-pausa-fondo"];
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = palette["hud-primario"];
      ctx.font = "bold 42px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EN PAUSA", W / 2, H / 2);
    }
  }

  function loop() {
    if (!paused) update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  const GAME_KEYS = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Space",
    "KeyA",
    "KeyD",
    "KeyW",
    "KeyS",
  ]);

  function onKeyDown(e: Event) {
    const ke = e as KeyboardEvent;
    if (GAME_KEYS.has(ke.code)) e.preventDefault();
    keys.add(ke.code);
  }

  function onKeyUp(e: Event) {
    keys.delete((e as KeyboardEvent).code);
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  initGame();
  let rafId = requestAnimationFrame(loop);

  return {
    cleanup() {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    },
    setPaused(p: boolean) {
      paused = p;
    },
    restart() {
      initGame();
    },
  };
}
