import type { ModeId, PlaceId, Tab } from './types.ts';
import { S, resetState } from './state.ts';
import { clock, fmt } from './game/format.ts';
import { getCompany, stakePrice } from './game/company.ts';
import * as A from './actions.ts';
import { render, renderHud, setTab } from './ui/render.ts';
import { $, toast } from './ui/dom.ts';
import { rideAction, setArriveHandler, setCamera, skipRide, stopRide, toggleMiniMap } from './ride/session.ts';
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
    case 'ask': A.askToBeBestie(id); break;
    case 'endAsk': S.confirmEnd = true; render(); break;
    case 'endNo': S.confirmEnd = false; render(); break;
    case 'endYes': A.endBestieship(); break;
    case 'co': S.selCo = id as typeof S.selCo; render(); break;
    case 'offer': A.sendStakeOffer(); break;
    case 'cashout': A.cashOutTill(); break;
    case 'payout': A.skipToPayout(); break;
    case 'propose': A.propose(el.dataset.kind === 'branch' ? 'branch' : 'hire'); break;
    case 'pin': A.selectPlace(id as PlaceId); break;
    case 'mode': A.chooseMode(id as ModeId); break;
    case 'withbf': A.toggleBringBestie(); break;
    case 'go': A.go(); break;
    case 'do': A.doPlaceActivity(Number(el.dataset.i)); break;
    case 'home': A.headHome(); break;
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

// Stake slider updates its labels in place so the thumb keeps focus
content.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.id !== 'stake') return;
  S.stake = Number(input.value);
  $('#stakeLbl').textContent = `${S.stake}%`;
  $('#priceLbl').textContent = fmt(stakePrice(getCompany(S, S.selCo), S.stake));
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

$('#reset').addEventListener('click', () => {
  stopRide();
  resetState();
  render();
  toast('Demo reset');
});

// One in-game minute every 2.5 seconds
setInterval(() => {
  S.minutes++;
  $('#hudTime').textContent = clock(S.minutes);
}, 2500);

render();
