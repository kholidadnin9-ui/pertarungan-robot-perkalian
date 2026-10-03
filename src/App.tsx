import { useCallback, useEffect, useState } from 'react';
import { BG_IMAGE, ROBOTS, robotById, type RobotId } from '@/game/robots';
import { defaultCutout, makeCutout, type Cutout } from '@/game/cutout';
import { LEVELS, loadProgress, saveProgress, type BattleResult, type Progress } from '@/game/levels';
import { sfx } from '@/game/sound';
import { Stage, usePortraitSmall } from '@/components/Stage';
import { MainMenu } from '@/components/MainMenu';
import { RobotSelect } from '@/components/RobotSelect';
import { LevelSelect } from '@/components/LevelSelect';
import { Battle } from '@/components/Battle';
import { HowToPlay, RotateHint } from '@/components/Overlays';

type Screen = 'menu' | 'select' | 'level' | 'battle';
const TOTAL_ASSETS = ROBOTS.length + 1;

function LoadingScreen({ loaded }: { loaded: number }) {
  const pct = Math.round((loaded / TOTAL_ASSETS) * 100);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(circle at 50% 40%, #0f5563 0%, #062830 60%, #03161c 100%)' }}
    >
      <div className="loader-bot text-[96px]">🤖</div>
      <div className="mt-2 font-game text-[46px] text-white txt-stroke">MEMUAT ROBOT...</div>
      <div className="mt-6 h-8 w-[520px] overflow-hidden rounded-full border-4 border-slate-200 bg-black/40" style={{ boxShadow: '0 0 0 3px #062a31' }}>
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${Math.max(6, pct)}%`, background: 'linear-gradient(90deg,#22d3ee,#4ade80)' }}
        />
      </div>
      <div className="mt-3 text-[18px] font-bold text-teal-100">Menyiapkan arena pertempuran perkalian • {pct}%</div>
    </div>
  );
}

export default function App() {
  const [cutouts, setCutouts] = useState<Record<RobotId, Cutout> | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<1 | 2>(1);
  const [pair, setPair] = useState<[RobotId, RobotId]>(['blue', 'yellow']);
  const [levelId, setLevelId] = useState(1);
  const [battleKey, setBattleKey] = useState(0);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [muted, setMuted] = useState(() => sfx.muted);
  const [help, setHelp] = useState(false);
  const [rotateOk, setRotateOk] = useState(false);
  const portraitSmall = usePortraitSmall();

  /* Memuat latar & memproses gambar robot (hapus latar putih) */
  useEffect(() => {
    let alive = true;
    let count = 0;
    const bump = () => {
      count += 1;
      if (alive) setLoaded(count);
    };
    const bg = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        bump();
        resolve();
      };
      img.onerror = () => {
        bump();
        resolve();
      };
      img.src = BG_IMAGE;
    });
    const robots = Promise.all(
      ROBOTS.map((r) =>
        makeCutout(r.image)
          .catch(() => defaultCutout(r.image))
          .then((c) => {
            bump();
            return [r.id, c] as const;
          }),
      ),
    );
    // tunggu font game (maks. 2,5 detik) agar judul tampil rapi
    const fonts = Promise.race([
      (document.fonts?.ready ?? Promise.resolve()).then(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 2500)),
    ]);
    Promise.all([robots, bg, fonts]).then(([entries]) => {
      if (!alive) return;
      const map = {} as Record<RobotId, Cutout>;
      entries.forEach(([id, c]) => {
        map[id] = c;
      });
      setCutouts(map);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggleMute = () => {
    const m = !muted;
    sfx.setMuted(m);
    setMuted(m);
    if (!m) sfx.click();
  };

  const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        const orientation = (window.screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
        try {
          await orientation?.lock?.('landscape');
        } catch {
          /* abaikan */
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* abaikan */
    }
  }, []);

  const startMode = (m: 1 | 2) => {
    sfx.unlock();
    setMode(m);
    setScreen('select');
  };

  const onRobotsChosen = (a: RobotId, b: RobotId) => {
    setPair([a, b]);
    setScreen('level');
  };

  const startLevel = (id: number) => {
    sfx.unlock();
    setLevelId(id);
    setBattleKey((k) => k + 1);
    setScreen('battle');
  };

  const handleComplete = (r: BattleResult) => {
    if (mode === 1 && r.winner === 0) {
      setProgress((p) => {
        const np: Progress = {
          unlocked: Math.max(p.unlocked, Math.min(LEVELS.length, levelId + 1)),
          stars: { ...p.stars, [levelId]: Math.max(p.stars[levelId] ?? 0, r.stars) },
        };
        saveProgress(np);
        return np;
      });
    }
  };

  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];

  return (
    <>
      <Stage>
        {!cutouts ? (
          <LoadingScreen loaded={loaded} />
        ) : (
          <>
            {screen === 'menu' && (
              <MainMenu
                cutouts={cutouts}
                muted={muted}
                onToggleMute={toggleMute}
                onMode={startMode}
                onHelp={() => setHelp(true)}
                canFullscreen={canFullscreen}
                onFullscreen={toggleFullscreen}
                totalStars={totalStars}
                unlocked={progress.unlocked}
              />
            )}
            {screen === 'select' && (
              <RobotSelect mode={mode} cutouts={cutouts} onBack={() => setScreen('menu')} onDone={onRobotsChosen} />
            )}
            {screen === 'level' && (
              <LevelSelect
                mode={mode}
                progress={progress}
                pair={pair}
                cutouts={cutouts}
                onBack={() => setScreen('select')}
                onPick={startLevel}
              />
            )}
            {screen === 'battle' && (
              <Battle
                key={battleKey}
                mode={mode}
                level={level}
                robots={[robotById(pair[0]), robotById(pair[1])]}
                cutouts={cutouts}
                muted={muted}
                onToggleMute={toggleMute}
                onComplete={handleComplete}
                onRetry={() => setBattleKey((k) => k + 1)}
                onNext={() => startLevel(Math.min(LEVELS.length, levelId + 1))}
                onLevels={() => setScreen('level')}
                onMenu={() => setScreen('menu')}
              />
            )}
            {help && <HowToPlay onClose={() => setHelp(false)} />}
          </>
        )}
      </Stage>
      {portraitSmall && !rotateOk && <RotateHint onContinue={() => setRotateOk(true)} />}
    </>
  );
}
