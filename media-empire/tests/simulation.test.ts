import test from "node:test";
import assert from "node:assert/strict";
import {
  initialGame,
  leadsFor,
  forecast,
  publicationBlock,
  reduceGame,
} from "../src/simulation/model.ts";
import { REPORT_OPTIONS, OFFERS } from "../src/simulation/content.ts";
import {
  encodeSave,
  decodeSave,
  loadGame,
  saveGame,
} from "../src/simulation/persistence.ts";
import type { Action, GameState, Depth } from "../src/simulation/types.ts";

function apply(s: GameState, action: Action): GameState {
  const result = reduceGame(s, action);
  assert.equal(result.error, undefined);
  return result.state;
}
function report(s: GameState, index = 0, depth: Depth = "verified"): GameState {
  return apply(s, { type: "report", leadId: leadsFor(s)[index].id, depth });
}
function publishDay(s: GameState): GameState {
  return apply(report(report(s, 0), 1), { type: "publish" });
}

test("an empty issue cannot advance the campaign or earn money", () => {
  const s = initialGame(),
    r = reduceGame(s, { type: "publish" });
  assert.equal(s.stories.length, 0);
  assert.equal(leadsFor(s).length, 3);
  assert.ok(publicationBlock(s));
  assert.ok(r.error);
  assert.equal(r.state, s);
  assert.equal(s.history.length, 0);
  assert.equal(s.day, 1);
});
test("reporting competes for eight hours and charges each story only once", () => {
  const start = initialGame(),
    one = report(start),
    two = report(one, 1);
  assert.equal(one.hoursLeft, 4);
  assert.equal(two.hoursLeft, 0);
  assert.equal(two.cash, start.cash - 120);
  assert.equal(two.reportingSpent, 120);
  const duplicate = reduceGame(one, {
    type: "report",
    leadId: one.stories[0].leadId,
    depth: "brief",
  });
  assert.ok(duplicate.error);
  assert.equal(duplicate.state, one);
  const third = reduceGame(two, {
    type: "report",
    leadId: leadsFor(two)[2].id,
    depth: "brief",
  });
  assert.ok(third.error);
  assert.equal(third.state, two);
  assert.equal(REPORT_OPTIONS.brief.hours, 2);
});
test("front page selection changes audience before the issue is printed", () => {
  let s = report(report(initialGame(), 0), 2, "brief");
  s = apply(s, { type: "print-run", value: 7000 });
  const first = forecast(s);
  const second = forecast(
    apply(s, { type: "front-page", id: s.stories[1].id }),
  );
  assert.notEqual(first.reach, second.reach);
  assert.notEqual(first.sold, second.sold);
  assert.equal(s.history.length, 0);
});
test("flood delivery capacity is explained before printing and applies only to street sales", () => {
  let s = initialGame();
  for (let day = 1; day <= 6; day++) s = publishDay(s);
  s = report(report(s), 1);
  s = apply(s, { type: "print-run", value: 5000 });
  const street = forecast(s);
  assert.equal(street.sold, 3200);
  assert.ok(street.warnings.some((w) => w.includes("3 200")));
  const home = forecast(apply(s, { type: "delivery", value: "subscription" }));
  assert.ok(home.sold > 3200);
  assert.ok(!home.warnings.some((w) => w.includes("3 200")));
});
test("world and faction effects require an actually printed verified story", () => {
  const s = initialGame(),
    prepared = report(s),
    brief = report(s, 0, "brief");
  assert.deepEqual(prepared.world, s.world);
  assert.deepEqual(prepared.factions, s.factions);
  const verifiedPrinted = apply(prepared, { type: "publish" }),
    briefPrinted = apply(brief, { type: "publish" });
  assert.equal(verifiedPrinted.world.factory, "closed");
  assert.equal(briefPrinted.world.factory, "fire");
  assert.ok(verifiedPrinted.factions.workers > s.factions.workers);
  assert.ok(verifiedPrinted.factions.merchants < s.factions.merchants);
  assert.notDeepEqual(verifiedPrinted.factions, briefPrinted.factions);
});
test("publication settles all reporting and capital costs exactly once and cannot repeat", () => {
  let s = initialGame();
  s = apply(s, { type: "upgrade", id: "kiosk" });
  s = report(report(s), 1, "brief");
  const before = s.cash,
    start = s.editionStartCash,
    f = forecast(s);
  const next = apply(s, { type: "publish" }),
    e = next.history[0];
  assert.equal(e.reportingCost, 85);
  assert.equal(e.profit, Math.round((e.cashAfter - e.cashBefore) * 100) / 100);
  assert.equal(e.cashBefore, start);
  assert.equal(
    e.profit,
    Math.round(
      (e.revenue +
        e.adRevenue -
        e.printCost -
        e.reportingCost -
        e.operatingCost -
        e.deliveryCost) *
        100,
    ) / 100,
  );
  assert.equal(
    e.cashAfter,
    Math.round((before + f.revenue + f.adRevenue - f.prepay) * 100) / 100,
  );
  assert.equal(next.cash, e.cashAfter);
  assert.equal(next.reportingSpent, 0);
  const again = reduceGame(next, { type: "publish" });
  assert.ok(again.error);
  assert.equal(again.state, next);
});
test("a new edition replaces all three leads and expires unfinished old stories", () => {
  const s = initialGame(),
    old = leadsFor(s).map((l) => l.id),
    next = apply(report(s, 1), { type: "publish" });
  assert.equal(leadsFor(next).length, 3);
  assert.ok(leadsFor(next).every((l) => !old.includes(l.id)));
  assert.ok(
    reduceGame(next, { type: "report", leadId: old[0], depth: "verified" })
      .error,
  );
  assert.equal(next.stories.length, 0);
  assert.equal(next.frontPage, null);
  assert.equal(next.hoursLeft, 8);
});
test("tram advertising pays at most once and counts newspaper copies plus passenger flow", () => {
  let s = apply(initialGame(), { type: "contract", id: "tram-corridor" });
  assert.equal(
    s.cash,
    initialGame().cash - OFFERS.find((o) => o.id === "tram-corridor")!.cost,
  );
  assert.ok(reduceGame(s, { type: "contract", id: "tram-corridor" }).error);
  s = publishDay(s);
  assert.ok(s.contracts[0].progress > s.history[0].sold);
  s = apply(s, { type: "delivery", value: "subscription" }); // Snow and factory closure require a different route.
  s = publishDay(s);
  assert.equal(s.contracts[0].status, "completed");
  assert.ok(s.history[1].contractEvents.some((e) => e.includes("выполнен")));
  const progress = s.contracts[0].progress;
  s = publishDay(s);
  assert.equal(s.contracts[0].progress, progress);
  assert.equal(s.history[2].contractEvents.length, 0);
  assert.equal(
    forecast(s).adRevenue,
    forecast({ ...s, contracts: [] }).adRevenue,
  );
});
test("missing a transport target expires the paid lease without paying a reward", () => {
  let s = apply(initialGame(), { type: "contract", id: "tram-corridor" });
  s = apply(s, { type: "print-run", value: 1000 });
  s = publishDay(s);
  s = publishDay(s);
  assert.equal(s.contracts[0].status, "failed");
  assert.equal(s.contracts[0].remaining, 0);
  assert.ok(s.contracts[0].progress < s.contracts[0].target);
  assert.equal(
    forecast(s).adRevenue,
    forecast({ ...s, contracts: [] }).adRevenue,
  );
  assert.ok(reduceGame(s, { type: "contract", id: "tram-corridor" }).error);
});
test("factory closure reduces a transport package audience at equal copy sales", () => {
  let s = apply(initialGame(), { type: "contract", id: "tram-corridor" });
  s = report(s, 1, "brief");
  s = apply(s, { type: "print-run", value: 1000 });
  const open = structuredClone(s),
    closed = structuredClone(s);
  open.world.factory = "open";
  closed.world.factory = "closed";
  const a = apply(open, { type: "publish" }),
    b = apply(closed, { type: "publish" });
  assert.equal(a.history[0].sold, b.history[0].sold);
  assert.ok(a.contracts[0].progress > b.contracts[0].progress);
});
test("publishing a critical factory story fails the sponsor contract without a reward", () => {
  let s = apply(initialGame(), { type: "contract", id: "factory-patron" });
  s = apply(report(s), { type: "publish" });
  assert.equal(s.contracts[0].status, "failed");
  assert.ok(s.history[0].contractEvents.some((e) => e.includes("конфликт")));
  s = publishDay(s);
  assert.equal(s.contracts[0].status, "failed");
  assert.equal(s.history[1].contractEvents.length, 0);
});
test("construction unlocks a kiosk route and more reporting time after publication", () => {
  let s = initialGame();
  assert.ok(reduceGame(s, { type: "delivery", value: "kiosk" }).error);
  s = apply(s, { type: "upgrade", id: "kiosk" });
  s = apply(s, { type: "upgrade", id: "desk" });
  assert.equal(s.buildings.kiosk.status, "building");
  assert.equal(s.hoursLeft, 8);
  assert.ok(reduceGame(s, { type: "upgrade", id: "desk" }).error);
  s = publishDay(s);
  assert.equal(s.buildings.kiosk.status, "open");
  assert.equal(s.hoursLeft, 10);
  s = apply(s, { type: "delivery", value: "kiosk" });
  s = report(report(report(s), 1), 2, "brief");
  assert.equal(s.stories.length, 3);
  assert.equal(s.hoursLeft, 0);
});
test("restored printing reduces actual expense after two editions", () => {
  let s = apply(initialGame(), { type: "upgrade", id: "press" });
  s = publishDay(s);
  assert.equal(s.buildings.press.status, "building");
  s = publishDay(s);
  assert.equal(s.buildings.press.status, "open");
  const without = structuredClone(s);
  without.buildings.press = { status: "locked", readyDay: null };
  assert.ok(forecast(s).printCost < forecast(without).printCost);
});
test("a cash shortage cannot trap the editor after buying a second report", () => {
  let s = initialGame();
  for (let day = 1; day <= 8; day++) {
    s = apply(s, { type: "price", value: 0.24 });
    s = report(s, 0, "brief");
    let printed = 8000;
    while (printed > 1000 && forecast({ ...s, printed }).prepay > s.cash)
      printed -= 500;
    s = apply(s, { type: "print-run", value: printed });
    s = apply(s, { type: "publish" });
  }
  s = report(s, 0, "verified");
  const expensive = reduceGame(s, {
    type: "report",
    leadId: leadsFor(s)[1].id,
    depth: "verified",
  });
  assert.ok(expensive.error);
  assert.equal(expensive.state, s);
  s = apply(s, { type: "print-run", value: 1000 });
  assert.equal(publicationBlock(s), null);
});
test("non-finite inputs and unknown actions do not poison a valid campaign", () => {
  const s = initialGame();
  for (const action of [
    { type: "price", value: NaN },
    { type: "print-run", value: Infinity },
    { type: "report", leadId: leadsFor(s)[0].id, depth: "imaginary" },
    { type: "report", leadId: leadsFor(s)[0].id, depth: ["brief"] },
    { type: "settings", key: "quality", value: ["high"] },
  ]) {
    const r = reduceGame(s, action as Action);
    assert.ok(r.error);
    assert.equal(r.state, s);
  }
});
test("a developed campaign roundtrips with actors, construction, contracts and actual edition text", () => {
  let s = initialGame();
  s = apply(s, { type: "upgrade", id: "desk" });
  s = apply(s, { type: "contract", id: "tram-corridor" });
  s = publishDay(s);
  assert.deepEqual(decodeSave(encodeSave(s)), s);
  assert.equal(
    s.history[0].stories[0].body,
    leadsFor(initialGame())[0].verifiedBody,
  );
  assert.notEqual(initialGame().campaignId, initialGame().campaignId);
});
test("the curated arc closes and repairs the factory, exposes council accounts and reopens the port", () => {
  let s = initialGame();
  for (let day = 1; day <= 12; day++) {
    const prepared = report(report(s), 1),
      beforeWorld = { ...s.world };
    assert.deepEqual(prepared.world, beforeWorld);
    s = apply(prepared, { type: "publish" });
    assert.deepEqual(decodeSave(encodeSave(s)), s);
    if (day === 1) assert.equal(s.world.factory, "closed");
    if (day === 3) assert.equal(s.world.factory, "open");
    if (day === 4) assert.ok(s.factions.council < 50);
    if (day === 6) assert.equal(s.world.harbour, "restricted");
    if (day === 8) assert.equal(s.world.harbour, "open");
  }
  assert.equal(s.status, "won");
  assert.equal(s.history.length, 12);
});
test("early production investment repays its price within the playable chapter", () => {
  let baseline = initialGame(),
    developed = apply(initialGame(), { type: "upgrade", id: "press" });
  for (let day = 1; day <= 12; day++) {
    baseline = publishDay(baseline);
    developed = publishDay(developed);
  }
  assert.ok(developed.cash > baseline.cash);
  assert.equal(developed.readers, baseline.readers);
  assert.equal(developed.trust, baseline.trust);
});
test("a community business strategy wins through different relationships and completed contracts", () => {
  let s = initialGame();
  while (s.status === "playing") {
    if (s.day === 1) {
      s = apply(s, { type: "upgrade", id: "kiosk" });
      s = apply(s, { type: "contract", id: "factory-patron" });
    }
    if (s.day === 2) {
      s = apply(s, { type: "delivery", value: "kiosk" });
      s = apply(s, { type: "upgrade", id: "desk" });
    }
    if (s.day === 4) s = apply(s, { type: "upgrade", id: "press" });
    if (s.day === 5) s = apply(s, { type: "contract", id: "river-pages" });
    s = apply(s, { type: "print-run", value: s.day < 4 ? 3000 : 4000 });
    const leads = leadsFor(s)
      .slice()
      .sort((a, b) => Number(!!a.critical) - Number(!!b.critical));
    for (const lead of leads.slice(0, 2))
      s = apply(s, { type: "report", leadId: lead.id, depth: "verified" });
    if (s.day >= 3)
      s = apply(s, { type: "report", leadId: leads[2].id, depth: "brief" });
    s = apply(s, { type: "publish" });
    assert.deepEqual(decodeSave(encodeSave(s)), s);
  }
  assert.equal(s.status, "won");
  assert.equal(s.history.length, 12);
  assert.equal(s.contracts.filter((c) => c.status === "completed").length, 2);
  assert.ok(s.cash > 5000);
  assert.ok(s.factions.council > 40);
  assert.ok(s.factions.merchants > 90);
});
test("expensive overprinting and rushed accusations lose readers, money and the campaign", () => {
  let s = initialGame();
  while (s.status === "playing") {
    s = apply(s, { type: "price", value: 0.24 });
    s = report(s, 0, "brief");
    let printed = 8000;
    while (printed > 1000 && forecast({ ...s, printed }).prepay > s.cash)
      printed -= 500;
    s = apply(s, { type: "print-run", value: printed });
    s = apply(s, { type: "publish" });
  }
  assert.equal(s.status, "ended");
  assert.equal(s.history.length, 12);
  assert.ok(s.cash < 400);
  assert.ok(s.readers < 2000);
  assert.equal(s.trust, 0);
  assert.ok(s.history.filter((e) => e.profit < 0).length >= 10);
  assert.deepEqual(decodeSave(encodeSave(s)), s);
});
test("save decoding rejects invalid enums, impossible hours, duplicate stories and damaged history", () => {
  const original = report(initialGame());
  const invalids = [
    { ...original, hoursLeft: 99 },
    { ...original, delivery: ["street"] },
    { ...original, version: 1 },
    { ...original, stories: [...original.stories, ...original.stories] },
    { ...original, day: 3 },
    { ...original, world: { factory: "open", harbour: "imaginary" } },
    { ...original, settings: { ...original.settings, motion: "yes" } },
  ];
  for (const bad of invalids)
    assert.throws(() => decodeSave(JSON.stringify(bad)));
  assert.throws(() => decodeSave("{broken"));
  assert.throws(() => decodeSave(" ".repeat(2_000_001)));
});

