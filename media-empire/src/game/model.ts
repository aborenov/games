import pressGame from './vendor/press-game.js';
import { CASES, COSTS, STORIES, TRUST_POINTS } from './content';
import type { CaseRecord, Forecast, GameNotification, GameState, HeadlineEdit, Issue, NotificationAction, PressEngine, WorldEffects } from './types';

const press = pressGame as PressEngine;
export const SAVE_KEY = 'media-empire-mobile-v1';
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const emptyCase = (): CaseRecord => ({ assigned: false, arrived: false, witness: false, evidence: false, prepared: false, published: false });
const clone = <T,>(s: T): T => structuredClone(s);

export function starter(): GameState {
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    format: 'media-empire-mobile', version: 1, revision: 0,
    week: 1, cash: 4000, loan: 2000, trust: 60, price: .08, printed: 9000,
    selected: [0, 1, 2, 3, 4, 5], lead: 0, readers: 0, subscribers: 0,
    channel: 'street', adPlan: 'standard', investigation: null, headlineEdit: null,
    rivals: [
      { id: 'chrono', name: 'Городская хроника', price: .12, printed: 9400, lastSales: 7100, trust: 73, cash: 6000, active: true, action: 'Городские расследования и дорогой выпуск' },
      { id: 'listok', name: 'Народный листок', price: .07, printed: 11000, lastSales: 8300, trust: 51, cash: 4100, active: true, action: 'Доступная газета для массового читателя' },
      { id: 'courier', name: 'Деловой курьер', price: .15, printed: 4600, lastSales: 3100, trust: 78, cash: 7200, active: true, action: 'Деловая аудитория и дорогая реклама' },
    ],
    history: [],
    city: { press: { status: 'locked', finishWeek: null }, kiosk: { status: 'locked', finishWeek: null, landOwned: false }, bankClosedUntil: null },
    cases: Object.fromEntries(CASES.map(c => [c.id, emptyCase()])),
    reporter: { activeCase: null, readyAt: null, actionsLeft: 4 },
    notifications: [{ id: 'first-fire', week: 1, title: 'Пожар на фабрике', body: 'Проверьте факты', tone: 'urgent', action: 'case', caseId: 'fire', dismissed: false }],
    settings: { sound: false, motion: !reducedMotion, haptics: true },
    status: 'playing',
  };
}

export function effects(s: GameState): WorldEffects {
  return { printFactor: s.city.press.status === 'open' ? .81 : 1, overheadFactor: 1,
    reachFactor: s.city.kiosk.status === 'open' ? 1.08 : 1, adFactor: 1 };
}
export function forecast(s: GameState, settled = false): Forecast {
  return press.forecast(s, { baseCosts: COSTS, trustPoints: TRUST_POINTS, world: effects(s), settled });
}
export function storiesFor(s: GameState, week = s.week): string[] {
  const titles = [...STORIES[clamp(week - 1, 0, 11)]];
  if (s.headlineEdit?.week === week) titles[0] = s.headlineEdit.title;
  return titles;
}
export function currentCase(s: GameState): string | null {
  return CASES.find(c => c.week <= s.week && s.week <= c.week + 2 && !s.cases[c.id]?.published)?.id ?? null;
}
export function bankIsOpen(s: GameState): boolean {
  return s.city.bankClosedUntil === null || s.week >= s.city.bankClosedUntil;
}
export function notify(s: GameState, title: string, body: string, action: NotificationAction, tone: GameNotification['tone'] = 'info', caseId?: string) {
  s.notifications.unshift({ id: 'n-' + s.week + '-' + s.revision + '-' + s.notifications.length, week: s.week, title, body, action, tone, ...(caseId ? { caseId } : {}), dismissed: false });
  s.notifications = s.notifications.slice(0, 60);
}
function dismissCaseNotice(s: GameState, id: string) {
  for (const note of s.notifications) if (note.caseId === id) note.dismissed = true;
}
export function publicationBlock(s: GameState): string | null {
  if (s.status !== 'playing' || s.week > 12) return 'Глава завершена. Откройте итоги или начните новую партию.';
  if (s.selected.length !== 6) return 'Для выпуска нужно выбрать ровно шесть материалов.';
  if (s.week === 4 && s.investigation === null) return 'Решите, публиковать ли документы об электростанции.';
  const f = forecast(s, true);
  if (s.cash < f.prepay) return 'До печати не хватает ' + Math.ceil(f.prepay - s.cash) + ' $. Уменьшите тираж или обратитесь в банк.';
  if (s.cash + f.estimated < 0) return 'Не хватает средств на расходы выпуска. Измените план или привлеките кредит.';
  return null;
}

