import type { ModeId, Person } from '../types.ts';
import { STATIONS } from '../data/script.ts';

/**
 * Pseudo-3D night drive, drawn on a 2D canvas.
 * World X is in screen widths from the road centre; z is depth (1 = bottom of screen).
 */

export type Camera = 'chase' | 'eyes' | 'seat';

export interface Car {
  X: number;
  z: number;
  color: string;
  speed: number;
}
export interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
}
export interface Building {
  x: number;
  w: number;
  h: number;
  red: boolean;
  back: boolean;
}

export interface Scene {
  mode: ModeId;
  cam: Camera;
  dist: number;
  station: number;
  me: Person;
  /** Null when riding alone. */
  bestie: Person | null;
  traffic: Car[];
  rain: Drop[];
  sky: Building[];
}

const STRANGER: Person = { id: 'stranger', initials: '', color: '#5b6277' };
const DRIVER: Person = { id: 'driver', initials: '', color: '#3e4458', cap: true };
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export function makeSky(): Building[] {
  const out: Building[] = [];
  let x = -0.05;
  while (x < 1.05) {
    const w = 0.04 + Math.random() * 0.09;
    const h = 0.05 + Math.random() * 0.2;
    out.push({ x, w, h, red: h > 0.17 && Math.random() < 0.7, back: Math.random() < 0.45 });
    x += w * (0.55 + Math.random() * 0.5);
  }
  return out;
}

export function makeRain(n = 70): Drop[] {
  return Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), len: 8 + Math.random() * 14, speed: 0.9 + Math.random() * 0.8 }));
}

export function makeTraffic(): Car[] {
  return [
    { X: 0, z: 7.5, color: '#c99a1e', speed: 1 },
    { X: -0.62, z: 14, color: '#2b3550', speed: 0.85 },
    { X: 0.62, z: 22, color: '#7a1f2b', speed: 0.9 },
    { X: -0.62, z: 33, color: '#c99a1e', speed: 0.8 },
    { X: 0.62, z: 9, color: '#3b4766', speed: 0.95 },
  ];
}

/** Who sits where, front row and back row, left to right. */
export function seating(mode: ModeId, me: Person, bf: Person | null): { front: (Person | null)[]; mid?: (Person | null)[]; back: (Person | null)[] | null } {
  switch (mode) {
    case 'bcar': return { front: [bf, me], back: null };
    case 'driver':
    case 'cab': return { front: [DRIVER, null], back: [me, bf] };
    case 'keke': return { front: [null, DRIVER], back: [me, bf] };
    case 'danfo': return { front: [DRIVER, STRANGER], mid: [STRANGER, STRANGER], back: [me, bf ?? STRANGER] };
    default: return { front: [me, bf], back: null };
  }
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  if (typeof c.roundRect === 'function') c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
  c.fillStyle = fill;
  c.fill();
}

