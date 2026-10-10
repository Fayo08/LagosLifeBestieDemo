import type { GameState } from '../types.ts';

export const ME = 'fayo_sea';

/** A fresh demo world. Every call returns new objects, so tests and resets never share state. */
export function seed(): GameState {
  const day = 42;
  return {
    minutes: 22 * 60 + 40,
    day,
    tab: 'phone',
    me: { id: ME, initials: 'FS', color: '#e98a2b', cash: 1_170_512_748, pos: 'home' },
    friends: [
      {
        id: 'tolu', initials: 'TO', color: '#3b7cf0', cash: 42_000_000, pos: 'yabahub', home: 'yabahub', mood: 'Happy',
        streak: 2, lastChatDay: day - 1, trust: 22,
        thread: [
          { from: 'them', text: 'Fayo! You saw my message about Quilox?', day: day - 2 },
          { from: 'me', text: 'Lol yes. Next weekend?', day: day - 2 },
          { from: 'them', text: 'Deal. Also we need to make money together abeg', day: day - 1 },
          { from: 'me', text: 'Say less 😂', day: day - 1 },
          { from: 'them', text: 'Fayo, you up? 👀', day },
        ],
        unread: 1,
      },
      {
        id: '2sugar', initials: '2S', color: '#8a5cf3', cash: 15_000_000, pos: 'suya', home: 'suya', mood: 'Fine',
        streak: 1, lastChatDay: day - 1, trust: 12,
        thread: [
          { from: 'them', text: 'Back to Lagos!', day: day - 1 },
          { from: 'me', text: 'Welcome back!!', day: day - 1 },
        ],
        unread: 0,
      },
      {
        id: 'uchemoney', initials: 'UM', color: '#e64b98', cash: 9_000_000, pos: 'ifitness', home: 'ifitness', mood: 'Bored',
        streak: 0, lastChatDay: day - 5, trust: 4,
        thread: [{ from: 'them', text: 'yww', day: day - 5 }],
        unread: 1,
      },
    ],
    bestie: null,
    chatWith: null,
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
    ],
    selCo: 'nollyflix',
    stake: 30,
    startup: { name: 'Mama Put Express', kind: 'Restaurant', mine: 6_000_000, theirs: 4_000_000, pending: false },
    sel: null,
    hangout: { loc: 'home', mode: 'driver', state: 'arrived', with: null, done: [] },
    mode: 'driver',
    companion: null,
    feed: [],
    disp: null,
  };
}
