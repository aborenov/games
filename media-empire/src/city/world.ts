import * as T from "three";
import {
  COLORS as C,
  GeometryBatch,
  addBox,
  addSign,
  standardMesh,
} from "./geometry";
import {
  bank,
  bench,
  factory,
  fountain,
  hall,
  house,
  lamp,
  market,
  newsroom,
  station,
  tree,
} from "./architecture";
import { ROAD_X, ROAD_Z, streetLoop } from "./routes";
import type { CityView } from "./types";

export interface CityWorld {
  root: T.Group;
  water: T.Mesh;
  tramRoute: T.CurvePath<T.Vector3>;
  smoke: T.Mesh[];
  flames: T.Mesh[];
  snow: T.Points;
  applyView: (view: CityView) => void;
}

export function createWorld(): CityWorld {
  const root = new T.Group();
  root.name = "Belford — original procedural city";
  const solids = new T.Group(),
    signs = new T.Group();
  root.add(solids, signs);
  const b = new GeometryBatch(solids);
  b.box(C.land, 0, -1.7, 2, 170, 2, 160);
  b.box(C.paving, 0, -0.48, -10, 105, 0.95, 69);
  b.box(C.paving, 0, -0.48, 52, 150, 0.95, 24);
  for (const z of ROAD_Z) {
    b.box(C.road, 0, 0.022, z, 116, 0.08, 4.5);
    for (const side of [-1, 1])
      b.box(C.roadEdge, 0, 0.095, z + side * 2.28, 116, 0.16, 0.18);
    // Small joints give the road a quiet cobbled rhythm without texture assets.
    for (let x = -53; x < 54; x += 3.4)
      b.box("#82897e", x, 0.068, z, 0.07, 0.025, 4.35);
  }
  for (const x of ROAD_X) {
    b.box(C.road, x, 0.023, -10, 4.5, 0.08, 70);
    for (const side of [-1, 1])
      b.box(C.roadEdge, x + side * 2.28, 0.095, -10, 0.18, 0.16, 70);
  }
  // A broad public pavement connects every building entrance to the road grid.
  for (const x of [-33, -9.5, 13, 35])
    for (const z of [-32, -10, 11.5]) {
      b.box(C.pavingLight, x, 0.09, z, 18.6, 0.14, 17.9);
      for (const side of [-1, 1])
        b.box(C.sand, x + side * 9.4, 0.17, z, 0.15, 0.16, 18);
    }
  // River cut, stone retaining walls and top coping.
  b.box(C.sand, 0, -1.1, 32, 170, 0.8, 18);
  const water = new T.Mesh(
    new T.PlaneGeometry(170, 16),
    new T.MeshPhysicalMaterial({
      color: C.water,
      roughness: 0.48,
      metalness: 0.02,
      ior: 1.33,
      specularIntensity: 0.28,
      clearcoat: 0.05,
      clearcoatRoughness: 0.6,
      normalMap: waterNormals(),
      normalScale: new T.Vector2(0.14, 0.14),
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.64, 32);
  water.receiveShadow = true;
  root.add(water);
  for (const z of [23.7, 40.3]) {
    b.box("#a49d84", 0, -0.45, z, 150, 2.3, 0.85);
    b.box(C.creamLight, 0, 0.72, z, 150, 0.45, 1.14);
    for (let x = -68; x < 70; x += 3.6)
      b.box(C.sand, x, -0.4, z + 0.46, 0.045, 1.6, 0.035);
    for (const y of [-0.9, -0.4, 0.1])
      b.box("#8b8f77", 0, y, z + 0.445, 150, 0.035, 0.035);
    for (let x = -49; x < 51; x += 5.3) {
      if (Math.abs(x + 21) < 4 || Math.abs(x - 24) < 4) continue;
      b.cylinder(C.iron, x, 1.1, z - 0.5, 0.07, 0.95, 6);
      b.cylinder(C.gold, x, 1.63, z - 0.5, 0.11, 0.14, 8);
      b.box(C.iron, x + 2.3, 1.42, z - 0.5, 4.8, 0.055, 0.055);
      b.box(C.iron, x + 2.3, 1.07, z - 0.5, 4.8, 0.04, 0.04);
    }
  }
  // Thin, gently staggered water facets are geometry, not a painted city image.
  for (let i = 0; i < 53; i++) {
    const x = -67 + ((i * 13.71) % 136),
      z = 25.4 + ((i * 4.21) % 13.1);
    b.box(
      i % 3 === 0 ? "#679e8d" : "#418b7b",
      x,
      -0.619,
      z,
      1.3 + (i % 5) * 0.62,
      0.012,
      0.045,
    );
  }
  for (const x of [-21, 24]) bridge(b, x);
  newsroom(b, signs);
  hall(b, signs);
  bank(b, signs);
  factory(b, signs);
  station(b, signs);
  market(b, signs);
  buildPark(b);
  // Compact terraces: varied widths, masonry, shop fronts and true pitched roofs.
  const walls = [C.cream, C.brickLight, "#c6b78f", C.creamLight, "#b88368"];
  let n = 0;
  const terrace = (
    x: number,
    z: number,
    w = 5.3,
    d = 6.8,
    h = 6.3,
    shop = false,
  ) => {
    house(b, {
      x,
      z,
      w,
      d,
      h,
      floors: h > 7 ? 3 : 2,
      wall: walls[n % walls.length],
      roof: n % 4 === 0 ? C.copper : C.slate,
      shop,
    });
    n++;
  };
  for (const z of [-16, -5])
    for (const x of [-39.2, -33, -26.8])
      terrace(x, z, 5.5, 7.6, 6 + (n % 3) * 1.1, z === -5);
  for (const x of [-39.5, -33, -26.5]) terrace(x, -47.8, 5.6, 6.2, 6.5);
  for (const x of [-15.2, -8.7, -2.5])
    terrace(x, -47.9, 5.5, 6.4, 6.6 + (n % 2));
  for (const x of [6.5, 13, 19.3]) terrace(x, -47.8, 5.5, 6.2, 6.1);
  for (const x of [6.6, 13.1, 19.3]) {
    terrace(x, -16, 5.6, 6.5, 6.4 + (n % 2) * 1.3);
    terrace(x, -5.9, 5.6, 5.9, 7.1, true);
  }
  for (const x of [-17, -0.5]) terrace(x, -16, 3.8, 6.5, 6.1);
  for (const x of [-17, -1]) terrace(x, 15.7, 4.3, 6.6, 6.2, true);
  for (const x of [6.3, 19.4]) terrace(x, 16.8, 4.2, 6.3, 6.2);
  for (const x of [-40, -33, -26])
    terrace(x, 52.8, 6, 7.5, 7.1 + (n % 3) * 0.7, true);
  for (const x of [-15, -8, -1, 9, 16, 34, 41])
    terrace(x, 52.8, 6, 7.5, 6.4 + (n % 3), true);
  for (const x of [51.7, -51.5])
    for (const z of [-34, -25, -12, 0, 13])
      terrace(x, z, 6.4, 7.3, 6.5 + (n % 3));
  // Waterfront warehouse, timber pier, crates, bollards and mooring posts.
  house(b, {
    x: 35.5,
    z: 9,
    w: 15.5,
    d: 9,
    h: 5.4,
    floors: 1,
    wall: C.brick,
    roof: C.slate,
    id: "harbour",
    roofHeight: 2.4,
  });
  addSign(signs, "РЕЧНОЕ ОБЩЕСТВО", 35.5, 4.5, 13.57, 10, 0.85, C.white, C.red);
  b.box(C.wood, 35, 0, 25.8, 8.5, 0.5, 9, [0, 0, 0], "harbour");
  for (let z = 21.5; z < 30; z += 0.45)
    b.box("#9b805b", 35, 0.27, z, 8.5, 0.06, 0.1);
  for (const x of [31.6, 38.4])
    for (const z of [22, 26, 29.5]) {
      b.cylinder(C.wood, x, -0.4, z, 0.24, 2.5, 8);
      b.cylinder(C.iron, x, 0.95, z, 0.18, 0.4, 8);
    }
  for (let i = 0; i < 10; i++) {
    const x = 28.2 + ((i * 3.13) % 14),
      z = 16 + ((i * 1.7) % 4.5);
    b.box(C.wood, x, 0.7, z, 1.1, 1.2, 1.1);
    b.box(C.sand, x, 1.32, z, 1.12, 0.08, 1.12);
    b.box(C.sand, x + 0.57, 0.7, z, 0.035, 1.2, 0.12);
  }
  // Cargo rail track extends behind the station and factory.
  for (const x of [42.4, 43.4]) b.box(C.iron, x, 0.13, -17, 0.075, 0.12, 57);
  for (let z = -44; z < 13; z += 1)
    b.box(C.wood, 42.9, 0.085, z, 1.8, 0.08, 0.2);
  const tramRoute = streetLoop();
  addTramTrack(b, tramRoute);
  for (const [x, z] of [
    [-18, -21],
    [24, -13],
    [8, 1],
    [-21, -8],
  ]) {
    b.cylinder(C.iron, x, 1.7, z, 0.055, 3.2, 6);
    b.box(C.teal, x, 3.25, z, 0.8, 0.55, 0.12);
    b.box(C.white, x, 3.25, z + 0.075, 0.4, 0.09, 0.02);
  }
  // Shops and civic street furniture share the same pavement scale.
  for (let i = 0; i < 19; i++) {
    const x = -45 + i * 5.3;
    lamp(b, x, 20.1);
    if (i % 2 === 0) tree(b, x + 1.4, 18.3, 0.67);
  }
  for (const x of [-23.9, 4.8, 26.9])
    for (const z of [-39, -23.5, -2.1, 17.6]) lamp(b, x, z);
  for (const [x, z] of [
    [-17, 4],
    [-4, 17],
    [7, -23],
    [21, -18],
    [27, -1],
    [-27, 20],
    [17, 4],
    [-40, -23],
  ])
    tree(b, x, z, 0.86);
  for (const [x, z] of [
    [-14, 4],
    [-4, 4],
    [-17, 10],
    [-3, 10],
    [6, -25],
    [20, -25],
  ])
    bench(b, x, z);
  fountain(b, -9, 14.5);
  // Street clock and a small circular flower bed in the newspaper square.
  b.cylinder(C.leaf, -9, 0.2, 14.5, 4.3, 0.15, 32);
  for (let i = 0; i < 17; i++) {
    const a = (i * Math.PI * 2) / 17;
    b.sphere(
      i % 2 ? C.rust : C.ochre,
      -9 + Math.cos(a) * 3.7,
      0.52,
      14.5 + Math.sin(a) * 3.7,
      0.19,
    );
  }
  b.finish();
  const lockedKiosk = buildKiosk("locked"),
    buildingKiosk = buildKiosk("building"),
    openKiosk = buildKiosk("open");
  const lockedPress = buildPress("locked"),
    buildingPress = buildPress("building"),
    openPress = buildPress("open");
  root.add(
    lockedKiosk,
    buildingKiosk,
    openKiosk,
    lockedPress,
    buildingPress,
    openPress,
  );
  const fire = new T.Group(),
    closed = new T.Group(),
    restricted = new T.Group();
  root.add(fire, closed, restricted);
  closed.userData.placeId = "factory";
  restricted.userData.placeId = "harbour";
  const flames: T.Mesh[] = [],
    smoke: T.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const inner = i % 3 === 0,
      color = inner ? "#f8c050" : "#db6731";
    const flame = new T.Mesh(
      new T.IcosahedronGeometry(inner ? 0.48 : 0.7, 1),
      new T.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: inner ? 0.7 : 0.4,
        roughness: 1,
      }),
    );
    flame.position.set(
      (i < 8 ? 28.7 : 37.1) + ((i % 4) - 0.5) * 0.22,
      8.05 + (i % 4) * 0.42,
      -28.6 + (i % 3) * 0.4,
    );
    flame.userData.baseY = flame.position.y;
    flame.userData.passThrough = true;
    fire.add(flame);
    flames.push(flame);
  }
  for (let i = 0; i < 14; i++) {
    const puff = new T.Mesh(
      new T.IcosahedronGeometry(1.4, 1),
      new T.MeshStandardMaterial({
        color: "#777f70",
        transparent: true,
        opacity: 0.46,
        roughness: 1,
        depthWrite: false,
      }),
    );
    puff.userData.index = i;
    puff.userData.passThrough = true;
    root.add(puff);
    smoke.push(puff);
  }
  const cb = new GeometryBatch(closed);
  for (const x of [29, 35, 41]) {
    cb.box(C.wood, x, 1.5, -23.9, 2.5, 0.25, 0.18, [0, 0, 0.5]);
    cb.box(C.wood, x, 1.5, -23.88, 2.5, 0.25, 0.18, [0, 0, -0.5]);
  }
  for (const x of [25.5, 44.4]) {
    for (let y = 0.6; y < 9; y += 2.2)
      cb.box(C.wood, x, y, -24, 0.12, 0.12, 10);
    for (const z of [-28.5, -24]) cb.box(C.wood, x, 4.7, z, 0.12, 9, 0.12);
  }
  cb.finish();
  addSign(
    closed,
    "ВРЕМЕННО ЗАКРЫТО",
    35,
    3.4,
    -22.75,
    7.5,
    0.8,
    C.rust,
    C.white,
  );
  const rb = new GeometryBatch(restricted);
  for (let i = 0; i < 5; i++)
    rb.box(
      i % 2 ? C.white : C.rust,
      31.7 + i * 1.6,
      1.3,
      21.8,
      1.6,
      0.35,
      0.18,
    );
  rb.box(C.iron, 31.7, 0.8, 21.8, 0.14, 1.6, 0.2);
  rb.box(C.iron, 38.1, 0.8, 21.8, 0.14, 1.6, 0.2);
  rb.finish();
  const snowGeometry = new T.BufferGeometry();
  snowGeometry.setAttribute(
    "position",
    new T.BufferAttribute(new Float32Array(150 * 3), 3),
  );
  const snow = new T.Points(
    snowGeometry,
    new T.PointsMaterial({
      color: "#fffdf0",
      size: 1.8,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    }),
  );
  snow.frustumCulled = false;
  snow.userData.passThrough = true;
  root.add(snow);
  return {
    root,
    water,
    tramRoute,
    flames,
    smoke,
    snow,
    applyView(view) {
      lockedKiosk.visible = view.kiosk === "locked";
      buildingKiosk.visible = view.kiosk === "building";
      openKiosk.visible = view.kiosk === "open";
      lockedPress.visible = view.press === "locked";
      buildingPress.visible = view.press === "building";
      openPress.visible = view.press === "open";
      fire.visible = view.factory === "fire" && view.day === 1;
      closed.visible = view.factory === "closed";
      restricted.visible = view.harbour === "restricted";
      snow.visible = view.day === 2;
    },
  };
}

