import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import type { RobotDef, RobotId } from '@/game/robots';
import type { Cutout } from '@/game/cutout';
import { DAMAGE, generateQuestions, type BattleResult, type LevelDef, type P, type Pair, type Question } from '@/game/levels';
import { sfx } from '@/game/sound';
import { CityBackground, useStage } from './Stage';
import { RobotSprite, spriteGeom, type RobotAnim, type SpriteGeom } from './Robot';
import { ChargeOrb, DamagePop, Explosion, LaserBeam } from './Effects';
import { AnswerPad, HpPanel, QuestionPanel, RadarTimer } from './BattleHud';
import { IntroOverlay, PauseOverlay, ResultOverlay } from './Overlays';
import { PauseIcon, RoundButton, cx } from './ui';

type Phase = 'intro' | 'question' | 'resolve' | 'finale' | 'done';
type RoundResult = 'hit' | 'timeout' | 'bothWrong' | null;

interface State {
  questions: Question[];
  phase: Phase;
  qIndex: number;
  hp: Pair<number>;
  hits: Pair<number>;
  wrong: Pair<number>;
  times: Pair<number[]>;
  picks: Pair<number | null>;
  locked: Pair<boolean>;
  roundWinner: P | null;
  roundResult: RoundResult;
  roundTime: number;
  history: (P | null)[];
  paused: boolean;
}

type Action =
  | { type: 'START' }
  | { type: 'ANSWER'; player: P; option: number; time: number }
  | { type: 'TIMEOUT' }
  | { type: 'NEXT' }
  | { type: 'FINISH' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

const INTRO_MS = 4200;
const RESOLVE_HIT_MS = 2300;
const RESOLVE_MISS_MS = 2100;
const FINALE_MS = 4400;

function set2<T>(p: Pair<T>, i: P, val: T): Pair<T> {
  return i === 0 ? [val, p[1]] : [p[0], val];
}
const other = (p: P): P => (p === 0 ? 1 : 0);
const winnerOf = (h: Pair<number>): P | null => (h[0] > h[1] ? 0 : h[1] > h[0] ? 1 : null);

function init(level: LevelDef): State {
  return {
    questions: generateQuestions(level),
    phase: 'intro',
    qIndex: 0,
    hp: [100, 100],
    hits: [0, 0],
    wrong: [0, 0],
    times: [[], []],
    picks: [null, null],
    locked: [false, false],
    roundWinner: null,
    roundResult: null,
    roundTime: 0,
    history: [],
    paused: false,
  };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'START':
      return s.phase === 'intro' ? { ...s, phase: 'question', qIndex: 0 } : s;
    case 'ANSWER': {
      if (s.phase !== 'question' || s.paused) return s;
      const p = a.player;
      if (s.locked[p] || s.picks[p] !== null) return s;
      const q = s.questions[s.qIndex];
      const picks = set2(s.picks, p, a.option);
      if (q.options[a.option] === q.answer) {
        // Paling cepat & benar → menyerang robot lawan
        const o = other(p);
        const history = [...s.history];
        history[s.qIndex] = p;
        return {
          ...s,
          picks,
          phase: 'resolve',
          roundWinner: p,
          roundResult: 'hit',
          roundTime: a.time,
          hp: set2(s.hp, o, Math.max(0, s.hp[o] - DAMAGE)),
          hits: set2(s.hits, p, s.hits[p] + 1),
          times: set2(s.times, p, [...s.times[p], a.time]),
          history,
        };
      }
      // Salah → terkunci untuk soal ini
      const locked = set2(s.locked, p, true);
      const wrong = set2(s.wrong, p, s.wrong[p] + 1);
      if (locked[0] && locked[1]) {
        const history = [...s.history];
        history[s.qIndex] = null;
        return { ...s, picks, locked, wrong, phase: 'resolve', roundWinner: null, roundResult: 'bothWrong', history };
      }
      return { ...s, picks, locked, wrong };
    }
    case 'TIMEOUT': {
      if (s.phase !== 'question') return s;
      const history = [...s.history];
      history[s.qIndex] = null;
      return { ...s, phase: 'resolve', roundWinner: null, roundResult: 'timeout', history };
    }
    case 'NEXT': {
      if (s.phase !== 'resolve') return s;
      if (s.qIndex >= s.questions.length - 1) {
        const w = winnerOf(s.hits);
        return { ...s, phase: 'finale', hp: w === null ? s.hp : set2(s.hp, other(w), 0) };
      }
      return {
        ...s,
        phase: 'question',
        qIndex: s.qIndex + 1,
        picks: [null, null],
        locked: [false, false],
        roundWinner: null,
        roundResult: null,
      };
    }
    case 'FINISH':
      return s.phase === 'finale' ? { ...s, phase: 'done' } : s;
    case 'PAUSE':
      return s.phase === 'done' || s.phase === 'intro' ? s : { ...s, paused: true };
    case 'RESUME':
      return { ...s, paused: false };
    default:
      return s;
  }
}

