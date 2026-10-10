import type { CompanyId, ModeId, PlaceId, Proposal } from './types.ts';
import { S } from './state.ts';
import { PLACES } from './data/places.ts';
import { ME } from './data/seed.ts';
import { bestieOf, canAskToBeBestie, canEndBestieship, log, makeBesties, ridingTogether } from './game/people.ts';
import { addXP } from './game/bond.ts';
import { cashOut, createProposal, eveningPayout, getCompany, isCoOwned, recordVote, sellStake } from './game/company.ts';
import { doActivity } from './game/needs.ts';
import { clamp, fmt } from './game/format.ts';
import { fares, getMode } from './game/travel.ts';
import { isRiding, startRide } from './ride/session.ts';
import { toast } from './ui/dom.ts';
import { render } from './ui/render.ts';

/*
 * Player intents. Each one applies a game rule from src/game, then re-renders.
 * Timeouts stand in for the other player answering over the network.
 */

const xp = (n: number) => addXP(S, n).forEach((m) => toast(m, 'good'));

export function askToBeBestie(friendId: string): void {
  if (!canAskToBeBestie(S, friendId)) return;
  S.pending = friendId;
  render();
  setTimeout(() => {
    makeBesties(S, friendId);
    toast(`@${friendId} said yes. You're besties now 💚`, 'good');
    render();
  }, 1400);
}

export function endBestieship(): void {
  if (!S.bestie || !canEndBestieship(S, isRiding())) return;
  const id = S.bestie.id;
  S.bestie = null;
  S.confirmEnd = false;
  S.feed = [];
  S.hangout = null;
  toast(`You and @${id} are friends again`);
  render();
}

export function sendStakeOffer(): void {
  const f = bestieOf(S);
  if (!f) return;
  S.offerPending = true;
  render();
  setTimeout(() => {
    S.offerPending = false;
    const r = sellStake(S, S.selCo, S.stake);
    if (r.ok) xp(15);
    toast(r.message, r.ok ? 'good' : 'bad');
    render();
  }, 1500);
}

export function cashOutTill(): void {
  const c = getCompany(S, S.selCo);
  if (c.till <= 0) return;
  const total = c.till;
  const coOwned = isCoOwned(c);
  const shares = cashOut(S, S.selCo);
  const f = bestieOf(S);
  if (coOwned && f) {
    xp(10);
    log(S, `Cashed out ${c.name}: you ${fmt(shares[ME])}, @${f.id} ${fmt(shares[f.id])}`);
    toast(`+${fmt(shares[ME])} to you, +${fmt(shares[f.id])} to @${f.id}`, 'good');
  } else toast(`+${fmt(total)} to your wallet`, 'good');
  render();
}

export function skipToPayout(): void {
  const amount = eveningPayout(S, S.selCo, Math.random());
  S.minutes = 18 * 60;
  toast(`6 PM payout: ${getCompany(S, S.selCo).name} made ${fmt(amount)}`);
  render();
}

export function propose(kind: Proposal['kind']): void {
  const id: CompanyId = S.selCo;
  const c = getCompany(S, id);
  const f = bestieOf(S);
  if (!f) return;
  const p = createProposal(S, id, kind);
  if (p.status === 'passed') {
    xp(10);
    toast(`${p.title.split(' · ')[0]} approved`, 'good');
  }
  render();
  if (p.status !== 'open') return;
  setTimeout(() => {
    const yes = kind === 'hire' || Math.random() < 0.8;
    recordVote(S, c, p, f.id, yes);
    if (p.status === 'passed') {
      xp(10);
      toast(`${p.title.split(' · ')[0]} approved`, 'good');
    }
    render();
  }, 1700);
}

export function selectPlace(id: PlaceId): void {
  if (S.hangout?.state === 'invited') return;
  S.sel = id;
  render();
}

export function chooseMode(id: ModeId): void {
  S.mode = id;
  render();
}

export function toggleBringBestie(): void {
  S.withBf = !S.withBf;
  render();
}

export function go(): void {
  const loc = S.sel;
  if (!loc || isRiding()) return;
  const f = bestieOf(S);
  const together = ridingTogether(S);
  const mode = S.mode;
  const fare = fares(mode, together, S.bestie?.level ?? 1);
  if (S.me.cash < fare.me) {
    toast("You can't afford that ride", 'bad');
    return;
  }
  const pay = () => {
    S.me.cash -= fare.me;
    if (f && together) f.cash -= fare.bestie;
  };
  if (together && f) {
    S.hangout = { loc, mode, state: 'invited', together: true, done: [] };
    render();
    setTimeout(() => {
      pay();
      if (S.hangout) S.hangout.state = 'riding';
      toast(`@${f.id} is in. Let's go!`, 'good');
      startRide(loc, mode, true);
      render();
    }, 1300);
  } else {
    pay();
    S.hangout = { loc, mode, state: 'riding', together: false, done: [] };
    startRide(loc, mode, false);
    render();
  }
}

/** Called by the ride session when the trip finishes or is skipped. */
export function arrive(r: { loc: PlaceId; mode: ModeId; minutes: number; together: boolean }): void {
  const f = bestieOf(S);
  const place = PLACES[r.loc];
  S.me.pos = r.loc;
  S.minutes += r.minutes;
  S.hangout = { loc: r.loc, mode: r.mode, state: 'arrived', together: r.together, done: [] };
  if (r.together && f && S.bestie) {
    f.pos = r.loc;
    S.bestie.hangouts++;
    xp(10);
    S.needs.social = clamp(S.needs.social + 6);
    const m = getMode(r.mode);
    log(S, `Rode ${m.bestie ? `in @${f.id}'s car` : 'by ' + m.name.toLowerCase()} to ${place.name} together`);
  }
  toast(`Arrived at ${place.name}`, 'good');
  S.sel = r.loc;
  S.tab = 'map';
  render(true);
}

export function doPlaceActivity(index: number): void {
  const hg = S.hangout;
  if (!hg || hg.state !== 'arrived' || hg.done.includes(index)) return;
  const act = PLACES[hg.loc].acts[index];
  const r = doActivity(S, act, hg.together);
  if (!r.ok) {
    toast("You can't afford that", 'bad');
    return;
  }
  hg.done.push(index);
  S.minutes += 45;
  if (hg.together) {
    xp(15);
    log(S, `${act.label} at ${PLACES[hg.loc].name}`);
  }
  toast(`${act.label}: ${r.gains.join(', ')}`, 'good');
  render();
}

export function headHome(): void {
  S.hangout = null;
  S.sel = 'lekki';
  render();
}
