import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bank, Bell, CheckCircle, Clock, DownloadSimple, Hammer, NewspaperClipping, ShieldCheck, SpeakerHigh, UploadSimple, Users, WarningCircle } from '@phosphor-icons/react';
import { bankIsOpen, encodeSave, forecast } from '../game/model';
import { BUILDINGS, CASES, money, number, weekDate } from '../game/content';
import type { Action } from '../game/model';
import type { BuildingId, GameState, Issue } from '../game/types';
import { gameStore } from '../game/store';

type Act = (action: Action) => void;

export function CasePanel({ state, caseId, now, act, onEditor }: { state: GameState; caseId: string; now: number; act: Act; onEditor: () => void }) {
  const definition = CASES.find(c => c.id === caseId) ?? CASES[0], record = state.cases[definition.id];
  const verified = record.witness && record.evidence;
  const inEdition = state.headlineEdit?.caseId === definition.id && state.headlineEdit.week === state.week && state.selected.includes(0);
  const ended = state.status !== 'playing';
  const travelling = record.assigned && !record.arrived;
  const progress = state.reporter.readyAt ? Math.min(1, Math.max(0, 1 - (state.reporter.readyAt - now) / 2800)) : 1;
  return <div className="case-panel">
    <img className="case-scene" src={definition.art === 'fire' ? '/assets/fire-report.webp' : '/assets/city-map.webp'} alt={definition.art === 'fire' ? 'События у текстильной фабрики' : 'Городские улицы Белфорда'} />
    <p className="case-place">{definition.place}</p><p className="body-copy">{definition.intro}</p>
    <div className="reporter-card"><img src="/assets/reporter.webp" alt="Александр, корреспондент редакции" /><div><strong>Александр Орлов</strong><span>Городской корреспондент</span><small><Clock size={14} />Время на неделе: {state.reporter.actionsLeft} / 4</small></div></div>
    {!record.assigned && <><p className="help">Выезд и каждый источник занимают по одному действию. Новая неделя начинается с выпуска газеты.</p><button className="primary-button" onClick={() => act({ type: 'assign', id: definition.id, now: Date.now() })} disabled={ended || state.reporter.actionsLeft < 1}>Отправить репортёра<ArrowRight size={20} /></button></>}
    {travelling && <div className="reporter-progress" role="status"><span>Репортёр едет на место…</span><progress max={1} value={progress} /><small>Через несколько секунд он будет готов проверить источники.</small></div>}
    {record.arrived && !record.published && <>
      <div className="section-heading case-check-heading"><h3>Проверить факты</h3><span className="count">{Number(record.witness) + Number(record.evidence)} / 2</span></div>
      <button className={'clue-button ' + (record.witness ? 'checked' : '')} onClick={() => act({ type: 'clue', id: definition.id, clue: 'witness' })} disabled={ended || record.witness || record.prepared || state.reporter.actionsLeft < 1}>{record.witness ? <CheckCircle size={24} /> : <Users size={24} />}<span><strong>{record.witness ? 'Очевидец опрошен' : 'Опросить очевидца'}</strong><small>{record.witness ? 'Свидетельство записано в блокнот' : 'Выслушать человека, который всё видел'}</small></span>{!record.witness && <span className="action-cost">1 действие</span>}</button>
      {record.witness && <blockquote className="source-quote">{definition.witness}</blockquote>}
      <button className={'clue-button ' + (record.evidence ? 'checked' : '')} onClick={() => act({ type: 'clue', id: definition.id, clue: 'evidence' })} disabled={ended || record.evidence || record.prepared || state.reporter.actionsLeft < 1}>{record.evidence ? <CheckCircle size={24} /> : <ShieldCheck size={24} />}<span><strong>{record.evidence ? 'Свидетельства найдены' : 'Осмотреть место'}</strong><small>{record.evidence ? 'Факты сопоставлены с рассказом' : 'Проверить документы и следы события'}</small></span>{!record.evidence && <span className="action-cost">1 действие</span>}</button>
      {record.evidence && <blockquote className="source-quote">{definition.evidence}</blockquote>}
      {record.prepared ? <><div className="inline-notice good"><CheckCircle size={20} /><span>{inEdition ? 'Материал добавлен в макет. Доверие изменится после публикации.' : 'Репортаж подготовлен и остался в блокноте. Его можно вернуть в номер.'}</span></div><button className="primary-button" disabled={ended} onClick={() => { if (!inEdition) act({ type: 'prepare', id: definition.id }); onEditor(); }}>{inEdition ? 'Перейти к вёрстке' : 'Вернуть репортаж в номер'}<ArrowRight size={20} /></button></> : <><div className={'inline-notice ' + (verified ? 'good' : 'warning')}>{verified ? <CheckCircle size={20} /> : <WarningCircle size={20} />}<span>{verified ? 'Два источника проверены. Опубликованный репортаж добавит доверия.' : 'Без полной проверки материал может стоить доверия читателей.'}</span></div><button className="primary-button" disabled={ended} onClick={() => act({ type: 'prepare', id: definition.id })}>{verified ? 'На первую полосу' : 'Подготовить без полной проверки'}<ArrowRight size={20} /></button></>}
    </>}
    {record.published && <div className="inline-notice good"><CheckCircle size={22} /><span>Этот репортаж уже опубликован. Его можно прочитать в архиве газеты.</span></div>}
  </div>;
}

