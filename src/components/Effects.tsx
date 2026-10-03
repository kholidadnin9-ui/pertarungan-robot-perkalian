import { useMemo, type CSSProperties } from 'react';

export interface Pt {
  x: number;
  y: number;
}

const v = (o: Record<string, string | number>) => o as unknown as CSSProperties;

function lineGeom(from: Pt, to: Pt) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return { len: Math.hypot(dx, dy), ang: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/** Sinar laser sekali tembak dari meriam robot ke target */
export function LaserBeam({
  from,
  to,
  color,
  thickness = 18,
  delay = 0.15,
  duration = 0.75,
}: {
  from: Pt;
  to: Pt;
  color: string;
  thickness?: number;
  delay?: number;
  duration?: number;
}) {
  const { len, ang } = lineGeom(from, to);
  const flash = thickness * 5;
  return (
    <div className="pointer-events-none absolute inset-0" style={v({ '--beam': color })}>
      <div
        className="beam-wrap"
        style={{ left: from.x, top: from.y - thickness / 2, width: len, height: thickness, transform: `rotate(${ang}deg)` }}
      >
        <div className="beam-core" style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
      </div>
      <div
        className="muzzle"
        style={{ left: from.x - flash / 2, top: from.y - flash / 2, width: flash, height: flash, animationDelay: `${delay}s` }}
      />
    </div>
  );
}

/** Laser berulang untuk animasi menu utama */
export function LoopBeam({ from, to, color, delay = 0, thickness = 16 }: { from: Pt; to: Pt; color: string; delay?: number; thickness?: number }) {
  const { len, ang } = lineGeom(from, to);
  return (
    <div className="pointer-events-none absolute inset-0" style={v({ '--beam': color })}>
      <div
        className="beam-wrap"
        style={{ left: from.x, top: from.y - thickness / 2, width: len, height: thickness, transform: `rotate(${ang}deg)` }}
      >
        <div className="loop-beam" style={{ animationDelay: `${delay}s` }} />
      </div>
      <div className="loop-flash" style={{ left: from.x - 45, top: from.y - 45, animationDelay: `${delay}s` }} />
      <div className="loop-impact" style={{ left: to.x - 80, top: to.y - 80, animationDelay: `${delay}s` }} />
    </div>
  );
}

/** Bola energi yang mengisi daya sebelum serangan pamungkas */
export function ChargeOrb({ at, color, size = 160 }: { at: Pt; color: string; size?: number }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={v({ left: at.x - size / 2, top: at.y - size / 2, width: size, height: size, '--beam': color })}
    >
      <div className="charge-orb absolute inset-0 rounded-full" />
      <div className="charge-ring absolute inset-0 rounded-full" />
    </div>
  );
}

const DEBRIS_COLORS = ['#ffd23f', '#ff8a00', '#6b7280', '#fde68a', '#f97316', '#374151'];

export function Explosion({ x, y, size = 200, delay = 0, debris = 12 }: { x: number; y: number; size?: number; delay?: number; debris?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: debris }, (_, i) => {
        const a = (i / debris) * Math.PI * 2 + Math.random() * 0.6;
        const dist = size * (0.55 + Math.random() * 0.75);
        return {
          dx: Math.cos(a) * dist,
          dy: Math.sin(a) * dist - size * 0.25,
          rot: (Math.random() - 0.5) * 900,
          s: 7 + Math.random() * 13,
          c: DEBRIS_COLORS[i % DEBRIS_COLORS.length],
        };
      }),
    [size, debris],
  );
  const circle = (s: number, ox = 0, oy = 0): CSSProperties => ({
    left: ox,
    top: oy,
    width: s,
    height: s,
    marginLeft: -s / 2,
    marginTop: -s / 2,
  });
  const dl = (extra = 0): CSSProperties => ({ animationDelay: `${delay + extra}s` });
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y, width: 0, height: 0 }}>
      <div className="exp exp-smoke" style={{ ...circle(size * 1.3, 0, -size * 0.1), ...dl(0.15) }} />
      <div className="exp exp-fire" style={{ ...circle(size), ...dl() }} />
      <div className="exp exp-fire" style={{ ...circle(size * 0.68, size * 0.24, -size * 0.14), ...dl(0.09) }} />
      <div className="exp exp-fire" style={{ ...circle(size * 0.58, -size * 0.26, size * 0.08), ...dl(0.17) }} />
      <div className="exp exp-ring" style={{ ...circle(size * 0.9), ...dl() }} />
      <div className="exp exp-flash" style={{ ...circle(size * 1.25), ...dl() }} />
      {parts.map((p, i) => (
        <div
          key={i}
          className="exp exp-debris"
          style={{
            width: p.s,
            height: p.s * 0.7,
            marginLeft: -p.s / 2,
            marginTop: -p.s / 2,
            background: p.c,
            ...v({ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--rot': `${p.rot}deg` }),
            ...dl(),
          }}
        />
      ))}
    </div>
  );
}

