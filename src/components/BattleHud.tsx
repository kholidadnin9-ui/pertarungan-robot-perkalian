import { useEffect, useRef } from 'react';
import type { RobotDef } from '@/game/robots';
import type { Cutout } from '@/game/cutout';
import type { P, Question } from '@/game/levels';
import { RobotPortrait } from './Robot';
import { cx } from './ui';

type Side = 'left' | 'right';

/* ---------------- Bar nyawa (HP) ---------------- */
export function HpPanel({
  side,
  label,
  robot,
  cutout,
  hp,
  hits,
  delayMs,
}: {
  side: Side;
  label: string;
  robot: RobotDef;
  cutout: Cutout;
  hp: number;
  hits: number;
  delayMs: number;
}) {
  const isLeft = side === 'left';
  const low = hp <= 30;
  const fill = low
    ? 'linear-gradient(180deg,#ffa0a0 0%,#ef4444 55%,#991b1b 100%)'
    : `linear-gradient(180deg, ${robot.light} 0%, ${robot.main} 55%, ${robot.dark} 100%)`;
  return (
    <div
      className={cx('absolute top-[14px] flex items-center gap-[10px]', !isLeft && 'flex-row-reverse')}
      style={isLeft ? { left: 112, width: 272 } : { right: 130, width: 272 }}
    >
      <RobotPortrait robot={robot} cutout={cutout} size={74} faceRight={isLeft} />
      <div className="min-w-0 flex-1">
        <div className={cx('flex items-center justify-between', !isLeft && 'flex-row-reverse')}>
          <span className="font-game text-[21px] leading-none text-white txt-stroke">{label}</span>
          <span className="font-game text-[18px] leading-none text-amber-300 txt-stroke">⚡{hits}</span>
        </div>
        <div className={cx('hp-frame mt-[6px]', low && 'hp-low')}>
          <div
            className="hp-fill"
            style={{
              width: `${hp}%`,
              background: fill,
              marginLeft: isLeft ? 0 : 'auto',
              transition: `width .7s cubic-bezier(.3,.7,.4,1) ${delayMs}ms`,
            }}
          />
          <div className="hp-segments" />
        </div>
        <div
          className="mt-[6px] truncate font-game text-[13px] leading-none txt-stroke"
          style={{ color: robot.light, textAlign: isLeft ? 'left' : 'right' }}
        >
          {robot.name} • HP {hp}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Panel soal ---------------- */
export function QuestionPanel({
  levelId,
  qIndex,
  total,
  question,
  revealed,
  waiting,
  history,
  colors,
  scoreColors,
  finalScore,
}: {
  levelId: number;
  qIndex: number;
  total: number;
  question: Question;
  revealed: boolean;
  waiting: boolean;
  history: (P | null)[];
  colors: [string, string];
  scoreColors: [string, string];
  finalScore: [number, number] | null;
}) {
  const big = question.answer >= 100 && revealed;
  return (
    <div
      className="hud-panel absolute left-1/2 top-[10px] rounded-[24px] px-5 pb-3 pt-2 text-center"
      style={{ width: 440, transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center justify-between font-game text-[15px] tracking-wider text-teal-200">
        <span>LEVEL {levelId}</span>
        <span>{finalScore ? 'HASIL AKHIR' : `SOAL ${qIndex + 1}/${total}`}</span>
      </div>
      {finalScore ? (
        <div className="q-pop flex items-center justify-center gap-5 font-game text-[62px] leading-[1.15] txt-shadow">
          <span style={{ color: scoreColors[0] }}>{finalScore[0]}</span>
          <span className="text-teal-200">:</span>
          <span style={{ color: scoreColors[1] }}>{finalScore[1]}</span>
        </div>
      ) : waiting ? (
        <div className="flex items-center justify-center gap-3 font-game text-[54px] leading-[1.15] text-amber-300 txt-shadow">
          <span>⚡</span>
          <span>BERSIAP!</span>
          <span>⚡</span>
        </div>
      ) : (
        <div
          key={qIndex}
          className="q-pop flex items-center justify-center gap-3 whitespace-nowrap font-game leading-[1.15] text-white txt-shadow"
          style={{ fontSize: big ? 56 : 62 }}
        >
          <span>{question.a}</span>
          <span className="text-amber-300">×</span>
          <span>{question.b}</span>
          <span className="text-teal-200">=</span>
          <span key={revealed ? 'ans' : 'q'} className={revealed ? 'q-pop text-lime-300' : 'text-amber-300'}>
            {revealed ? question.answer : '?'}
          </span>
        </div>
      )}
      <div className="mt-1 flex justify-center gap-[6px]">
        {Array.from({ length: total }, (_, i) => {
          const h = history[i];
          const current = !finalScore && i === qIndex;
          const bg = h === 0 ? colors[0] : h === 1 ? colors[1] : h === null ? '#475569' : 'rgba(2,20,26,.85)';
          return (
            <span key={i} className={cx('q-dot', current && 'q-dot-current')} style={{ background: bg }}>
              {h === null ? '✕' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Radar timer (pojok kanan atas) ---------------- */
const DOTS = 10;
const R = 44;
const CIRC = 2 * Math.PI * R;

export function RadarTimer({ getRemaining, total }: { getRemaining: () => number; total: number }) {
  const ring = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLDivElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const rem = getRemaining();
      const f = Math.max(0, Math.min(1, rem / total));
      if (ring.current) {
        ring.current.style.strokeDashoffset = `${CIRC * (1 - f)}`;
        ring.current.style.stroke = f > 0.5 ? '#4ade80' : f > 0.25 ? '#facc15' : '#ef4444';
      }
      if (num.current) {
        const t = String(Math.ceil(rem));
        if (num.current.textContent !== t) num.current.textContent = t;
        num.current.style.color = f > 0.25 ? '#86efac' : '#fca5a5';
      }
      const lit = Math.ceil(f * DOTS);
      dots.current.forEach((d, i) => {
        if (d) d.style.opacity = i < lit ? '1' : '0.15';
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getRemaining, total]);

  return (
    <div className="absolute right-4 top-[12px]" style={{ width: 104, height: 104 }} title="Sisa waktu">
      <div className="mbtn h-full w-full" style={{ padding: 6 }}>
        <div className="radar-face relative h-full w-full overflow-hidden rounded-full">
          <div className="radar-sweep absolute inset-0 rounded-full" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
            <circle
              ref={ring}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              transform="rotate(-90 50 50)"
            />
            {Array.from({ length: DOTS }, (_, i) => {
              const a = (i / DOTS) * Math.PI * 2 - Math.PI / 2;
              return (
                <circle
                  key={i}
                  ref={(el) => {
                    dots.current[i] = el;
                  }}
                  cx={50 + Math.cos(a) * 33}
                  cy={50 + Math.sin(a) * 33}
                  r="4.4"
                  fill="#ff2d2d"
                />
              );
            })}
            <polygon points="50,25 56,35 44,35" fill="#22c55e" />
          </svg>
          <div ref={num} className="absolute inset-0 flex items-center justify-center pt-5 font-game text-[30px]" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Pad 3 tombol jawaban ---------------- */
const PAD_POS = [
  { x: 0, y: 34 },
  { x: 126, y: 0 },
  { x: 252, y: 34 },
];
const BTN = 112;

interface AnswerPadProps {
  side: Side;
  label: string;
  robot: RobotDef;
  keys?: string[];
  question: Question;
  qIndex: number;
  picked: number | null;
  locked: boolean;
  reveal: boolean;
  interactive: boolean;
  isCpu: boolean;
  cpuThinking: boolean;
  winnerHere: boolean;
  timeText: string;
  hidden: boolean;
  onPick: (i: number) => void;
}

export function AnswerPad(props: AnswerPadProps) {
  const { side, label, robot, keys, question, qIndex, picked, locked, reveal, interactive, isCpu, cpuThinking, winnerHere, timeText, hidden, onPick } = props;
  const isLeft = side === 'left';
  const anchor = isLeft ? { left: 24 } : { right: 24 };
  const popPos = isLeft ? { left: 30 } : { right: 30 };

  return (
    <div
      className={cx('absolute bottom-[16px] transition-opacity duration-500', hidden && 'pointer-events-none opacity-0')}
      style={{ ...anchor, width: 364, height: 196 }}
    >
      <div className={cx('absolute top-0 flex items-center gap-2', isLeft ? 'left-0' : 'right-0 flex-row-reverse')}>
        <span
          className="pad-label font-game"
          style={{ background: `linear-gradient(180deg, ${robot.light} 0%, ${robot.main} 50%, ${robot.dark} 100%)` }}
        >
          {label}
        </span>
        {isCpu && cpuThinking && (
          <span className="cpu-status">
            berpikir
            <span className="cpu-dots">
              <i />
              <i />
              <i />
            </span>
          </span>
        )}
        {keys && (
          <span className="kbd-hint flex gap-1">
            {keys.map((k) => (
              <span key={k} className="kbd">
                {k}
              </span>
            ))}
          </span>
        )}
      </div>

      {winnerHere && (
        <div key={`w${qIndex}`} className="pad-popup popup-rise" style={popPos}>
          BENAR! ⚡ {timeText}
        </div>
      )}
      {locked && !winnerHere && (
        <div key={`l${qIndex}`} className="pad-popup pad-popup-wrong popup-rise" style={popPos}>
          SALAH! ✖
        </div>
      )}

      {question.options.map((opt, i) => {
        const isPicked = picked === i;
        const isAns = opt === question.answer;
        let face = isCpu ? 'face-cpu' : '';
        let glow = '';
        if (isPicked && !isAns) {
          face = 'face-wrong';
          glow = 'glow-wrong';
        } else if (reveal && isAns) {
          face = 'face-correct';
          glow = isPicked ? 'glow-win' : 'glow-correct';
        }
        const dim = (locked && !isPicked) || (reveal && !isAns && !isPicked);
        return (
          <button
            key={`${qIndex}-${i}`}
            type="button"
            disabled={!interactive}
            aria-label={`Jawaban ${opt}`}
            className={cx('mbtn absolute', glow, dim && 'btn-dim')}
            style={{ left: PAD_POS[i].x, top: 46 + PAD_POS[i].y, width: BTN, height: BTN }}
            onPointerDown={(e) => {
              e.preventDefault();
              if (interactive) onPick(i);
            }}
          >
            <span className={cx('mbtn-face', face)}>
              <span className="relative z-10 font-game leading-none txt-shadow" style={{ fontSize: opt >= 100 ? 36 : 44 }}>
                {opt}
              </span>
              {isPicked && !isAns && (
                <span className="absolute inset-0 z-20 flex items-center justify-center text-[70px] font-black text-white/60">✕</span>
              )}
            </span>
            {keys && <span className="key-badge kbd-hint">{keys[i]}</span>}
          </button>
        );
      })}
    </div>
  );
}
