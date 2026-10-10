import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../data/seed.ts';
import { addTrust, canStartCompanyWith, liveStreak, passTime, sendChat, sleep, streakAtRisk, tierName, trustTier } from './social.ts';

// Seed: @tolu is already on a 3-day streak and your bestie; @2sugar is on 2 days; @uchemoney has none.
const friend = (S: ReturnType<typeof seed>, id: string) => {
  const f = S.friends.find((x) => x.id === id);
  if (!f) throw new Error(id);
  return f;
};

test('the demo starts with one 3-day streak, ready for a company', () => {
  const S = seed();
  assert.equal(liveStreak(friend(S, 'tolu'), S.day), 3);
  assert.equal(S.bestie?.id, 'tolu');
  assert.equal(canStartCompanyWith(S, 'tolu'), true);
  assert.equal(canStartCompanyWith(S, '2sugar'), false);
});

test('chatting on the next day grows the streak', () => {
  const S = seed();
  const r = sendChat(S, '2sugar', 'hi');
  assert.equal(r.counted, true);
  assert.equal(r.streak, 3);
});

test('more messages the same day do not grow it again', () => {
  const S = seed();
  sendChat(S, '2sugar', 'hi');
  const trust = friend(S, '2sugar').trust;
  const r = sendChat(S, '2sugar', 'again');
  assert.equal(r.counted, false);
  assert.equal(r.streak, 3);
  assert.equal(friend(S, '2sugar').trust, trust);
});

test('any friend on a 3-day streak can start a company with you', () => {
  const S = seed();
  const r = sendChat(S, '2sugar', 'hi');
  assert.equal(r.becameBestie, false); // @tolu is already your bestie
  assert.equal(canStartCompanyWith(S, '2sugar'), true);
  assert.equal(friend(S, '2sugar').thread.at(-1)?.from, 'system');
});

test('your first 3-day streak becomes your bestie', () => {
  const S = seed();
  S.bestie = null;
  const r = sendChat(S, '2sugar', 'hi');
  assert.equal(r.becameBestie, true);
  assert.equal(S.bestie?.id, '2sugar');
});

test('a streak is at risk the next day and lapses the day after', () => {
  const S = seed();
  sleep(S);
  assert.equal(streakAtRisk(friend(S, 'tolu'), S.day), true);
  assert.equal(liveStreak(friend(S, 'tolu'), S.day), 3);
  sleep(S);
  assert.equal(liveStreak(friend(S, 'tolu'), S.day), 0);
  assert.equal(canStartCompanyWith(S, 'tolu'), false);
  assert.equal(sendChat(S, 'tolu', 'sorry!').streak, 1);
});

test('sleeping moves to 8 AM the next day', () => {
  const S = seed();
  sleep(S);
  assert.equal(S.day, 43);
  assert.equal(S.minutes, 8 * 60);
});

test('sleeping after midnight wakes you the same day', () => {
  const S = seed();
  passTime(S, 120); // 12:40 AM, day 43
  sleep(S);
  assert.equal(S.day, 43);
  assert.equal(S.minutes, 8 * 60);
});

test('passing midnight starts a new day', () => {
  const S = seed(); // 10:40 PM, day 42
  passTime(S, 90);
  assert.equal(S.day, 43);
  assert.equal(S.minutes, 10);
});

test('trust tiers and tier-up messages', () => {
  const S = seed();
  assert.equal(tierName(friend(S, 'tolu').trust), 'New link');
  const msgs = addTrust(S, 'tolu', 40);
  assert.equal(trustTier(friend(S, 'tolu').trust), 2);
  assert.equal(msgs.length, 2);
  addTrust(S, 'tolu', 500);
  assert.equal(friend(S, 'tolu').trust, 100);
});