const P1_KEYS: Record<string, number> = { KeyA: 0, KeyS: 1, KeyD: 2, Digit1: 0, Digit2: 1, Digit3: 2 };
const P2_KEYS: Record<string, number> = {
  KeyJ: 0,
  KeyK: 1,
  KeyL: 2,
  ArrowLeft: 0,
  ArrowDown: 1,
  ArrowRight: 2,
  Numpad1: 0,
  Numpad2: 1,
  Numpad3: 2,
};

interface Props {
  mode: 1 | 2;
  level: LevelDef;
  robots: [RobotDef, RobotDef];
  cutouts: Record<RobotId, Cutout>;
  muted: boolean;
  onToggleMute: () => void;
  onComplete: (r: BattleResult) => void;
  onRetry: () => void;
  onNext: () => void;
  onLevels: () => void;
  onMenu: () => void;
}

export function Battle({ mode, level, robots, cutouts, muted, onToggleMute, onComplete, onRetry, onNext, onLevels, onMenu }: Props) {
  const { W, H } = useStage();
  const [state, dispatch] = useReducer(reducer, level, init);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const limitMs = level.timeLimit * 1000;
  const elapsedRef = useRef(0);
  const frozenRef = useRef(level.timeLimit);
  const worldRef = useRef<HTMLDivElement>(null);

  /* ---------- guncangan layar ---------- */
  const shake = useCallback((amp: number) => {
    const el = worldRef.current;
    if (!el || typeof el.animate !== 'function') return;
    const frames: Keyframe[] = [];
    for (let i = 0; i < 7; i++) {
      const f = 1 - i / 7;
      const x = ((Math.random() * 2 - 1) * amp * f).toFixed(1);
      const y = ((Math.random() * 2 - 1) * amp * f).toFixed(1);
      frames.push({ transform: `translate(${x}px, ${y}px)` });
    }
    frames.push({ transform: 'translate(0px, 0px)' });
    el.animate(frames, { duration: 460, easing: 'linear' });
  }, []);

  /* ---------- game loop: timer, komputer, transisi fase ---------- */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let key = '';
    let fired = '';
    let lastSec = 99;
    let cpu: { at: number; option: number; done: boolean } | null = null;

    const loop = (now: number) => {
      const dt = Math.min(80, now - last);
      last = now;
      const s = stateRef.current;
      const k = `${s.phase}:${s.qIndex}`;
      if (k !== key) {
        if (key.startsWith('question')) frozenRef.current = Math.max(0, limitMs - elapsedRef.current) / 1000;
        key = k;
        elapsedRef.current = 0;
        lastSec = 99;
        cpu = null;
        if (s.phase === 'question' && mode === 1) {
          const q = s.questions[s.qIndex];
          const correctIdx = q.options.indexOf(q.answer);
          const wrongIdx = [0, 1, 2].filter((i) => i !== correctIdx);
          const right = Math.random() < level.cpuAcc;
          cpu = {
            at: (level.cpuMin + Math.random() * (level.cpuMax - level.cpuMin)) * 1000,
            option: right ? correctIdx : wrongIdx[Math.floor(Math.random() * wrongIdx.length)],
            done: false,
          };
        }
      }
      if (!s.paused) {
        elapsedRef.current += dt;
        const e = elapsedRef.current;
        const fire = (act: Action) => {
          if (fired !== k) {
            fired = k;
            dispatch(act);
          }
        };
        if (s.phase === 'intro') {
          if (e >= INTRO_MS) fire({ type: 'START' });
        } else if (s.phase === 'question') {
          if (cpu && !cpu.done && e >= cpu.at) {
            cpu.done = true;
            dispatch({ type: 'ANSWER', player: 1, option: cpu.option, time: e });
          }
          const sec = Math.ceil((limitMs - e) / 1000);
          if (sec !== lastSec) {
            if (lastSec !== 99 && sec <= 3 && sec > 0) sfx.tick();
            lastSec = sec;
          }
          if (e >= limitMs) fire({ type: 'TIMEOUT' });
        } else if (s.phase === 'resolve') {
          if (e >= (s.roundResult === 'hit' ? RESOLVE_HIT_MS : RESOLVE_MISS_MS)) fire({ type: 'NEXT' });
        } else if (s.phase === 'finale') {
          if (e >= FINALE_MS) fire({ type: 'FINISH' });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, level, limitMs]);

  const getRemaining = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'question') return Math.max(0, limitMs - elapsedRef.current) / 1000;
    if (s.phase === 'resolve') return frozenRef.current;
    return level.timeLimit;
  }, [limitMs, level.timeLimit]);

  /* ---------- jeda otomatis saat tab disembunyikan ---------- */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && stateRef.current.phase === 'question') dispatch({ type: 'PAUSE' });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* ---------- input ---------- */
  const answer = useCallback(
    (player: P, option: number) => {
      if (mode === 1 && player === 1) return;
      dispatch({ type: 'ANSWER', player, option, time: elapsedRef.current });
    },
    [mode],
  );

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'intro' || s.phase === 'done') return;
    sfx.click();
    dispatch({ type: s.paused ? 'RESUME' : 'PAUSE' });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (stateRef.current.paused) return;
      if (e.code in P1_KEYS) {
        e.preventDefault();
        answer(0, P1_KEYS[e.code]);
      } else if (e.code in P2_KEYS) {
        e.preventDefault();
        answer(mode === 2 ? 1 : 0, P2_KEYS[e.code]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, togglePause, mode]);

  /* ---------- suara & guncangan saat fase berubah ---------- */
  useEffect(() => {
    const timers: number[] = [];
    if (state.phase === 'resolve') {
      if (state.roundResult === 'hit') {
        sfx.correct();
        sfx.laser(0.15);
        sfx.explosion(0.38);
        timers.push(window.setTimeout(() => shake(14), 400));
      } else if (state.roundResult === 'timeout') {
        sfx.timeout();
      }
    } else if (state.phase === 'finale') {
      const w = winnerOf(state.hits);
      if (w !== null) {
        sfx.powerUp();
        sfx.laser(1.0, true);
        sfx.explosion(1.3, true);
        sfx.explosion(1.6);
        sfx.explosion(1.9);
        timers.push(window.setTimeout(() => shake(26), 1300));
        timers.push(window.setTimeout(() => shake(14), 1900));
        if (mode === 1 && w === 1) sfx.defeat(2.5);
        else sfx.victory(2.5);
      } else {
        sfx.laser(0.8);
        sfx.explosion(1.05);
        timers.push(window.setTimeout(() => shake(12), 1050));
        sfx.draw(2.0);
      }
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.qIndex]);

  const prevLocked = useRef<Pair<boolean>>([false, false]);
  useEffect(() => {
    const prev = prevLocked.current;
    if ((state.locked[0] && !prev[0]) || (state.locked[1] && !prev[1])) {
      sfx.wrong();
      sfx.zap();
    }
    prevLocked.current = state.locked;
  }, [state.locked]);

  /* ---------- hasil akhir ---------- */
  const result = useMemo<BattleResult | null>(() => {
    if (state.phase !== 'done') return null;
    const winner = winnerOf(state.hits);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length / 1000 : null);
    const stars = winner === 0 ? (state.hits[0] >= 9 ? 3 : state.hits[0] >= 7 ? 2 : 1) : 0;
    return { winner, hits: state.hits, wrong: state.wrong, avg: [avg(state.times[0]), avg(state.times[1])], stars };
  }, [state.phase, state.hits, state.wrong, state.times]);

  const completedRef = useRef(false);
  useEffect(() => {
    if (result && !completedRef.current) {
      completedRef.current = true;
      onComplete(result);
    }
  }, [result, onComplete]);

  /* ---------- tata letak ---------- */
  const cut: Pair<Cutout> = [cutouts[robots[0].id], cutouts[robots[1].id]];
  const robotH = Math.min(450, Math.round(H * 0.6));
  const feetY = H - 172;
  const gap = Math.min(340, W * 0.27);
  const geo: Pair<SpriteGeom> = [
    spriteGeom(cut[0], 'left', W / 2 - gap, feetY, robotH),
    spriteGeom(cut[1], 'right', W / 2 + gap, feetY, robotH),
  ];

  const isEnd = state.phase === 'finale' || state.phase === 'done';
  const fw = isEnd ? winnerOf(state.hits) : null;
  const rw = state.roundWinner;
  const hitNow = state.phase === 'resolve' && state.roundResult === 'hit' && rw !== null;
  const names: Pair<string> = mode === 1 ? ['KAMU', 'KOMPUTER'] : ['PEMAIN 1', 'PEMAIN 2'];
  const keyHints: Pair<string[] | undefined> = mode === 1 ? [['A', 'S', 'D'], undefined] : [['A', 'S', 'D'], ['J', 'K', 'L']];
  const q = state.questions[state.qIndex];
  const revealed = state.phase === 'resolve' || isEnd;

  const animFor = (p: P): RobotAnim => {
    if (state.phase === 'intro') return 'intro';
    if (isEnd) return fw === null ? 'tie' : fw === p ? 'finaleWin' : 'destroyed';
    if (hitNow) return rw === p ? 'attack' : 'hit';
    if (state.phase === 'question' && state.locked[p]) return 'stunned';
    return 'idle';
  };

  let status = '';
  if (state.phase === 'intro') status = 'Bersiap... robot memasuki arena!';
  else if (state.phase === 'question') {
    if (mode === 1) {
      status = state.locked[0]
        ? 'Jawabanmu salah! Robotmu tersetrum ⚡'
        : state.locked[1]
          ? 'Komputer salah! Ayo jawab sekarang!'
          : 'Jawab secepat mungkin untuk menyerang!';
    } else {
      status =
        state.locked[0] && !state.locked[1]
          ? 'Pemain 1 salah! Pemain 2, ayo jawab!'
          : state.locked[1] && !state.locked[0]
            ? 'Pemain 2 salah! Pemain 1, ayo jawab!'
            : 'Siapa yang paling cepat?';
    }
  } else if (state.phase === 'resolve') {
    const ans = `${q.a} × ${q.b} = ${q.answer}`;
    if (hitNow && rw !== null) status = `✔ ${ans} • ${names[rw]} tercepat (${(state.roundTime / 1000).toFixed(1)} dtk)!`;
    else if (state.roundResult === 'timeout') status = `⏰ Waktu habis! Jawaban: ${ans}`;
    else status = `✖ Semua salah! Jawaban: ${ans}`;
  } else {
    status = fw === null ? 'Pertarungan berakhir seri!' : `${names[fw]} memenangkan pertarungan!`;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ===== Dunia: latar, robot, efek ===== */}
      <div ref={worldRef} className={cx('absolute inset-0', state.paused && 'paused-anim')}>
        <div className="absolute -inset-[30px]">
          <CityBackground />
        </div>
        <RobotSprite robot={robots[0]} cutout={cut[0]} geom={geo[0]} side="left" anim={animFor(0)} />
        <RobotSprite robot={robots[1]} cutout={cut[1]} geom={geo[1]} side="right" anim={animFor(1)} introDelay={0.2} />
        {hitNow && rw !== null && (
          <Fragment key={`hit-${state.qIndex}`}>
            <LaserBeam from={geo[rw].muzzle} to={geo[other(rw)].chest} color={robots[rw].beam} />
            <Explosion x={geo[other(rw)].chest.x} y={geo[other(rw)].chest.y} size={200} delay={0.36} />
            <DamagePop x={geo[other(rw)].head.x} y={geo[other(rw)].head.y} text={`-${DAMAGE}`} delay={0.42} />
          </Fragment>
        )}
        {isEnd && <FinaleFx winner={fw} geo={geo} robots={robots} />}
      </div>

      {/* ===== HUD ===== */}
      <RoundButton
        className="absolute left-4 top-[14px]"
        size={86}
        onClick={togglePause}
        silent
        title="Jeda"
        disabled={state.phase === 'intro' || state.phase === 'done'}
      >
        <PauseIcon size={38} />
      </RoundButton>
      <HpPanel side="left" label={names[0]} robot={robots[0]} cutout={cut[0]} hp={state.hp[0]} hits={state.hits[0]} delayMs={isEnd ? 1350 : 420} />
      <HpPanel side="right" label={names[1]} robot={robots[1]} cutout={cut[1]} hp={state.hp[1]} hits={state.hits[1]} delayMs={isEnd ? 1350 : 420} />
      <QuestionPanel
        levelId={level.id}
        qIndex={state.qIndex}
        total={state.questions.length}
        question={q}
        revealed={revealed}
        waiting={state.phase === 'intro'}
        history={state.history}
        colors={[robots[0].main, robots[1].main]}
        scoreColors={[robots[0].light, robots[1].light]}
        finalScore={isEnd ? state.hits : null}
      />
      <RadarTimer getRemaining={getRemaining} total={level.timeLimit} />

      {([0, 1] as P[]).map((p) => (
        <AnswerPad
          key={p}
          side={p === 0 ? 'left' : 'right'}
          label={names[p]}
          robot={robots[p]}
          keys={keyHints[p]}
          question={q}
          qIndex={state.qIndex}
          picked={state.picks[p]}
          locked={state.locked[p]}
          reveal={revealed}
          interactive={state.phase === 'question' && !state.paused && !state.locked[p] && !(mode === 1 && p === 1)}
          isCpu={mode === 1 && p === 1}
          cpuThinking={mode === 1 && p === 1 && state.phase === 'question' && state.picks[1] === null}
          winnerHere={hitNow && rw === p}
          timeText={`${(state.roundTime / 1000).toFixed(1)} dtk`}
          hidden={isEnd || state.phase === 'intro'}
          onPick={(i) => answer(p, i)}
        />
      ))}

      <div
        className="status-pill absolute bottom-[26px] left-1/2"
        style={{ transform: 'translateX(-50%)', width: 'max-content', maxWidth: Math.max(300, W - 820) }}
      >
        {status}
      </div>

      {/* ===== Banner ===== */}
      {state.phase === 'resolve' && state.roundResult === 'timeout' && (
        <div key={`to${state.qIndex}`} className="center-banner" style={{ color: '#fdba74' }}>
          WAKTU HABIS!
        </div>
      )}
      {state.phase === 'resolve' && state.roundResult === 'bothWrong' && (
        <div key={`bw${state.qIndex}`} className="center-banner" style={{ color: '#fca5a5' }}>
          SEMUA SALAH!
        </div>
      )}
      {isEnd && fw !== null && (
        <>
          <div className="final-banner">⚡ SERANGAN PAMUNGKAS! ⚡</div>
          <div className="ko-text" style={{ animationDelay: '1.9s' }}>
            K.O.!
          </div>
        </>
      )}
      {isEnd && fw === null && (
        <div className="ko-text" style={{ animationDelay: '1.2s', color: '#bae6fd' }}>
          SERI!
        </div>
      )}

      {/* ===== Overlay ===== */}
      {state.phase === 'intro' && <IntroOverlay level={level} />}
      {state.paused && (
        <PauseOverlay onResume={togglePause} onRestart={onRetry} onMenu={onMenu} muted={muted} onToggleMute={onToggleMute} />
      )}
      {state.phase === 'done' && result && (
        <ResultOverlay
          mode={mode}
          level={level}
          robots={robots}
          cutouts={cutouts}
          names={names}
          result={result}
          onRetry={onRetry}
          onNext={onNext}
          onLevels={onLevels}
          onMenu={onMenu}
        />
      )}
    </div>
  );
}

