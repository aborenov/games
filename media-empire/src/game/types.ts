export type Channel = 'street' | 'kiosk' | 'subscription';
export type AdPlan = 'standard' | 'local' | 'exclusive';
export type BuildingId = 'newsroom' | 'bank' | 'press' | 'market' | 'lot';
export type Sheet = 'editor' | 'case' | 'building' | 'archive' | 'settings' | 'report' | 'ending' | 'events' | 'city-plan' | 'place' | null;
export type BuildStatus = 'locked' | 'building' | 'open';
export interface Rival {
  id: string; name: string; price: number; printed: number; lastSales: number;
  trust: number; cash: number; active: boolean; action: string;
}
export interface RivalReport {
  name: string; sales: number; price: number; nextPrice: number; profit: number; active: boolean; action: string;
}
export interface District {
  id: string; name: string; households: number; demand: number; sold: number;
  renewals: number; rivals: { id: string; name: string; sold: number }[];
}
export interface HeadlineEdit {
  title: string; week: number; caseId: string; verified: boolean; settleTrust: boolean;
}
export interface Issue {
  week: number; price: number; printed: number; sold: number; demand: number;
  ticket: number; adRevenue: number; editorCost: number; printCost: number;
  overhead: number; interest: number; distribution: number; profit: number;
  cash: number; trustBefore: number; trustAfter: number; lead: number;
  selected: number[]; stories: string[]; notes: string[]; rank: number;
  channel: Channel; adPlan: AdPlan; forecastProfit: number;
  subscribers: number; districts: District[]; competitors: RivalReport[];
  dispatch: { id: string; verified: boolean } | null;
}
export interface CaseRecord {
  assigned: boolean; arrived: boolean; witness: boolean; evidence: boolean;
  prepared: boolean; published: boolean;
}
export interface CaseDefinition {
  id: string; week: number; title: string; headline: string; place: string;
  intro: string; witness: string; evidence: string; art: 'fire' | 'city';
}
export type NotificationAction = 'case' | 'editor' | 'bank' | 'press' | 'lot' | 'paper' | 'report' | 'ending';
export interface GameNotification {
  id: string; week: number; title: string; body: string;
  tone: 'urgent' | 'good' | 'info'; action: NotificationAction;
  caseId?: string; dismissed: boolean;
}
export interface CityState {
  press: { status: BuildStatus; finishWeek: number | null };
  kiosk: { status: BuildStatus; finishWeek: number | null; landOwned: boolean };
  bankClosedUntil: number | null;
}
export interface Settings { sound: boolean; motion: boolean; haptics: boolean }
export interface GameState {
  format: 'media-empire-mobile'; version: 1; revision: number;
  week: number; cash: number; loan: number; trust: number; price: number; printed: number;
  selected: number[]; lead: number; readers: number; subscribers: number;
  channel: Channel; adPlan: AdPlan; investigation: 'publish' | 'hold' | null;
  headlineEdit: HeadlineEdit | null; rivals: Rival[]; history: Issue[];
  city: CityState; cases: Record<string, CaseRecord>;
  reporter: { activeCase: string | null; readyAt: number | null; actionsLeft: number };
  notifications: GameNotification[]; settings: Settings;
  status: 'playing' | 'complete' | 'bankrupt';
}
export interface Forecast {
  sold: number; demand: number; estimated: number; prepay: number; expenses: number;
  ticket: number; adRevenue: number; editorCost: number; printCost: number;
  overhead: number; interest: number; distribution: number; trustDelta: number;
  nextSubscribers: number; rank: number; rivalSales: number[]; rivalAds: number[];
  districts: District[]; channelId: Channel; adId: AdPlan; hot: boolean;
  verified: boolean; reportingTrust: number; lostAd: number; renewals: number;
  current: { title: string; text: string; topics: number[]; paper: number };
}
export interface WorldEffects {
  printFactor: number; overheadFactor: number; reachFactor: number; adFactor: number;
}
export interface PressEngine {
  normalize(state: GameState): GameState;
  forecast(state: GameState, options: { baseCosts: number[]; trustPoints: number[]; world: WorldEffects; settled: boolean }): Forecast;
  rivalMove(rival: Rival, index: number, week: number, sales: number, ad: number, market: Forecast): RivalReport;
  bulletin(week: number): Forecast['current'];
}
