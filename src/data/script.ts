import type { NeedKey, SceneKind } from '../types.ts';

export const NEEDS: { key: NeedKey; label: string; color: string; emoji: string }[] = [
  { key: 'hunger', label: 'Hunger', color: 'var(--amber)', emoji: '🍛' },
  { key: 'energy', label: 'Energy', color: 'var(--blue)', emoji: '⚡' },
  { key: 'fun', label: 'Fun', color: 'var(--yellow)', emoji: '🎉' },
  { key: 'social', label: 'Social', color: 'var(--pink)', emoji: '💬' },
  { key: 'hygiene', label: 'Hygiene', color: 'var(--teal)', emoji: '🫧' },
  { key: 'bladder', label: 'Bladder', color: 'var(--purple)', emoji: '🚽' },
];

/** Trust tiers. Trust is built, never bought: daily chats, trips and doing things together. */
export const TRUST_TIERS = [
  { min: 0, name: 'New link' },
  { min: 30, name: 'Paddy' },
  { min: 60, name: 'Ride or Die' },
] as const;

export const STREAK_TO_UNLOCK = 3;

export const UNLOCKS = [
  { key: 'go', title: 'Go anywhere together', text: 'Invite them along on any trip. Fun and Social gains are 1.5×.' },
  { key: 'company', title: 'Start a company together', text: `Keep a ${STREAK_TO_UNLOCK}-day chat streak. You both put in money and own it by what you put in.` },
  { key: 'cab', title: 'Split the cab', text: 'Cab fares are shared when you ride together. Needs Paddy trust.' },
  { key: 'key', title: 'Spare house key', text: "Walk into each other's house without an invite. Needs Ride or Die trust." },
] as const;

/** Trust gained per action. */
export const TRUST = {
  dailyChat: 6,
  rideTogether: 8,
  activityTogether: 5,
  gist: 2,
  cashOutTogether: 4,
  decisionTogether: 4,
} as const;

export const QUICK_REPLIES = ['What’s up?', 'Gist me', 'Link up tonight?', 'How’s business?'];

export const FRIEND_REPLIES: Record<string, string[]> = {
  'What’s up?': ['Chilling o. You?', 'Just woke up 😂', 'Work work work. You?'],
  'Gist me': ['You won’t believe who I saw at Quilox…', 'Tobi finally paid me back 😭', 'Lagos landlord drama again'],
  'Link up tonight?': ['Say the place, I’m there', 'Only if you’re driving 😂', 'Yes! I’m bored'],
  'How’s business?': ['Slow, but we move', 'We need to do something together', 'Better than last week'],
  default: ['😂😂', 'Ehen?', 'Facts', 'Lol, you’re mad'],
};

export const STATIONS = [
  { name: 'Afrobeats', line: 'Ah! This one is my jam. Louder!' },
  { name: 'Fuji', line: 'Fuji?? Are you my uncle now?' },
  { name: 'Amapiano', line: 'Log drum! Don’t touch that dial.' },
  { name: 'Highlife', line: 'Old school. Okay, I respect it.' },
  { name: 'Gospel', line: 'Pastor Fayo, we’re going to the club 😂' },
];

export const GIST: [string, string][] = [
  ['Did you see the group chat?', 'Which one? Gist me everything.'],
  ['Nollyflix till is looking fat this week.', 'See money! Drinks are on you.'],
  ['We should open something together.', 'Count me in. I’ll put money down.'],
  ['This Lagos traffic ehn.', 'Third Mainland at night is a movie sha.'],
  ['Who are you wearing tonight?', 'Ankara from Balogun, obviously.'],
];

export const IDLE_LINES = [
  'Abeg, no bumps. I just did my hair.',
  'Who’s paying for the next round?',
  'Driver, no rush o. We’re enjoying.',
  'You see that billboard? I want ads for our company.',
  'Can we stop for suya after?',
];

export const BRANCHES = ['Lekki', 'Yaba', 'Ikeja', 'Surulere', 'Ajah'];

export const COMPANY_KINDS = [
  { kind: 'Restaurant', emoji: '🍲' },
  { kind: 'Fashion house', emoji: '👗' },
  { kind: 'Tech startup', emoji: '💻' },
  { kind: 'Event company', emoji: '🎉' },
];

/** Other players hanging out at each kind of place, shown with name tags. */
export const CROWDS: Record<SceneKind, string[]> = {
  home: [],
  gym: ['Himhorleh', 'kingdevvy', 'justonerandomguy', 'fati_eko', 'imolegracefundz', 'black_hustler'],
  market: ['holymajor', 'ayamjomi', 'Bolutifey', 'Arigaato', 'Hen_ry002', 'michaelade'],
  club: ['dj_shakara', 'owambe_queen', 'tolu.vibes', 'BigManBayo', 'ada_lekki', 'emeka_fresh'],
  hub: ['codewithkemi', 'dami_builds', 'yaba_hustle', 'seyi.dev', 'pm_nneka'],
  suya: ['mallam_sule', 'suya_lover', 'ope.eats', 'sandra_k'],
  beach: ['beachboy_ola', 'tamuno.t', 'zainab_waves', 'kola_kicks', 'adaeze'],
  office: ['nolly_crew1', 'director_femi', 'grip_tunde'],
};
