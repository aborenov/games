# Independent systems audit — MEDIA EMPIRE

Scope: current source at `/workspace/games/media-empire`, HEAD `d3cddd4`. Read-only inspection of the reducer, content, economy, world, scene, UI, persistence and tests. Game files were not edited. `npm test` was run during this audit: **17 passed, 0 failed**. Small diagnostic programs imported the current reducer and ran in memory; they did not modify saves or game files.

## Verdict

The current build is a functional newspaper planning calculator with an illustrated city interface. It does not yet deliver the agency, competing demands, persistent consequences or progression expected from a contemporary strategy/management game. This is a systems problem before it is a rendering problem. A new 3D renderer, more buildings or prettier motion would leave the decisive defects below intact unless state and rules change.

The tests establish useful implementation invariants, such as accounting, serialization and route geometry. They do not establish that the game asks interesting questions or that any of the advertised city systems matter to winning.

## Reproducible economics

All runs start from `starter()` and use ordinary reducer actions. They keep the initial six selected stories and initial lead unless stated otherwise. All choose `investigation: publish` in week 4 except the explicit hold comparison. Counts include publication and planning actions; automatic arrival ticks and UI navigation are excluded.

| Route | Strategic actions | Final cash | Final trust | Final rank | Verified cases | Outcome |
|---|---:|---:|---:|---:|---:|---|
| Publish defaults for 12 issues | 13 | $9,546 | 71 | 2 | 0 | Chapter completed; every issue profitable |
| Same, hold documents | 13 | $9,191 | 62 | 2 | 0 | Chapter completed; every issue profitable |
| Verify all four cases, otherwise defaults | 29 | $9,908 | 87 | 2 | 4 | Does not meet sales victory condition |
| Rush all four cases without either source | 21 | $9,038 | 63 | 2 | 0 | Chapter completed; every issue profitable |
| Set price to $0.07 and ads to local once, then publish defaults | **15** | **$8,856** | **95** | **1** | **0** | **Wins without a case, construction or city visit** |
| Restore press in week 1, then defaults | 14 | $8,430 | 71 | 2 | 0 | $1,116 less cash than skipping it |
| Buy land/build kiosk in week 1, then defaults | 15 | $8,874 | 71 | 2 | 0 | $672 less cash than skipping it |
| Buy both upgrades in week 1, then defaults | 16 | $7,758 | 71 | 2 | 0 | $1,788 less cash than skipping both |

The no-reporting default run starts with $4,000 and earns $5,546. Its weakest issue still earns $192. The fully verified route adds 16 input actions for only $362 additional cash, with the same final market rank. A static two-setting route wins with all four case records still entirely false and both city buildings locked. Its weakest issue still earns $25.

The winning route is not an optimal strategy search. It is a deliberately simple demonstration that the advertised main activities can be bypassed. Other fixed winning combinations also exist: local ads with price $0.08 and subscription yields $9,633; local ads with price $0.10 and subscription yields $10,258. No editorial adaptation or city management is needed in these runs.

## Priority defects and acceptance criteria

### P0 — The main game loop is optional to victory

Evidence: `src/game/model.ts:15–17` preselects six stories, lead 0 and a viable circulation. `src/game/model.ts:231` restores the same complete selection after every issue. `publicationBlock` at `src/game/model.ts:58–65` checks only selection size, the single week-4 decision and money. Victory at `src/components/Panels.tsx:100–103` checks only final rank and trust; investigations, city condition, buildings, relationships and debt have no role. The 15-action winning route above proves the practical outcome.

Why this weakens the game: the player can satisfy its promise of becoming the trusted leading newspaper without investigating anything, managing any person, meeting any owner, or developing the city. Publishing is mostly an advance-week button. Removing preselection alone would only add clerical clicks.

Acceptance: a playable vertical slice must contain competing opportunities with opportunity cost. At least three concurrent leads should compete for a clearly shown finite staff/time budget, so fully pursuing all of them before a deadline is impossible. Two credible strategies must reach different useful outcomes. A repeated fixed setup/publish route must visibly forfeit opportunities and fail a declared advanced objective; merely forcing more button presses does not pass. The objective must evaluate the game's actual promised activities, or the promise and scope must change.

