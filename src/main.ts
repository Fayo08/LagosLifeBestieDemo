import type { ModeId, PlaceId, Tab } from './types.ts';
import { S, resetState } from './state.ts';
import { ME } from './data/seed.ts';
import { clock, fmt, isDay } from './game/format.ts';
import { getCompany, stakePrice } from './game/company.ts';
import { friendOf } from './game/people.ts';
import { passTime } from './game/social.ts';
import { FULL, proportional } from './game/money.ts';
import * as A from './actions.ts';
import { render, renderHud, setTab } from './ui/render.ts';
import { $, toast } from './ui/dom.ts';
import { rideAction, setArriveHandler, setCamera, skipRide, stopRide, toggleMiniMap } from './ride/session.ts';
import { setStartupFor } from './ui/views/phone.ts';
import type { Camera } from './ride/renderer.ts';

setArriveHandler(A.arrive);

$('#nav').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (b?.dataset.tab) setTab(b.dataset.tab as Tab);
});

const content = $('#content');

content.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-act]');
  if (!el) return;
  const id = el.dataset.id ?? '';
  switch (el.dataset.act) {
    case 'tab': setTab(el.dataset.tab as Tab); break;
    // Messages
    case 'openChat': A.openChat(id); break;
    case 'closeChat': A.closeChat(); break;
    case 'quick': A.chat(el.dataset.text ?? ''); break;
    case 'sleep': A.sleepTillMorning(); break;
    case 'linkUp': A.linkUp(id); break;
    case 'startupOpen': A.openStartup(id); break;
    case 'startupClose': A.closeStartup(); break;
    case 'startupKind': S.startup.kind = el.dataset.kind ?? S.startup.kind; render(); break;
    case 'startupSend': A.proposeStartup(); break;
    case 'endAsk': S.confirmEnd = true; render(); break;
    case 'endNo': S.confirmEnd = false; render(); break;
    case 'endYes': A.endBestieship(); break;
    // Company
    case 'co': S.selCo = id; render(); break;
    case 'offer': A.sendStakeOffer(); break;
    case 'cashout': A.cashOutTill(); break;
    case 'payout': A.skipToPayout(); break;
    case 'propose': A.propose(el.dataset.kind === 'branch' ? 'branch' : 'hire'); break;
    // Map and places
    case 'pin': A.selectPlace(id as PlaceId); break;
    case 'mode': A.chooseMode(id as ModeId); break;
    case 'companion': A.chooseCompanion(id); break;
    case 'go': A.go(); break;
    case 'do': A.doPlaceActivity(Number(el.dataset.i)); break;
    case 'home': A.headHome(); break;
    case 'share': A.share(); break;
  }
});

content.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (form.id === 'composer') {
    const input = $<HTMLInputElement>('#chatInput');
    A.chat(input.value);
    setTimeout(() => document.querySelector<HTMLInputElement>('#chatInput')?.focus(), 0);
  } else if (form.id === 'sayForm') {
    const input = $<HTMLInputElement>('#sayInput');
    A.sayHere(input.value);
  }
});

// Map pins are SVG groups, so give them keyboard support
content.addEventListener('keydown', (e) => {
  const target = e.target as Element;
  if ((e.key === 'Enter' || e.key === ' ') && target.matches('.pin')) {
    e.preventDefault();
    const id = (target as SVGGElement).dataset.id as PlaceId;
    A.selectPlace(id);
    setTimeout(() => document.querySelector<SVGGElement>(`.pin[data-id="${id}"]`)?.focus(), 0);
  }
});

// Sliders and the company name update in place so the control keeps focus
content.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.id === 'stake') {
    S.stake = Number(input.value);
    $('#stakeLbl').textContent = `${S.stake}%`;
    $('#priceLbl').textContent = fmt(stakePrice(getCompany(S, S.selCo), S.stake));
    return;
  }
  if (input.id === 'coName') {
    S.startup.name = input.value;
    return;
  }
  if (input.id === 'coMine' || input.id === 'coTheirs') {
    if (input.id === 'coMine') S.startup.mine = Number(input.value);
    else S.startup.theirs = Number(input.value);
    const f = friendOf(S, S.chatWith);
    if (!f) return;
    const bps = proportional(FULL, [{ id: ME, weight: S.startup.mine }, { id: f.id, weight: S.startup.theirs }]);
    $('#coMineLbl').textContent = fmt(S.startup.mine);
    $('#coTheirsLbl').textContent = fmt(S.startup.theirs);
    $('#coMinePct').textContent = `${(bps[ME] / 100).toFixed(1)}%`;
    $('#coTheirsPct').textContent = `${(bps[f.id] / 100).toFixed(1)}%`;
    const bars = $('#coOwnBar').children;
    (bars[0] as HTMLElement).style.flexBasis = `${bps[ME] / 100}%`;
    (bars[1] as HTMLElement).style.flexBasis = `${bps[f.id] / 100}%`;
    const send = document.querySelector<HTMLButtonElement>('[data-act="startupSend"]');
    if (send) send.textContent = `Propose · ${fmt(S.startup.mine + S.startup.theirs)} to start`;
  }
});

$('#ride').addEventListener('click', (e) => {
  const t = e.target as Element;
  const cam = t.closest<HTMLButtonElement>('[data-cam]');
  if (cam && !cam.disabled) return setCamera(cam.dataset.cam as Camera);
  const ctl = t.closest<HTMLElement>('[data-ride]');
  if (ctl) return ctl.dataset.ride === 'skip' ? skipRide() : toggleMiniMap();
  const act = t.closest<HTMLButtonElement>('[data-ra]');
  if (act && !act.disabled && rideAction(act.dataset.ra as 'radio' | 'gist' | 'gala')) renderHud();
});

document.querySelectorAll<HTMLButtonElement>('[data-time]').forEach((b) =>
  b.addEventListener('click', () => A.setTime(b.dataset.time === 'day' ? 'day' : 'night')),
);

$('#reset').addEventListener('click', () => {
  stopRide();
  resetState();
  setStartupFor(null);
  render();
  toast('Demo reset');
});

// One in-game minute every 2.5 seconds. Re-render only when day turns to night or back.
let wasDay: boolean | null = null;
setInterval(() => {
  const dayBefore = S.day;
  passTime(S, 1);
  $('#hudTime').textContent = clock(S.minutes);
  if (S.day !== dayBefore && S.tab === 'phone') render();
  const day = isDay(S.minutes);
  if (wasDay !== null && day !== wasDay) renderHud();
  wasDay = day;
}, 2500);

render();
