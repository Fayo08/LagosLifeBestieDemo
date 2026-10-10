import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../data/seed.ts';
import { addTrust, canStartCompanyWith, liveStreak, passTime, sendChat, sleep, streakAtRisk, tierName, trustTier } from './social.ts';

const ochibu = (S: ReturnType<typeof seed>) => S.friends[0];

test('chatting on the next day grows the streak', () => {
  const S = seed();
  const r = sendChat(S, 'ochibu', 'hi');
  assert.equal(r.counted, true);
  assert.equal(r.streak, 3);
});

test('more messages the same day do not grow it again', () => {
  const S = seed();
  sendChat(S, 'ochibu', 'hi');
  const trust = ochibu(S).trust;
  const r = sendChat(S, 'ochibu', 'again');
  assert.equal(r.counted, false);
  assert.equal(r.streak, 3);
  assert.equal(ochibu(S).trust, trust);
});

test('a 3-day streak makes them your bestie and unlocks a company', () => {
  const S = seed();
  assert.equal(canStartCompanyWith(S, 'ochibu'), false);
  const r = sendChat(S, 'ochibu', 'hi');
  assert.equal(r.becameBestie, true);
  assert.equal(S.bestie?.id, 'ochibu');
  assert.equal(canStartCompanyWith(S, 'ochibu'), true);
  assert.equal(ochibu(S).thread.at(-1)?.from, 'system');
});

test('only your first 3-day streak becomes your bestie', () => {
  const S = seed();
  sendChat(S, 'ochibu', 'hi');
  sendChat(S, 'Tobiv_xs', 'hi');
  sleep(S);
  const r = sendChat(S, 'Tobiv_xs', 'hi');
  assert.equal(r.streak, 3);
  assert.equal(r.becameBestie, false);
  assert.equal(S.bestie?.id, 'ochibu');
});

test('a streak is at risk the next day and lapses the day after', () => {
  const S = seed();
  sendChat(S, 'ochibu', 'hi');
  sleep(S);
  assert.equal(streakAtRisk(ochibu(S), S.day), true);
  assert.equal(liveStreak(ochibu(S), S.day), 3);
  sleep(S);
  assert.equal(liveStreak(ochibu(S), S.day), 0);
  assert.equal(sendChat(S, 'ochibu', 'sorry!').streak, 1);
});

test('sleeping moves to 8 AM the next day', () => {
  const S = seed();
  sleep(S);
  assert.equal(S.day, 43);
  assert.equal(S.minutes, 8 * 60);
});

test('trust tiers and tier-up messages', () => {
  const S = seed();
  assert.equal(tierName(ochibu(S).trust), 'New link');
  const msgs = addTrust(S, 'ochibu', 40);
  assert.equal(trustTier(ochibu(S).trust), 2);
  assert.equal(msgs.length, 2);
  addTrust(S, 'ochibu', 500);
  assert.equal(ochibu(S).trust, 100);
});

test('passing midnight starts a new day', () => {
  const S = seed(); // 10:40 PM, day 42
  passTime(S, 90);
  assert.equal(S.day, 43);
  assert.equal(S.minutes, 10);
});

test('sleeping after midnight wakes you the same day', () => {
  const S = seed();
  passTime(S, 120); // 12:40 AM, day 43
  sleep(S);
  assert.equal(S.day, 43);
  assert.equal(S.minutes, 8 * 60);
});
