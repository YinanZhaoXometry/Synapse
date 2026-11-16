import { useEffect, useRef } from "react";

/**
 * The hero's ambient background effect (round 10). Lives INSIDE .lp-hero-copy
 * and is masked to its center — the top/bottom fade out because the effect
 * belongs to the first screen only, not the board below.
 *
 * Variants (pick with ?fx=… on the URL):
 *   beams   diagonal light blobs (canvas) — rounded, wide (owner round 10)
 *   dots    圆点点阵 — SVG dot pattern, breathing + drift + mouse parallax
 *   cross   十字网格 — plus-mark pattern
 *   grid    方格线 (canvas) — breathing grid + CLICK CURRENT: clicking fires a
 *           coral charge that races along the grid lines outward, then fades
 *   dotgrid grid + dots at the crossings, same click current
 * Default stays `beams` until the owner locks a pick.
 */

type FxVariant = "beams" | "dots" | "cross" | "grid" | "dotgrid";

const VARIANTS: FxVariant[] = ["beams", "dots", "cross", "grid", "dotgrid"];

function variantFromQuery(): FxVariant {
  try {
    const v = new URLSearchParams(window.location.search).get("fx") as FxVariant | null;
    if (v && VARIANTS.includes(v)) return v;
  } catch (e) {}
  return "beams";
}

/** two-octave sine drift stands in for fbm */
const drift = (t: number, seed: number) =>
  Math.sin(t * 0.42 + seed * 1.7) * 0.6 +
  Math.sin(t * 0.9 + seed * 3.1) * 0.28 +
  Math.sin(t * 1.7 + seed * 5.3) * 0.12;

// orange theme family (owner round 10): saturated coral-orange, no pale tints
const TONES = [
  [255, 99, 99],
  [255, 128, 88],
  [255, 112, 72],
  [255, 138, 120],
  [255, 99, 99],
  [255, 120, 76],
  [255, 138, 120],
];

type Pulse = { x: number; y: number; t0: number };

