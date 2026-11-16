import { useEffect, useRef } from "react";

/**
 * The hero's ambient background effect (round 10). Lives INSIDE .lp-hero-copy
 * and is masked to its center — the top/bottom fade out because the effect
 * belongs to the first screen only, not the board below.
 *
 * Variants (owner review round): pick with ?fx=… on the URL —
 *   beams   the round-8 diagonal light-beam field (canvas)
 *   dots    圆点点阵 — SVG dot pattern, breathing + slow drift + mouse parallax
 *   cross   十字网格 — plus-mark pattern, slow pan
 *   grid    方格线 — hairline grid, scale-breathing
 *   dotgrid dots + hairline grid combined
 * Default stays `beams` until the owner picks one; the query wins.
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

const TONES = [
  [255, 99, 99],
  [255, 138, 120],
  [255, 176, 176],
  [255, 192, 180],
  [255, 99, 99],
  [255, 138, 120],
  [255, 217, 196],
];

export function LandingHeroFX() {
  const variant = variantFromQuery();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // beams internals
    const canvas = canvasRef.current;
    let ctx = canvas?.getContext("2d") || null;
    let field: HTMLCanvasElement | null = null;
    let fx: CanvasRenderingContext2D | null = null;
    let grain: HTMLCanvasElement | null = null;
    if (canvas && ctx) {
      field = document.createElement("canvas");
      field.width = 240;
      field.height = 160;
      fx = field.getContext("2d");
      grain = document.createElement("canvas");
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
    }

    const staticFrame =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("lp-reduce-motion");

    // mouse parallax target, lerped per frame (normalized -1..1 from center)
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    };
    if (!staticFrame) window.addEventListener("mousemove", onMove);

    const drawBeams = (t: number) => {
      if (!fx || !field || !canvas || !ctx || !grain) return;
      fx.setTransform(1, 0, 0, 1, 0, 0);
      fx.clearRect(0, 0, 240, 160);
      fx.globalCompositeOperation = "lighter";
      fx.translate(120, 80);
      fx.rotate(-Math.PI / 6);
      const span = Math.hypot(240, 160) * 1.2;
      const beamGap = span / 6.5;
      for (let i = 0; i < TONES.length; i++) {
        const [r, g, b] = TONES[i];
        const wobble = drift(t, i + 1);
        const cx = -span / 2 + beamGap * (i + 0.5) + wobble * beamGap * 0.42;
        const halfW = beamGap * (0.34 + 0.2 * Math.sin(t * 0.55 + i * 2.4) ** 2);
        const grad = fx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
        const a = 0.42 + 0.14 * Math.sin(t * 0.5 + i * 1.9);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${Math.max(0.1, a)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        fx.fillStyle = grad;
        fx.fillRect(-span / 2, -span / 2, span, span);
      }
      fx.globalCompositeOperation = "overlay";
      fx.globalAlpha = 0.05;
      fx.fillStyle = fx.createPattern(grain, "repeat");
      fx.fillRect(-span / 2, -span / 2, span, span);
      fx.globalAlpha = 1;

      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.66;
      // parallax: nudge the field toward the cursor, drawn oversized so no gap
      ctx.drawImage(field, cur.x * 26 - 22, cur.y * 18 - 16, w + 44, h + 32);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(7, 8, 10, 0.18)";
      ctx.fillRect(0, 0, w, h);
    };

    const drawPattern = (t: number) => {
      const svg = svgRef.current;
      const group = groupRef.current;
      if (!svg || !group) return;
      const w = svg.clientWidth || 1;
      const h = svg.clientHeight || 1;
      const breathe = 1 + 0.045 * Math.sin(t * 0.35);
      const px = cur.x * 16 + drift(t, 3) * 7;
      const py = cur.y * 12 + drift(t, 6) * 6;
      const cx = w / 2;
      const cy = h / 2;
      group.setAttribute(
        "transform",
        `translate(${(cx + px).toFixed(2)} ${(cy + py).toFixed(2)}) scale(${breathe.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`,
      );
      svg.style.opacity = String(0.62 + 0.26 * Math.sin(t * 0.35 + 1.2));
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
      else drawPattern(t);
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

    const resize = () => {
      if (canvas) {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const r = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
      }
      renderOne();
    };
    const renderOne = () => {
      const t = 7;
      if (variant === "beams") drawBeams(t);
      else drawPattern(t);
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
      if (!staticFrame) window.removeEventListener("mousemove", onMove);
    };
  }, [variant]);

  if (variant === "beams") {
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
          <pattern id="lp-fx-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M0 .5H48M.5 0V48" stroke="rgba(255, 99, 99, 0.4)" strokeWidth="1" />
          </pattern>
          <pattern id="lp-fx-dotgrid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 .5H44M.5 0V44" stroke="rgba(255, 99, 99, 0.22)" strokeWidth="1" />
            <circle cx="22" cy="22" r="1.8" fill="rgba(255, 138, 120, 0.6)" />
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
