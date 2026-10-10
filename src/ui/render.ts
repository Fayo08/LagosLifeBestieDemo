import type { Tab } from '../types.ts';
import { S } from '../state.ts';
import { clock, fmt, isDay } from '../game/format.ts';
import { isRiding, setRideDay } from '../ride/session.ts';
import { $ } from './dom.ts';
import { unmountScene, setSceneDay } from './scene.ts';
import { hereView, mountHere } from './views/here.ts';
import { mapView, placeAvatars } from './views/map.ts';
import { phoneView } from './views/phone.ts';
import { companyView } from './views/company.ts';
import { rideVisibleOn } from './views/shared.ts';

const VIEWS: Record<Tab, () => string> = {
  here: hereView,
  map: mapView,
  phone: phoneView,
  company: companyView,
};

/** Re-render the HUD and the current tab. `animate` slides map avatars to their new spots. */
export function render(animate = false): void {
  renderHud();
  document.querySelectorAll<HTMLButtonElement>('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#phoneDot').hidden = !S.friends.some((f) => f.unread > 0);
  const content = $('#content');
  const scrollTop = content.scrollTop;
  content.classList.toggle('landing', S.tab === 'here');
  if (S.tab !== 'here') unmountScene();
  content.innerHTML = VIEWS[S.tab]();
  if (S.tab === 'here') mountHere();
  if (S.tab === 'map') placeAvatars(animate);
  if (S.tab === 'phone') {
    // Keep the newest message in view in an open thread
    content.scrollTop = S.chatWith ? content.scrollHeight : scrollTop;
  }
  $('#ride').hidden = !(isRiding() && rideVisibleOn(S.tab));
}

export function renderHud(): void {
  const day = isDay(S.minutes);
  $('#hudCash').textContent = fmt(S.me.cash);
  $('#hudTime').textContent = clock(S.minutes);
  $('#hudSky').textContent = day ? '☀️' : '🌙';
  const screen = $('#screen');
  screen.classList.toggle('day', day);
  screen.classList.toggle('night', !day);
  setSceneDay(day);
  setRideDay(day);
}

export function setTab(tab: Tab): void {
  S.tab = tab;
  $('#content').scrollTop = 0;
  render();
}
