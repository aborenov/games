# Separate city art and living scene

User requirement: draw each city separately without baked text; different cities will use different artwork and animation must follow the world.

Keep the selected historical isometric art direction and current newspaper gameplay. The clean map has no typography, people, transport or smoke. React owns city/building names and status. Phaser owns transport, walk cycles and chimney emissions. A CityDefinition owns its background, camera, landmarks, hit regions, routes, stops and emitter locations.

Use an illustrated background plus independent sprites. A monolithic screenshot prevents reuse and a full 3D rewrite changes the approved visual direction and exceeds this correction. Chosen implementation keeps Phaser 4 and current saves.

Motion follows smooth paths sampled by physical arc length, with stops and consistent speed. Trams use directional views rather than flipping the same image mid-road. Pedestrians have actual walk cycles. All motion freezes with the existing motion preference and resumes without jumping.

No new campaign, city-selection menu or save schema is needed. The renderer accepts another CityDefinition. The first chapter still takes place in Belford.

## User steering: large city and the wider economy

The user additionally requested a big pannable city with different buildings,
future tram/ship advertising and a considered model of business and government.
Use the new wide 1536x1024 map (~60–70 buildings), a city plan that focuses the
camera, and informative place cards. Ownership/interests/advertising inventory
live in data, described in docs/CITY_SYSTEMS.md. Transport-ad contracts and
political/economic simulation are a follow-up gameplay phase, not pretend
transactions in the current UI.
