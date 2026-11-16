# Newspaper game rebuild Implementation Plan

> **For agentic workers:** Implement independent simulation and city-renderer tasks in parallel using the fixed interfaces below; integrate and verify the complete slice before delivery. Use checkbox syntax.

**Goal:** Replace the rejected illustrated calculator with a cohesive city-based newspaper strategy.
**Architecture:** Pure simulation and versioned persistence; independent Three.js city; React contextual controls and tactile edition. No renderer-owned economy.
**Tech Stack:** React19, TypeScript, Vite7, Three.js, local fonts, PWA.
**Spec:** ../specs/2026-11-16-game-rebuild-design.md

## Global Constraints
- Audit d62fd56 is complete before new product code.
- One newspaper game; 12 issues, 8 editorial hours, three concurrent leads, 2/4-hour approaches.
- Old local saves remain untouched; new schema first-page v2.
- No comparator assets in runtime. No static city image as the world.
- Consequences originate from printed stories and fulfilled contracts exactly once.

## Review Focus
- A second tap cannot duplicate a report, publication, contract payout or charge.
- A pan/pinch cannot select a building. Camera gestures and reset must interrupt correctly.
- Import/reset and concurrent tabs must not overwrite a newer campaign silently.
- No clock jump after hidden tab; motion off freezes all visual layers and camera effects.
- World view and saved state agree on construction, factory closure and advertisement expiry.

### Task1: Pure simulation and persistence
Files: src/simulation/{types,content,model,persistence}.ts, tests/simulation.test.ts.
Interfaces: shared types.ts; exports initialGame, leadsFor, forecast, publicationBlock,
reduceGame, REPORT_OPTIONS, OFFERS, UPGRADES, encodeSave, decodeSave, loadGame, saveGame.
- [x] Write meaningful failing tests: no free empty publication, scarce 2/4-hour reporting, duplicate rejection, city/faction consequences only from printed stories, contract settlement once, useful upgrades, strict roundtrip/import.
- [x] Implement the model and content; compare two strategies and a bad policy over 12 issues.
- [x] Run tests and provide numeric outcomes; keep cents/accounting consistent.

### Task2: Spatial city
Files: src/city/{types,places,models,engine,CityCanvas}.ts(x).
Interfaces: CityView/CityMarker/CityHandle/CityCanvasProps from shared types.ts;
export CityCanvas and PLACES. CityHandle focus/reset/zoomBy/rotate.
- [x] Build coherent 3D architecture, connected streets/rails, water/parks and original models.
- [x] Add traffic/pedestrians and state-driven factory, construction and transport ads.
- [x] Implement drag/pinch/tap, projection of markers, selection, quality and motion handling.
- [x] Inspect actual screenshots and animated frames; report geometry and runtime limits.

### Task3: Game presentation and integration
Files: src/App.tsx, src/styles.css, src/main.tsx, src/components/new game UI,
package.json, vite.config.ts, PWA assets, tests/browser_rebuild.py.
- [x] Integrate simulation and city through fixed types; remove old runtime and unused graphics.
- [x] Implement world-first HUD, contextual reporting/contracts/construction, edition composer,
forecast/print/result, newspaper/archive/settings and safe save transfer.
- [x] Verify 360/390/430 and wide layout, real touch gestures, complete publication chain,
visible factory change, advertising contract, construction, reload/import and offline.

### Task4: Honest review and delivery
- [x] One fresh whole-change review; fix consequential findings and verify regressions.
- [x] Separate code correctness, visual observations and unmeasured human/device quality.
- [x] Prepare reviewed source and verified build for PR2 and the existing owner-private Site.
Delivery and published smoke verification are recorded externally in PR2 and Site version history after the source commit. Return links to the audit,
screenshots and game. Do not claim physical-device performance or store readiness.
