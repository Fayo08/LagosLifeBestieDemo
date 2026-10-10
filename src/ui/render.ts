import type { Tab } from '../types.ts';
import { S } from '../state.ts';
import { clock, fmt } from '../game/format.ts';
import { isRiding } from '../ride/session.ts';
import { $ } from './dom.ts';
import { bestieView } from './views/bestie.ts';
import { companyView } from './views/company.ts';
import { mapView, placeAvatars } from './views/map.ts';
import { codeView } from './views/code.ts';

const VIEWS: Record<Tab, () => string> = {
  bestie: bestieView,
  company: companyView,
  map: mapView,
  code: codeView,
};

/** Re-render the HUD and the current tab. `animate` slides map avatars to their new spots. */
export function render(animate = false): void {
  renderHud();
  document.querySelectorAll<HTMLButtonElement>('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#content').innerHTML = VIEWS[S.tab]();
  if (S.tab === 'map') placeAvatars(animate);
  $('#ride').hidden = !(isRiding() && S.tab === 'map');
}

export function renderHud(): void {
  $('#hudCash').textContent = fmt(S.me.cash);
  $('#hudTime').textContent = clock(S.minutes);
}

export function setTab(tab: Tab): void {
  S.tab = tab;
  $('#content').scrollTop = 0;
  render();
}
