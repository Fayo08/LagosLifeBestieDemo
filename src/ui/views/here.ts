import type { Friend } from '../../types.ts';
import { S } from '../../state.ts';
import { ME } from '../../data/seed.ts';
import { PLACES } from '../../data/places.ts';
import { friendOf } from '../../game/people.ts';
import { liveStreak, tierName } from '../../game/social.ts';
import { isDay, short } from '../../game/format.ts';
import { avatar } from '../dom.ts';
import { mountScene } from '../scene.ts';

const ICONS = {
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>',
};

/** Friends (other than the one you came with) who happen to be at this place. */
function othersHere(withId: string | null): Friend[] {
  return S.friends.filter((f) => f.pos === S.me.pos && f.id !== withId);
}

export function hereView(): string {
  const place = PLACES[S.me.pos];
  const hg = S.hangout;
  const friend = hg && hg.state === 'arrived' && hg.loc === S.me.pos ? friendOf(S, hg.with) : null;
  const crowd = place.scene === 'home' ? 0 : 4;
  const others = othersHere(friend?.id ?? null);
  const count = crowd + others.length + (friend ? 1 : 0);
  const done = hg && hg.loc === S.me.pos ? hg.done : [];

  return `<canvas class="scene" id="sceneCv" aria-label="${place.name}, ${place.area}"></canvas>
  <div class="placecard">
    <div class="placehead">
      <span class="avs">${avatar(ME, 48)}${friend ? avatar(friend.id, 48) : ''}</span>
      <div class="grow" style="min-width:0"><b>${place.emo} ${place.name} · ${place.area}</b><span>${place.status}</span></div>
      <button class="iconbtn" data-act="share" aria-label="Share this place">${ICONS.share}</button>
      <button class="iconbtn" data-act="tab" data-tab="map" aria-label="Open map">${ICONS.map}</button>
      ${S.me.pos === 'home' ? '' : `<button class="iconbtn" data-act="home" aria-label="Go home">${ICONS.home}</button>`}
    </div>
    ${friend ? `<div class="withchip">${avatar(friend.id, 26)}<div><b>Out with @${friend.id}</b> · 🔥${liveStreak(friend, S.day)} · ${tierName(friend.trust)}<br><span class="muted">Fun and Social 1.5× · every activity builds trust</span></div><span class="pts">${friend.trust}</span></div>` : ''}
    <form class="say" id="sayForm"><input id="sayInput" type="text" autocomplete="off" placeholder="Say something to the ${count} player${count === 1 ? '' : 's'} here…" aria-label="Say something"><button class="send" type="submit" aria-label="Send">${ICONS.send}</button></form>
    <div class="actrow">${place.acts.map((a, i) => `<button data-act="do" data-i="${i}" ${done.includes(i) ? 'disabled' : ''}>${a.emoji} ${a.label}${a.cost ? ` <small>${short(a.cost)}</small>` : ''}</button>`).join('')}</div>
  </div>`;
}

export function mountHere(): void {
  const cv = document.getElementById('sceneCv') as HTMLCanvasElement | null;
  if (!cv) return;
  const hg = S.hangout;
  const friend = hg && hg.state === 'arrived' && hg.loc === S.me.pos ? friendOf(S, hg.with) : null;
  mountScene(cv, {
    place: S.me.pos,
    me: { id: ME, color: S.me.color },
    friend: friend ? { id: friend.id, color: friend.color, streak: liveStreak(friend, S.day) } : null,
    others: othersHere(friend?.id ?? null).map((f) => ({ id: f.id, color: f.color })),
    day: isDay(S.minutes),
  });
}
