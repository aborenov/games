export type PlaceId =
  | "newsroom"
  | "factory"
  | "hall"
  | "market"
  | "station"
  | "harbour"
  | "tram"
  | "bank"
  | "press"
  | "kiosk"
  | "park";
export type Faction = "workers" | "council" | "merchants";
export type Topic = "industry" | "politics" | "city" | "trade" | "culture";
export type BuildStatus = "locked" | "building" | "open";
export type UpgradeId = "kiosk" | "press" | "desk";
export type Delivery = "street" | "kiosk" | "subscription";
export type Depth = "brief" | "verified";
export interface Lead {
  id: string;
  placeId: PlaceId;
  topic: Topic;
  title: string;
  summary: string;
  stakes: string;
  briefTitle: string;
  verifiedTitle: string;
  briefBody: string;
  verifiedBody: string;
  critical?: boolean;
  effect?:
    | "factory-close"
    | "factory-open"
    | "council-expose"
    | "harbour-restrict"
    | "harbour-reopen";
}
export interface Story {
  id: string;
  leadId: string;
  placeId: PlaceId;
  topic: Topic;
  title: string;
  body: string;
  verified: boolean;
  quality: number;
  cost: number;
  effect?: Lead["effect"];
  critical: boolean;
}
export interface ContractOffer {
  id: string;
  title: string;
  client: string;
  placeId: PlaceId;
  kind: "tram" | "river" | "sponsor";
  cost: number;
  reward: number;
  duration: number;
  target: number;
  unlockDay: number;
  description: string;
}
export interface Contract extends ContractOffer {
  startedDay: number;
  remaining: number;
  progress: number;
  status: "active" | "completed" | "failed";
}
export interface Upgrade {
  id: UpgradeId;
  title: string;
  cost: number;
  duration: number;
  description: string;
}
export interface Edition {
  day: number;
  title: string;
  stories: Story[];
  frontPage: string;
  printed: number;
  sold: number;
  price: number;
  revenue: number;
  adRevenue: number;
  printCost: number;
  reportingCost: number;
  operatingCost: number;
  deliveryCost: number;
  profit: number;
  cashBefore: number;
  cashAfter: number;
  trustBefore: number;
  trustAfter: number;
  readersBefore: number;
  readersAfter: number;
  notes: string[];
  contractEvents: string[];
}
export interface Forecast {
  sold: number;
  revenue: number;
  adRevenue: number;
  printCost: number;
  operatingCost: number;
  deliveryCost: number;
  reportingCost: number;
  totalCost: number;
  profit: number;
  prepay: number;
  reach: number;
  warnings: string[];
}
export interface GameState {
  format: "first-page";
  version: 2;
  campaignId: string;
  revision: number;
  day: number;
  cash: number;
  trust: number;
  readers: number;
  hoursLeft: number;
  printed: number;
  price: number;
  delivery: Delivery;
  stories: Story[];
  frontPage: string | null;
  contracts: Contract[];
  buildings: Record<
    UpgradeId,
    { status: BuildStatus; readyDay: number | null }
  >;
  factions: Record<Faction, number>;
  world: {
    factory: "fire" | "closed" | "open";
    harbour: "open" | "restricted";
  };
  history: Edition[];
  reportingSpent: number;
  editionStartCash: number;
  dispatch: { id: number; placeId: PlaceId } | null;
  settings: {
    sound: boolean;
    motion: boolean;
    quality: "auto" | "high" | "low";
  };
  status: "playing" | "won" | "ended" | "bankrupt";
  notices: string[];
}
export type Action =
  | { type: "report"; leadId: string; depth: Depth }
  | { type: "front-page"; id: string }
  | { type: "print-run"; value: number }
  | { type: "price"; value: number }
  | { type: "delivery"; value: Delivery }
  | { type: "contract"; id: string }
  | { type: "upgrade"; id: UpgradeId }
  | { type: "publish" }
  | {
      type: "settings";
      key: keyof GameState["settings"];
      value: boolean | "auto" | "high" | "low";
    };
export interface ActionResult {
  state: GameState;
  error?: string;
  edition?: Edition;
}
