import type { Mode } from '../types.ts';

/** Priced like the game's own ride sheet. */
export const MODES: Mode[] = [
  { id: 'trek', name: 'Trek', e: '🚶🏾', price: 0, per: 'seat', mult: 3 },
  { id: 'keke', name: 'Keke', e: '🛺', price: 1_000, per: 'seat', mult: 1.3 },
  { id: 'danfo', name: 'Danfo', e: '🚐', price: 1_000, per: 'seat', mult: 1.4 },
  { id: 'okada', name: 'Okada', e: '🏍️', price: 1_500, per: 'seat', mult: 0.7 },
  { id: 'cab', name: 'Cab', e: '🚕', price: 3_000, per: 'car', mult: 1 },
  { id: 'driver', name: 'Driver', e: '👨🏾‍✈️', price: 0, per: 'car', mult: 1 },
  { id: 'fcar', name: "Friend's car", e: '🚙', price: 0, per: 'car', mult: 1, friendCar: true },
];