export function BuildingPanel({ state, id, act, onEditor, onClose }: { state: GameState; id: BuildingId; act: Act; onEditor: () => void; onClose: () => void }) {
  const definition = BUILDINGS[id];
  const building = id === 'press' ? state.city.press : state.city.kiosk;
  return <div className="building-panel">
    <p className="body-copy">{definition.description}</p>
    {id === 'newsroom' && <><div className="building-stats"><div><span>Готовится выпуск</span><strong>№{String(Math.min(state.week, 12)).padStart(3, '0')}</strong></div><div><span>Доверие читателей</span><strong>{state.trust} / 100</strong></div><div><span>Газет в архиве</span><strong>{state.history.length}</strong></div></div><button className="primary-button" onClick={onEditor}>Открыть редакционный стол<ArrowRight size={20} /></button></>}
    {id === 'bank' && <><div className={'building-status ' + (bankIsOpen(state) ? 'open' : 'locked')}><Bank size={24} />{bankIsOpen(state) ? 'Банк открыт' : 'Закрыт на проверку'}</div><div className="building-stats"><div><span>Сейчас в кассе</span><strong>{money(state.cash)}</strong></div><div><span>Непогашенный кредит</span><strong>{money(state.loan)}</strong></div><div><span>Проценты за следующий выпуск</span><strong>{money(Math.round(state.loan * .009))}</strong></div><div><span>Доступно в кредит</span><strong>{money(10000 - state.loan)}</strong></div></div>{bankIsOpen(state) ? <div className="button-stack"><button className="primary-button" onClick={() => act({ type: 'borrow' })} disabled={state.loan >= 10000 || state.status !== 'playing'}>Получить 500 $<ArrowRight size={20} /></button><button className="secondary-button" onClick={() => act({ type: 'repay' })} disabled={state.loan <= 0 || state.cash < Math.min(100, state.loan) || state.status !== 'playing'}>Погасить 100 $</button></div> : <><div className="inline-notice warning"><Clock size={20} /><span>Обслуживание возобновится после следующего выпуска. Можно ускорить проверку, предоставив документы.</span></div><button className="primary-button" onClick={() => act({ type: 'audit-bank' })} disabled={state.cash < 70 || state.status !== 'playing'}>Оформить документы · 70 $<ArrowRight size={20} /></button></>}</>}
    {(id === 'press' || id === 'lot') && <>
      <div className={'building-status ' + building.status}>{building.status === 'open' ? <CheckCircle size={25} /> : <Hammer size={25} />}{building.status === 'open' ? 'Открыто и работает' : building.status === 'building' ? 'Идёт строительство' : id === 'press' ? 'Типография закрыта' : state.city.kiosk.landOwned ? 'Участок в собственности' : 'Свободная земля'}</div>
      {building.status === 'building' ? <><div className="construction-message"><span>Откроется после выпуска</span><strong>№{String((building.finishWeek ?? state.week + 1) - 1).padStart(3, '0')}</strong><p>Время города движется с выходом газеты. После завершения работ здание изменит состояние на карте.</p></div><button className="primary-button" onClick={onEditor}>Подготовить следующий выпуск<ArrowRight size={20} /></button></> : building.status === 'open' ? <><p className="building-benefit">{id === 'press' ? '−19% к стоимости печати' : '+8% к охвату аудитории'}</p><p className="help">Эффект уже учтён в прогнозе каждого следующего выпуска.</p><button className="primary-button" onClick={onClose}>Вернуться в город<ArrowRight size={20} /></button></> : id === 'press' ? <><div className="building-stats"><div><span>Восстановление машин</span><strong>1 750 $</strong></div><div><span>До открытия</span><strong>2 выпуска</strong></div><div><span>В кассе</span><strong>{money(state.cash)}</strong></div></div><button className="primary-button" onClick={() => act({ type: 'build-press' })} disabled={state.cash < 1750 || state.week >= 11 || state.status !== 'playing'}>Восстановить типографию<Hammer size={20} /></button>{state.week >= 11 && <p className="help">До конца главы недостаточно времени, чтобы завершить восстановление.</p>}</> : <><div className="building-stats"><div><span>{state.city.kiosk.landOwned ? 'Строительство киоска' : 'Стоимость участка'}</span><strong>{state.city.kiosk.landOwned ? '820 $' : '500 $'}</strong></div><div><span>Срок строительства</span><strong>1 выпуск</strong></div><div><span>В кассе</span><strong>{money(state.cash)}</strong></div></div><button className="primary-button" onClick={() => act({ type: state.city.kiosk.landOwned ? 'build-kiosk' : 'buy-land' })} disabled={state.cash < (state.city.kiosk.landOwned ? 820 : 500) || state.week >= 12 || state.status !== 'playing'}>{state.city.kiosk.landOwned ? 'Начать строительство · 820 $' : 'Купить участок · 500 $'}<Hammer size={20} /></button>{!state.city.kiosk.landOwned && <p className="help">Строительство оплачивается отдельно после покупки земли.</p>}</>}
    </>}
    {id === 'market' && <><div className="building-stats"><div><span>Семей в Белфорде</span><strong>30 000</strong></div><div><span>Ваши читатели</span><strong>{number(state.readers)}</strong></div><div><span>Подписчики</span><strong>{number(state.subscribers)}</strong></div></div><h3>За кого борются газеты</h3><div className="district-list">{forecast(state).districts.map(d => <div key={d.id}><span>{d.name}</span><strong>{number(d.households)} семей</strong></div>)}</div><h3>Другие издатели</h3><div className="rival-list">{state.rivals.map(r => <div key={r.id}><div><strong>{r.name}</strong><span>{r.active ? r.action : 'Прекратил выпуск'}</span></div><b>{number(r.lastSales)}<small>читателей</small></b></div>)}</div><button className="primary-button" onClick={onEditor}>Выбрать сбыт и первую полосу<ArrowRight size={20} /></button></>}
  </div>;
}

