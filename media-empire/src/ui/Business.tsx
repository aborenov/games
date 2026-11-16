import { useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Hammer,
  Train,
  Boat,
  Buildings,
  Users,
} from "@phosphor-icons/react";
import { OFFERS, UPGRADES } from "../simulation/content";
import type { GameState, PlaceId } from "../simulation/types";
import type { Dispatch } from "./useGame";
import { count, money } from "./Chronicle";
export const FACTIONS = [
  {
    id: "workers" as const,
    name: "Рабочие",
    role: "Безопасность и условия труда",
    description: "Проверенные истории о фабрике дают людям голос.",
  },
  {
    id: "council" as const,
    name: "Городская управа",
    role: "Контракты и репутация власти",
    description: "Публикации о решениях управы меняют её отношение к редакции.",
  },
  {
    id: "merchants" as const,
    name: "Торговцы",
    role: "Клиенты и рекламные деньги",
    description:
      "Охват, торговля и выполненные обещания определяют сотрудничество.",
  },
];
export function Business({
  state,
  act,
  initialTab = "contracts",
}: {
  state: GameState;
  act: Dispatch;
  initialTab?: "contracts" | "upgrades" | "people";
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <div className="business">
      <div className="segmented three">
        <button
          onClick={() => setTab("contracts")}
          aria-pressed={tab === "contracts"}
        >
          Договоры
        </button>
        <button
          onClick={() => setTab("upgrades")}
          aria-pressed={tab === "upgrades"}
        >
          Развитие
        </button>
        <button
          onClick={() => setTab("people")}
          aria-pressed={tab === "people"}
        >
          Влияние
        </button>
      </div>
      {tab === "contracts" && (
        <>
          <p className="panel-intro">
            Соберите рекламный пакет: газета и городские площадки. Доход зависит
            от выполненных условий.
          </p>
          <div className="contract-list">
            {OFFERS.map((offer) => {
              const contract = state.contracts.find((c) => c.id === offer.id),
                locked = state.day < offer.unlockDay,
                active = contract?.status === "active";
              const Icon =
                offer.kind === "tram"
                  ? Train
                  : offer.kind === "river"
                    ? Boat
                    : Buildings;
              return (
                <section
                  className={
                    "contract-card " + (active ? "contract-active" : "")
                  }
                  key={offer.id}
                >
                  <div className="card-topline">
                    <span className="round-icon">
                      <Icon size={23} />
                    </span>
                    <span className={"status-label " + (active ? "good" : "")}>
                      {active
                        ? "В РАБОТЕ"
                        : contract?.status === "completed"
                          ? "ВЫПОЛНЕН"
                          : contract?.status === "failed"
                            ? "НЕ ВЫПОЛНЕН"
                            : locked
                              ? "С ВЫПУСКА " + offer.unlockDay
                              : "ДОСТУПЕН"}
                    </span>
                  </div>
                  <h3>{offer.title}</h3>
                  <p className="card-client">{offer.client}</p>
                  <p>{offer.description}</p>
                  <dl className="contract-terms">
                    <div>
                      <dt>Аренда и производство</dt>
                      <dd>{money(offer.cost)}</dd>
                    </div>
                    <div>
                      <dt>Срок</dt>
                      <dd>{offer.duration} выпуска</dd>
                    </div>
                    <div>
                      <dt>Целевой охват</dt>
                      <dd>{count(offer.target)}</dd>
                    </div>
                    <div>
                      <dt>При выполнении</dt>
                      <dd className="positive">+{money(offer.reward)}</dd>
                    </div>
                  </dl>
                  {active ? (
                    <div className="contract-progress">
                      <div>
                        <strong>
                          {count(contract.progress)} / {count(contract.target)}
                        </strong>
                        <span>осталось {contract.remaining} вып.</span>
                      </div>
                      <progress
                        max={contract.target}
                        value={Math.min(contract.target, contract.progress)}
                      />
                    </div>
                  ) : contract ? (
                    <p
                      className={
                        "contract-outcome " +
                        (contract.status === "completed"
                          ? "positive"
                          : "negative")
                      }
                    >
                      {contract.status === "completed"
                        ? "Обязательства выполнены. Выплата учтена в отчёте."
                        : "Условия не выполнены. Причина — в отчёте выпуска."}
                    </p>
                  ) : (
                    <button
                      className="button secondary"
                      disabled={
                        locked ||
                        state.cash < offer.cost ||
                        state.status !== "playing"
                      }
                      aria-label={"Заключить договор: " + offer.title}
                      onClick={() => act({ type: "contract", id: offer.id })}
                    >
                      Заключить · {money(offer.cost)}
                      <ArrowRight size={18} />
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
      {tab === "upgrades" && (
        <>
          <p className="panel-intro">
            Развитие меняет возможности редакции. Стройка завершается после
            выпуска и появляется в городе.
          </p>
          <div className="upgrade-list">
            {UPGRADES.map((u) => {
              const b = state.buildings[u.id];
              return (
                <section className="upgrade-card" key={u.id}>
                  <span className="round-icon">
                    {b.status === "open" ? (
                      <CheckCircle size={24} />
                    ) : b.status === "building" ? (
                      <Hammer size={24} />
                    ) : (
                      <Buildings size={24} />
                    )}
                  </span>
                  <div>
                    <h3>{u.title}</h3>
                    <p>{u.description}</p>
                    {b.status === "open" ? (
                      <span className="status-label good">РАБОТАЕТ</span>
                    ) : b.status === "building" ? (
                      <span className="construction-progress">
                        <Clock size={15} />
                        Откроется к выпуску №{b.readyDay}
                      </span>
                    ) : (
                      <button
                        className="button secondary"
                        disabled={
                          state.cash < u.cost || state.status !== "playing"
                        }
                        onClick={() => act({ type: "upgrade", id: u.id })}
                        aria-label={"Построить: " + u.title}
                      >
                        Начать · {money(u.cost)}
                        <ArrowRight size={17} />
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {tab === "people" && (
        <>
          <p className="panel-intro">
            Доверие читателей и отношение городских сил — разные вещи. Факты в
            газете меняют оба показателя.
          </p>
          <div className="faction-list">
            {FACTIONS.map((f) => (
              <section key={f.id}>
                <div className="faction-heading">
                  <Users size={22} />
                  <h3>{f.name}</h3>
                  <strong>
                    {state.factions[f.id]}
                    <small>/100</small>
                  </strong>
                </div>
                <p className="eyebrow">{f.role}</p>
                <progress max={100} value={state.factions[f.id]} />
                <p>{f.description}</p>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
export const placeNames: Record<PlaceId, string> = {
  newsroom: "Редакция",
  factory: "Текстильная фабрика",
  hall: "Городская управа",
  market: "Торговые ряды",
  station: "Вокзал",
  harbour: "Речной порт",
  tram: "Трамвайное общество",
  bank: "Банк",
  press: "Типография",
  kiosk: "Газетный киоск",
  park: "Городской сад",
};
