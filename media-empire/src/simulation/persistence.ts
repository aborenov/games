import { OFFERS, REPORT_OPTIONS, UPGRADES } from "./content";
import { CAMPAIGN_GOAL, initialGame } from "./model";
import type { Edition, GameState, Story } from "./types";

export const SAVE_KEY = "first-page-v2";
export const BACKUP_KEY = SAVE_KEY + "-backup";
export const LEGACY_KEY = "media-empire-mobile-v1";
const places = [
  "newsroom",
  "factory",
  "hall",
  "market",
  "station",
  "harbour",
  "tram",
  "bank",
  "press",
  "kiosk",
  "park",
];
const effects = [
  "factory-close",
  "factory-open",
  "council-expose",
  "harbour-restrict",
  "harbour-reopen",
];
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const number = (v: unknown, min = 0, max = 1e9): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const integer = (v: unknown, min = 0, max = 1e9): v is number =>
  number(v, min, max) && Number.isInteger(v);
const text = (v: unknown, max = 4000): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const enumValue = (v: unknown, values: readonly string[]): v is string =>
  typeof v === "string" && values.includes(v);
const near = (a: number, b: number) => Math.abs(a - b) < 0.005;
const amount = (v: unknown, min = 0) =>
  number(v, min) && near(v, Math.round(v * 100) / 100);
const list = (v: unknown, max: number): v is unknown[] =>
  Array.isArray(v) && v.length <= max;
const unique = (items: unknown[], key: string) =>
  new Set(items.map((v) => (v as Record<string, unknown>)[key])).size ===
  items.length;

function storyValid(value: unknown, day: number): value is Story {
  if (
    !object(value) ||
    !text(value.id, 120) ||
    value.id !== value.leadId ||
    !value.id.startsWith(day + "-") ||
    !enumValue(value.placeId, places) ||
    !enumValue(value.topic, [
      "industry",
      "politics",
      "city",
      "trade",
      "culture",
    ]) ||
    !text(value.title, 300) ||
    !text(value.body, 5000) ||
    typeof value.verified !== "boolean" ||
    typeof value.critical !== "boolean" ||
    value.quality !== (value.verified ? 3 : 1) ||
    value.cost !==
      (value.verified
        ? REPORT_OPTIONS.verified.cost
        : REPORT_OPTIONS.brief.cost)
  )
    return false;
  return (
    value.effect === undefined ||
    (value.verified && enumValue(value.effect, effects))
  );
}
function editionValid(value: unknown, day: number): value is Edition {
  if (
    !object(value) ||
    value.day !== day ||
    !text(value.title, 300) ||
    !list(value.stories, 3) ||
    !value.stories.length ||
    !value.stories.every((s) => storyValid(s, day)) ||
    !unique(value.stories, "id") ||
    !value.stories.some(
      (s) =>
        (s as Story).id === value.frontPage &&
        (s as Story).title === value.title,
    ) ||
    !integer(value.printed, 1000, 8000) ||
    value.printed % 500 !== 0 ||
    !integer(value.sold, 0, value.printed) ||
    !number(value.price, 0.08, 0.24) ||
    !near(value.price, Math.round(value.price * 100) / 100) ||
    ![
      "revenue",
      "adRevenue",
      "printCost",
      "reportingCost",
      "operatingCost",
      "deliveryCost",
      "cashBefore",
      "cashAfter",
    ].every((k) => amount(value[k])) ||
    !amount(value.profit, -1e9) ||
    !integer(value.trustBefore, 0, 99) ||
    !integer(value.trustAfter, 0, 99) ||
    !integer(value.readersBefore, 0, 1e7) ||
    !integer(value.readersAfter, 0, 1e7) ||
    !list(value.notes, 30) ||
    !value.notes.every((n) => text(n, 2000)) ||
    !list(value.contractEvents, 10) ||
    !value.contractEvents.every((n) => text(n, 2000))
  )
    return false;
  const e = value as unknown as Edition;
  return (
    near(
      e.reportingCost,
      e.stories.reduce((sum, s) => sum + s.cost, 0),
    ) &&
    near(e.revenue, e.sold * e.price) &&
    near(
      e.profit,
      e.revenue +
        e.adRevenue -
        e.printCost -
        e.reportingCost -
        e.operatingCost -
        e.deliveryCost,
    ) &&
    near(e.cashAfter - e.cashBefore, e.profit)
  );
}

