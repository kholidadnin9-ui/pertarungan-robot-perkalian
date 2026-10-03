import { LEVELS, type Progress } from '@/game/levels';
import { robotById, type RobotId } from '@/game/robots';
import type { Cutout } from '@/game/cutout';
import { sfx } from '@/game/sound';
import { CityBackground } from './Stage';
import { RobotPortrait } from './Robot';
import { BackIcon, LockIcon, RoundButton, StarIcon, TitleRibbon } from './ui';

const LEVEL_BG = [
  'linear-gradient(180deg, #2fbf5b 0%, #14632f 100%)',
  'linear-gradient(180deg, #19b7c9 0%, #0b5866 100%)',
  'linear-gradient(180deg, #3b82f6 0%, #1e3a8a 100%)',
  'linear-gradient(180deg, #a855f7 0%, #581c87 100%)',
  'linear-gradient(180deg, #f43f5e 0%, #7f1d1d 100%)',
];

export function LevelSelect({
  mode,
  progress,
  pair,
  cutouts,
  onBack,
  onPick,
}: {
  mode: 1 | 2;
  progress: Progress;
  pair: [RobotId, RobotId];
  cutouts: Record<RobotId, Cutout>;
  onBack: () => void;
  onPick: (id: number) => void;
}) {
  // pasangan robot yang akan bertarung
  const r1 = robotById(pair[0]);
  const r2 = robotById(pair[1]);

  return (
    <div className="absolute inset-0">
      <CityBackground dim={0.45} />
      <RoundButton className="absolute left-5 top-5" size={80} onClick={onBack} title="Kembali">
        <BackIcon />
      </RoundButton>
      <div className="absolute left-1/2 top-5 -translate-x-1/2">
        <TitleRibbon sub={mode === 1 ? 'Menangkan level untuk membuka level berikutnya' : 'Mode 2 pemain: semua level terbuka'}>
          PILIH LEVEL
        </TitleRibbon>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 gap-5" style={{ top: 150 }}>
        {LEVELS.map((lv, i) => {
          const locked = mode === 1 && lv.id > progress.unlocked;
          const stars = progress.stars[lv.id] ?? 0;
          return (
            <button
              key={lv.id}
              type="button"
              disabled={locked}
              aria-label={`Level ${lv.id}`}
              onClick={() => {
                sfx.select();
                onPick(lv.id);
              }}
              className="level-card relative flex flex-col items-center overflow-hidden rounded-[26px] px-3 pt-3"
              style={{
                width: 204,
                height: 340,
                animationDelay: `${i * 0.07}s`,
                background: LEVEL_BG[i],
                border: '4px solid #e8eef3',
                boxShadow: '0 0 0 4px #062a31, 0 16px 30px rgba(0,0,0,.45)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1/2"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,.22), rgba(255,255,255,0))' }}
              />
              <div className="relative font-game text-[20px] tracking-[.25em] text-white/90">LEVEL</div>
              <div className="relative font-game text-[100px] leading-[.95] text-white txt-stroke" style={{ textShadow: '0 6px 0 rgba(0,0,0,.3)' }}>
                {lv.id}
              </div>
              <div className="relative font-game text-[24px] leading-none text-amber-200 txt-stroke">{lv.title.toUpperCase()}</div>
              <div className="relative mt-3 rounded-xl bg-black/35 px-3 py-1.5 text-[18px] font-black">
                Perkalian {lv.tables[0]} &amp; {lv.tables[1]}
              </div>
              <div className="relative mt-2 text-[15px] font-extrabold text-white/90">⏱ {lv.timeLimit} detik / soal</div>
              <div className="relative text-[15px] font-extrabold text-white/90">
                {mode === 1 ? `🤖 Komputer: ${lv.cpuLabel}` : '⚔️ Duel 10 soal'}
              </div>
              {mode === 1 ? (
                <div className="relative mb-3 mt-auto flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <StarIcon key={s} size={34} filled={s <= stars} />
                  ))}
                </div>
              ) : (
                <div className="relative mb-4 mt-auto text-[15px] font-extrabold text-white/85">10 soal • 3 pilihan</div>
              )}
              {locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 text-slate-200">
                  <LockIcon size={64} />
                  <div className="px-4 text-center text-[16px] font-extrabold">Menangkan Level {lv.id - 1} untuk membuka</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="hud-panel absolute left-1/2 flex items-center gap-5 rounded-[26px] px-6 py-3"
        style={{ bottom: 22, transform: 'translateX(-50%)' }}
      >
        <RobotPortrait robot={r1} cutout={cutouts[r1.id]} size={70} faceRight />
        <div className="font-game text-[20px] leading-tight" style={{ color: r1.light }}>
          {mode === 1 ? 'KAMU' : 'PEMAIN 1'}
          <div className="text-[15px] text-white/90">{r1.name}</div>
        </div>
        <div className="font-game text-[44px] leading-none text-amber-300 txt-stroke">VS</div>
        <div className="text-right font-game text-[20px] leading-tight" style={{ color: r2.light }}>
          {mode === 1 ? 'KOMPUTER' : 'PEMAIN 2'}
          <div className="text-[15px] text-white/90">{r2.name}</div>
        </div>
        <RobotPortrait robot={r2} cutout={cutouts[r2.id]} size={70} faceRight={false} />
        <div className="ml-2 border-l-2 border-white/20 pl-4 text-[12px] font-bold leading-snug text-teal-100/85">
          Created by:
          <br />
          widodo guru sd
        </div>
      </div>
    </div>
  );
}
