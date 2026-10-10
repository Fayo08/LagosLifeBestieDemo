import type { Friend, GameState, Player } from '../types.ts';
import { ME } from '../data/seed.ts';
import { clock } from './format.ts';

export function person(S: GameState, id: string): Player {
  const p = id === ME ? S.me : S.friends.find((f) => f.id === id);
  if (!p) throw new Error(`Unknown player: ${id}`);
  return p;
}

export function friendOf(S: GameState, id: string | null): Friend | null {
  if (!id) return null;
  return S.friends.find((f) => f.id === id) ?? null;
}

/** The current bestie's player record, or null. */
export function bestieOf(S: GameState): Friend | null {
  return friendOf(S, S.bestie?.id ?? null);
}

/** You can't end a bestie-ship while you still share a company or are out together. */
export function canEndBestieship(S: GameState, riding: boolean): boolean {
  if (!S.bestie) return false;
  const id = S.bestie.id;
  const sharesCompany = S.companies.some((c) => c.owners.some((o) => o.id === id));
  return !riding && !sharesCompany;
}

export function log(S: GameState, text: string): void {
  S.feed.unshift({ t: clock(S.minutes), text });
  S.feed = S.feed.slice(0, 8);
}
