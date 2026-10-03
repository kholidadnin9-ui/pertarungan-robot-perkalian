import { useEffect, useState } from 'react';
import type { RobotDef, RobotId } from '@/game/robots';
import type { Cutout } from '@/game/cutout';
import type { BattleResult, LevelDef } from '@/game/levels';
import { sfx } from '@/game/sound';
import { Confetti } from './Effects';
import { FitPanel, HomeIcon, PillButton, PlayIcon, RetryIcon, RoundButton, SoundIcon, StarIcon } from './ui';

export const CREDIT = 'Created by: widodo guru sd';

/* ---------------- Intro + hitung mundur ---------------- */
export function IntroOverlay({ level }: { level: LevelDef }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [
      window.setTimeout(() => sfx.whoosh(), 0),
      window.setTimeout(() => sfx.stomp(), 630),
      window.setTimeout(() => sfx.stomp(), 830),
      window.setTimeout(() => {
        setStep(1);
        sfx.beep();
      }, 1400),
      window.setTimeout(() => {
        setStep(2);
        sfx.beep();
      }, 2100),
      window.setTimeout(() => {
        setStep(3);
        sfx.beep();
      }, 2800),
      window.setTimeout(() => {
        setStep(4);
        sfx.beep(true);
      }, 3500),
    ];
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
      {step === 0 && (
        <div className="hud-panel pop-in rounded-[28px] px-12 py-6 text-center">
          <div className="font-game text-[22px] tracking-[.3em] text-teal-200">LEVEL {level.id}</div>
          <div className="font-game text-[66px] leading-none text-amber-300 txt-stroke">{level.title.toUpperCase()}</div>
          <div className="mt-3 text-[26px] font-black text-white">
            Perkalian {level.tables[0]} &amp; {level.tables[1]}
          </div>
          <div className="mt-1 text-[17px] font-bold text-teal-100">10 soal • {level.timeLimit} detik per soal • 3 pilihan jawaban</div>
          <div className="mt-2 text-[13px] font-bold text-teal-100/85">{CREDIT}</div>
        </div>
      )}
      {step >= 1 && step <= 3 && (
        <div
          key={step}
          className="count-zoom font-game text-[230px] leading-none text-white txt-stroke-lg"
          style={{ textShadow: '0 0 40px rgba(34,211,238,.85)' }}
        >
          {4 - step}
        </div>
      )}
      {step === 4 && (
        <div
          className="count-zoom font-game text-[150px] leading-none text-amber-300 txt-stroke-lg"
          style={{ textShadow: '0 0 40px rgba(251,146,60,.9)' }}
        >
          SERANG!
        </div>
      )}
    </div>
  );
}

/* ---------------- Jeda ---------------- */
export function PauseOverlay({
  onResume,
  onRestart,
  onMenu,
  muted,
  onToggleMute,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(2,12,18,.64)' }}>
      <FitPanel width={470}>
        <div className="hud-panel flex flex-col items-center gap-4 rounded-[30px] px-8 pb-7 pt-6">
          <div className="font-game text-[56px] leading-none text-white txt-stroke">JEDA</div>
          <div className="-mt-1 mb-1 text-[17px] font-bold text-teal-100">Waktu berhenti sementara</div>
          <PillButton onClick={onResume} style={{ width: 380, height: 86 }}>
            <PlayIcon />
            <span className="text-[28px]">LANJUTKAN</span>
          </PillButton>
          <PillButton color="orange" onClick={onRestart} style={{ width: 380, height: 86 }}>
            <RetryIcon />
            <span className="text-[26px]">ULANGI LEVEL</span>
          </PillButton>
          <PillButton color="red" onClick={onMenu} style={{ width: 380, height: 86 }}>
            <HomeIcon />
            <span className="text-[26px]">MENU UTAMA</span>
          </PillButton>
          <div className="mt-2 flex items-center gap-3">
            <RoundButton size={68} onClick={onToggleMute} title="Suara">
              <SoundIcon muted={muted} size={30} />
            </RoundButton>
            <span className="text-[17px] font-extrabold">{muted ? 'Suara mati' : 'Suara hidup'}</span>
          </div>
          <div className="text-[13px] font-bold text-teal-100/85">{CREDIT}</div>
        </div>
      </FitPanel>
    </div>
  );
}

