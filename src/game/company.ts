import type { Company, CompanyId, GameState, Proposal } from '../types.ts';
import { BRANCHES } from '../data/script.ts';
import { ME } from '../data/seed.ts';
import { FULL, split } from './money.ts';
import { bestieOf, log, person } from './people.ts';
import { short } from './format.ts';

export const MAX_STAKE_PCT = 49;
export const UNANIMOUS_FROM = 1_000_000;
export const BRANCH_COST = 6_000_000;
export const HIRE_COST = 450_000;

export function getCompany(S: GameState, id: CompanyId): Company {
  const c = S.companies.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown company: ${id}`);
  return c;
}

export const myBps = (c: Company): number => c.owners.find((o) => o.id === ME)?.bps ?? 0;
export const isCoOwned = (c: Company): boolean => c.owners.length > 1;
export const stakePrice = (c: Company, pct: number): number => Math.round((c.value * pct) / 100);

export type Result = { ok: true; message: string } | { ok: false; message: string };

/**
 * Atomic stake sale: the buyer's naira and the seller's basis points move together or not at all.
 * Capped at 49% so the founder keeps control.
 */
export function sellStake(S: GameState, companyId: CompanyId, pct: number): Result {
  const c = getCompany(S, companyId);
  const f = bestieOf(S);
  if (!f) return { ok: false, message: 'Only besties can buy into your companies.' };
  if (isCoOwned(c)) return { ok: false, message: `${c.name} already has a co-owner.` };
  if (!Number.isInteger(pct) || pct < 1 || pct > MAX_STAKE_PCT) {
    return { ok: false, message: `Stakes go from 1% to ${MAX_STAKE_PCT}%.` };
  }
  const price = stakePrice(c, pct);
  if (price > f.cash) return { ok: false, message: `@${f.id} only has ${short(f.cash)}. Try a smaller stake.` };
  f.cash -= price;
  S.me.cash += price;
  const bps = pct * 100;
  c.owners = [{ id: ME, bps: FULL - bps }, { id: f.id, bps }];
  log(S, `@${f.id} bought ${pct}% of ${c.name} for ${short(price)}`);
  return { ok: true, message: `Deal! @${f.id} now owns ${pct}% of ${c.name}` };
}

/** Empty the till into every owner's wallet by ownership. Returns each owner's share. */
export function cashOut(S: GameState, companyId: CompanyId): Record<string, number> {
  const c = getCompany(S, companyId);
  const shares = split(c.till, c.owners);
  for (const [id, v] of Object.entries(shares)) person(S, id).cash += v;
  if (isCoOwned(c) && S.bestie) S.bestie.earned += c.till;
  c.till = 0;
  return shares;
}

export function eveningPayout(S: GameState, companyId: CompanyId, rand: number): number {
  const c = getCompany(S, companyId);
  const amount = Math.round(c.value * (0.22 + rand * 0.12));
  c.till = amount;
  c.last = amount;
  return amount;
}

/**
 * Create a spending proposal. Spends of ₦1m or more need every owner;
 * smaller spends pass straight away for a majority owner.
 */
export function createProposal(S: GameState, companyId: CompanyId, kind: Proposal['kind']): Proposal {
  const c = getCompany(S, companyId);
  const f = bestieOf(S);
  const cost = kind === 'branch' ? BRANCH_COST : HIRE_COST;
  const name = kind === 'branch' ? BRANCHES.find((b) => !c.branches.includes(b)) ?? 'New' : null;
  const unanimous = cost >= UNANIMOUS_FROM;
  const votes: Proposal['votes'] = { [ME]: 'yes' };
  if (f) votes[f.id] = null;
  const p: Proposal = {
    title: kind === 'branch' ? `Open ${name} branch · ${short(cost)}` : `Hire 1 staff · ${short(cost)}`,
    kind, cost, name,
    rule: unanimous ? 'needs both' : 'majority',
    votes, status: 'open', note: '',
  };
  c.proposals.unshift(p);
  c.proposals = c.proposals.slice(0, 4);
  if (!unanimous && myBps(c) > FULL / 2) {
    if (f) votes[f.id] = '—';
    p.note = 'Passed on your majority stake.';
    executeProposal(S, c, p);
  }
  return p;
}

export function recordVote(S: GameState, c: Company, p: Proposal, voterId: string, yes: boolean): void {
  if (p.status !== 'open') return;
  p.votes[voterId] = yes ? 'yes' : 'no';
  if (!yes) {
    p.status = 'rejected';
    p.note = `@${voterId}: "Let's wait until the till is bigger."`;
    log(S, `@${voterId} voted no on ${p.title}`);
    return;
  }
  if (Object.values(p.votes).every((v) => v === 'yes' || v === '—')) executeProposal(S, c, p);
}

/** Pay for an approved proposal out of each owner's wallet, by ownership. */
export function executeProposal(S: GameState, c: Company, p: Proposal): void {
  const shares = split(p.cost, c.owners);
  const shortOf = Object.entries(shares).find(([id, v]) => person(S, id).cash < v);
  if (shortOf) {
    p.status = 'rejected';
    p.note = `${shortOf[0] === ME ? 'You' : '@' + shortOf[0]} can't cover their share.`;
    return;
  }
  for (const [id, v] of Object.entries(shares)) person(S, id).cash -= v;
  p.status = 'passed';
  if (p.kind === 'branch' && p.name) {
    c.branches.push(p.name);
    c.value += Math.round(p.cost * 1.25);
  } else {
    c.staff++;
    c.value += 200_000;
  }
  if (!p.note) {
    p.note = 'Paid ' + Object.entries(shares).map(([id, v]) => `${id === ME ? 'you' : '@' + id} ${short(v)}`).join(', ') + '.';
  }
  if (isCoOwned(c)) log(S, `${c.name}: ${p.title.split(' · ')[0]} approved`);
}
