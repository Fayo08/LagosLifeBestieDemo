import { test } from 'node:test';
import assert from 'node:assert/strict';
import { split, totalBps } from './money.ts';

test('shares always sum to the exact amount', () => {
  const owners = [{ id: 'a', bps: 3333 }, { id: 'b', bps: 3333 }, { id: 'c', bps: 3334 }];
  for (const amount of [0, 1, 2, 7, 100, 8_862_442, 999_999_999]) {
    const s = split(amount, owners);
    assert.equal(Object.values(s).reduce((x, y) => x + y, 0), amount, `amount ${amount}`);
  }
});

test('splits a real till 70/30', () => {
  const s = split(8_862_442, [{ id: 'me', bps: 7000 }, { id: 'bf', bps: 3000 }]);
  assert.deepEqual(s, { me: 6_203_709, bf: 2_658_733 });
});

test('leftover naira goes to the largest fractional remainder', () => {
  // 10 split 2/3 vs 1/3 is 6.67 + 3.33, so the extra naira goes to the first owner
  const s = split(10, [{ id: 'a', bps: 6667 }, { id: 'b', bps: 3333 }]);
  assert.deepEqual(s, { a: 7, b: 3 });
});

test('a solo owner gets everything', () => {
  assert.deepEqual(split(1234, [{ id: 'me', bps: 10_000 }]), { me: 1234 });
});

test('totalBps adds up basis points', () => {
  assert.equal(totalBps([{ id: 'a', bps: 7000 }, { id: 'b', bps: 3000 }]), 10_000);
});
