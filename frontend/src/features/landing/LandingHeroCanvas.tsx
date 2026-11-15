import { useEffect, useRef } from "react";

/**
 * The hero's ambient canvas (round 8, raycast.com reference): a slow field of
 * diagonal light beams drawn at low resolution and upscaled — soft edges come
 * free, and the cost stays trivial. Coral palette, deliberately faint: it
 * should read as the dark page "breathing", not as a light show. One static
 * frame under reduced motion; the loop pauses whenever the hero scrolls away.
 */
export function LandingHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // low-res field: big soft gradients + free antialiasing on upscale
    const BW = 240;
    const BH = 160;
    const field = document.createElement("canvas");
    field.width = BW;
    field.height = BH;
    const fx = field.getContext("2d");
    if (!fx) return;

    // static grain, tiled over the field (the noise that keeps the beams from
    // reading as clean vector gradients)
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

    // two-octave sine drift stands in for the reference's fbm sweep
    const drift = (t: number, seed: number) =>
      Math.sin(t * 0.42 + seed * 1.7) * 0.6 +
      Math.sin(t * 0.9 + seed * 3.1) * 0.28 +
      Math.sin(t * 1.7 + seed * 5.3) * 0.12;

    const TONES = [
      [255, 99, 99], // accent
      [255, 138, 120], // coral
      [255, 176, 176], // deep rose
      [255, 192, 180], // peach-light
      [255, 99, 99],
      [255, 138, 120],
      [255, 217, 196], // warm near-white
    ];

    let raf = 0;
    let running = false;
    let last = 0;
    const staticFrame = matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("lp-reduce-motion");

    const draw = (t: number) => {
      // diagonal beam field
      fx.setTransform(1, 0, 0, 1, 0, 0);
      fx.clearRect(0, 0, BW, BH);
      fx.globalCompositeOperation = "lighter";
      fx.translate(BW / 2, BH / 2);
      fx.rotate(-Math.PI / 6); // the reference's diagonal sweep
      const span = Math.hypot(BW, BH) * 1.2;
      const beamGap = span / 6.5;
      for (let i = 0; i < TONES.length; i++) {
        const [r, g, b] = TONES[i];
        const wobble = drift(t, i + 1);
        const cx = -span / 2 + beamGap * (i + 0.5) + wobble * beamGap * 0.42;
        const halfW = beamGap * (0.34 + 0.2 * Math.sin(t * 0.55 + i * 2.4) ** 2);
        const grad = fx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
        // raycast-faint: the field is felt, not seen — alpha stays in the
        // 0.04–0.12 band so the page keeps its near-black ground
        const a = 0.09 + 0.05 * Math.sin(t * 0.5 + i * 1.9);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${Math.max(0.03, a)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        fx.fillStyle = grad;
        fx.fillRect(-span / 2, -span / 2, span, span);
      }
      // grain at field scale — the upscale smears it into the soft texture
      fx.globalCompositeOperation = "overlay";
      fx.globalAlpha = 0.05;
      fx.fillStyle = fx.createPattern(grain, "repeat");
      fx.fillRect(-span / 2, -span / 2, span, span);
      fx.globalAlpha = 1;

      // upscale onto the visible canvas, then sink it back toward black — the
      // reference reads ~90% darkness with a slow warm shimmer on top
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(field, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(7, 8, 10, 0.4)";
      ctx.fillRect(0, 0, w, h);
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      draw(staticFrame ? 7 : last);
    };

    const loop = (now: number) => {
      const t = last + Math.min((now - last) / 1000, 0.1);
      last = t;
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
      // pause when the hero leaves the viewport
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? start() : stop()));
      });
      io.observe(canvas);
      start();
    }

    return () => {
      stop();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-hero-canvas" aria-hidden="true" />;
}
