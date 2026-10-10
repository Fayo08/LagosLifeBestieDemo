import { seed } from './data/seed.ts';

/** The single game state for this tab. Game rules in src/game take it as an argument. */
export const S = seed();

export function resetState(): void {
  Object.assign(S, seed());
}
