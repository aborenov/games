# Separate city layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Steps use checkbox syntax.

**Goal:** Clean reusable city artwork and coherent animation.
**Architecture:** CityDefinition data + pure arc-length route sampling + Phaser actor layer + React labels. Keep gameplay unchanged.
**Tech Stack:** Phaser4, React19, TypeScript, generated PNG/WebP atlases.
**Spec:** ../specs/2026-11-16-city-layers-design.md

## Global Constraints
- Map artwork has no letters, baked actors or smoke.
- Current saves and newspaper economy remain compatible.
- Motion preference stops every animated layer.
- Future city data must not require editing CityScene.

## Review Focus
- Irregular frame durations: same elapsed time produces the same route position.
- Stop boundaries: position stays still through dwell, then resumes without reversal.
- Hidden/reduced motion: no ticking or walking while disabled.
- Atlas geometry: odd image dimensions cannot leak neighbouring frames.
- Map/label separation: renderer contains no city name, path coordinates or building hit rectangles.

### Task1: Reusable world and motion
- [x] Add CityDefinition / compiled route / atlas-frame interfaces in src/world.
- [x] Add tests/world.test.ts for constant speed, dwell, loop boundaries, paused time, odd-sized frame grids, hit regions.
- [x] Run tests and confirm missing implementation.
- [x] Implement motion.ts and belford.ts with paths following the illustration.
- [x] Run tests.

### Task2: Layered rendering
- [x] Generate and inspect clean map, directional tram, walker cycle and clean boat.
- [x] CityScene consumes CityDefinition; use arc-length routes, directional frames, walking animation and timed steam.
- [x] CityMap and App display labels from city metadata; generic article art uses the same clean map.
- [x] Build and verify touch pan/pinch, labels, actors, disabled motion, then full game and offline checks.

### Task3: Review and publish
- [x] Compare actual screenshots and inspect animation frames.
- [x] Independent code review; address concrete defects.
- [x] Prepare verified source, actual clean map, screenshots and animation recording for the existing branch and private Site.

Delivery is recorded by PR #2 and the existing Site deployment history after the source commit.

## Review and verification ledger

2026-11-16: Clean wide city and route obstruction edit inspected. Runtime textures use mipmaps and repair translucent generator matte. Independent world review found camera-pan interruption and dropped return-route stops; both reproduced before fixing and pass the browser/unit regressions. 17 unit tests, full 12-issue production chapter, separate camera/actor/place integration, and offline publication passed. Save schema stays at version 1. The source is ready for delivery to PR #2 and the existing owner-private Site.
