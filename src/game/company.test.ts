import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed, ME } from '../data/seed.ts';
import { makeBesties, canEndBestieship } from './people.ts';
import { cashOut, createProposal, getCompany, recordVote, sellStake, stakePrice } from './company.ts';
import { totalBps } from './money.ts';

function withBestie() {
  const S = seed();
  makeBesties(S, 'ochibu');
  return S;
}

test('a stake sale moves money and ownership together', () => {
  const S = withBestie();
  const c = getCompany(S, 'nollyflix');
  const price = stakePrice(c, 30);
  const myCash = S.me.cash;
  const r = sellStake(S, 'nollyflix', 30);
  assert.equal(r.ok, true);
  assert.equal(S.me.cash, myCash + price);
  assert.equal(S.friends[0].cash, 42_000_000 - price);
  assert.deepEqual(c.owners, [{ id: ME, bps: 7000 }, { id: 'ochibu', bps: 3000 }]);
  assert.equal(totalBps(c.owners), 10_000);
});

test('stake sales are capped at 49% so you keep control', () => {
  const S = withBestie();
  assert.equal(sellStake(S, 'nollyflix', 50).ok, false);
  assert.equal(getCompany(S, 'nollyflix').owners.length, 1);
});

test('a sale the bestie cannot afford changes nothing', () => {
  const S = withBestie();
  S.friends[0].cash = 100;
  const before = JSON.stringify(S.companies);
  assert.equal(sellStake(S, 'nollyflix', 30).ok, false);
  assert.equal(JSON.stringify(S.companies), before);
  assert.equal(S.friends[0].cash, 100);
});

test('only besties can buy in', () => {
  const S = seed();
  assert.equal(sellStake(S, 'nollyflix', 30).ok, false);
});

test('cash out pays each owner by ownership and empties the till', () => {
  const S = withBestie();
  sellStake(S, 'nollyflix', 30);
  const myCash = S.me.cash;
  const bfCash = S.friends[0].cash;
  const shares = cashOut(S, 'nollyflix');
  assert.equal(S.me.cash - myCash, shares[ME]);
  assert.equal(S.friends[0].cash - bfCash, shares.ochibu);
  assert.equal(shares[ME] + shares.ochibu, 8_862_442);
  assert.equal(getCompany(S, 'nollyflix').till, 0);
});

test('small spends pass on the majority stake', () => {
  const S = withBestie();
  sellStake(S, 'nollyflix', 30);
  const p = createProposal(S, 'nollyflix', 'hire');
  assert.equal(p.status, 'passed');
  assert.equal(getCompany(S, 'nollyflix').staff, 5);
});

test('spends of ₦1m or more wait for every owner', () => {
  const S = withBestie();
  sellStake(S, 'nollyflix', 30);
  const c = getCompany(S, 'nollyflix');
  const p = createProposal(S, 'nollyflix', 'branch');
  assert.equal(p.status, 'open');
  assert.equal(c.branches.length, 2);
  recordVote(S, c, p, 'ochibu', true);
  assert.equal(p.status, 'passed');
  assert.deepEqual(c.branches, ['HQ', 'Banana Island', 'Lekki']);
});

test('a no vote rejects the proposal and nobody pays', () => {
  const S = withBestie();
  sellStake(S, 'nollyflix', 30);
  const c = getCompany(S, 'nollyflix');
  const myCash = S.me.cash;
  const p = createProposal(S, 'nollyflix', 'branch');
  recordVote(S, c, p, 'ochibu', false);
  assert.equal(p.status, 'rejected');
  assert.equal(S.me.cash, myCash);
});

test('approved costs come out of each wallet by ownership', () => {
  const S = withBestie();
  sellStake(S, 'nollyflix', 30);
  const c = getCompany(S, 'nollyflix');
  const myCash = S.me.cash;
  const bfCash = S.friends[0].cash;
  const p = createProposal(S, 'nollyflix', 'branch');
  recordVote(S, c, p, 'ochibu', true);
  assert.equal(myCash - S.me.cash, 4_200_000);
  assert.equal(bfCash - S.friends[0].cash, 1_800_000);
});

test('you cannot end a bestie-ship while you share a company or a ride', () => {
  const S = withBestie();
  assert.equal(canEndBestieship(S, false), true);
  assert.equal(canEndBestieship(S, true), false);
  sellStake(S, 'nollyflix', 30);
  assert.equal(canEndBestieship(S, false), false);
});
