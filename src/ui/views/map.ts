import type { Player, PlaceId } from '../../types.ts';
import { S } from '../../state.ts';
import { ME } from '../../data/seed.ts';
import { PLACES } from '../../data/places.ts';
import { NEEDS } from '../../data/script.ts';
import { bestieOf, ridingTogether } from '../../game/people.ts';
import { fmt, short } from '../../game/format.ts';
import { availableModes, fares, getMode, rideMinutes, seatNote, trip } from '../../game/travel.ts';
import { fxText } from '../../game/needs.ts';
import { getCompany } from '../../game/company.ts';
import { avatar } from '../dom.ts';
import { MAP_BASE } from '../mapArt.ts';

export function mapView(): string {
  const f = bestieOf(S);
  const hg = S.hangout;
  let h = `<div class="card mapcard">${mapSvg()}</div>`;

  if (hg && hg.state === 'invited' && f) {
    const m = getMode(hg.mode);
    h += `<div class="card"><div class="row"><span class="spin"></span><div><b>Ride invite sent to @${f.id}</b>
      <div class="tiny muted">${m.bestie ? `@${f.id}'s car` : m.name} to ${PLACES[hg.loc].name}${f.pos !== S.me.pos ? ` · picking them up in ${PLACES[f.pos].name}` : ''}</div></div></div></div>`;
  }

  if (hg && hg.state === 'arrived') {
    const l = PLACES[hg.loc];
    h += `<div class="card">
      <div class="between"><div><div class="eyebrow">${hg.together ? 'Out with your bestie' : 'Out alone'}</div><h2 style="font-size:20px">${l.emo} ${l.name}</h2></div>
        <button class="btn sm btn-ghost" data-act="home">Head home</button></div>
      ${hg.together && f ? `<div class="feeling"><span class="pair">${avatar(ME, 32)}${avatar(f.id, 32)}</span><div><b>Ride or Die</b><span>Out with @${f.id}. Fun and Social 1.5×.</span></div><span class="pts">+12</span></div>` : ''}
      <div class="acts">${l.acts.map((a, i) => {
        const done = hg.done.includes(i);
        const coBit = a.co && a.value ? ` · ${getCompany(S, a.co).name} +${short(a.value)}` : '';
        return `<button class="act" data-act="do" data-i="${i}" ${done ? 'disabled' : ''}>
          <div class="grow"><b style="font-size:14px">${a.label}</b><div class="fx">${fxText(a.fx, hg.together)}${coBit}</div></div>
          <span class="go">${done ? 'Done' : a.cost ? short(a.cost) : 'Free'}</span></button>`;
      }).join('')}</div>
    </div>`;
  }

  const busy = hg && (hg.state === 'invited' || hg.state === 'riding');
  const atSelected = hg && hg.state === 'arrived' && hg.loc === S.sel;
  if (S.sel && !busy && !atSelected) h += placeSheet(S.sel);
  else if (!S.sel && !hg) {
    h += `<div class="card"><h3>Where to tonight?</h3><div class="tiny muted">Tap a spot on the map. ${f ? `@${f.id} is in ${PLACES[f.pos].name}.` : 'Riding together needs a bestie.'}</div></div>`;
  }

  h += `<div class="card"><div class="between"><h3>Your needs</h3><span class="tiny muted">${PLACES[S.me.pos].name}</span></div>
    <div class="needs">${NEEDS.map((n) => `<div class="need"><div class="between"><span>${n.label}</span><b>${S.needs[n.key]}%</b></div><div class="bar sm"><i style="width:${S.needs[n.key]}%;background:${n.color}"></i></div></div>`).join('')}</div></div>`;
  return h;
}

