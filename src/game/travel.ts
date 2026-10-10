import type { GameState, Mode, ModeId, PlaceId } from '../types.ts';
import { LAGOON_Y, PLACES } from '../data/places.ts';
import { MODES } from '../data/transport.ts';
import { bestieOf } from './people.ts';

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

/** Modes on offer. Your bestie's own car only appears when you ride together. */
export function availableModes(together: boolean): Mode[] {
  return MODES.filter((m) => !m.bestie || together);
}

export interface Fare {
  me: number;
  bestie: number;
  split: boolean;
}

/**
 * Who pays what. Keke, danfo and okada charge per seat, so each rider pays their own.
 * A cab charges per car: you pay, until Bond Lv 2 lets you split it.
 */
export function fares(modeId: ModeId, together: boolean, bondLevel: number): Fare {
  const m = getMode(modeId);
  if (m.per === 'seat') return { me: m.price, bestie: together ? m.price : 0, split: false };
  if (m.id === 'cab' && together && bondLevel >= 2) return { me: m.price / 2, bestie: m.price / 2, split: true };
  return { me: m.price, bestie: 0, split: false };
}

export function seatNote(S: GameState, modeId: ModeId, together: boolean): string {
  const f = bestieOf(S);
  if (!together || !f || !S.bestie) return modeId === 'okada' ? 'One okada, helmet on.' : '';
  const notes: Record<ModeId, string> = {
    trek: 'You walk side by side.',
    keke: 'You both squeeze onto the back bench.',
    danfo: 'Two seats in a danfo with 12 strangers.',
    okada: 'Two okadas, riding side by side.',
    cab: S.bestie.level >= 2 ? 'You split the fare.' : 'You pay. Split cabs unlock at Bond Lv 2.',
    driver: 'Your driver takes you both. You sit in the back.',
    bcar: `@${f.id} drives. You ride shotgun.`,
  };
  return notes[modeId];
}
