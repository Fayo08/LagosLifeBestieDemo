import { S } from '../../state.ts';
import { ME } from '../../data/seed.ts';
import { PERKS } from '../../data/script.ts';
import { BESTIE_THRESHOLD, bestieOf, canEndBestieship } from '../../game/people.ts';
import { short } from '../../game/format.ts';
import { isRiding } from '../../ride/session.ts';
import { avatar } from '../dom.ts';
import { rideBanner } from './shared.ts';

export function bestieView(): string {
  const b = S.bestie;
  const f = bestieOf(S);
  if (!b || !f) return pickBestieView();

  const owned = S.companies.filter((c) => c.owners.length > 1);
  const canEnd = canEndBestieship(S, isRiding());
  const endNote = owned.length
    ? `Buy out or sell your stakes in ${owned.length} co-owned compan${owned.length > 1 ? 'ies' : 'y'} first.`
    : 'Your friendship score stays. Perks stop.';

  return `${rideBanner()}
  <div class="card duo">
    <div class="pair">${avatar(ME, 66)}${avatar(b.id, 66)}</div>
    <div><h2>You & @${b.id}</h2><div class="muted tiny">Besties since Day ${b.since} · ${f.mood} · Wallet ${short(f.cash)}</div></div>
    <div class="bondwrap">
      <div class="between"><span class="lvl">Bond Lv ${b.level}</span><span class="tiny muted num">${b.level >= 3 ? 'Max level' : b.xp + '/100 XP'}</span></div>
      <div class="bar"><i style="width:${b.level >= 3 ? 100 : b.xp}%;background:var(--green)"></i></div>
    </div>
    <div class="stats">
      <div><b>${owned.length}</b><span>co-owned</span></div>
      <div><b>${b.hangouts}</b><span>rides together</span></div>
      <div><b>${short(b.earned)}</b><span>paid to you both</span></div>
    </div>
  </div>
  <div class="grid2">
    <button class="btn btn-green" data-act="tab" data-tab="company">Co-own a company</button>
    <button class="btn btn-ghost" data-act="tab" data-tab="map">Go somewhere</button>
  </div>
  <div class="card"><h3>Perks</h3>${PERKS.map((p) => `
    <div class="perk ${b.level < p.lv ? 'locked' : ''}"><span class="ic">${b.level < p.lv ? 'Lv' + p.lv : '✓'}</span><div><b>${p.title}</b><p>${p.text}</p></div></div>`).join('')}
  </div>
  <div class="card"><h3>Bestie activity</h3><div class="feed">${
    S.feed.length ? S.feed.map((x) => `<div><time>${x.t}</time><span>${x.text}</span></div>`).join('') : '<span class="muted tiny">Nothing yet.</span>'
  }</div></div>
  <div class="card"><div class="between">
    <div><h3>End bestie-ship</h3><div class="tiny muted">${endNote}</div></div>
    ${S.confirmEnd
      ? `<div class="row"><button class="btn sm btn-ghost" data-act="endNo">Keep</button><button class="btn sm btn-line" data-act="endYes">End it</button></div>`
      : `<button class="btn sm btn-line" data-act="endAsk" ${canEnd ? '' : 'disabled'}>End</button>`}
  </div></div>`;
}

function pickBestieView(): string {
  return `<div class="card">
    <div class="eyebrow">New · Besties</div>
    <h2>Pick your bestie</h2>
    <p class="muted" style="margin:0">Besties co-own companies, split the profits and ride through Lagos together. You need ${BESTIE_THRESHOLD} friendship to ask, so chat and hang out first.</p>
  </div>
  <div class="card" style="gap:0">${S.friends.map((f) => {
    const ok = f.score >= BESTIE_THRESHOLD;
    const pending = S.pending === f.id;
    return `<div class="frow">${avatar(f.id, 46)}
      <div class="grow"><div class="handle">@${f.id}</div>
        <div class="bar sm" style="margin:5px 0 3px"><i style="width:${f.score}%;background:${ok ? 'var(--green)' : 'var(--pink)'}"></i></div>
        <div class="tiny muted">Friendship ${f.score}/100</div></div>
      <button class="btn sm ${ok ? 'btn-green' : 'btn-ghost'}" data-act="ask" data-id="${f.id}" ${!ok || S.pending ? 'disabled' : ''}>${pending ? 'Waiting…' : ok ? 'Ask' : `Need ${BESTIE_THRESHOLD}`}</button>
    </div>`;
  }).join('')}</div>`;
}
