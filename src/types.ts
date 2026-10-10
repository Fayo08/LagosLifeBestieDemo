export type NeedKey = 'hunger' | 'energy' | 'fun' | 'social' | 'hygiene' | 'bladder';
export type Needs = Record<NeedKey, number>;

export type PlaceId = 'lekki' | 'yaba' | 'surulere' | 'balogun' | 'ikoyi' | 'vi' | 'banana' | 'eko';
export type CompanyId = 'nollyflix' | 'lynqit' | 'xcode';
export type ModeId = 'trek' | 'keke' | 'danfo' | 'okada' | 'cab' | 'driver' | 'bcar';
export type Tab = 'bestie' | 'company' | 'map' | 'code';

export interface Activity {
  label: string;
  fx: Partial<Needs>;
  cost?: number;
  /** Doing this activity raises the value of one of your companies. */
  co?: CompanyId;
  value?: number;
}

export interface Place {
  name: string;
  area: string;
  emo: string;
  /** Position on the 340×236 map. */
  x: number;
  y: number;
  blurb: string;
  acts: Activity[];
}

export interface Mode {
  id: ModeId;
  name: string;
  e: string;
  price: number;
  /** 'seat' charges every rider, 'car' charges once per vehicle. */
  per: 'seat' | 'car';
  /** Travel-time multiplier against a standard car. */
  mult: number;
  /** Only offered when riding with your bestie (their own car). */
  bestie?: boolean;
}

export interface Person {
  id: string;
  initials: string;
  color: string;
  cap?: boolean;
}

export interface Player extends Person {
  cash: number;
  pos: PlaceId;
}

export interface Friend extends Player {
  score: number;
  home: PlaceId;
  mood: string;
}

export interface Bestie {
  id: string;
  since: number;
  level: number;
  xp: number;
  hangouts: number;
  earned: number;
}

/** Ownership in basis points. All owners of a company sum to 10_000. */
export interface Ownership {
  id: string;
  bps: number;
}

export type Vote = 'yes' | 'no' | '—' | null;

export interface Proposal {
  title: string;
  kind: 'branch' | 'hire';
  cost: number;
  name: string | null;
  rule: 'needs both' | 'majority';
  votes: Record<string, Vote>;
  status: 'open' | 'passed' | 'rejected';
  note: string;
}

export interface Company {
  id: CompanyId;
  name: string;
  kind: string;
  rating: number;
  value: number;
  till: number;
  last: number;
  owners: Ownership[];
  branches: string[];
  staff: number;
  staffMax: number;
  proposals: Proposal[];
}

export interface Hangout {
  loc: PlaceId;
  mode: ModeId;
  state: 'invited' | 'riding' | 'arrived';
  together: boolean;
  done: number[];
}

export interface FeedItem {
  t: string;
  text: string;
}

export interface GameState {
  minutes: number;
  day: number;
  tab: Tab;
  me: Player;
  friends: Friend[];
  bestie: Bestie | null;
  pending: string | null;
  confirmEnd: boolean;
  offerPending: boolean;
  needs: Needs;
  companies: Company[];
  selCo: CompanyId;
  stake: number;
  sel: PlaceId | null;
  hangout: Hangout | null;
  mode: ModeId;
  withBf: boolean;
  feed: FeedItem[];
  /** Last drawn map position of each avatar, so moves can animate. */
  disp: Record<string, { x: number; y: number }> | null;
}