/** Efek serangan pamungkas / seri setelah soal ke-10 */
function FinaleFx({ winner, geo, robots }: { winner: P | null; geo: Pair<SpriteGeom>; robots: [RobotDef, RobotDef] }) {
  if (winner === null) {
    const mid = { x: (geo[0].muzzle.x + geo[1].muzzle.x) / 2, y: (geo[0].muzzle.y + geo[1].muzzle.y) / 2 };
    return (
      <>
        <LaserBeam from={geo[0].muzzle} to={mid} color={robots[0].beam} thickness={26} delay={0.8} duration={1.1} />
        <LaserBeam from={geo[1].muzzle} to={mid} color={robots[1].beam} thickness={26} delay={0.8} duration={1.1} />
        <Explosion x={mid.x} y={mid.y} size={240} delay={1.05} />
      </>
    );
  }
  const loser = other(winner);
  const t = geo[loser].chest;
  return (
    <>
      <ChargeOrb at={geo[winner].muzzle} color={robots[winner].beam} />
      <LaserBeam from={geo[winner].muzzle} to={t} color={robots[winner].beam} thickness={46} delay={1.0} duration={1.3} />
      <Explosion x={t.x} y={t.y} size={300} delay={1.3} debris={20} />
      <Explosion x={t.x - 50} y={t.y - 80} size={190} delay={1.6} />
      <Explosion x={t.x + 40} y={t.y + 70} size={220} delay={1.9} />
    </>
  );
}
