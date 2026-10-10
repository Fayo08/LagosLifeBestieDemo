import type { Ownership } from '../types.ts';

export const FULL = 10_000; // basis points

/**
 * Split an amount between owners by basis points using the largest-remainder method.
 * Every share is a whole naira and the shares always add up to exactly `amount`,
 * so nothing is lost or created by rounding.
 */
export function split(amount: number, owners: Ownership[]): Record<string, number> {
  const rows = owners.map((o) => {
    const exact = (amount * o.bps) / FULL;
    return { id: o.id, exact, share: Math.floor(exact) };
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
