import type { Friend, GameState } from '../types.ts';
import { STREAK_TO_UNLOCK, TRUST, TRUST_TIERS } from '../data/script.ts';
import { clamp } from './format.ts';
import { friendOf, log } from './people.ts';

/**
 * Chat streaks count in-game days. Message a friend on consecutive days and the
 * streak grows; miss a day and it resets. A 3-day streak unlocks starting a
 * company together. Going places together needs no streak at all.
 */

/** The streak as it stands today: it lapses if you didn't chat yesterday or today. */
export function liveStreak(f: Friend, day: number): number {
  return f.lastChatDay >= day - 1 ? f.streak : 0;
}

/** True if today's message is still needed to keep the streak alive. */
export function streakAtRisk(f: Friend, day: number): boolean {
  return f.lastChatDay === day - 1 && f.streak > 0;
}

export function trustTier(trust: number): number {
  let tier = 0;
  TRUST_TIERS.forEach((t, i) => {
    if (trust >= t.min) tier = i;
  });
  return tier;
}

export const tierName = (trust: number): string => TRUST_TIERS[trustTier(trust)].name;

/** Add trust. Returns a message for each tier crossed. */
export function addTrust(S: GameState, friendId: string | null, n: number): string[] {
  const f = friendOf(S, friendId);
  if (!f) return [];
  const before = trustTier(f.trust);
  f.trust = clamp(f.trust + n);
  const after = trustTier(f.trust);
  const out: string[] = [];
  for (let t = before + 1; t <= after; t++) {
    out.push(`You and @${f.id} are ${TRUST_TIERS[t].name} now`);
    log(S, `Trust with @${f.id} reached ${TRUST_TIERS[t].name}`);
  }
  return out;
}

export interface ChatResult {
  /** First message of the day: streak and trust moved. */
  counted: boolean;
  streak: number;
  /** The streak just reached the unlock and this friend became your bestie. */
  becameBestie: boolean;
  messages: string[];
}

export function sendChat(S: GameState, friendId: string, text: string): ChatResult {
  const f = friendOf(S, friendId);
  if (!f) throw new Error(`Unknown friend: ${friendId}`);
  f.thread.push({ from: 'me', text, day: S.day });
  const counted = f.lastChatDay !== S.day;
  const messages: string[] = [];
  let becameBestie = false;
  if (counted) {
    f.streak = f.lastChatDay === S.day - 1 ? f.streak + 1 : 1;
    f.lastChatDay = S.day;
    messages.push(...addTrust(S, f.id, TRUST.dailyChat));
    if (f.streak >= STREAK_TO_UNLOCK && !S.bestie) {
      S.bestie = { id: f.id, since: S.day, hangouts: 0, earned: 0 };
      becameBestie = true;
      f.thread.push({ from: 'system', text: `🔥 ${f.streak}-day streak! You and @${f.id} are besties. You can start a company together.`, day: S.day });
      log(S, `${f.streak}-day streak with @${f.id}. Besties!`);
    } else if (f.streak === STREAK_TO_UNLOCK) {
      f.thread.push({ from: 'system', text: `🔥 ${f.streak}-day streak! You can start a company together.`, day: S.day });
      log(S, `${f.streak}-day streak with @${f.id}`);
    }
  }
  return { counted, streak: f.streak, becameBestie, messages };
}

export function receiveChat(S: GameState, friendId: string, text: string): void {
  friendOf(S, friendId)?.thread.push({ from: 'them', text, day: S.day });
}

/** Starting a company together needs a 3-day streak with that friend that is still alive. */
export function canStartCompanyWith(S: GameState, friendId: string): boolean {
  const f = friendOf(S, friendId);
  return !!f && liveStreak(f, S.day) >= STREAK_TO_UNLOCK;
}

/** Move the in-game clock forward. Passing midnight starts a new day, which is what streaks count. */
export function passTime(S: GameState, minutes: number): void {
  S.minutes += minutes;
  while (S.minutes >= 1440) {
    S.minutes -= 1440;
    S.day += 1;
  }
}

/** Sleep to the next 8 AM: tomorrow, or later today if it's already past midnight. */
export function sleep(S: GameState): void {
  if (S.minutes >= 8 * 60) S.day += 1;
  S.minutes = 8 * 60;
}
