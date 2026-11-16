import { useState } from "react";
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  Star,
  Printer,
  Eye,
} from "@phosphor-icons/react";
import { forecast, publicationBlock } from "../simulation/model";
import type { GameState, Delivery } from "../simulation/types";
import type { Dispatch } from "./useGame";
import { count, money } from "./Chronicle";
export function Desk({
  state,
  act,
  onPublish,
  onPaper,
  onLeads,
}: {
  state: GameState;
  act: Dispatch;
  onPublish: () => void;
  onPaper: () => void;
  onLeads: () => void;
}) {
  const [tab, setTab] = useState<"stories" | "print">("stories"),
    f = forecast(state),
    block = publicationBlock(state);
  const delivery: { id: Delivery; title: string; note: string }[] = [
    { id: "street", title: "Газетчики", note: "Без аренды" },
    {
      id: "kiosk",
      title: "Свой киоск",
      note:
        state.buildings.kiosk.status === "open"
          ? "Местная аудитория"
          : "Нужен киоск",
    },
    { id: "subscription", title: "Подписчики", note: "Постоянные читатели" },
  ];
  return (
    <div className="desk">
      <div className="segmented" role="tablist" aria-label="Подготовка номера">
        <button
          role="tab"
          aria-selected={tab === "stories"}
          onClick={() => setTab("stories")}
        >
          Первая полоса <span>{state.stories.length}/3</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "print"}
          onClick={() => setTab("print")}
        >
          Печать и доставка
        </button>
      </div>
      {tab === "stories" ? (
        <>
          <div className="desk-paper">
            <span className="eyebrow">
              ГОРОДСКОЙ ВЕСТНИК · №{String(state.day).padStart(3, "0")}
            </span>
            <h3>
              {state.stories.find((s) => s.id === state.frontPage)?.title ??
                "Какая история станет главной?"}
            </h3>
            <p>
              {state.stories.length
                ? "Звезда выбирает материал для первой полосы. Главная тема сильнее влияет на аудиторию."
                : "Сначала получите материал. Газету нельзя выпустить из готовых заголовков."}
            </p>
          </div>
          <div className="gathered-stories">
            {state.stories.map((s) => (
              <button
                key={s.id}
                className={
                  "gathered-story " +
                  (state.frontPage === s.id ? "is-lead" : "")
                }
                aria-pressed={state.frontPage === s.id}
                onClick={() => act({ type: "front-page", id: s.id })}
              >
                <span className="story-status">
                  {s.verified ? <Check size={17} /> : <span>!</span>}
                </span>
                <span>
                  <small>
                    {s.verified ? "Проверенный репортаж" : "Короткая заметка"}
                  </small>
                  <strong>{s.title}</strong>
                </span>
                <Star
                  size={21}
                  weight={state.frontPage === s.id ? "fill" : "regular"}
                />
              </button>
            ))}
            {state.stories.length < 3 && (
              <button className="empty-slot" onClick={onLeads}>
                <Plus size={20} />
                <span>
                  Найти ещё одну историю
                  <small>Осталось {state.hoursLeft} рабочих часов</small>
                </span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="print-settings">
          <div className="setting-block">
            <label>
              Тираж <strong>{count(state.printed)} экз.</strong>
            </label>
            <div className="stepper">
              <button
                className="icon-button"
                aria-label="Меньше экземпляров"
                onClick={() =>
                  act({ type: "print-run", value: state.printed - 500 })
                }
              >
                <Minus size={20} />
              </button>
              <input
                aria-label="Тираж"
                type="range"
                min="1000"
                max="8000"
                step="500"
                value={state.printed}
                onChange={(e) =>
                  act({ type: "print-run", value: Number(e.target.value) })
                }
              />
              <button
                className="icon-button"
                aria-label="Больше экземпляров"
                onClick={() =>
                  act({ type: "print-run", value: state.printed + 500 })
                }
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="setting-block">
            <label>
              Цена номера <strong>{state.price.toFixed(2)} $</strong>
            </label>
            <div className="price-options">
              {[0.1, 0.16, 0.22].map((p) => (
                <button
                  key={p}
                  className={state.price === p ? "selected" : ""}
                  aria-pressed={state.price === p}
                  onClick={() => act({ type: "price", value: p })}
                >
                  {p.toFixed(2)} $
                  <small>
                    {p === 0.1
                      ? "Доступная"
                      : p === 0.16
                        ? "Обычная"
                        : "Дорогая"}
                  </small>
                </button>
              ))}
            </div>
          </div>
          <div className="setting-block">
            <label>Кто доставит газету</label>
            <div className="delivery-options">
              {delivery.map((d) => (
                <button
                  key={d.id}
                  className={state.delivery === d.id ? "selected" : ""}
                  aria-pressed={state.delivery === d.id}
                  disabled={
                    d.id === "kiosk" && state.buildings.kiosk.status !== "open"
                  }
                  onClick={() => act({ type: "delivery", value: d.id })}
                >
                  <strong>{d.title}</strong>
                  <small>{d.note}</small>
                  {state.delivery === d.id && <Check size={17} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="forecast-card">
        <div>
          <span>Ожидаемые продажи</span>
          <strong>≈ {count(f.sold)}</strong>
        </div>
        <div>
          <span>Полный результат</span>
          <strong className={f.profit >= 0 ? "positive" : "negative"}>
            {f.profit > 0 ? "+" : ""}
            {money(f.profit)}
          </strong>
        </div>
      </div>
      {f.warnings.map((w, i) => (
        <p key={i} className="warning-note">
          {w}
        </p>
      ))}
      <div className="desk-bottom">
        <p>
          {block ??
            `До печати оплатить ${money(f.prepay)}. Материалы и покупки уже учтены.`}
        </p>
        <div className="action-row">
          <button
            className="button secondary"
            onClick={onPaper}
            aria-label="Открыть макет"
          >
            <Eye size={19} />
            Макет
          </button>
          <button
            className="button primary"
            onClick={onPublish}
            disabled={!!block}
          >
            Напечатать номер
            <Printer size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