function mapSvg(): string {
  const pins = (Object.entries(PLACES) as [PlaceId, (typeof PLACES)[PlaceId]][]).map(([id, l]) => `
    <g class="pin ${S.sel === id ? 'sel' : ''}" data-act="pin" data-id="${id}" tabindex="0" role="button" aria-label="${l.name}">
      <circle class="badge" cx="${l.x}" cy="${l.y}" r="10"/><text class="emo" x="${l.x}" y="${l.y + 3.6}" text-anchor="middle">${l.emo}</text>
      <text class="lbl" x="${l.x}" y="${l.y - 14}" text-anchor="middle">${l.name}</text></g>`).join('');
  const f = bestieOf(S);
  const people = ([S.me, f].filter(Boolean) as Player[]).map((p) =>
    `<g class="avg" id="av-${p.id}"><circle r="7.5" fill="${p.color}" stroke="#fff" stroke-width="2"/><text text-anchor="middle" dy="2.4">${p.initials}</text></g>`).join('');
  return `<svg class="map" viewBox="0 0 340 236" role="img" aria-label="Map of Lagos">${MAP_BASE}
    <text class="water" x="298" y="227" text-anchor="middle">ATLANTIC</text>
    <text class="water" x="300" y="99" text-anchor="middle">LAGOON</text>
    ${pins}${people}</svg>`;
}

/** The game-style place sheet: activities, who's coming, how you get there, Go. */
function placeSheet(id: PlaceId): string {
  const l = PLACES[id];
  const f = bestieOf(S);
  const here = S.me.pos === id;
  const together = ridingTogether(S);
  const level = S.bestie?.level ?? 1;
  const modes = availableModes(together);
  if (!modes.some((m) => m.id === S.mode)) S.mode = 'driver';
  const fare = fares(S.mode, together, level);
  const t = trip(S.me.pos, id);
  const note = seatNote(S, S.mode, together);
  const price = fare.me === 0 ? 'Free' : fmt(fare.me);

  return `<div class="card sheet">
    <div class="place"><span class="ico">${l.emo}</span><div class="grow"><h2>${l.name}</h2><div class="muted" style="font-size:15px">${l.area}</div></div></div>
    <div class="actchips">${l.acts.map((a) => `<span>${a.label}</span>`).join('')}</div>
    ${here ? `<div class="rule">You are here.</div>` : `
      ${f ? `<div class="with">${avatar(f.id, 40)}<div class="grow"><b>Bring @${f.id}</b><span>${f.pos === S.me.pos ? `Already with you in ${PLACES[f.pos].name}` : `We'll pick them up in ${PLACES[f.pos].name}`}</span></div>
        <button class="switch" role="switch" aria-checked="${S.withBf}" aria-label="Bring @${f.id}" data-act="withbf"></button></div>` : ''}
      <div class="modes" role="radiogroup" aria-label="How to get there">${modes.map((m) => {
        const p = fares(m.id, together, level);
        return `<button class="mode ${m.id === S.mode ? 'on' : ''} ${m.bestie ? 'special' : ''}" role="radio" aria-checked="${m.id === S.mode}" data-act="mode" data-id="${m.id}">
          <span class="e">${m.e}</span><b>${m.bestie && f ? '@' + f.id : m.name}</b><small>${p.me === 0 ? 'Free' : fmt(p.me)}${p.split ? ' each' : ''}</small></button>`;
      }).join('')}</div>
      <div class="seatnote">${rideMinutes(S.me.pos, id, S.mode)} min via ${t.via}${note ? ' · ' + note : ''}</div>
      <button class="btn btn-go" data-act="go">${together ? 'Go together' : 'Go'} · ${price}</button>`}
  </div>`;
}

/** Where each avatar sits on the map; side by side when you're together. */
export function avatarTarget(p: Player): { x: number; y: number } {
  const l = PLACES[p.pos];
  const f = bestieOf(S);
  const together = !!f && S.me.pos === f.pos;
  const dx = together ? (p.id === ME ? -8 : 8) : 0;
  return { x: l.x + dx, y: l.y + 17 };
}

export function placeAvatars(animate: boolean): void {
  const people = [S.me, bestieOf(S)].filter(Boolean) as Player[];
  for (const p of people) {
    const g = document.getElementById('av-' + p.id);
    if (!g) continue;
    const start = S.disp?.[p.id] ?? avatarTarget(p);
    g.style.transition = 'none';
    g.style.transform = `translate(${start.x}px,${start.y}px)`;
  }
  const move = () => {
    for (const p of people) {
      const g = document.getElementById('av-' + p.id);
      if (!g) continue;
      const t = avatarTarget(p);
      g.style.transition = '';
      g.style.transform = `translate(${t.x}px,${t.y}px)`;
      S.disp = { ...(S.disp ?? {}), [p.id]: t };
    }
  };
  if (animate) requestAnimationFrame(() => requestAnimationFrame(move));
  else move();
}