function bridge(b: GeometryBatch, x: number) {
  b.box(C.road, x, 1.08, 32, 4.6, 0.55, 18);
  b.box(C.pavingLight, x - 2.7, 1.17, 32, 0.85, 0.45, 18);
  b.box(C.pavingLight, x + 2.7, 1.17, 32, 0.85, 0.45, 18);
  for (const side of [-1, 1]) {
    const shape = new T.Shape();
    shape.moveTo(-9, -2.1);
    shape.lineTo(9, -2.1);
    shape.lineTo(9, 1.65);
    shape.lineTo(-9, 1.65);
    shape.closePath();
    for (const u of [-6, 0, 6]) {
      const hole = new T.Path();
      hole.moveTo(u - 2.1, -2.2);
      hole.lineTo(u - 2.1, -0.45);
      hole.quadraticCurveTo(u - 2.1, 1.05, u, 1.05);
      hole.quadraticCurveTo(u + 2.1, 1.05, u + 2.1, -0.45);
      hole.lineTo(u + 2.1, -2.2);
      hole.closePath();
      shape.holes.push(hole);
    }
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 0.55,
      bevelEnabled: false,
      curveSegments: 10,
    });
    b.add(geo, C.sand, x + side * 2.65, 0, 32, [0, Math.PI / 2, 0]);
    b.box(C.creamLight, x + side * 2.8, 1.88, 32, 0.65, 0.35, 18.3);
    for (const z of [26, 32, 38])
      b.box(C.creamLight, x + side * 2.98, 1.37, z, 0.19, 0.6, 0.42);
  }
  // Short sloped approaches connect the raised bridge deck to the street.
  for (const z of [22.9, 41.1])
    b.box(C.road, x, 0.58, z, 4.5, 0.3, 4, [z < 30 ? -0.28 : 0.28, 0, 0]);
  for (const z of [23, 41])
    for (const side of [-1, 1]) lamp(b, x + side * 2.8, z);
}

