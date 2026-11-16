import {
  ArrowRight,
  CheckCircle,
  NewspaperClipping,
  ShieldCheck,
  Users,
} from "@phosphor-icons/react";
import type { Edition, GameState, Story } from "../simulation/types";
export const money = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " $";
export const count = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
export const date = (day: number) =>
  new Date(Date.UTC(1900, 0, 6 + (day - 1) * 7))
    .toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
    .replace(/\s*г\.$/, "");
export const art = (story: Story) =>
  "/assets/editorial/" +
  (story.topic === "industry"
    ? "factory"
    : story.topic === "trade"
      ? "harbour"
      : "civic") +
  ".webp";
export function Paper({
  edition,
  stories,
  frontPage,
  day,
  draft = false,
}: {
  edition?: Edition;
  stories: Story[];
  frontPage: string | null;
  day: number;
  draft?: boolean;
}) {
  const lead = stories.find((s) => s.id === frontPage) ?? stories[0],
    others = stories.filter((s) => s.id !== lead?.id);
  return (
    <article className="paper-page">
      <div className="paper-topline">
        <span>НЕЗАВИСИМАЯ ГОРОДСКАЯ ГАЗЕТА</span>
        <span>БЕЛФОРД</span>
      </div>
      <h1 className="paper-masthead">
        Городской
        <br />
        вестник
      </h1>
      <div className="paper-meta">
        <span>{date(day)}</span>
        <span>№{String(day).padStart(3, "0")}</span>
        <span>
          {draft
            ? "МАКЕТ"
            : edition
              ? edition.price.toFixed(2) + " $"
              : "ПЕРВАЯ ПОЛОСА"}
        </span>
      </div>
      {lead ? (
        <>
          <h2 className="paper-headline">{lead.title}</h2>
          <p className="paper-deck">
            {lead.verified
              ? "Репортаж корреспондента «Городского вестника»"
              : "Краткий репортаж. Подробности ещё предстоит установить."}
          </p>
          <figure>
            <img src={art(lead)} alt="Редакционная иллюстрация к материалу" />
            <figcaption>Специально для «Городского вестника»</figcaption>
          </figure>
          <p className="paper-verified">
            {lead.verified ? (
              <>
                <CheckCircle size={16} />
                Проверено редакцией
              </>
            ) : (
              <>Короткая заметка · факты проверены частично</>
            )}
          </p>
          <p className="paper-copy">{lead.body}</p>
          <div className="paper-columns">
            {others.map((s) => (
              <section key={s.id}>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="paper-empty">
          <NewspaperClipping size={40} />
          <h2>Первая полоса пока чистая</h2>
          <p>
            Выберите городскую тему и отправьте корреспондента. В номер попадут
            только подготовленные материалы.
          </p>
        </div>
      )}
      <div className="paper-imprint">
        РЕДАКТОР — ВЫ · БЕЛФОРД, 1900 · СЛОВА МЕНЯЮТ ГОРОД
      </div>
    </article>
  );
}
export function Result({
  edition,
  state,
  onPaper,
  onCity,
}: {
  edition: Edition;
  state: GameState;
  onPaper: () => void;
  onCity: () => void;
}) {
  const delta = edition.trustAfter - edition.trustBefore;
  return (
    <div className="edition-result">
      <p className="result-intro">
        Ваша первая полоса уже на улицах. Вот что изменилось.
      </p>
      <div className="result-hero">
        <div>
          <span>Продано</span>
          <strong>{count(edition.sold)}</strong>
          <small>из {count(edition.printed)} экземпляров</small>
        </div>
        <div>
          <span>Полный результат</span>
          <strong className={edition.profit >= 0 ? "positive" : "negative"}>
            {edition.profit > 0 ? "+" : ""}
            {money(edition.profit)}
          </strong>
          <small>со всеми расходами выпуска</small>
        </div>
      </div>
      <div className="reaction-row">
        <ShieldCheck size={19} />
        <span>Доверие читателей</span>
        <strong>
          {edition.trustAfter}{" "}
          <em className={delta >= 0 ? "positive" : "negative"}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </em>
        </strong>
      </div>
      <div className="reaction-row">
        <Users size={19} />
        <span>Постоянная аудитория</span>
        <strong>{count(edition.readersAfter)}</strong>
      </div>
      <div className="result-notes">
        {[...edition.notes, ...edition.contractEvents].map((n, i) => (
          <p key={i}>
            <ArrowRight size={16} />
            <span>{n}</span>
          </p>
        ))}
      </div>
      <details className="ledger">
        <summary>Откуда деньги и расходы</summary>
        {[
          ["Продажи", edition.revenue],
          ["Рекламные договоры", edition.adRevenue],
          ["Печать", -edition.printCost],
          ["Репортажи", -edition.reportingCost],
          ["Работа и развитие", -edition.operatingCost],
          ["Доставка", -edition.deliveryCost],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <span>{label}</span>
            <strong>{money(Number(value))}</strong>
          </div>
        ))}
        <div className="ledger-total">
          <span>Сейчас в кассе</span>
          <strong>{money(state.cash)}</strong>
        </div>
      </details>
      <div className="action-row">
        <button className="button primary" onClick={onPaper}>
          Читать газету
          <NewspaperClipping size={19} />
        </button>
        <button className="button secondary" onClick={onCity}>
          Смотреть город
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
