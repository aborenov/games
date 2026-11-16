import * as T from "three";
import { COLORS as C, GeometryBatch, addSign } from "./geometry";
import type { CityPlaceId } from "./types";

export interface HouseOptions {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  wall?: string;
  roof?: string;
  id?: CityPlaceId;
  floors?: number;
  shop?: boolean;
  roofHeight?: number;
}
export function house(b: GeometryBatch, o: HouseOptions) {
  const { x, z, w, d, h, id } = o,
    wall = o.wall ?? C.cream,
    roof = o.roof ?? C.slate,
    floors = o.floors ?? 2,
    rh = o.roofHeight ?? 1.8;
  b.box(C.shadow, x, 0.055, z, w + 0.8, 0.08, d + 0.8);
  b.box(C.sand, x, 0.35, z, w + 0.2, 0.55, d + 0.2, [0, 0, 0], id);
  b.box(wall, x, h / 2 + 0.5, z, w, h, d, [0, 0, 0], id);
  b.box(C.creamLight, x, h + 0.6, z, w + 0.45, 0.32, d + 0.45, [0, 0, 0], id);
  b.roof(roof, x, h + 0.75, z, w + 0.7, rh, d + 0.7, id);
  b.box(C.slateLight, x, h + rh + 0.77, z, 0.18, 0.16, d + 0.8, [0, 0, 0], id);
  for (const side of [-1, 1]) {
    b.box(
      C.slateLight,
      x + side * w * 0.25,
      h + 0.79 + rh * 0.5,
      z,
      0.055,
      0.035,
      d + 0.75,
    );
    b.box(
      C.slateLight,
      x + side * (w / 2 + 0.3),
      h + 0.77,
      z,
      0.11,
      0.12,
      d + 0.75,
    );
  }
  for (let floor = 1; floor < floors; floor++)
    b.box(
      C.creamLight,
      x,
      0.5 + (h * floor) / floors,
      z,
      w + 0.13,
      0.14,
      d + 0.13,
    );
  for (const sign of [-1, 1]) {
    for (const xx of [-w / 2 + 0.16, w / 2 - 0.16]) {
      for (let yy = 1; yy < h - 0.2; yy += 1.15)
        b.box(
          C.creamLight,
          x + xx,
          yy,
          z + sign * (d / 2 + 0.035),
          0.32,
          0.32,
          0.13,
        );
    }
  }
  const columns = Math.max(2, Math.round(w / 2.15));
  for (let f = 0; f < floors; f++) {
    const yy = 0.5 + ((f + 0.57) * h) / floors;
    for (let col = 0; col < columns; col++) {
      const xx = x - w / 2 + ((col + 0.5) * w) / columns;
      if (f === 0 && col === Math.floor(columns / 2)) continue;
      facadeWindow(
        b,
        xx,
        yy,
        z + d / 2 + 0.045,
        0.8,
        Math.min(1.38, (h / floors) * 0.58),
        false,
      );
      if (!o.shop || f > 0)
        facadeWindow(b, xx, yy, z - d / 2 - 0.045, 0.75, 1.2, false, -1);
    }
    const sideCount = Math.max(2, Math.round(d / 2.3));
    for (let s = 0; s < sideCount; s++) {
      const zz = z - d / 2 + ((s + 0.5) * d) / sideCount;
      facadeWindow(b, x + w / 2 + 0.045, yy, zz, 0.77, 1.25, true);
      facadeWindow(b, x - w / 2 - 0.045, yy, zz, 0.77, 1.25, true, -1);
    }
  }
  b.box(C.creamLight, x, 0.5 + 1.15, z + d / 2 + 0.07, 1.22, 2.35, 0.15);
  b.box(C.wood, x, 0.5 + 1.1, z + d / 2 + 0.18, 0.9, 2.1, 0.14, [0, 0, 0], id);
  b.box(C.glass, x, 2.1, z + d / 2 + 0.26, 0.57, 0.65, 0.03);
  b.sphere(C.gold, x + 0.25, 1.4, z + d / 2 + 0.29, 0.055);
  b.box(C.sand, x, 0.2, z + d / 2 + 0.65, 1.8, 0.3, 0.95);
  b.box(C.brick, x - w * 0.24, h + rh * 0.6 + 1, z - d * 0.2, 0.6, 1.9, 0.75);
  b.box(
    C.creamLight,
    x - w * 0.24,
    h + rh * 0.6 + 1.98,
    z - d * 0.2,
    0.82,
    0.22,
    0.97,
  );
  if (w > 6.5) {
    for (const xx of [-w * 0.28, w * 0.28]) {
      b.box(C.cream, x + xx, h + 1.1, z + d / 2 - 0.6, 1.25, 1.25, 1.15);
      b.roof(C.slate, x + xx, h + 1.7, z + d / 2 - 0.6, 1.55, 0.65, 1.4);
      facadeWindow(b, x + xx, h + 1.15, z + d / 2 + 0.01, 0.58, 0.72, false);
    }
  }
  if (o.shop) {
    for (const xx of [-w * 0.27, w * 0.27]) {
      b.box(C.creamLight, x + xx, 1.55, z + d / 2 + 0.12, 1.5, 1.95, 0.22);
      b.box(C.glass, x + xx, 1.55, z + d / 2 + 0.26, 1.25, 1.68, 0.07);
      for (let s = 0; s < 5; s++)
        b.box(
          s % 2 ? C.white : C.rust,
          x + xx - 0.75 + (s + 0.5) * 0.3,
          2.75,
          z + d / 2 + 0.6,
          0.3,
          0.12,
          1.15,
          [-0.16, 0, 0],
        );
    }
  }
}

