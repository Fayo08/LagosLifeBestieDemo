import type { PlaceId, SceneKind } from '../types.ts';
import { PLACES } from '../data/places.ts';
import { CROWDS } from '../data/script.ts';

/**
 * Isometric room for the place you're at, in the style of the game's location view:
 * a floor on a round patch of ground, two back walls with the venue's sign, props,
 * and everyone here with a name tag. You and your friend stand together.
 *
 * Floor coordinates run 0–10 on x and y; z is height in floor units.
 */

interface Walker {
  id: string;
  label: string;
  tag: string;
  shirt: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  /** Seconds until an NPC picks a new spot. */
  wait: number;
  npc: boolean;
  say: { text: string; until: number } | null;
}

interface SceneState {
  key: string;
  kind: SceneKind;
  place: PlaceId;
  walkers: Walker[];
  raf: number;
  last: number;
  t: number;
  day: boolean;
}

let st: SceneState | null = null;
let canvas: HTMLCanvasElement | null = null;

const SHIRTS = ['#1f7a43', '#e9eef5', '#2f6fe0', '#b23a48', '#f2b51d', '#3b3f52', '#7c4dff', '#0e9f8e'];
const TAG_NPC = '#2f6fe0';
const TAG_ME = '#1faa59';
const TAG_FRIEND = '#e64b98';

/** Where you go to do each activity, by scene. Index matches the place's activity list. */
const SPOTS: Record<SceneKind, [number, number][]> = {
  home: [[7.6, 2.6], [4.6, 3.8], [2.2, 7.4]],
  gym: [[2.6, 1.6], [6.2, 2.2], [7.2, 6.6], [1.6, 5.6]],
  market: [[2.4, 2.4], [6.6, 2.4], [7.2, 6.4]],
  club: [[1.8, 6.2], [5, 5], [5.6, 4.2]],
  hub: [[2.6, 2.6], [6.6, 2.2], [7.2, 6.8]],
  suya: [[3, 2.4], [6.4, 5.6], [2.6, 6.4]],
  beach: [[5, 4], [2.4, 7.2], [7.4, 6.8]],
  office: [[3, 3], [6.8, 2.4], [6.6, 7]],
};
const STAND: [number, number] = [5.2, 7.4];

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export interface SceneCast {
  place: PlaceId;
  me: { id: string; color: string };
  /** Friend you're out with, standing next to you. */
  friend: { id: string; color: string; streak: number } | null;
  /** Other friends who happen to be here. */
  others: { id: string; color: string }[];
  day: boolean;
}

export function mountScene(el: HTMLCanvasElement, cast: SceneCast): void {
  canvas = el;
  const key = `${cast.place}|${cast.friend?.id ?? ''}|${cast.others.map((o) => o.id).join(',')}`;
  if (!st || st.key !== key) {
    const kind = PLACES[cast.place].scene;
    const crowd = [...CROWDS[kind]].sort(() => Math.random() - 0.5).slice(0, kind === 'home' ? 0 : 4);
    const walkers: Walker[] = crowd.map((h, i) => {
      const x = rand(1.2, 8.8), y = rand(1.2, 8.4);
      return { id: h, label: '@' + h, tag: TAG_NPC, shirt: SHIRTS[i % SHIRTS.length], x, y, tx: x, ty: y, wait: rand(1, 5), npc: true, say: null };
    });
    walkers.push({ id: cast.me.id, label: '@' + cast.me.id, tag: TAG_ME, shirt: cast.me.color, x: STAND[0], y: STAND[1], tx: STAND[0], ty: STAND[1], wait: 0, npc: false, say: null });
    if (cast.friend) {
      const f = cast.friend;
      walkers.push({ id: f.id, label: `@${f.id}${f.streak ? ` 🔥${f.streak}` : ''}`, tag: TAG_FRIEND, shirt: f.color, x: STAND[0] + 1.1, y: STAND[1] - 0.6, tx: STAND[0] + 1.1, ty: STAND[1] - 0.6, wait: 0, npc: false, say: null });
    }
    cast.others.forEach((o, i) => {
      const x = 2 + i * 1.5, y = 4.5;
      walkers.push({ id: o.id, label: '@' + o.id, tag: TAG_FRIEND, shirt: o.color, x, y, tx: x, ty: y, wait: rand(2, 6), npc: true, say: null });
    });
    if (st) cancelAnimationFrame(st.raf);
    st = { key, kind, place: cast.place, walkers, raf: 0, last: 0, t: 0, day: cast.day };
  }
  st.day = cast.day;
  cancelAnimationFrame(st.raf);
  st.last = 0;
  st.raf = requestAnimationFrame(loop);
}

