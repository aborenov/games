import { useRef, useState } from "react";
import {
  ArrowRight,
  DownloadSimple,
  UploadSimple,
  Check,
} from "@phosphor-icons/react";
import { decodeSave, encodeSave } from "../simulation/persistence";
import { initialGame } from "../simulation/model";
import type { GameState } from "../simulation/types";
import {
  campaignVersion,
  type Dispatch,
  type CampaignVersion,
} from "./useGame";
export function download(raw: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function Settings({
  state,
  act,
  replace,
  notify,
  legacy,
  recovery,
}: {
  state: GameState;
  act: Dispatch;
  replace: (s: GameState, expected?: CampaignVersion) => boolean;
  notify: (text: string) => void;
  legacy?: string;
  recovery?: string;
}) {
  const file = useRef<HTMLInputElement>(null),
    [confirm, setConfirm] = useState<CampaignVersion | null>(null),
    pendingImport = useRef<CampaignVersion | null>(null);
  return (
    <div className="settings">
      <p className="panel-intro">
        Настройте город под себя. Партия сохраняется на этом устройстве.
      </p>
      {[
        {
          key: "sound" as const,
          name: "Звук",
          note: "Печать, бумага и важные действия",
        },
        {
          key: "motion" as const,
          name: "Движение города",
          note: "Камера, транспорт и эффекты",
        },
      ].map((s) => (
        <div className="settings-row" key={s.key}>
          <div>
            <strong>{s.name}</strong>
            <small>{s.note}</small>
          </div>
          <button
            className="switch"
            role="switch"
            aria-label={s.name}
            aria-checked={state.settings[s.key]}
            onClick={() =>
              act({
                type: "settings",
                key: s.key,
                value: !state.settings[s.key],
              })
            }
          >
            <span>{state.settings[s.key] && <Check size={12} />}</span>
          </button>
        </div>
      ))}
      <label className="settings-row">
        <div>
          <strong>Качество графики</strong>
          <small>Ниже нагрузка или более чёткие тени</small>
        </div>
        <select
          aria-label="Качество графики"
          value={state.settings.quality}
          onChange={(e) =>
            act({
              type: "settings",
              key: "quality",
              value: e.target.value as "auto" | "high" | "low",
            })
          }
        >
          <option value="auto">Авто</option>
          <option value="high">Высокое</option>
          <option value="low">Экономное</option>
        </select>
      </label>
      <section className="settings-section">
        <h3>Ваша история</h3>
        <p>
          Экспорт переносит материалы, договоры, здания и номера. Импорт заменит
          текущую партию; перед загрузкой сохраните её в файл.
        </p>
        <div className="action-row">
          <button
            className="button secondary"
            onClick={() => {
              download(
                encodeSave(state),
                "first-page-issue-" + state.day + ".json",
              );
              notify("Файл партии скачан.");
            }}
          >
            <DownloadSimple size={19} />
            Скачать
          </button>
          <button
            className="button secondary"
            onClick={() => {
              pendingImport.current = campaignVersion(state);
              file.current?.click();
            }}
          >
            <UploadSimple size={19} />
            Загрузить
          </button>
        </div>
        <input
          hidden
          ref={file}
          type="file"
          accept=".json,application/json"
          aria-label="Загрузить партию"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const expected = pendingImport.current ?? campaignVersion(state);
            pendingImport.current = null;
            try {
              if (f.size > 2_000_000) throw Error("Файл больше 2 МБ.");
              const next = decodeSave(await f.text());
              if (replace(next, expected)) notify("Партия загружена целиком.");
            } catch (error) {
              notify(
                error instanceof Error
                  ? error.message
                  : "Не удалось прочитать файл.",
              );
            }
            e.target.value = "";
          }}
        />
      </section>
      {legacy && (
        <section className="settings-section">
          <h3>Прежняя партия сохранена</h3>
          <p>
            Данные прежнего прототипа остаются на устройстве. Их можно скачать
            отдельно.
          </p>
          <button
            className="button secondary"
            onClick={() => download(legacy, "newspaper-previous-party.json")}
          >
            <DownloadSimple size={18} />
            Скачать прежнюю партию
          </button>
        </section>
      )}
      {recovery && (
        <section className="settings-section">
          <h3>Исходное сохранение</h3>
          <p>
            Файл не удалось открыть. Исходные данные доступны для
            восстановления.
          </p>
          <button
            className="button secondary"
            onClick={() => download(recovery, "first-page-recovery.json")}
          >
            Скачать исходный файл
          </button>
        </section>
      )}
      <section className="settings-section">
        <h3>Новая газета</h3>
        {confirm ? (
          <>
            <p>
              Начать заново? Сначала скачайте текущую партию, если хотите
              сохранить историю.
            </p>
            <div className="action-row">
              <button
                className="button danger"
                onClick={() => {
                  if (replace(initialGame(), confirm)) {
                    setConfirm(null);
                    notify("Новая редакция готова к первому выпуску.");
                  }
                }}
              >
                Начать новую партию
                <ArrowRight size={18} />
              </button>
              <button
                className="button secondary"
                onClick={() => setConfirm(null)}
              >
                Отмена
              </button>
            </div>
          </>
        ) : (
          <button
            className="text-button"
            onClick={() => setConfirm(campaignVersion(state))}
          >
            Начать новую партию
          </button>
        )}
      </section>
    </div>
  );
}