function facadeWindow(
  b: GeometryBatch,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  side: boolean,
  normal = 1,
) {
  const front = (
    color: string,
    xx: number,
    yy: number,
    ww: number,
    hh: number,
    depth: number,
    offset = 0,
  ) => {
    if (side) b.box(color, x + offset * normal, yy, z + xx, depth, hh, ww);
    else b.box(color, x + xx, yy, z + offset * normal, ww, hh, depth);
  };
  front(C.creamLight, 0, y, w + 0.22, h + 0.22, 0.11);
  front(C.glass, 0, y, w, h, 0.14, 0.035);
  front(C.window, 0, y + h * 0.18, w - 0.13, h * 0.36, 0.025, 0.115);
  front(C.creamLight, 0, y, 0.055, h, 0.045, 0.145);
  front(C.creamLight, 0, y - 0.08, w, 0.055, 0.045, 0.145);
  front(C.creamLight, 0, y - h / 2 - 0.14, w + 0.4, 0.14, 0.35, 0.13);
}

export function tree(
  b: GeometryBatch,
  x: number,
  z: number,
  size = 1,
  color: string = C.leaf,
) {
  b.cylinder(C.trunk, x, 1.2 * size, z, 0.13 * size, 2.4 * size, 7);
  b.sphere(color, x, 3.2 * size, z, 1.2 * size, [1, 1.12, 1]);
  b.sphere(
    C.leafLight,
    x - 0.5 * size,
    2.9 * size,
    z + 0.38 * size,
    0.85 * size,
    [1, 1, 1],
  );
  b.sphere(
    C.leafDark,
    x + 0.55 * size,
    2.5 * size,
    z - 0.25 * size,
    0.85 * size,
    [1, 1, 1],
  );
}

export function bench(b: GeometryBatch, x: number, z: number, rotation = 0) {
  const box = (
    color: string,
    lx: number,
    y: number,
    lz: number,
    w: number,
    h: number,
    d: number,
  ) =>
    b.box(
      color,
      x + lx * Math.cos(rotation) + lz * Math.sin(rotation),
      y,
      z - lx * Math.sin(rotation) + lz * Math.cos(rotation),
      w,
      h,
      d,
      [0, rotation, 0],
    );
  box(C.wood, 0, 0.7, 0, 1.9, 0.16, 0.62);
  box(C.wood, 0, 1.12, -0.28, 1.9, 0.55, 0.1);
  for (const xx of [-0.65, 0.65]) box(C.iron, xx, 0.38, 0, 0.1, 0.65, 0.52);
}

export function lamp(b: GeometryBatch, x: number, z: number) {
  b.cylinder(C.iron, x, 1.9, z, 0.055, 3.7, 6);
  b.cylinder(C.iron, x, 0.19, z, 0.16, 0.36, 8);
  b.box(C.creamLight, x, 3.9, z, 0.36, 0.56, 0.36);
  b.cylinder(C.iron, x, 4.25, z, 0.32, 0.2, 4, 0);
  b.cylinder(C.iron, x, 3.61, z, 0.24, 0.14, 4);
}

