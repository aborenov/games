# Official game benchmark evidence — 2026-11-16

Scope: read-only comparison for a newspaper/city strategy audit. No comparator assets were copied into a game, and no files under `/workspace/games` were edited. This is store/developer-source research and visual inspection, not a claim of playing the paid games.

## Sources and evidence boundary

Exa discovery: 3 targeted searches, 5 results requested each (15 returned-result slots), followed by a batch fetch of primary pages. Independent HTTP downloads preserved official store metadata and original screenshot references. Third-party reviews were excluded from the gameplay conclusions.

| Game | Primary exact URLs | Official descriptions establish |
|---|---|---|
| News Tower | https://store.steampowered.com/app/1649950/News_Tower/ ; https://www.sparrownight.com/ | A weekly Sunday publication deadline; reporter assignment; editorial tone/tags; newsroom layout affecting efficiency; staff needs and expertise; district reader preferences; competitors and faction bargains; tower/upgrade progression. |
| Mini Motorways | https://store.steampowered.com/app/1127500/Mini_Motorways/ ; https://dinopoloclub.com/games/mini-motorways/ ; https://dinopoloclub.com/press/mini-motorways/ | Draw/redesign roads to serve growing demand; choose road-network upgrades; unlock maps/achievements; Classic, Endless, Expert, Creative and challenges. Apple Arcade, Steam and Switch are official platforms. |
| Mini Motorways controls/modes | https://dinopoloclub.com/support/mini-motorways/ | A real option called “Touch Screen Auto-Zoom”; Endless expansion based on efficiency milestones; Expert roads/upgrades become permanent shortly after placement and upgrades are constrained. The FAQ has some stale sections (it still asks about a future Creative Mode), so prefer the current press/store page for current mode availability. |
| Pocket City 2 | https://pocketcitygame.com/infopc2.html ; https://apps.apple.com/us/app/pocket-city-2/id1533709428 ; https://play.google.com/store/apps/details?hl=en&id=com.codebrewgames.pocketcity2 | Roads/zones/special buildings; power, water, waste and sewage; resource harvesting; quests for levels/unlocks; research choices; city competitions and mega projects; third-person avatar exploration; day/night and four seasons; portrait and landscape play. |

Saved metadata: `news-tower-steam.json`, `mini-motorways-steam.json` (official Steam appdetails responses); `pocket-city-2-itunes.json` (official Apple lookup response). Saved page HTML: `mini-motorways-press.html`, `mini-motorways-support.html`, `pocket-city-2-official.html`. The older `pocket-city-2-blog-2021.html` was consulted only as development history, not evidence of current shipped behavior.

## What I actually inspected

All screenshot file-to-URL mappings are in `screenshot-manifest.json`. The URLs below are page citations; the manifest records the exact CDN URL of each downloaded image.

### News Tower

- `news-tower-steam-01.jpg`: actual game HUD over a multistorey cutaway. Floor slabs, rooms, lifts, desks, staff, printing machinery and street life share one coherent side-on projection. Activity occupies the main canvas; time/week indicators and resource counters sit at the top, action categories at the edges. Distinct silhouettes and warm interior light separate the controllable building from the cool distant city.
- `news-tower-steam-02.jpg`: a printer page module has a white selection outline, a name, nearby contextual action buttons and a catalogue panel showing purchase price and output/power/noise/heat-style icons. This directly shows object selection and local feedback. The screenshot alone does not prove the icon meanings or the simulation formula.
- `news-tower-steam-08.jpg`: concrete investigation workflow. A “20 hours left” breaking-news timer shares the view with reporters, skill bars and tasks labelled “1 hour” and “2 hours”. The work is represented as a route/tree of leads with a further locked stage. Time, expertise and task progress are visible at the decision point.
- `news-tower-steam-05.jpg`: concrete publication feedback. A composed front page sits beside a breakdown headed Content, Multipliers, Sales, Advertising and Revenue. The visible calculation includes $0.04 × 38,500 = $1,540. This is stronger evidence of understandable consequences than a floating +money animation.
- `news-tower-steam-07.jpg`: faction request with an explicit “Sell 123,000 newspapers” objective, visible rewards/relationship icons, and Accept/Decline choices. It demonstrates presented terms, not the long-term quality of those choices.
- `news-tower-steam-03.jpg` and `-04.jpg`: additionally inspected assignment map and workplace detail. `-11-preview.jpg` and `-13-preview.jpg` explicitly contain a work-in-progress October 2025 watermark; do not present them as measured current-build behavior.
- `news-tower-steam-00.jpg` is an accolades/marketing card and is excluded from gameplay evidence.

Official mechanics (description, not firsthand play): layout affects logistics; staff needs affect productivity; tone/tags affect audience perception and sales, with backlash/lawsuit/faction consequences; district tastes and rivals make expansion selective. This creates three linked scales of decision: a worker/task now, an edition this week, and audience/faction position over time.

Transfer standard: a newspaper strategy game needs a legible production chain and editorial opportunity cost. The player's reporter/time/page capacity must force choices, and an edition result must explain which choices changed sales, trust and costs. Do not shrink this dense desktop HUD onto a phone unchanged.

### Mini Motorways

- `mini-motorways-steam-00.jpg`: the road network is almost the entire screen. Small homes and larger destinations share colors; destination pins are countable; cars sit on roads; a river limits crossings; one numbered motorway is visually distinct. Score/day/time live at the top, available upgrades at the bottom. The central area is free of dashboard cards.
- `mini-motorways-steam-01.jpg`: another palette preserves the same visual grammar. Contrasting road edges, roundabout circles, traffic-light dots, numbered motorway and a compact bridge inventory communicate function with very few shapes.
- `mini-motorways-steam-02.jpg`: night treatment retains readable roads, destinations, trains, cars and upgrade inventory. This demonstrates deliberate state hierarchy across palettes. It does not establish tested accessibility for every impairment.

