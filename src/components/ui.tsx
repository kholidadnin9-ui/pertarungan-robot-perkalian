import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { sfx } from '@/game/sound';
import { useStage } from './Stage';

/**
 * Panel yang otomatis mengecil agar selalu muat di dalam panggung,
 * sehingga tombol di dalamnya tidak pernah terpotong di layar laptop/HP.
 */
export function FitPanel({ width, children, pad = 26 }: { width: number; children: ReactNode; pad?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { W, H } = useStage();
  const [s, setS] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const sw = (W - pad * 2) / Math.max(1, el.offsetWidth);
      const sh = (H - pad * 2) / Math.max(1, el.offsetHeight);
      setS(Math.max(0.42, Math.min(1, sw, sh)));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [W, H, pad]);

  return (
    <div ref={ref} style={{ width, transform: `scale(${s})`, transformOrigin: 'center center' }}>
      {children}
    </div>
  );
}

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export const vars = (v: Record<string, string | number>) => v as unknown as CSSProperties;

interface RoundButtonProps {
  size?: number;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  disabled?: boolean;
  faceClassName?: string;
  silent?: boolean;
}

/** Tombol bulat metalik teal seperti di game robot referensi */
export function RoundButton({ size = 80, onClick, children, className, style, title, disabled, faceClassName, silent }: RoundButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cx('mbtn', className)}
      style={{ width: size, height: size, ...style }}
      onClick={() => {
        if (!silent) sfx.click();
        onClick?.();
      }}
    >
      <span className={cx('mbtn-face', faceClassName)}>{children}</span>
    </button>
  );
}

interface PillProps {
  children: ReactNode;
  onClick?: () => void;
  color?: 'teal' | 'orange' | 'green' | 'red';
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export function PillButton({ children, onClick, color = 'teal', className, style, disabled }: PillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cx('pbtn', className)}
      style={style}
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
    >
      <span className={cx('pbtn-face', color !== 'teal' && `pbtn-${color}`)}>{children}</span>
    </button>
  );
}

export function TitleRibbon({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="ribbon pop-in">
      <div className="font-game text-[40px] leading-none text-white txt-stroke">{children}</div>
      {sub && <div className="mt-2 text-[17px] font-extrabold leading-none text-cyan-50">{sub}</div>}
    </div>
  );
}

/* ---------------- Ikon ---------------- */
type IconProps = { size?: number };

export const PauseIcon = ({ size = 34 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="5" y="4" width="5" height="16" rx="1.6" />
    <rect x="14" y="4" width="5" height="16" rx="1.6" />
  </svg>
);

export const PlayIcon = ({ size = 30 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.6v14.8a1 1 0 0 0 1.52.85l11.9-7.4a1 1 0 0 0 0-1.7L8.52 3.75A1 1 0 0 0 7 4.6z" />
  </svg>
);

export const BackIcon = ({ size = 34 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 4l-8 8 8 8" />
  </svg>
);

export const HomeIcon = ({ size = 30 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 11.2L12 3.5l9 7.7V20a1 1 0 0 1-1 1h-5.2v-6.2H9.2V21H4a1 1 0 0 1-1-1z" />
  </svg>
);

export const RetryIcon = ({ size = 28 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12a8 8 0 1 0 2.6-5.9" />
    <path d="M4 3.5v5h5" />
  </svg>
);

export const NextIcon = ({ size = 28 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5 4.8v14.4a1 1 0 0 0 1.55.83L16 13.6V19a1 1 0 0 0 2 0V5a1 1 0 0 0-2 0v5.4L6.55 3.97A1 1 0 0 0 5 4.8z" />
  </svg>
);

export const SoundIcon = ({ size = 34, muted }: IconProps & { muted: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    {muted ? (
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    ) : (
      <>
        <path d="M15.5 9a4 4 0 0 1 0 6" />
        <path d="M18.2 6.5a7.5 7.5 0 0 1 0 11" />
      </>
    )}
  </svg>
);

export const FullscreenIcon = ({ size = 32 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const HelpIcon = ({ size = 38 }: IconProps) => (
  <span className="font-game" style={{ fontSize: size, lineHeight: 1 }}>
    ?
  </span>
);

export const LockIcon = ({ size = 48 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 10V7.5a5 5 0 0 1 10 0V10h1a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 6 10zm2.2 0h5.6V7.5a2.8 2.8 0 0 0-5.6 0z" />
  </svg>
);

export const StarIcon = ({ size = 30, filled = true }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.25 6.5L12 17.3l-5.85 3.15 1.25-6.5L2.6 9.4l6.55-.85z"
      fill={filled ? '#fcd34d' : 'rgba(255,255,255,.16)'}
      stroke={filled ? '#92400e' : 'rgba(255,255,255,.45)'}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);
