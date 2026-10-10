import type { ModeId, PlaceId } from '../types.ts';
import { S } from '../state.ts';
import { PLACES } from '../data/places.ts';
import { GIST, IDLE_LINES, NEEDS, STATIONS, TRUST } from '../data/script.ts';
import { ME } from '../data/seed.ts';
import { friendOf } from '../game/people.ts';
import { addTrust } from '../game/social.ts';
import { boost } from '../game/needs.ts';
import { clamp, fmt, isDay } from '../game/format.ts';
import { getMode, rideMinutes, trip } from '../game/travel.ts';
import { $, avatar, pick, toast } from '../ui/dom.ts';
import { MAP_BASE } from '../ui/mapArt.ts';
import { drawScene, makeRain, makeSky, makeTraffic, type Camera, type Scene } from './renderer.ts';

/**
 * One shared ride. In production both phones would derive `progress` from the
 * same server clock (see Under the hood); here it runs on requestAnimationFrame.
 */
interface Ride {
  on: boolean;
  loc: PlaceId;
  from: PlaceId;
  mode: ModeId;
  /** Friend riding with you, or null. */
  with: string | null;
  minutes: number;
  durationMs: number;
  progress: number;
  goSlow: { enabled: boolean; active: boolean; done: boolean };
  galaBought: boolean;
  mapOpen: boolean;
  cooldowns: Record<string, number>;
  nextIdleLine: number;
  last: number;
  raf: number;
  scene: Scene;
}

export let ride: Ride | null = null;
let onArrive: (r: { loc: PlaceId; mode: ModeId; minutes: number; with: string | null }) => void = () => {};

export function setArriveHandler(fn: typeof onArrive): void {
  onArrive = fn;
}

export const isRiding = (): boolean => !!ride?.on;

/** Go-slow window on Third Mainland Bridge, as a fraction of the trip. */
const GO_SLOW = [0.32, 0.58] as const;

export function startRide(loc: PlaceId, mode: ModeId, withId: string | null): void {
  const from = S.me.pos;
  const t = trip(from, loc);
  const minutes = rideMinutes(from, loc, mode);
  const f = friendOf(S, withId);
  ride = {
    on: true, loc, from, mode, with: f?.id ?? null, minutes,
    durationMs: Math.max(10_000, Math.min(20_000, minutes * 240)),
    progress: 0,
    goSlow: { enabled: t.crossesLagoon, active: false, done: false },
    galaBought: false, mapOpen: false, cooldowns: {},
    nextIdleLine: performance.now() + 9000, last: 0, raf: 0,
    scene: { mode, cam: 'chase', dist: 0, station: 0, me: S.me, friend: f, day: isDay(S.minutes), traffic: makeTraffic(), rain: makeRain(), sky: makeSky() },
  };
  $('#rideTitle').textContent = `${getMode(mode).e} On the way to ${PLACES[loc].name}…`;
  $('#bubbles').innerHTML = '';
  $('#miniMap').hidden = true;
  buildMiniMap();
  renderCams();
  renderRideActions();
  renderNeedPill();
  if (f) {
    const line = f.pos === S.me.pos || mode === 'fcar'
      ? `${PLACES[loc].name} tonight? Your account must be heavy o.`
      : 'I’m outside! Don’t go without me 🏃🏾';
    setTimeout(() => bubble(f.id, line), 600);
  }
  ride.raf = requestAnimationFrame(loop);
}

export function stopRide(): void {
  if (!ride) return;
  ride.on = false;
  cancelAnimationFrame(ride.raf);
  ride = null;
}

export function skipRide(): void {
  if (ride) ride.progress = 1;
}