function storage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    },
  });
  return values;
}
test("loading corrupt v2 and legacy data preserves original bytes and exposes recovery", () => {
  const values = storage(),
    raw = "{damaged";
  values.set("first-page-v2", raw);
  values.set("media-empire-mobile-v1", "legacy party");
  const result = loadGame();
  assert.ok(result.error);
  assert.equal(result.recovery, raw);
  assert.equal(result.legacy, "legacy party");
  assert.equal(values.get("first-page-v2"), raw);
  assert.equal(values.get("media-empire-mobile-v1"), "legacy party");
  assert.equal(saveGame(result.state), false);
  assert.equal(values.get("first-page-v2"), raw);
});
test("save guards reject stale and foreign writes while explicit replacement backs up the current campaign", () => {
  const values = storage(),
    a = initialGame();
  assert.equal(saveGame(a), true);
  const newer = report(a);
  assert.equal(saveGame(newer, { expectedCampaignId: a.campaignId }), true);
  assert.equal(saveGame(a, { expectedCampaignId: a.campaignId }), false);
  const b = initialGame(),
    bytes = values.get("first-page-v2");
  assert.equal(saveGame(b), false);
  assert.equal(values.get("first-page-v2"), bytes);
  assert.equal(
    saveGame(b, { replace: true, expectedCampaignId: "wrong" }),
    false,
  );
  assert.equal(
    saveGame(b, { replace: true, expectedCampaignId: a.campaignId }),
    true,
  );
  assert.equal(values.get("first-page-v2-backup"), bytes);
  assert.equal(
    decodeSave(values.get("first-page-v2")!).campaignId,
    b.campaignId,
  );
  assert.equal(saveGame(newer, { expectedCampaignId: a.campaignId }), false);
});
test("replacement must match the revision shown before an asynchronous confirmation", () => {
  const values = storage(),
    a = initialGame();
  assert.equal(saveGame(a), true);
  const newer = report(a);
  assert.equal(saveGame(newer), true);
  const bytes = values.get("first-page-v2");
  const replacement = initialGame();
  assert.equal(
    saveGame(replacement, {
      replace: true,
      expectedCampaignId: a.campaignId,
      expectedRevision: a.revision,
    }),
    false,
  );
  assert.equal(values.get("first-page-v2"), bytes);
  assert.equal(values.has("first-page-v2-backup"), false);
  assert.equal(
    saveGame(replacement, {
      replace: true,
      expectedCampaignId: newer.campaignId,
      expectedRevision: newer.revision,
    }),
    true,
  );
  assert.equal(values.get("first-page-v2-backup"), bytes);
});