export function newsroom(b: GeometryBatch, signs: T.Group) {
  house(b, {
    x: -9,
    z: -10,
    w: 13,
    d: 10,
    h: 9.5,
    floors: 3,
    id: "newsroom",
    wall: C.brickLight,
    roof: C.slate,
    roofHeight: 2.7,
  });
  const x = -4.35,
    z = -7.1;
  b.box(C.brick, x, 6.5, z, 3.4, 12.3, 3.5, [0, 0, 0], "newsroom");
  for (const y of [1.1, 4.2, 7.2, 10.2, 12.6])
    b.box(C.creamLight, x, y, z, 3.7, 0.25, 3.8);
  for (const y of [3, 6, 9, 11.3])
    facadeWindow(b, x, y, z + 1.78, 0.9, 1.5, false);
  b.cylinder(C.creamLight, x, 13.45, z, 1.83, 1.8, 8, 1.83, "newsroom");
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    b.box(
      C.slate,
      x + Math.sin(a) * 1.72,
      13.5,
      z + Math.cos(a) * 1.72,
      0.58,
      0.98,
      0.13,
      [0, a, 0],
    );
  }
  b.cylinder(C.creamLight, x, 14.45, z, 2.1, 0.25, 8);
  b.add(
    new T.ConeGeometry(2.55, 2.7, 8),
    C.copper,
    x,
    15.9,
    z,
    [0, Math.PI / 8, 0],
    "newsroom",
  );
  b.cylinder(C.gold, x, 17.9, z, 0.055, 1.4, 6);
  b.box(C.rust, x + 0.4, 18.2, z, 0.8, 0.45, 0.05);
  addSign(signs, "ПЕРВАЯ ПОЛОСА", -10.5, 8, -4.88, 8.8, 1.15, C.white, C.red);
  b.box(C.creamLight, -10.5, 3.12, -4.6, 8.2, 0.35, 0.65);
  for (const xx of [-13.4, -10.5, -7.6])
    b.cylinder(C.creamLight, xx, 1.8, -4.3, 0.16, 2.8, 8);
  b.box(C.wood, -9, 0.65, -3.1, 4.4, 0.35, 1.1);
  b.box(C.pavingLight, -9, 0.3, -2.5, 5.2, 0.3, 1.7);
}

export function hall(b: GeometryBatch, signs: T.Group) {
  house(b, {
    x: -9,
    z: -32,
    w: 14.3,
    d: 10.5,
    h: 8.8,
    floors: 2,
    id: "hall",
    wall: C.creamLight,
    roof: C.copper,
    roofHeight: 2.7,
  });
  b.box(C.cream, -9, 10.9, -29.5, 4.6, 21.3, 4.8, [0, 0, 0], "hall");
  for (const y of [6.7, 11.7, 16.4, 21.3])
    b.box(C.creamLight, -9, y, -29.5, 5, 0.32, 5.2);
  facadeWindow(b, -9, 14.5, -27.04, 1.05, 2.1, false);
  b.box(C.slate, -9, 22, -29.5, 4.7, 0.85, 4.9);
  b.add(
    new T.ConeGeometry(3.7, 3.4, 4),
    C.copper,
    -9,
    24.1,
    -29.5,
    [0, Math.PI / 4, 0],
    "hall",
  );
  b.cylinder(C.gold, -9, 26.4, -29.5, 0.07, 1.4, 6);
  for (const face of [0, 1]) {
    const dial = new T.CylinderGeometry(1.33, 1.33, 0.14, 32);
    dial.rotateX(Math.PI / 2);
    b.add(dial, C.white, face ? -6.63 : -9, 19.2, face ? -29.5 : -27.04, [
      0,
      face ? Math.PI / 2 : 0,
      0,
    ]);
    if (!face) {
      b.box(C.dark, -9, 19.65, -26.93, 0.09, 0.91, 0.08, [0, 0, -0.37]);
      b.box(C.dark, -8.65, 19.2, -26.91, 0.77, 0.09, 0.08);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        b.box(
          C.gold,
          -9 + Math.sin(a) * 1.05,
          19.2 + Math.cos(a) * 1.05,
          -26.94,
          0.08,
          0.14,
          0.06,
          [0, 0, -a],
        );
      }
    } else {
      b.box(C.dark, -6.52, 19.6, -29.5, 0.06, 0.8, 0.09);
      b.box(C.dark, -6.51, 19.2, -29.1, 0.06, 0.09, 0.8);
    }
  }
  for (const xx of [-14.8, -12, -6, -3.2])
    b.cylinder(C.creamLight, xx, 2.7, -25.9, 0.25, 4.8, 12);
  b.box(C.creamLight, -9, 5.2, -25.9, 14.6, 0.45, 2.1);
  for (let s = 0; s < 4; s++)
    b.box(
      C.pavingLight,
      -9,
      0.15 + s * 0.16,
      -24.45 - s * 0.32,
      15 - s * 0.6,
      0.3 + s * 0.32,
      1,
    );
  addSign(signs, "ГОРОДСКАЯ УПРАВА", -9, 7.5, -26.68, 9.4, 0.85);
}