function loop(ts: number): void {
  const r = ride;
  if (!r || !r.on) return;
  const dt = r.last ? Math.min(0.05, (ts - r.last) / 1000) : 0;
  r.last = ts;
  const s = r.scene;

  const inGoSlow = r.goSlow.enabled && r.progress > GO_SLOW[0] && r.progress < GO_SLOW[1];
  if (inGoSlow && !r.goSlow.active) {
    r.goSlow.active = true;
    renderRideActions();
    bubble(s.friend?.id ?? null, s.friend ? 'Go-slow on Third Mainland again? Lagos, why?' : 'Go-slow on Third Mainland Bridge');
  }
  if (r.goSlow.active && !r.goSlow.done && r.progress >= GO_SLOW[1]) {
    r.goSlow.done = true;
    renderRideActions();
  }

  const traffic = inGoSlow ? 0.32 : 1;
  r.progress = Math.min(1, r.progress + ((dt * 1000) / r.durationMs) * (inGoSlow ? 0.55 : 1.18));
  const v = (r.mode === 'trek' ? 2.6 : r.mode === 'okada' ? 17 : 13) * traffic;
  s.dist += v * dt;
  for (const car of s.traffic) {
    if (car.X === 0) {
      // The car ahead of you: closer in a go-slow
      car.z += ((inGoSlow ? 5.2 : 8.5) - car.z) * dt * 0.6;
      continue;
    }
    car.z -= (v - car.speed * v * 0.75) * dt * 1.1;
    if (car.z < 1.4) {
      car.z = 34 + Math.random() * 12;
      car.X = Math.random() < 0.5 ? -0.62 : 0.62;
    }
  }
  for (const d of s.rain) {
    d.y += d.speed * dt * 1.2;
    if (d.y > 1.05) { d.y = -0.05; d.x = Math.random(); }
  }

  const visible = !$('#ride').hidden;
  if (s.friend && visible && ts > r.nextIdleLine) {
    r.nextIdleLine = ts + 6500;
    bubble(s.friend.id, pick(IDLE_LINES));
  }
  if (visible) {
    drawScene($<HTMLCanvasElement>('#rideCv'), s);
    updateRideHud();
  }
  if (r.progress >= 1) {
    const done = { loc: r.loc, mode: r.mode, minutes: r.minutes, with: r.with };
    stopRide();
    onArrive(done);
    return;
  }
  r.raf = requestAnimationFrame(loop);
}

export function minutesLeft(): number {
  return ride ? Math.max(1, Math.ceil(ride.minutes * (1 - ride.progress))) : 0;
}

function updateRideHud(): void {
  if (!ride) return;
  $('#rideBar').style.width = (ride.progress * 100).toFixed(1) + '%';
  const slow = ride.goSlow.active && !ride.goSlow.done;
  $('#rideEta').textContent = `${minutesLeft()} min left${slow ? ' · go-slow' : ''}`;
  if (ride.mapOpen) {
    const a = PLACES[ride.from], b = PLACES[ride.loc];
    document.getElementById('miniDot')?.setAttribute('transform', `translate(${a.x + (b.x - a.x) * ride.progress},${a.y + (b.y - a.y) * ride.progress})`);
  }
}

function buildMiniMap(): void {
  if (!ride) return;
  const a = PLACES[ride.from], b = PLACES[ride.loc], f = ride.scene.friend;
  $('#miniMap').innerHTML = `<svg viewBox="0 0 340 236" aria-label="Route">${MAP_BASE}
    <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#1faa59" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 9"/>
    <circle cx="${b.x}" cy="${b.y}" r="11" fill="#fff"/><text x="${b.x}" y="${b.y + 4}" text-anchor="middle" font-size="12">${b.emo}</text>
    <g id="miniDot" transform="translate(${a.x},${a.y})"><circle r="12" fill="${S.me.color}" stroke="#fff" stroke-width="3"/>${f ? `<circle cx="13" r="10" fill="${f.color}" stroke="#fff" stroke-width="3"/>` : ''}</g></svg>`;
}

export function toggleMiniMap(): void {
  if (!ride) return;
  ride.mapOpen = !ride.mapOpen;
  $('#miniMap').hidden = !ride.mapOpen;
  updateRideHud();
}

export function setCamera(cam: Camera): void {
  if (!ride) return;
  ride.scene.cam = cam;
  renderCams();
}

function renderCams(): void {
  if (!ride) return;
  const s = ride.scene;
  const noSeat = s.mode === 'trek' || s.mode === 'okada';
  if (noSeat && s.cam === 'seat') s.cam = 'chase';
  document.querySelectorAll<HTMLButtonElement>('.cams button').forEach((b) => {
    b.classList.toggle('on', b.dataset.cam === s.cam);
    b.disabled = b.dataset.cam === 'seat' && noSeat;
  });
  const f = s.friend;
  const seatHints: Partial<Record<ModeId, string>> = {
    fcar: `@${f?.id} is driving · you're up front`,
    driver: f ? 'Your driver up front · you two in the back' : 'Your driver up front',
    cab: 'Cab driver up front · back seat',
    keke: 'Back bench of the keke',
    danfo: 'Middle row of the danfo',
  };
  const text = s.cam === 'seat' ? seatHints[s.mode] ?? '' : s.cam === 'eyes' ? `Radio: ${STATIONS[s.station].name}` : '';
  const hint = $('#camHint');
  hint.textContent = text;
  hint.hidden = !text;
}