function validState(value: unknown): value is GameState {
  if (
    !object(value) ||
    value.format !== "first-page" ||
    value.version !== 2 ||
    !text(value.campaignId, 120) ||
    !integer(value.revision) ||
    !integer(value.day, 1, 13) ||
    !amount(value.cash) ||
    !integer(value.trust, 0, 99) ||
    !integer(value.readers, 0, 1e7) ||
    !integer(value.hoursLeft, 0, 10) ||
    !integer(value.printed, 1000, 8000) ||
    value.printed % 500 !== 0 ||
    !number(value.price, 0.08, 0.24) ||
    !near(value.price, Math.round(value.price * 100) / 100) ||
    !enumValue(value.delivery, ["street", "kiosk", "subscription"]) ||
    !list(value.stories, 3) ||
    !value.stories.every((s) => storyValid(s, value.day as number)) ||
    !unique(value.stories, "id") ||
    !(value.frontPage === null
      ? value.stories.length === 0
      : value.stories.some((s) => (s as Story).id === value.frontPage)) ||
    !list(value.contracts, OFFERS.length) ||
    !object(value.buildings) ||
    !object(value.factions) ||
    !object(value.world) ||
    !list(value.history, 12) ||
    value.history.length !== value.day - 1 ||
    !value.history.every((e, i) => editionValid(e, i + 1)) ||
    !amount(value.reportingSpent) ||
    !amount(value.editionStartCash) ||
    !object(value.settings) ||
    !enumValue(value.settings.quality, ["auto", "high", "low"]) ||
    typeof value.settings.sound !== "boolean" ||
    typeof value.settings.motion !== "boolean" ||
    !enumValue(value.status, ["playing", "won", "ended", "bankrupt"]) ||
    !list(value.notices, 30) ||
    !value.notices.every((n) => text(n, 2000))
  )
    return false;
  const s = value as unknown as GameState;
  if (
    !["workers", "council", "merchants"].every((k) =>
      integer(s.factions[k as keyof typeof s.factions], 0, 100),
    ) ||
    Object.keys(s.factions).length !== 3 ||
    !enumValue(s.world.factory, ["fire", "closed", "open"]) ||
    !enumValue(s.world.harbour, ["open", "restricted"])
  )
    return false;
  if (
    (s.day === 13) !== ["won", "ended"].includes(s.status) ||
    (s.status === "playing" && s.day > 12)
  )
    return false;
  if (
    s.dispatch !== null &&
    (!object(s.dispatch) ||
      !integer(s.dispatch.id, 1) ||
      !enumValue(s.dispatch.placeId, places))
  )
    return false;
  for (const upgrade of UPGRADES) {
    const b = s.buildings[upgrade.id];
    if (!object(b) || !enumValue(b.status, ["locked", "building", "open"]))
      return false;
    if (b.status === "locked") {
      if (b.readyDay !== null) return false;
    } else if (
      !integer(b.readyDay, 2, 12) ||
      (b.status === "building" && b.readyDay <= s.day) ||
      (b.status === "open" && b.readyDay > s.day)
    )
      return false;
  }
  if (
    Object.keys(s.buildings).length !== 3 ||
    (s.delivery === "kiosk" && s.buildings.kiosk.status !== "open")
  )
    return false;
  if (
    s.hoursLeft !==
      (s.buildings.desk.status === "open" ? 10 : 8) -
        s.stories.reduce((sum, story) => sum + (story.verified ? 4 : 2), 0) ||
    !near(
      s.reportingSpent,
      s.stories.reduce((sum, story) => sum + story.cost, 0),
    )
  )
    return false;
  if (!unique(s.contracts, "id")) return false;
  for (const c of s.contracts) {
    if (!object(c)) return false;
    const offer = OFFERS.find((o) => o.id === c.id);
    if (!offer) return false;
    if (
      !Object.entries(offer).every(([k, v]) => c[k as keyof typeof c] === v) ||
      !integer(c.startedDay, offer.unlockDay, s.day) ||
      c.startedDay + offer.duration - 1 > 12 ||
      !integer(c.remaining, 0, offer.duration) ||
      !integer(c.progress, 0, 1e8) ||
      !enumValue(c.status, ["active", "completed", "failed"])
    )
      return false;
    if (
      (c.status === "active" &&
        (c.remaining !== offer.duration - (s.day - c.startedDay) ||
          c.remaining === 0)) ||
      (c.status !== "active" && c.remaining !== 0) ||
      (c.status === "completed" && c.progress < c.target)
    )
      return false;
  }
  const purchaseCost =
    s.contracts
      .filter((c) => c.startedDay === s.day)
      .reduce((sum, c) => sum + c.cost, 0) +
    UPGRADES.reduce(
      (sum, u) =>
        sum + (s.buildings[u.id].readyDay === s.day + u.duration ? u.cost : 0),
      0,
    );
  if (!near(s.editionStartCash - s.cash, s.reportingSpent + purchaseCost))
    return false;
  let expectedFactory: GameState["world"]["factory"] = "fire",
    expectedHarbour: GameState["world"]["harbour"] = "open";
  let before = 1850,
    trust = 48,
    readers = 2400;
  for (const e of s.history) {
    if (
      !near(e.cashBefore, before) ||
      e.trustBefore !== trust ||
      e.readersBefore !== readers
    )
      return false;
    before = e.cashAfter;
    trust = e.trustAfter;
    readers = e.readersAfter;
    for (const story of e.stories) {
      if (story.effect === "factory-close") expectedFactory = "closed";
      if (story.effect === "factory-open") expectedFactory = "open";
      if (story.effect === "harbour-restrict") expectedHarbour = "restricted";
      if (story.effect === "harbour-reopen") expectedHarbour = "open";
    }
  }
  if (
    !near(s.editionStartCash, before) ||
    s.trust !== trust ||
    s.readers !== readers ||
    s.world.factory !== expectedFactory ||
    s.world.harbour !== expectedHarbour
  )
    return false;
  if (s.day === 13) {
    const verified = s.history.reduce(
      (sum, e) => sum + e.stories.filter((story) => story.verified).length,
      0,
    );
    const won =
      s.trust >= CAMPAIGN_GOAL.trust &&
      s.readers >= CAMPAIGN_GOAL.readers &&
      verified >= CAMPAIGN_GOAL.verified;
    if ((s.status === "won") !== won) return false;
  }
  return true;
}

