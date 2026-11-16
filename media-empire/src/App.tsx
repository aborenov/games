import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowCounterClockwise,
  ArrowsClockwise,
  Bell,
  Briefcase,
  Check,
  CheckCircle,
  Clock,
  Compass,
  GearSix,
  MapTrifold,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  NewspaperClipping,
  PenNib,
  ShieldCheck,
  Users,
  X,
} from "@phosphor-icons/react";
import { CityCanvas } from "./city/CityCanvas";
import { PLACES } from "./city/places";
import type {
  CityHandle,
  CityMarker,
  CityPlaceId,
  CityView,
} from "./city/types";
import { leadsFor } from "./simulation/model";
import { REPORT_OPTIONS } from "./simulation/content";
import type { Depth, Edition, Lead } from "./simulation/types";
import { Panel } from "./ui/Panel";
import { useGame } from "./ui/useGame";
import { Desk } from "./ui/Desk";
import { Business, placeNames } from "./ui/Business";
import { Settings } from "./ui/Settings";
import { Paper, Result, count, date, money } from "./ui/Chronicle";
import { cue } from "./ui/audio";

type Screen =
  | "leads"
  | "lead"
  | "desk"
  | "business"
  | "paper"
  | "result"
  | "settings"
  | "places"
  | "place"
  | "archive"
  | "ending"
  | null;