export type Action =
  | { type: 'set-price'; value: number }
  | { type: 'set-printed'; value: number }
  | { type: 'set-channel'; value: GameState['channel'] }
  | { type: 'set-ads'; value: GameState['adPlan'] }
  | { type: 'toggle-story'; id: number }
  | { type: 'lead'; id: number }
  | { type: 'assign'; id: string; now: number }
  | { type: 'tick'; now: number }
  | { type: 'clue'; id: string; clue: 'witness' | 'evidence' }
  | { type: 'prepare'; id: string }
  | { type: 'investigation'; value: 'publish' | 'hold' }
  | { type: 'dismiss'; id: string }
  | { type: 'borrow' }
  | { type: 'repay' }
  | { type: 'audit-bank' }
  | { type: 'buy-land' }
  | { type: 'build-kiosk' }
  | { type: 'build-press' }
  | { type: 'publish' }
  | { type: 'settings'; key: keyof GameState['settings']; value: boolean }
  | { type: 'bankrupt' };

export interface Result { state: GameState; error?: string; published?: Issue; cue?: 'tap' | 'paper' | 'coin' | 'bell' | 'press' | 'build' }

export function reduceGame(previous: GameState, action: Action): Result {
  if (action.type === 'tick' && (!previous.reporter.readyAt || action.now < previous.reporter.readyAt)) return { state: previous };
  const s = clone(previous);
  const fail = (error: string): Result => ({ state: previous, error });
  const playing = s.status === 'playing' && s.week <= 12;
  if (!playing && !['settings', 'dismiss', 'tick'].includes(action.type)) return fail('Эта глава уже завершена.');
  let cue: Result['cue'] = 'tap';
  let published: Issue | undefined;
  switch (action.type) {
    case 'set-price': s.price = clamp(Math.round(action.value * 100) / 100, .06, .20); break;
    case 'set-printed': s.printed = clamp(Math.round(action.value / 500) * 500, 2000, 14000); break;
    case 'set-channel':
      if (!['street', 'kiosk', 'subscription'].includes(action.value)) return fail('Неизвестный канал продаж.');
      s.channel = action.value; break;
    case 'set-ads':
      if (!['standard', 'local', 'exclusive'].includes(action.value)) return fail('Неизвестный рекламный план.');
      s.adPlan = action.value; break;
    case 'toggle-story':
      if (!Number.isInteger(action.id) || action.id < 0 || action.id > 7) return fail('Материал не найден.');
      if (s.selected.includes(action.id)) {
        if (s.selected.length === 1) return fail('Оставьте хотя бы один материал.');
        s.selected = s.selected.filter(id => id !== action.id);
        if (s.lead === action.id) s.lead = s.selected[0];
      } else {
        if (s.selected.length >= 6) return fail('В номере шесть полос. Сначала уберите один материал.');
        s.selected.push(action.id);
      }
      break;
    case 'lead':
      if (!s.selected.includes(action.id)) return fail('Сначала добавьте материал в номер.');
      s.lead = action.id; cue = 'paper'; break;
    case 'assign': {
      const c = CASES.find(c => c.id === action.id);
      if (!c || c.week > s.week || s.week > c.week + 2) return fail('Это событие уже не в текущей повестке.');
      const r = s.cases[c.id];
      if (r.assigned) return fail('Репортёр уже назначен.');
      if (s.reporter.activeCase && s.reporter.readyAt) return fail('Дождитесь возвращения репортёра.');
      if (s.reporter.actionsLeft < 1) return fail('Рабочее время репортёра закончилось. Новый выпуск откроет следующую неделю.');
      r.assigned = true; s.reporter.actionsLeft -= 1;
      s.reporter.activeCase = c.id; s.reporter.readyAt = action.now + (s.settings.motion ? 2800 : 350);
      dismissCaseNotice(s, c.id); cue = 'bell'; break;
    }
    case 'tick': {
      if (!s.reporter.activeCase || !s.reporter.readyAt || action.now < s.reporter.readyAt) return { state: previous };
      const id = s.reporter.activeCase;
      s.cases[id].arrived = true; s.reporter.readyAt = null;
      notify(s, 'Репортёр на месте', 'Свидетель ждёт. Проверьте обе версии.', 'case', 'good', id); cue = 'bell'; break;
    }
    case 'clue': {
      const r = s.cases[action.id];
      if (!r || !r.arrived || r.published) return fail('Сначала отправьте репортёра на место.');
      if (r[action.clue]) return { state: previous };
      if (s.reporter.actionsLeft < 1) return fail('На этой неделе у репортёра не осталось времени.');
      r[action.clue] = true; s.reporter.actionsLeft -= 1; cue = 'paper'; break;
    }
    case 'prepare': {
      const c = CASES.find(c => c.id === action.id), r = s.cases[action.id];
      if (!c || !r?.arrived || r.published) return fail('Репортаж недоступен для подготовки.');
      if (r.prepared && s.headlineEdit?.caseId === c.id && s.headlineEdit.week === s.week && s.selected.includes(0) && s.lead === 0) return { state: previous };
      const verified = r.witness && r.evidence;
      s.headlineEdit = { title: c.headline, week: s.week, caseId: c.id, verified, settleTrust: true };
      if (!s.selected.includes(0)) s.selected[s.selected.length - 1] = 0;
      s.lead = 0; r.prepared = true; dismissCaseNotice(s, c.id);
      notify(s, verified ? 'Факты проверены' : 'Срочный материал готов', verified ? 'Репортаж ждёт на первой полосе.' : 'Публикация без двух источников снизит доверие.', 'editor', verified ? 'good' : 'urgent');
      cue = 'paper'; break;
    }
    case 'investigation': s.investigation = action.value; break;
    case 'dismiss': {
      const n = s.notifications.find(n => n.id === action.id);
      if (n) n.dismissed = true;
      break;
    }
    case 'borrow':
      if (!bankIsOpen(s)) return fail('Банк закрыт на проверку. Можно предоставить документы.');
      if (s.loan + 500 > 10000) return fail('Кредитный лимит исчерпан.');
      s.cash += 500; s.loan += 500; cue = 'coin'; break;
    case 'repay':
      if (!bankIsOpen(s)) return fail('Банк пока закрыт.');
      if (s.loan === 0) return fail('Кредит уже погашен.');
      if (s.cash < Math.min(100, s.loan)) return fail('В кассе недостаточно средств.');
      { const amount = Math.min(100, s.loan); s.cash -= amount; s.loan -= amount; }
      cue = 'coin'; break;
    case 'audit-bank':
      if (bankIsOpen(s)) return { state: previous };
      if (s.cash < 70) return fail('На оформление документов нужно 70 $.');
      s.cash -= 70; s.city.bankClosedUntil = null;
      notify(s, 'Банк снова открыт', 'Документы приняты. Кредитные операции доступны.', 'bank', 'good'); cue = 'bell'; break;
    case 'buy-land':
      if (s.city.kiosk.landOwned) return fail('Этот участок уже ваш.');
      if (s.cash < 500) return fail('Для покупки участка нужно 500 $.');
      s.cash -= 500; s.city.kiosk.landOwned = true; cue = 'coin'; break;
    case 'build-kiosk':
      if (!s.city.kiosk.landOwned || s.city.kiosk.status !== 'locked') return fail('Сначала купите свободный участок.');
      if (s.week >= 12) return fail('До конца главы осталось слишком мало времени.');
      if (s.cash < 820) return fail('Для строительства нужно 820 $.');
      s.cash -= 820; s.city.kiosk.status = 'building'; s.city.kiosk.finishWeek = s.week + 1;
      notify(s, 'Город меняется', 'Киоск откроется после следующего выпуска.', 'lot', 'info'); cue = 'build'; break;
    case 'build-press':
      if (s.city.press.status !== 'locked') return fail('Типография уже восстанавливается или работает.');
      if (s.week >= 11) return fail('До конца главы осталось слишком мало времени.');
      if (s.cash < 1750) return fail('Для восстановления нужно 1 750 $.');
      s.cash -= 1750; s.city.press.status = 'building'; s.city.press.finishWeek = s.week + 2;
      notify(s, 'Машины возвращаются к жизни', 'Типография заработает через два выпуска.', 'press', 'info'); cue = 'build'; break;
    case 'settings': s.settings[action.key] = action.value; cue = undefined; break;
    case 'bankrupt':
      s.status = 'bankrupt'; notify(s, 'Редакция остановила печать', 'Посмотрите итог партии и попробуйте другой подход.', 'ending', 'urgent'); break;
    case 'publish': {
      const block = publicationBlock(s);
      if (block) return fail(block);
      const planned = forecast(s), f = forecast(s, true), before = s.trust, week = s.week;
      const stories = storiesFor(s);
      s.cash = Math.round((s.cash + f.estimated) * 100) / 100;
      s.trust = clamp(s.trust + f.trustDelta, 20, 99);
      s.readers = f.sold; s.subscribers = f.nextSubscribers;
      const competitors = s.rivals.filter(r => r.active).map(r => {
        const i = s.rivals.indexOf(r);
        const result = press.rivalMove(r, i, week, f.rivalSales[i], f.rivalAds[i], f);
        r.action = result.action;
        return result;
      });
      const dispatch = s.headlineEdit?.week === week && s.selected.includes(0) ? { id: s.headlineEdit.caseId, verified: s.headlineEdit.verified } : null;
      const notes = [
        f.sold < s.printed ? 'Непроданный тираж: ' + (s.printed - f.sold) + ' экз. Печать оплачена полностью.' : 'Весь тираж нашёл своих читателей.',
        f.hot ? 'Первая полоса попала в интересы этой недели.' : 'Проверьте, какие темы сейчас интересуют город.',
      ];
      if (dispatch) {
        s.cases[dispatch.id].published = true;
        notes.push(dispatch.verified ? 'Проверенный репортаж укрепил доверие читателей.' : 'Непроверенная публикация снизила доверие.');
      }
      published = { week, price: s.price, printed: s.printed, sold: f.sold, demand: f.demand, ticket: f.ticket,
        adRevenue: f.adRevenue, editorCost: f.editorCost, printCost: f.printCost, overhead: f.overhead,
        interest: f.interest, distribution: f.distribution, profit: f.estimated, cash: s.cash,
        trustBefore: before, trustAfter: s.trust, lead: s.lead, selected: [...s.selected], stories,
        notes, rank: f.rank, channel: s.channel, adPlan: s.adPlan, forecastProfit: planned.estimated,
        subscribers: s.subscribers, districts: f.districts, competitors, dispatch };
      const pendingHeadline = dispatch ? null : s.headlineEdit;
      s.history.push(published); s.week += 1;
      s.headlineEdit = pendingHeadline && s.week <= 12 ? { ...pendingHeadline, week: s.week } : null;
      s.selected = [0, 1, 2, 3, 4, 5]; s.lead = 0;
      s.reporter = s.reporter.readyAt && s.week <= 12
        ? { ...s.reporter, actionsLeft: 4 }
        : { activeCase: null, readyAt: null, actionsLeft: 4 };
      for (const note of s.notifications) note.dismissed = true;
      for (const [name, b] of Object.entries({ press: s.city.press, kiosk: s.city.kiosk })) {
        if (b.status === 'building' && b.finishWeek !== null && b.finishWeek <= s.week) {
          b.status = 'open';
          notify(s, name === 'press' ? 'Типография открылась' : 'Ваш киоск открыт', name === 'press' ? 'Свои машины снизили стоимость печати на 19%.' : 'На карте появилась новая точка продаж. Охват +8%.', name === 'press' ? 'press' : 'lot', 'good');
        }
      }
      if (s.headlineEdit) notify(s, 'Репортаж ждёт печати', 'Подготовленный материал перенесён в следующий номер.', 'editor', 'info');
      if (s.week === 6) { s.city.bankClosedUntil = 7; notify(s, 'Банк закрыт на проверку', 'Кредитные операции временно приостановлены.', 'bank', 'urgent'); }
      if (s.week === 7) { s.city.bankClosedUntil = null; notify(s, 'Банк снова открыт', 'Управляющий возобновил обслуживание редакции.', 'bank', 'good'); }
      if (s.week === 2) notify(s, 'Белфорд засыпает снегом', 'Уличные продавцы доставят не больше 6 200 газет. Сравните другие каналы.', 'editor', 'info');
      if (s.week === 9) notify(s, 'Бумага стала дороже', 'Печать подорожала на 24%. Осторожнее с лишним тиражом.', 'editor', 'urgent');
      for (const c of CASES) if (c.week === s.week) notify(s, c.title, 'В городе появилась новая история. Нужны проверенные факты.', 'case', 'urgent', c.id);
      if (s.week > 12) {
        s.status = 'complete';
        notify(s, 'Первая глава завершена', 'Двенадцать выпусков изменили вашу редакцию и город.', 'ending', 'good');
      } else if (!s.notifications.some(n => !n.dismissed)) notify(s, 'Город ждёт новый номер', press.bulletin(s.week).title, 'editor', 'info');
      cue = 'press'; break;
    }
  }
  s.revision += 1;
  return { state: s, cue, published };
}

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const int = (v: unknown, min: number, max: number) => num(v, min, max) && Number.isInteger(v);
const text = (v: unknown, max = 500) => typeof v === 'string' && v.length <= max;
const caseIdValid = (v: unknown) => CASES.some(c => c.id === v);
const oneOf = (v: unknown, values: readonly string[]) => typeof v === 'string' && values.includes(v);
const channelValid = (v: unknown) => oneOf(v, ['street', 'kiosk', 'subscription']);
const adValid = (v: unknown) => oneOf(v, ['standard', 'local', 'exclusive']);
function selectedValid(v: unknown, lead: unknown): v is number[] {
  return Array.isArray(v) && v.length >= 1 && v.length <= 6 && new Set(v).size === v.length && v.every(n => int(n, 0, 7)) && v.includes(lead);
}
export function validState(v: unknown): v is GameState {
  if (!record(v) || v.format !== 'media-empire-mobile' || v.version !== 1 || !int(v.revision, 0, 1e9) || !int(v.week, 1, 13) ||
    !num(v.cash, 0, 1e9) || !num(v.loan, 0, 10000) || !num(v.trust, 0, 100) || !num(v.price, .06, .20) ||
    !int(v.printed, 2000, 14000) || !selectedValid(v.selected, v.lead) || !int(v.readers, 0, 30000) || !int(v.subscribers, 0, 30000) ||
    !channelValid(v.channel) || !adValid(v.adPlan) || ![null, 'publish', 'hold'].includes(v.investigation as null | string) ||
    !Array.isArray(v.history) || v.history.length > 12 || !Array.isArray(v.rivals) || v.rivals.length < 1 || v.rivals.length > 12 ||
    !record(v.city) || !record(v.city.press) || !record(v.city.kiosk) || !record(v.settings) ||
    !record(v.reporter) || !int(v.reporter.actionsLeft, 0, 4) || !record(v.cases) || !Array.isArray(v.notifications) || v.notifications.length > 60 ||
    !oneOf(v.status, ['playing', 'complete', 'bankrupt'])) return false;
  if (v.history.length !== Number(v.week) - 1 || (v.status === 'complete' && v.week !== 13) || (v.week === 13 && v.status !== 'complete')) return false;
  if (![v.city.press, v.city.kiosk].every(b => oneOf(b.status, ['locked', 'building', 'open']) &&
    (b.finishWeek === null || int(b.finishWeek, 1, 13))) || typeof v.city.kiosk.landOwned !== 'boolean' ||
    !(v.city.bankClosedUntil === null || int(v.city.bankClosedUntil, 1, 13)) ||
    !(v.reporter.activeCase === null || caseIdValid(v.reporter.activeCase)) ||
    !(v.reporter.readyAt === null || num(v.reporter.readyAt, 0, 1e14))) return false;
  if (v.headlineEdit !== null) {
    const edit = v.headlineEdit;
    if (!record(edit) || !text(edit.title, 300) || !int(edit.week, 1, 12) || !caseIdValid(edit.caseId) ||
      typeof edit.verified !== 'boolean' || typeof edit.settleTrust !== 'boolean') return false;
  }
  if (!v.history.every(h => record(h) && int(h.week, 1, 12) && Number(h.week) < Number(v.week) &&
    selectedValid(h.selected, h.lead) && Array.isArray(h.stories) && h.stories.length === 8 &&
    h.stories.every(t => typeof t === 'string' && t.length < 300) && ['cash', 'profit', 'sold', 'printed', 'trustAfter', 'ticket', 'adRevenue', 'printCost', 'editorCost', 'overhead', 'interest', 'distribution'].every(k => num(h[k], -1e9, 1e9)) &&
    int(h.rank, 1, 13) && num(h.price, .06, .20) && num(h.trustBefore, 0, 100) && int(h.subscribers, 0, 30000) &&
    num(h.forecastProfit, -1e9, 1e9) && channelValid(h.channel) && adValid(h.adPlan) &&
    (h.dispatch === null || (record(h.dispatch) && caseIdValid(h.dispatch.id) && typeof h.dispatch.verified === 'boolean')) &&
    Array.isArray(h.districts) && h.districts.length <= 12 && h.districts.every(d => record(d) && text(d.id) && text(d.name) &&
      ['households', 'demand', 'sold', 'renewals'].every(k => num(d[k], 0, 1e9)) && Array.isArray(d.rivals) &&
      d.rivals.every(r => record(r) && text(r.id) && text(r.name) && num(r.sold, 0, 30000))) &&
    Array.isArray(h.competitors) && h.competitors.length <= 12 && h.competitors.every(r => record(r) && text(r.name) &&
      text(r.action) && typeof r.active === 'boolean' && ['sales', 'price', 'nextPrice', 'profit'].every(k => num(r[k], -1e9, 1e9))) &&
    Array.isArray(h.notes) && h.notes.length <= 30 && h.notes.every(n => text(n)))) return false;
  if (new Set(v.history.map(h => (h as Issue).week)).size !== v.history.length) return false;
  if (!v.rivals.every(r => record(r) && text(r.id) && text(r.name) && text(r.action) && typeof r.active === 'boolean' &&
    num(r.price, .01, 1) && num(r.cash, -1e9, 1e9) && num(r.trust, 0, 100) && num(r.printed, 0, 30000) && num(r.lastSales, 0, 30000))) return false;
  if (!CASES.every(c => {
    const item = (v.cases as Record<string, unknown>)[c.id];
    return record(item) && ['assigned', 'arrived', 'witness', 'evidence', 'prepared', 'published'].every(k => typeof item[k] === 'boolean');
  })) return false;
  return v.notifications.every(n => record(n) && text(n.id) && text(n.title) && text(n.body) && int(n.week, 1, 13) &&
    typeof n.dismissed === 'boolean' && oneOf(n.tone, ['urgent', 'good', 'info']) &&
    (n.caseId === undefined || caseIdValid(n.caseId)) && oneOf(n.action, ['case', 'editor', 'bank', 'press', 'lot', 'paper', 'report', 'ending'])) &&
    ['sound', 'motion', 'haptics'].every(k => typeof (v.settings as Record<string, unknown>)[k] === 'boolean');
}