### P0 — Investigations are a costless checklist with a cosmetic delay

Evidence: all four definitions at `src/game/content.ts:21–58` have the same shape: intro, one witness and one evidence string. `assign` costs one action, each clue costs one, and preparing is free (`src/game/model.ts:124–158`). There are four actions per week, while one complete case uses three. Only four cases are scheduled, in weeks 1, 4, 8 and 10; the player normally has no competing reporter task. Both clues are guaranteed, safe and mutually reinforcing. The player does not evaluate a source, choose an interview approach, spend money, risk exposure, or decide which conflicting account to print.

The trip is a fixed 2.8-second wait, or 0.35 seconds with motion disabled (`src/game/model.ts:132`). It has no relationship to map distance, tram availability or city conditions. The UI then disables additional fact-checking after preparation (`src/components/Panels.tsx:27–31`), even for a rushed draft. This creates a frustrating one-way click instead of an interesting risk.

The advertised deadline is also porous: assignment checks a three-week window, but clue and prepare actions do not (`src/game/model.ts:125–150`). Diagnostic: assign/arrive at the fire in week 1, ignore it, publish ten issues, then obtain both sources and prepare the fire in **week 11**. The reducer accepts it as a fresh verified front page. Excluded prepared headlines can carry forward indefinitely (`src/game/model.ts:228–230`).

Acceptance: gathering a source must consume a resource that competes with another useful activity. Show the real deadline and explicitly expire or evolve old leads. Include at least one case with conflicting evidence and a consequential editorial choice, with later feedback that follows from that choice. Fact-checking a draft must remain possible before printing. Accessibility settings must change presentation, not the duration or strategic value of the action.

### P0 — The only explicit moral choice is disconnected from the investigation and even the selected articles

Evidence: week-4 publication is controlled by `s.investigation`, independent of the electric case's clues or prepared headline (`src/game/model.ts:159`; `src/game/vendor/press-game.js:163–167,203,216–217`). It yields the document-publication pull and trust change even if the player did not investigate the station and removed both city/investigation slots 0 and 2.

Diagnostic: in week 4 use selected slots `[1,3,4,5,6,7]`, leaving the electric case entirely untouched. Choosing hold gives trust delta −3; choosing publish gives +6. Both settled profits are $315 in this state. The engine awards the political act regardless of whether its story was printed. The headline and case system present a different definition of publication from the economy.

Acceptance: publish/hold must be an action on an actual draft with known evidence, selected for that issue. A publication record must drive all trust, advertiser and political consequences exactly once. If no documents article is printed, there must be no documents-publication reward or penalty. A sponsor loss must be traceable to an actual owner/contract, with duration and follow-up response.

### P0 — Businesses, politics and the city are descriptive text, not a simulated world

Evidence: `CityState` contains only the press, kiosk and one bank-closure week (`src/game/types.ts:44–47`). The ten city places have position, owner and descriptive strings, but no economy, relationships, decisions, employees, contracts, resources or political state (`src/world/types.ts:6–9`; `src/world/belford.ts:16–26`). Every place card ends in the same “Prepare issue” button and receives no game state or dispatch callback (`src/components/CityPlaces.tsx:9–15`). The mayor, police chief, factory family, union and utilities cannot react to anything.

The fire does not damage a factory; the flood does not alter a district; exposing the council does not affect an official; labor reporting does not change a strike or wages. They are article strings and trust bonuses. The ending says twelve issues changed the city (`src/game/model.ts:250`) without storing those changes.

Acceptance: choose a small number of real actors and implement them fully. At least three actor states must be visible, mutable, saved and consequential. For example, publication about a factory must change an owner relationship and a relevant business condition, with a later event/contract reflecting it. Two playthroughs taking opposite positions must leave measurably different city and actor states, beyond cash and generic trust. Do not add more encyclopedia cards as a substitute.

### P0 — Construction is economically unrewarding within the only playable horizon

