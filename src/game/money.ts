import type { Ownership } from '../types.ts';

export const FULL = 10_000; // basis points

/**
 * Split an amount between owners by basis points using the largest-remainder method.
 * Every share is a whole naira and the shares always add up to exactly `amount`,
 * so nothing is lost or created by rounding.
 */
export function split(amount: number, owners: Ownership[]): Record<string, number> {
  return proportional(amount, owners.map((o) => ({ id: o.id, weight: o.bps })));
}

/**
 * Share a whole-number amount by weight with the largest-remainder method.
 * Used for profit splits (weights are basis points) and for turning two
 * cash contributions into ownership (amount is 10_000 basis points).
 */
export function proportional(amount: number, parts: { id: string; weight: number }[]): Record<string, number> {
  const total = parts.reduce((s, p) => s + p.weight, 0);
  if (total <= 0) return Object.fromEntries(parts.map((p) => [p.id, 0]));
  const rows = parts.map((p) => {
    const exact = (amount * p.weight) / total;
    return { id: p.id, exact, share: Math.floor(exact) };
  });
  let remainder = amount - rows.reduce((s, r) => s + r.share, 0);
  [...rows]
    .sort((a, b) => b.exact - b.share - (a.exact - a.share))
    .forEach((r) => {
      if (remainder > 0) {
        r.share++;
        remainder--;
      }
    });
  return Object.fromEntries(rows.map((r) => [r.id, r.share]));
}

export function totalBps(owners: Ownership[]): number {
  return owners.reduce((s, o) => s + o.bps, 0);
}
