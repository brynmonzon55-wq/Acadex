import React from "react";
import type { AppTheme, AppThemeMode } from "../App";

interface AnimatedThemeBackgroundProps {
  theme: AppTheme;
  mode?: AppThemeMode;
  particlesEnabled?: boolean;
  performanceMode?: boolean;
}

// -------------------------------------------------------------
// 1. NIGHT STARS (Optimized count: 16 lightweight stars)
// -------------------------------------------------------------
const NIGHT_STARS = Array.from({ length: 16 }, (_, i) => {
  const size = (i % 2 === 0 ? 2 : 1.5);
  const left = `${(i * 23 + 7) % 94}%`;
  const top = `${(i * 31 + 11) % 90}%`;
  const duration = `${3.0 + (i % 3) * 1.5}s`;
  const delay = `${(i * 0.5) % 3}s`;

  return { id: i, size, left, top, duration, delay };
});

// -------------------------------------------------------------
// 2. CYBERPUNK PARTICLES & DATA MOTES (Lively Cyberpunk/Default Theme)
// -------------------------------------------------------------
const CYBERPUNK_COLORS = [
  "#00f0ff", // Electric Cyan
  "#ff007f", // Neon Fuchsia
  "#a855f7", // Cyber Violet
  "#06b6d4", // Sky Cyan
  "#3b82f6", // Neon Blue
  "#10b981", // Matrix Emerald
  "#ec4899", // Laser Pink
  "#f59e0b", // Amber Glow
];

const CYBERPUNK_PARTICLES = Array.from({ length: 36 }, (_, i) => {
  const size = 2.5 + (i % 4) * 1.5;
  const color = CYBERPUNK_COLORS[i % CYBERPUNK_COLORS.length];
  const left = `${(i * 13 + 4) % 96}%`;
  const top = `${(i * 17 + 6) % 92}%`;
  const duration = `${5.0 + (i % 5) * 1.8}s`;
  const delay = `${(i * 0.4) % 5}s`;
  const xDist = (i % 3 === 0 ? 28 : i % 3 === 1 ? -24 : 18) + (i % 2 === 0 ? 8 : -8);
  const yDist = (i % 2 === 0 ? -38 : -22) - (i % 4) * 6;
  const glowBlur = (i % 3 === 0 ? 6 : 3);

  return {
    id: i,
    size,
    color,
    left,
    top,
    duration,
    delay,
    xMove: `${xDist}px`,
    yMove: `${yDist}px`,
    glowBlur,
  };
});

const CYBERPUNK_DATA_MOTES = Array.from({ length: 18 }, (_, i) => {
  const size = 2 + (i % 3);
  const color = i % 2 === 0 ? "#00f0ff" : "#ff007f";
  const left = `${(i * 19 + 7) % 94}%`;
  const top = `${(i * 23 + 12) % 88}%`;
  const duration = `${4.0 + (i % 3) * 1.5}s`;
  const delay = `${(i * 0.6) % 4}s`;
  return { id: i, size, color, left, top, duration, delay };
});

// -------------------------------------------------------------
// 3. AUTHENTIC JAPANESE SAKURA BLOSSOMS & PETALS (Hanami & Yozakura)
// -------------------------------------------------------------
interface SakuraPetalConfig {
  id: number;
  type: "notch" | "curved" | "blossom" | "petalPair";
  size: number;
  left: string;
  duration: string;
  delay: string;
  swayDist: string;
  rotStart: number;
  blur: string;
  opacity: number;
  gradient: {
    id: string;
    stop1: string; // Outer/tip delicate petal tone
    stop2: string; // Mid bloom blush
    stop3: string; // Base / stamen cherry accent
  };
}

const SAKURA_GRADIENTS = [
  // Somei Yoshino (Tokyo classic: Pure porcelain ivory with delicate sakura blush)
  { id: "grad-somei", stop1: "#ffffff", stop2: "#fed7e2", stop3: "#f472b6" },
  // Yamazakura (Mountain cherry: Soft dawn blush with warm rosy heart)
  { id: "grad-yama", stop1: "#fff1f2", stop2: "#fbcfe8", stop3: "#fb7185" },
  // Yaezakura (Double-layered blossoms: Rich hanami pink with ruby undertones)
  { id: "grad-yae", stop1: "#fce7f3", stop2: "#f472b6", stop3: "#e11d48" },
  // Shidarezakura (Kyoto weeping cherry: Translucent pink into magenta cherry tip)
  { id: "grad-shidare", stop1: "#ffe4e6", stop2: "#fda4af", stop3: "#f43f5e" },
  // Hikanzakura (Bell cherry: Radiant sunset blossom)
  { id: "grad-hikan", stop1: "#fff5f7", stop2: "#f9a8d4", stop3: "#db2777" },
];

