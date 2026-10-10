import type { ModeId, PlaceId, Proposal } from './types.ts';
import { S } from './state.ts';
import { PLACES, placeLabel } from './data/places.ts';
import { FRIEND_REPLIES, TRUST } from './data/script.ts';
import { ME } from './data/seed.ts';
import { bestieOf, canEndBestieship, friendOf, log } from './game/people.ts';
import { addTrust, canStartCompanyWith, passTime, receiveChat, sendChat, sleep } from './game/social.ts';
import { cashOut, createProposal, eveningPayout, getCompany, isCoOwned, recordVote, sellStake, startJointCompany } from './game/company.ts';
import { doActivity } from './game/needs.ts';
import { clamp, fmt } from './game/format.ts';
import { fares, getMode } from './game/travel.ts';
import { isRiding, startRide } from './ride/session.ts';
import { pick, toast } from './ui/dom.ts';
import { render } from './ui/render.ts';
import { sceneSay, walkTo } from './ui/scene.ts';
import { setStartupFor, typing } from './ui/views/phone.ts';

/*
 * Player intents. Each one applies a game rule from src/game, then re-renders.
 * Timeouts stand in for the other player answering over the network.
 */

const trust = (id: string | null, n: number) => addTrust(S, id, n).forEach((m) => toast(m, 'good'));

/* ---------- Messages ---------- */

export function openChat(id: string): void {
  const f = friendOf(S, id);
  if (!f) return;
  f.unread = 0;
  S.chatWith = id;
  S.confirmEnd = false;
  render();
}

export function closeChat(): void {
  S.chatWith = null;
  setStartupFor(null);
  render();
}

export function chat(text: string): void {
  const f = friendOf(S, S.chatWith);
  const t = text.trim();
  if (!f || !t) return;
  const r = sendChat(S, f.id, t);
  if (r.counted) toast(`🔥 ${r.streak}-day streak with @${f.id} · +${TRUST.dailyChat} trust`, 'good');
  r.messages.forEach((m) => toast(m, 'good'));
  if (r.becameBestie) toast(`@${f.id} is your bestie. Start a company together!`, 'good');
  typing.add(f.id);
  render();
  setTimeout(() => {
    typing.delete(f.id);
    receiveChat(S, f.id, pick(FRIEND_REPLIES[t] ?? FRIEND_REPLIES.default));
    if (S.chatWith !== f.id) f.unread++;
    render();
  }, 1200);
}

export function sleepTillMorning(): void {
  if (isRiding()) return;
  sleep(S);
  for (const f of S.friends) f.pos = f.home;
  S.me.pos = 'home';
  S.hangout = { loc: 'home', mode: 'driver', state: 'arrived', with: null, done: [] };
  S.disp = null;
  toast(`☀️ Day ${S.day}, 8:00 AM. Good morning!`);
  render();
}

export function setTime(when: 'day' | 'night'): void {
  S.minutes = when === 'day' ? 9 * 60 : 22 * 60;
  render();
}

/** Start a trip with this friend: pick them as your companion and open the map. */
export function linkUp(id: string): void {
  S.companion = id;
  S.sel = null;
  S.tab = 'map';
  toast(`Pick a place. @${id} is coming with you.`);
  render();
}

/* ---------- Company together ---------- */

export function openStartup(id: string): void {
  if (!canStartCompanyWith(S, id)) return;
  const f = friendOf(S, id);
  if (f) f.unread = 0;
  S.chatWith = id;
  S.tab = 'phone';
  setStartupFor(id);
  render();
}

export function closeStartup(): void {
  setStartupFor(null);
  render();
}

export function proposeStartup(): void {
  const f = bestieOf(S);
  if (!f) return;
  const d = S.startup;
  S.startup.pending = true;
  sendChat(S, f.id, `Let's start ${d.name}: a ${d.kind.toLowerCase()}. I put in ${fmt(d.mine)}, you put in ${fmt(d.theirs)}?`);
  render();
  setTimeout(() => {
    S.startup.pending = false;
    const r = startJointCompany(S, d);
    if (r.ok && r.company) {
      receiveChat(S, f.id, `Yes!! Let's do it 🤝`);
      f.thread.push({ from: 'system', text: `🏢 ${r.company.name} is open. ${r.message.split('! ')[1] ?? ''}`, day: S.day });
      trust(f.id, TRUST.decisionTogether);
      setStartupFor(null);
      S.selCo = r.company.id;
      S.startup = { ...S.startup, name: '' };
      toast(r.message, 'good');
    } else {
      receiveChat(S, f.id, `Hmm, can't do that yet. ${r.message}`);
      toast(r.message, 'bad');
    }
    render();
  }, 1600);
}

export function endBestieship(): void {
  if (!S.bestie || !canEndBestieship(S, isRiding())) return;
  const id = S.bestie.id;
  S.bestie = null;
  S.confirmEnd = false;
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
    if (r.ok) trust(f.id, TRUST.decisionTogether);
    toast(r.message, r.ok ? 'good' : 'bad');
    render();
  }, 1500);
}