export function unmountScene(): void {
  if (st) cancelAnimationFrame(st.raf);
  canvas = null;
}

export function setSceneDay(day: boolean): void {
  if (st) st.day = day;
}

/** Walk you (and your friend) over to the spot for an activity. */
export function walkTo(activityIndex: number, friendId: string | null): void {
  if (!st) return;
  const spot = SPOTS[st.kind][activityIndex] ?? STAND;
  for (const w of st.walkers) {
    if (w.npc) continue;
    const isFriend = w.id === friendId;
    w.tx = spot[0] + (isFriend ? 0.9 : 0);
    w.ty = spot[1] + (isFriend ? 0.5 : 0.9);
  }
}

export function sceneSay(id: string, text: string): void {
  const w = st?.walkers.find((x) => x.id === id);
  if (w && st) w.say = { text, until: st.t + 4 };
}

function loop(ts: number): void {
  if (!st || !canvas) return;
  const dt = st.last ? Math.min(0.05, (ts - st.last) / 1000) : 0;
  st.last = ts;
  st.t += dt;
  for (const w of st.walkers) {
    if (w.npc) {
      w.wait -= dt;
      if (w.wait <= 0) {
        w.tx = rand(1.2, 8.8);
        w.ty = rand(1.2, 8.4);
        w.wait = rand(3, 8);
      }
    }
    const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
    const speed = w.npc ? 0.5 : 1.6;
    if (d > 0.02) {
      w.x += (dx / d) * Math.min(d, speed * dt);
      w.y += (dy / d) * Math.min(d, speed * dt);
    }
    if (w.say && st.t > w.say.until) w.say = null;
  }
  draw(canvas, st);
  st.raf = requestAnimationFrame(loop);
}

/* ---------- Drawing ---------- */

type Ctx = CanvasRenderingContext2D;
type Iso = (x: number, y: number, z?: number) => [number, number];

const FLOORS: Record<SceneKind, string> = {
  home: '#d9c6a3', gym: '#25262d', market: '#8a7e70', club: '#1b1530', hub: '#cdbfa8', suya: '#7b6853', beach: '#ead39b', office: '#b7b0a3',
};