Evidence: a press costs $1,750 and completes after two publications; the kiosk costs $500 + $820 and completes after one (`src/game/model.ts:180–195`). Their only effects are print cost ×0.81 and global reach ×1.08 (`src/game/model.ts:33–35`). There are 12 issues and no post-chapter play or asset valuation in the ending (`src/game/model.ts:248–250`; `src/components/Panels.tsx:100–103`).

Measured from week-1 purchases: the press saves $634 over the remaining default issues, recovering 36% of its price. The kiosk adds $648 of operating profit, recovering 49% of its combined price. Even a loose upper bound of ten later issues, maximum permitted 14,000 circulation, and the largest 1.24 paper multiplier on every issue yields less than $1,188 direct savings for the $1,750 press. It cannot repay through its advertised benefit before the game ends. These are rationally skippable purchases, not a progression tree.

Acceptance: a major upgrade must have a documented strategic purpose and a recovery horizon compatible with the playable campaign, or contribute a meaningful ending asset value/continuing campaign benefit. Provide at least two mutually relevant development paths with different dependencies and operating consequences. A purchase should cause an observable workflow change, not just one multiplier and smoke.

### P1 — Challenge, failure and financial goals do not form a coherent campaign

Evidence: `src/game/model.ts:197–198` exposes a bankrupt action, but no UI calls it; publication errors retain the playing state. Completion is unconditional after issue 12. Loans have a $10,000 limit and 0.9% issue interest, with no maturity, covenant, collateral or end settlement (`src/game/model.ts:165–178`; `src/game/vendor/press-game.js:207`). The ending displays cash, never net worth or debt, and winning ignores debt.

Diagnostic: borrow the remaining $8,000 just before the last default issue. Ending cash changes from $9,546 to **$17,474**, while the player actually loses $72 of net worth to interest. The headline reward looks much better because borrowed principal is presented as wealth.

A deliberately adverse diagnostic bought both buildings at the start and, each issue, searched price/channel/ad mix, six-story combinations and lead for low settled profit at 14,000 circulation. It completed all 12 issues with losses every week, $296 cash and only $6,000 total debt, below the available limit. This is not a proof of the global worst strategy, but demonstrates how generous rescue capital makes failure largely theoretical in the existing horizon.

Acceptance: define success, setbacks and failure in terms the player can see before committing. Treat debt as a liability at the ending. A hopeless state must enter an explicit recoverable crisis or ending, with clear options. Tune and test complete strategies and recovery paths, not just individual formulas. Campaign objectives should show meaningful intermediate milestones, not appear mainly in the events list (`src/App.tsx:150`).

### P1 — The world map and transport are an unrelated animation layer

Evidence: `CityScene` supports loading, panning, zooming, hit testing and card callbacks (`src/scene/CityScene.ts:19–95`). There is no in-world character order or placement action. Tram, boat and eight walkers follow fixed route clocks (`src/world/belford.ts:28–40`; `src/world/actors.ts:57–83`). They do not consume or deliver anything, carry named people, respond to weather, or feed the economy. The boat has no player interaction. Actors' only state changes are kiosk visibility and press smoke (`src/world/actors.ts:49–55,78–82`).

The snow event promises that transit is stopped (`src/game/vendor/press-game.js:16`), yet the tram keeps running its fixed loop. The vendor forecast changes street capacity and channel multipliers by week instead of consuming world transport state. The river flood likewise leaves the same background and routes. `forecastPort` and port rivals exist in the vendor engine, but `WorldEffects` has no port configuration and the reducer has no port actions; they are not playable port management (`src/game/types.ts:70–77`; `src/game/vendor/press-game.js:104–152,184`).

Acceptance: if transport is presented as a system, a route's state must have a visible, inspectable effect on delivery, travel, contracts or sales. Stop a tram for a strike/weather event and show the consequences. At least one map order should change the simulation and appear in the ledger. The UI should distinguish atmospheric actors from actionable systems. Choose 2D, 2.5D or 3D after proving this loop; dimensionality is not an acceptance criterion by itself.

### P1 — Editorial content and rivals have little identity or replay value

