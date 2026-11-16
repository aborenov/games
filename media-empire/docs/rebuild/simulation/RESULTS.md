# Simulation tuning evidence

Run from the repository root:

```bash
node --import tsx docs/rebuild/simulation/strategies.mjs
npm test
npx tsc --noEmit --pretty false
```

The script records every edition, checks save/decode equality after every action, and asserts each requested action and publication succeeds. It runs in memory and writes no local saves. It imports the actual game model. Campaign IDs vary; economics and curated events are deterministic.

| Policy | Outcome | Ending cash | Trust | Readers | Verified | Losing issues |
|---|---|---:|---:|---:|---:|---:|
| Two first leads verified per day, 3,000 copies, $0.16, street | Won | $4,812.49 | 99 | 5,048 | 24 | 0 |
| Same with press ordered day 1 | Won | $4,992.49 | 99 | 5,048 | 24 | 1 |
| Independent: press + tram, subscription during snow, safety investigations | Won | $5,192.24 | 99 | 5,100 | 24 | 1 |
| Community/business: early kiosk + sponsor, desk, later press, 4,000 copies | Won | $6,316.19 | 99 | 5,612 | 24 | 3 |
| $0.24, rush first lead, largest affordable run | Ended without winning | $283.20 | 0 | 1,595 | 0 | 11 |

Exact actions are in [strategies.mjs](./strategies.mjs). The bad policy starts at 8,000 copies and reduces the run only when it otherwise cannot prepay; it therefore demonstrates a full failed campaign instead of a stalled script.

The independent policy closes the unsafe factory with the first printed investigation, restores it in edition 3, and publishes the council documents in edition 4. It restricts dangerous port traffic in edition 6 and confirms repairs in edition 8. Tram advertising completes at 7,300/7,000 contacts after switching delivery in the snow. The river package fails at 10,540/11,000 because printed safety warnings reduce passenger flow. Its ending relations are workers100/council23/merchants89.

The business policy initially verifies noncritical market and family leads, completes the factory sponsor at 9,000/8,500 copies, opens the repaired factory, and completes the river package at 15,300/11,000 contacts. Its ending relations are workers100/council44/merchants98. The second desk permits two verified reports plus one brief; the brief accusation has a trust cost. Construction charges account for its three loss-making investment issues.

The press produces $180 more ending cash after its $420 purchase has been expensed; it now pays back within the chapter. At 3,000 copies it saves $60 per working issue, beginning after two editions. Kiosk unlocks a route unaffected by street capacity and earns $45 per nonempty edition in local announcements. These are cash flow checks, not a claim of globally optimal balance.

## API examples

```ts
let state = initialGame();
const fire = leadsFor(state).find(lead => lead.effect === 'factory-close')!;
state = reduceGame(state, { type: 'report', leadId: fire.id, depth: 'verified' }).state;
// 4 hours and $60 spent; world.factory is still 'fire'.
const preview = forecast(state);
const result = reduceGame(state, { type: 'publish' });
state = result.state;
// result.edition stores the actual text and accounting. Factory is now 'closed'.

const accepted = saveGame(state, { expectedCampaignId: state.campaignId });
// Older, divergent-equal-revision and foreign-campaign writes are refused.
const restored = decodeSave(encodeSave(state));
// Explicit replacement creates first-page-v2-backup before changing first-page-v2.
// The old media-empire-mobile-v1 key is never written or removed.
```

`Forecast.profit` includes reporting, contract purchase and construction charges already paid during the current editorial day exactly once. Those purchase charges appear in `operatingCost`; `prepay` contains only unpaid print, delivery and base operation costs. Rewards appear in `adRevenue` only at contract settlement, with the reason in `contractEvents`. Thus `edition.cashAfter - edition.cashBefore = edition.profit` to the cent.

Factions range from 0 to 100, starting neutral at 50. Victory requires twelve editions, trust at least70, readers at least5,000, and at least six verified printed stories. Reports and purchases reserve enough cash for a minimum issue; unaffordable plans explain how to reduce circulation. Bad plans can lose the objective without being trapped by a disabled publish button.

Limits: twelve curated days, three authored leads per day, three factions and three one-time commercial offers; no generated sandbox, rival-newspaper AI or branching elections. Passenger exposure is an economic abstraction driven by circulation and saved city state, not a count of drawn vehicles. These deterministic comparisons establish coherent alternatives and failures; human difficulty/retention and physical-device performance remain unmeasured.