export function ReportPanel({ issue, onPaper, onClose }: { issue: Issue; onPaper: () => void; onClose: () => void }) {
  return <div className="report-panel">
    <p className="body-copy">Газета вышла {weekDate(issue.week)}. Город прочитал вашу первую полосу.</p>
    <div className="result-kpis"><div><span>Продано</span><strong>{number(issue.sold)}</strong><small>экземпляров</small></div><div><span>Прибыль</span><strong className={issue.profit >= 0 ? 'positive' : 'negative'}>{issue.profit >= 0 ? '+' : ''}{number(issue.profit)} $</strong><small>за выпуск</small></div></div>
    <div className="trust-result"><ShieldCheck size={24} /><span>Доверие читателей</span><strong>{issue.trustAfter}<small> / 100</small></strong><em className={issue.trustAfter >= issue.trustBefore ? 'positive' : 'negative'}>{issue.trustAfter >= issue.trustBefore ? '+' : ''}{issue.trustAfter - issue.trustBefore}</em></div>
    <div className="financial-report"><div><span>Продажи газет</span><strong>+{money(issue.ticket)}</strong></div><div><span>Реклама</span><strong>+{money(issue.adRevenue)}</strong></div><div><span>Печать</span><strong>−{money(issue.printCost)}</strong></div><div><span>Редакция и содержание</span><strong>−{money(issue.editorCost + issue.overhead)}</strong></div><div><span>Сбыт и проценты</span><strong>−{money(issue.distribution + issue.interest)}</strong></div><div className="total"><span>Теперь в кассе</span><strong>{money(issue.cash)}</strong></div></div>
    <h3>Где читали ваш номер</h3><div className="district-list">{issue.districts.map(d => <div key={d.id}><span>{d.name}</span><strong>{number(d.sold)} экз.</strong></div>)}</div>
    <div className="issue-rank">Место на газетном рынке <strong>№ {issue.rank}</strong></div>
    {issue.notes.map((text, i) => <p key={i} className="report-note">{text}</p>)}
    <div className="button-stack"><button className="primary-button" onClick={onPaper}>Развернуть газету<NewspaperClipping size={22} /></button><button className="secondary-button" onClick={onClose}>Вернуться в город<ArrowRight size={20} /></button></div>
  </div>;
}