const SAKURA_PETALS: SakuraPetalConfig[] = Array.from({ length: 16 }, (_, i) => {
  const types: Array<SakuraPetalConfig["type"]> = ["notch", "curved", "notch", "blossom", "petalPair", "notch"];
  const type = types[i % types.length];
  const size = type === "blossom" ? 22 + (i % 2) * 6 : 14 + (i % 4) * 4;
  const gradient = SAKURA_GRADIENTS[i % SAKURA_GRADIENTS.length];
  const left = `${(i * 14 + 3) % 96}%`;
  const duration = `${7.5 + (i % 5) * 1.8}s`;
  const delay = `${(i * 0.6) % 6}s`;
  const swayDist = i % 2 === 0 ? `${35 + (i % 3) * 15}px` : `-${35 + (i % 3) * 15}px`;
  const rotStart = (i * 45) % 360;
  const isBackgroundLayer = i % 5 === 0;
  const blur = isBackgroundLayer ? "blur-[0.8px]" : "blur-0";
  const opacity = isBackgroundLayer ? 0.65 : 0.92;

  return {
    id: i,
    type,
    size,
    left,
    duration,
    delay,
    swayDist,
    rotStart,
    blur,
    opacity,
    gradient: { ...gradient, id: `${gradient.id}-${i}` },
  };
});

// Soft Sakura Pollen & Ambient Hanami Light Motes
const SAKURA_MOTES = Array.from({ length: 10 }, (_, i) => {
  const size = 3 + (i % 3);
  const left = `${(i * 21 + 7) % 94}%`;
  const top = `${(i * 29 + 10) % 88}%`;
  const duration = `${5.5 + (i % 3) * 2.0}s`;
  const delay = `${(i * 0.7) % 4}s`;
  const color = i % 2 === 0 ? "#fecdd3" : "#fed7aa";
  return { id: i, size, left, top, duration, delay, color };
});

// -------------------------------------------------------------
// 4. SPRING FLORA & MEADOW PETALS (Optimized count: 10 petals, GPU translate3d)
// -------------------------------------------------------------
const SPRING_PETAL_COLORS = [
  "#f472b6",
  "#34d399",
  "#fb7185",
  "#a7f3d0",
  "#fda4af",
];

const SPRING_PETALS = Array.from({ length: 10 }, (_, i) => {
  const size = 12 + (i % 3) * 4;
  const color = SPRING_PETAL_COLORS[i % SPRING_PETAL_COLORS.length];
  const left = `${(i * 21 + 5) % 94}%`;
  const duration = `${9.0 + (i % 4) * 2.5}s`;
  const delay = `${(i * 0.8) % 6}s`;
  const swayDist = i % 2 === 0 ? "35px" : "-35px";
  const rotStart = (i * 45) % 360;

  return { id: i, size, color, left, duration, delay, swayDist, rotStart };
});

// -------------------------------------------------------------
// 4. SUMMER FIREFLIES (Optimized count: 8 fireflies)
// -------------------------------------------------------------
const SUMMER_FIREFLY_COLORS = [
  "#fbbf24",
  "#fde047",
  "#86efac",
  "#38bdf8",
];

const SUMMER_FIREFLIES = Array.from({ length: 8 }, (_, i) => {
  const size = 4 + (i % 3) * 2;
  const color = SUMMER_FIREFLY_COLORS[i % SUMMER_FIREFLY_COLORS.length];
  const left = `${(i * 25 + 8) % 92}%`;
  const top = `${(i * 33 + 12) % 85}%`;
  const duration = `${5.0 + (i % 3) * 1.8}s`;
  const delay = `${(i * 0.5) % 3}s`;
  const xMove = i % 2 === 0 ? "18px" : "-18px";
  const yMove = "-28px";

  return { id: i, size, color, left, top, duration, delay, xMove, yMove };
});