const topics: Record<string, string> = {
  industry: "Промышленность",
  politics: "Власть",
  city: "Город",
  trade: "Торговля",
  culture: "Культура",
};
export default function App() {
  const game = useGame(),
    { state, act } = game;
  const [screen, setScreen] = useState<Screen>(null),
    [selected, setSelected] = useState<CityPlaceId | null>(null),
    [leadId, setLeadId] = useState<string | null>(null),
    [ready, setReady] = useState(false),
    [engineError, setEngineError] = useState(""),
    [printing, setPrinting] = useState(false),
    [draft, setDraft] = useState(false),
    [issueIndex, setIssueIndex] = useState<number | null>(null),
    [businessTab, setBusinessTab] = useState<
      "contracts" | "upgrades" | "people"
    >("contracts");
  const city = useRef<CityHandle>(null),
    printLock = useRef(false);
  const leads = useMemo(() => leadsFor(state), [state]),
    lead = leads.find((l) => l.id === leadId),
    story = state.stories.find((s) => s.leadId === lead?.id),
    last = state.history.at(-1),
    ended = state.status !== "playing";
  const close = useCallback(() => setScreen(null), []);
  const openLead = (l: Lead) => {
    setLeadId(l.id);
    setSelected(l.placeId);
    city.current?.focus(l.placeId);
    setScreen("lead");
  };
  const openBusiness = (
    tab: "contracts" | "upgrades" | "people" = "contracts",
  ) => {
    setBusinessTab(tab);
    setScreen("business");
  };
  const selectPlace = useCallback(
    (id: CityPlaceId) => {
      setSelected(id);
      city.current?.focus(id);
      const l = leads.find(
        (x) =>
          x.placeId === id && !state.stories.some((s) => s.leadId === x.id),
      );
      if (l) {
        setLeadId(l.id);
        setScreen("lead");
        return;
      }
      if (id === "newsroom") {
        setScreen("desk");
        return;
      }
      if (id === "press" || id === "kiosk") {
        setBusinessTab("upgrades");
        setScreen("business");
        return;
      }
      if (id === "tram" || id === "harbour") {
        setBusinessTab("contracts");
        setScreen("business");
        return;
      }
      setScreen("place");
    },
    [leads, state.stories],
  );
  const paper = (asDraft = false, index: number | null = null) => {
    setDraft(asDraft);
    setIssueIndex(index);
    setScreen("paper");
    cue("paper", state.settings.sound);
  };
  const report = (depth: Depth) => {
    if (!lead) return;
    const r = act({ type: "report", leadId: lead.id, depth });
    if (r) cue("report", state.settings.sound);
  };
  const publish = () => {
    if (printLock.current) return;
    printLock.current = true;
    const r = act({ type: "publish" });
    if (!r) {
      printLock.current = false;
      return;
    }
    cue("press", state.settings.sound);
    setScreen(null);
    setPrinting(true);
    setTimeout(
      () => {
        setPrinting(false);
        setScreen("result");
        printLock.current = false;
      },
      state.settings.motion ? 650 : 0,
    );
  };
  const revealResultInCity = () => {
    const effect = last?.stories.find((s) => s.effect)?.effect;
    let target: CityPlaceId | null = effect?.startsWith("factory")
      ? "factory"
      : effect?.startsWith("harbour")
        ? "harbour"
        : effect === "council-expose"
          ? "hall"
          : null;
    if (!target) {
      const completed = Object.entries(state.buildings).find(
        ([, b]) => b.status === "open" && b.readyDay === state.day,
      )?.[0];
      if (completed)
        target = completed === "desk" ? "newsroom" : (completed as CityPlaceId);
    }
    setScreen(null);
    setSelected(target);
    if (target) city.current?.focus(target);
    else city.current?.reset();
  };
  const view: CityView = useMemo(
    () => ({
      day: state.day,
      factory: state.world.factory,
      harbour: state.world.harbour,
      kiosk: state.buildings.kiosk.status,
      press: state.buildings.press.status,
      tramAd: state.contracts.some(
        (c) => c.kind === "tram" && c.status === "active",
      ),
      boatAd: state.contracts.some(
        (c) => c.kind === "river" && c.status === "active",
      ),
      motion: state.settings.motion,
      quality: state.settings.quality,
      dispatch: state.dispatch,
      publication: state.history.length,
    }),
    [state],
  );
  const markers: CityMarker[] = useMemo(() => {
    const m: CityMarker[] = [];
    for (const l of leads) {
      if (
        state.stories.some((s) => s.leadId === l.id) ||
        m.some((x) => x.id === l.placeId)
      )
        continue;
      m.push({
        id: l.placeId,
        label: placeNames[l.placeId],
        tone:
          l.placeId === "factory" &&
          state.world.factory === "fire" &&
          state.day === 1
            ? "urgent"
            : "news",
      });
    }
    if (!m.some((x) => x.id === "newsroom"))
      m.push({ id: "newsroom", label: "Редакция", tone: "selected" });
    if (selected) {
      const label =
        selected === "factory" && state.world.factory === "closed"
          ? "Фабрика остановлена"
          : placeNames[selected];
      const existing = m.find((x) => x.id === selected);
      if (existing) {
        existing.label = label;
        existing.tone = "selected";
      } else m.push({ id: selected, label, tone: "selected" });
    }
    return m;
  }, [leads, state.stories, state.world.factory, state.day, selected]);
  useEffect(() => {
    if ("serviceWorker" in navigator && !import.meta.env.DEV)
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  const actualEdition: Edition | undefined =
    issueIndex === null ? last : state.history[issueIndex];
  const paperStories =
    draft || !actualEdition ? state.stories : actualEdition.stories;
  const paperFront =
    draft || !actualEdition ? state.frontPage : actualEdition.frontPage;
  const preparedCount = state.history.reduce(
      (n, e) => n + e.stories.filter((s) => s.verified).length,
      0,
    ),
    goalReaders = 5000;
  const location = PLACES.find((p) => p.id === selected);
  const titles: Record<Exclude<Screen, null>, string> = {
    leads: "Город говорит",
    lead: lead?.title ?? "Городская история",
    desk: "Соберите завтрашний номер",
    business: "Газета становится делом",
    paper:
      draft || !actualEdition
        ? "Первая полоса"
        : "Выпуск №" + String(actualEdition.day).padStart(3, "0"),
    result: "Номер в городе",
    settings: "Ваша редакция",
    places: "Места в городе",
    place: location?.name ?? "Город",
    archive: "История вашей газеты",
    ending: state.status === "won" ? "Город вам верит" : "История редакции",
  };
  return (
    <main
      className="game"
      data-motion={state.settings.motion ? "on" : "off"}
      data-day={state.day}
    >
      <CityCanvas
        ref={city}
        view={view}
        selected={selected}
        markers={ended ? [] : markers}
        onSelect={selectPlace}
        onReady={() => setReady(true)}
        onError={setEngineError}
      />
      <header className="world-header">
        <div className="game-brand">
          <NewspaperClipping size={21} weight="duotone" />
          <div>
            <h1>Первая полоса</h1>
            <span>Белфорд · 1900</span>
          </div>
        </div>
        <div className="edition-counter">
          <span>ВЫПУСК</span>
          <strong>
            {Math.min(state.day, 12)}
            <small>/12</small>
          </strong>
        </div>
        <button
          className="icon-button settings-button"
          aria-label="Настройки"
          onClick={() => setScreen("settings")}
        >
          <GearSix size={23} />
        </button>
      </header>
      <div className="resource-bar" aria-label="Ресурсы редакции">
        <div>
          <span>Касса</span>
          <strong>{money(state.cash)}</strong>
        </div>
        <div>
          <span>
            <ShieldCheck size={13} />
            Доверие
          </span>
          <strong>
            {state.trust}
            <small>/100</small>
          </strong>
        </div>
        <div>
          <span>
            <Clock size={13} />
            Рабочее время
          </span>
          <strong>
            {state.hoursLeft}
            <small> ч</small>
          </strong>
        </div>
      </div>
      {!ready && !engineError && (
        <div className="world-loading">
          <NewspaperClipping size={35} />
          <strong>Белфорд просыпается</strong>
          <span>Открываем редакцию…</span>
        </div>
      )}
      {engineError && (
        <div className="engine-error" role="alert">
          <strong>Не удалось открыть город</strong>
          <p>{engineError}</p>
          <button className="button primary" onClick={() => locationReload()}>
            Повторить
          </button>
        </div>
      )}
      {!screen && !printing && (
        <div className="world-side-actions">
          <button
            className="icon-button"
            title="Бизнес и развитие"
            aria-label="Бизнес и развитие"
            onClick={() => openBusiness()}
          >
            <Briefcase size={21} />
            {state.contracts.some((c) => c.status === "active") && <i />}
          </button>
          <button
            className="icon-button"
            aria-label="Места в городе"
            onClick={() => setScreen("places")}
          >
            <Compass size={23} />
          </button>
        </div>
      )}
      {ready && !screen && !printing && (
        <>
          <div className="city-caption">
            <span className="eyebrow">{date(Math.min(state.day, 12))}</span>
            <p>
              {state.day === 2
                ? "Снег: уличная доставка до 2 600 копий"
                : state.world.factory === "fire"
                  ? state.day === 1
                    ? "В промышленном квартале пожар"
                    : "После пожара фабрика ждёт проверки"
                  : state.world.factory === "closed"
                    ? "Фабрика остановлена. Город ждёт ответов"
                    : state.world.harbour === "restricted"
                      ? "Порт ограничил работу"
                      : "Город меняется с каждым выпуском"}
            </p>
          </div>
          <div className="camera-controls" aria-label="Управление картой">
            <button
              className="icon-button"
              aria-label="Отдалить"
              onClick={() => city.current?.zoomBy(0.82)}
            >
              <MagnifyingGlassMinus size={21} />
            </button>
            <button
              className="icon-button"
              aria-label="Приблизить"
              onClick={() => city.current?.zoomBy(1.22)}
            >
              <MagnifyingGlassPlus size={21} />
            </button>
            <button
              className="icon-button"
              aria-label="Повернуть город"
              onClick={() => city.current?.rotate()}
            >
              <ArrowsClockwise size={21} />
            </button>
            <button
              className="icon-button"
              aria-label="Вернуть обзор"
              onClick={() => {
                city.current?.reset();
                setSelected(null);
              }}
            >
              <ArrowCounterClockwise size={20} />
            </button>
          </div>
          <section
            className={
              "mission-card " + (state.history.length ? "mission-compact" : "")
            }
          >
            {ended ? (
              <>
                <span className="eyebrow">ГЛАВА ЗАВЕРШЕНА</span>
                <h2>
                  {state.status === "won"
                    ? "Ваш голос услышал город"
                    : "Двенадцать номеров. Ваша история."}
                </h2>
                <button
                  className="mission-action"
                  onClick={() => setScreen("ending")}
                >
                  Посмотреть итоги
                  <ArrowRight size={19} />
                </button>
              </>
            ) : state.stories.length ? (
              <>
                <span className="eyebrow">
                  РЕДАКЦИЯ В РАБОТЕ · {state.stories.length}/3 МАТЕРИАЛА
                </span>
                <h2>
                  {state.hoursLeft
                    ? "Ещё одна история или рекламный договор?"
                    : "Время собрать первую полосу"}
                </h2>
                <button
                  className="mission-action"
                  onClick={() => setScreen("desk")}
                >
                  Собрать номер
                  <ArrowRight size={20} />
                </button>
              </>
            ) : (
              <>
                <span className="eyebrow">
                  {state.history.length ? "НОВЫЙ ВЫПУСК" : "ПЕРВЫЙ ВЫПУСК"}
                </span>
                <h2>
                  {state.history.length
                    ? "У города новые истории"
                    : "Три истории. Восемь часов."}
                </h2>
                <p>
                  {state.history.length
                    ? "Решите, что попадёт на первую полосу."
                    : "Выберите, о чём узнает город. На всё времени не хватит."}
                </p>
                <button
                  className="mission-action"
                  onClick={() => setScreen("leads")}
                >
                  Выбрать тему
                  <ArrowRight size={20} />
                </button>
              </>
            )}
          </section>
        </>
      )}
      <nav className="game-nav" aria-label="Разделы игры">
        <button
          className={!screen ? "active" : ""}
          aria-label="Город"
          onClick={close}
        >
          <MapTrifold size={23} />
          <span>Город</span>
        </button>
        <button
          className={screen === "leads" || screen === "lead" ? "active" : ""}
          aria-label="Темы"
          onClick={() => setScreen("leads")}
        >
          <Bell size={22} />
          <span>Темы</span>
          {!ended && (
            <b>
              {
                leads.filter(
                  (l) => !state.stories.some((s) => s.leadId === l.id),
                ).length
              }
            </b>
          )}
        </button>
        <button
          className={screen === "desk" ? "active" : ""}
          aria-label="Редакция"
          onClick={() => setScreen("desk")}
        >
          <PenNib size={22} />
          <span>Редакция</span>
        </button>
        <button
          className={screen === "paper" ? "active" : ""}
          aria-label="Газета"
          onClick={() => paper(state.history.length === 0)}
        >
          <NewspaperClipping size={23} />
          <span>Газета</span>
        </button>
      </nav>
      {(game.warning || game.conflict) && (
        <div className="save-banner" role="alert">
          <span>
            {game.conflict
              ? "Партия изменилась в другой вкладке."
              : game.warning}
          </span>
          <button
            onClick={game.conflict ? game.sync : () => setScreen("settings")}
          >
            {game.conflict ? "Обновить партию" : "Открыть настройки"}
          </button>
        </div>
      )}
      {game.toast && !screen && (
        <div className="toast" role="status">
          <span>{game.toast}</span>
          <button
            className="icon-button"
            aria-label="Убрать уведомление"
            onClick={() => game.setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {printing && (
        <div className="print-transition" role="status">
          <div className="flying-edition">
            <NewspaperClipping size={42} />
          </div>
          <strong>Свежий номер идёт в город</strong>
        </div>
      )}
      {screen && (
        <Panel
          key={
            screen +
            (screen === "lead" ? leadId : "") +
            (screen === "business" ? businessTab : "")
          }
          title={titles[screen]}
          kicker={
            screen === "result" && last
              ? `ОПУБЛИКОВАН №${String(last.day).padStart(3, "0")} · ${date(last.day)}`
              : screen === "lead" && lead
                ? placeNames[lead.placeId]
                : screen === "paper"
                  ? "ГОРОДСКОЙ ВЕСТНИК"
                  : `ВЫПУСК №${String(Math.min(state.day, 12)).padStart(3, "0")} · ${count(state.readers)} ЧИТАТЕЛЕЙ`
          }
          onClose={close}
          className={
            screen === "paper"
              ? "paper-panel"
              : screen === "desk"
                ? "composer-panel"
                : screen === "leads"
                  ? "leads-panel"
                  : ""
          }
        >
          {game.toast && (
            <div className="panel-notice" role="status">
              <span>{game.toast}</span>
              <button
                className="icon-button"
                aria-label="Убрать уведомление"
                onClick={() => game.setToast("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {screen === "leads" && (
            <>
              <p className="panel-intro">
                В городе три темы, у редакции {state.hoursLeft} рабочих часов.
                Выберите, что важнее сейчас.
              </p>
              <div className="lead-list">
                {leads.map((l) => {
                  const done = state.stories.some((s) => s.leadId === l.id);
                  return (
                    <button
                      className={"lead-card " + (done ? "lead-done" : "")}
                      key={l.id}
                      aria-label={"Тема: " + l.title}
                      onClick={() => openLead(l)}
                    >
                      <img
                        src={
                          "/assets/editorial/" +
                          (l.topic === "industry"
                            ? "factory"
                            : l.topic === "trade"
                              ? "harbour"
                              : "civic") +
                          ".webp"
                        }
                        alt=""
                      />
                      <div>
                        <span className="eyebrow">{placeNames[l.placeId]}</span>
                        <h3>{l.title}</h3>
                        <p>{l.summary}</p>
                        <span className="lead-meta">
                          {done ? (
                            <>
                              <CheckCircle size={15} />В редакции
                            </>
                          ) : (
                            <>
                              <Clock size={15} />2 или 4 часа
                              <ArrowRight size={17} />
                            </>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="quiet-note">
                Для победы: 12 выпусков, 5 000 читателей, доверие 70 и шесть
                проверенных публикаций.
              </p>
            </>
          )}
          {screen === "lead" && lead && (
            <div className="lead-detail">
              {story ? (
                <>
                  <span className="ready-stamp">
                    <CheckCircle size={25} />
                  </span>
                  <h3>Материал готов</h3>
                  <h4>{story.title}</h4>
                  <p>{story.body}</p>
                  <div className="evidence-label">
                    {story.verified ? (
                      <>
                        <ShieldCheck size={17} />
                        Проверенный репортаж
                      </>
                    ) : (
                      <>Краткая заметка · ограниченная проверка</>
                    )}
                  </div>
                  <p className="quiet-note">
                    Последствия для города наступят, когда вы напечатаете
                    историю.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => setScreen("desk")}
                  >
                    Поставить в номер
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                <>
                  <img
                    className="lead-art"
                    src={
                      "/assets/editorial/" +
                      (lead.topic === "industry"
                        ? "factory"
                        : lead.topic === "trade"
                          ? "harbour"
                          : "civic") +
                      ".webp"
                    }
                    alt="Редакционная иллюстрация"
                  />
                  <p className="lead-summary">{lead.summary}</p>
                  <div className="stakes">
                    <span className="eyebrow">НА КОНУ</span>
                    <p>{lead.stakes}</p>
                  </div>
                  <div className="report-choices">
                    {(["brief", "verified"] as const).map((depth) => {
                      const option = REPORT_OPTIONS[depth];
                      return (
                        <button
                          key={depth}
                          className={"report-choice " + depth}
                          aria-label={option.label}
                          disabled={
                            state.hoursLeft < option.hours ||
                            state.cash < option.cost ||
                            ended
                          }
                          onClick={() => report(depth)}
                        >
                          <span>
                            <strong>{option.label}</strong>
                            <small>
                              {depth === "verified"
                                ? "Больше фактов и влияния. Меньше времени на другие темы."
                                : "Быстро сообщить новость. Часть вопросов останется открытой."}
                            </small>
                          </span>
                          <b>
                            {option.hours} ч<small>{money(option.cost)}</small>
                          </b>
                        </button>
                      );
                    })}
                  </div>
                  <p className="quiet-note">
                    {state.hoursLeft} ч и {money(state.cash)} в распоряжении
                    редакции.
                  </p>
                </>
              )}
            </div>
          )}
          {screen === "desk" && (
            <Desk
              state={state}
              act={act}
              onPublish={publish}
              onPaper={() => paper(true)}
              onLeads={() => setScreen("leads")}
            />
          )}
          {screen === "business" && (
            <Business state={state} act={act} initialTab={businessTab} />
          )}
          {screen === "paper" && (
            <>
              <Paper
                edition={!draft ? actualEdition : undefined}
                stories={paperStories}
                frontPage={paperFront}
                day={draft || !actualEdition ? state.day : actualEdition.day}
                draft={draft || !actualEdition}
              />
              <div className="paper-actions">
                <button
                  className="button secondary"
                  onClick={() => setScreen("desk")}
                >
                  Вернуться в редакцию
                  <PenNib size={18} />
                </button>
                {state.history.length > 0 && (
                  <button
                    className="text-button"
                    onClick={() => setScreen("archive")}
                  >
                    Все опубликованные номера
                  </button>
                )}
              </div>
            </>
          )}
          {screen === "result" && last && (
            <Result
              edition={last}
              state={state}
              onPaper={() => paper()}
              onCity={revealResultInCity}
            />
          )}
          {screen === "settings" && (
            <Settings
              state={state}
              act={act}
              replace={(s, expected) => {
                const okay = game.replace(s, expected);
                if (okay) {
                  setSelected(null);
                  setLeadId(null);
                  city.current?.reset();
                }
                return okay;
              }}
              notify={game.setToast}
              legacy={game.legacy}
              recovery={game.recovery}
            />
          )}
          {screen === "places" && (
            <>
              <p className="panel-intro">
                Двигайте город одним пальцем, приближайте двумя. Выберите место,
                чтобы сразу открыть его дела.
              </p>
              <div className="places-grid">
                {PLACES.map((p) => (
                  <button key={p.id} onClick={() => selectPlace(p.id)}>
                    <span>{p.name}</span>
                    <small>{p.district}</small>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
            </>
          )}
          {screen === "place" && location && (
            <div className="place-detail">
              <span className="eyebrow">{location.district}</span>
              <h3>
                {selected === "factory"
                  ? state.world.factory === "fire"
                    ? state.day === 1
                      ? "На фабрике пожар"
                      : "Фабрика после пожара"
                    : state.world.factory === "closed"
                      ? "Фабрика остановлена"
                      : "Фабрика работает"
                  : selected === "harbour"
                    ? state.world.harbour === "restricted"
                      ? "Судоходство ограничено"
                      : "Порт открыт"
                    : location.name}
              </h3>
              <p>{location.description}</p>
              <div className="owner-card">
                <span>Кто управляет</span>
                <strong>{location.owner}</strong>
              </div>
              <h4>Что может редакция</h4>
              <p>
                Найдите городскую тему, напечатайте проверенную историю или
                развивайте дело через рекламу.
              </p>
              <div className="action-row">
                <button
                  className="button primary"
                  onClick={() => setScreen("leads")}
                >
                  Городские темы
                  <ArrowRight size={18} />
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    openBusiness(selected === "hall" ? "people" : "contracts")
                  }
                >
                  {selected === "hall" ? "Влияние" : "Реклама"}
                </button>
              </div>
            </div>
          )}
          {screen === "archive" && (
            <div className="archive-list">
              {state.history.map((e, i) => (
                <button key={e.day} onClick={() => paper(false, i)}>
                  <span className="archive-number">
                    {String(e.day).padStart(2, "0")}
                  </span>
                  <div>
                    <small>
                      {date(e.day)} · {count(e.sold)} читателей
                    </small>
                    <strong>{e.title}</strong>
                  </div>
                  <ArrowRight size={19} />
                </button>
              ))}
            </div>
          )}
          {screen === "ending" && (
            <div className="ending">
              <NewspaperClipping size={42} />
              <h3>
                {state.status === "won"
                  ? "Вы создали голос города"
                  : state.status === "bankrupt"
                    ? "Типография остановлена"
                    : "У каждого номера есть последствия"}
              </h3>
              <p>
                За вашими цифрами — материалы, читатели и решения. Сравните, чем
                стала редакция.
              </p>
              <div className="goal-list">
                {[
                  ["Номера", state.history.length, 12],
                  ["Постоянные читатели", state.readers, goalReaders],
                  ["Доверие", state.trust, 70],
                  ["Проверенные истории", preparedCount, 6],
                ].map(([label, v, target]) => (
                  <div key={String(label)}>
                    <span>{label}</span>
                    <strong>
                      {count(Number(v))}
                      <small> / {count(Number(target))}</small>
                    </strong>
                    {Number(v) >= Number(target) && <Check size={17} />}
                  </div>
                ))}
              </div>
              <div className="action-row">
                <button
                  className="button primary"
                  onClick={() => setScreen("archive")}
                >
                  Читать свои номера
                  <ArrowRight size={18} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => setScreen("settings")}
                >
                  Новая история
                </button>
              </div>
            </div>
          )}
        </Panel>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {state.notices[0] ?? ""}
      </div>
    </main>
  );
}
function locationReload() {
  window.location.reload();
}
