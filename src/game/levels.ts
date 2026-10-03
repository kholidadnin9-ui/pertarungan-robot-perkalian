export type P = 0 | 1;
export type Pair<T> = [T, T];

export interface LevelDef {
  id: number;
  title: string;
  tables: [number, number];
  timeLimit: number; // detik per soal
  cpuMin: number; // waktu tercepat komputer menjawab (detik)
  cpuMax: number; // waktu terlama komputer menjawab (detik)
  cpuAcc: number; // peluang komputer menjawab benar
  cpuLabel: string;
  color: string;
}

export const LEVELS: LevelDef[] = [
  { id: 1, title: 'Kadet', tables: [1, 2], timeLimit: 12, cpuMin: 5.5, cpuMax: 9, cpuAcc: 0.7, cpuLabel: 'Mudah', color: '#22c55e' },
  { id: 2, title: 'Petarung', tables: [3, 4], timeLimit: 12, cpuMin: 5, cpuMax: 8.5, cpuAcc: 0.75, cpuLabel: 'Sedang', color: '#06b6d4' },
  { id: 3, title: 'Ksatria', tables: [5, 6], timeLimit: 11, cpuMin: 4.5, cpuMax: 8, cpuAcc: 0.8, cpuLabel: 'Menengah', color: '#3b82f6' },
  { id: 4, title: 'Komandan', tables: [7, 8], timeLimit: 11, cpuMin: 4.2, cpuMax: 7.5, cpuAcc: 0.85, cpuLabel: 'Sulit', color: '#a855f7' },
  { id: 5, title: 'Jenderal', tables: [9, 10], timeLimit: 10, cpuMin: 3.8, cpuMax: 7, cpuAcc: 0.88, cpuLabel: 'Ahli', color: '#ef4444' },
];

export const QUESTIONS_PER_LEVEL = 10;
export const DAMAGE = 10;

export interface Question {
  a: number;
  b: number;
  answer: number;
  options: number[]; // selalu 3 opsi
}

export interface BattleResult {
  winner: P | null;
  hits: Pair<number>;
  wrong: Pair<number>;
  avg: Pair<number | null>;
  stars: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(a: number, b: number): Question {
  const answer = a * b;
  const ok = (n: number) => Number.isInteger(n) && n > 0 && n !== answer && n <= 110;
  const swapped =
    answer >= 12 && answer <= 98 && answer % 10 !== 0 && answer % 11 !== 0
      ? Number(String(answer).split('').reverse().join(''))
      : -1;
  // pengecoh "dekat": salah hitung satu kelipatan
  const near = shuffle([a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b].filter(ok));
  const far = shuffle([answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, swapped].filter(ok));
  const picks: number[] = [];
  const add = (n?: number) => {
    if (n !== undefined && !picks.includes(n) && picks.length < 2) picks.push(n);
  };
  add(near[0]);
  if (Math.random() < 0.6) add(near[1]);
  far.forEach((n) => add(n));
  near.forEach((n) => add(n));
  let k = 3;
  while (picks.length < 2) {
    add(answer + k);
    k++;
  }
  return { a, b, answer, options: shuffle([answer, ...picks]) };
}

export function generateQuestions(level: LevelDef): Question[] {
  const half = QUESTIONS_PER_LEVEL / 2;
  const list: [number, number][] = [];
  for (const t of level.tables) {
    shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      .slice(0, half)
      .forEach((b) => list.push([t, b]));
  }
  return shuffle(list).map(([a, b]) => makeQuestion(a, b));
}

/* ---------------- Progres (disimpan di perangkat) ---------------- */
export interface Progress {
  unlocked: number;
  stars: Record<number, number>;
}

const KEY = 'robot-battle-perkalian-v1';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      return {
        unlocked: Math.min(LEVELS.length, Math.max(1, Number(p.unlocked) || 1)),
        stars: p.stars && typeof p.stars === 'object' ? p.stars : {},
      };
    }
  } catch {
    /* abaikan */
  }
  return { unlocked: 1, stars: {} };
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* abaikan */
  }
}