// -------------------------------------------------------------
// 5. AUTUMN MAPLE LEAVES (Optimized count: 10 leaves, GPU translate3d)
// -------------------------------------------------------------
const AUTUMN_LEAF_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#b45309",
];

const AUTUMN_LEAVES = Array.from({ length: 10 }, (_, i) => {
  const size = 14 + (i % 3) * 5;
  const color = AUTUMN_LEAF_COLORS[i % AUTUMN_LEAF_COLORS.length];
  const left = `${(i * 23 + 6) % 94}%`;
  const duration = `${10.0 + (i % 4) * 2.5}s`;
  const delay = `${(i * 0.9) % 7}s`;
  const swayDist = i % 2 === 0 ? "40px" : "-40px";
  const rotStart = (i * 60) % 360;

  return { id: i, size, color, left, duration, delay, swayDist, rotStart };
});

// -------------------------------------------------------------
// 6. WINTER SNOWFLAKES (Optimized count: 14 snowflakes, GPU translate3d)
// -------------------------------------------------------------
const WINTER_SNOWFLAKES = Array.from({ length: 14 }, (_, i) => {
  const isCrystalline = i % 4 === 0;
  const size = isCrystalline ? 14 : 4 + (i % 3) * 2;
  const left = `${(i * 17 + 4) % 96}%`;
  const duration = `${8.0 + (i % 4) * 2.0}s`;
  const delay = `${(i * 0.7) % 6}s`;
  const swayDist = i % 2 === 0 ? "25px" : "-25px";
  const opacity = 0.5 + (i % 3) * 0.2;

  return { id: i, isCrystalline, size, left, duration, delay, swayDist, opacity };
});

