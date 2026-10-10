import { PLACES } from '../../data/places.ts';
import { getMode } from '../../game/travel.ts';
import { S } from '../../state.ts';
import { isRiding, minutesLeft, ride } from '../../ride/session.ts';

/** The ride plays over the Home and Map tabs, like the game. */
export const rideVisibleOn = (tab: string): boolean => tab === 'here' || tab === 'map';

/** Shown on other tabs while a ride is going, so you can jump back to it. */
export function rideBanner(): string {
  if (!isRiding() || !ride || rideVisibleOn(S.tab)) return '';
  return `<button class="banner" data-act="tab" data-tab="here"><span style="font-size:22px">${getMode(ride.mode).e}</span>
    <div class="grow"><b>On the way to ${PLACES[ride.loc].name}</b><div class="tiny muted">${minutesLeft()} min left · tap to watch</div></div></button>`;
}