export function cashOutTill(): void {
  const c = getCompany(S, S.selCo);
  if (c.till <= 0) return;
  const total = c.till;
  const partner = c.owners.find((o) => o.id !== ME)?.id ?? null;
  const shares = cashOut(S, S.selCo);
  if (isCoOwned(c) && partner) {
    trust(partner, TRUST.cashOutTogether);
    log(S, `Cashed out ${c.name}: you ${fmt(shares[ME])}, @${partner} ${fmt(shares[partner])}`);
    toast(`+${fmt(shares[ME])} to you, +${fmt(shares[partner])} to @${partner}`, 'good');
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
  const c = getCompany(S, S.selCo);
  const partner = c.owners.find((o) => o.id !== ME)?.id;
  if (!partner) return;
  const p = createProposal(S, c.id, kind);
  // createProposal adds the bestie's vote slot; make sure the actual co-owner votes
  if (!(partner in p.votes)) p.votes[partner] = p.status === 'passed' ? '—' : null;
  if (p.status === 'passed') toast(`${p.title.split(' · ')[0]} approved`, 'good');
  render();
  if (p.status !== 'open') return;
  setTimeout(() => {
    const yes = kind === 'hire' || Math.random() < 0.8;
    recordVote(S, c, p, partner, yes);
    if (p.status === 'passed') {
      trust(partner, TRUST.decisionTogether);
      toast(`${p.title.split(' · ')[0]} approved`, 'good');
    }
    render();
  }, 1700);
}

/* ---------- Going places ---------- */

export function selectPlace(id: PlaceId): void {
  if (S.hangout?.state === 'invited') return;
  S.sel = id;
  render();
}

export function chooseMode(id: ModeId): void {
  S.mode = id;
  render();
}

export function chooseCompanion(id: string): void {
  S.companion = id || null;
  render();
}

/** Below this trust, a friend may turn down a last-minute invite. */
const INVITE_TRUST = 10;

export function go(): void {
  const loc = S.sel;
  if (!loc || isRiding() || loc === S.me.pos) return;
  const f = friendOf(S, S.companion);
  const mode = S.mode;
  const fare = fares(mode, f ? f.trust : null);
  if (S.me.cash < fare.me) {
    toast("You can't afford that ride", 'bad');
    return;
  }
  const leave = (withId: string | null) => {
    S.me.cash -= fare.me;
    if (f && withId) f.cash -= fare.friend;
    S.hangout = { loc, mode, state: 'riding', with: withId, done: [] };
    startRide(loc, mode, withId);
    S.tab = 'here';
    render();
  };
  if (!f) return leave(null);
  S.hangout = { loc, mode, state: 'invited', with: f.id, done: [] };
  render();
  setTimeout(() => {
    if (f.trust < INVITE_TRUST) {
      receiveChat(S, f.id, `Not tonight o. Maybe next time?`);
      f.unread++;
      trust(f.id, 1);
      S.hangout = { loc: S.me.pos, mode, state: 'arrived', with: null, done: [] };
      toast(`@${f.id} said not tonight. Chat more to build trust.`, 'bad');
      render();
      return;
    }
    toast(`@${f.id} is in. Let's go!`, 'good');
    leave(f.id);
  }, 1300);
}

/** Called by the ride session when the trip finishes or is skipped. */
export function arrive(r: { loc: PlaceId; mode: ModeId; minutes: number; with: string | null }): void {
  const f = friendOf(S, r.with);
  S.me.pos = r.loc;
  passTime(S, r.minutes);
  S.hangout = { loc: r.loc, mode: r.mode, state: 'arrived', with: f?.id ?? null, done: [] };
  if (f) {
    f.pos = r.loc;
    if (S.bestie?.id === f.id) S.bestie.hangouts++;
    trust(f.id, TRUST.rideTogether);
    S.needs.social = clamp(S.needs.social + 6);
    const m = getMode(r.mode);
    log(S, `Rode ${m.friendCar ? `in @${f.id}'s car` : 'by ' + m.name.toLowerCase()} to ${placeLabel(r.loc)} with @${f.id}`);
  }
  toast(`Arrived at ${PLACES[r.loc].name}`, 'good');
  S.sel = null;
  S.tab = 'here';
  render(true);
}

export function doPlaceActivity(index: number): void {
  const hg = S.hangout;
  if (!hg || hg.state !== 'arrived' || hg.loc !== S.me.pos || hg.done.includes(index)) return;
  const act = PLACES[hg.loc].acts[index];
  const r = doActivity(S, act, !!hg.with);
  if (!r.ok) {
    toast("You can't afford that", 'bad');
    return;
  }
  hg.done.push(index);
  passTime(S, 45);
  walkTo(index, hg.with);
  if (hg.with) {
    trust(hg.with, TRUST.activityTogether);
    log(S, `${act.label} at ${PLACES[hg.loc].name} with @${hg.with}`);
    setTimeout(() => sceneSay(hg.with ?? '', pick(['This is so fun 😂', 'Again tomorrow?', 'Best day', 'You’re mad o'])), 1200);
  }
  toast(`${act.emoji} ${act.label}: ${r.gains.join(', ') || 'done'}${hg.with ? ` · +${TRUST.activityTogether} trust` : ''}`, 'good');
  render();
}

export function sayHere(text: string): void {
  const t = text.trim();
  if (!t) return;
  sceneSay(ME, t);
  const hg = S.hangout;
  if (hg?.with) setTimeout(() => sceneSay(hg.with ?? '', pick(['Facts!', '😂😂', 'Lol, stop', 'True talk'])), 1300);
  render();
}

export function headHome(): void {
  S.sel = 'home';
  S.tab = 'map';
  render();
}

export function share(): void {
  const label = placeLabel(S.me.pos);
  const text = `Come to ${label} on Lagos Life`;
  try {
    navigator.clipboard?.writeText(text).then(() => toast('Copied an invite to this place'), () => toast(text));
  } catch {
    toast(text);
  }
}
