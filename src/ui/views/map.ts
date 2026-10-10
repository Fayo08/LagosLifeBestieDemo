import type { Player, PlaceId } from '../../types.ts';
import { S } from '../../state.ts';
import { ME } from '../../data/seed.ts';
import { PLACES } from '../../data/places.ts';
import { friendOf } from '../../game/people.ts';
import { liveStreak, tierName } from '../../game/social.ts';
import { fmt } from '../../game/format.ts';
import { availableModes, fares, getMode, rideMinutes, seatNote, trip } from '../../game/travel.ts';
import { avatar } from '../dom.ts';
import { MAP_BASE } from '../mapArt.ts';
import { rideBanner } from './shared.ts';

export function mapView(): string {
  const hg = S.hangout;
  const friend = friendOf(S, S.companion);
  let h = `${rideBanner()}<div class="card mapcard">${mapSvg()}</div>`;

  if (hg && hg.state === 'invited') {
    const f = friendOf(S, hg.with);
    const m = getMode(hg.mode);
    if (f) {
      h += `<div class="card"><div class="row"><span class="spin"></span><div><b>Ride invite sent to @${f.id}</b>
        <div class="tiny muted">${m.friendCar ? `@${f.id}'s car` : m.name} to ${PLACES[hg.loc].name}${f.pos !== S.me.pos ? ` · picking them up in ${PLACES[f.pos].area}` : ''}</div></div></div></div>`;
    }
  } else if (S.sel && S.sel !== S.me.pos) {
    h += placeSheet(S.sel);
  } else {
    h += `<div class="card"><h3>Where to?</h3><div class="tiny muted">Tap a place on the map.${friend ? ` @${friend.id} is coming with you.` : ' You can bring any friend along.'}</div></div>`;
  }
  return h;
}

function mapSvg(): string {
  const pins = (Object.entries(PLACES) as [PlaceId, (typeof PLACES)[PlaceId]][]).map(([id, l]) => `
    <g class="pin ${S.sel === id ? 'sel' : ''}" data-act="pin" data-id="${id}" tabindex="0" role="button" aria-label="${l.name}, ${l.area}">
      <circle class="badge" cx="${l.x}" cy="${l.y}" r="10"/><text class="emo" x="${l.x}" y="${l.y + 3.6}" text-anchor="middle">${l.emo}</text>
      <text class="lbl" x="${l.x}" y="${l.y - 14}" text-anchor="middle">${l.name}</text></g>`).join('');
  const people = ([S.me, ...S.friends] as Player[]).map((p) =>
    `<g class="avg" id="av-${p.id}"><circle r="${p.id === ME ? 7.5 : 6}" fill="${p.color}" stroke="#fff" stroke-width="2"/><text text-anchor="middle" dy="2.4">${p.initials}</text></g>`).join('');
  return `<svg class="map" viewBox="0 0 340 236" role="img" aria-label="Map of Lagos">${MAP_BASE}
    <text class="water" x="298" y="227" text-anchor="middle">ATLANTIC</text>
    <text class="water" x="300" y="99" text-anchor="middle">LAGOON</text>
    ${pins}${people}</svg>`;
}

/** The game-style place sheet: activities, who's coming, how you get there, Go. */
function placeSheet(id: PlaceId): string {
  const l = PLACES[id];
  const friend = friendOf(S, S.companion);
  const modes = availableModes(!!friend);
  if (!modes.some((m) => m.id === S.mode)) S.mode = 'driver';
  const fare = fares(S.mode, friend ? friend.trust : null);
  const t = trip(S.me.pos, id);
  const note = seatNote(S.mode, friend);
  const price = fare.me === 0 ? 'Free' : fmt(fare.me);
  const others = S.friends.filter((f) => f.pos === id && f.id !== friend?.id);

  return `<div class="card sheet">
    <div class="place"><span class="ico">${l.emo}</span><div class="grow"><h2>${l.name}</h2><div class="muted" style="font-size:15px">${l.area} · ${l.status}</div></div></div>
    <div class="actchips">${l.acts.map((a) => `<span>${a.emoji} ${a.label}</span>`).join('')}</div>
    ${others.length ? `<div class="rule">${others.map((f) => '@' + f.id).join(', ')} ${others.length > 1 ? 'are' : 'is'} here right now.</div>` : ''}
    <div class="tiny muted" style="font-weight:700;letter-spacing:.06em">WHO'S COMING</div>
    <div class="chips who-pick" role="radiogroup" aria-label="Who's coming">
      <button class="pick ${!friend ? 'on' : ''}" role="radio" aria-checked="${!friend}" data-act="companion" data-id="">Just me</button>
      ${S.friends.map((f) => `<button class="pick ${friend?.id === f.id ? 'on' : ''}" role="radio" aria-checked="${friend?.id === f.id}" data-act="companion" data-id="${f.id}">${avatar(f.id, 22)} @${f.id}${liveStreak(f, S.day) ? ` 🔥${liveStreak(f, S.day)}` : ''}</button>`).join('')}
    </div>
    ${friend ? `<div class="with">${avatar(friend.id, 40)}<div class="grow"><b>@${friend.id} · ${tierName(friend.trust)}</b><span>${friend.pos === S.me.pos ? `With you in ${PLACES[friend.pos].area}` : `We'll pick them up in ${PLACES[friend.pos].area}`}. Riding together builds trust.</span></div></div>` : ''}
    <div class="modes" role="radiogroup" aria-label="How to get there">${modes.map((m) => {
      const p = fares(m.id, friend ? friend.trust : null);
      return `<button class="mode ${m.id === S.mode ? 'on' : ''} ${m.friendCar ? 'special' : ''}" role="radio" aria-checked="${m.id === S.mode}" data-act="mode" data-id="${m.id}">
        <span class="e">${m.e}</span><b>${m.friendCar && friend ? '@' + friend.id : m.name}</b><small>${p.me === 0 ? 'Free' : fmt(p.me)}${p.split ? ' each' : ''}</small></button>`;
    }).join('')}</div>
    <div class="seatnote">${rideMinutes(S.me.pos, id, S.mode)} min via ${t.via}${note ? ' · ' + note : ''}</div>
    <button class="btn btn-go" data-act="go">${friend ? `Go with @${friend.id}` : 'Go'} · ${price}</button>
  </div>`;
}

/** Where each avatar sits on the map; side by side when sharing a place. */
export function avatarTarget(p: Player): { x: number; y: number } {
  const l = PLACES[p.pos];
  const here = [S.me, ...S.friends].filter((x) => x.pos === p.pos);
  const i = here.findIndex((x) => x.id === p.id);
  const dx = (i - (here.length - 1) / 2) * 13;
  return { x: l.x + dx, y: l.y + 17 };
}

export function placeAvatars(animate: boolean): void {
  const people = [S.me, ...S.friends] as Player[];
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