function waterNormals() {
  const size = 96,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2,
        v = (y / size) * Math.PI * 2,
        i = (y * size + x) * 4;
      const nx = Math.sin(u * 3 + v * 2) * 0.2 + Math.sin(u * 7 - v * 5) * 0.07,
        ny = Math.cos(v * 4 + u) * 0.16;
      data[i] = Math.round(128 + nx * 127);
      data[i + 1] = Math.round(128 + ny * 127);
      data[i + 2] = 250;
      data[i + 3] = 255;
    }
  const texture = new T.DataTexture(data, size, size, T.RGBAFormat);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(18, 3);
  texture.needsUpdate = true;
  return texture;
}

function addTramTrack(b: GeometryBatch, route: T.CurvePath<T.Vector3>) {
  const samples = 320;
  for (const offset of [-0.58, 0.58]) {
    const points: T.Vector3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples,
        p = route.getPointAt(t),
        tan = route.getTangentAt(t);
      p.add(new T.Vector3(tan.z, 0, -tan.x).multiplyScalar(offset));
      p.y = 0.12;
      points.push(p);
    }
    b.add(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points),
        samples,
        0.055,
        4,
        false,
      ),
      C.iron,
      0,
      0,
      0,
    );
  }
  for (let i = 0; i < 130; i++) {
    const p = route.getPointAt(i / 130),
      t = route.getTangentAt(i / 130);
    b.box(C.wood, p.x, 0.09, p.z, 1.65, 0.05, 0.16, [
      0,
      Math.atan2(t.x, t.z),
      0,
    ]);
  }
}

