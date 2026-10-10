import { S } from '../../state.ts';
import { ME } from '../../data/seed.ts';
import { bestieOf, person } from '../../game/people.ts';
import { fmt, short } from '../../game/format.ts';
import { split } from '../../game/money.ts';
import { MAX_STAKE_PCT, getCompany, isCoOwned, stakePrice } from '../../game/company.ts';
import { rideBanner } from './shared.ts';

export function companyView(): string {
  const c = getCompany(S, S.selCo);
  const coOwned = isCoOwned(c);
  const f = bestieOf(S);
  const shares = split(c.till, c.owners);

  let h = `${rideBanner()}
  <div class="chips">${S.companies.map((x) => `<button class="chip ${x.id === S.selCo ? 'on' : ''}" data-act="co" data-id="${x.id}">${isCoOwned(x) ? '<span class="dot"></span>' : ''}${x.name}</button>`).join('')}</div>
  <div class="till">
    <span class="lbl">Till${coOwned ? ' · shared' : ''}</span>
    <span class="big">${short(c.till)}</span>
    <span class="meta">Last evening ${short(c.last)} · next at 6 PM</span>
    <button class="btn btn-white" data-act="cashout" ${c.till <= 0 ? 'disabled' : ''}>Cash out ${fmt(c.till)}</button>
    ${coOwned && f && c.till > 0 ? `<div class="split">You get ${fmt(shares[ME])} · @${f.id} gets ${fmt(shares[f.id])}</div>` : ''}
    ${c.till <= 0 ? `<button class="skip" data-act="payout">Skip to 6 PM payout</button>` : ''}
  </div>
  <div class="card">
    <div class="cohead"><span class="coicon">${c.name.slice(0, 2).toUpperCase()}</span>
      <div class="grow"><h2 style="font-size:20px">${c.name}</h2><div class="tiny muted">${c.kind} · ${c.rating.toFixed(1)}★ · Staff ${c.staff}/${c.staffMax}</div></div>
      <div class="value"><small>VALUE</small><b class="num">${short(c.value)}</b></div></div>
    <div class="tiny muted">Branches: ${c.branches.join(', ')}</div>
  </div>
  <div class="card"><div class="between"><h3>Owners</h3><span class="tiny muted">${coOwned ? 'Co-owned' : 'Solo'}</span></div>
    <div class="own">${c.owners.map((o) => `<i style="flex-basis:${o.bps / 100}%;background:${person(S, o.id).color}"></i>`).join('')}</div>
    <div class="legend">${c.owners.map((o) => `<div class="row"><span class="sw" style="background:${person(S, o.id).color}"></span><span class="grow">${o.id === ME ? 'You' : '@' + o.id}</span><b class="num">${(o.bps / 100).toFixed(0)}%</b><span class="muted num" style="min-width:64px;text-align:right">${short(person(S, o.id).cash)}</span></div>`).join('')}</div>`;

  if (!coOwned) {
    if (!f) h += `<div class="rule">Get a bestie first. Only besties can buy into your companies.</div>`;
    else if (S.offerPending) h += `<div class="sub row"><span class="spin"></span><span class="tiny">Waiting for @${f.id} to review your offer…</span></div>`;
    else {
      h += `<div class="sub" style="display:grid;gap:10px">
        <div class="between"><b style="font-size:14px">Bring in @${f.id}</b><span class="tiny muted">You keep the majority</span></div>
        <label class="tiny muted" for="stake">Stake to sell: <b id="stakeLbl" style="color:var(--ink)">${S.stake}%</b></label>
        <input type="range" id="stake" min="5" max="${MAX_STAKE_PCT}" step="1" value="${S.stake}">
        <div class="offer-sum"><div><span>@${f.id} pays you</span><b id="priceLbl">${fmt(stakePrice(c, S.stake))}</b></div><div><span>Their wallet</span><b>${fmt(f.cash)}</b></div></div>
        <button class="btn btn-green" data-act="offer">Send offer</button>
      </div>`;
    }
  }
  h += `</div>`;

  if (coOwned) {
    h += `<div class="card"><h3>Decisions</h3>
      <div class="rule">Spends of ₦1m or more need both owners. Smaller spends pass on the majority stake. Costs come out of each wallet by ownership.</div>
      <div class="grid2">
        <button class="btn sm btn-dark" data-act="propose" data-kind="branch" ${c.branches.length >= 7 ? 'disabled' : ''}>Open branch · ₦6m</button>
        <button class="btn sm btn-ghost" data-act="propose" data-kind="hire" ${c.staff >= c.staffMax ? 'disabled' : ''}>Hire staff · ₦450k</button>
      </div>
      ${c.proposals.map((p) => `<div class="prop">
        <div class="between"><b style="font-size:14px">${p.title}</b><span class="status ${p.status}">${p.status}</span></div>
        <div class="votes">${Object.entries(p.votes).map(([id, v]) => `<span class="vote ${v ?? ''}">${id === ME ? 'You' : '@' + id}: ${v ?? '…'}</span>`).join('')}<span class="vote">${p.rule}</span></div>
        ${p.note ? `<span class="tiny muted">${p.note}</span>` : ''}
      </div>`).join('')}
    </div>`;
  }
  return h;
}
