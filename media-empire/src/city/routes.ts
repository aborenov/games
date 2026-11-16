import * as T from "three";

/** The tram geometry and every vehicle use the same connected centre-line. */
export function streetLoop(
  left = -21,
  right = 24,
  top = -21,
  bottom = 1,
  radius = 3.5,
) {
  const path = new T.CurvePath<T.Vector3>();
  const v = (x: number, z: number) => new T.Vector3(x, 0.2, z);
  const line = (ax: number, az: number, bx: number, bz: number) =>
    path.add(new T.LineCurve3(v(ax, az), v(bx, bz)));
  const corner = (
    ax: number,
    az: number,
    bx: number,
    bz: number,
    cx: number,
    cz: number,
  ) => path.add(new T.QuadraticBezierCurve3(v(ax, az), v(bx, bz), v(cx, cz)));
  line(left + radius, top, right - radius, top);
  corner(right - radius, top, right, top, right, top + radius);
  line(right, top + radius, right, bottom - radius);
  corner(right, bottom - radius, right, bottom, right - radius, bottom);
  line(right - radius, bottom, left + radius, bottom);
  corner(left + radius, bottom, left, bottom, left, bottom - radius);
  line(left, bottom - radius, left, top + radius);
  corner(left, top + radius, left, top, left + radius, top);
  return path;
}

export const ROAD_X = [-45, -21, 2, 24, 46];
export const ROAD_Z = [-43, -21, 1, 22, 46];

export function routeBetween(from: T.Vector3, to: T.Vector3): T.Vector3[] {
  const roadX = (x: number) =>
    ROAD_X.reduce(
      (best, n) => (Math.abs(n - x) < Math.abs(best - x) ? n : best),
      ROAD_X[0],
    );
  const roadZ = (z: number) =>
    ROAD_Z.slice(0, 4).reduce(
      (best, n) => (Math.abs(n - z) < Math.abs(best - z) ? n : best),
      ROAD_Z[0],
    );
  const sx = roadX(from.x),
    tz = roadZ(to.z),
    tx = roadX(to.x);
  return [
    from.clone(),
    new T.Vector3(sx, 0.4, from.z),
    new T.Vector3(sx, 0.4, tz),
    new T.Vector3(tx, 0.4, tz),
    new T.Vector3(tx, 0.4, to.z),
    new T.Vector3(to.x, 0.4, to.z),
  ];
}

export function polylinePoint(points: T.Vector3[], distance: number) {
  let remaining = distance;
  for (let i = 1; i < points.length; i++) {
    const length = points[i - 1].distanceTo(points[i]);
    if (remaining <= length)
      return {
        point: points[i - 1]
          .clone()
          .lerp(points[i], length ? remaining / length : 0),
        tangent: points[i]
          .clone()
          .sub(points[i - 1])
          .normalize(),
        done: false,
      };
    remaining -= length;
  }
  return {
    point: points[points.length - 1].clone(),
    tangent: new T.Vector3(0, 0, 1),
    done: true,
  };
}
