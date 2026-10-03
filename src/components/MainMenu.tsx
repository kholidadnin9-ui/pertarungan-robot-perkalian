import { robotById, type RobotId } from '@/game/robots';
import type { Cutout } from '@/game/cutout';
import { CityBackground, useStage } from './Stage';
import { RobotSprite, spriteGeom } from './Robot';
import { LoopBeam } from './Effects';
import { FullscreenIcon, PillButton, RoundButton, SoundIcon, StarIcon } from './ui';

function TitleLogo() {
  const font = '"Russo One", "Arial Black", sans-serif';
  return (
    <svg width={780} height={262} viewBox="0 0 780 262" style={{ overflow: 'visible' }} role="img" aria-label="Robot Battle Perkalian 1-10">
      <defs>
        <linearGradient id="tl-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbd1" />
          <stop offset="0.45" stopColor="#ffd60a" />
          <stop offset="0.6" stopColor="#ffae00" />
          <stop offset="1" stopColor="#ff6a00" />
        </linearGradient>
        <linearGradient id="tl-rib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fcad9" />
          <stop offset="1" stopColor="#0b5664" />
        </linearGradient>
      </defs>
      <text x="390" y="38" textAnchor="middle" fontFamily={font} fontSize="26" fill="#ffffff" stroke="#062a31" strokeWidth="7" paintOrder="stroke" letterSpacing="5">
        • PERTEMPURAN ROBOT •
      </text>
      <text
        x="390"
        y="158"
        textAnchor="middle"
        fontFamily={font}
        fontSize="118"
        textLength="740"
        lengthAdjust="spacingAndGlyphs"
        fill="#4a1800"
        stroke="#220a00"
        strokeWidth="20"
        strokeLinejoin="round"
        transform="translate(0 10)"
      >
        ROBOT BATTLE
      </text>
      <text
        x="390"
        y="158"
        textAnchor="middle"
        fontFamily={font}
        fontSize="118"
        textLength="740"
        lengthAdjust="spacingAndGlyphs"
        fill="url(#tl-fill)"
        stroke="#220a00"
        strokeWidth="12"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        ROBOT BATTLE
      </text>
      <path d="M160 186 H620 L648 216 L620 246 H160 L132 216 Z" fill="url(#tl-rib)" stroke="#eef2f6" strokeWidth="5" strokeLinejoin="round" />
      <text x="390" y="230" textAnchor="middle" fontFamily={font} fontSize="38" fill="#ffffff" stroke="#062a31" strokeWidth="8" paintOrder="stroke" letterSpacing="4">
        PERKALIAN 1 – 10
      </text>
    </svg>
  );
}

export function MainMenu({
  cutouts,
  muted,
  onToggleMute,
  onMode,
  onHelp,
  canFullscreen,
  onFullscreen,
  totalStars,
  unlocked,
}: {
  cutouts: Record<RobotId, Cutout>;
  muted: boolean;
  onToggleMute: () => void;
  onMode: (m: 1 | 2) => void;
  onHelp: () => void;
  canFullscreen: boolean;
  onFullscreen: () => void;
  totalStars: number;
  unlocked: number;
}) {
  const { W, H } = useStage();
  // robot hijau (kiri) vs robot kuning (kanan) seperti gambar referensi
  const L = robotById('green');
  const R = robotById('yellow');
  const rh = Math.round(Math.min(560, H * 0.74));
  const feet = H - 30;
  const gl = spriteGeom(cutouts.green, 'left', W * 0.165, feet, rh);
  const gr = spriteGeom(cutouts.yellow, 'right', W * 0.835, feet, rh);

  return (
    <div className="absolute inset-0">
      <CityBackground />
      <RobotSprite robot={L} cutout={cutouts.green} geom={gl} side="left" anim="idle" />
      <RobotSprite robot={R} cutout={cutouts.yellow} geom={gr} side="right" anim="idle" />
      <LoopBeam from={gr.muzzle} to={gl.chest} color={R.beam} delay={0.8} />
      <LoopBeam from={gl.muzzle} to={gr.chest} color={L.beam} delay={2.8} />

      <div className="absolute left-1/2 top-[16px] -translate-x-1/2">
        <div className="float-y">
          <TitleLogo />
        </div>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-[18px]" style={{ top: 292 }}>
        <PillButton onClick={() => onMode(1)} style={{ width: 420, height: 106 }}>
          <span className="text-[46px] leading-none" style={{ WebkitTextStroke: 0 }}>
            🤖
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[38px]">1 PEMAIN</span>
            <span className="mt-1 font-body text-[17px] font-extrabold text-cyan-50" style={{ WebkitTextStroke: 0 }}>
              Lawan Robot Komputer
            </span>
          </span>
        </PillButton>
        <PillButton color="orange" onClick={() => onMode(2)} style={{ width: 420, height: 106 }}>
          <span className="text-[46px] leading-none" style={{ WebkitTextStroke: 0 }}>
            ⚔️
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[38px]">2 PEMAIN</span>
            <span className="mt-1 font-body text-[17px] font-extrabold text-amber-50" style={{ WebkitTextStroke: 0 }}>
              Duel Seru dengan Teman
            </span>
          </span>
        </PillButton>
        <button
          type="button"
          onClick={onHelp}
          className="mt-1 rounded-full border-2 border-white/40 bg-black/50 px-6 py-2 text-[18px] font-extrabold text-white transition hover:bg-black/70"
        >
          ❓ Cara Bermain
        </button>
      </div>

      {/* progres (kiri bawah) */}
      <div className="hud-panel absolute bottom-5 left-5 flex items-center gap-3 rounded-[20px] px-4 py-3">
        <StarIcon size={40} />
        <div className="leading-tight">
          <div className="font-game text-[22px] text-amber-300 txt-stroke">{totalStars} / 15</div>
          <div className="text-[14px] font-extrabold text-teal-100">Level terbuka: {unlocked} / 5</div>
        </div>
      </div>

      {/* tombol bulat (kanan bawah) seperti game referensi */}
      <div className="absolute bottom-5 right-5 flex gap-4">
        <RoundButton size={80} onClick={onToggleMute} title={muted ? 'Nyalakan suara' : 'Matikan suara'}>
          <SoundIcon muted={muted} />
        </RoundButton>
        {canFullscreen && (
          <RoundButton size={80} onClick={onFullscreen} title="Layar penuh">
            <FullscreenIcon />
          </RoundButton>
        )}
      </div>

      <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[18px] bg-black/45 px-6 py-2 text-center">
        <div className="text-[15px] font-extrabold text-white/95">Game Edukasi Matematika • 5 Level • 1–2 Pemain</div>
        <div className="mt-[2px] text-[12px] font-bold text-teal-100/90">Created by: widodo guru sd</div>
      </div>
    </div>
  );
}
