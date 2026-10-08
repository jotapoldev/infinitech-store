// Renderer en canvas 2D del sólido de revolución (la bocina), portado de la propuesta B del diseño.
// Sin three.js: un perfil r = f(y) que gira sobre el eje Y, con sombreado propio.

type P3 = [number, number, number];
type Punto = { r: number; y: number; yn: number };

export type EstadoTorno = {
  sweep: number; // ángulo barrido, 0..2π
  rotY: number;
  tilt: number;
  curve: number; // 0..1, cuánto del perfil está dibujado
  area: number;
  curveAlpha: number;
  axis: number;
  wire: number;
  mat: number; // 0 = morado plano, 1 = materiales del producto
  glow: number;
  scale: number;
};

let perfilCache: Punto[] | null = null;

function perfil(): Punto[] {
  if (perfilCache) return perfilCache;
  const M = 44;
  const pts: Punto[] = [];
  for (let i = 0; i <= M; i++) {
    const y = Math.cos((Math.PI * i) / M);
    const r = 0.6 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y), 5)), 1 / 5);
    pts.push({ r, y: y * 1.15, yn: y });
  }
  perfilCache = pts;
  return pts;
}

export function ajustarCanvas(c: HTMLCanvasElement) {
  const r = c.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(r.width * dpr);
  const H = Math.round(r.height * dpr);
  if (!W || !H) return null;
  if (c.width !== W || c.height !== H) {
    c.width = W;
    c.height = H;
  }
  const ctx = c.getContext("2d");
  return ctx ? { ctx, W, H } : null;
}

