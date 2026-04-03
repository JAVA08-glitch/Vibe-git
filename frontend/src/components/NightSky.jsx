import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function NightSky() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (theme !== "dark") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = seededRand(42);

    const stars = Array.from({ length: 280 }, () => ({
      bx:     rand(),
      by:     rand(),
      r:      rand() * 1.4 + 0.3,
      alpha:  rand() * 0.5 + 0.25,
      speed:  rand() * 0.018 + 0.006,
      phase:  rand() * Math.PI * 2,
      driftR: rand() * 0.6 + 0.2,
      driftS: rand() * 0.0004 + 0.0001,
      driftP: rand() * Math.PI * 2,
      hue:    rand() > 0.85 ? `hsl(${200 + rand() * 40},80%,90%)` : "#ffffff",
    }));

    const shooters = [];
    const spawnShooter = (cw, ch) => ({
      x:     rand() * cw * 0.7,
      y:     rand() * ch * 0.4,
      len:   rand() * 120 + 60,
      speed: rand() * 6 + 5,
      angle: Math.PI / 5 + rand() * 0.3,
      life:  1,
    });

    let raf, t = 0;
    let nextShooter = 180 + Math.floor(rand() * 300);

    const draw = () => {
      const cw = canvas.width, ch = canvas.height;
      t++;

      const sky = ctx.createLinearGradient(0, 0, 0, ch);
      sky.addColorStop(0,   "#010104");
      sky.addColorStop(0.5, "#02020a");
      sky.addColorStop(1,   "#04030e");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cw, ch);

      const neb1 = ctx.createRadialGradient(cw * 0.3, ch * 0.25, 0, cw * 0.3, ch * 0.25, cw * 0.35);
      neb1.addColorStop(0, "rgba(60,20,100,0.07)");
      neb1.addColorStop(1, "transparent");
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, cw, ch);

      const neb2 = ctx.createRadialGradient(cw * 0.75, ch * 0.55, 0, cw * 0.75, ch * 0.55, cw * 0.28);
      neb2.addColorStop(0, "rgba(10,30,80,0.06)");
      neb2.addColorStop(1, "transparent");
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, cw, ch);

      stars.forEach(s => {
        const twinkle = s.alpha + Math.sin(t * s.speed + s.phase) * 0.45;
        const sx = (s.bx + Math.cos(t * s.driftS + s.driftP) * s.driftR / cw) * cw;
        const sy = (s.by + Math.sin(t * s.driftS + s.driftP) * s.driftR / ch) * ch;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.hue === "#ffffff"
          ? `rgba(255,255,255,${Math.max(0.04, twinkle)})`
          : s.hue.replace("hsl", "hsla").replace(")", `,${Math.max(0.04, twinkle)})`);
        ctx.fill();
      });

      if (--nextShooter <= 0) {
        shooters.push(spawnShooter(cw, ch));
        nextShooter = 200 + Math.floor(rand() * 400);
      }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += Math.cos(sh.angle) * sh.speed;
        sh.y += Math.sin(sh.angle) * sh.speed;
        sh.life -= 0.018;
        if (sh.life <= 0) { shooters.splice(i, 1); continue; }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const grad = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, `rgba(255,255,255,${sh.life * 0.8})`);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(sh.x, sh.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}