function poly(c: Ctx, pts: [number, number][], fill: string): void {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) c.lineTo(p[0], p[1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function shadeHex(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, a = Math.abs(amt);
  r = Math.round(r + (t - r) * a);
  g = Math.round(g + (t - g) * a);
  b = Math.round(b + (t - b) * a);
  return `rgb(${r},${g},${b})`;
}

/** Axis-aligned box: x,y footprint w×d, height h. Draws top, front-left and front-right faces. */
function box(c: Ctx, iso: Iso, x: number, y: number, w: number, d: number, h: number, color: string): void {
  poly(c, [iso(x, y + d, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x, y + d, h)], shadeHex(color, -0.18));
  poly(c, [iso(x + w, y, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x + w, y, h)], shadeHex(color, -0.32));
  poly(c, [iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)], color);
}

function rrect(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  if (typeof c.roundRect === 'function') c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

type Drawable = { depth: number; draw: () => void };

function draw(cv: HTMLCanvasElement, s: SceneState): void {
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

  // The room sits above the place card
  const cardH = (document.querySelector('.placecard') as HTMLElement | null)?.offsetHeight ?? 260;
  const top = 34, bottom = H - cardH - 24;
  const tw = Math.min(W * 0.088, (bottom - top) / 6.4);
  const th = tw * 0.5;
  const cx = W / 2;
  const cy = (top + bottom) / 2 - th * 3.4;
  const iso: Iso = (x, y, z = 0) => [cx + ((x - y) * tw) / 2, cy + ((x + y) * th) / 2 - z * th];

  // Sky and ground patch
  const sky = c.createLinearGradient(0, 0, 0, H);
  if (s.day) { sky.addColorStop(0, '#9fd0f5'); sky.addColorStop(1, '#d9ecfa'); }
  else { sky.addColorStop(0, '#131b3a'); sky.addColorStop(1, '#1d2950'); }
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  const [gx, gy] = iso(5, 5);
  c.beginPath();
  c.ellipse(gx, gy + th * 1.5, W * 0.95, th * 13, 0, 0, Math.PI * 2);
  c.fillStyle = s.kind === 'beach' ? (s.day ? '#3d9ad6' : '#1f4e78') : s.day ? '#a7c48b' : '#4d5f3f';
  c.fill();

  const kind = s.kind;
  // Floor
  poly(c, [iso(0, 0), iso(10, 0), iso(10, 10), iso(0, 10)], FLOORS[kind]);
  poly(c, [iso(0, 10), iso(10, 10), iso(10, 10, -0.35), iso(0, 10, -0.35)], shadeHex(FLOORS[kind], -0.3));
  poly(c, [iso(10, 0), iso(10, 10), iso(10, 10, -0.35), iso(10, 0, -0.35)], shadeHex(FLOORS[kind], -0.45));
  if (kind === 'home') {
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if ((i + j) % 2 === 0) poly(c, [iso(i, j), iso(i + 1, j), iso(i + 1, j + 1), iso(i, j + 1)], '#2a2422');
  }
  if (kind === 'club') {
    for (let i = 3; i < 7; i++) for (let j = 3; j < 7; j++) {
      const hue = (i * 70 + j * 40 + s.t * 120) % 360;
      poly(c, [iso(i + 0.05, j + 0.05), iso(i + 0.95, j + 0.05), iso(i + 0.95, j + 0.95), iso(i + 0.05, j + 0.95)], `hsl(${hue} 80% ${s.day ? 60 : 50}%)`);
    }
  }
  if (kind === 'beach') {
    for (let k = 0; k < 3; k++) {
      const off = Math.sin(s.t * 1.4 + k) * 0.15;
      poly(c, [iso(0, 0), iso(10, 0), iso(10, 1.2 + off + k * 0.3), iso(0, 1.2 + off + k * 0.3)], `rgba(${s.day ? '90,170,230' : '40,90,150'},${0.55 - k * 0.15})`);
    }
  }

  // Back walls with the venue sign
  if (kind !== 'beach') {
    const wallH = 3.2;
    const wall = s.day ? '#e7e8ec' : '#b9bccb';
    poly(c, [iso(0, 0), iso(0, 10), iso(0, 10, wallH), iso(0, 0, wallH)], shadeHex(wall, -0.08));
    poly(c, [iso(0, 0), iso(10, 0), iso(10, 0, wallH), iso(0, 0, wallH)], wall);
    sign(c, iso, PLACES[s.place].name, kind, tw);
    wallDecor(c, iso, kind);
  }

  // Props and people, sorted back to front
  const items: Drawable[] = props(c, iso, kind, s.t, s.day);
  for (const w of s.walkers) items.push({ depth: w.x + w.y, draw: () => person(c, iso, w, tw, s.t) });
  items.sort((a, b) => a.depth - b.depth).forEach((d) => d.draw());

  // Night: dim the room and light it from above
  if (!s.day) {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgba(70,80,130,0.55)';
    c.fillRect(0, 0, W, H);
    c.restore();
    c.save();
    c.globalCompositeOperation = 'screen';
    const g = c.createRadialGradient(gx, gy, 0, gx, gy, tw * 6);
    g.addColorStop(0, kind === 'club' ? 'rgba(200,90,255,.35)' : 'rgba(255,214,150,.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.restore();
  }
  // Name tags go on top, full brightness, day or night
  for (const w of [...s.walkers].sort((a, b) => a.x + a.y - (b.x + b.y))) tag(c, iso, w, tw);
}

function sign(c: Ctx, iso: Iso, text: string, kind: SceneKind, tw: number): void {
  // Sign on the back-right wall, from x=4.4 to x=9.4 (each floor unit is tw/2 across)
  const [x, y] = iso(4.4, 0, 2.75);
  c.save();
  c.translate(x, y);
  c.transform(1, 0.5, 0, 1, 0, 0);
  const w = tw * 2.5, h = tw * 0.5;
  c.fillStyle = kind === 'club' ? '#111' : kind === 'market' ? '#c2185b' : '#e2313b';
  c.fillRect(0, 0, w, h);
  c.fillStyle = kind === 'club' ? '#f5c542' : '#fff';
  c.font = `800 ${Math.round(h * 0.55)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text.toUpperCase(), w / 2, h / 2 + 1, w * 0.92);
  c.restore();
}

function wallDecor(c: Ctx, iso: Iso, kind: SceneKind): void {
  // A window or screen on the left wall
  const pts = (a: number, b: number, z1: number, z2: number): [number, number][] => [iso(0, a, z1), iso(0, b, z1), iso(0, b, z2), iso(0, a, z2)];
  if (kind === 'home' || kind === 'office') poly(c, pts(3, 6.5, 1.1, 2.5), '#1c2233');
  else if (kind === 'hub') poly(c, pts(2, 6, 1, 2.6), '#f7f7f2');
  else if (kind === 'gym') poly(c, pts(5.5, 8.5, 1.2, 2.6), '#9fc6e6');
  else if (kind === 'club') poly(c, pts(2, 8, 1.4, 2.8), '#2a0f3b');
}

function props(c: Ctx, iso: Iso, kind: SceneKind, t: number, day: boolean): Drawable[] {
  const out: Drawable[] = [];
  const add = (x: number, y: number, f: () => void) => out.push({ depth: x + y, draw: f });
  const B = (x: number, y: number, w: number, d: number, h: number, col: string) => add(x + w / 2, y + d / 2, () => box(c, iso, x, y, w, d, h, col));
  const plant = (x: number, y: number) => add(x, y, () => {
    box(c, iso, x - 0.25, y - 0.25, 0.5, 0.5, 0.5, '#c9a46a');
    const [px, py] = iso(x, y, 1.1);
    c.fillStyle = '#2f8f4e';
    c.beginPath(); c.ellipse(px, py, 9, 14, 0, 0, Math.PI * 2); c.fill();
  });
  switch (kind) {
    case 'gym':
      B(1, 0.4, 3, 0.7, 1.5, '#2c2f3a');
      add(2.5, 1.2, () => {
        const [a, b] = [iso(1.4, 1.3, 1.2), iso(3.6, 1.3, 1.2)];
        c.strokeStyle = '#999'; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        c.fillStyle = '#111'; for (const p of [a, b]) { c.beginPath(); c.arc(p[0], p[1], 8, 0, Math.PI * 2); c.fill(); }
      });
      B(5.4, 1.2, 0.8, 1.6, 0.9, '#2f5fa8'); B(6.8, 1.2, 0.8, 1.6, 0.9, '#2f5fa8');
      B(0.3, 4.4, 1.2, 2.6, 1, '#22a35a');
      add(7.2, 6.6, () => { poly(c, [iso(6.5, 6), iso(7.6, 6), iso(7.6, 7.8), iso(6.5, 7.8)], '#7c4dff'); poly(c, [iso(7.9, 6.2), iso(9, 6.2), iso(9, 8), iso(7.9, 8)], '#e64b98'); });
      add(8.6, 5, () => { const [x, y] = iso(8.6, 5, 0.45); c.fillStyle = '#2f6fe0'; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill(); });
      plant(9.2, 1);
      break;
    case 'market': {
      const stall = (x: number, y: number, stripe: string) => {
        B(x, y, 2, 1.2, 0.9, '#7a5a3a');
        add(x + 1, y + 0.7, () => {
          for (let k = 0; k < 6; k++) {
            poly(c, [iso(x - 0.2 + k * 0.4, y - 0.2, 2), iso(x + 0.2 + k * 0.4, y - 0.2, 2), iso(x + 0.2 + k * 0.4, y + 1.5, 1.6), iso(x - 0.2 + k * 0.4, y + 1.5, 1.6)], k % 2 ? '#fff' : stripe);
          }
          const cols = ['#e53935', '#43a047', '#fb8c00', '#fdd835'];
          for (let k = 0; k < 5; k++) { const [px, py] = iso(x + 0.3 + k * 0.35, y + 0.6, 1); c.fillStyle = cols[k % 4]; c.beginPath(); c.arc(px, py, 4, 0, Math.PI * 2); c.fill(); }
        });
      };
      stall(1.4, 1.2, '#2e7d32'); stall(5.6, 1.2, '#c62828'); stall(6.4, 5.6, '#1565c0');
      B(3, 7.4, 2.6, 1.4, 1.4, '#3a4a2a'); B(3, 6.7, 2.6, 0.7, 0.9, '#2d3a20');
      B(8.4, 2.6, 1, 1, 0.8, '#a1784f');
      break;
    }
    case 'club':
      B(4, 0.5, 2.4, 1, 1.1, '#2b2b2b');
      add(5.2, 1, () => { const [x, y] = iso(5.2, 1, 1.5); c.fillStyle = `hsl(${(t * 90) % 360} 90% 60%)`; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); });
      B(0.5, 5, 1, 3.5, 1, '#6b1d4f'); B(8, 2.5, 1.4, 1.4, 0.6, '#3d2a5c'); B(8, 6, 1.4, 1.4, 0.6, '#3d2a5c');
      if (!day) add(5, 5, () => {
        for (let k = 0; k < 3; k++) {
          const [x, y] = iso(5 + Math.sin(t + k * 2) * 2, 5 + Math.cos(t * 0.8 + k) * 2);
          const g = c.createRadialGradient(x, y, 0, x, y, 40);
          g.addColorStop(0, `hsla(${(k * 120 + t * 60) % 360},90%,60%,.45)`); g.addColorStop(1, 'transparent');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, 40, 0, Math.PI * 2); c.fill();
        }
      });
      break;
    case 'hub':
      for (const [x, y] of [[2, 2], [5.6, 1.6], [2, 5.2]] as [number, number][]) {
        B(x, y, 1.8, 1, 0.8, '#efe6d6');
        add(x + 0.9, y + 0.5, () => box(c, iso, x + 0.5, y + 0.25, 0.7, 0.5, 1.15, '#2b2f3a'));
      }
      add(7.2, 6.8, () => { const [x, y] = iso(7.2, 6.8, 0.3); c.fillStyle = '#ff8a3d'; c.beginPath(); c.ellipse(x, y, 16, 10, 0, 0, Math.PI * 2); c.fill(); });
      plant(9.2, 1); plant(0.8, 9);
      break;
    case 'suya':
      B(2.2, 1.6, 2, 1.1, 0.9, '#3a3a3a');
      add(3.2, 2.2, () => {
        for (let k = 0; k < 5; k++) { const [x, y] = iso(2.4 + k * 0.4, 2.1, 0.95); c.fillStyle = `rgba(255,${120 + ((k * 40 + t * 200) % 80)},40,.9)`; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); }
        for (let k = 0; k < 3; k++) { const [x, y] = iso(3.2, 2.2, 1.4 + ((t * 0.6 + k * 0.5) % 1.5)); c.fillStyle = `rgba(220,220,230,${0.35 - ((t * 0.6 + k * 0.5) % 1.5) * 0.2})`; c.beginPath(); c.arc(x + Math.sin(t + k) * 4, y, 7, 0, Math.PI * 2); c.fill(); }
      });
      B(5.6, 5.2, 2.4, 0.5, 0.5, '#8d6e4f'); B(2, 6.4, 2.4, 0.5, 0.5, '#8d6e4f');
      add(7.8, 2.4, () => { const [x, y] = iso(7.8, 2.4, 2.2); const [bx, by] = iso(7.8, 2.4); c.strokeStyle = '#555'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by); c.lineTo(x, y); c.stroke(); c.fillStyle = '#d32f2f'; c.beginPath(); c.ellipse(x, y, 30, 12, 0, Math.PI, 0); c.fill(); });
      break;
    case 'beach': {
      const umb = (x: number, y: number, col: string) => add(x, y, () => { const [px, py] = iso(x, y, 2); const [bx, by] = iso(x, y); c.strokeStyle = '#eee'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by); c.lineTo(px, py); c.stroke(); c.fillStyle = col; c.beginPath(); c.ellipse(px, py, 26, 11, 0, Math.PI, 0); c.fill(); });
      umb(2, 6.6, '#ff7043'); umb(7.6, 7.4, '#26a69a');
      add(5, 4, () => { const a = iso(3.6, 4, 1.4), b = iso(6.4, 4, 1.4), a0 = iso(3.6, 4), b0 = iso(6.4, 4); c.strokeStyle = '#fafafa'; c.lineWidth = 2; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b0[0], b0[1]); c.stroke(); });
      add(9, 3, () => { const [x, y] = iso(9, 3); const [tx, ty] = iso(9, 3, 3); c.strokeStyle = '#6d4c2f'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, (y + ty) / 2, tx, ty); c.stroke(); c.strokeStyle = '#2e7d32'; c.lineWidth = 4; for (let k = 0; k < 6; k++) { const an = -Math.PI + (k * Math.PI) / 5; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(an) * 18, ty - 10, tx + Math.cos(an) * 30, ty + 8); c.stroke(); } });
      break;
    }
    case 'office':
      B(1.8, 2, 2.4, 0.3, 2.2, '#4caf50');
      add(6.8, 2.4, () => { const [x, y] = iso(6.8, 2.4); const [tx, ty] = iso(6.8, 2.4, 1.6); c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(tx, ty); c.lineTo(x + 8, y); c.stroke(); c.fillStyle = '#1b1b1b'; rrect(c, tx - 10, ty - 10, 20, 12, 3); c.fill(); });
      B(6.2, 6.4, 2, 1, 0.8, '#5d4037');
      add(9, 1, () => { const [x, y] = iso(9, 1, 2.4); c.fillStyle = day ? '#fff8e1' : '#ffe082'; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill(); });
      break;
    case 'home':
      B(1, 2.2, 3.4, 1.1, 0.8, '#b71c1c');
      B(6.4, 0.5, 2.4, 0.5, 0.9, '#6d4c2f');
      add(7.6, 0.75, () => box(c, iso, 6.6, 0.55, 2, 0.15, 2, '#1c2233'));
      add(5, 5, () => poly(c, [iso(3.5, 4.2), iso(7, 4.2), iso(7, 6.6), iso(3.5, 6.6)], '#8e1b1b'));
      B(1.6, 6.8, 1.6, 1.6, 0.8, '#8d6e4f');
      plant(9.3, 3); plant(0.6, 9.2);
      break;
  }
  return out;
}

function person(c: Ctx, iso: Iso, w: Walker, tw: number, t: number): void {
  const [x, y] = iso(w.x, w.y);
  const moving = Math.hypot(w.tx - w.x, w.ty - w.y) > 0.05;
  const s = tw * 0.6;
  const step = moving ? Math.sin(t * 10 + w.x) * s * 0.12 : 0;
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.beginPath(); c.ellipse(x, y, s * 0.45, s * 0.2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1d1f2a';
  rrect(c, x - s * 0.24, y - s * 0.95 + step, s * 0.18, s * 0.95 - step, 3); c.fill();
  rrect(c, x + s * 0.06, y - s * 0.95 - step, s * 0.18, s * 0.95 + step, 3); c.fill();
  c.fillStyle = w.shirt;
  rrect(c, x - s * 0.3, y - s * 1.75, s * 0.6, s * 0.85, s * 0.18); c.fill();
  c.fillStyle = '#7a4b2e';
  c.beginPath(); c.arc(x, y - s * 2.0, s * 0.24, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1b1b1b';
  c.beginPath(); c.arc(x, y - s * 2.08, s * 0.24, Math.PI, 0); c.fill();
}

function tag(c: Ctx, iso: Iso, w: Walker, tw: number): void {
  const [x, y] = iso(w.x, w.y);
  const s = tw * 0.6;
  const fs = Math.max(10, Math.round(tw * 0.27));
  c.font = `700 ${fs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const label = w.label;
  const tw2 = c.measureText(label).width + fs * 1.2;
  const ty = y - s * 2.5 - fs * 1.3;
  c.fillStyle = w.tag;
  rrect(c, x - tw2 / 2, ty, tw2, fs * 1.6, fs * 0.8);
  c.fill();
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, x, ty + fs * 0.82);
  if (w.say) {
    c.font = `600 ${fs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    const bw = Math.min(220, c.measureText(w.say.text).width + fs * 1.4);
    const by = ty - fs * 2.2;
    c.fillStyle = '#fff';
    rrect(c, x - bw / 2, by, bw, fs * 1.8, fs * 0.7);
    c.fill();
    c.fillStyle = '#151a2d';
    c.fillText(w.say.text, x, by + fs * 0.92, bw - fs);
  }
}