export function bank(b: GeometryBatch, signs: T.Group) {
  house(b, {
    x: 13,
    z: -33,
    w: 13.5,
    d: 11,
    h: 8.5,
    floors: 2,
    wall: C.creamLight,
    roof: C.copper,
    id: "bank",
    roofHeight: 2.3,
  });
  for (let i = 0; i < 6; i++) {
    const x = 7.7 + i * 2.12;
    b.cylinder(C.creamLight, x, 4.25, -26.6, 0.33, 6.25, 12);
    b.cylinder(C.cream, x, 1.12, -26.6, 0.48, 0.3, 12);
    b.box(C.creamLight, x, 7.4, -26.6, 0.95, 0.34, 0.95);
  }
  b.box(C.creamLight, 13, 7.8, -26.5, 14.4, 0.55, 3.2);
  b.roof(C.cream, 13, 8.05, -26.5, 14.8, 2.55, 3.5, "bank");
  b.roof(C.creamLight, 13, 8.3, -24.69, 12, 1.9, 0.12);
  for (let i = 0; i < 5; i++)
    b.box(
      C.pavingLight,
      13,
      0.15 + i * 0.13,
      -24.35 - i * 0.4,
      15 - i * 0.4,
      0.3 + i * 0.26,
      0.9,
    );
  addSign(signs, "БЕЛФОРДСКИЙ БАНК", 13, 7.78, -24.82, 10.5, 0.65);
  b.cylinder(C.creamLight, 13, 11.8, -33, 3.1, 1.6, 20);
  b.add(
    new T.SphereGeometry(3.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    C.copper,
    13,
    12.5,
    -33,
    [0, 0, 0],
    "bank",
  );
  b.cylinder(C.creamLight, 13, 12.45, -33, 3.35, 0.2, 24);
  b.cylinder(C.gold, 13, 16.1, -33, 0.07, 1, 7);
}

export function factory(b: GeometryBatch, signs: T.Group) {
  house(b, {
    x: 35,
    z: -35.5,
    w: 16.5,
    d: 7.8,
    h: 7.2,
    floors: 2,
    wall: C.brick,
    roof: C.slate,
    id: "factory",
    roofHeight: 1.7,
  });
  b.box(C.brick, 35, 3, -28, 16.5, 5.3, 6.7, [0, 0, 0], "factory");
  for (let i = 0; i < 4; i++) {
    b.roof(C.slate, 28.7 + i * 4.2, 5.8, -28, 4.3, 2.5, 7, "factory");
    b.box(C.window, 29.8 + i * 4.2, 6.7, -24.4, 1.45, 1.1, 0.09);
    facadeWindow(b, 28.5 + i * 4.3, 2.8, -24.57, 1.6, 2.1, false);
  }
  for (const [x, z, h] of [
    [40, -39, 23],
    [29, -39, 17],
  ] as const) {
    b.cylinder(C.brick, x, h / 2, z, 1.1, h, 16, 0.8, "factory");
    for (const yy of [h * 0.3, h * 0.65, h - 0.5])
      b.cylinder(C.brickLight, x, yy, z, yy > h - 1 ? 1.15 : 0.98, 0.35, 16);
    b.cylinder(C.dark, x, h + 0.08, z, 0.76, 0.12, 16);
  }
  addSign(signs, "ФАБРИКА МОРОЗОВЫХ", 35, 6.3, -24.48, 11.5, 1, C.white, C.red);
  for (let i = 0; i < 7; i++)
    b.box(C.iron, 26 + i * 3, 0.9, -22.9, 0.08, 1.8, 0.08);
  b.box(C.iron, 35, 1.4, -22.9, 20, 0.07, 0.08);
  b.box(C.iron, 35, 0.55, -22.9, 20, 0.07, 0.08);
}

export function station(b: GeometryBatch, signs: T.Group) {
  house(b, {
    x: 35,
    z: -13.5,
    w: 16,
    d: 7,
    h: 6.6,
    floors: 2,
    wall: C.brickLight,
    id: "station",
    roof: C.slate,
    roofHeight: 2.2,
  });
  b.box(C.cream, 35, 5.1, -9.3, 5.2, 9.2, 3, [0, 0, 0], "station");
  b.roof(C.slate, 35, 9.8, -9.3, 5.6, 2.4, 3.5, "station");
  facadeWindow(b, 35, 7.7, -7.77, 1.15, 1.5, false);
  b.box(C.dark, 35, 2, -7.74, 2, 3.7, 0.17);
  for (const x of [27.7, 31, 39, 42.3]) {
    b.cylinder(C.iron, x, 2.45, -5, 0.09, 4.8, 6);
    b.box(C.iron, x, 4.8, -5.6, 0.16, 0.18, 4.6);
  }
  b.add(
    new T.CylinderGeometry(2.65, 2.65, 17, 16, 1, true, 0, Math.PI),
    "#729391",
    35,
    4.75,
    -5.5,
    [0, 0, Math.PI / 2],
    "station",
  );
  for (let i = 0; i < 9; i++) {
    const points: T.Vector3[] = [];
    for (let j = 0; j <= 16; j++) {
      const a = (j * Math.PI) / 16;
      points.push(
        new T.Vector3(
          27 + i * 2,
          4.8 + Math.sin(a) * 2.67,
          -5.5 + Math.cos(a) * 2.67,
        ),
      );
    }
    b.add(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 16, 0.045, 4, false),
      C.iron,
      0,
      0,
      0,
    );
  }
  for (const z of [-8.2, -2.8]) b.box(C.iron, 35, 4.8, z, 17, 0.12, 0.12);
  addSign(signs, "БЕЛФОРДЪ · ВОКЗАЛЪ", 35, 5.9, -7.68, 11.9, 0.85);
}