function renderRideActions(): void {
  if (!ride) return;
  const r = ride;
  const cooling = (k: string) => (r.cooldowns[k] ?? 0) > performance.now();
  let h = `<button class="ract" data-ra="radio" ${cooling('radio') ? 'disabled' : ''}>🎶 Change station</button>`;
  if (r.with) h += `<button class="ract" data-ra="gist" ${cooling('gist') ? 'disabled' : ''}>💬 Gist</button>`;
  if (r.goSlow.active && !r.goSlow.done && !r.galaBought) h += `<button class="ract hot" data-ra="gala">🍪 Gala from hawker · ${fmt(r.with ? 1000 : 500)}</button>`;
  $('#rideActs').innerHTML = h;
}

export function renderNeedPill(): void {
  const f = ride?.scene.friend ?? null;
  $('#needPill').innerHTML = `<div class="avs">${avatar(ME, 46)}${f ? avatar(f.id, 46) : ''}</div><div class="bars">${NEEDS.map(
    (n) => `<div class="nb" title="${n.label}"><span>${n.emoji}</span><div class="bar"><i style="width:${S.needs[n.key]}%;background:${S.needs[n.key] < 35 ? 'var(--amber)' : 'var(--green)'}"></i></div></div>`,
  ).join('')}</div>`;
}

function bubble(id: string | null, text: string, mine = false): void {
  const box = $('#bubbles');
  const el = document.createElement('div');
  el.className = 'bub' + (mine ? ' me' : '');
  el.innerHTML = `${id ? avatar(id, 28) : ''}<p></p>`;
  const p = el.querySelector('p');
  if (p) p.textContent = text;
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild?.remove();
  setTimeout(() => el.classList.add('fade'), 4200);
  setTimeout(() => el.remove(), 4700);
}

/** In-ride actions. Returns true when the HUD cash should refresh. */
export function rideAction(action: 'radio' | 'gist' | 'gala'): boolean {
  const r = ride;
  if (!r) return false;
  const now = performance.now();
  const f = r.scene.friend;
  let cashChanged = false;
  if (action === 'radio') {
    r.scene.station = (r.scene.station + 1) % STATIONS.length;
    const st = STATIONS[r.scene.station];
    const v = boost(S, 'fun', 3, !!r.with);
    if (f) {
      bubble(f.id, st.line);
    } else bubble(null, `Now playing: ${st.name}`);
    toast(`📻 ${st.name} · +${v} Fun`);
    r.cooldowns.radio = now + 2200;
    renderCams();
  } else if (action === 'gist' && f) {
    const [mine, theirs] = pick(GIST);
    bubble(ME, mine, true);
    setTimeout(() => bubble(f.id, theirs), 1100);
    const v = boost(S, 'social', 4, true);
    addTrust(S, f.id, TRUST.gist).forEach((m) => toast(m, 'good'));
    toast(`+${v} Social · +${TRUST.gist} trust with @${f.id}`);
    r.cooldowns.gist = now + 2600;
  } else if (action === 'gala') {
    const cost = r.with ? 1000 : 500;
    if (S.me.cash < cost) {
      toast("You can't afford that", 'bad');
      return false;
    }
    S.me.cash -= cost;
    cashChanged = true;
    r.galaBought = true;
    S.needs.hunger = clamp(S.needs.hunger + 6);
    bubble(null, 'Gala! LaCasera! Buy your gala!');
    if (f) setTimeout(() => bubble(f.id, 'You’re the best. This go-slow can continue.'), 900);
    toast(`🍪 +6 Hunger${f ? ' for you both' : ''}`);
  }
  renderRideActions();
  renderNeedPill();
  setTimeout(() => renderRideActions(), 2700);
  return cashChanged;
}

export function setRideDay(day: boolean): void {
  if (ride) ride.scene.day = day;
}
