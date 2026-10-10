import type { GameState } from '../types.ts';
import { PERKS } from '../data/script.ts';
import { log } from './people.ts';

export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 3;

/** Add bond XP. Returns a message for every level gained. */
export function addXP(S: GameState, n: number): string[] {
  const b = S.bestie;
  if (!b) return [];
  const messages: string[] = [];
  b.xp += n;
  while (b.xp >= XP_PER_LEVEL && b.level < MAX_LEVEL) {
    b.xp -= XP_PER_LEVEL;
    b.level++;
    const perk = PERKS.find((p) => p.lv === b.level);
    messages.push(`Bond level ${b.level}!${perk ? ` ${perk.title} unlocked` : ''}`);
    log(S, `Bond reached level ${b.level}`);
  }
  if (b.level >= MAX_LEVEL) b.xp = Math.min(b.xp, XP_PER_LEVEL);
  return messages;
}