export function DamagePop({ x, y, text, delay = 0.4, color = '#ff3b3b' }: { x: number; y: number; text: string; delay?: number; color?: string }) {
  return (
    <div
      className="dmg-pop pointer-events-none absolute text-center font-game txt-stroke-lg"
      style={{ left: x - 100, top: y - 50, width: 200, fontSize: 70, lineHeight: 1, color, animationDelay: `${delay}s` }}
    >
      {text}
    </div>
  );
}

const ZAPS = [
  '22,28 32,22 28,34 42,28 37,40 50,36',
  '58,20 52,32 64,30 57,44 69,42',
  '28,52 40,47 36,59 50,55 46,67',
  '60,56 71,50 67,63 79,59',
  '40,12 46,22 38,24 47,34',
];

/** Efek robot tersetrum saat jawaban salah */
export function ElectricSparks() {
  return (
    <svg className="zap-wrap pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {ZAPS.map((p, i) => (
        <polyline
          key={i}
          points={p}
          className="zap"
          fill="none"
          stroke="#e8fdff"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </svg>
  );
}

/** Asap & api pada robot yang hancur */
export function BurningSmoke({ x, y }: { x: number; y: number }) {
  const puffs = [
    { dx: -40, s: 80, d: 0, sx: -40 },
    { dx: 10, s: 100, d: 0.65, sx: 30 },
    { dx: 45, s: 70, d: 1.3, sx: 50 },
    { dx: -10, s: 90, d: 1.95, sx: -20 },
  ];
  const flames = [
    { dx: -30, dy: 10, s: 46 },
    { dx: 20, dy: -14, s: 58 },
    { dx: 50, dy: 22, s: 38 },
  ];
  return (
    <div className="burn-wrap pointer-events-none absolute" style={{ left: x, top: y, width: 0, height: 0 }}>
      {puffs.map((p, i) => (
        <div
          key={i}
          className="smoke-puff"
          style={{ left: p.dx - p.s / 2, top: -p.s / 2, width: p.s, height: p.s, animationDelay: `${p.d}s`, ...v({ '--sx': `${p.sx}px` }) }}
        />
      ))}
      {flames.map((f, i) => (
        <div key={i} className="flame" style={{ left: f.dx - f.s / 2, top: f.dy - f.s, width: f.s, height: f.s * 1.3, animationDelay: `${i * 0.07}s` }} />
      ))}
    </div>
  );
}

const CONF_COLORS = ['#facc15', '#22d3ee', '#f472b6', '#4ade80', '#60a5fa', '#fb923c'];

export function Confetti({ count = 40, width = 1000 }: { count?: number; width?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * width,
        delay: Math.random() * 3,
        dur: 2.6 + Math.random() * 2.2,
        c: CONF_COLORS[i % CONF_COLORS.length],
        s: 0.7 + Math.random() * 0.7,
      })),
    [count, width],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => (
        <div
          key={i}
          className="confetti"
          style={{ left: it.left, width: 12 * it.s, height: 18 * it.s, background: it.c, animationDelay: `${it.delay}s`, animationDuration: `${it.dur}s` }}
        />
      ))}
    </div>
  );
}