function buildPark(b: GeometryBatch) {
  b.box(C.leafLight, -33, 0.2, -32, 18.5, 0.22, 18.5, [0, 0, 0], "park");
  b.box(C.pavingLight, -33, 0.34, -32, 2.5, 0.08, 18);
  b.box(C.pavingLight, -33, 0.34, -32, 18, 0.08, 2.5);
  b.cylinder(C.pavingLight, -33, 0.38, -32, 4.4, 0.12, 40);
  fountain(b, -33, -32);
  for (const [x, z] of [
    [-39, -38],
    [-27, -38],
    [-39, -26],
    [-27, -26],
    [-40, -32],
    [-26, -32],
    [-33, -39],
    [-33, -25],
  ])
    tree(b, x, z, 1 + (x % 3) * 0.07);
  for (const [x, z] of [
    [-37, -35],
    [-29, -35],
    [-37, -29],
    [-29, -29],
  ])
    bench(b, x, z, z > -32 ? Math.PI : 0);
  for (const x of [-42, -24])
    for (let z = -40; z < -22; z += 1.6)
      b.box(C.iron, x, 0.75, z, 0.06, 1, 0.06);
  for (const x of [-42, -24]) {
    b.box(C.iron, x, 1.1, -32, 0.06, 0.06, 18);
    b.box(C.iron, x, 0.55, -32, 0.06, 0.06, 18);
  }
}