export function ArchivePanel({ state, onIssue, onEditor }: { state: GameState; onIssue: (index: number) => void; onEditor: () => void }) {
  return state.history.length ? <div className="archive-list"><p className="body-copy">Здесь остаётся каждый опубликованный номер — с настоящими материалами и результатом.</p>{state.history.map((issue, index) => <button key={issue.week} className="archive-row" onClick={() => onIssue(index)}><img src="/assets/newspaper-thumb.webp" alt="" /><span><small>{weekDate(issue.week)} 1900 · №{String(issue.week).padStart(3, '0')}</small><strong>{issue.stories[issue.lead]}</strong><em>{number(issue.sold)} читателей · {issue.profit >= 0 ? '+' : ''}{money(issue.profit)}</em></span><ArrowUpRight size={20} /></button>)}</div> : <div className="empty-state"><NewspaperClipping size={48} /><h3>История начинается с первого номера</h3><p>После печати здесь появятся ваша первая полоса и результаты выпуска.</p><button className="primary-button" onClick={onEditor}>Подготовить первый номер<ArrowRight size={20} /></button></div>;
}

export function SettingsPanel({ state, act, onToast, onReset }: { state: GameState; act: Act; onToast: (text: string) => void; onReset: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const download = (raw: string, name: string) => {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
    document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const exportSave = () => {
    download(encodeSave(state), 'media-empire-' + state.history.length + '-issues.json');
    onToast('Файл партии подготовлен.');
  };
  return <div className="settings-panel">
    <div className="setting-row"><SpeakerHigh size={24} /><div><strong>Звуки города</strong><span>Бумага, типография и важные события</span></div><button className="toggle" role="switch" aria-checked={state.settings.sound} aria-label="Звук" onClick={() => act({ type: 'settings', key: 'sound', value: !state.settings.sound })}><span /></button></div>
    <div className="setting-row"><Users size={24} /><div><strong>Живой город</strong><span>Движение транспорта и анимация</span></div><button className="toggle" role="switch" aria-checked={state.settings.motion} aria-label="Анимация города" onClick={() => act({ type: 'settings', key: 'motion', value: !state.settings.motion })}><span /></button></div>
    <div className="setting-row"><Bell size={24} /><div><strong>Отклик на касание</strong><span>На устройствах с поддержкой вибрации</span></div><button className="toggle" role="switch" aria-checked={state.settings.haptics} aria-label="Виброотклик" onClick={() => act({ type: 'settings', key: 'haptics', value: !state.settings.haptics })}><span /></button></div>
    <p className="help">Движение и звук можно отключить. Настройки сохраняются вместе с партией.</p>
    <section className="settings-section"><p className="eyebrow">ВАША ПАРТИЯ</p><h3>Сохранить свою историю</h3><p className="body-copy">Игра сохраняется на этом устройстве. Экспорт переносит газеты, здания, расследования и настройки.</p><div className="button-stack"><button className="secondary-button" onClick={exportSave}><DownloadSimple size={20} />Скачать сохранение</button><button className="secondary-button" onClick={() => input.current?.click()}><UploadSimple size={20} />Загрузить сохранение</button></div><p className="help">Загрузка заменит текущую партию. Сначала сохраните её в файл.</p><input ref={input} hidden type="file" accept=".json,application/json" aria-label="Файл сохранения" onChange={async event => {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 2_000_000) throw new Error('Файл больше 2 МБ.');
        gameStore.import(await file.text()); onToast('Партия загружена целиком.');
      } catch (e) { onToast(e instanceof Error ? e.message : 'Не удалось открыть сохранение.'); }
      event.target.value = '';
    }} /></section>
    {gameStore.getRecovery() && <section className="settings-section"><h3>Исходные данные сохранены</h3><p className="body-copy">Предыдущее сохранение не открылось. Его исходный файл можно скачать отдельно.</p><button className="secondary-button" onClick={() => download(gameStore.getRecovery()!, 'media-empire-recovery.json')}><DownloadSimple size={20} />Скачать исходное сохранение</button></section>}
    <section className="settings-section"><p className="eyebrow">НОВАЯ ИСТОРИЯ</p>{resetConfirm ? <><p className="body-copy">Начать заново? Текущая партия на этом устройстве будет заменена. Скачайте её, если хотите сохранить.</p><div className="button-stack"><button className="danger-button" onClick={onReset}>Да, начать новую партию</button><button className="secondary-button" onClick={() => setResetConfirm(false)}>Оставить текущую</button></div></> : <button className="text-button danger-text" onClick={() => setResetConfirm(true)}>Начать новую партию</button>}</section>
    <p className="credits">MEDIA EMPIRE · Мобильная газетная стратегия<br />Белфорд, 1900</p>
  </div>;
}

