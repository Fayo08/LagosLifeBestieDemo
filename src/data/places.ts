import type { Place, PlaceId } from '../types.ts';

export const PLACES: Record<PlaceId, Place> = {
  lekki: {
    name: 'Lekki Phase 1', area: 'Home', emo: '🏠', x: 274, y: 168,
    blurb: 'Your house. Mallam Musa is at the gate.',
    acts: [
      { label: 'Cook jollof together', fx: { hunger: 22, fun: 6, social: 5, energy: -4 } },
      { label: 'Binge Nollyflix originals', fx: { fun: 14, social: 4, energy: -3 } },
    ],
  },
  yaba: {
    name: 'Yaba', area: 'Tech hub', emo: '💻', x: 118, y: 48,
    blurb: 'Co-working spaces and cheap amala.',
    acts: [
      { label: 'Hack on LynqitAI', fx: { energy: -12, fun: 4 }, co: 'lynqit', value: 400_000 },
      { label: 'Amala at the buka', fx: { hunger: 25, social: 3, bladder: -8 }, cost: 4_500 },
    ],
  },
  surulere: {
    name: 'Surulere', area: 'Mainland', emo: '🍢', x: 52, y: 76,
    blurb: 'Suya spots and the National Stadium.',
    acts: [
      { label: 'Late-night suya run', fx: { hunger: 18, fun: 8, social: 6 }, cost: 6_000 },
      { label: 'Five-a-side at the stadium', fx: { fun: 16, social: 8, energy: -18, hygiene: -14 } },
    ],
  },
  balogun: {
    name: 'Balogun Market', area: 'Lagos Island', emo: '🛍️', x: 118, y: 132,
    blurb: 'Everything is negotiable.',
    acts: [
      { label: 'Haggle for ankara', fx: { fun: 10, social: 6, energy: -6 }, cost: 85_000 },
      { label: 'Buy matching outfits', fx: { fun: 14, social: 10 }, cost: 240_000 },
    ],
  },
  ikoyi: {
    name: 'Ikoyi', area: 'Nollyflix HQ', emo: '🎬', x: 186, y: 126,
    blurb: 'Your shop runs here 24/7.',
    acts: [
      { label: 'Pep talk the staff', fx: { social: 6, energy: -6 }, co: 'nollyflix', value: 600_000 },
      { label: 'Brunch at a garden café', fx: { hunger: 20, fun: 8, social: 6 }, cost: 60_000 },
    ],
  },
  vi: {
    name: 'Victoria Island', area: 'Nightlife', emo: '🪩', x: 168, y: 172,
    blurb: 'Rooftop lounges until 4 AM.',
    acts: [
      { label: 'Owambe on a rooftop', fx: { fun: 24, social: 14, energy: -14, bladder: -12 }, cost: 150_000 },
      { label: 'Spray money on the dance floor', fx: { fun: 18, social: 10 }, cost: 500_000 },
    ],
  },
  banana: {
    name: 'Banana Island', area: 'Nollyflix branch', emo: '🏝️', x: 232, y: 94,
    blurb: 'Quiet, gated, expensive.',
    acts: [
      { label: 'Inspect the branch', fx: { energy: -4 }, co: 'nollyflix', value: 300_000 },
      { label: 'Pool day', fx: { fun: 16, hygiene: 10, energy: 6 } },
    ],
  },
  eko: {
    name: 'Eko Atlantic', area: 'Waterfront', emo: '🏖️', x: 110, y: 194,
    blurb: 'A new city on reclaimed sand.',
    acts: [
      { label: 'Sunset walk on the beach', fx: { fun: 12, social: 8, energy: -4 } },
      { label: 'Jet-ski rental', fx: { fun: 22, energy: -10, hygiene: -6 }, cost: 120_000 },
    ],
  },
};

/** Map y below which a place is on the mainland (north of the lagoon). */
export const LAGOON_Y = 100;