Evidence: there are exactly 96 weekly headline strings and four linear case definitions (`src/game/content.ts:6–58`). Economy uses the eight fixed slot indices, topic points and costs, not the substance of those headlines (`src/game/content.ts:3–5`; `src/game/vendor/press-game.js:166–177,205`). Choosing six of eight is a spreadsheet mix; stories have no source, factual claims, ideological position, owner, deadline or lasting issue state.

All non-fire newspapers use the same generic body, secondary paragraphs and city image (`src/components/Newspaper.tsx:18–23`). The same bodies can claim correspondents interviewed residents even when the player never sent anyone. Rival actions are mechanical deterministic price/circulation changes (`src/game/vendor/press-game.js:227–242`). A “premium editorial investment” is only an action string/trust adjustment; no editor, investigation or content is modeled. Week-only sine randomness has no run seed (`src/game/vendor/press-game.js:67`), so resetting repeats the same shocks.

Acceptance: selected story identity must feed the edition's actual text and downstream effects. The newspaper must truthfully reflect what the player established and printed. At least two rivals need legible different objectives and responses; their moves should create a player decision rather than a retrospective label. Save an initial scenario/seed and demonstrate at least two materially different viable strategies and outcomes across replay scenarios.

### P1 — Decision feedback does not explain why to change strategy

Evidence: editor exposes top-line profit, sold copies, total expenses and prepayment (`src/components/Editor.tsx:39`), but not trust delta, district preference reasons, marginal impact or sponsor identity. Costs are cents and weeks, while trust quality points are invisible. The weekly bulletin explicitly tags hot slots, making the lead a prescribed answer rather than a deeper editorial decision. Report notes consist mostly of unsold count, hot/not-hot and verification flag (`src/game/model.ts:214–220`). Individual competitor results exist on the issue record but ReportPanel does not render them (`src/components/Panels.tsx:52–61`). The market card shows household totals and sales counts rather than actionable district feedback (`src/components/Panels.tsx:48`).

Acceptance: before a commitment, show its relevant known benefits, resource use, risk and deadline. After it resolves, give a concise causal explanation (“lost this contract because…”, “this district changed because…”), and expose the associated actor/district action. Forecast uncertainty should be meaningful and understandable. Do not require trial-and-error slider scrubbing to discover all rules.

### P2 — Saves are careful snapshots but lack campaign identity and migration

What is good: import validates shape, rejects malformed saves, preserves a corrupt source copy, supports explicit export and uses atomic localStorage writes (`src/game/model.ts:270–323`; `src/game/store.ts:8–32`; `src/components/Panels.tsx:86–94`). These should be preserved.

Gaps: schema is hard-coded to version 1 and rejects all others; there is no migration (`src/game/model.ts:271,322`). Cross-tab reconciliation accepts only a greater revision, with no campaign ID or reset epoch (`src/game/store.ts:63–68`). Reset creates revision 0 and import preserves the incoming revision (`src/game/store.ts:46–53`), so a higher-revision old tab can ignore a new campaign and later overwrite storage. Validation checks shape more than causal consistency: a week-1 save with an open kiosk but `landOwned: false` is accepted, as are inconsistent case flags. Settings and slider actions synchronously clone and persist the entire growing history (`src/game/model.ts:95`; `src/game/store.ts:37–42`). A completed ordinary save in the diagnostic is roughly 50 KB: not a performance problem by itself today, but an unsuitable pattern to multiply as world state grows.

Acceptance: maintain versioned migrations, campaign ID and monotonic reset/import epoch; test reset/import in two open tabs. Preserve the previous valid snapshot before replacing a campaign. Separate persistent simulation state from ephemeral presentation state. Round-trip every meaningful actor, contract, deadline and event after the rebuild and define validation of impossible combinations.

### P2 — Mobile performance needs measured budgets before more visual scope

Evidence: the city targets 60 FPS continuously (`src/components/CityMap.tsx:25–32`); all actor updates continue under dialog sheets and with world time frozen (`src/scene/CityScene.ts:95`; `src/world/actors.ts:57–83`). Reduced motion stops clock progression, not repeated scene work. Initial sprite import reads and scans original full-size pixels before downsampling, with a neighbor search for marked edge pixels (`src/world/textures.ts:4–38`). Inputs include 1774×887 walkers, 1585×992 boat, and two 1254×1254 assets; four compressed sprites alone total approximately 3.37 MB. Phaser and React retain separate world/overlay representations. Panning reports camera transforms to React repeatedly; no throttle is present (`src/scene/CityScene.ts:76–79`).

