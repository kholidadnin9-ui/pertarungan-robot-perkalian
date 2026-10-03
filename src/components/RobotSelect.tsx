import { useState } from 'react';
import { ROBOTS, robotById, type RobotId } from '@/game/robots';
import type { Cutout } from '@/game/cutout';
import { sfx } from '@/game/sound';
import { CityBackground } from './Stage';
import { RobotPortrait } from './Robot';
import { BackIcon, FitPanel, PillButton, RoundButton, TitleRibbon, cx } from './ui';

export function RobotSelect({
  mode,
  cutouts,
  onBack,
  onDone,
}: {
  mode: 1 | 2;
  cutouts: Record<RobotId, Cutout>;
  onBack: () => void;
  onDone: (a: RobotId, b: RobotId) => void;
}) {
  const [p1, setP1] = useState<RobotId | null>(null);
  const [p2, setP2] = useState<RobotId | null>(null);
  const step = p1 === null ? 0 : p2 === null ? 1 : 2;

  const pick = (id: RobotId) => {
    if (step === 0) {
      setP1(id);
      sfx.select();
      if (mode === 1) {
        const others = ROBOTS.filter((r) => r.id !== id);
        setP2(others[Math.floor(Math.random() * others.length)].id);
      }
    } else if (step === 1 && id !== p1) {
      setP2(id);
      sfx.select();
    }
  };

  const reset = () => {
    setP1(null);
    setP2(null);
  };

  const title = step === 0 ? (mode === 1 ? 'PILIH ROBOTMU' : 'PEMAIN 1: PILIH ROBOT') : step === 1 ? 'PEMAIN 2: PILIH ROBOT' : 'SIAP BERTARUNG!';
  const sub =
    step === 0
      ? 'Ada 4 robot: Biru, Kuning, Pink, dan Hijau'
      : step === 1
        ? 'Pilih robot yang berbeda dari Pemain 1'
        : mode === 1
          ? 'Komputer memilih robot lawan secara acak'
          : 'Kedua pemain sudah siap!';

  // robot terpilih (untuk panel VS)
  const r1 = p1 ? robotById(p1) : null;
  const r2 = p2 ? robotById(p2) : null;

  return (
    <div className="absolute inset-0">
      <CityBackground dim={0.45} />
      <RoundButton className="absolute left-5 top-5" size={80} onClick={onBack} title="Kembali">
        <BackIcon />
      </RoundButton>
      <div className="absolute left-1/2 top-5 -translate-x-1/2">
        <TitleRibbon key={title} sub={sub}>
          {title}
        </TitleRibbon>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 gap-[26px]" style={{ top: 150 }}>
        {ROBOTS.map((r, i) => {
          const isP1 = p1 === r.id;
          const isP2 = p2 === r.id;
          const picked = isP1 || isP2;
          const disabled = step === 2 || (step === 1 && isP1);
          const cut = cutouts[r.id];
          const flip = !cut.facesRight;
          return (
            <button
              key={r.id}
              type="button"
              disabled={disabled}
              onClick={() => pick(r.id)}
              aria-label={`Pilih robot ${r.colorName}`}
              className={cx('robot-card relative overflow-hidden rounded-[26px]', picked && 'is-picked')}
              style={{
                width: 248,
                height: 372,
                animationDelay: `${i * 0.08}s`,
                background: `linear-gradient(180deg, ${r.dark} 0%, rgba(4,22,28,.94) 78%)`,
                border: `4px solid ${picked ? '#ffffff' : r.main}`,
                boxShadow: picked ? `0 0 0 4px ${r.main}, 0 0 40px ${r.glow}` : '0 14px 28px rgba(0,0,0,.45)',
                opacity: step === 1 && isP1 ? 0.6 : 1,
              }}
            >
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle at 50% 62%, ${r.glow} 0%, rgba(0,0,0,0) 58%)`, opacity: 0.55 }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
                style={{ bottom: 80, width: 200, height: 46, background: `radial-gradient(ellipse, ${r.light} 0%, ${r.main} 38%, rgba(0,0,0,0) 72%)` }}
              />
              <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 96, height: 238 }}>
                <div className="robot-bob h-full" style={{ animationDelay: `${i * 0.3}s` }}>
                  <img
                    src={cut.src}
                    alt={`Robot ${r.colorName}`}
                    draggable={false}
                    className="h-full w-auto"
                    style={{
                      maxWidth: 236,
                      objectFit: 'contain',
                      objectPosition: '50% 100%',
                      transform: flip ? 'scaleX(-1)' : undefined,
                      mixBlendMode: cut.processed ? undefined : 'multiply',
                    }}
                  />
                </div>
              </div>
              <div
                className="absolute inset-x-3 bottom-3 rounded-2xl px-3 py-2 text-center"
                style={{ background: `linear-gradient(180deg, ${r.main}, ${r.dark})`, border: '3px solid rgba(255,255,255,.85)' }}
              >
                <div className="font-game text-[22px] leading-none text-white txt-stroke">{r.name}</div>
                <div className="mt-1 text-[14px] font-extrabold leading-none text-white/90">
                  Robot {r.colorName} • {r.attack}
                </div>
              </div>
              {picked && <div className="pick-badge pop-in">{isP1 ? (mode === 1 ? 'KAMU' : 'P1') : mode === 1 ? 'CPU' : 'P2'}</div>}
            </button>
          );
        })}
      </div>

      {step === 2 && r1 && r2 ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-[18px]">
          <FitPanel width={1040}>
            <div className="hud-panel pop-in flex items-center gap-5 rounded-[26px] px-7 py-4">
              <RobotPortrait robot={r1} cutout={cutouts[r1.id]} size={82} faceRight />
              <div className="text-left">
                <div className="text-[14px] font-extrabold text-teal-200">{mode === 1 ? 'KAMU' : 'PEMAIN 1'}</div>
                <div className="font-game text-[23px] leading-none" style={{ color: r1.light }}>
                  {r1.name}
                </div>
              </div>
              <div className="font-game text-[54px] leading-none text-amber-300 txt-stroke">VS</div>
              <div className="text-right">
                <div className="text-[14px] font-extrabold text-teal-200">{mode === 1 ? 'KOMPUTER' : 'PEMAIN 2'}</div>
                <div className="font-game text-[23px] leading-none" style={{ color: r2.light }}>
                  {r2.name}
                </div>
              </div>
              <RobotPortrait robot={r2} cutout={cutouts[r2.id]} size={82} faceRight={false} />
              <div className="ml-2 flex items-center gap-4">
                <PillButton color="orange" onClick={reset} style={{ width: 170, height: 80 }}>
                  <span className="text-[24px]">GANTI</span>
                </PillButton>
                <PillButton color="green" onClick={() => onDone(r1.id, r2.id)} style={{ width: 280, height: 88 }}>
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[28px]">LANJUT ▶</span>
                    <span className="mt-1 font-body text-[15px] font-extrabold text-emerald-50" style={{ WebkitTextStroke: 0 }}>
                      Pilih Level Perkalian
                    </span>
                  </span>
                </PillButton>
              </div>
            </div>
            <div className="mt-2 text-center text-[12px] font-bold text-teal-100/85">Created by: widodo guru sd</div>
          </FitPanel>
        </div>
      ) : (
        <div
          className="absolute left-1/2 whitespace-nowrap rounded-full border-2 border-white/30 bg-black/55 px-6 py-3 text-[19px] font-extrabold text-cyan-50"
          style={{ bottom: 44, transform: 'translateX(-50%)' }}
        >
          👆{' '}
          {step === 0
            ? mode === 1
              ? 'Ketuk robot untuk memilih jagoanmu'
              : 'Pemain 1, ketuk robot pilihanmu'
            : 'Pemain 2, sekarang giliranmu memilih!'}
          <div className="mt-1 text-[12px] font-bold text-teal-100/85">Created by: widodo guru sd</div>
        </div>
      )}
    </div>
  );
}
