import { useEffect, useRef } from "react";

/**
 * The hero's ambient background (round 10, owner-locked: the beams field).
 * A slow diagonal drift of near-round orange light blobs on an isotropic
 * canvas (blobs stay round on any page height), a warm glow lerping along
 * with the cursor, grain for texture. Lives INSIDE .lp-hero-copy — the CSS
 * there fades all four edges so the effect reads as a middle band behind the
 * headline, painting behind the copy (z-index -1) and spanning the viewport
 * width. Static frame under reduced motion; paused when scrolled away.
 */
export function LandingHeroFX() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // static grain tile — the noise that keeps the blobs from reading as
    // clean vector gradients
    const grain = document.createElement("canvas");
    grain.width = 96;
    grain.height = 96;
    const gx = grain.getContext("2d");
    if (!gx) return;
    const gimg = gx.createImageData(96, 96);
    for (let i = 0; i < gimg.data.length; i += 4) {
      const v = 200 + Math.random() * 55;
      gimg.data[i] = v;
      gimg.data[i + 1] = v;
      gimg.data[i + 2] = v;
      gimg.data[i + 3] = 255;
    }
    gx.putImageData(gimg, 0, 0);

    const staticFrame =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("lp-reduce-motion");

    // two-octave sine drift stands in for fbm
    const drift = (t: number, seed: number) =>
      Math.sin(t * 0.42 + seed * 1.7) * 0.6 +
      Math.sin(t * 0.9 + seed * 3.1) * 0.28 +
      Math.sin(t * 1.7 + seed * 5.3) * 0.12;

    // the saturated coral-orange theme family (owner round 10: no pale tints)
    const TONES = [
      [255, 99, 99],
      [255, 128, 88],
      [255, 112, 72],
      [255, 138, 120],
      [255, 99, 99],
      [255, 120, 76],
      [255, 138, 120],
    ];

    // cursor: normalized target + lerped position (glow + parallax share it)
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    };
    // the highlight drifts home when the pointer leaves the window
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        target.x = 0;
        target.y = 0;
      }
    };

    /** the cursor highlight — theme glow pulled toward the pointer */
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

    const draw = (t: number) => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      // isotropic transform: circles stay round on any page height (the old
      // low-res field was stretched anisotropically and sheared into ellipses)
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

      // grain tile (overlay keeps the blobs' color), then a light dark sink
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

    let dpr = 1;
    let raf = 0;
    let running = false;
    let last = 0;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      draw(last);
    };
    const loop = (now: number) => {
      // 0.4× clock: contemplative drift (owner round 9)
      const t = last + Math.min((now - last) / 1000, 0.1) * 0.4;
      last = t;
      cur.x += (target.x - cur.x) * 0.03;
      cur.y += (target.y - cur.y) * 0.03;
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || staticFrame) return;
      running = true;
      last = performance.now() / 1000;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!staticFrame) {
      window.addEventListener("mousemove", onMove);
      document.addEventListener("mouseout", onLeave);
      // pause when the hero leaves the viewport
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
    };
  }, []);

  return (
    <div className="lp-hero-fx" ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} className="lp-hero-fx-canvas" />
    </div>
  );
}