These are source-level risks, **not measured claims of low frame rate**. No real-device FPS, energy or memory measurements were run by this systems audit. Existing route tests verify geometry and freeze behavior, not frame budgets.

Acceptance: record load time, peak memory, input latency and frame-time distribution on a specified midrange Android target before choosing more expensive rendering. Preprocess sprite atlases at build time. Suspend unnecessary world work when fully obscured; reduced motion should also save work. Proposed baseline: no repeated >50 ms input tasks, p95 active frame time under 33 ms on the target, and an idle/covered mode that reduces frame work materially. Verify service-worker updates with a real saved campaign, not only first install.

### P2 — Accessibility is partly implemented, but desktop usability and small text remain gaps

What is good: native modal dialogs, focus trapping/restoration, labeled controls, 44-pixel buttons, live notifications, sound/motion switches and first-run reduced-motion detection are present (`src/components/Sheet.tsx:11–34`; `src/components/CityMap.tsx:64–68`; `src/game/model.ts:12,28`; `src/styles.css:12,64,148,298–299`). The accessible city plan offers an alternative to manually dragging to a location. A blanket claim that the game is entirely inaccessible would be inaccurate.

Gaps: keyboard handlers cover dialog Tab/Escape, but no keyboard camera or gamepad interaction exists. City plan merely moves the camera; the user must then find/open the new pin. Important UI labels and amounts are 8–10 px (`src/styles.css:28,39,102,145,147,305,307`). The desktop app is constrained to a 520-pixel-wide phone column (`src/styles.css:16`) and provides no desktop strategy overview. No text-size control or controller mapping exists. Systems should not depend on color, tiny category labels or camera movement to convey a newly available action.

Acceptance: complete a first issue and case with keyboard only and a screen reader; retain correct focus through changing sheets and after camera focus. All primary decisions must remain usable with 200% text sizing and reduced motion at mobile widths, with readable cost/deadline labels. Provide direct “open location” actions in the city plan. For a Steam-targeted release, specify and validate desktop layout/input and controller support where promised. Do not claim compliance from code inspection alone.

## Why 17 passing tests did not catch the weak game

The nine reducer tests validate reporting persistence, accounting, construction timing, import rejection and a completed 12-issue script (`tests/game.test.ts:21–149`). The full-chapter test itself publishes unchanged defaults (`tests/game.test.ts:132–149`); it asserts neither an interesting decision nor a victory trade-off. One store test covers malformed enum import. Seven world tests cover routes, frames, hit regions and pixel repair. These are appropriate low-level regression checks and can all pass for a shallow game.

Missing release evidence: comparative strategy simulations, upgrade recovery analysis, resource scarcity, conflicting objectives, political/business reaction, real delivery impact, replay variance, accessible end-to-end input, real-device budgets, and observed first-session player understanding. A screenshot, a clean console and a mechanically complete chapter cannot replace these checks.

## Gate before a larger rebuild

Approve the intended game loop and demonstrate it with a small playable slice before producing a larger city or switching renderers. The slice should prove: finite editorial capacity; at least three competing leads; a choice that changes a named actor and city state; one transport/business contract with an obligation and a delayed consequence; a publication that accurately reflects the reporting; a useful progression purchase; and two distinct, defensible outcomes. Those states must survive save/load. Then validate performance, readable UI and input on the actual target devices. This is the smallest credible evidence that a rebuild is becoming a game instead of a larger interface.

## Exact reproduction command for the principal numeric findings

Run from `/workspace/games/media-empire`. This invokes the actual current reducer in memory; it does not load the app store or write files. The table values and the article-exclusion, late-fire and final-loan findings can all be reproduced by the following command, which was executed during the audit.

