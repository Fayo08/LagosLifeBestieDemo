import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableModes, fares, rideMinutes, trip } from './travel.ts';
import { scaled } from './needs.ts';
import { addXP } from './bond.ts';
import { makeBesties } from './people.ts';
import { seed } from '../data/seed.ts';

test('crossing the lagoon goes over Third Mainland Bridge and takes longer', () => {
  const t = trip('lekki', 'yaba');
  assert.equal(t.crossesLagoon, true);
  assert.equal(t.via, 'Third Mainland Bridge');
  assert.ok(t.min > trip('lekki', 'vi').min);
});

test('okada is fastest and trekking is slowest', () => {
  const okada = rideMinutes('lekki', 'yaba', 'okada');
  const cab = rideMinutes('lekki', 'yaba', 'cab');
  const trek = rideMinutes('lekki', 'yaba', 'trek');
  assert.ok(okada < cab && cab < trek);
});

test('per-seat rides charge both riders', () => {
  assert.deepEqual(fares('keke', true, 1), { me: 1000, bestie: 1000, split: false });
  assert.deepEqual(fares('okada', true, 1), { me: 1500, bestie: 1500, split: false });
  assert.deepEqual(fares('keke', false, 1), { me: 1000, bestie: 0, split: false });
});

test('a cab is one fare per car, split from Bond Lv 2', () => {
  assert.deepEqual(fares('cab', true, 1), { me: 3000, bestie: 0, split: false });
  assert.deepEqual(fares('cab', true, 2), { me: 1500, bestie: 1500, split: true });
});

test("your bestie's car only shows when you ride together", () => {
  assert.equal(availableModes(false).some((m) => m.id === 'bcar'), false);
  assert.equal(availableModes(true).some((m) => m.id === 'bcar'), true);
});

test('Fun and Social gains are 1.5× together, losses are not', () => {
  assert.equal(scaled('fun', 10, true), 15);
  assert.equal(scaled('social', 4, true), 6);
  assert.equal(scaled('hunger', 10, true), 10);
  assert.equal(scaled('energy', -10, true), -10);
  assert.equal(scaled('fun', 10, false), 10);
});

test('bond XP levels up and stops at level 3', () => {
  const S = seed();
  makeBesties(S, 'ochibu');
  const msgs = addXP(S, 90);
  assert.equal(S.bestie?.level, 2);
  assert.equal(S.bestie?.xp, 10);
  assert.equal(msgs.length, 1);
  addXP(S, 500);
  assert.equal(S.bestie?.level, 3);
  assert.equal(S.bestie?.xp, 100);
});
