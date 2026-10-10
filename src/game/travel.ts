import type { Friend, Mode, ModeId, PlaceId } from '../types.ts';
import { LAGOON_Y, PLACES } from '../data/places.ts';
import { MODES } from '../data/transport.ts';
import { trustTier } from './social.ts';

export interface Trip {
  /** Minutes by standard car. */
  min: number;
  via: string;
  crossesLagoon: boolean;
}

export function trip(from: PlaceId, to: PlaceId): Trip {
  const A = PLACES[from];
  const B = PLACES[to];
  const d = Math.hypot(A.x - B.x, A.y - B.y);
  const crossesLagoon = A.y < LAGOON_Y !== B.y < LAGOON_Y;
  return {
    min: Math.round(d / 3) + 12 + (crossesLagoon ? 15 : 0),
    via: crossesLagoon ? 'Third Mainland Bridge' : d < 60 ? 'Back roads' : 'Ozumba Mbadiwe',
    crossesLagoon,
  };
}

export function getMode(id: ModeId): Mode {
  const m = MODES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown mode: ${id}`);
  return m;
}

export function rideMinutes(from: PlaceId, to: PlaceId, mode: ModeId): number {
  return Math.max(4, Math.round(trip(from, to).min * getMode(mode).mult));
}

/** Modes on offer. Your friend's own car only appears when a friend is coming. */
export function availableModes(withFriend: boolean): Mode[] {
  return MODES.filter((m) => !m.friendCar || withFriend);
}

export interface Fare {
  me: number;
  friend: number;
  split: boolean;
}

/** Trust tier at which you start splitting cabs. */
export const SPLIT_CAB_TIER = 1;

/**
 * Who pays what. Keke, danfo and okada charge per seat, so each rider pays their own.
 * A cab charges per car: you pay, until you reach Paddy trust and split it.
 */
export function fares(modeId: ModeId, friendTrust: number | null): Fare {
  const m = getMode(modeId);
  const together = friendTrust !== null;
  if (m.per === 'seat') return { me: m.price, friend: together ? m.price : 0, split: false };
  if (m.id === 'cab' && together && trustTier(friendTrust) >= SPLIT_CAB_TIER) return { me: m.price / 2, friend: m.price / 2, split: true };
  return { me: m.price, friend: 0, split: false };
}

export function seatNote(modeId: ModeId, friend: Friend | null): string {
  if (!friend) return modeId === 'okada' ? 'One okada, helmet on.' : '';
  const notes: Record<ModeId, string> = {
    trek: 'You walk side by side.',
    keke: 'You both squeeze onto the back bench.',
    danfo: 'Two seats in a danfo with 12 strangers.',
    okada: 'Two okadas, riding side by side.',
    cab: trustTier(friend.trust) >= SPLIT_CAB_TIER ? 'You split the fare.' : 'You pay. Split cabs at Paddy trust.',
    driver: 'Your driver takes you both. You sit in the back.',
    fcar: `@${friend.id} drives. You ride shotgun.`,
  };
  return notes[modeId];
}