function AnimatedThemeBackgroundComponent({
  theme,
  mode = "night",
  particlesEnabled = true,
  performanceMode = false,
}: AnimatedThemeBackgroundProps) {
  const activeTheme = (theme === ("dark" as any) ? "default" : theme) || "default";
  const isNight = mode === "night";
  const showParticles = particlesEnabled !== undefined ? particlesEnabled : !performanceMode;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      style={{
        contain: "strict",
        willChange: "transform",
      }}
    >
      {/* 
        HARDWARE-ACCELERATED KEYFRAMES:
        Strictly uses transform3d and opacity for 100% GPU compositor execution.
        Zero layout recalculations or CPU repaints.
      */}
      <style>{`
        /* 1. Starlight Twinkle (GPU Opacity Only) */
        @keyframes starTwinkleFast {
          0%, 100% { opacity: 0.25; transform: translate3d(0,0,0) scale(0.9); }
          50% { opacity: 0.9; transform: translate3d(0,0,0) scale(1.15); }
        }

        /* 2. Cyberpunk Particles & Data Motes */
        @keyframes cyberParticleFast {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.9);
            opacity: 0.35;
          }
          50% {
            transform: translate3d(var(--px), var(--py), 0) scale(1.3);
            opacity: 0.95;
          }
        }

        @keyframes cyberMoteFast {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.8);
            opacity: 0.2;
          }
          50% {
            transform: translate3d(14px, -20px, 0) scale(1.2);
            opacity: 0.85;
          }
        }

        /* 3. Authentic Japanese Sakura Blossom Flutter (Pure GPU translate3d & 3D tumbling) */
        @keyframes sakuraFallGPU {
          0% {
            transform: translate3d(0, -50px, 0) rotateZ(var(--rot)) rotateX(0deg) rotateY(0deg);
            opacity: 0;
          }
          8% {
            opacity: var(--op, 0.95);
          }
          30% {
            transform: translate3d(calc(var(--sway) * 0.4), 32vh, 0) rotateZ(calc(var(--rot) + 80deg)) rotateX(45deg) rotateY(30deg);
          }
          60% {
            transform: translate3d(calc(var(--sway) * -0.3), 68vh, 0) rotateZ(calc(var(--rot) + 180deg)) rotateX(-30deg) rotateY(60deg);
          }
          92% {
            opacity: var(--op, 0.9);
          }
          100% {
            transform: translate3d(var(--sway), 108vh, 0) rotateZ(calc(var(--rot) + 320deg)) rotateX(70deg) rotateY(120deg);
            opacity: 0;
          }
        }

        /* Hanami Pollen & Ambient Blossom Glimmer */
        @keyframes sakuraMoteFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.85);
            opacity: 0.2;
          }
          50% {
            transform: translate3d(16px, -24px, 0) scale(1.25);
            opacity: 0.85;
          }
        }

        /* 4. Summer Firefly Pulse */
        @keyframes fireflyFast {
          0%, 100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.25;
          }
          50% {
            transform: translate3d(var(--px), var(--py), 0);
            opacity: 0.95;
          }
        }

        /* 5. Autumn Leaf Fall (Pure GPU translate3d) */
        @keyframes leafFallGPU {
          0% {
            transform: translate3d(0, -40px, 0) rotate(var(--rot));
            opacity: 0;
          }
          12% {
            opacity: 0.9;
          }
          88% {
            opacity: 0.8;
          }
          100% {
            transform: translate3d(var(--sway), 105vh, 0) rotate(calc(var(--rot) + 360deg));
            opacity: 0;
          }
        }

        /* 6. Winter Snowfall (Pure GPU translate3d) */
        @keyframes snowFallGPU {
          0% {
            transform: translate3d(0, -30px, 0);
            opacity: 0;
          }
          10% {
            opacity: var(--op);
          }
          90% {
            opacity: var(--op);
          }
          100% {
            transform: translate3d(var(--sway), 105vh, 0);
            opacity: 0;
          }
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* GLOBAL NIGHT MODE STARS (Rendered when particles are enabled) */}
      {/* ------------------------------------------------------------- */}
      {isNight && showParticles && (
        <>
          {NIGHT_STARS.map((s) => (
            <div
              key={`star-${s.id}`}
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                left: s.left,
                top: s.top,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: 0.6,
                animation: `starTwinkleFast ${s.duration} ease-in-out infinite ${s.delay}`,
                willChange: "transform, opacity",
              }}
            />
          ))}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. CYBERPUNK THEME BACKGROUND (NEON ELECTRIC MOTES & PARTICLES) */}
      {/* ------------------------------------------------------------- */}
      {activeTheme === "default" && (
        <>
          {/* Day Mode Luminous Atmosphere */}
          {!isNight && (
            <>
              <div className="absolute -top-20 -left-20 w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] rounded-full blur-2xl bg-cyan-500/20 pointer-events-none" />
              <div className="absolute top-1/3 -right-20 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full blur-2xl bg-fuchsia-600/20 pointer-events-none" />
              <div className="absolute bottom-10 left-1/3 w-[300px] h-[300px] rounded-full blur-2xl bg-purple-600/15 pointer-events-none" />
            </>
          )}

          {/* Night Mode Subtle Ambient Cyber Bloom */}
          {isNight && (
            <>
              <div className="absolute top-1/4 -left-16 w-[360px] h-[360px] rounded-full blur-3xl bg-cyan-500/10 pointer-events-none" />
              <div className="absolute bottom-1/4 -right-16 w-[360px] h-[360px] rounded-full blur-3xl bg-fuchsia-500/10 pointer-events-none" />
            </>
          )}

          {/* Glowing Ambient Data Motes */}
          {showParticles &&
            CYBERPUNK_DATA_MOTES.map((m) => (
              <div
                key={`cyber-mote-${m.id}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: m.left,
                  top: m.top,
                  width: `${m.size}px`,
                  height: `${m.size}px`,
                  backgroundColor: m.color,
                  boxShadow: `0 0 6px ${m.color}`,
                  animation: `cyberMoteFast ${m.duration} ease-in-out infinite ${m.delay}`,
                  willChange: "transform, opacity",
                }}
              />
            ))}

          {/* Rich Floating Cyber Neon Particles */}
          {showParticles &&
            CYBERPUNK_PARTICLES.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: p.left,
                  top: p.top,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.glowBlur}px ${p.color}`,
                  animation: `cyberParticleFast ${p.duration} ease-in-out infinite ${p.delay}`,
                  ["--px" as string]: p.xMove,
                  ["--py" as string]: p.yMove,
                  willChange: "transform, opacity",
                }}
              />
            ))}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. AUTHENTIC JAPANESE SAKURA THEME (HANAMI & YOZAKURA) */}
      {/* ------------------------------------------------------------- */}
      {activeTheme === "sakura" && (
        <>
          {/* Day Mode: Hanami Springtime Promenade & Soft Sunbeams */}
          {!isNight && (
            <>
              {/* Dappled Sky & Sakura Canopy Glow */}
              <div className="absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full blur-3xl bg-pink-200/35 pointer-events-none" />
              <div className="absolute top-1/4 -right-16 w-[380px] h-[380px] rounded-full blur-3xl bg-rose-200/30 pointer-events-none" />
              <div className="absolute top-1/2 left-1/4 w-[340px] h-[340px] rounded-full blur-3xl bg-fuchsia-100/25 pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-[420px] h-[300px] rounded-full blur-3xl bg-pink-100/30 pointer-events-none" />
            </>
          )}

          {/* Night Mode: Yozakura (Moonlit Night Cherry Blossoms & Paper Lantern Aura) */}
          {isNight && (
            <>
              {/* Japanese Lantern Warm Rose Ambient Glow */}
              <div className="absolute top-4 right-12 w-[340px] h-[340px] rounded-full blur-3xl bg-rose-500/12 pointer-events-none" />
              <div className="absolute bottom-16 left-12 w-[320px] h-[320px] rounded-full blur-3xl bg-pink-600/10 pointer-events-none" />
              <div className="absolute top-1/2 left-1/3 w-[260px] h-[260px] rounded-full blur-3xl bg-fuchsia-600/8 pointer-events-none" />
            </>
          )}

          {/* Floating Hanami Pollen Motes & Blossom Sparks */}
          {showParticles &&
            SAKURA_MOTES.map((m) => (
              <div
                key={`sakura-mote-${m.id}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: m.left,
                  top: m.top,
                  width: `${m.size}px`,
                  height: `${m.size}px`,
                  backgroundColor: m.color,
                  boxShadow: `0 0 8px ${m.color}`,
                  animation: `sakuraMoteFloat ${m.duration} ease-in-out infinite ${m.delay}`,
                  willChange: "transform, opacity",
                }}
              />
            ))}

          {/* Falling Japanese Sakura Blossom Petals with Translucent Gradients & Notched Tips */}
          {showParticles &&
            SAKURA_PETALS.map((p) => (
              <div
                key={`sakura-${p.id}`}
                className={`absolute top-0 pointer-events-none ${p.blur}`}
                style={{
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animation: `sakuraFallGPU ${p.duration} linear infinite ${p.delay}`,
                  ["--sway" as string]: p.swayDist,
                  ["--rot" as string]: `${p.rotStart}deg`,
                  ["--op" as string]: `${p.opacity}`,
                  willChange: "transform, opacity",
                }}
              >
                {/* 1. Classic Somei-Yoshino Notched Single Petal */}
                {p.type === "notch" && (
                  <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_2px_8px_rgba(244,114,182,0.35)]">
                    <defs>
                      <linearGradient id={p.gradient.id} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={p.gradient.stop1} />
                        <stop offset="55%" stopColor={p.gradient.stop2} />
                        <stop offset="100%" stopColor={p.gradient.stop3} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 16 3 C 14.2 1.2, 11 0.5, 7.5 1.5 C 3.2 2.8, 1 7.2, 1.5 12 C 2.5 18, 9.5 24.5, 16 30.5 C 22.5 24.5, 29.5 18, 30.5 12 C 31 7.2, 28.8 2.8, 24.5 1.5 C 21 0.5, 17.8 1.2, 16 3 Z"
                      fill={`url(#${p.gradient.id})`}
                      stroke={p.gradient.stop1}
                      strokeWidth="0.5"
                      strokeOpacity="0.7"
                    />
                    <path
                      d="M 16 7 Q 16 18 16 28"
                      stroke="#ffffff"
                      strokeWidth="0.7"
                      strokeOpacity="0.4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* 2. Curved Floating Petal (Side angle flutter) */}
                {p.type === "curved" && (
                  <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_2px_8px_rgba(244,114,182,0.35)]">
                    <defs>
                      <linearGradient id={p.gradient.id} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={p.gradient.stop1} />
                        <stop offset="50%" stopColor={p.gradient.stop2} />
                        <stop offset="100%" stopColor={p.gradient.stop3} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 6 4 C 14 1, 24 5, 27 13 C 30 20, 24 28, 16 29 C 10 29, 4 23, 5 15 C 5 9, 2 6, 6 4 Z"
                      fill={`url(#${p.gradient.id})`}
                      stroke={p.gradient.stop1}
                      strokeWidth="0.6"
                      strokeOpacity="0.7"
                    />
                    <path
                      d="M 11 9 Q 17 17 19 25"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      strokeOpacity="0.45"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* 3. Five-Petaled Japanese Cherry Blossom */}
                {p.type === "blossom" && (
                  <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_3px_10px_rgba(244,114,182,0.45)]">
                    <defs>
                      <linearGradient id={p.gradient.id} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={p.gradient.stop1} />
                        <stop offset="60%" stopColor={p.gradient.stop2} />
                        <stop offset="100%" stopColor={p.gradient.stop3} />
                      </linearGradient>
                    </defs>
                    <g fill={`url(#${p.gradient.id})`} stroke="#ffffff" strokeWidth="0.4" strokeOpacity="0.6">
                      <path d="M 16 16 C 14 10, 11 4, 16 2 C 21 4, 18 10, 16 16 Z" />
                      <path d="M 16 16 C 22 13, 28 13, 29 18 C 27 22, 21 19, 16 16 Z" />
                      <path d="M 16 16 C 18 22, 22 28, 17 30 C 13 27, 14 21, 16 16 Z" />
                      <path d="M 16 16 C 11 21, 5 24, 3 20 C 4 15, 10 15, 16 16 Z" />
                      <path d="M 16 16 C 10 13, 4 9, 6 4 C 11 4, 13 10, 16 16 Z" />
                    </g>
                    <circle cx="16" cy="16" r="2.2" fill="#e11d48" />
                    <circle cx="16" cy="16" r="1.1" fill="#fef08a" />
                  </svg>
                )}

                {/* 4. Swirling Petal Pair */}
                {p.type === "petalPair" && (
                  <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_2px_8px_rgba(244,114,182,0.35)]">
                    <defs>
                      <linearGradient id={p.gradient.id} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={p.gradient.stop1} />
                        <stop offset="50%" stopColor={p.gradient.stop2} />
                        <stop offset="100%" stopColor={p.gradient.stop3} />
                      </linearGradient>
                    </defs>
                    <g fill={`url(#${p.gradient.id})`} stroke={p.gradient.stop1} strokeWidth="0.5" strokeOpacity="0.6">
                      <path d="M 14 6 C 11 3, 7 3, 5 7 C 3 12, 8 18, 14 23 C 19 18, 23 12, 21 7 C 19 3, 16 3, 14 6 Z" />
                      <path d="M 20 12 C 18 9, 15 9, 13 12 C 11 16, 15 21, 20 25 C 24 21, 27 16, 25 12 C 23 9, 21 9, 20 12 Z" opacity="0.88" />
                    </g>
                  </svg>
                )}
              </div>
            ))}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SPRING THEME BACKGROUND (FLORA & MEADOW PETALS) */}
      {/* ------------------------------------------------------------- */}
      {activeTheme === "spring" && (
        <>
          {/* Day Mode Cherry Blossom Sunbeams */}
          {!isNight && (
            <>
              <div className="absolute -top-16 -left-16 w-[340px] h-[340px] rounded-full blur-2xl bg-pink-500/25" />
              <div className="absolute top-1/3 -right-16 w-[320px] h-[320px] rounded-full blur-2xl bg-emerald-500/20" />
              <div className="absolute bottom-0 left-1/4 w-[360px] h-[260px] rounded-full blur-2xl bg-rose-400/20" />
            </>
          )}

          {/* Falling Sakura Petals via GPU translate3d */}
          {showParticles &&
            SPRING_PETALS.map((p) => (
              <div
                key={p.id}
                className="absolute top-0 pointer-events-none"
                style={{
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  color: p.color,
                  animation: `sakuraFallGPU ${p.duration} linear infinite ${p.delay}`,
                  ["--sway" as string]: p.swayDist,
                  ["--rot" as string]: `${p.rotStart}deg`,
                  willChange: "transform, opacity",
                }}
              >
                <svg viewBox="0 0 24 24" className="w-full h-full opacity-85">
                  <path
                    d="M12 2C15 5 21 8 20 15 C19 20 15 22 12 20 C9 22 5 20 4 15 C3 8 9 5 12 2 Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            ))}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SUMMER THEME BACKGROUND (FIREFLIES & SUNBEAMS) */}
      {/* ------------------------------------------------------------- */}
      {activeTheme === "summer" && (
        <>
          {/* Day Mode Sunburst Glow (Only in Day mode, never in Night mode) */}
          {!isNight && (
            <>
              <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full blur-2xl bg-amber-400/30" />
              <div className="absolute bottom-0 -left-16 w-[360px] h-[300px] rounded-full blur-2xl bg-cyan-500/25" />
            </>
          )}

          {/* Fireflies / Sun Sparkles */}
          {showParticles &&
            SUMMER_FIREFLIES.map((s) => (
              <div
                key={s.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: s.left,
                  top: s.top,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  backgroundColor: s.color,
                  animation: `fireflyFast ${s.duration} ease-in-out infinite ${s.delay}`,
                  ["--px" as string]: s.xMove,
                  ["--py" as string]: s.yMove,
                  willChange: "transform, opacity",
                }}
              />
            ))}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. AUTUMN THEME BACKGROUND (FALLING MAPLE LEAVES) */}
      {/* ------------------------------------------------------------- */}
      {activeTheme === "autumn" && (
        <>
          {/* Day Mode Golden Harvest Light */}
          {!isNight && (
            <>
              <div className="absolute -top-16 -left-16 w-[360px] h-[360px] rounded-full blur-2xl bg-orange-600/25" />
              <div className="absolute top-1/2 -right-16 w-[340px] h-[340px] rounded-full blur-2xl bg-red-600/20" />
              <div className="absolute bottom-0 left-1/3 w-[380px] h-[260px] rounded-full blur-2xl bg-amber-500/25" />
            </>
          )}

          {/* Falling Autumn Leaves via GPU translate3d */}
          {showParticles &&
            AUTUMN_LEAVES.map((l) => (
              <div
                key={l.id}
                className="absolute top-0 pointer-events-none"
                style={{
                  left: l.left,
                  width: `${l.size}px`,
                  height: `${l.size}px`,
                  color: l.color,
                  animation: `leafFallGPU ${l.duration} ease-in-out infinite ${l.delay}`,
                  ["--sway" as string]: l.swayDist,
                  ["--rot" as string]: `${l.rotStart}deg`,
                  willChange: "transform, opacity",
                }}
              >
                <svg viewBox="0 0 24 24" className="w-full h-full opacity-85">
                  <path
                    d="M12 2 L13.8 6.5 L18.5 4.5 L16 9 L21.5 11 L16 13.5 L18 19 L13.2 16 L12 22 L10.8 16 L6 19 L8 13.5 L2.5 11 L8 9 L5.5 4.5 L10.2 6.5 Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            ))}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. WINTER THEME BACKGROUND (FALLING SNOWFLAKES) */}
      {/* ------------------------------------------------------------- */}
      {activeTheme === "winter" && (
        <>
          {/* Day Mode Arctic Glacier Light */}
          {!isNight && (
            <>
              <div className="absolute -top-20 -left-20 w-[380px] h-[380px] rounded-full blur-2xl bg-sky-400/25" />
              <div className="absolute top-1/3 -right-20 w-[340px] h-[340px] rounded-full blur-2xl bg-indigo-500/20" />
              <div className="absolute bottom-0 left-1/4 w-[380px] h-[280px] rounded-full blur-2xl bg-cyan-300/20" />
            </>
          )}

          {/* Falling Snowflakes via GPU translate3d */}
          {showParticles &&
            WINTER_SNOWFLAKES.map((s) => (
              <div
                key={s.id}
                className="absolute top-0 pointer-events-none"
                style={{
                  left: s.left,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  animation: `snowFallGPU ${s.duration} linear infinite ${s.delay}`,
                  ["--sway" as string]: s.swayDist,
                  ["--op" as string]: s.opacity,
                  willChange: "transform, opacity",
                }}
              >
                {s.isCrystalline ? (
                  <svg viewBox="0 0 24 24" className="w-full h-full text-sky-200/90">
                    <path
                      d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14M12 5l-2-2m4 0l-2 2M12 19l-2 2m4 0l-2-2M5 12l-2-2m0 4l2-2M19 12l2-2m0 4l-2-2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                ) : (
                  <div className="w-full h-full rounded-full bg-white/80" />
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
}

const AnimatedThemeBackground = React.memo(AnimatedThemeBackgroundComponent);
export default AnimatedThemeBackground;

