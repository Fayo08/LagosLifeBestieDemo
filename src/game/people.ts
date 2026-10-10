import type { Friend, GameState, Player } from '../types.ts';
import { ME } from '../data/seed.ts';
import { clock } from './format.ts';

export function person(S: GameState, id: string): Player {
  const p = id === ME ? S.me : S.friends.find((f) => f.id === id);
  if (!p) throw new Error(`Unknown player: ${id}`);
  return p;
}

/** The current bestie's player record, or null. */
export function bestieOf(S: GameState): Friend | null {
  if (!S.bestie) return null;
  const id = S.bestie.id;
  return S.friends.find((f) => f.id === id) ?? null;
}

/** True when you have a bestie and chose to bring them. */
export const ridingTogether = (S: GameState): boolean => !!(bestieOf(S) && S.withBf);

export const BESTIE_THRESHOLD = 80;

export function canAskToBeBestie(S: GameState, friendId: string): boolean {
  const f = S.friends.find((x) => x.id === friendId);
  return !!f && !S.bestie && !S.pending && f.score >= BESTIE_THRESHOLD;
}

export function makeBesties(S: GameState, friendId: string): void {
  S.pending = null;
  S.bestie = { id: friendId, since: S.day, level: 1, xp: 20, hangouts: 0, earned: 0 };
  log(S, `You and @${friendId} became besties`);
}

/** You can't end a bestie-ship while you still share a company or a ride. */
export function canEndBestieship(S: GameState, riding: boolean): boolean {
  return !!S.bestie && !riding && !S.companies.some((c) => c.owners.length > 1);
}

export function log(S: GameState, text: string): void {
  S.feed.unshift({ t: clock(S.minutes), text });
  S.feed = S.feed.slice(0, 8);
}