export function EndingPanel({ state, onArchive, onReset }: { state: GameState; onArchive: () => void; onReset: () => void }) {
  const last = state.history.at(-1), won = state.status === 'complete' && last?.rank === 1 && state.trust >= 75;
  const verified = state.history.filter(h => h.dispatch?.verified).length;
  return <div className="ending-panel"><img src="/assets/newspaper-thumb.webp" alt="Номера вашей газеты" /><p className="eyebrow">{state.status === 'bankrupt' ? 'ПЕЧАТЬ ОСТАНОВЛЕНА' : won ? 'МИССИЯ ВЫПОЛНЕНА' : 'ГЛАВА ЗАВЕРШЕНА'}</p><h3>{state.status === 'bankrupt' ? 'Историю можно начать снова' : won ? 'Город прислушивается к вам' : 'Двенадцать недель в истории города'}</h3><p className="body-copy">{won ? '«Городской вестник» стал самым читаемым изданием Белфорда и сохранил доверие. Вы построили редакцию, у которой есть будущее.' : 'Каждый номер остался в архиве. Сравните решения, расходы и доверие — следующая партия может сложиться иначе.'}</p><div className="building-stats"><div><span>Выпущено газет</span><strong>{state.history.length} / 12</strong></div><div><span>Касса редакции</span><strong>{money(state.cash)}</strong></div><div><span>Читатели последнего номера</span><strong>{number(state.readers)}</strong></div><div><span>Доверие</span><strong>{state.trust} / 100</strong></div><div><span>Проверенные репортажи</span><strong>{verified}</strong></div><div><span>Место на рынке</span><strong>{last ? '№ ' + last.rank : '—'}</strong></div></div><div className="button-stack"><button className="primary-button" onClick={onArchive}>Прочитать свои газеты<NewspaperClipping size={20} /></button><button className="secondary-button" onClick={onReset}>Начать новую историю<ArrowRight size={20} /></button></div></div>;
}