export function dibujarTorno(ctx: CanvasRenderingContext2D, W: number, H: number, o: EstadoTorno) {
  const prof = perfil();
  const M = prof.length - 1;
  const N = 72;
  const D = 4.2;
  const TAU = Math.PI * 2;
  const f = Math.min(W, H) * 0.3 * D * o.scale;
  const cx = W / 2;
  const cy = H / 2;
  const cT = Math.cos(o.tilt), sT = Math.sin(o.tilt), cY = Math.cos(o.rotY), sY = Math.sin(o.rotY);
  const tf = (x: number, y: number, z: number): P3 => {
    const x1 = x * cY + z * sY;
    const z1 = -x * sY + z * cY;
    return [x1, y * cT - z1 * sT, y * sT + z1 * cT];
  };
  const pr = (p: P3): [number, number] => {
    const k = f / (D - p[2]);
    return [cx + p[0] * k, cy - p[1] * k];
  };

  ctx.clearRect(0, 0, W, H);
  if (o.glow) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.55);
    g.addColorStop(0, `rgba(120,70,214,${0.42 * o.glow})`);
    g.addColorStop(1, "rgba(120,70,214,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const lw = Math.max(1, W / 600);

  if (o.axis) {
    const a1 = pr(tf(0, 1.55, 0)), a2 = pr(tf(0, -1.55, 0));
    ctx.save();
    ctx.setLineDash([6 * lw, 6 * lw]);
    ctx.strokeStyle = `rgba(248,247,249,${0.45 * o.axis})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(a1[0], a1[1]);
    ctx.lineTo(a2[0], a2[1]);
    ctx.stroke();
    ctx.restore();
  }

  const sweep = Math.min(TAU, o.sweep);
  if (sweep > 0.002) {
    const full = sweep >= TAU - 0.001;
    const nj = Math.max(1, Math.ceil((N * sweep) / TAU));
    const V: P3[][] = [];
    for (let i = 0; i <= M; i++) {
      const row: P3[] = [];
      for (let j = 0; j <= nj; j++) {
        const a = (sweep * j) / nj;
        row.push(tf(prof[i].r * Math.cos(a), prof[i].y, prof[i].r * Math.sin(a)));
      }
      V.push(row);
    }
    type Quad = { p: P3[]; z: number; nx: number; ny: number; nz: number; facing: boolean; i: number };
    const quads: Quad[] = [];
    for (let i = 0; i < M; i++)
      for (let j = 0; j < nj; j++) {
        const a = V[i][j], b = V[i + 1][j], c = V[i + 1][j + 1], d = V[i][j + 1];
        const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2];
        const vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        const mx = (a[0] + b[0] + c[0] + d[0]) / 4, my = (a[1] + b[1] + c[1] + d[1]) / 4, mz = (a[2] + b[2] + c[2] + d[2]) / 4;
        if (nx * mx + ny * my + nz * mz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const facing = nx * -mx + ny * -my + nz * (D - mz) > 0;
        if (!facing && full) continue;
        quads.push({ p: [a, b, c, d], z: mz, nx, ny, nz, facing, i });
      }
    quads.sort((q1, q2) => q1.z - q2.z);
    const L: P3 = [-0.45, 0.6, 0.66];
    const ll = Math.hypot(...L);
    L[0] /= ll; L[1] /= ll; L[2] /= ll;
    const Hh: P3 = [L[0], L[1], L[2] + 1];
    const hl = Math.hypot(...Hh);
    Hh[0] /= hl; Hh[1] /= hl; Hh[2] /= hl;
    const rim2 = [157, 120, 236];
    for (const q of quads) {
      const yn = (prof[q.i].yn + prof[q.i + 1].yn) / 2;
      let prod: number[];
      let emi = 0;
      if (yn > 0.965) { prod = [120, 70, 214]; emi = 0.25; }
      else if (Math.abs(yn) > 0.9) prod = [46, 41, 84];
      else if (yn > 0.74 && yn < 0.8) { prod = [170, 135, 245]; emi = 0.7; }
      else { const k = q.i % 2 ? 0.86 : 1; prod = [40 * k, 42 * k, 78 * k]; }
      const math = [120, 70, 214];
      let col = [0, 1, 2].map((t) => math[t] + (prod[t] - math[t]) * o.mat);
      emi *= o.mat;
      let { nx, ny, nz } = q;
      if (!q.facing) { nx = -nx; ny = -ny; nz = -nz; col = col.map((v) => v * 0.4); }
      const dif = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const spec = Math.pow(Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 40);
      const rim = Math.pow(1 - Math.abs(nz), 3);
      const out = [0, 1, 2].map((t) => Math.min(255, Math.round(col[t] * (0.2 + 0.9 * dif + emi) + 255 * spec * 0.5 + rim2[t] * rim * 0.55)));
      const css = `rgb(${out[0]},${out[1]},${out[2]})`;
      const s = q.p.map(pr);
      ctx.beginPath();
      ctx.moveTo(s[0][0], s[0][1]);
      for (let k = 1; k < 4; k++) ctx.lineTo(s[k][0], s[k][1]);
      ctx.closePath();
      ctx.fillStyle = css;
      ctx.fill();
      ctx.strokeStyle = css;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      if (o.wire > 0.01) {
        ctx.strokeStyle = `rgba(248,247,249,${0.22 * o.wire})`;
        ctx.lineWidth = lw * 0.6;
        ctx.stroke();
      }
    }
  }

  const ca = o.curveAlpha;
  if (o.curve > 0.001 && ca > 0.01) {
    const cs = Math.cos(sweep), sn = Math.sin(sweep);
    const upto = o.curve * M;
    const n = Math.floor(upto);
    const fr = upto - n;
    const pts: { r: number; y: number }[] = prof.slice(0, n + 1);
    if (n < M) {
      const p0 = prof[n], p1 = prof[n + 1];
      pts.push({ r: p0.r + (p1.r - p0.r) * fr, y: p0.y + (p1.y - p0.y) * fr });
    }
    const sc = pts.map((p) => pr(tf(p.r * cs, p.y, p.r * sn)));
    if (o.area > 0.01) {
      const top = pr(tf(0, pts[0].y, 0)), bot = pr(tf(0, pts[pts.length - 1].y, 0));
      ctx.beginPath();
      ctx.moveTo(top[0], top[1]);
      for (const s of sc) ctx.lineTo(s[0], s[1]);
      ctx.lineTo(bot[0], bot[1]);
      ctx.closePath();
      ctx.fillStyle = `rgba(120,70,214,${0.4 * o.area * ca})`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(sc[0][0], sc[0][1]);
    for (const s of sc) ctx.lineTo(s[0], s[1]);
    ctx.strokeStyle = `rgba(199,179,245,${ca})`;
    ctx.lineWidth = lw * 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    const last = sc[sc.length - 1];
    ctx.beginPath();
    ctx.arc(last[0], last[1], lw * 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(248,247,249,${ca})`;
    ctx.fill();
  }
}

const cl = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Progreso del scroll (0..1) → estado del torno. `idle` suma giro lento al final.
export function estadoPara(p: number, idle: number): EstadoTorno {
  const s1 = cl(p / 0.2), s2 = cl((p - 0.24) / 0.3), s3 = cl((p - 0.56) / 0.26);
  return {
    sweep: ease(s2) * Math.PI * 2,
    rotY: -0.5 * ease(s2) + 2.4 * ease(s3) + idle,
    tilt: 0.34 * ease(s2),
    curve: 0.04 + 0.96 * ease(s1),
    area: s1 * (1 - s3),
    curveAlpha: 1 - s3,
    axis: 1 - s3,
    wire: s2 * (1 - s3),
    mat: ease(s3),
    glow: 0.15 + 0.85 * s3,
    scale: 1 + 0.08 * s3,
  };
}

export const pasoPara = (p: number) => (p < 0.22 ? 0 : p < 0.55 ? 1 : p < 0.84 ? 2 : 3);
