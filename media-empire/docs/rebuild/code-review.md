# Whole-change review — newspaper game rebuild

Reviewed 16 November 2026, base `d62fd56`, against the actual working tree including untracked `src/simulation`, `src/city`, and `src/ui`. This is the one fresh whole-change review; no source/index/branch changes and no delegated reviewers. References: `docs/AUDIT_2026-11-16.md`, the rebuild design, and implementation plan. Findings describe the reviewed version, before the owner's subsequent fix pass.

## Strengths

- The rebuild addresses the audit's central failure rather than only changing the illustration. A fresh campaign has no supplied stories; reporting consumes hours and cash; empty publication is blocked. Three simultaneous leads compete for eight hours, with an explicit brief/verified choice and front-page effect. Stories expire with each edition.
- Production accounting includes already paid reporting and capital costs exactly once. The forecast and publication use the same calculations. Printed verified stories change saved factory/harbour states and independent faction relations; transport contracts consume advances, accumulate contacts, expire, and settle once. Construction opens useful capabilities. The twelve-edition authored scope is explicit, not an accidentally truncated sandbox.
- The original mesh city, shared road/rail geometry, independent architecture, water and state-driven fire/construction/advertising are a substantial visual and systems improvement. I inspected the supplied 360px city, composer, and second newspaper images. They show a coherent restrained palette, legible primary controls, a clear current task, and a distinct typographic newspaper. This supports those visual observations, not a claim of commercial-game quality.
- Pure simulation is separated from React and Three.js. Versioned saves preserve legacy bytes; validation covers accounting/history, world consequences, hours, contracts and enums. Native dialogs, focus handling, semantic controls, motion settings, explicit camera controls, and a place-list route are good foundations.
- Owner evidence reports check/build and 23 simulation tests passing, plus the integrated publication and extended campaign browser paths. Independently, I exercised marker gestures, stale-tab replacement, denied storage, and renderer failure in real Chromium. A separate 200-campaign randomized action probe found no accepted state rejected by `encodeSave` and no prepared-story cash softlock. Only 42 randomized campaigns completed within the step budget; this is a consistency probe, not a balance or enjoyment study.

## Critical findings

None found in the reviewed scope.

## Important findings

### I1. Pending reset/import can silently replace a newer campaign

**Location:** `src/ui/useGame.ts:21–24`, `src/ui/Settings.tsx:10`, `src/simulation/persistence.ts:130–142`.

`replace()` writes with `{replace:true}` without the expected campaign or revision. The normal action guard does not protect replacement, and the Settings confirmation remains usable after a foreign storage event.

**Reproduced:** In tab A, open Settings and the new-campaign confirmation. In tab B, start a new campaign. A receives the foreign-campaign banner while retaining its old campaign in memory. Click A's already-open confirmation: B's new campaign is replaced immediately. The same unguarded callback is used after the asynchronous import read. A generic warning shown before the other tab's change is not informed confirmation of replacing that newer party. A backup is written, but it is not exposed as a recovery choice and a later replacement can replace that backup too.

**Fix:** Capture the expected stored campaign and revision when reset confirmation/import begins, and compare them immediately before replacement. Refuse a changed version, preserve the current bytes, and require loading/reviewing the new state before retrying. Preserve the intentional explicit recovery path for corrupt saves. Add regression coverage for a pending reset and a pending file read interrupted by another tab's progress/new campaign.

### I2. HTML city markers bypass the gesture recognizer

**Location:** `src/city/CityCanvas.tsx:30`, `src/city/engine.ts:144–193`, `src/city/city.css:4–5`.

The renderer binds gestures only to its canvas. Markers are pointer-interactive sibling buttons with an unconditional `onClick` selection, so they do not share the canvas's movement/pinch suppression.

**Reproduced:** At 430×932, mouse-down inside the newsroom marker, move +12px/+8px, and release inside it opens the editor dialog. The canvas's five-pixel threshold would have suppressed this selection. With CDP touch input, a drag starting on the factory marker leaves the camera unchanged. A pinch with one finger on that marker and the other on the canvas pans instead of zooming: the renderer sees only the canvas finger. Thus existing successful canvas-only gesture checks miss the interactive overlay.

**Fix:** Route pointer gestures over the whole city surface, including marker starts, through one recognizer. Suppress marker selection after movement/multitouch/cancel while preserving genuine taps and keyboard activation. Test marker-origin mouse drag, touch pan, and mixed marker/canvas pinch as well as ordinary canvas gestures.

## Minor findings

### M1. Renderer-failure fallback hides business and the promised place list

**Location:** `src/App.tsx:49`, `src/city/CityCanvas.tsx:19`.

Business and Places buttons are inside `ready && !screen && !printing`. If WebGL initialization fails, `ready` never becomes true, so neither route is present although the error message says the game and place list remain available. Contracts, upgrades, and factions are inaccessible through the surviving bottom navigation. Two separate error alerts also appear.

**Reproduced:** Override WebGL `getContext` to return null before loading. The page has zero Business buttons, zero Places buttons, and two alerts; Topics/Editor remain available.

**Fix:** Keep the non-renderer navigation available in the failure state and present one clear error/retry surface. This is an edge-path completeness issue rather than a defect in normal WebGL play.

### M2. Denied storage is misclassified as a newer-save conflict

**Location:** `src/ui/useGame.ts:14–20`, `src/simulation/persistence.ts:122`.

`loadGame` explicitly advises export when storage is unavailable, but `act` treats any boot error as an overwrite conflict. The in-memory state never advances, and the user is told to load an updated campaign that does not exist.

**Reproduced:** Make `Storage.getItem/setItem` throw `SecurityError` before loading. Open the first topic and choose verified reporting: story count remains zero and the newer-save conflict message appears.

**Fix:** Distinguish corrupt/foreign existing save data from unavailable storage. Preserve original bytes when corruption exists; allow the advertised in-memory/export mode for unavailable storage, with a persistent honest warning. At minimum, do not misreport unavailable storage as another tab's campaign.

## Declined to judge

- **Commercial readiness, sustained enjoyment, replay value:** neither source review, screenshots, nor automated twelve-edition strategies replace human playtesting. The authored campaign is coherent in scope, but I did not conduct a longitudinal enjoyment study.
- **Physical-device FPS, heat, battery use, native builds:** Chromium used software WebGL in this environment; no measured iPhone/Android sessions or APK/IPA installation were available.
- **Full accessibility compliance:** semantics and dialog implementation were inspected; no full screen-reader, contrast, motor-accessibility, or assistive-device audit was performed.
- **Final deployed/offline artifact:** the offline test was still running when review began, and deployment had not occurred. I did not certify the final Site's exact commit or service-worker update behavior.
- **Fix effectiveness:** this report covers the reviewed tree and reproductions above. Subsequent owner fixes require their own focused regression evidence; this report does not pre-approve them.

## Verdict

**Ready: with fixes.** Resolve I1 and I2 before delivery because they directly contradict explicit review-focus acceptance criteria. M1 and M2 should be corrected in the same pass if claiming the advertised fallback behavior. The rebuilt slice is a meaningful response to the audit, but passing its checks is not evidence that it meets a finished Steam/mobile game's overall quality standard.
