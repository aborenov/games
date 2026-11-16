import { dailyLeads, OFFERS, REPORT_OPTIONS, UPGRADES } from "./content";
import type {
  Action,
  ActionResult,
  Contract,
  Edition,
  Faction,
  Forecast,
  GameState,
  Lead,
  Story,
  Topic,
} from "./types";

const money = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const clone = <T>(value: T): T => structuredClone(value);
export const CAMPAIGN_GOAL = {
  editions: 12,
  trust: 70,
  readers: 5000,
  verified: 6,
} as const;

export function initialGame(): GameState {
  const reduced =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const campaignId =
    globalThis.crypto?.randomUUID?.() ??
    `bel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    format: "first-page",
    version: 2,
    campaignId,
    revision: 0,
    day: 1,
    cash: 1850,
    trust: 48,
    readers: 2400,
    hoursLeft: 8,
    printed: 3000,
    price: 0.16,
    delivery: "street",
    stories: [],
    frontPage: null,
    contracts: [],
    buildings: {
      kiosk: { status: "locked", readyDay: null },
      press: { status: "locked", readyDay: null },
      desk: { status: "locked", readyDay: null },
    },
    factions: { workers: 50, council: 50, merchants: 50 },
    world: { factory: "fire", harbour: "open" },
    history: [],
    reportingSpent: 0,
    editionStartCash: 1850,
    dispatch: null,
    settings: { sound: false, motion: !reduced, quality: "auto" },
    status: "playing",
    notices: [
      "На номер — 8 часов. Все три темы проверить не успеть. Выберите, чей голос станет первой полосой.",
    ],
  };
}

export function leadsFor(state: GameState): Lead[] {
  return dailyLeads(state);
}

function worldAfterStories(state: GameState): GameState["world"] {
  const world = { ...state.world };
  for (const story of state.stories) {
    if (!story.verified) continue;
    if (story.effect === "factory-close") world.factory = "closed";
    if (story.effect === "factory-open") world.factory = "open";
    if (story.effect === "harbour-restrict") world.harbour = "restricted";
    if (story.effect === "harbour-reopen") world.harbour = "open";
  }
  return world;
}
const interests: Topic[][] = [
  ["industry", "city"],
  ["city"],
  ["industry", "city"],
  ["politics"],
  ["trade"],
  ["city", "politics"],
  ["city"],
  ["city", "culture"],
  ["industry", "trade"],
  ["culture", "trade"],
  ["politics"],
  ["politics", "culture"],
];
// Paper needs three decimal places; money() is deliberately not used here.
const perCopy = (state: GameState) =>
  (state.day >= 9 ? 0.073 : 0.05) -
  (state.buildings.press.status === "open" ? 0.02 : 0);
const baseOperation = (state: GameState) =>
  175 + state.day * 3 + (state.buildings.desk.status === "open" ? 20 : 0);
const committedCost = (state: GameState) =>
  Math.max(
    0,
    money(state.editionStartCash - state.cash - state.reportingSpent),
  );
const minimumPrepay = (state: GameState) =>
  money(baseOperation(state) + 1000 * perCopy(state));

function passengerFlow(
  world: GameState["world"],
  kind: Contract["kind"],
): number {
  if (kind === "tram")
    return world.factory === "closed"
      ? 650
      : world.factory === "fire"
        ? 1000
        : 1650;
  if (kind === "river") return world.harbour === "restricted" ? 220 : 1100;
  return 0;
}
function settleContracts(
  state: GameState,
  sold: number,
  world: GameState["world"],
): { contracts: Contract[]; reward: number; events: string[] } {
  let reward = 0;
  const events: string[] = [];
  const contracts = state.contracts.map((saved) => {
    if (saved.status !== "active") return { ...saved };
    const c = { ...saved };
    const conflict =
      c.kind === "sponsor" &&
      state.stories.some(
        (story) => story.placeId === "factory" && story.critical,
      );
    if (conflict) {
      c.status = "failed";
      c.remaining = 0;
      events.push(
        `${c.title}: конфликт интересов. Критический материал напечатан; ${c.client} отказался от выплаты ${c.reward} $. Аренда и изготовление объявления уже оплачены.`,
      );
      return c;
    }
    c.progress += sold + passengerFlow(world, c.kind);
    c.remaining -= 1;
    if (c.remaining === 0) {
      c.status = c.progress >= c.target ? "completed" : "failed";
      if (c.status === "completed") {
        reward += c.reward;
        events.push(
          `${c.title}: договор выполнен. ${c.progress.toLocaleString("ru-RU")} контактов, выплачено ${c.reward} $.`,
        );
      } else
        events.push(
          `${c.title}: срок истёк, ${c.progress.toLocaleString("ru-RU")} из ${c.target.toLocaleString("ru-RU")} контактов. Выплаты нет; стартовые расходы не возвращаются.`,
        );
    }
    return c;
  });
  return { contracts, reward, events };
}

export function forecast(state: GameState): Forecast {
  const front = state.stories.find((story) => story.id === state.frontPage);
  const verified = state.stories.filter((story) => story.verified).length;
  const world = worldAfterStories(state),
    topics = new Set(state.stories.map((story) => story.topic));
  const hot =
    !!front && interests[Math.min(state.day - 1, 11)].includes(front.topic);
  const frontFactor = front
    ? 1 +
      (front.verified ? 0.16 : 0.04) +
      (hot ? 0.14 : 0) +
      (front.critical ? 0.03 : 0)
    : 0;
  const channelFactor =
    state.delivery === "kiosk"
      ? 1.18
      : state.delivery === "subscription"
        ? 0.9 +
          Math.min(
            0.3,
            state.history.filter((e) => e.stories.length && e.day > 0).length *
              0.025,
          )
        : 1;
  const relationshipFit =
    1 +
    state.stories.reduce(
      (sum, story) =>
        sum +
        (story.topic === "trade"
          ? state.factions.merchants - 50
          : story.topic === "politics"
            ? state.factions.council - 50
            : state.factions.workers - 50),
      0,
    ) *
      0.0006;
  const strength =
    950 +
    state.readers * 0.55 +
    verified * 670 +
    (state.stories.length - verified) * 260;
  const reach = state.stories.length
    ? Math.max(
        0,
        Math.round(
          strength *
            (0.16 / state.price) ** 1.5 *
            frontFactor *
            channelFactor *
            (0.75 + state.trust * 0.004) *
            (1 + Math.max(0, topics.size - 1) * 0.04) *
            relationshipFit *
            (world.factory === "closed" ? 0.95 : 1) *
            (world.harbour === "restricted" && front?.topic === "trade"
              ? 0.92
              : 1),
        ),
      )
    : 0;
  const capacity =
    state.delivery === "street" && state.day === 2
      ? 2600
      : state.delivery === "street" && state.day === 7
        ? 3200
        : 8000;
  const sold = Math.min(state.printed, reach, capacity);
  const revenue = money(sold * state.price);
  const normalAds = state.stories.length
    ? money(
        sold *
          0.055 *
          (0.65 + state.trust / 100) *
          (1 + Math.max(0, topics.size - 1) * 0.08) +
          (state.buildings.kiosk.status === "open" ? 45 : 0),
      )
    : 0;
  const contracts = settleContracts(state, sold, world);
  const adRevenue = money(normalAds + contracts.reward);
  const printCost = money(state.printed * perCopy(state));
  const deliveryCost =
    state.delivery === "kiosk"
      ? money(30 + sold * 0.008)
      : state.delivery === "subscription"
        ? money(45 + sold * 0.006)
        : 0;
  const operatingCost = money(baseOperation(state) + committedCost(state));
  const totalCost = money(
    printCost + deliveryCost + operatingCost + state.reportingSpent,
  );
  const prepay = money(printCost + deliveryCost + baseOperation(state));
  const warnings: string[] = [];
  if (!state.stories.length)
    warnings.push(
      "Без материалов номера нет: подготовьте хотя бы одну историю.",
    );
  if (sold < state.printed)
    warnings.push(
      `Лишняя печать: ${state.printed - sold} копий. За них тоже нужно заплатить.`,
    );
  if (state.day === 2 && state.delivery === "street")
    warnings.push("Снег: уличная доставка ограничена 2 600 копиями.");
  if (state.day === 7 && state.delivery === "street")
    warnings.push(
      "Паводок перекрыл нижние улицы: уличная доставка ограничена 3 200 копиями. Подписка и свой киоск используют другие маршруты.",
    );
  if (state.day >= 9)
    warnings.push("Бумага подорожала: точный тираж важнее запаса.");
  if (front && !front.verified && front.critical)
    warnings.push("Непроверенное обвинение на первой полосе снизит доверие.");
  if (
    state.contracts.some(
      (c) => c.status === "active" && c.kind === "sponsor",
    ) &&
    state.stories.some((story) => story.placeId === "factory" && story.critical)
  )
    warnings.push(
      "Критическая фабричная история прекратит спонсорский договор.",
    );
  for (const c of contracts.contracts)
    if (
      c.status === "failed" &&
      state.contracts.find((old) => old.id === c.id)?.status === "active"
    )
      warnings.push(`${c.title}: после этого выпуска выплаты не будет.`);
  return {
    sold,
    revenue,
    adRevenue,
    printCost,
    operatingCost,
    deliveryCost,
    reportingCost: state.reportingSpent,
    totalCost,
    profit: money(revenue + adRevenue - totalCost),
    prepay,
    reach,
    warnings,
  };
}

export function publicationBlock(state: GameState): string | null {
  if (state.status !== "playing" || state.day > 12)
    return "Глава завершена. Посмотрите историю редакции.";
  if (!state.stories.length)
    return "Сначала подготовьте материал. Пустой номер не продаётся.";
  if (state.stories.length > 3) return "В номере не больше трёх материалов.";
  if (
    !state.frontPage ||
    !state.stories.some((story) => story.id === state.frontPage)
  )
    return "Выберите первую полосу из подготовленных материалов.";
  if (state.delivery === "kiosk" && state.buildings.kiosk.status !== "open")
    return "Ваш киоск ещё не открыт.";
  const f = forecast(state);
  if (state.cash < f.prepay)
    return `Для печати и доставки не хватает ${money(f.prepay - state.cash)} $. Уменьшите тираж или расходы на доставку.`;
  return null;
}

function relationsAfter(state: GameState): {
  factions: GameState["factions"];
  notes: string[];
} {
  const factions = { ...state.factions },
    notes: string[] = [];
  const add = (faction: Faction, change: number) => {
    factions[faction] = clamp(factions[faction] + change, 0, 100);
  };
  for (const story of state.stories) {
    const points = story.verified ? 3 : 1;
    if (story.topic === "industry") {
      add("workers", points + 1);
      add("merchants", story.critical ? -points - 1 : points);
      if (story.critical) add("council", -1);
    }
    if (story.topic === "trade") {
      add("merchants", points + 1);
      add("workers", 1);
    }
    if (story.topic === "city") {
      add("workers", points);
      add("council", 1);
    }
    if (story.topic === "culture") {
      add("workers", 1);
      add("merchants", points);
      add("council", 1);
    }
    if (story.topic === "politics") {
      add("workers", points);
      add("council", story.critical ? -points - 2 : points);
    }
    if (!story.verified) continue;
    switch (story.effect) {
      case "factory-close":
        add("workers", 6);
        add("merchants", -5);
        add("council", -3);
        notes.push(
          "Проверенные факты о пожаре: инспекция закрыла опасный цех. Рабочие поддержали редакцию; поток пассажиров к фабрике сократился.",
        );
        break;
      case "factory-open":
        add("workers", 4);
        add("merchants", 6);
        add("council", 2);
        notes.push(
          "Проверенный акт ремонта: цех открыт, рабочие смены и пассажиропоток возвращаются.",
        );
        break;
      case "council-expose":
        add("workers", 5);
        add("council", -9);
        add("merchants", -2);
        notes.push(
          "Документы напечатаны: управа открыла слушания, но её отношения с редакцией ухудшились.",
        );
        break;
      case "harbour-restrict":
        add("workers", 4);
        add("merchants", -4);
        add("council", -2);
        notes.push(
          "Подтверждённая опасность: речная служба ограничила рейсы. Рекламный поток на пристани сократился.",
        );
        break;
      case "harbour-reopen":
        add("merchants", 6);
        add("workers", 2);
        add("council", 1);
        notes.push(
          "Ремонт причала проверен: пассажирские рейсы и речная рекламная аудитория восстановлены.",
        );
        break;
    }
  }
  return { factions, notes };
}

export function reduceGame(previous: GameState, action: Action): ActionResult {
  const fail = (error: string): ActionResult => ({ state: previous, error });
  if (previous.status !== "playing" && action.type !== "settings")
    return fail("Эта история редакции уже завершена.");
  const s = clone(previous);
  switch (action.type) {
    case "report": {
      if (
        typeof action.depth !== "string" ||
        !Object.hasOwn(REPORT_OPTIONS, action.depth)
      )
        return fail("Неизвестный способ работы с темой.");
      const lead = leadsFor(s).find((item) => item.id === action.leadId),
        option = REPORT_OPTIONS[action.depth];
      if (!lead) return fail("Эта тема уже ушла из текущей повестки.");
      if (s.stories.some((story) => story.leadId === lead.id))
        return fail("Материал по этой теме уже подготовлен.");
      if (s.stories.length >= 3) return fail("На полосе уже три материала.");
      if (s.hoursLeft < option.hours)
        return fail(
          `Нужно ${option.hours} ч, осталось ${s.hoursLeft}. Выберите другую глубину или другой номер.`,
        );
      if (s.cash < option.cost)
        return fail(`На работу корреспондента нужно ${option.cost} $.`);
      if (s.cash - option.cost < minimumPrepay(s))
        return fail(
          `После оплаты материала не хватит на минимальный номер. Оставьте ${minimumPrepay(s)} $ для печати и редакции.`,
        );
      const verified = action.depth === "verified";
      s.stories.push({
        id: lead.id,
        leadId: lead.id,
        placeId: lead.placeId,
        topic: lead.topic,
        title: verified ? lead.verifiedTitle : lead.briefTitle,
        body: verified ? lead.verifiedBody : lead.briefBody,
        verified,
        quality: verified ? 3 : 1,
        cost: option.cost,
        critical: lead.critical ?? false,
        ...(verified && lead.effect ? { effect: lead.effect } : {}),
      });
      s.cash = money(s.cash - option.cost);
      s.reportingSpent = money(s.reportingSpent + option.cost);
      s.hoursLeft -= option.hours;
      s.frontPage ??= lead.id;
      s.dispatch = { id: s.revision + 1, placeId: lead.placeId };
      s.notices = [
        verified
          ? "Материал готов: факты проверены. Последствия наступят после печати."
          : "Материал готов: короткая заметка. Проверки для обвинений недостаточно.",
      ];
      break;
    }
    case "front-page":
      if (!s.stories.some((story) => story.id === action.id))
        return fail("Сначала подготовьте этот материал.");
      s.frontPage = action.id;
      break;
    case "print-run":
      if (!finite(action.value)) return fail("Тираж должен быть числом.");
      s.printed = clamp(Math.round(action.value / 500) * 500, 1000, 8000);
      break;
    case "price":
      if (!finite(action.value)) return fail("Цена должна быть числом.");
      s.price = money(clamp(action.value, 0.08, 0.24));
      break;
    case "delivery":
      if (!["street", "kiosk", "subscription"].includes(action.value))
        return fail("Неизвестный способ доставки.");
      if (action.value === "kiosk" && s.buildings.kiosk.status !== "open")
        return fail("Сначала постройте и откройте свой киоск.");
      s.delivery = action.value;
      break;
    case "contract": {
      const offer = OFFERS.find((item) => item.id === action.id);
      if (!offer || s.day < offer.unlockDay)
        return fail("Этот договор пока недоступен.");
      if (s.contracts.some((c) => c.id === offer.id))
        return fail("Этот договор уже заключён. Повторного заказа нет.");
      if (s.day + offer.duration - 1 > 12)
        return fail("До конца главы не осталось времени выполнить договор.");
      if (s.cash < offer.cost)
        return fail(`Для аренды и изготовления нужно ${offer.cost} $.`);
      if (
        s.cash - offer.cost <
        minimumPrepay(s) + (s.stories.length ? 0 : REPORT_OPTIONS.brief.cost)
      )
        return fail(
          "Договор оставит редакцию без средств на минимальный номер. Сначала выпустите газету.",
        );
      s.cash = money(s.cash - offer.cost);
      s.contracts.push({
        ...offer,
        startedDay: s.day,
        remaining: offer.duration,
        progress: 0,
        status: "active",
      });
      s.notices = [
        `Договор «${offer.title}» принят: ${offer.duration} выпуска, цель ${offer.target} контактов. Выплата только после выполнения.`,
      ];
      break;
    }
    case "upgrade": {
      const upgrade = UPGRADES.find((item) => item.id === action.id);
      if (!upgrade) return fail("Неизвестное улучшение.");
      if (s.buildings[upgrade.id].status !== "locked")
        return fail("Это улучшение уже заказано или работает.");
      if (s.day + upgrade.duration > 12)
        return fail("Улучшение не успеет поработать до конца главы.");
      if (s.cash < upgrade.cost)
        return fail(`На улучшение нужно ${upgrade.cost} $.`);
      if (
        s.cash - upgrade.cost <
        minimumPrepay(s) + (s.stories.length ? 0 : REPORT_OPTIONS.brief.cost)
      )
        return fail(
          "Улучшение оставит редакцию без средств на следующий номер. Сначала заработайте на печати.",
        );
      s.cash = money(s.cash - upgrade.cost);
      s.buildings[upgrade.id] = {
        status: "building",
        readyDay: s.day + upgrade.duration,
      };
      s.notices = [
        `${upgrade.title}: строительство началось. До открытия — ${upgrade.duration} выпуска.`,
      ];
      break;
    }
    case "settings":
      if (action.key === "quality") {
        if (
          typeof action.value !== "string" ||
          !["auto", "high", "low"].includes(action.value)
        )
          return fail("Неизвестное качество изображения.");
        s.settings.quality = action.value as GameState["settings"]["quality"];
      } else if (
        (action.key === "sound" || action.key === "motion") &&
        typeof action.value === "boolean"
      )
        s.settings[action.key] = action.value;
      else return fail("Некорректная настройка.");
      break;
    case "publish": {
      const block = publicationBlock(s);
      if (block) return fail(block);
      const f = forecast(s),
        front = s.stories.find((story) => story.id === s.frontPage)!;
      const verified = s.stories.filter((story) => story.verified).length;
      const hot = interests[s.day - 1].includes(front.topic);
      const unverifiedAccusations = s.stories.filter(
        (story) => story.critical && !story.verified,
      ).length;
      const trustAfter = clamp(
        s.trust +
          verified * 3 +
          (front.verified && hot ? 2 : 0) -
          unverifiedAccusations * 3 -
          (s.stories.length === 1 && !verified ? 2 : 0),
        0,
        99,
      );
      const readersAfter = Math.max(
        0,
        Math.round(
          s.readers * 0.91 +
            f.sold * 0.11 +
            verified * 100 +
            new Set(s.stories.map((story) => story.topic)).size * 20 -
            unverifiedAccusations * 65 +
            (s.delivery === "subscription" ? 90 : 0),
        ),
      );
      const world = worldAfterStories(s),
        relations = relationsAfter(s),
        contracts = settleContracts(s, f.sold, world);
      const cashAfter = money(s.cash + f.revenue + f.adRevenue - f.prepay);
      const notes = [
        `Первая полоса «${front.title}»: ${hot ? "в центре интересов города" : "выбрана ради своей аудитории"}.`,
        `${verified} проверенных материалов; доверие ${s.trust} → ${trustAfter}.`,
        ...f.warnings,
        ...relations.notes,
      ];
      const edition: Edition = {
        day: s.day,
        title: front.title,
        stories: clone(s.stories),
        frontPage: front.id,
        printed: s.printed,
        sold: f.sold,
        price: s.price,
        revenue: f.revenue,
        adRevenue: f.adRevenue,
        printCost: f.printCost,
        reportingCost: f.reportingCost,
        operatingCost: f.operatingCost,
        deliveryCost: f.deliveryCost,
        profit: f.profit,
        cashBefore: s.editionStartCash,
        cashAfter,
        trustBefore: s.trust,
        trustAfter,
        readersBefore: s.readers,
        readersAfter,
        notes,
        contractEvents: contracts.events,
      };
      s.history.push(edition);
      s.cash = cashAfter;
      s.trust = trustAfter;
      s.readers = readersAfter;
      s.world = world;
      s.factions = relations.factions;
      s.contracts = contracts.contracts;
      s.day += 1;
      s.stories = [];
      s.frontPage = null;
      s.reportingSpent = 0;
      s.editionStartCash = s.cash;
      s.dispatch = null;
      s.notices = [...relations.notes, ...contracts.events];
      for (const upgrade of UPGRADES) {
        const building = s.buildings[upgrade.id];
        if (
          building.status === "building" &&
          building.readyDay !== null &&
          building.readyDay <= s.day
        ) {
          building.status = "open";
          s.notices.push(`${upgrade.title}: открыто. ${upgrade.description}`);
        }
      }
      s.hoursLeft = s.buildings.desk.status === "open" ? 10 : 8;
      if (s.day > 12) {
        const totalVerified = s.history.reduce(
          (sum, e) => sum + e.stories.filter((story) => story.verified).length,
          0,
        );
        s.status =
          s.trust >= CAMPAIGN_GOAL.trust &&
          s.readers >= CAMPAIGN_GOAL.readers &&
          totalVerified >= CAMPAIGN_GOAL.verified
            ? "won"
            : "ended";
        s.notices.push(
          s.status === "won"
            ? "Газета стала самостоятельным голосом Белфорда."
            : "Глава завершена. Сравните свою редакцию, отношения и город.",
        );
      } else if (s.cash < REPORT_OPTIONS.brief.cost + minimumPrepay(s)) {
        s.status = "bankrupt";
        s.notices.push(
          "На минимальный следующий номер не осталось средств. Редакция прекращает печать; история и договоры сохранены.",
        );
      }
      if (!s.notices.length)
        s.notices = [
          "Новый день: три свежие темы. Часы редакции восстановлены.",
        ];
      s.revision += 1;
      return { state: s, edition };
    }
    default:
      return fail("Неизвестное действие.");
  }
  s.revision += 1;
  return { state: s };
}
