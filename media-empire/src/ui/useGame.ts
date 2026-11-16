import { useCallback, useEffect, useRef, useState } from "react";
import { initialGame, reduceGame } from "../simulation/model";
import { decodeSave, loadGame, saveGame } from "../simulation/persistence";
import type { Action, ActionResult, GameState } from "../simulation/types";
export type Dispatch = (action: Action) => ActionResult | undefined;
export interface CampaignVersion {
  campaignId: string;
  revision: number;
}
export const campaignVersion = (state: GameState): CampaignVersion => ({
  campaignId: state.campaignId,
  revision: state.revision,
});
const memoryWarning =
  "Не удалось сохранить игру. Партия работает в этой вкладке; скачайте её перед закрытием.";
export function useGame() {
  const [boot] = useState(() => loadGame()),
    [state, setState] = useState(boot.state),
    current = useRef(state);
  const [warning, setWarning] = useState(boot.error ?? ""),
    [conflict, setConflict] = useState(false),
    [toast, setToast] = useState("");
  current.current = state;
  const accept = useCallback((next: GameState) => {
    current.current = next;
    setState(next);
  }, []);
  const changed = useCallback(() => {
    setConflict(true);
    setToast("Партия изменилась. Закройте окно и нажмите «Обновить партию».");
  }, []);
  const act = useCallback<Dispatch>(
    (action) => {
      const before = current.current,
        result = reduceGame(before, action);
      if (result.error) {
        setToast(result.error);
        return;
      }
      const saved = saveGame(result.state, {
        expectedCampaignId: before.campaignId,
        expectedRevision: before.revision,
      });
      if (!saved) {
        let foreign = false,
          corrupt = false;
        try {
          const raw = localStorage.getItem("first-page-v2");
          if (raw) {
            try {
              const stored = decodeSave(raw);
              foreign =
                stored.campaignId !== before.campaignId ||
                stored.revision >= result.state.revision;
            } catch {
              corrupt = true;
            }
          }
        } catch {}
        if (foreign || corrupt) {
          changed();
          return;
        }
        setWarning(memoryWarning);
      }
      accept(result.state);
      return result;
    },
    [accept, changed],
  );
  const replace = useCallback(
    (
      next: GameState,
      expected: CampaignVersion = campaignVersion(current.current),
    ) => {
      const before = current.current;
      if (
        expected.campaignId !== before.campaignId ||
        expected.revision !== before.revision
      ) {
        changed();
        return false;
      }
      let raw: string | null = null,
        readable = true,
        stored: GameState | undefined;
      try {
        raw = localStorage.getItem("first-page-v2");
      } catch {
        readable = false;
      }
      if (readable && raw !== null) {
        try {
          stored = decodeSave(raw);
        } catch {
          if (raw !== boot.recovery) {
            changed();
            return false;
          }
        }
        if (
          stored &&
          (stored.campaignId !== expected.campaignId ||
            stored.revision !== expected.revision)
        ) {
          changed();
          return false;
        }
      }
      const fresh = {
        ...next,
        campaignId: initialGame().campaignId,
        revision: 0,
      };
      const saved =
        readable &&
        saveGame(fresh, {
          replace: true,
          expectedRaw: raw,
          ...(stored
            ? {
                expectedCampaignId: expected.campaignId,
                expectedRevision: expected.revision,
              }
            : {}),
        });
      if (!saved && readable) {
        changed();
        return false;
      }
      accept(fresh);
      setConflict(false);
      setWarning(saved ? "" : memoryWarning);
      return true;
    },
    [accept, boot.recovery, changed],
  );
  const sync = useCallback(() => {
    const next = loadGame();
    if (next.error) {
      setWarning(next.error);
      return;
    }
    accept(next.state);
    setConflict(false);
    setWarning("");
  }, [accept]);
  useEffect(() => {
    if (!boot.error) saveGame(current.current);
  }, [boot.error]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key !== "first-page-v2" || !e.newValue) return;
      try {
        const next = decodeSave(e.newValue);
        if (next.campaignId !== current.current.campaignId) {
          setConflict(true);
          return;
        }
        if (next.revision > current.current.revision) accept(next);
      } catch {
        setWarning(
          "Сохранение в другой вкладке повреждено. Текущая партия остаётся открытой.",
        );
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [accept]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __firstPage: state });
  }, [state]);
  return {
    state,
    act,
    replace,
    sync,
    warning,
    conflict,
    toast,
    setToast,
    legacy: boot.legacy,
    recovery: boot.recovery,
  };
}
