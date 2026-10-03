/* Efek suara sintetis dengan Web Audio API (tanpa file audio) */

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  slideTo?: number;
  delay?: number;
  attack?: number;
}

interface NoiseOpts {
  vol?: number;
  delay?: number;
  freq?: number;
  freqTo?: number;
  q?: number;
  filter?: BiquadFilterType;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('rb-muted') === '1';
    } catch {
      /* abaikan */
    }
  }

  unlock() {
    this.getCtx();
  }

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem('rb-muted', m ? '1' : '0');
    } catch {
      /* abaikan */
    }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.02);
  }

  private getNoise(ctx: AudioContext) {
    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 3);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    return this.noiseBuffer;
  }

  tone(freq: number, dur: number, o: ToneOpts = {}) {
    const ctx = this.getCtx();
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime + (o.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), t + dur);
    const v = o.vol ?? 0.2;
    const a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  noise(dur: number, o: NoiseOpts = {}) {
    const ctx = this.getCtx();
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime + (o.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.getNoise(ctx);
    const f = ctx.createBiquadFilter();
    f.type = o.filter ?? 'lowpass';
    f.frequency.setValueAtTime(o.freq ?? 2000, t);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + dur);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    const v = o.vol ?? 0.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  click() {
    this.tone(880, 0.07, { type: 'square', vol: 0.1 });
    this.tone(1320, 0.05, { type: 'square', vol: 0.05, delay: 0.03 });
  }
  select() {
    this.tone(520, 0.08, { type: 'square', vol: 0.12 });
    this.tone(780, 0.1, { type: 'square', vol: 0.1, delay: 0.07 });
    this.tone(1040, 0.16, { type: 'triangle', vol: 0.14, delay: 0.14 });
  }
  laser(delay = 0, big = false) {
    this.tone(big ? 900 : 1500, big ? 0.75 : 0.32, { type: 'sawtooth', vol: big ? 0.26 : 0.18, slideTo: big ? 60 : 160, delay });
    this.tone(big ? 1800 : 2600, big ? 0.5 : 0.22, { type: 'square', vol: 0.06, slideTo: 300, delay });
    this.noise(big ? 0.7 : 0.25, { vol: 0.14, freq: 6000, freqTo: 800, filter: 'bandpass', delay });
  }
  explosion(delay = 0, big = false) {
    this.noise(big ? 1.8 : 0.9, { vol: big ? 0.9 : 0.6, freq: big ? 2400 : 1800, freqTo: 60, delay });
    this.tone(big ? 120 : 160, big ? 1.1 : 0.55, { type: 'sine', vol: big ? 0.8 : 0.6, slideTo: 28, delay });
    if (big) this.tone(70, 1.4, { type: 'triangle', vol: 0.5, slideTo: 20, delay: delay + 0.05 });
  }
  correct() {
    this.tone(660, 0.1, { type: 'triangle', vol: 0.28 });
    this.tone(990, 0.18, { type: 'triangle', vol: 0.28, delay: 0.08 });
  }
  wrong() {
    this.tone(200, 0.32, { type: 'sawtooth', vol: 0.18, slideTo: 90 });
    this.tone(150, 0.32, { type: 'square', vol: 0.08, slideTo: 70, delay: 0.02 });
  }
  zap() {
    this.noise(0.5, { vol: 0.22, freq: 3000, filter: 'bandpass', q: 8 });
    for (let i = 0; i < 5; i++) this.tone(300 + Math.random() * 900, 0.05, { type: 'square', vol: 0.07, delay: i * 0.07 });
  }
  beep(final = false) {
    this.tone(final ? 988 : 587, final ? 0.55 : 0.16, { type: 'square', vol: 0.15 });
    if (final) this.tone(1480, 0.5, { type: 'triangle', vol: 0.1 });
  }
  tick() {
    this.tone(1250, 0.05, { type: 'square', vol: 0.07 });
  }
  timeout() {
    [523, 415, 330].forEach((f, i) => this.tone(f, 0.18, { type: 'square', vol: 0.13, delay: i * 0.16 }));
  }
  stomp(delay = 0) {
    this.tone(90, 0.4, { type: 'sine', vol: 0.7, slideTo: 35, delay });
    this.noise(0.35, { vol: 0.35, freq: 500, freqTo: 80, delay });
  }
  whoosh(delay = 0) {
    this.noise(0.6, { vol: 0.22, freq: 300, freqTo: 3000, filter: 'bandpass', q: 2, delay });
  }
  powerUp(delay = 0) {
    this.tone(180, 1.0, { type: 'sawtooth', vol: 0.12, slideTo: 1400, attack: 0.3, delay });
    this.tone(360, 1.0, { type: 'square', vol: 0.05, slideTo: 2000, attack: 0.3, delay });
  }
  victory(delay = 0) {
    const notes = [523, 659, 784, 1047, 784, 1047];
    const durs = [0.13, 0.13, 0.13, 0.28, 0.13, 0.6];
    let t = delay;
    notes.forEach((f, i) => {
      this.tone(f, durs[i] + 0.05, { type: 'square', vol: 0.12, delay: t });
      this.tone(f / 2, durs[i] + 0.05, { type: 'triangle', vol: 0.14, delay: t });
      t += durs[i];
    });
  }
  defeat(delay = 0) {
    [440, 392, 349, 262].forEach((f, i) => this.tone(f, i === 3 ? 0.8 : 0.3, { type: 'triangle', vol: 0.22, delay: delay + i * 0.3 }));
  }
  draw(delay = 0) {
    [523, 523, 659].forEach((f, i) => this.tone(f, 0.2, { type: 'triangle', vol: 0.2, delay: delay + i * 0.18 }));
  }
}

export const sfx = new SoundEngine();
