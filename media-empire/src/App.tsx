import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, ArrowsOutSimple, Bell, CheckCircle, GearSix, MapTrifold, NewspaperClipping, PenNib, Printer, ShieldCheck, Warning, X } from '@phosphor-icons/react';
import { CityMap } from './components/CityMap';
import { Sheet } from './components/Sheet';
import { Newspaper } from './components/Newspaper';
import { Editor } from './components/Editor';
import { ArchivePanel, BuildingPanel, CasePanel, EndingPanel, ReportPanel, SettingsPanel } from './components/Panels';
import { BUILDINGS, CASES, money, number, weekDate } from './game/content';
import { currentCase, draftIssue } from './game/model';
import type { Action } from './game/model';
import type { BuildingId, GameNotification, Sheet as SheetName } from './game/types';
import { gameStore } from './game/store';
import { setSound, sound } from './game/audio';

export default function App() {
  const state = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [building, setBuilding] = useState<BuildingId>('newsroom');
  const [caseId, setCaseId] = useState('fire');
  const [paper, setPaper] = useState<{ index: number | null; draft: boolean } | null>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(Date.now());
  const [publishing, setPublishing] = useState(false);
  const publishLock = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4200);
  }, []);
  const act = useCallback((action: Action) => {
    const result = gameStore.dispatch(action);
    if (result.error) { showToast(result.error); return; }
    const settings = gameStore.getSnapshot().settings;
    if (result.cue && action.type !== 'tick') {
      sound(result.cue);
      if (settings.haptics && typeof navigator.vibrate === 'function') navigator.vibrate(8);
    }
    if (action.type === 'borrow') showToast('Получено 500 $. Долг и проценты выросли.');
    if (action.type === 'repay') showToast('100 $ кредита погашено.');
  }, [showToast]);
  useEffect(() => { setSound(state.settings.sound); }, [state.settings.sound]);
  useEffect(() => {
    if (!state.reporter.readyAt) return;
    const timer = setInterval(() => {
      const clock = Date.now(); setNow(clock);
      const result = gameStore.dispatch({ type: 'tick', now: clock });
      if (result.cue) sound(result.cue);
    }, 150);
    return () => clearInterval(timer);
  }, [state.reporter.readyAt]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => {
    const focusTouchButton = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>('button');
      if (button && !button.disabled) button.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', focusTouchButton, true);
    return () => document.removeEventListener('pointerdown', focusTouchButton, true);
  }, []);
  useEffect(() => {
    document.title = 'MEDIA EMPIRE — Газетная империя';
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  const openEditor = useCallback(() => { setPaper(null); setSheet('editor'); }, []);
  const openBuilding = useCallback((id: BuildingId) => {
    if (id === 'newsroom') { setSheet('editor'); return; }
    setBuilding(id); setSheet('building'); sound('tap');
  }, []);
  const openPaper = useCallback((draft = false, index: number | null = null) => {
    setSheet(null); setPaper({ draft, index }); sound('paper');
  }, []);
  const openNotice = (note: GameNotification) => {
    if (note.action !== 'case') act({ type: 'dismiss', id: note.id });
    if (note.action === 'case') { setCaseId(note.caseId ?? currentCase(state) ?? 'fire'); setSheet('case'); }
    if (note.action === 'editor') openEditor();
    if (note.action === 'bank' || note.action === 'press' || note.action === 'lot') openBuilding(note.action);
    if (note.action === 'paper') openPaper();
    if (note.action === 'report') setSheet('report');
    if (note.action === 'ending') setSheet('ending');
  };
  const publish = () => {
    if (publishLock.current) return;
    publishLock.current = true;
    const result = gameStore.dispatch({ type: 'publish' });
    if (result.error) { showToast(result.error); publishLock.current = false; return; }
    sound('press');
    setSheet(null); setPublishing(true);
    setTimeout(() => { setPublishing(false); setSheet('report'); publishLock.current = false; }, state.settings.motion ? 850 : 50);
  };
  const reset = () => { gameStore.reset(); setPaper(null); setSheet(null); showToast('Новая редакция ждёт вас. Белфорд, 6 января 1900.'); };
  const pendingNotices = state.notifications.filter(n => !n.dismissed);
  const notice = pendingNotices.find(n => n.tone === 'good' && (n.action === 'lot' || n.action === 'press')) ?? pendingNotices[0];
  const last = state.history.at(-1);
  const displayedPaper = paper?.draft || !state.history.length ? draftIssue(state) : state.history[paper?.index ?? state.history.length - 1];
  const isDraft = paper?.draft === true || !state.history.length;
  const unread = state.notifications.filter(n => !n.dismissed).length;
  let title = '', eyebrow = '';
  if (sheet === 'editor') { title = 'Редакционный стол'; eyebrow = 'ВЫПУСК №' + String(Math.min(state.week, 12)).padStart(3, '0'); }
  if (sheet === 'case') { title = CASES.find(c => c.id === caseId)?.title ?? 'Городское событие'; eyebrow = 'БЛОКНОТ РЕПОРТЁРА'; }
  if (sheet === 'building') { title = BUILDINGS[building].title; eyebrow = BUILDINGS[building].eyebrow; }
  if (sheet === 'archive') { title = 'Газеты, которые меняли город'; eyebrow = 'АРХИВ РЕДАКЦИИ'; }
  if (sheet === 'settings') { title = 'Ваша редакция'; eyebrow = 'НАСТРОЙКИ И ПАРТИЯ'; }
  if (sheet === 'report') { title = 'Номер вышел!'; eyebrow = 'ОТЧЁТ ТИПОГРАФИИ · №' + String(last?.week ?? 1).padStart(3, '0'); }
  if (sheet === 'ending') { title = 'История вашей газеты'; eyebrow = 'БЕЛФОРД · 1900'; }
  if (sheet === 'events') { title = 'О чём говорит Белфорд'; eyebrow = 'ГОРОДСКИЕ СОБЫТИЯ'; }

  return <main className="game-app" data-motion={state.settings.motion ? 'on' : 'off'}>
    <CityMap state={state} onBuilding={openBuilding} />
    <header className="game-hud">
      <div className="brand"><NewspaperClipping size={24} weight="duotone" /><span>MEDIA <b>EMPIRE</b></span></div>
      <div className="hud-week"><small>Неделя</small><strong>{Math.min(state.week, 12)} <em>/ 12</em></strong></div>
      <div className="hud-money" aria-label={'Касса ' + money(state.cash)}>{money(state.cash)}</div>
      <div className="hud-trust" aria-label={'Доверие ' + state.trust + ' из 100'}><ShieldCheck size={16} /><strong>{state.trust}</strong></div>
      <button className="hud-gear" aria-label="Настройки игры" onClick={() => setSheet('settings')}><GearSix size={21} /></button>
    </header>
    <div className="city-heading"><h1>Белфорд <span>1900</span></h1><p>{weekDate(Math.min(state.week, 12)).toUpperCase()}</p><span className="heading-rule" /></div>
    {notice && !publishing && <aside className={'event-push ' + notice.tone} aria-label="Новое событие"><button onClick={() => openNotice(notice)} className="event-push-action">{notice.tone === 'good' ? <CheckCircle className="event-symbol" size={25} /> : notice.tone === 'urgent' ? <Warning className="event-symbol" size={27} weight="duotone" /> : <Bell className="event-symbol" size={24} />}<span><strong>{notice.title}</strong><small>{notice.body}</small></span><span className="event-arrow"><ArrowRight size={17} /></span></button></aside>}
    {state.reporter.readyAt && <button className="reporter-trip" onClick={() => { setCaseId(state.reporter.activeCase ?? 'fire'); setSheet('case'); }}><img src="/assets/reporter.webp" alt="" /><span>Репортёр в пути…</span><ArrowRight size={15} /></button>}
    <button className="city-events-button" aria-label={'Городские события, новых: ' + unread} onClick={() => setSheet('events')}><Bell size={20} weight="duotone" />{unread > 0 && <span>{unread}</span>}</button>
    <button className="newspaper-dock" onClick={() => openPaper()} aria-label={last ? 'Развернуть опубликованный выпуск №' + last.week : 'Развернуть макет газеты'}>
      <img src="/assets/newspaper-thumb.webp" alt="" /><span><strong>{last ? 'Выпуск №' + String(last.week).padStart(3, '0') : 'Макет №001'}</strong><small>Нажмите, чтобы развернуть</small></span><ArrowsOutSimple size={28} />
    </button>
    <nav className="bottom-nav" aria-label="Основные разделы"><button className={!sheet && !paper ? 'active' : ''} aria-current={!sheet && !paper ? 'page' : undefined} onClick={() => { setSheet(null); setPaper(null); }}><MapTrifold size={24} weight={!sheet && !paper ? 'duotone' : 'regular'} /><span>Город</span></button><button className={sheet === 'editor' ? 'active' : ''} onClick={openEditor}><PenNib size={25} /><span>Редакция</span></button><button className={paper ? 'active' : ''} onClick={() => openPaper()}><NewspaperClipping size={25} /><span>Газета</span></button></nav>
    <div className="screen-reader-status" role="status" aria-live="polite">{notice ? notice.title + '. ' + notice.body : ''}</div>
    {toast && !sheet && !paper && <div className="game-toast" role="status"><span>{toast}</span><button aria-label="Закрыть уведомление" onClick={() => setToast('')}><X size={18} /></button></div>}
    {gameStore.hasSaveError() && <div className="save-warning" role="alert">Не удалось сохранить партию. Скачайте её в настройках.</div>}
    {publishing && <div className="printing-overlay" role="status"><Printer size={54} weight="duotone" /><h2>Город ждёт газету</h2><p>Печатные машины набирают ход…</p></div>}
    {paper && <Newspaper issue={displayedPaper} draft={isDraft} onClose={() => setPaper(null)} onEditor={openEditor} />}
    {sheet && <Sheet key={sheet + (sheet === 'building' ? building : '')} title={title} eyebrow={eyebrow} onClose={() => setSheet(null)} className={sheet === 'report' ? 'report-sheet' : ''}>
      {toast && <div className="sheet-toast" role="status"><span>{toast}</span><button aria-label="Закрыть уведомление" onClick={() => setToast('')}><X size={18} /></button></div>}
      {sheet === 'editor' && <Editor state={state} act={act} onPublish={publish} onPaper={() => openPaper(true)} onBank={() => openBuilding('bank')} publishing={publishing} />}
      {sheet === 'case' && <CasePanel state={state} caseId={caseId} now={now} act={act} onEditor={openEditor} />}
      {sheet === 'building' && <BuildingPanel state={state} id={building} act={act} onEditor={openEditor} onClose={() => setSheet(null)} />}
      {sheet === 'archive' && <ArchivePanel state={state} onIssue={index => openPaper(false, index)} onEditor={openEditor} />}
      {sheet === 'settings' && <SettingsPanel state={state} act={act} onToast={showToast} onReset={reset} />}
      {sheet === 'report' && last && <ReportPanel issue={last} onPaper={() => openPaper()} onClose={() => setSheet(null)} />}
      {sheet === 'ending' && <EndingPanel state={state} onArchive={() => setSheet('archive')} onReset={() => setSheet('settings')} />}
      {sheet === 'events' && <div className="events-list"><section className="chapter-goal"><p className="eyebrow">ЦЕЛЬ ПЕРВОЙ ГЛАВЫ</p><h3>Голос, которому верит город</h3><p>Выпустите 12 номеров, станьте №1 по продажам и доведите доверие до 75.</p><div><span>{state.history.length} / 12 выпусков</span><span>Доверие {state.trust} / 75</span></div>{state.status !== 'playing' && <button className="secondary-button" onClick={() => setSheet('ending')}>Посмотреть итоги<ArrowRight size={18} /></button>}</section><button className="secondary-button" onClick={() => setSheet('archive')}><NewspaperClipping size={20} />Открыть архив газет</button>{state.notifications.map(note => <section key={note.id} className={'event-log ' + note.tone}><div><small>НЕДЕЛЯ {Math.min(note.week, 12)}</small><h3>{note.title}</h3><p>{note.body}</p></div><div className="event-log-actions"><button onClick={() => openNotice(note)}>Открыть<ArrowRight size={17} /></button>{!note.dismissed && <button onClick={() => act({ type: 'dismiss', id: note.id })} aria-label={'Прочитано: ' + note.title}><CheckCircle size={20} /></button>}</div></section>)}</div>}
    </Sheet>}
  </main>;
}