export function market(b: GeometryBatch, signs: T.Group) {
  house(b, {
    x: -33,
    z: 11,
    w: 16,
    d: 10,
    h: 5.2,
    floors: 1,
    wall: C.cream,
    id: "market",
    roof: C.copper,
    roofHeight: 2.7,
  });
  for (let i = 0; i < 7; i++) {
    const x = -40 + i * 2.3;
    b.box(C.wood, x, 1.1, 17.3, 1.8, 1.5, 1.3);
    for (let s = 0; s < 5; s++)
      b.box(
        s % 2 ? C.white : i % 2 ? C.leafDark : C.rust,
        x - 0.9 + (s + 0.5) * 0.36,
        2.4,
        17.3,
        0.36,
        0.13,
        2.2,
        [-0.12, 0, 0],
      );
    b.sphere(i % 2 ? C.ochre : C.rust, x - 0.4, 1.99, 17.4, 0.25);
    b.sphere(C.leaf, x + 0.35, 1.99, 17.45, 0.28);
  }
  addSign(signs, "РЫНОЧНЫЕ РЯДЫ", -33, 4.3, 16.08, 11, 0.85);
}

export function fountain(b: GeometryBatch, x: number, z: number) {
  b.cylinder(C.pavingLight, x, 0.2, z, 3.2, 0.4, 40);
  b.cylinder(C.sand, x, 0.45, z, 2.8, 0.35, 40);
  b.cylinder(C.water, x, 0.65, z, 2.5, 0.12, 40);
  b.cylinder(C.creamLight, x, 1.2, z, 0.4, 1.4, 12);
  b.cylinder(C.pavingLight, x, 1.9, z, 1.25, 0.22, 24);
  b.cylinder(C.water, x, 2.05, z, 1.05, 0.12, 24);
  b.cylinder(C.creamLight, x, 2.55, z, 0.16, 0.9, 10);
  b.sphere(C.white, x, 3.1, z, 0.24);
}
