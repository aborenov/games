import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { CityPlaceId } from "./types";

export const COLORS = {
  land: "#aeb996",
  paving: "#c9c2ad",
  pavingLight: "#ddd2b9",
  road: "#626e6b",
  roadEdge: "#a7ae9d",
  cream: "#e1cba6",
  creamLight: "#f0dfba",
  ochre: "#c6a35f",
  brick: "#a95139",
  brickLight: "#ba6949",
  red: "#943e2f",
  slate: "#293e4c",
  slateLight: "#3d5662",
  copper: "#477b6e",
  wood: "#70563b",
  dark: "#263e3c",
  glass: "#344d4e",
  window: "#96afa3",
  gold: "#ad8d4b",
  iron: "#45524c",
  leaf: "#4d7d4d",
  leafLight: "#7f9c5d",
  leafDark: "#365e44",
  trunk: "#66563a",
  water: "#2d7a72",
  white: "#f4e8cd",
  shadow: "#9ca383",
  sand: "#b4a585",
  rust: "#bc4c32",
  teal: "#3c736c",
};

type Part = { geometry: T.BufferGeometry; id?: CityPlaceId };
type PickRange = { end: number; id?: CityPlaceId };
export class GeometryBatch {
  private parts = new Map<string, Part[]>();
  private matrix = new T.Matrix4();
  private quaternion = new T.Quaternion();
  private vector = new T.Vector3();
  private scale = new T.Vector3(1, 1, 1);
  constructor(public target: T.Group) {}
  add(
    geometry: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    rotation: [number, number, number] = [0, 0, 0],
    id?: CityPlaceId,
  ) {
    this.quaternion.setFromEuler(new T.Euler(...rotation));
    this.matrix.compose(this.vector.set(x, y, z), this.quaternion, this.scale);
    geometry.applyMatrix4(this.matrix);
    const parts = this.parts.get(color) ?? [];
    parts.push({ geometry, id });
    this.parts.set(color, parts);
  }
  box(
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rotation: [number, number, number] = [0, 0, 0],
    id?: CityPlaceId,
  ) {
    this.add(new T.BoxGeometry(w, h, d), color, x, y, z, rotation, id);
  }
  cylinder(
    color: string,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    segments = 12,
    top = r,
    id?: CityPlaceId,
  ) {
    this.add(
      new T.CylinderGeometry(top, r, h, segments),
      color,
      x,
      y,
      z,
      [0, 0, 0],
      id,
    );
  }
  sphere(
    color: string,
    x: number,
    y: number,
    z: number,
    r: number,
    scale: [number, number, number] = [1, 1, 1],
  ) {
    const g = new T.SphereGeometry(r, 10, 7);
    g.scale(...scale);
    this.add(g, color, x, y, z);
  }
  roof(
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    id?: CityPlaceId,
  ) {
    const shape = new T.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(0, h);
    shape.lineTo(w / 2, 0);
    shape.closePath();
    const g = new T.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: false,
      steps: 1,
    });
    g.translate(0, 0, -d / 2);
    this.add(g, color, x, y, z, [0, 0, 0], id);
  }
  finish() {
    this.parts.forEach((parts, color) => {
      const normalized = parts.map((p) =>
        p.geometry.index ? p.geometry.toNonIndexed() : p.geometry,
      );
      const merged = mergeGeometries(normalized, false);
      if (!merged) return;
      const mesh = new T.Mesh(
        merged,
        new T.MeshStandardMaterial({
          color,
          roughness: 0.88,
          metalness: color === COLORS.copper ? 0.15 : 0,
        }),
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      let faces = 0;
      const ranges: PickRange[] = parts.map((part, i) => {
        faces += normalized[i].getAttribute("position").count / 3;
        return { end: faces, id: part.id };
      });
      mesh.userData.pickRanges = ranges;
      this.target.add(mesh);
      parts.forEach((p) => p.geometry.dispose());
      normalized.forEach((g, i) => {
        if (g !== parts[i].geometry) g.dispose();
      });
    });
    this.parts.clear();
  }
}

export function pickedPlace(hit: T.Intersection): CityPlaceId | undefined {
  let node: T.Object3D | null = hit.object;
  while (node) {
    const direct = node.userData.placeId as CityPlaceId | undefined;
    if (direct) return direct;
    node = node.parent;
  }
  const ranges = hit.object.userData.pickRanges as PickRange[] | undefined;
  if (ranges && hit.faceIndex != null)
    return ranges.find((r) => hit.faceIndex! < r.end)?.id;
}

export function standardMesh(
  geometry: T.BufferGeometry,
  color: string,
  roughness = 0.8,
) {
  const mesh = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({ color, roughness }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function addBox(
  parent: T.Object3D,
  color: string,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = standardMesh(new T.BoxGeometry(w, h, d), color);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

export function addSign(
  parent: T.Object3D,
  _text: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  color = "#273e38",
  background = "#e9d9b5",
  rotationY = 0,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1024, 160);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 10, 1000, 140);
  // Names belong to the projected interface, keeping each city's geometry textless.
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new T.Mesh(
    new T.PlaneGeometry(width, height),
    new T.MeshStandardMaterial({ map: texture, roughness: 1 }),
  );
  mesh.userData.passThrough = true;
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  parent.add(mesh);
  return mesh;
}