/* ---------------- Hasil pertarungan ---------------- */
function RobotShow({
  robot,
  cutout,
  height,
  faceRight,
  maxW,
}: {
  robot: RobotDef;
  cutout: Cutout;
  height: number;
  faceRight: boolean;
  maxW: number;
}) {
  const flip = faceRight !== cutout.facesRight;
  return (
    <div className="robot-bob relative flex items-end justify-center" style={{ height }}>
      <div
        className="absolute bottom-[-10px] left-1/2 h-10 w-[80%] -translate-x-1/2 rounded-[50%]"
        style={{ background: `radial-gradient(ellipse, ${robot.glow}, rgba(0,0,0,0) 70%)` }}
      />
      <img
        src={cutout.src}
        alt={robot.name}
        draggable={false}
        className="relative h-full w-auto"
        style={{
          maxWidth: maxW,
          objectFit: 'contain',
          objectPosition: '50% 100%',
          transform: flip ? 'scaleX(-1)' : undefined,
          mixBlendMode: cutout.processed ? undefined : 'multiply',
        }}
      />
    </div>
  );
}

export function ResultOverlay({
  mode,
  level,
  robots,
  cutouts,
  names,
  result,
  onRetry,
  onNext,
  onLevels,
  onMenu,
}: {
  mode: 1 | 2;
  level: LevelDef;
  robots: [RobotDef, RobotDef];
  cutouts: Record<RobotId, Cutout>;
  names: [string, string];
  result: BattleResult;
  onRetry: () => void;
  onNext: () => void;
  onLevels: () => void;
  onMenu: () => void;
}) {
  const { winner, hits, wrong, avg, stars } = result;
  const humanLost = mode === 1 && winner === 1;
  const canNext = level.id < 5 && (mode === 2 || winner === 0);
  const champion = mode === 1 && winner === 0 && level.id === 5;
  const title = winner === null ? 'SERI!' : mode === 1 ? (winner === 0 ? 'KAMU MENANG!' : 'KAMU KALAH...') : `${names[winner]} MENANG!`;
  const subtitle =
    winner === null
      ? 'Kedua robot sama kuat! Ayo bertanding lagi.'
      : humanLost
        ? 'Jangan menyerah! Latihan lagi, kamu pasti bisa!'
        : `${robots[winner].name} menghancurkan robot lawan!`;
  const fmt = (n: number | null) => (n === null ? '-' : `${n.toFixed(1)} dtk`);
  const shown = winner === null ? null : robots[winner];
  const titleColor = humanLost ? '#fda4af' : winner === null ? '#bae6fd' : '#fcd34d';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(2,12,18,.6)' }}>
      {!humanLost && winner !== null && <Confetti count={46} width={1720} />}
      <FitPanel width={1080}>
        <div className="hud-panel rounded-[30px] p-7">
          <div className="flex gap-6">
            <div
              className="relative flex w-[270px] shrink-0 items-end justify-center overflow-hidden rounded-[22px] pb-4"
              style={{ height: 396, background: 'radial-gradient(circle at 50% 60%, rgba(255,255,255,.14), rgba(0,0,0,.28))' }}
            >
              <div className="sunburst" />
              {shown ? (
                <RobotShow robot={shown} cutout={cutouts[shown.id]} height={340} faceRight={winner === 0} maxW={258} />
              ) : (
                <div className="relative flex items-end gap-1">
                  <RobotShow robot={robots[0]} cutout={cutouts[robots[0].id]} height={225} faceRight maxW={134} />
                  <RobotShow robot={robots[1]} cutout={cutouts[robots[1].id]} height={225} faceRight={false} maxW={134} />
                </div>
              )}
              {winner !== null && !humanLost && <div className="absolute left-3 top-2 text-[54px]">🏆</div>}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="font-game text-[15px] tracking-[.16em] text-teal-200">
                LEVEL {level.id} • {level.title.toUpperCase()} • PERKALIAN {level.tables[0]} &amp; {level.tables[1]}
              </div>
              <div className="mt-1 font-game text-[50px] leading-[1.05] txt-stroke" style={{ color: titleColor }}>
                {title}
              </div>
              <div className="mt-1 text-[19px] font-extrabold text-cyan-50">{subtitle}</div>
              {mode === 1 && winner === 0 && (
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <span key={s} className="pop-in" style={{ animationDelay: `${0.3 + s * 0.2}s` }}>
                      <StarIcon size={46} filled={s <= stars} />
                    </span>
                  ))}
                </div>
              )}
              {champion && (
                <div
                  className="mt-2 rounded-2xl px-4 py-2 text-[18px] font-black text-amber-950"
                  style={{ background: 'linear-gradient(90deg,#fde68a,#facc15)' }}
                >
                  🎉 SELAMAT! Kamu JUARA PERKALIAN — semua level telah ditaklukkan!
                </div>
              )}
              <div className="mt-3 grid grid-cols-[1fr_118px_118px] gap-y-1.5 rounded-2xl bg-black/30 px-5 py-3 text-[18px] font-extrabold">
                <span className="text-teal-200">STATISTIK</span>
                <span className="text-center font-game text-[16px]" style={{ color: robots[0].light }}>
                  {names[0]}
                </span>
                <span className="text-center font-game text-[16px]" style={{ color: robots[1].light }}>
                  {names[1]}
                </span>
                <span>⚡ Serangan berhasil</span>
                <span className="text-center">{hits[0]}</span>
                <span className="text-center">{hits[1]}</span>
                <span>❌ Jawaban salah</span>
                <span className="text-center">{wrong[0]}</span>
                <span className="text-center">{wrong[1]}</span>
                <span>⏱ Rata-rata kecepatan</span>
                <span className="text-center">{fmt(avg[0])}</span>
                <span className="text-center">{fmt(avg[1])}</span>
              </div>
            </div>
          </div>

          {/* Baris tombol selalu utuh di bagian bawah panel */}
          <div className="mt-5 flex items-center justify-center gap-5 border-t-2 border-white/15 pt-5">
            <PillButton onClick={onRetry} style={{ width: 210, height: 80 }}>
              <RetryIcon size={26} />
              <span className="text-[24px]">ULANGI</span>
            </PillButton>
            {canNext ? (
              <PillButton color="green" onClick={onNext} style={{ width: 300, height: 88 }}>
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[28px]">LANJUT ▶</span>
                  <span className="mt-1 font-body text-[16px] font-extrabold text-emerald-50" style={{ WebkitTextStroke: 0 }}>
                    ke Level {level.id + 1}
                  </span>
                </span>
              </PillButton>
            ) : (
              <PillButton color="green" onClick={onLevels} style={{ width: 300, height: 88 }}>
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[28px]">PILIH LEVEL</span>
                  <span className="mt-1 font-body text-[16px] font-extrabold text-emerald-50" style={{ WebkitTextStroke: 0 }}>
                    Main lagi dari sini
                  </span>
                </span>
              </PillButton>
            )}
            {canNext && (
              <PillButton color="orange" onClick={onLevels} style={{ width: 220, height: 80 }}>
                <span className="text-[22px]">PILIH LEVEL</span>
              </PillButton>
            )}
            <RoundButton size={78} onClick={onMenu} title="Menu Utama">
              <HomeIcon size={32} />
            </RoundButton>
          </div>
          <div className="mt-3 text-center text-[13px] font-bold text-teal-100/85">{CREDIT}</div>
        </div>
      </FitPanel>
    </div>
  );
}

