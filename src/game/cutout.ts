/*
 * Memotong robot dari latar putih (flood-fill dari tepi gambar),
 * memotong (crop) sesuai badan robot, dan menganalisis pose:
 * arah hadap, sumbu badan, posisi kepala & ujung lengan/meriam.
 */

export interface Cutout {
  src: string;
  aspect: number; // lebar / tinggi sprite hasil crop
  facesRight: boolean;
  axisX: number; // sumbu badan (kaki), pecahan lebar
  headX: number; // posisi kepala, pecahan lebar
  muzzleX: number; // titik paling depan (meriam/tangan)
  muzzleY: number;
  processed: boolean;
}

export function defaultCutout(src: string, aspect = 1): Cutout {
  return { src, aspect, facesRight: true, axisX: 0.5, headX: 0.5, muzzleX: 0.88, muzzleY: 0.4, processed: false };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat ' + src));
    img.src = src;
  });
}

export async function makeCutout(src: string): Promise<Cutout> {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const base = defaultCutout(src, w / Math.max(1, h));
  if (!w || !h) return base;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return base;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const N = w * h;

    // 1) Perkiraan warna latar dari piksel tepi
    const rs: number[] = [];
    const gs: number[] = [];
    const bs: number[] = [];
    const sample = (i: number) => {
      const o = i * 4;
      rs.push(d[o]);
      gs.push(d[o + 1]);
      bs.push(d[o + 2]);
    };
    for (let x = 0; x < w; x += 3) {
      sample(x);
      sample((h - 1) * w + x);
    }
    for (let y = 0; y < h; y += 3) {
      sample(y * w);
      sample(y * w + w - 1);
    }
    const median = (a: number[]) => {
      a.sort((p, q) => p - q);
      return a[a.length >> 1];
    };
    const br = median(rs);
    const bgc = median(gs);
    const bb = median(bs);
    if (Math.min(br, bgc, bb) < 150 || Math.max(br, bgc, bb) - Math.min(br, bgc, bb) > 40) return base;

    const diff = (i: number) => {
      const o = i * 4;
      return Math.max(Math.abs(d[o] - br), Math.abs(d[o + 1] - bgc), Math.abs(d[o + 2] - bb));
    };

    // 2) Flood fill latar dari semua tepi (ikut gradasi halus & bayangan lembut)
    const TOL = 40;
    const LOOSE = 92;
    const LOCAL = 9;
    const mask = new Uint8Array(N);
    const stack = new Int32Array(N);
    let sp = 0;
    const near = (i: number, j: number) => {
      const a = i * 4;
      const b = j * 4;
      return (
        Math.abs(d[a] - d[b]) <= LOCAL &&
        Math.abs(d[a + 1] - d[b + 1]) <= LOCAL &&
        Math.abs(d[a + 2] - d[b + 2]) <= LOCAL
      );
    };
    const push = (j: number, from: number) => {
      if (mask[j] !== 0) return;
      const dj = diff(j);
      if (dj <= TOL || (from >= 0 && dj <= LOOSE && near(j, from))) {
        mask[j] = 1;
        stack[sp++] = j;
      }
    };
    for (let x = 0; x < w; x++) {
      push(x, -1);
      push((h - 1) * w + x, -1);
    }
    for (let y = 0; y < h; y++) {
      push(y * w, -1);
      push(y * w + w - 1, -1);
    }
    while (sp > 0) {
      const i = stack[--sp];
      const x = i % w;
      if (x > 0) push(i - 1, i);
      if (x < w - 1) push(i + 1, i);
      if (i >= w) push(i - w, i);
      if (i < N - w) push(i + w, i);
    }

    // 3) Kantong latar tertutup yang besar (mis. celah antara lengan & badan)
    const STRICT = 12;
    const minHole = Math.max(600, Math.floor(N * 0.0012));
    const seen = new Uint8Array(N);
    const comp = new Int32Array(N);
    const visit = (k: number) => {
      if (k >= 0 && seen[k] === 0 && mask[k] === 0 && diff(k) <= STRICT) {
        seen[k] = 1;
        stack[sp++] = k;
      }
    };
    for (let s0 = 0; s0 < N; s0++) {
      if (mask[s0] || seen[s0] || diff(s0) > STRICT) continue;
      let n = 0;
      sp = 0;
      seen[s0] = 1;
      stack[sp++] = s0;
      while (sp > 0) {
        const i = stack[--sp];
        comp[n++] = i;
        const x = i % w;
        visit(x > 0 ? i - 1 : -1);
        visit(x < w - 1 ? i + 1 : -1);
        visit(i >= w ? i - w : -1);
        visit(i < N - w ? i + w : -1);
      }
      if (n >= minHole) for (let c = 0; c < n; c++) mask[comp[c]] = 1;
    }

    // 4) Alpha + menghilangkan pinggiran putih
    for (let i = 0; i < N; i++) {
      const o = i * 4;
      if (mask[i]) {
        d[o + 3] = 0;
        continue;
      }
      const x = i % w;
      const edge =
        (x > 0 && mask[i - 1] === 1) ||
        (x < w - 1 && mask[i + 1] === 1) ||
        (i >= w && mask[i - w] === 1) ||
        (i < N - w && mask[i + w] === 1);
      if (!edge) continue;
      const a = Math.min(1, diff(i) / 110);
      if (a >= 1) continue;
      const al = Math.max(0.18, a);
      d[o] = (d[o] - br * (1 - al)) / al;
      d[o + 1] = (d[o + 1] - bgc * (1 - al)) / al;
      d[o + 2] = (d[o + 2] - bb * (1 - al)) / al;
      d[o + 3] = Math.round(al * 255);
    }

    // 5) Kotak pembatas robot
    const colCount = new Uint32Array(w);
    const rowCount = new Uint32Array(h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (d[(row + x) * 4 + 3] > 60) {
          colCount[x]++;
          rowCount[y]++;
        }
      }
    }
    let x0 = 0;
    while (x0 < w - 1 && colCount[x0] < 3) x0++;
    let x1 = w - 1;
    while (x1 > x0 && colCount[x1] < 3) x1--;
    let y0 = 0;
    while (y0 < h - 1 && rowCount[y0] < 3) y0++;
    let y1 = h - 1;
    while (y1 > y0 && rowCount[y1] < 3) y1--;
    const cw = x1 - x0 + 1;
    const ch = y1 - y0 + 1;
    if (cw < 40 || ch < 40) return base;

    // 6) Analisis pose
    const op = (x: number, y: number) => d[(y * w + x) * 4 + 3] > 110;
    let sum = 0;
    let cnt = 0;
    for (let y = Math.floor(y0 + ch * 0.8); y <= y1; y++) {
      for (let x = x0; x <= x1; x++) if (op(x, y)) {
        sum += x;
        cnt++;
      }
    }
    const axis = cnt ? sum / cnt : (x0 + x1) / 2;
    sum = 0;
    cnt = 0;
    for (let y = y0; y < y0 + ch * 0.16; y++) {
      for (let x = x0; x <= x1; x++) if (op(x, y)) {
        sum += x;
        cnt++;
      }
    }
    const head = cnt ? sum / cnt : axis;
    let maxR = -1;
    let maxRY = y0;
    let minL = w;
    let minLY = y0;
    for (let y = Math.floor(y0 + ch * 0.15); y < y0 + ch * 0.62; y++) {
      let l = -1;
      let r = -1;
      for (let x = x0; x <= x1; x++) if (op(x, y)) {
        l = x;
        break;
      }
      if (l < 0) continue;
      for (let x = x1; x >= x0; x--) if (op(x, y)) {
        r = x;
        break;
      }
      if (r > maxR) {
        maxR = r;
        maxRY = y;
      }
      if (l < minL) {
        minL = l;
        minLY = y;
      }
    }
    const extR = maxR - axis;
    const extL = axis - minL;
    const facesRight = extR >= extL * 0.92;
    const mx = facesRight ? maxR : minL;
    const my = facesRight ? maxRY : minLY;

    // 7) Simpan sprite hasil crop
    ctx.putImageData(imageData, 0, 0);
    const out = document.createElement('canvas');
    out.width = cw;
    out.height = ch;
    const octx = out.getContext('2d');
    if (!octx) return base;
    octx.drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
    const blob = await new Promise<Blob | null>((res) => out.toBlob((b) => res(b), 'image/png'));
    const url = blob ? URL.createObjectURL(blob) : out.toDataURL('image/png');

    return {
      src: url,
      aspect: cw / ch,
      facesRight,
      axisX: (axis - x0) / cw,
      headX: (head - x0) / cw,
      muzzleX: (mx - x0) / cw,
      muzzleY: (my - y0) / ch,
      processed: true,
    };
  } catch (err) {
    console.warn('Cutout robot gagal, memakai gambar asli', err);
    return base;
  }
}