```bash
node --import tsx --input-type=module <<'JS'
import { starter, reduceGame, forecast, publicationBlock } from './src/game/model.ts';
import { CASES } from './src/game/content.ts';
function run(name, options = {}) {
  let s = starter(), actions = 0;
  const act = action => {
    const r = reduceGame(s, action);
    if (r.error) throw Error(name + ': ' + r.error);
    s = r.state;
    if (action.type !== 'tick') actions++;
  };
  if (options.press) act({type:'build-press'});
  if (options.kiosk) { act({type:'buy-land'}); act({type:'build-kiosk'}); }
  if (options.staticWin) {
    act({type:'set-price',value:.07}); act({type:'set-ads',value:'local'});
  }
  while (s.week <= 12) {
    if (s.week === 4) act({type:'investigation',value:options.hold ? 'hold' : 'publish'});
    if (options.reporting) for (const c of CASES.filter(c => c.week === s.week)) {
      act({type:'assign',id:c.id,now:1000}); act({type:'tick',now:10000});
      if (options.reporting === 'verified') {
        act({type:'clue',id:c.id,clue:'witness'});
        act({type:'clue',id:c.id,clue:'evidence'});
      }
      act({type:'prepare',id:c.id});
    }
    if (publicationBlock(s)) throw Error(publicationBlock(s));
    act({type:'publish'});
  }
  console.log(JSON.stringify({name,actions,cash:s.cash,trust:s.trust,
    rank:s.history.at(-1).rank,verified:s.history.filter(h=>h.dispatch?.verified).length,
    minProfit:Math.min(...s.history.map(h=>h.profit)),
    profit:s.history.reduce((sum,h)=>sum+h.profit,0)}));
}
run('default'); run('hold',{hold:true});
run('verified',{reporting:'verified'}); run('rushed',{reporting:'rushed'});
run('static-win',{staticWin:true}); run('press',{press:true});
run('kiosk',{kiosk:true}); run('both',{press:true,kiosk:true});

let s=starter(); for(let i=0;i<3;i++) s=reduceGame(s,{type:'publish'}).state;
for(const id of [0,2]) s=reduceGame(s,{type:'toggle-story',id}).state;
for(const id of [6,7]) s=reduceGame(s,{type:'toggle-story',id}).state;
const hold=forecast(reduceGame(s,{type:'investigation',value:'hold'}).state,true);
const publish=forecast(reduceGame(s,{type:'investigation',value:'publish'}).state,true);
console.log(JSON.stringify({docsWithoutArticle:{selected:s.selected,
  holdTrust:hold.trustDelta,publishTrust:publish.trustDelta,
  holdProfit:hold.estimated,publishProfit:publish.estimated}}));

let delayed=reduceGame(starter(),{type:'assign',id:'fire',now:1000}).state;
delayed=reduceGame(delayed,{type:'tick',now:10000}).state;
for(let i=0;i<10;i++) {
  if(delayed.week===4) delayed=reduceGame(delayed,{type:'investigation',value:'publish'}).state;
  delayed=reduceGame(delayed,{type:'publish'}).state;
}
for(const clue of ['witness','evidence']) {
  const r=reduceGame(delayed,{type:'clue',id:'fire',clue});
  if(r.error) throw Error(r.error); delayed=r.state;
}
const late=reduceGame(delayed,{type:'prepare',id:'fire'});
console.log(JSON.stringify({lateFire:{week:delayed.week,error:late.error,
  headline:late.state.headlineEdit}}));

let end=starter();
while(end.week<12) {
  if(end.week===4) end=reduceGame(end,{type:'investigation',value:'publish'}).state;
  end=reduceGame(end,{type:'publish'}).state;
}
const ordinary=reduceGame(end,{type:'publish'}).state;
while(end.loan<10000) end=reduceGame(end,{type:'borrow'}).state;
const borrowed=reduceGame(end,{type:'publish'}).state;
console.log(JSON.stringify({finalBorrow:{ordinaryCash:ordinary.cash,
  ordinaryLoan:ordinary.loan,borrowedCash:borrowed.cash,borrowedLoan:borrowed.loan,
  displayedGain:borrowed.cash-ordinary.cash,
  netWorthDifference:borrowed.cash-borrowed.loan-ordinary.cash+ordinary.loan}}));
JS
```