/* ---------------- Cara bermain ---------------- */
const STEPS: [string, string][] = [
  ['🎮', 'Pilih mode 1 Pemain (lawan komputer) atau 2 Pemain (lawan teman).'],
  ['🤖', 'Pilih robot jagoanmu: Biru, Kuning, Pink, atau Hijau.'],
  ['🏆', 'Ada 5 level. Setiap level berisi 10 soal perkalian.'],
  ['⚡', 'Pilih 1 dari 3 jawaban secepat mungkin!'],
  ['💥', 'Paling cepat & benar → robotmu menembak robot lawan!'],
  ['❌', 'Salah jawab → robotmu tersetrum & tidak bisa menjawab soal itu lagi.'],
  ['🔥', 'Setelah 10 soal, robot dengan serangan terbanyak menghancurkan lawannya!'],
  ['⭐', 'Mode 1 pemain: menangkan level untuk membuka level berikutnya.'],
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(2,12,18,.72)' }} onClick={onClose}>
      <FitPanel width={1040}>
        <div className="hud-panel rounded-[30px] px-9 pb-6 pt-6" onClick={(e) => e.stopPropagation()}>
          <div className="text-center font-game text-[42px] leading-none text-amber-300 txt-stroke">CARA BERMAIN</div>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
            {STEPS.map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-black/25 px-3 py-2">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-700/70 text-[26px]">{icon}</span>
                <span className="text-[18px] font-extrabold leading-snug text-cyan-50">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6 rounded-2xl bg-black/35 p-4">
            <div>
              <div className="font-game text-[20px] text-sky-300">PEMAIN 1 (KIRI)</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[17px] font-bold">
                <span className="kbd">A</span>
                <span className="kbd">S</span>
                <span className="kbd">D</span>
                <span>atau sentuh/klik tombol bulat kiri</span>
              </div>
            </div>
            <div>
              <div className="font-game text-[20px] text-pink-300">PEMAIN 2 (KANAN)</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[17px] font-bold">
                <span className="kbd">J</span>
                <span className="kbd">K</span>
                <span className="kbd">L</span>
                <span>atau</span>
                <span className="kbd">←</span>
                <span className="kbd">↓</span>
                <span className="kbd">→</span>
                <span>/ sentuh tombol kanan</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-center text-[16px] font-bold text-teal-100">
            Tekan <span className="kbd">Esc</span> atau <span className="kbd">P</span> untuk jeda • Mode 1 pemain: semua tombol di atas
            menggerakkan robotmu
          </div>
          <div className="mt-4 flex items-center justify-center gap-5">
            <PillButton color="green" onClick={onClose} style={{ width: 320, height: 84 }}>
              <span className="text-[28px]">SIAP! MULAI</span>
            </PillButton>
          </div>
          <div className="mt-3 text-center text-[13px] font-bold text-teal-100/85">{CREDIT}</div>
        </div>
      </FitPanel>
    </div>
  );
}

/* ---------------- Saran memutar HP ---------------- */
export function RotateHint({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 p-8 text-center"
      style={{ background: 'radial-gradient(circle at 50% 40%, #0f5563, #03161c)' }}
    >
      <div className="rotate-phone text-[90px]">📱</div>
      <div className="font-game text-[26px] leading-tight text-amber-300">Putar HP-mu ke posisi mendatar</div>
      <div className="max-w-sm text-[17px] font-bold text-cyan-50">
        Robot Battle Perkalian lebih seru dimainkan dalam mode lanskap (landscape).
      </div>
      <button
        type="button"
        className="rounded-full border-4 border-slate-200 bg-teal-600 px-7 py-3 font-game text-[18px] text-white shadow-lg"
        onClick={onContinue}
      >
        Tetap Main
      </button>
      <div className="text-[12px] font-bold text-teal-100/80">{CREDIT}</div>
    </div>
  );
}
