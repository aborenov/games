import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSave, effects, encodeSave, forecast, reduceGame, starter, storiesFor, bankIsOpen, publicationBlock } from '../src/game/model.ts';
import type { Action } from '../src/game/model.ts';
import type { GameState } from '../src/game/types.ts';

function apply(s: GameState, action: Action): GameState {
  const result = reduceGame(s, action);
  assert.equal(result.error, undefined);
  return result.state;
}
function verifiedStory() {
  let s = starter();
  s = apply(s, { type: 'assign', id: 'fire', now: 1000 });
  s = apply(s, { type: 'tick', now: 5000 });
  s = apply(s, { type: 'clue', id: 'fire', clue: 'witness' });
  s = apply(s, { type: 'clue', id: 'fire', clue: 'evidence' });
  s = apply(s, { type: 'prepare', id: 'fire' });
  return s;
}
test('prepared reporting survives a full save round trip and rewards only publication', () => {
  const s = verifiedStory();
  assert.equal(s.trust, 60);
  const restored = decodeSave(encodeSave(s));
  assert.equal(storiesFor(restored)[0], 'Пожар на фабрике: город требует ответов');
  assert.deepEqual(restored.cases.fire, s.cases.fire);
  assert.equal(restored.reporter.actionsLeft, 1);
  const published = apply(restored, { type: 'publish' });
  assert.equal(published.history[0].stories[0], storiesFor(s)[0]);
  assert.equal(published.history[0].dispatch?.verified, true);
  assert.equal(published.cases.fire.published, true);
  assert.ok(published.trust > s.trust);
  assert.equal(reduceGame(published, { type: 'prepare', id: 'fire' }).state, published);
});
test('a reporting trip survives publication and can finish in the following week', () => {
  let s = apply(starter(), { type: 'assign', id: 'fire', now: 1000 });
  const arrival = s.reporter.readyAt;
  s = decodeSave(encodeSave(apply(s, { type: 'publish' })));
  assert.equal(s.reporter.activeCase, 'fire');
  assert.equal(s.reporter.readyAt, arrival);
  assert.equal(s.reporter.actionsLeft, 4);
  s = apply(s, { type: 'tick', now: 5000 });
  s = apply(s, { type: 'clue', id: 'fire', clue: 'witness' });
  s = apply(s, { type: 'clue', id: 'fire', clue: 'evidence' });
  s = apply(s, { type: 'prepare', id: 'fire' });
  assert.equal(s.headlineEdit?.verified, true);
});
test('an excluded prepared report can return to the edition and carry into the next week', () => {
  let s = verifiedStory();
  s = apply(s, { type: 'toggle-story', id: 0 });
  s = apply(s, { type: 'toggle-story', id: 6 });
  const returned = apply(s, { type: 'prepare', id: 'fire' });
  assert.ok(returned.selected.includes(0));
  assert.equal(returned.lead, 0);
  assert.equal(forecast(s, true).reportingTrust, 0);
  s = decodeSave(encodeSave(apply(s, { type: 'publish' })));
  assert.equal(s.history[0].dispatch, null);
  assert.equal(s.cases.fire.published, false);
  assert.equal(s.headlineEdit?.week, 2);
  assert.equal(s.headlineEdit?.caseId, 'fire');
  s = apply(s, { type: 'publish' });
  assert.equal(s.history[1].dispatch?.verified, true);
  assert.equal(s.cases.fire.published, true);
});
test('publication settles actual sales and every expense exactly once', () => {
  const s = starter(), expected = forecast(s, true);
  const next = apply(s, { type: 'publish' }), issue = next.history[0];
  assert.ok(issue.sold <= issue.printed);
  assert.equal(issue.profit, issue.ticket + issue.adRevenue - issue.printCost - issue.editorCost - issue.overhead - issue.interest - issue.distribution);
  assert.equal(next.cash, s.cash + expected.estimated);
  assert.equal(next.cash, issue.cash);
  assert.equal(next.week, 2);
  assert.equal(next.history.length, 1);
  assert.equal(s.history.length, 0);
});
test('the new kiosk appears only after its construction week and survives transfer', () => {
  let s = starter();
  s = apply(s, { type: 'buy-land' });
  s = apply(s, { type: 'build-kiosk' });
  assert.equal(s.cash, 2680);
  assert.equal(s.city.kiosk.status, 'building');
  assert.equal(effects(s).reachFactor, 1);
  s = apply(s, { type: 'publish' });
  assert.equal(s.city.kiosk.status, 'open');
  assert.equal(effects(s).reachFactor, 1.08);
  assert.deepEqual(decodeSave(encodeSave(s)).city, s.city);
});
test('the restored print works reduce real print expense after two issues', () => {
  let s = apply(starter(), { type: 'build-press' });
  s = apply(s, { type: 'publish' });
  assert.equal(s.city.press.status, 'building');
  s = apply(s, { type: 'publish' });
  assert.equal(s.city.press.status, 'open');
  const withPress = forecast(s).printCost;
  const without = structuredClone(s); without.city.press.status = 'locked';
  assert.ok(withPress < forecast(without).printCost);
  assert.equal(effects(s).printFactor, .81);
});
test('an unfunded issue does not create money or negative cash', () => {
  const s = starter();
  s.cash = 20; s.loan = 10000;
  const result = reduceGame(s, { type: 'publish' });
  assert.ok(result.error);
  assert.equal(result.state, s);
  assert.equal(result.state.cash, 20);
  assert.equal(result.state.history.length, 0);
  assert.ok(publicationBlock(s));
  assert.ok(reduceGame(s, { type: 'borrow' }).error);
});
test('invalid import cannot be accepted as a party', () => {
  const s = starter();
  assert.throws(() => decodeSave('{"format":"media-empire-mobile"}'));
  assert.throws(() => decodeSave('{not json'));
  const invalid = structuredClone(s); invalid.selected = [99];
  assert.throws(() => decodeSave(JSON.stringify(invalid)));
  const badCase = structuredClone(s); delete badCase.cases.fire;
  assert.throws(() => decodeSave(JSON.stringify(badCase)));
  const brokenArchive = apply(s, { type: 'publish' });
  const malformed = JSON.parse(encodeSave(brokenArchive));
  malformed.history[0].districts = [null];
  assert.throws(() => decodeSave(JSON.stringify(malformed)));
  const missingRevision = JSON.parse(encodeSave(s)); delete missingRevision.revision;
  assert.throws(() => decodeSave(JSON.stringify(missingRevision)));
  for (const field of ['status', 'channel', 'adPlan']) {
    const malformedEnum = JSON.parse(encodeSave(s));
    malformedEnum[field] = [malformedEnum[field]];
    assert.throws(() => decodeSave(JSON.stringify(malformedEnum)));
  }
  const inconsistent = JSON.parse(encodeSave(s)); inconsistent.week = 3;
  assert.throws(() => decodeSave(JSON.stringify(inconsistent)));
});
test('the full newspaper chapter has explicit bank closures and a final state', () => {
  let s = starter();
  while (s.week <= 12) {
    if (s.week === 4) s = apply(s, { type: 'investigation', value: 'publish' });
    if (s.week === 6) {
      assert.equal(bankIsOpen(s), false);
      assert.ok(reduceGame(s, { type: 'borrow' }).error);
    }
    if (s.week === 7) assert.equal(bankIsOpen(s), true);
    s = apply(s, { type: 'publish' });
    assert.ok(s.cash >= 0);
    assert.ok(s.history.at(-1)!.sold <= s.history.at(-1)!.printed);
  }
  assert.equal(s.week, 13);
  assert.equal(s.status, 'complete');
  assert.equal(s.history.length, 12);
  assert.ok(reduceGame(s, { type: 'publish' }).error);
  assert.deepEqual(decodeSave(encodeSave(s)), s);
});
