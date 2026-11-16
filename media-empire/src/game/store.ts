import { decodeSave, encodeSave, reduceGame, SAVE_KEY, starter } from './model';
import type { Action, Result } from './model';
import type { GameState } from './types';

const RECOVERY_KEY = SAVE_KEY + '-recovery';
let recoveryRaw: string | null = null;
let recoverySaved = true;
function load(): GameState {
  try {
    recoveryRaw = localStorage.getItem(RECOVERY_KEY);
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try { return decodeSave(raw); }
      catch {
        recoveryRaw = raw; recoverySaved = false;
        try { localStorage.setItem(RECOVERY_KEY, raw); recoverySaved = true; } catch { /* Keep the original until a backup can be written. */ }
      }
    }
  } catch { /* Storage can be unavailable; the player can still export a party. */ }
  return starter();
}
let state = load();
const listeners = new Set<() => void>();
let saveError = false;
const emit = () => listeners.forEach(fn => fn());

function persist(next: GameState) {
  try {
    if (recoveryRaw && !recoverySaved) { localStorage.setItem(RECOVERY_KEY, recoveryRaw); recoverySaved = true; }
    localStorage.setItem(SAVE_KEY, encodeSave(next)); saveError = false;
  }
  catch { saveError = true; }
}
export const gameStore = {
  getSnapshot: () => state,
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  dispatch(action: Action): Result {
    const result = reduceGame(state, action);
    if (result.state !== state) {
      state = result.state;
      persist(state);
      emit();
    }
    return result;
  },
  reset() {
    const settings = state.settings;
    state = starter(); state.settings = settings;
    persist(state); emit();
  },
  import(raw: string) {
    const candidate = decodeSave(raw);
    state = candidate; persist(state); emit();
  },
  save() { persist(state); },
  hasSaveError: () => saveError,
  getRecovery: () => recoveryRaw,
};

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => gameStore.save());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') gameStore.save(); });
  window.addEventListener('storage', event => {
    if (event.key !== SAVE_KEY || !event.newValue) return;
    try {
      const next = decodeSave(event.newValue);
      if (next.revision > state.revision) { state = next; emit(); }
    } catch { /* Ignore invalid writes from another tab. */ }
  });
}
