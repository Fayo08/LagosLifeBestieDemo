import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableModes, fares, rideMinutes, trip } from './travel.ts';
import { scaled } from './needs.ts';

test('crossing the lagoon goes over Third Mainland Bridge and takes longer', () => {
  const t = trip('home', 'yabahub');
  assert.equal(t.crossesLagoon, true);
  assert.equal(t.via, 'Third Mainland Bridge');
  assert.ok(t.min > trip('home', 'quilox').min);
});

test('okada is fastest and trekking is slowest', () => {
  const okada = rideMinutes('home', 'yabahub', 'okada');
  const cab = rideMinutes('home', 'yabahub', 'cab');
  const trek = rideMinutes('home', 'yabahub', 'trek');
  assert.ok(okada < cab && cab < trek);
});

test('per-seat rides charge both riders', () => {
  assert.deepEqual(fares('keke', 10), { me: 1000, friend: 1000, split: false });
  assert.deepEqual(fares('okada', 10), { me: 1500, friend: 1500, split: false });
  assert.deepEqual(fares('keke', null), { me: 1000, friend: 0, split: false });
});

test('a cab is one fare per car, split from Paddy trust', () => {
  assert.deepEqual(fares('cab', 10), { me: 3000, friend: 0, split: false });
  assert.deepEqual(fares('cab', 30), { me: 1500, friend: 1500, split: true });
});

test("your friend's car only shows when a friend is coming", () => {
  assert.equal(availableModes(false).some((m) => m.id === 'fcar'), false);
  assert.equal(availableModes(true).some((m) => m.id === 'fcar'), true);
});

test('Fun and Social gains are 1.5× together, losses are not', () => {
  assert.equal(scaled('fun', 10, true), 15);
  assert.equal(scaled('social', 4, true), 6);
  assert.equal(scaled('hunger', 10, true), 10);
  assert.equal(scaled('energy', -10, true), -10);
  assert.equal(scaled('fun', 10, false), 10);
});