Official mechanics (description, not firsthand play): redesign a network as a dynamically growing city changes demand, manage upgrades and learn across cities/challenges. Expert mode makes construction commitment more costly; Endless uses efficiency milestones. The player's reward is partly seeing the system they designed functioning.

Controls boundary: the developer explicitly documents touch auto-zoom. Exact drag gestures, hit areas, palm rejection and responsiveness were not tested. The images establish an overhead planning view, not how camera motion feels.

Transfer standard: moving distribution vehicles and queued demand should explain a route decision. A map can look polished with simple geometry if color, scale, route continuity and shadow direction stay consistent. Detailed decorative buildings are not a substitute for this hierarchy.

### Pocket City 2

- `pocket-city-2-official-01.jpg` and `-02.jpg`: actual city HUD, not just rendered key art. A continuous road/block system, repeated building language, water edges and purposeful landmarks form a cohesive place. The city fills the view; level/progress, cash, population and date are at the top. A dominant Build button and smaller Mayor/Stats/Quests/Events buttons sit along the bottom. The second image shows autumn color across the environment.
- `pocket-city-2-official-04.jpg`: actual third-person vehicle view. A large translucent joystick sits at the lower left, mode-specific action circles at the right, and “Back to City Mode” is explicit. The world uses the same buildings, roads and characters seen from above. This is evidence of visible on-screen controls and consistent scale, not proof of their comfort in use.
- `pocket-city-2-official-05.jpg`, `-06.jpg`, `-08.jpg`: inspected flight, avatar beach view and home interior. The home view has a joystick, Leave, Home Builder and camera control; the beach and flight images have reduced/hidden HUD. Those cleaner images must not be mistaken for the normal strategy interface.
- `pocket-city-2-app-store-00.png` and `-01.png` are downloaded from the current official Apple lookup screenshot list. The release info page is older launch material; storefront selection does not imply every pictured frame is from the latest patch.

Official mechanics (description, not firsthand play): growth is gated by infrastructure, quests, levels, research and large projects; exploration and citizen relationships provide additional reasons to revisit the city. Landscape/portrait support is explicit in the official description, but portrait layout was not personally tested.

Transfer standard: buildings should have readable roles, roads must connect, districts must form places, and the city should visibly develop through stages. A phone needs a clear primary action and contextual detail rather than a permanent wall of small panels. Pocket City 2's large branding and button sizes are a reference to assess, not a requirement to copy.

## Motion evidence and limits

Downloaded official embedded Steam WebM loops are mapped in `animation-manifest.json`. Sampled JPEG frames are preserved alongside each loop. News Tower's loops show a setting introduction, floor/machine placement and staff/workstation context; Mini Motorways' short title loop shows cars at changing positions following a curved road. These are promotional loops, not a controlled gameplay session. They support the direction that motion is attached to world functions and shared geometry; they do not establish sustained frame rate, pathfinding correctness, mobile battery use, full animation quality or input latency.

Attempts to sample the Steam HLS launch trailers failed with partial-file/invalid-NAL decoding errors. The saved `.m3u8`/source URL files are references only, not viewed trailer evidence. No successful HLS frame inspection is claimed.

## Concrete standards for the rebuild audit (our proposed acceptance targets)

These are derived audit requirements, not measurements or promises made by the comparator developers.

1. **A real editorial decision within the first session.** Offer more viable leads than the available reporters/time/page slots can cover. A player can state why they chose one and what they gave up. Choosing every button sequentially must not be the optimal loop.
2. **A complete visible causal chain.** Choose a story → reporter travels/investigates → copy reaches production → papers enter distribution → readers react → edition results explain the change. Progress indicators and congestion should correspond to actual simulation state.
3. **Consequences with explanations.** Edition feedback separates readership/sales, trust or reputation, production cost and one local audience/faction effect. Show expected costs and deadlines before commitment; explain failures after them.
4. **Growth changes the problem.** A new district adds a different audience or route constraint; a new press changes throughput; a new specialist opens a story strategy. Unlocks should add decisions, not only inflate passive income.
5. **The city remains the primary view.** In the normal phone state, keep the central map readable, show only essential resources/goal/time persistently, and put deeper controls in a contextual sheet. Use one unmistakable selected object and a separate warning treatment.
6. **Touch and camera are deliberately designed.** Proposed behavior: one-finger pan, pinch zoom, tap to inspect, explicit placement preview and cancel, no build triggered by a pan, zoom anchored near the pinch, pause/speed controls always recoverable. These require a real phone interaction check; screenshots cannot pass them.
7. **One spatial and visual grammar.** Consistent projection, scale, light direction, building foundations, road joins and world labels. Distinguish locations by shape and role. Tiny people and vehicles must occupy roads/paths/workplaces, not drift independently of geometry.
8. **Animation communicates work.** Reporters depart and return, presses advance paper, vans deliver, and queues build/clear because of capacity. Separate functional motion from restrained ambient motion. Pause freezes simulated work and speed changes it consistently.
9. **Verify progression with play, not artwork.** A short fresh-save session must demonstrate a scarce-resource choice, a bottleneck, a recoverable mistake, an explained edition result and an unlock that changes the next decision. Longer balance and retention still require human playtests.

## Honest limitations

No paid game was installed or personally played. Public official screenshots and short embedded promotional loops were visually inspected. Store descriptions can describe intended behavior without proving balance or execution. News Tower is a desktop design reference; Pocket City 2 and Mini Motorways provide mobile references, but their feel, exact gestures, portrait behavior and device performance remain unverified. No unsupported claims about current review scores, revenue, retention, or player satisfaction are needed for this comparison.
