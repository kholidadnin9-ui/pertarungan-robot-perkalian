import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { BG_IMAGE } from '@/game/robots';

export interface StageInfo {
  W: number;
  H: number;
  scale: number;
}

const StageCtx = createContext<StageInfo>({ W: 1280, H: 720, scale: 1 });
export const useStage = () => useContext(StageCtx);

const BASE_W = 1280;
const BASE_H = 720;
const MAX_W = 1720;
const MAX_H = 960;

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
      vv?.removeEventListener('resize', on);
    };
  }, []);
  return vp;
}

export function usePortraitSmall() {
  const { w, h } = useViewport();
  return h > w && w < 820;
}

/** Panggung game dengan resolusi desain 1280x720 yang diskalakan agar pas di layar mana pun. */
export function Stage({ children }: { children: ReactNode }) {
  const { w: vw, h: vh } = useViewport();
  const aspect = vw / Math.max(1, vh);
  let W = BASE_W;
  let H = BASE_H;
  if (aspect >= BASE_W / BASE_H) W = Math.min(MAX_W, Math.round(BASE_H * aspect));
  else H = Math.min(MAX_H, Math.round(BASE_W / aspect));
  const scale = Math.min(vw / W, vh / H);
  const left = (vw - W * scale) / 2;
  const top = (vh - H * scale) / 2;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#04131a]">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-xl"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div
        className="absolute overflow-hidden"
        style={{ left, top, width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0' }}
      >
        <StageCtx.Provider value={{ W, H, scale }}>{children}</StageCtx.Provider>
      </div>
    </div>
  );
}

export function CityBackground({ dim = 0 }: { dim?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={BG_IMAGE}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: 'center 62%' }}
      />
      <div
        className="absolute inset-x-0 top-0 h-48"
        style={{ background: 'linear-gradient(to bottom, rgba(0,20,30,.35), rgba(0,20,30,0))' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{ background: 'linear-gradient(to top, rgba(0,10,15,.42), rgba(0,10,15,0))' }}
      />
      {dim > 0 && <div className="absolute inset-0" style={{ background: `rgba(2,20,28,${dim})` }} />}
    </div>
  );
}