export function encodeSave(state: GameState): string {
  if (!validState(state))
    throw Error("Состояние редакции повреждено; сохранение не записано.");
  return JSON.stringify(state, null, 2);
}
export function decodeSave(raw: string): GameState {
  if (typeof raw !== "string" || raw.length > 2_000_000)
    throw Error("Файл сохранения слишком большой.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw Error("Файл не содержит корректный JSON.");
  }
  if (!validState(value))
    throw Error("Это не совместимая партия «Первая полоса» версии 2.");
  return value;
}

export function loadGame(): {
  state: GameState;
  error?: string;
  recovery?: string;
  legacy?: string;
} {
  let raw: string | null = null,
    legacy: string | null = null;
  try {
    legacy = localStorage.getItem(LEGACY_KEY);
    raw = localStorage.getItem(SAVE_KEY);
    if (raw !== null) {
      try {
        return {
          state: decodeSave(raw),
          ...(legacy !== null ? { legacy } : {}),
        };
      } catch {
        return {
          state: initialGame(),
          error:
            "Сохранение не открылось. Исходные данные сохранены; скачайте их перед заменой партии.",
          recovery: raw,
          ...(legacy !== null ? { legacy } : {}),
        };
      }
    }
    return { state: initialGame(), ...(legacy !== null ? { legacy } : {}) };
  } catch {
    return {
      state: initialGame(),
      error: "Хранилище недоступно. Используйте экспорт партии.",
      ...(raw !== null ? { recovery: raw } : {}),
      ...(legacy !== null ? { legacy } : {}),
    };
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value))
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
export function saveGame(
  state: GameState,
  options: {
    replace?: boolean;
    expectedCampaignId?: string;
    expectedRevision?: number;
    expectedRaw?: string | null;
  } = {},
): boolean {
  try {
    const encoded = encodeSave(state),
      current = localStorage.getItem(SAVE_KEY);
    if (
      Object.hasOwn(options, "expectedRaw") &&
      current !== options.expectedRaw
    )
      return false;
    if (current !== null) {
      let saved: GameState | undefined;
      try {
        saved = decodeSave(current);
      } catch {
        if (!options.replace) return false;
      }
      if (
        options.expectedCampaignId &&
        saved?.campaignId !== options.expectedCampaignId
      )
        return false;
      if (
        options.expectedRevision !== undefined &&
        saved?.revision !== options.expectedRevision
      )
        return false;
      if (!options.replace) {
        if (
          !saved ||
          saved.campaignId !== state.campaignId ||
          saved.revision > state.revision
        )
          return false;
        if (
          saved.revision === state.revision &&
          JSON.stringify(canonical(saved)) !== JSON.stringify(canonical(state))
        )
          return false;
      }
      if (options.replace) localStorage.setItem(BACKUP_KEY, current);
    } else if (
      options.expectedCampaignId &&
      options.expectedCampaignId !== state.campaignId
    )
      return false;
    localStorage.setItem(SAVE_KEY, encoded);
    return true;
  } catch {
    return false;
  }
}
