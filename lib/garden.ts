/**
 * Garden: the particle system behind the wand.
 * Pure canvas + math, no React. Mutates arrays in place to stay allocation-light.
 */

export type Flower = {
  x: number;
  y: number;
  img: HTMLImageElement;
  size: number;
  rot: number;
  spin: number;
  born: number;
  phase: number; // per-flower offset so they breathe out of sync
  vx: number;
  vy: number;
  alpha: number;
  state: "planted" | "burst";
};

/** Tuning knobs — all in one place so you can taste-test quickly. */
export const CONFIG = {
  minSpacing: 22, // px between consecutive spawns along a stroke
  sizeMin: 34,
  sizeMax: 80,
  growMs: 260, // pop-in duration
  breatheMs: 620, // breathing period
  breatheAmount: 0.09, // ±9% scale
  gravity: 0.12,
  drag: 0.985,
  fade: 0.012, // alpha lost per frame during a burst
  maxFlowers: 420, // oldest get culled past this
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const easeOutBack = (x: number) =>
  1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);

/**
 * Plant a flower at (x, y), unless we just planted one too close.
 * `lastPoint` is tracked per hand so two hands don't block each other.
 */
export function plant(
  garden: Flower[],
  x: number,
  y: number,
  images: HTMLImageElement[],
  lastPoint: { x: number; y: number } | null
): { x: number; y: number } | null {
  if (images.length === 0) return lastPoint;
  if (lastPoint && Math.hypot(lastPoint.x - x, lastPoint.y - y) < CONFIG.minSpacing) {
    return lastPoint;
  }

  garden.push({
    x,
    y,
    img: images[(Math.random() * images.length) | 0],
    size: rand(CONFIG.sizeMin, CONFIG.sizeMax),
    rot: rand(0, Math.PI * 2),
    spin: rand(-0.04, 0.04),
    born: performance.now(),
    phase: rand(0, Math.PI * 2),
    vx: 0,
    vy: 0,
    alpha: 1,
    state: "planted",
  });

  if (garden.length > CONFIG.maxFlowers) garden.shift();

  return { x, y };
}

/** Scatter every planted flower outward from an origin, firework-style. */
export function burst(garden: Flower[], originX: number, originY: number) {
  for (const f of garden) {
    if (f.state === "burst") continue;
    const angle =
      Math.atan2(f.y - originY, f.x - originX) + rand(-0.3, 0.3);
    const power = rand(6, 15);
    f.state = "burst";
    f.vx = Math.cos(angle) * power;
    f.vy = Math.sin(angle) * power - 3; // slight upward kick
    f.spin = rand(-0.12, 0.12);
  }
}

/** Advance and draw one frame. */
export function step(garden: Flower[], ctx: CanvasRenderingContext2D, t: number) {
  for (let i = garden.length - 1; i >= 0; i--) {
    const f = garden[i];
    let scale = 1;

    if (f.state === "planted") {
      const grow = Math.min(1, (t - f.born) / CONFIG.growMs);
      const breathe =
        1 + Math.sin(t / CONFIG.breatheMs + f.phase) * CONFIG.breatheAmount;
      scale = easeOutBack(grow) * breathe;
      f.rot += f.spin * 0.15; // barely-there drift
    } else {
      f.x += f.vx;
      f.y += f.vy;
      f.vy += CONFIG.gravity;
      f.vx *= CONFIG.drag;
      f.vy *= CONFIG.drag;
      f.rot += f.spin;
      f.alpha -= CONFIG.fade;
      scale = 1 + (1 - f.alpha) * 0.5; // bloom outward as it fades
      if (f.alpha <= 0) {
        garden.splice(i, 1);
        continue;
      }
    }

    const s = f.size * scale;
    ctx.save();
    ctx.globalAlpha = Math.max(0, f.alpha);
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.drawImage(f.img, -s / 2, -s / 2, s, s);
    ctx.restore();
  }
}
