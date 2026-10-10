import type { Place, PlaceId } from '../types.ts';

export const PLACES: Record<PlaceId, Place> = {
  home: {
    name: 'Your house', area: 'Lekki Phase 1', emo: '🏠', scene: 'home', x: 274, y: 168,
    status: 'Mallam Musa is at the gate.',
    acts: [
      { label: 'Cook jollof', emoji: '🍛', fx: { hunger: 22, fun: 6, social: 5, energy: -4 } },
      { label: 'Binge Nollyflix', emoji: '📺', fx: { fun: 14, social: 4, energy: -3 } },
      { label: 'Nap', emoji: '😴', fx: { energy: 25, fun: -2 } },
    ],
  },
  ifitness: {
    name: 'i-Fitness', area: 'Ikoyi', emo: '🏋️', scene: 'gym', x: 186, y: 126,
    status: 'Leg day. Every day.',
    acts: [
      { label: 'Weights', emoji: '🏋️', fx: { energy: -14, fun: 6, hygiene: -10 } },
      { label: 'Treadmills', emoji: '🏃🏾', fx: { energy: -12, fun: 4, hygiene: -8 } },
      { label: 'Yoga studio', emoji: '🧘🏾', fx: { energy: 6, fun: 8, social: 4 } },
      { label: 'Protein shake', emoji: '🥤', fx: { hunger: 12 }, cost: 3_500 },
    ],
  },
  balogun: {
    name: 'Balogun Market', area: 'Lagos Island', emo: '🧺', scene: 'market', x: 118, y: 132,
    status: 'A truck is offloading at the gate.',
    acts: [
      { label: 'Foodstuff stall', emoji: '🍅', fx: { hunger: 10, social: 4 }, cost: 12_000 },
      { label: "Alhaji's fabrics", emoji: '🧵', fx: { fun: 12, social: 8 }, cost: 85_000 },
      { label: 'Wholesale', emoji: '📦', fx: { energy: -8, social: 6 }, cost: 240_000 },
    ],
  },
  quilox: {
    name: 'Quilox', area: 'Victoria Island', emo: '🪩', scene: 'club', x: 168, y: 172,
    status: 'The DJ just dropped the remix.',
    acts: [
      { label: 'VIP table', emoji: '🍾', fx: { fun: 20, social: 12, bladder: -12 }, cost: 450_000 },
      { label: 'Dance floor', emoji: '💃🏾', fx: { fun: 18, social: 10, energy: -14, hygiene: -8 } },
      { label: 'Spray money', emoji: '💸', fx: { fun: 16, social: 14 }, cost: 500_000 },
    ],
  },
  yabahub: {
    name: 'Yaba Tech Hub', area: 'Yaba', emo: '💻', scene: 'hub', x: 118, y: 48,
    status: 'Demo day starts at 4.',
    acts: [
      { label: 'Hack on LynqitAI', emoji: '⌨️', fx: { energy: -12, fun: 4 }, co: 'lynqit', value: 400_000 },
      { label: 'Pitch night', emoji: '🎤', fx: { social: 12, energy: -6 } },
      { label: 'Amala break', emoji: '🍲', fx: { hunger: 25, bladder: -8 }, cost: 4_500 },
    ],
  },
  suya: {
    name: "Mallam Sule's Suya", area: 'Surulere', emo: '🍢', scene: 'suya', x: 52, y: 76,
    status: 'Fresh batch on the grill.',
    acts: [
      { label: 'Beef suya', emoji: '🍢', fx: { hunger: 18, fun: 6, social: 6 }, cost: 6_000 },
      { label: 'Kilishi', emoji: '🥩', fx: { hunger: 10, fun: 4 }, cost: 3_000 },
      { label: 'Zobo', emoji: '🥤', fx: { hunger: 4, fun: 3, bladder: -6 }, cost: 800 },
    ],
  },
  landmark: {
    name: 'Landmark Beach', area: 'Oniru', emo: '🏖️', scene: 'beach', x: 214, y: 196,
    status: 'Tide is out. Perfect for volleyball.',
    acts: [
      { label: 'Beach volleyball', emoji: '🏐', fx: { fun: 16, social: 10, energy: -12, hygiene: -6 } },
      { label: 'Horse ride', emoji: '🐎', fx: { fun: 14, energy: -4 }, cost: 10_000 },
      { label: 'Coconut water', emoji: '🥥', fx: { hunger: 6, energy: 4 }, cost: 1_500 },
    ],
  },
  banana: {
    name: 'Nollyflix Studios', area: 'Banana Island', emo: '🎬', scene: 'office', x: 232, y: 94,
    status: 'Shooting season 2.',
    acts: [
      { label: 'Pep talk the crew', emoji: '📣', fx: { social: 6, energy: -6 }, co: 'nollyflix', value: 600_000 },
      { label: 'Watch dailies', emoji: '🎞️', fx: { fun: 10 } },
      { label: 'Pool day', emoji: '🏊🏾', fx: { fun: 16, hygiene: 10, energy: 6 } },
    ],
  },
};

/** Map y below which a place is on the mainland (north of the lagoon). */
export const LAGOON_Y = 100;

export const placeLabel = (id: PlaceId): string => `${PLACES[id].name} · ${PLACES[id].area}`;
