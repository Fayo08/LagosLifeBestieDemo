export type NeedKey = 'hunger' | 'energy' | 'fun' | 'social' | 'hygiene' | 'bladder';
export type Needs = Record<NeedKey, number>;

export type PlaceId = 'home' | 'ifitness' | 'balogun' | 'quilox' | 'yabahub' | 'suya' | 'landmark' | 'banana';
export type SceneKind = 'home' | 'gym' | 'market' | 'club' | 'hub' | 'suya' | 'beach' | 'office';
export type ModeId = 'trek' | 'keke' | 'danfo' | 'okada' | 'cab' | 'driver' | 'fcar';
export type Tab = 'here' | 'map' | 'phone' | 'company' | 'code';

export interface Activity {
  label: string;
  emoji: string;
  fx: Partial<Needs>;
  cost?: number;
  /** Doing this activity raises the value of one of your companies. */
  co?: string;
  value?: number;
}

export interface Place {
  /** The venue's own name, e.g. "i-Fitness". */
  name: string;
  /** Neighbourhood, e.g. "Ikoyi". */
  area: string;
  emo: string;
  /** One-line vibe shown under the name, like the game's place card. */
  status: string;
  scene: SceneKind;
  /** Position on the 340×236 map. */
  x: number;
  y: number;
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
  /** Only offered when a friend is coming (their own car). */
  friendCar?: boolean;
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

export interface ChatMsg {
  from: 'me' | 'them' | 'system';
  text: string;
  day: number;
}

export interface Friend extends Player {
  home: PlaceId;
  mood: string;
  /** Consecutive in-game days you've chatted. */
  streak: number;
  /** The in-game day of your last message to them. */
  lastChatDay: number;
  /** 0–100. Built by chatting daily, going places and doing things together. */
  trust: number;
  thread: ChatMsg[];
  /** Messages from them you haven't opened yet. */
  unread: number;
}

/** Your bestie: the first friend you keep a 3-day streak with. */
export interface Bestie {
  id: string;
  since: number;
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
  id: string;
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
  /** Friend you're out with, or null when alone. */
  with: string | null;
  done: number[];
}

export interface StartupDraft {
  name: string;
  kind: string;
  mine: number;
  theirs: number;
  pending: boolean;
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
  /** Open chat thread, or null for the chat list. */
  chatWith: string | null;
  confirmEnd: boolean;
  offerPending: boolean;
  needs: Needs;
  companies: Company[];
  selCo: string;
  stake: number;
  startup: StartupDraft;
  sel: PlaceId | null;
  hangout: Hangout | null;
  mode: ModeId;
  /** Friend picked to come along on the next trip. */
  companion: string | null;
  feed: FeedItem[];
  /** Last drawn map position of each avatar, so moves can animate. */
  disp: Record<string, { x: number; y: number }> | null;
}