export function LandingHeroFX() {
  const variant = variantFromQuery();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") || null;
    const clickable = variant === "grid" || variant === "dotgrid";

    // static grain tile (shared by beams' texture)
    const grain = document.createElement("canvas");
    grain.width = 96;
    grain.height = 96;
    const gx = grain.getContext("2d");
    if (gx) {
      const gimg = gx.createImageData(96, 96);
      for (let i = 0; i < gimg.data.length; i += 4) {
        const v = 200 + Math.random() * 55;
        gimg.data[i] = v;
        gimg.data[i + 1] = v;
        gimg.data[i + 2] = v;
        gimg.data[i + 3] = 255;
      }
      gx.putImageData(gimg, 0, 0);
    }

    const staticFrame =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("lp-reduce-motion");

    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    };
    // the cursor highlight drifts home when the pointer leaves the window
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        target.x = 0;
        target.y = 0;
      }
    };

    /** owner round 10: a warm highlight that follows the cursor — the theme
     *  glow is pulled toward wherever the pointer is (lerped, additive) */
    const drawMouseGlow = (w: number, h: number) => {
      const x = w / 2 + cur.x * (w / 2);
      const y = h / 2 + cur.y * (h / 2);
      const R = Math.min(w, h) * 0.3;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, "rgba(255, 150, 90, 0.3)");
      g.addColorStop(0.5, "rgba(255, 110, 64, 0.13)");
      g.addColorStop(1, "rgba(255, 110, 64, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - R, y - R, R * 2, R * 2);
      ctx.restore();
    };

    const pulses: Pulse[] = [];
    const onDown = (e: MouseEvent) => {
      if (!canvas || staticFrame) return;
      const r = canvas.getBoundingClientRect();
      pulses.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: last });
      if (pulses.length > 4) pulses.shift();
    };
    if (!staticFrame && clickable) host.parentElement?.addEventListener("mousedown", onDown);
    if (!staticFrame) {
      window.addEventListener("mousemove", onMove);
      document.addEventListener("mouseout", onLeave);
    }

    let dpr = 1;

    const drawBeams = (t: number) => {
      if (!canvas || !ctx || !grain) return;
      // draw directly in CSS px on the main canvas — the transform is
      // isotropic (dpr on both axes), so circles stay CIRCLES no matter how
      // tall the canvas grows. (The old low-res field was stretched to fill,
      // which sheared the blobs into ellipses on tall pages — owner report.)
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2 + cur.x * 18, h / 2 + cur.y * 12);
      ctx.rotate(-Math.PI / 6);
      const span = Math.hypot(w, h) * 1.25;
      const beamGap = span / 5.2;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < TONES.length; i++) {
        const [r, g, b] = TONES[i];
        const cx = -span / 2 + beamGap * (i + 0.5) + drift(t, i + 1) * beamGap * 0.4;
        const cy = drift(t, i + 2.4) * 26;
        // near-round wide blobs, sized by the SHORT canvas side so they read
        // equally round on wide and tall viewports
        const R = Math.min(w, h) * (0.32 + 0.055 * Math.sin(t * 0.4 + i * 1.3));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.85);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
        const a = 0.5 + 0.14 * Math.sin(t * 0.5 + i * 1.9);
        grad.addColorStop(0, `rgba(${r},${g},${b},${Math.max(0.14, a)})`);
        grad.addColorStop(0.55, `rgba(${r},${g},${b},${a * 0.5})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // grain tile over the whole canvas (overlay keeps the blobs' color)
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.045;
      ctx.fillStyle = ctx.createPattern(grain, "repeat");
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(7, 8, 10, 0.18)";
      ctx.fillRect(0, 0, w, h);

      drawMouseGlow(w, h);
    };

    /** the click current (owner round 10): a charge that runs ALONG the grid
     *  lines only — every line the expanding front crosses lights up in the
     *  orange theme color, brightest right at the front, then it decays. No
     *  extra geometry: no rings, no spark paths, nothing off the grid. */
    const drawPulse = (p: Pulse, w: number, h: number, now: number, spacing: number) => {
      const age = now - p.t0;
      const LIFE = 2.4;
      if (age < 0 || age > LIFE) return;
      const intensity = Math.pow(1 - age / LIFE, 1.15);
      const front = (1 - Math.pow(1 - Math.min(1, age / 0.9), 3)) * 520; // easeOut

      // each grid line the front has crossed carries a glowing run centered
      // where the front meets it; runs lengthen near the front, then fade
      const run = (at: number, along: number, vertical: boolean) => {
        const prox = 1 - along / front; // 1 at the front, 0 far behind
        const half = (14 + 26 * prox) / 2;
        // orange theme, two-layer: deep orange body + bright orange core
        const body = `rgba(255, 110, 64, ${0.9 * intensity})`;
        const core = `rgba(255, 168, 104, ${0.85 * intensity})`;
        ctx.lineCap = "round";
        if (vertical) {
          ctx.strokeStyle = body;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(at, along - half);
          ctx.lineTo(at, along + half);
          ctx.stroke();
          ctx.strokeStyle = core;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(at, along - half * 0.72);
          ctx.lineTo(at, along + half * 0.72);
          ctx.stroke();
        } else {
          ctx.strokeStyle = body;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(along - half, at);
          ctx.lineTo(along + half, at);
          ctx.stroke();
          ctx.strokeStyle = core;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(along - half * 0.72, at);
          ctx.lineTo(along + half * 0.72, at);
          ctx.stroke();
        }
      };

      for (let gx = ((p.x % spacing) + spacing) % spacing; gx < w; gx += spacing) {
        const dx = Math.abs(gx - p.x);
        if (dx < front) {
          const off = Math.sqrt(front * front - dx * dx);
          for (const s of [-1, 1]) {
            const yy = p.y + s * off;
            if (yy >= -20 && yy <= h + 20) run(gx, yy, true);
          }
        }
      }
      for (let gy = ((p.y % spacing) + spacing) % spacing; gy < h; gy += spacing) {
        const dy = Math.abs(gy - p.y);
        if (dy < front) {
          const off = Math.sqrt(front * front - dy * dy);
          for (const s of [-1, 1]) {
            const xx = p.x + s * off;
            if (xx >= -20 && xx <= w + 20) run(gy, xx, false);
          }
        }
      }
    };

    const drawGrid = (t: number) => {
      if (!canvas || !ctx) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const spacing = variant === "dotgrid" ? 44 : 48;
      const breathe = 1 + 0.045 * Math.sin(t * 0.35);
      ctx.save();
      ctx.translate(w / 2 + cur.x * 16 + drift(t, 3) * 7, h / 2 + cur.y * 12 + drift(t, 6) * 6);
      ctx.scale(breathe, breathe);
      ctx.translate(-w / 2, -h / 2);
      const m = 64;
      ctx.strokeStyle = variant === "dotgrid" ? "rgba(255, 99, 99, 0.24)" : "rgba(255, 99, 99, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = ((0 % spacing) + spacing) % spacing; x < w + m; x += spacing) {
        ctx.moveTo(x, -m);
        ctx.lineTo(x, h + m);
      }
      for (let y = 0; y < h + m; y += spacing) {
        ctx.moveTo(-m, y);
        ctx.lineTo(w + m, y);
      }
      ctx.stroke();
      if (variant === "dotgrid") {
        ctx.fillStyle = "rgba(255, 138, 120, 0.6)";
        for (let x = spacing / 2; x < w + m; x += spacing) {
          for (let y = spacing / 2; y < h + m; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      drawMouseGlow(w, h);
      for (const p of pulses) drawPulse(p, w, h, t, spacing);
      while (pulses.length && t - pulses[0].t0 > 2.5) pulses.shift();
    };

    const renderOne = () => {
      if (variant === "beams") drawBeams(7);
      else drawGrid(7);
    };

    const resize = () => {
      if (canvas) {
        dpr = Math.min(devicePixelRatio || 1, 2);
        const r = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
      }
      renderOne();
    };

    let raf = 0;
    let running = false;
    let last = 0;
    const frame = (now: number) => {
      const t = last + Math.min((now - last) / 1000, 0.1) * 0.4; // 0.4× clock
      last = t;
      cur.x += (target.x - cur.x) * 0.03;
      cur.y += (target.y - cur.y) * 0.03;
      if (variant === "beams") drawBeams(t);
      else drawGrid(t);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || staticFrame) return;
      running = true;
      last = performance.now() / 1000;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!staticFrame) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? start() : stop()));
      });
      io.observe(host);
      start();
    }

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseout", onLeave);
      host.parentElement?.removeEventListener("mousedown", onDown);
    };
  }, [variant]);

  if (variant === "beams") {
    return (
      <div className="lp-hero-fx" ref={hostRef} aria-hidden="true">
        <canvas ref={canvasRef} className="lp-hero-fx-canvas" />
      </div>
    );
  }

  if (variant === "grid" || variant === "dotgrid") {
    return (
      <div className="lp-hero-fx" ref={hostRef} aria-hidden="true">
        <canvas ref={canvasRef} className="lp-hero-fx-canvas" />
      </div>
    );
  }

  return (
    <div className="lp-hero-fx" ref={hostRef} aria-hidden="true">
      <svg ref={svgRef} className="lp-hero-fx-svg">
        <defs>
          <pattern id="lp-fx-dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="13" cy="13" r="1.7" fill="rgba(255, 99, 99, 0.55)" />
          </pattern>
          <pattern id="lp-fx-cross" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M22 15v14M15 22h14" stroke="rgba(255, 99, 99, 0.5)" strokeWidth="1" />
          </pattern>
        </defs>
        <g ref={groupRef}>
          {/* oversized so the parallax drift never bares an edge */}
          <rect x="-32" y="-32" width="132%" height="132%" fill={`url(#lp-fx-${variant})`} />
        </g>
      </svg>
    </div>
  );
}