function head(c: CanvasRenderingContext2D, x: number, y: number, r: number, p: Person, ring = '#fff'): void {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = p.color;
  c.fill();
  c.lineWidth = Math.max(1.5, r * 0.14);
  c.strokeStyle = ring;
  c.stroke();
  if (p.cap) {
    c.beginPath();
    c.arc(x, y - r * 0.15, r * 0.95, Math.PI, 0);
    c.fillStyle = '#1b2033';
    c.fill();
  }
  if (p.initials) {
    c.fillStyle = '#fff';
    c.font = `800 ${Math.round(r * 0.78)}px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(p.initials, x, y + r * 0.04);
  }
}

function glowRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, blur: number): void {
  c.shadowColor = '#ff2a3a';
  c.shadowBlur = blur;
  rr(c, x, y, w, h, 3, '#ff3b46');
  c.shadowBlur = 0;
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, a = Math.abs(amt);
  r = Math.round(r + (t - r) * a);
  g = Math.round(g + (t - g) * a);
  b = Math.round(b + (t - b) * a);
  return `rgb(${r},${g},${b})`;
}

export function drawScene(cv: HTMLCanvasElement, s: Scene): void {
  const W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }
  const c = cv.getContext('2d');
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  const hz = H * 0.42;
  const sway = Math.sin(s.dist * 0.04) * W * 0.015;
  const cx = W / 2 + sway;
  const camX = s.mode === 'trek' ? 1.25 : 0; // trekkers walk on the sidewalk
  const P = (X: number, z: number): [number, number, number] => {
    const k = 1 / z;
    return [cx + (X - camX) * W * k, hz + (H - hz) * k, k];
  };

  // Sky and skyline
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#05081a');
  g.addColorStop(1, '#1a2350');
  c.fillStyle = g;
  c.fillRect(0, 0, W, hz + 1);
  for (const back of [true, false]) {
    for (const b of s.sky.filter((x) => x.back === back)) {
      const h = b.h * H * (back ? 1.15 : 1), x = b.x * W - sway * (back ? 0.3 : 0.6), y = hz - h;
      c.fillStyle = back ? '#5d6a8e' : '#c5cee0';
      c.fillRect(x, y, b.w * W, h);
      if (!back) {
        c.fillStyle = 'rgba(255,236,170,.55)';
        for (let wy = y + 6; wy < hz - 6; wy += 9)
          for (let wx = x + 4; wx < x + b.w * W - 4; wx += 7)
            if (((wx * 7 + wy * 13) | 0) % 5 === 0) c.fillRect(wx, wy, 2.5, 3);
      }
      if (b.red) {
        c.fillStyle = '#ff3344';
        c.fillRect(x + (b.w * W) / 2 - 1.5, y - 3, 3, 3);
      }
    }
  }

  // Ground, road, median, curbs
  c.fillStyle = '#0b0f1e';
  c.fillRect(0, hz, W, H - hz);
  const strip = (X1: number, X2: number, z1: number, z2: number, fill: string) => {
    const a = P(X1, z1), b = P(X2, z1), d = P(X2, z2), e = P(X1, z2);
    c.beginPath();
    c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  };
  strip(0.98, 2.4, 0.55, 80, '#20253c');
  strip(-0.98, 0.98, 0.55, 80, '#12162a');
  strip(-1.32, -1.0, 0.55, 80, '#1d4a2c');
  strip(-1.0, -0.98, 0.55, 80, '#8c93a8');
  strip(0.98, 1.0, 0.55, 80, '#8c93a8');

  // Lane dashes scroll with distance travelled
  const L = 4, N = 22;
  for (let i = 0; i < N; i++) {
    const z = (((i * L - s.dist) % (N * L)) + N * L) % (N * L) + 0.8;
    for (const X of [-0.33, 0.33]) strip(X - 0.012, X + 0.012, z, z + 1.7, 'rgba(230,233,240,.85)');
  }

  // Roadside objects and traffic, far to near
  type Obj = { t: 'lamp'; z: number } | { t: 'palm'; z: number } | { t: 'car'; z: number; car: Car };
  const objs: Obj[] = [];
  for (let i = 0; i < 12; i++) objs.push({ t: 'lamp', z: (((i * 7 - s.dist) % 84) + 84) % 84 + 1.1 });
  for (let i = 0; i < 8; i++) objs.push({ t: 'palm', z: (((i * 11 + 5 - s.dist) % 88) + 88) % 88 + 1.1 });
  for (const car of s.traffic) objs.push({ t: 'car', z: car.z, car });
  objs.sort((a, b) => b.z - a.z);
  for (const o of objs) {
    if (o.t === 'lamp') {
      const [x, y, k] = P(-1.16, o.z);
      const h = 1.15 * W * k;
      c.strokeStyle = '#2a3150';
      c.lineWidth = Math.max(1, W * k * 0.02);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.lineTo(x + W * k * 0.32, y - h); c.stroke();
      const lx = x + W * k * 0.32, ly = y - h + W * k * 0.02, r = Math.max(1.5, W * k * 0.05);
      const gr = c.createRadialGradient(lx, ly, 0, lx, ly, r * 5);
      gr.addColorStop(0, 'rgba(255,232,170,.55)');
      gr.addColorStop(1, 'rgba(255,232,170,0)');
      c.fillStyle = gr;
      c.beginPath(); c.arc(lx, ly, r * 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffeec0';
      c.beginPath(); c.arc(lx, ly, r, 0, Math.PI * 2); c.fill();
    } else if (o.t === 'palm') {
      const [x, y, k] = P(1.6, o.z);
      const h = 1.2 * W * k, tx = x - W * k * 0.02;
      c.strokeStyle = '#0d2418';
      c.lineWidth = Math.max(1, W * k * 0.035);
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + W * k * 0.08, y - h * 0.5, tx, y - h); c.stroke();
      c.lineWidth = Math.max(1, W * k * 0.03);
      for (let f = 0; f < 6; f++) {
        const an = -Math.PI + (f * Math.PI) / 5;
        c.beginPath();
        c.moveTo(tx, y - h);
        c.quadraticCurveTo(tx + Math.cos(an) * W * k * 0.2, y - h - W * k * 0.08, tx + Math.cos(an) * W * k * 0.34, y - h + W * k * 0.1);
        c.stroke();
      }
    } else {
      const car = o.car;
      if (car.z < 1.2) continue;
      const [x, y, k] = P(car.X, car.z);
      const w = 0.38 * W * k, h = 0.22 * W * k;
      if (w < 2) continue;
      rr(c, x - w / 2, y - h, w, h * 0.95, w * 0.08, car.color);
      rr(c, x - w * 0.38, y - h * 1.28, w * 0.76, h * 0.42, w * 0.08, car.color);
      rr(c, x - w * 0.32, y - h * 1.2, w * 0.64, h * 0.3, w * 0.05, '#0b0f1f');
      glowRect(c, x - w * 0.46, y - h * 0.72, w * 0.14, h * 0.18, w * 0.2);
      glowRect(c, x + w * 0.32, y - h * 0.72, w * 0.14, h * 0.18, w * 0.2);
      rr(c, x - w * 0.46, y - h * 0.08, w * 0.92, h * 0.12, 3, '#06080f');
    }
  }

  if (s.cam === 'chase') drawChase(c, W, H, s);
  else if (s.cam === 'seat') drawSeat(c, W, H, s);
  else drawEyes(c, W, H, s);

  // Rain in front of everything
  c.strokeStyle = 'rgba(220,228,255,.28)';
  c.lineWidth = 1;
  c.beginPath();
  for (const r of s.rain) {
    const x = r.x * W, y = r.y * H;
    c.moveTo(x, y);
    c.lineTo(x - 1.5, y + r.len);
  }
  c.stroke();
}

function drawChase(c: CanvasRenderingContext2D, W: number, H: number, s: Scene): void {
  const bob = Math.sin(s.dist * 1.6) * 1.5;
  const bx = W / 2, by = H * 0.73 + bob, me = s.me, f = s.bestie, m = s.mode;

  if (m === 'bcar' || m === 'driver' || m === 'cab') {
    const base = m === 'cab' ? '#e3ad1c' : m === 'bcar' && f ? f.color : '#1d2747';
    const color = m === 'bcar' ? shade(base, -0.35) : base;
    const roof = m === 'bcar' ? shade(base, -0.3) : shade(base, 0.06);
    const w = W * 0.6, h = w * 0.58, x = bx - w / 2, y = by - h;
    rr(c, x + w * 0.03, y + h * 0.78, w * 0.17, h * 0.3, 8, '#04060c');
    rr(c, x + w * 0.8, y + h * 0.78, w * 0.17, h * 0.3, 8, '#04060c');
    rr(c, x + w * 0.07, y - h * 0.34, w * 0.86, h * 0.5, w * 0.07, roof);
    // Rear window shows both of you
    const wx = x + w * 0.13, wy = y - h * 0.27, ww = w * 0.74, wh = h * 0.38;
    rr(c, wx, wy, ww, wh, w * 0.04, '#0b1024');
    c.save();
    c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
    const occ = m === 'bcar' ? [f, me] : [me, f];
    occ.forEach((p, i) => { if (p) head(c, wx + ww * (i ? 0.7 : 0.3), wy + wh * 0.72, wh * 0.36, p, 'rgba(255,255,255,.6)'); });
    if (m !== 'bcar') head(c, wx + ww * 0.3, wy + wh * 0.38, wh * 0.2, DRIVER, 'rgba(255,255,255,.3)');
    c.fillStyle = 'rgba(160,180,255,.12)';
    c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww * 0.35, wy); c.lineTo(wx + ww * 0.1, wy + wh); c.lineTo(wx, wy + wh); c.fill();
    c.restore();
    rr(c, x, y + h * 0.08, w, h * 0.78, w * 0.07, color);
    glowRect(c, x + w * 0.02, y + h * 0.2, w * 0.1, h * 0.22, 18);
    glowRect(c, x + w * 0.88, y + h * 0.2, w * 0.1, h * 0.22, 18);
    // Spare tyre
    c.beginPath(); c.arc(bx, y + h * 0.44, h * 0.24, 0, Math.PI * 2); c.fillStyle = '#070a14'; c.fill();
    c.lineWidth = h * 0.05; c.strokeStyle = '#2b3250'; c.stroke();
    c.beginPath(); c.arc(bx, y + h * 0.44, h * 0.1, 0, Math.PI * 2); c.fillStyle = '#2b3250'; c.fill();
    rr(c, x - w * 0.02, y + h * 0.76, w * 1.04, h * 0.14, 8, '#090c18');
    if (m === 'cab') {
      rr(c, bx - w * 0.12, y - h * 0.48, w * 0.24, h * 0.13, 4, '#f5d36b');
      c.fillStyle = '#111'; c.font = `800 ${Math.round(h * 0.09)}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('TAXI', bx, y - h * 0.415);
    }
  } else if (m === 'keke') {
    const w = W * 0.44, h = w * 1.05, x = bx - w / 2, y = by - h;
    rr(c, x + w * 0.02, y + h * 0.82, w * 0.16, h * 0.22, 6, '#04060c');
    rr(c, x + w * 0.82, y + h * 0.82, w * 0.16, h * 0.22, 6, '#04060c');
    rr(c, x + w * 0.06, y + h * 0.14, w * 0.88, h * 0.5, 6, '#0b1024');
    head(c, x + w * 0.68, y + h * 0.3, w * 0.07, DRIVER, 'rgba(255,255,255,.3)');
    head(c, x + w * 0.32, y + h * 0.46, w * 0.12, me);
    if (f) head(c, x + w * 0.66, y + h * 0.48, w * 0.12, f);
    rr(c, x, y, w, h * 0.17, w * 0.14, '#1f7a43');
    rr(c, x + w * 0.02, y + h * 0.1, w * 0.06, h * 0.6, 3, '#e8b423');
    rr(c, x + w * 0.92, y + h * 0.1, w * 0.06, h * 0.6, 3, '#e8b423');
    rr(c, x, y + h * 0.6, w, h * 0.28, w * 0.06, '#e8b423');
    rr(c, x, y + h * 0.6, w, h * 0.06, 3, '#1f7a43');
    glowRect(c, x + w * 0.05, y + h * 0.7, w * 0.1, h * 0.08, 14);
    glowRect(c, x + w * 0.85, y + h * 0.7, w * 0.1, h * 0.08, 14);
  } else if (m === 'danfo') {
    const w = W * 0.68, h = w * 0.82, x = bx - w / 2, y = by - h;
    rr(c, x + w * 0.04, y + h * 0.86, w * 0.15, h * 0.2, 8, '#04060c');
    rr(c, x + w * 0.81, y + h * 0.86, w * 0.15, h * 0.2, 8, '#04060c');
    rr(c, x, y, w, h * 0.92, w * 0.05, '#f0b41c');
    const wx = x + w * 0.07, wy = y + h * 0.08, ww = w * 0.86, wh = h * 0.34;
    rr(c, wx, wy, ww, wh, 6, '#0b1024');
    c.save();
    c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
    [STRANGER, me, f ?? STRANGER, STRANGER].forEach((p, i) => head(c, wx + ww * (0.14 + i * 0.24), wy + wh * 0.7, wh * 0.3, p, 'rgba(255,255,255,.5)'));
    c.restore();
    rr(c, x, y + h * 0.5, w, h * 0.05, 0, '#111');
    rr(c, x, y + h * 0.6, w, h * 0.05, 0, '#111');
    c.fillStyle = '#111'; c.font = `800 ${Math.round(h * 0.055)}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('NO CONDITION IS PERMANENT', bx, y + h * 0.73);
    glowRect(c, x + w * 0.03, y + h * 0.48, w * 0.07, h * 0.18, 16);
    glowRect(c, x + w * 0.9, y + h * 0.48, w * 0.07, h * 0.18, 16);
    rr(c, x - w * 0.01, y + h * 0.84, w * 1.02, h * 0.1, 6, '#090c18');
  } else if (m === 'okada') {
    // An okada carries one passenger, so besties get a bike each
    const bikes: [number, Person][] = f ? [[bx - W * 0.19, me], [bx + W * 0.19, f]] : [[bx, me]];
    bikes.forEach(([x, p], i) => {
      const k = W * 0.2, lean = Math.sin(s.dist * 0.9 + i) * 0.04, y = by + Math.sin(s.dist * 2 + i) * 1.5;
      c.save();
      c.translate(x, y);
      c.rotate(lean);
      rr(c, -k * 0.12, -k * 0.42, k * 0.24, k * 0.5, k * 0.1, '#06080f');
      rr(c, -k * 0.3, -k * 0.72, k * 0.6, k * 0.12, 6, '#1c1f2b');
      glowRect(c, -k * 0.08, -k * 0.58, k * 0.16, k * 0.07, 12);
      rr(c, -k * 0.3, -k * 1.55, k * 0.6, k * 0.62, k * 0.18, '#2a2f3d');
      head(c, 0, -k * 1.68, k * 0.2, { id: 'rider', initials: '', color: '#c9ced8' }, '#9aa2b5');
      rr(c, -k * 0.34, -k * 1.28, k * 0.68, k * 0.62, k * 0.2, p.color);
      head(c, 0, -k * 1.38, k * 0.22, p);
      c.restore();
    });
  } else {
    const people: [number, Person][] = f ? [[bx - W * 0.13, me], [bx + W * 0.13, f]] : [[bx, me]];
    people.forEach(([x, p], i) => {
      const k = W * 0.18, ph = s.dist * 3.2 + i * 1.7, y = by;
      rr(c, x - k * 0.2, y - k * 0.55 + Math.sin(ph) * k * 0.06, k * 0.16, k * 0.55, 5, '#1a1e2c');
      rr(c, x + k * 0.04, y - k * 0.55 - Math.sin(ph) * k * 0.06, k * 0.16, k * 0.55, 5, '#1a1e2c');
      rr(c, x - k * 0.3, y - k * 1.25, k * 0.6, k * 0.75, k * 0.2, p.color);
      head(c, x, y - k * 1.42 + Math.abs(Math.sin(ph)) * 2, k * 0.24, p);
    });
  }
}

function radio(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, station: number): void {
  rr(c, x, y, w, h, 4, '#06240f');
  c.fillStyle = '#4dff88';
  c.font = `700 ${Math.round(h * 0.6)}px ui-monospace, monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(STATIONS[station].name.toUpperCase(), x + w / 2, y + h / 2);
}