function buildKiosk(phase: "locked" | "building" | "open") {
  const group = new T.Group();
  group.name = `kiosk-${phase}`;
  const b = new GeometryBatch(group),
    x = -10,
    z = 7.2;
  group.userData.placeId = "kiosk";
  b.box(C.sand, x, 0.2, z, 5.2, 0.3, 4.5, [0, 0, 0], "kiosk");
  if (phase === "locked") {
    for (let i = 0; i < 6; i++)
      b.box(
        C.wood,
        x - 2.4 + i * 0.95,
        0.9,
        z - 1.5,
        0.75,
        1.2,
        0.12,
        [0, 0, 0],
        "kiosk",
      );
    addSign(group, "ГАЗЕТНЫЙ КИОСК", x, 1, z - 1.4, 4, 0.65);
  } else {
    if (phase === "open") {
      b.cylinder(C.teal, x, 1.7, z, 2.05, 3, 6, 2.05, "kiosk");
      b.cylinder(C.copper, x, 3.75, z, 2.6, 1.2, 6, 0.55, "kiosk");
      b.cylinder(C.gold, x, 4.6, z, 0.07, 0.7, 6);
      b.box(C.white, x, 1.7, z + 1.82, 2.8, 1.65, 0.11);
      b.box(C.dark, x, 1.85, z + 1.91, 2.45, 1.05, 0.1);
      b.box(C.wood, x, 1.25, z + 2.2, 3.1, 0.18, 0.7);
      for (let i = 0; i < 7; i++) {
        b.box(C.white, x - 1.15 + i * 0.37, 1.42, z + 2.2, 0.29, 0.16, 0.53);
        b.box(C.dark, x - 1.15 + i * 0.37, 1.51, z + 2.21, 0.16, 0.015, 0.29);
      }
      addSign(group, "ГАЗЕТЫ", x, 2.9, z + 1.87, 2.75, 0.52, C.dark, C.white);
    } else {
      b.box(C.teal, x, 0.9, z, 3.8, 1.4, 3.2, [0, 0, 0], "kiosk");
      for (const xx of [-2.3, 2.3])
        for (const zz of [-1.9, 1.9])
          b.box(C.wood, x + xx, 2.1, z + zz, 0.13, 4, 0.13);
      b.box(C.wood, x, 3.4, z + 1.9, 5, 0.13, 0.14);
      b.box(C.wood, x, 1.9, z + 1.9, 5, 0.13, 0.14);
      b.box(C.wood, x - 1, 1.7, z + 2.25, 0.1, 3.5, 0.1, [0, 0, -0.25]);
      for (let i = 0; i < 7; i++)
        b.box(
          C.wood,
          x - 1.3 + i * 0.12,
          0.6 + i * 0.42,
          z + 2.25,
          0.75,
          0.08,
          0.1,
        );
      addSign(group, "СТРОИТСЯ", x, 1.15, z + 2.05, 3.2, 0.65);
    }
  }
  b.finish();
  return group;
}

