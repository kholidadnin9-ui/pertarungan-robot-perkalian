import type { CSSProperties } from 'react';
import type { RobotDef } from '@/game/robots';
import type { Cutout } from '@/game/cutout';
import { BurningSmoke, ElectricSparks, type Pt } from './Effects';

export type RobotAnim = 'idle' | 'intro' | 'attack' | 'hit' | 'stunned' | 'destroyed' | 'finaleWin' | 'tie';

export interface SpriteGeom {
  left: number;
  top: number;
  w: number;
  h: number;
  flip: boolean;
  axis: number;
  muzzle: Pt;
  chest: Pt;
  head: Pt;
}

/** Menghitung posisi sprite robot & titik penting (meriam, dada, kepala) di panggung */
export function spriteGeom(cut: Cutout, side: 'left' | 'right', x: number, feetY: number, height: number): SpriteGeom {
  const w = height * cut.aspect;
  // robot kiri harus menghadap ke kanan, robot kanan menghadap ke kiri
  const flip = (side === 'left') !== cut.facesRight;
  const fx = (f: number) => (flip ? 1 - f : f);
  const left = x - fx(cut.axisX) * w;
  const top = feetY - height;
  return {
    left,
    top,
    w,
    h: height,
    flip,
    axis: x,
    muzzle: { x: left + fx(cut.muzzleX) * w, y: top + cut.muzzleY * height },
    chest: { x: left + fx((cut.axisX + cut.headX) / 2) * w, y: top + height * 0.38 },
    head: { x: left + fx(cut.headX) * w, y: top + height * 0.06 },
  };
}

const ANIM_CLASS: Record<RobotAnim, string> = {
  idle: '',
  intro: 'ra-intro',
  attack: 'ra-attack',
  hit: 'ra-hit',
  stunned: 'ra-stunned',
  destroyed: 'ra-destroyed',
  finaleWin: 'ra-finale-win',
  tie: 'ra-tie',
};

export function RobotSprite({
  robot,
  cutout,
  geom,
  side,
  anim,
  introDelay = 0,
}: {
  robot: RobotDef;
  cutout: Cutout;
  geom: SpriteGeom;
  side: 'left' | 'right';
  anim: RobotAnim;
  introDelay?: number;
}) {
  const dir = side === 'left' ? 1 : -1;
  const ax = geom.axis - geom.left;
  const style = { left: geom.left, top: geom.top, width: geom.w, height: geom.h, '--dir': dir } as unknown as CSSProperties;

  return (
    <div className="pointer-events-none absolute" style={style}>
      {/* bayangan di tanah */}
      <div
        className="absolute rounded-[50%]"
        style={{
          left: ax - geom.w * 0.42,
          width: geom.w * 0.84,
          bottom: -22,
          height: 46,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,.62) 0%, rgba(0,0,0,.3) 45%, rgba(0,0,0,0) 72%)',
        }}
      />
      {anim === 'finaleWin' && (
        <div
          className="robot-aura"
          style={{
            left: ax - geom.h * 0.45,
            top: geom.h * 0.05,
            width: geom.h * 0.9,
            height: geom.h * 0.9,
            background: `radial-gradient(circle, ${robot.glow} 0%, rgba(255,255,255,0) 68%)`,
          }}
        />
      )}
      <div
        className={ANIM_CLASS[anim]}
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${ax}px 100%`,
          animationDelay: anim === 'intro' ? `${introDelay}s` : undefined,
        }}
      >
        <div className={anim === 'destroyed' ? undefined : 'robot-bob'} style={{ position: 'absolute', inset: 0 }}>
          <img
            src={cutout.src}
            alt={`Robot ${robot.colorName}`}
            draggable={false}
            className="absolute inset-0 h-full w-full max-w-none select-none"
            style={{
              transform: geom.flip ? 'scaleX(-1)' : undefined,
              mixBlendMode: cutout.processed ? undefined : 'multiply',
            }}
          />
        </div>
      </div>
      {anim === 'stunned' && <ElectricSparks />}
      {anim === 'destroyed' && <BurningSmoke x={ax - dir * (60 + geom.h * 0.22)} y={geom.h * 0.47} />}
    </div>
  );
}

/** Foto profil bulat robot (kepala & bahu) */
export function RobotPortrait({
  robot,
  cutout,
  size = 70,
  faceRight = true,
}: {
  robot: RobotDef;
  cutout: Cutout;
  size?: number;
  faceRight?: boolean;
}) {
  const flip = faceRight !== cutout.facesRight;
  const imgH = size * 2.4;
  const imgW = imgH * cutout.aspect;
  const hx = flip ? 1 - cutout.headX : cutout.headX;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 30%, ${robot.light} 0%, ${robot.main} 45%, ${robot.dark} 100%)`,
        border: '4px solid #e2e8f0',
        boxShadow: `0 0 0 3px #062a31, 0 0 16px ${robot.glow}`,
      }}
    >
      <img
        src={cutout.src}
        alt=""
        draggable={false}
        className="absolute max-w-none"
        style={{
          height: imgH,
          width: imgW,
          left: size / 2 - hx * imgW,
          top: size * 0.1,
          transform: flip ? 'scaleX(-1)' : undefined,
          mixBlendMode: cutout.processed ? undefined : 'multiply',
        }}
      />
    </div>
  );
}
