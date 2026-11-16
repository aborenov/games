import { ArrowRight, Check, Coins, Eye, Minus, Plus, Star, Storefront, WarningCircle } from '@phosphor-icons/react';
import { COSTS, money, number, price, TOPICS, weekDate } from '../game/content';
import { forecast, publicationBlock, storiesFor } from '../game/model';
import type { Action } from '../game/model';
import type { AdPlan, Channel, GameState } from '../game/types';

const CHANNELS: { id: Channel; title: string; text: string }[] = [
  { id: 'street', title: 'На улицах', text: 'Без платы за маршрут. Зависит от погоды и потока людей.' },
  { id: 'kiosk', title: 'В киосках', text: 'Больше охват у вокзала и на ярмарке. Есть расходы на сбыт.' },
  { id: 'subscription', title: 'По подписке', text: 'Доставка дороже, зато постоянные читатели возвращаются.' },
];
const ADS: { id: AdPlan; title: string; text: string }[] = [
  { id: 'standard', title: 'Обычная реклама', text: 'Разные рекламодатели, обычные ставки.' },
  { id: 'local', title: 'Местные объявления', text: 'Меньше денег за полосу, доверие +2.' },
  { id: 'exclusive', title: 'Один спонсор', text: 'Выше доход, доверие −2. Повторять часто невыгодно.' },
];
export function Editor({ state, act, onPublish, onPaper, onBank, publishing }: {
  state: GameState; act: (action: Action) => void; onPublish: () => void; onPaper: () => void; onBank: () => void; publishing: boolean;
}) {
  const f = forecast(state), titles = storiesFor(state), block = publicationBlock(state), ended = state.status !== 'playing';
  return <div className="editor-content">
    <div className="week-brief"><p className="eyebrow">{weekDate(state.week)} · БЕЛФОРД</p><h3>{f.current.title}</h3><p>{f.current.text}</p></div>
    {state.headlineEdit && <div className="inline-notice good"><Check size={18} /><span>{state.headlineEdit.verified ? 'Проверенный репортаж добавлен на первую полосу.' : 'На первой полосе материал без полной проверки.'}</span></div>}
    {state.week === 4 && <section className="editor-section event-decision"><p className="eyebrow">РЕДАКЦИОННОЕ РЕШЕНИЕ</p><h3>Правда или рекламодатель?</h3><p>Документы об электростанции поддержат доверие, но часть рекламных поступлений исчезнет.</p><div className="two-choices"><button className={state.investigation === 'publish' ? 'choice selected' : 'choice'} onClick={() => act({ type: 'investigation', value: 'publish' })}>Опубликовать</button><button className={state.investigation === 'hold' ? 'choice selected' : 'choice'} onClick={() => act({ type: 'investigation', value: 'hold' })}>Отложить</button></div></section>}
    <section className="editor-section"><div className="section-heading"><div><p className="eyebrow">01 · РЕДАКЦИЯ</p><h3>О чём узнает город</h3></div><span className="count">{state.selected.length} / 6</span></div><p className="help">Выберите шесть материалов. Звезда назначает первую полосу.</p>
      <div className="story-list">{titles.map((title, id) => <div key={id} className={'story-choice ' + (state.selected.includes(id) ? 'chosen' : '') + (state.lead === id ? ' lead' : '')}>
        <button className="story-toggle" aria-pressed={state.selected.includes(id)} onClick={() => act({ type: 'toggle-story', id })} disabled={ended}><span className="checkmark">{state.selected.includes(id) && <Check size={13} weight="bold" />}</span><span><small>{TOPICS[id]}{f.current.topics.includes(id) ? ' · В фокусе' : ''}</small><strong>{title}</strong><em>{money(COSTS[id] + id * state.week % 9)}</em></span></button>
        <button className="story-star" aria-label={'На первую полосу: ' + title} aria-pressed={state.lead === id} disabled={!state.selected.includes(id) || ended} onClick={() => act({ type: 'lead', id })}><Star size={20} weight={state.lead === id ? 'fill' : 'regular'} /></button>
      </div>)}</div>
    </section>
    <section className="editor-section"><div className="section-heading"><div><p className="eyebrow">02 · ТИПОГРАФИЯ</p><h3>Цена и тираж</h3></div><Coins size={24} /></div>
      <label className="slider-label" htmlFor="edition-price"><span>Цена экземпляра</span><output>{price(state.price)}</output></label>
      <div className="range-row"><button className="step-button" aria-label="Уменьшить цену" onClick={() => act({ type: 'set-price', value: state.price - .01 })} disabled={state.price <= .06 || ended}><Minus size={18} /></button><input id="edition-price" aria-label="Цена экземпляра" type="range" min=".06" max=".20" step=".01" value={state.price} disabled={ended} onChange={e => act({ type: 'set-price', value: Number(e.target.value) })} /><button className="step-button" aria-label="Увеличить цену" onClick={() => act({ type: 'set-price', value: state.price + .01 })} disabled={state.price >= .20 || ended}><Plus size={18} /></button></div>
      <label className="slider-label" htmlFor="edition-count"><span>Тираж</span><output>{number(state.printed)}</output></label>
      <div className="range-row"><button className="step-button" aria-label="Уменьшить тираж" onClick={() => act({ type: 'set-printed', value: state.printed - 500 })} disabled={state.printed <= 2000 || ended}><Minus size={18} /></button><input id="edition-count" aria-label="Тираж" type="range" min="2000" max="14000" step="500" value={state.printed} disabled={ended} onChange={e => act({ type: 'set-printed', value: Number(e.target.value) })} /><button className="step-button" aria-label="Увеличить тираж" onClick={() => act({ type: 'set-printed', value: state.printed + 500 })} disabled={state.printed >= 14000 || ended}><Plus size={18} /></button></div>
    </section>
    <section className="editor-section"><div className="section-heading"><div><p className="eyebrow">03 · ЧИТАТЕЛИ</p><h3>Как доставить газету</h3></div><Storefront size={24} /></div><div className="plan-list">{CHANNELS.map(item => <button key={item.id} className={'plan ' + (state.channel === item.id ? 'selected' : '')} aria-pressed={state.channel === item.id} onClick={() => act({ type: 'set-channel', value: item.id })} disabled={ended}><span className="radio-mark">{state.channel === item.id && <Check size={13} weight="bold" />}</span><span><strong>{item.title}</strong><small>{item.text}</small></span></button>)}</div><p className="help">Постоянных подписчиков: {number(state.subscribers)}.</p></section>
    <section className="editor-section"><p className="eyebrow">04 · РЕКЛАМОДАТЕЛИ</p><h3>Деньги и независимость</h3><div className="plan-list">{ADS.map(item => <button key={item.id} className={'plan ' + (state.adPlan === item.id ? 'selected' : '')} aria-pressed={state.adPlan === item.id} onClick={() => act({ type: 'set-ads', value: item.id })} disabled={ended}><span className="radio-mark">{state.adPlan === item.id && <Check size={13} weight="bold" />}</span><span><strong>{item.title}</strong><small>{item.text}</small></span></button>)}</div></section>
    <section className="forecast-section"><p className="eyebrow">ПРОГНОЗ ВЫПУСКА</p><div className="forecast-hero"><div><span>Прибыль</span><strong className={f.estimated >= 0 ? 'positive' : 'negative'}>{f.estimated >= 0 ? '+' : ''}{money(f.estimated)}</strong></div><div><span>Продажи</span><strong>{number(f.sold)}</strong></div></div><div className="ledger-line"><span>Продажи и реклама</span><strong>{money(f.ticket + f.adRevenue)}</strong></div><div className="ledger-line"><span>Все расходы</span><strong>{money(f.expenses)}</strong></div><div className="ledger-line"><span>Оплатить до продаж</span><strong>{money(f.prepay)}</strong></div><div className="ledger-line"><span>Сейчас в кассе</span><strong>{money(state.cash)}</strong></div></section>
    {block && <div className="inline-notice warning"><WarningCircle size={20} /><span>{block}</span></div>}
    {block && state.cash < f.prepay && <button className="secondary-button" onClick={onBank}>Открыть банк<ArrowRight size={18} /></button>}
    <div className="editor-actions"><button className="secondary-button" onClick={onPaper}><Eye size={20} />Посмотреть макет</button><button className="primary-button" onClick={onPublish} disabled={!!block || publishing}>{publishing ? 'Печатаем…' : 'Выпустить номер'}<ArrowRight size={20} /></button></div>
  </div>;
}