function buildPress(phase: "locked" | "building" | "open") {
  const group = new T.Group();
  group.name = `press-${phase}`;
  const b = new GeometryBatch(group),
    x = 13,
    z = 9;
  group.userData.placeId = "press";
  b.box(C.sand, x, 0.17, z, 14, 0.25, 9, [0, 0, 0], "press");
  if (phase === "open") {
    house(b, {
      x,
      z,
      w: 13,
      d: 8,
      h: 5.5,
      floors: 1,
      wall: C.brickLight,
      id: "press",
      roofHeight: 2.4,
    });
    b.box(C.dark, x, 1.8, z + 4.13, 3.2, 3.1, 0.15);
    for (const xx of [-1, 0, 1])
      b.box(C.iron, x + xx, 1.9, z + 4.24, 0.08, 2.8, 0.05);
    b.cylinder(C.brick, x + 4.8, 6.5, z - 2.4, 0.65, 13, 12, 0.53, "press");
    b.cylinder(C.creamLight, x + 4.8, 13, z - 2.4, 0.8, 0.3, 12);
    addSign(group, "ТИПОГРАФИЯ", x, 4.7, z + 4.08, 8.5, 0.9, C.white, C.teal);
    addBox(group, C.white, 1.3, 0.8, 1, 8.5, 0.6, 14);
    addBox(group, C.white, 1.3, 0.6, 1, 9.6, 0.5, 14);
  } else {
    for (let i = 0; i < 11; i++)
      b.box(
        C.wood,
        6.3 + i * 1.33,
        0.9,
        13.5,
        1.12,
        1.5,
        0.15,
        [0, 0, 0],
        "press",
      );
    if (phase === "building") {
      b.box(C.brickLight, x, 1.9, z, 12.5, 3.2, 7.7, [0, 0, 0], "press");
      for (const xx of [6, 20])
        for (const zz of [5, 13]) b.box(C.wood, xx, 3.8, zz, 0.15, 7.4, 0.15);
      for (const y of [2.3, 4.5, 6.5]) {
        b.box(C.wood, x, y, 13.2, 14, 0.14, 0.2);
        b.box(C.wood, x, y, 4.8, 14, 0.14, 0.2);
      }
      b.box(C.wood, 18, 3.5, 13.4, 0.13, 7, 0.13, [0, 0, -0.45]);
      for (let i = 0; i < 5; i++)
        b.box(C.brick, 8.5 + i * 0.55, 0.5, 15, 0.48, 0.7, 0.6);
    } else {
      for (let i = 0; i < 9; i++)
        b.box(
          C.sand,
          8 + ((i * 3.71) % 10),
          0.32,
          6 + ((i * 2.17) % 5),
          0.8,
          0.45,
          0.9,
        );
    }
    addSign(
      group,
      phase === "building" ? "НОВАЯ ТИПОГРАФИЯ" : "УЧАСТОК ТИПОГРАФИИ",
      x,
      1.1,
      13.61,
      10,
      0.75,
    );
  }
  b.finish();
  return group;
}
