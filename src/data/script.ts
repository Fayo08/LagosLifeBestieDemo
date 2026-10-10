import type { NeedKey } from '../types.ts';

export const NEEDS: { key: NeedKey; label: string; color: string; emoji: string }[] = [
  { key: 'hunger', label: 'Hunger', color: 'var(--amber)', emoji: '🍛' },
  { key: 'energy', label: 'Energy', color: 'var(--blue)', emoji: '⚡' },
  { key: 'fun', label: 'Fun', color: 'var(--yellow)', emoji: '🎉' },
  { key: 'social', label: 'Social', color: 'var(--pink)', emoji: '💬' },
  { key: 'hygiene', label: 'Hygiene', color: 'var(--teal)', emoji: '🫧' },
  { key: 'bladder', label: 'Bladder', color: 'var(--purple)', emoji: '🚽' },
];

export const PERKS = [
  { lv: 1, title: 'Ride together', text: 'Share a car, keke or danfo. Fun and Social gains are 1.5×.' },
  { lv: 1, title: 'Co-own companies', text: 'Sell your bestie a stake. Profits split by ownership.' },
  { lv: 2, title: 'Split the cab', text: 'Cab fares are shared when you ride together.' },
  { lv: 3, title: 'Spare house key', text: "Walk into each other's house without an invite." },
];

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
  ['I want to open a branch in Yaba.', 'Count me in. I’ll put money down.'],
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
