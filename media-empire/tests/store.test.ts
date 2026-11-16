import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSave, SAVE_KEY } from '../src/game/model.ts';

test('malformed enum import preserves the current party and its persisted bytes', async () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  } });
  const { gameStore } = await import('../src/game/store.ts');
  gameStore.dispatch({ type: 'set-price', value: .09 });
  const previous = gameStore.getSnapshot(), bytes = values.get(SAVE_KEY);
  const broken = JSON.parse(encodeSave(previous)); broken.status = ['playing'];
  assert.throws(() => gameStore.import(JSON.stringify(broken)));
  assert.equal(gameStore.getSnapshot(), previous);
  assert.equal(values.get(SAVE_KEY), bytes);
});
