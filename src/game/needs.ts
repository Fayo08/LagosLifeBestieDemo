import type { Activity, GameState, NeedKey } from '../types.ts';
import { clamp } from './format.ts';
import { getCompany } from './company.ts';
import { short } from './format.ts';

export const TOGETHER_MULTIPLIER = 1.5;

/** Positive Fun and Social gains are 1.5× when you are with your bestie. */
export function scaled(key: NeedKey, delta: number, together: boolean): number {
  return together && delta > 0 && (key === 'fun' || key === 'social') ? Math.round(delta * TOGETHER_MULTIPLIER) : delta;
}

export function boost(S: GameState, key: NeedKey, delta: number, together: boolean): number {
  const v = scaled(key, delta, together);
  S.needs[key] = clamp(S.needs[key] + v);
  return v;
}

/** Apply an activity's effects. Returns human-readable gains for the toast. */
export function doActivity(S: GameState, act: Activity, together: boolean): { ok: boolean; gains: string[] } {
  if (act.cost && S.me.cash < act.cost) return { ok: false, gains: [] };
  if (act.cost) S.me.cash -= act.cost;
  const gains: string[] = [];
  for (const [k, v] of Object.entries(act.fx) as [NeedKey, number][]) {
    const applied = boost(S, k, v, together);
    if (applied > 0) gains.push(`+${applied} ${k}`);
  }
  if (act.co && act.value) {
    const c = getCompany(S, act.co);
    c.value += act.value;
    gains.push(`${c.name} +${short(act.value)}`);
  }
  return { ok: true, gains };
}

export function fxText(fx: Partial<Record<NeedKey, number>>, together: boolean): string {
  return (Object.entries(fx) as [NeedKey, number][])
    .map(([k, v]) => {
      const m = scaled(k, v, together);
      return `${m > 0 ? '+' : ''}${m} ${k[0].toUpperCase() + k.slice(1)}`;
    })
    .join(' · ');
}
