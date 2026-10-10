import type { GameState } from '../types.ts';

export const ME = 'fayo_sea';

/** A fresh demo world. Every call returns new objects, so tests and resets never share state. */
export function seed(): GameState {
  return {
    minutes: 22 * 60 + 40,
    day: 42,
    tab: 'bestie',
    me: { id: ME, initials: 'FS', color: '#e98a2b', cash: 1_170_512_748, pos: 'lekki' },
    friends: [
      { id: 'ochibu', initials: 'OC', color: '#3b7cf0', score: 86, cash: 42_000_000, pos: 'yaba', home: 'yaba', mood: 'Happy' },
      { id: 'Tobiv_xs', initials: 'TX', color: '#8a5cf3', score: 64, cash: 15_000_000, pos: 'surulere', home: 'surulere', mood: 'Fine' },
      { id: 'theofficial_demzy', initials: 'DM', color: '#e64b98', score: 41, cash: 9_000_000, pos: 'ikoyi', home: 'ikoyi', mood: 'Bored' },
    ],
    bestie: null,
    pending: null,
    confirmEnd: false,
    offerPending: false,
    needs: { hunger: 70, energy: 57, fun: 68, social: 82, hygiene: 81, bladder: 62 },
    companies: [
      {
        id: 'nollyflix', name: 'Nollyflix', kind: 'Tech startup', rating: 3.5,
        value: 18_000_000, till: 8_862_442, last: 4_600_000,
        owners: [{ id: ME, bps: 10_000 }], branches: ['HQ', 'Banana Island'], staff: 4, staffMax: 7, proposals: [],
      },
      {
        id: 'lynqit', name: 'LynqitAI', kind: 'Tech startup', rating: 4.1,
        value: 11_500_000, till: 2_140_000, last: 1_900_000,
        owners: [{ id: ME, bps: 10_000 }], branches: ['HQ'], staff: 2, staffMax: 5, proposals: [],
      },
      {
        id: 'xcode', name: 'Xcode school', kind: 'Education', rating: 3.8,
        value: 7_200_000, till: 960_000, last: 880_000,
        owners: [{ id: ME, bps: 10_000 }], branches: ['HQ'], staff: 3, staffMax: 6, proposals: [],
      },
    ],
    selCo: 'nollyflix',
    stake: 30,
    sel: null,
    hangout: null,
    mode: 'driver',
    withBf: true,
    feed: [],
    disp: null,
  };
}