function drawSeat(c: CanvasRenderingContext2D, W: number, H: number, s: Scene): void {
  // Cabin around the windshield
  c.fillStyle = '#060912';
  c.beginPath();
  c.rect(0, 0, W, H);
  c.moveTo(W * 0.07, H * 0.31); c.lineTo(W * 0.02, H * 0.5); c.lineTo(W * 0.98, H * 0.5); c.lineTo(W * 0.93, H * 0.31); c.closePath();
  c.fill('evenodd');
  if (s.mode === 'keke') rr(c, 0, H * 0.28, W, H * 0.04, 0, '#1f7a43');
  rr(c, -10, H * 0.49, W + 20, H * 0.06, 12, '#11162a');
  radio(c, W * 0.42, H * 0.5, W * 0.16, H * 0.026, s.station);

  const o = seating(s.mode, s.me, s.bestie);
  const row = (arr: (Person | null)[], y: number, r: number, seatW: number, seatTop: number, gap: number) =>
    arr.forEach((p, i) => {
      const x = W * (arr.length === 2 ? (i ? 0.5 + gap : 0.5 - gap) : 0.5);
      if (p) head(c, x, y, r, p, p === s.me ? '#7ee2a5' : '#fff');
      rr(c, x - seatW / 2, seatTop, seatW, H, seatW * 0.18, '#1a2036');
      rr(c, x - seatW / 2, seatTop, seatW, seatW * 0.08, 6, '#252c48');
    });
  row(o.front, H * 0.53, W * 0.07, W * 0.28, H * 0.56, 0.2);
  if (o.front[0] && s.mode !== 'keke') {
    c.strokeStyle = '#2a3150';
    c.lineWidth = W * 0.02;
    c.beginPath(); c.arc(W * 0.3, H * 0.535, W * 0.085, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  }
  if (o.mid) row(o.mid, H * 0.585, W * 0.085, W * 0.34, H * 0.62, 0.21);
  if (o.back) {
    c.fillStyle = 'rgba(6,9,18,.6)';
    c.fillRect(0, H * 0.6, W, H);
    row(o.back, H * 0.655, W * 0.105, W * 0.42, H * 0.71, 0.24);
  }
}

function drawEyes(c: CanvasRenderingContext2D, W: number, H: number, s: Scene): void {
  const f = s.bestie, m = s.mode;
  if (m === 'okada' || m === 'trek') {
    if (f) head(c, W, H * 0.55, W * 0.15, f);
    if (m === 'okada') {
      c.fillStyle = '#1c1f2b';
      c.beginPath(); c.ellipse(W * 0.5, H * 0.8, W * 0.2, H * 0.1, 0, 0, Math.PI * 2); c.fill();
      rr(c, W * 0.43, H * 0.68, W * 0.14, H * 0.04, 6, '#262a38');
    }
    return;
  }
  c.fillStyle = '#070a14';
  c.beginPath(); c.moveTo(0, H * 0.66); c.quadraticCurveTo(W * 0.5, H * 0.59, W, H * 0.66); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.07, 0); c.lineTo(0, H * 0.66); c.fill();
  c.beginPath(); c.moveTo(W, 0); c.lineTo(W * 0.93, 0); c.lineTo(W, H * 0.66); c.fill();
  radio(c, W * 0.4, H * 0.635, W * 0.2, H * 0.032, s.station);
  if (m === 'bcar') {
    c.strokeStyle = '#1f2540';
    c.lineWidth = W * 0.035;
    c.beginPath(); c.arc(W * 0.14, H * 0.8, W * 0.17, Math.PI * 1.15, Math.PI * 1.95); c.stroke();
    if (f) head(c, W * 0.02, H * 0.5, W * 0.15, f);
  } else if (f) head(c, W * 0.99, H * 0.5, W * 0.15, f);
}