export function encodeSave(s: GameState): string {
  return JSON.stringify(s, null, 2);
}
export function decodeSave(raw: string): GameState {
  if (raw.length > 2_000_000) throw new Error('Файл сохранения слишком большой.');
  let v: unknown;
  try { v = JSON.parse(raw); } catch { throw new Error('Файл не содержит корректное сохранение JSON.'); }
  if (!validState(v)) throw new Error('Этот файл не является совместимым сохранением мобильной игры.');
  return v;
}

export function draftIssue(s: GameState): Issue {
  const f = forecast(s);
  return { week: Math.min(s.week, 12), price: s.price, printed: s.printed, sold: f.sold, demand: f.demand,
    ticket: f.ticket, adRevenue: f.adRevenue, editorCost: f.editorCost, printCost: f.printCost,
    overhead: f.overhead, interest: f.interest, distribution: f.distribution, profit: f.estimated,
    cash: s.cash, trustBefore: s.trust, trustAfter: s.trust, lead: s.lead,
    selected: [...s.selected], stories: storiesFor(s), notes: [], rank: f.rank, channel: s.channel,
    adPlan: s.adPlan, forecastProfit: f.estimated, subscribers: s.subscribers, districts: f.districts,
    competitors: [], dispatch: s.headlineEdit ? { id: s.headlineEdit.caseId, verified: s.headlineEdit.verified } : null };
}
