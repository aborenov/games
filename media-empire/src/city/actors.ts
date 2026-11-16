import * as T from "three";
import {
  COLORS as C,
  GeometryBatch,
  addBox,
  addSign,
  standardMesh,
} from "./geometry";
import { PLACES } from "./places";
import { polylinePoint, routeBetween, streetLoop } from "./routes";
import type { CityView } from "./types";
import type { CityWorld } from "./world";

export interface CityActors {
  root: T.Group;
  tram: T.Group;
  boat: T.Group;
  reporter: T.Group;
  update: (dt: number, time: number, view: CityView) => void;
  applyView: (view: CityView) => void;
  setQuality: (low: boolean) => void;
}

export function createActors(world: CityWorld): CityActors {
  const root = new T.Group();
  root.name = "Street life";
  const { group: tram, ad: tramAd, wheels } = createTram();
  root.add(tram);
  const { group: boat, ad: boatAd, wake } = createBoat();
  root.add(boat);
  const people = createPeople();
  root.add(people.root);
  const carts = [createCart(C.rust), createCart(C.teal), createCart(C.wood)];
  carts.forEach((c) => root.add(c));
  const reporter = createReporter();
  reporter.visible = false;
  root.add(reporter);
  const delivery = createCart(C.teal);
  delivery.visible = false;
  root.add(delivery);
  const dispatchPath = new T.Group();
  root.add(dispatchPath);
  const routeLength = world.tramRoute.getLength();
  let tramDistance = routeLength * 0.49,
    stopTimer = 0,
    nextStop = 2,
    boatTravel = 0,
    lastDispatch = -1,
    lastPublication = 0,
    reportDistance = 0,
    deliveryTime = 0,
    lowQuality = false;
  let reporterPoints: T.Vector3[] = [];
  const stopDistances = [0.12, 0.38, 0.63, 0.88].map((n) => n * routeLength);
  const applyView = (view: CityView) => {
    tramAd.visible = view.tramAd;
    boatAd.visible = view.boatAd;
    if (view.dispatch && view.dispatch.id !== lastDispatch) {
      lastDispatch = view.dispatch.id;
      reportDistance = 0;
      reporter.visible = true;
      const place =
        PLACES.find((p) => p.id === view.dispatch?.placeId) ?? PLACES[0];
      reporterPoints = routeBetween(
        new T.Vector3(-9, 0.4, -2.8),
        new T.Vector3(place.position[0], 0.4, place.position[2] + 5.8),
      );
      dispatchPath.children.forEach((child) => {
        const line = child as T.Line;
        line.geometry?.dispose();
        (line.material as T.Material)?.dispose();
      });
      dispatchPath.clear();
      const geometry = new T.BufferGeometry().setFromPoints(
        reporterPoints.map((p) => new T.Vector3(p.x, 0.25, p.z)),
      );
      const line = new T.Line(
        geometry,
        new T.LineDashedMaterial({
          color: C.rust,
          dashSize: 0.6,
          gapSize: 0.65,
          transparent: true,
          opacity: 0.72,
        }),
      );
      line.computeLineDistances();
      dispatchPath.add(line);
    }
    if (view.publication !== lastPublication) {
      lastPublication = view.publication;
      deliveryTime = 0;
      delivery.visible = view.publication > 0;
    }
  };
  const update = (dt: number, time: number, view: CityView) => {
    if (stopTimer > 0) stopTimer -= dt;
    else {
      const next = (tramDistance + dt * 3.15) % routeLength;
      const target = stopDistances[nextStop];
      if (
        (tramDistance <= target && next >= target) ||
        (next < tramDistance && target < next)
      ) {
        tramDistance = target;
        stopTimer = 2.8;
        nextStop = (nextStop + 1) % stopDistances.length;
      } else tramDistance = next;
    }
    const p = world.tramRoute.getPointAt(tramDistance / routeLength),
      tangent = world.tramRoute.getTangentAt(tramDistance / routeLength);
    tram.position.copy(p);
    tram.rotation.y = Math.atan2(tangent.x, tangent.z);
    wheels.forEach((w) => (w.rotation.x = time * 2));
    boatTravel += dt * (view.harbour === "restricted" ? 0.16 : 0.65);
    const bx = ((boatTravel + 72) % 128) - 64;
    boat.position.set(bx, -0.25 + Math.sin(time * 0.65) * 0.035, 32.8);
    boat.rotation.y = Math.PI / 2;
    wake.scale.setScalar(1 + Math.sin(time * 2) * 0.07);
    wake.visible = view.harbour !== "restricted";
    people.update(time);
    carts.forEach((cart, i) => {
      const ct = (time * (0.008 + i * 0.001) + i * 0.31) % 1,
        p = world.tramRoute.getPointAt(ct),
        d = world.tramRoute.getTangentAt(ct);
      cart.position
        .copy(p)
        .add(new T.Vector3(d.z, 0, -d.x).multiplyScalar(1.48));
      cart.rotation.y = Math.atan2(d.x, d.z);
    });
    if (reporter.visible && reporterPoints.length) {
      reportDistance += dt * 4.7;
      const point = polylinePoint(reporterPoints, reportDistance);
      reporter.position.copy(point.point);
      reporter.rotation.y = Math.atan2(point.tangent.x, point.tangent.z);
      const legs = reporter.userData.legs as T.Group[];
      legs.forEach(
        (leg, i) => (leg.rotation.x = Math.sin(time * 12 + i * Math.PI) * 0.6),
      );
      if (point.done) {
        reporter.visible = false;
        dispatchPath.visible = false;
      } else dispatchPath.visible = true;
    }
    if (delivery.visible) {
      deliveryTime += dt;
      const p = world.tramRoute.getPointAt((0.56 + deliveryTime * 0.018) % 1),
        d = world.tramRoute.getTangentAt((0.56 + deliveryTime * 0.018) % 1);
      delivery.position.copy(p);
      delivery.rotation.y = Math.atan2(d.x, d.z);
      if (deliveryTime > 18) delivery.visible = false;
    }
    world.flames.forEach((flame, i) => {
      flame.visible = !lowQuality || i % 2 === 0;
      flame.scale.set(
        0.7 + Math.sin(time * 7 + i) * 0.14,
        1.25 + Math.sin(time * 5.3 + i * 1.8) * 0.35,
        0.8,
      );
      flame.position.y = flame.userData.baseY + Math.sin(time * 4 + i) * 0.13;
      flame.rotation.y = time * 0.3 + i;
    });
    world.smoke.forEach((smoke, i) => {
      const phase = (time * 0.1 + i / 14) % 1,
        fire = view.factory === "fire" && view.day === 1;
      smoke.visible = view.factory !== "closed" && (!lowQuality || i % 2 === 0);
      smoke.position.set(
        (fire ? (i < 7 ? 28.7 : 37.1) : 40) + phase * 3 + Math.sin(i * 2) * 0.6,
        (fire ? 9 : 23) + phase * (fire ? 17 : 11),
        (fire ? -28 : -39) - phase * 2.5,
      );
      smoke.scale.setScalar((fire ? 1.2 : 0.5) + phase * (fire ? 2.3 : 1.2));
      smoke.rotation.y = time * 0.08 + i;
      const material = smoke.material as T.MeshStandardMaterial;
      material.color.set(fire ? "#656b60" : "#d6d7c3");
      material.opacity = (1 - phase) * (fire ? 0.36 : 0.25);
    });
    const waterMaterial = world.water.material as T.MeshPhysicalMaterial;
    if (waterMaterial.normalMap) {
      waterMaterial.normalMap.offset.x = time * 0.004;
      waterMaterial.normalMap.offset.y = time * 0.002;
    }
    if (world.snow.visible) {
      const position = world.snow.geometry.getAttribute("position");
      const count = lowQuality ? 70 : 150;
      world.snow.geometry.setDrawRange(0, count);
      for (let i = 0; i < count; i++)
        position.setXYZ(
          i,
          ((i * 7.31 + time * 0.18) % 100) - 50,
          2 + ((((i * 2.17 - time * 0.65) % 29) + 29) % 29),
          -44 + ((i * 3.67) % 70),
        );
      position.needsUpdate = true;
    }
  };
  update(0, 0, { factory: "fire" } as CityView);
  root.traverse((object) => {
    object.userData.originalCastShadow = object.castShadow;
  });
  return {
    root,
    tram,
    boat,
    reporter,
    update,
    applyView,
    setQuality(low) {
      lowQuality = low;
      people.setQuality(low);
      root.traverse((object) => {
        object.castShadow = !low && !!object.userData.originalCastShadow;
      });
    },
  };
}

function createTram() {
  const group = new T.Group();
  group.name = "Tram";
  group.userData.placeId = "tram";
  const b = new GeometryBatch(group);
  b.box(C.iron, 0, 0.55, 0, 1.9, 0.35, 5.6);
  b.box(C.rust, 0, 1.18, 0, 1.9, 0.85, 5.1, [0, 0, 0], "tram");
  b.box(C.creamLight, 0, 2.1, 0, 1.95, 1.1, 5.05, [0, 0, 0], "tram");
  b.box(C.slate, 0, 2.8, 0, 2.2, 0.35, 5.7, [0, 0, 0], "tram");
  b.box(C.copper, 0, 3.06, 0, 1.3, 0.22, 4.8);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++)
      b.box(C.glass, side * 0.99, 2.13, -2.02 + i * 0.8, 0.045, 0.73, 0.58);
    b.box(C.creamLight, side * 0.99, 1.6, 0, 0.06, 0.09, 5.3);
    b.box(C.gold, side * 1.05, 0.94, 0, 0.04, 0.06, 5.25);
    for (const z of [-2.6, 2.6])
      b.box(C.iron, side * 0.93, 1.6, z, 0.06, 1.7, 0.06);
  }
  for (const z of [-2.57, 2.57]) {
    b.box(C.glass, 0, 2.1, z, 1.28, 0.78, 0.04);
    b.box(C.creamLight, 0, 1.59, z, 1.8, 0.1, 0.06);
    b.cylinder(C.gold, 0, 1.27, z, 0.16, 0.17, 10);
    b.box(C.iron, 0, 0.56, z, 1.1, 0.15, 0.5);
  }
  b.box(C.iron, -0.5, 3.65, 0, 0.08, 1.5, 0.08, [0, 0, -0.45]);
  b.box(C.iron, 0.5, 3.65, 0, 0.08, 1.5, 0.08, [0, 0, 0.45]);
  b.box(C.iron, 0, 4.35, 0, 1.45, 0.08, 0.15);
  b.finish();
  const wheels: T.Mesh[] = [];
  for (const x of [-0.86, 0.86])
    for (const z of [-1.7, 1.7]) {
      const wheel = standardMesh(
        new T.CylinderGeometry(0.37, 0.37, 0.17, 12),
        C.dark,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.42, z);
      group.add(wheel);
      wheels.push(wheel);
    }
  const ad = new T.Group();
  group.add(ad);
  for (const side of [-1, 1]) {
    addBox(ad, C.teal, 0.06, 0.68, 4.6, side * 1.03, 1.15, 0);
    addSign(
      ad,
      "ПЕРВАЯ ПОЛОСА",
      side * 1.068,
      1.15,
      0,
      4.2,
      0.51,
      C.white,
      C.teal,
      (side * Math.PI) / 2,
    );
  }
  addSign(group, "3", 0, 2.98, 2.87, 0.55, 0.35, C.white, C.slate);
  return { group, ad, wheels };
}

function createBoat() {
  const group = new T.Group();
  group.name = "River steam packet";
  group.userData.placeId = "harbour";
  const b = new GeometryBatch(group);
  const shape = new T.Shape();
  shape.moveTo(-1.45, -3.8);
  shape.lineTo(1.45, -3.8);
  shape.lineTo(1.55, 1.9);
  shape.quadraticCurveTo(1.5, 3.7, 0, 5);
  shape.quadraticCurveTo(-1.5, 3.7, -1.55, 1.9);
  shape.closePath();
  const hull = new T.ExtrudeGeometry(shape, {
    depth: 0.75,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.2,
    bevelSegments: 1,
  });
  hull.rotateX(Math.PI / 2);
  b.add(hull, C.red, 0, 0.55, 0);
  b.add(new T.ShapeGeometry(shape), C.creamLight, 0, 0.69, 0, [
    -Math.PI / 2,
    0,
    0,
  ]);
  b.box(C.cream, 0, 1.4, -0.3, 2.4, 1.4, 4.9);
  b.box(C.slate, 0, 2.18, -0.3, 2.7, 0.22, 5.3);
  b.box(C.cream, 0, 2.75, 0.3, 1.7, 1.1, 2.1);
  b.box(C.copper, 0, 3.36, 0.3, 2, 0.16, 2.4);
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++)
      b.box(C.glass, side * 1.22, 1.53, -2 + i * 1.1, 0.04, 0.65, 0.65);
  b.box(C.glass, 0, 2.85, 1.38, 1.3, 0.58, 0.04);
  b.cylinder(C.dark, 0, 3.15, -1.7, 0.3, 2, 10);
  b.cylinder(C.cream, 0, 3.89, -1.7, 0.32, 0.25, 10);
  for (const x of [-1.35, 1.35]) {
    for (const z of [-3.3, -1.7, 0, 1.7, 3])
      b.box(C.white, x, 1.1, z, 0.05, 0.8, 0.05);
    b.box(C.white, x, 1.5, 0, 0.06, 0.05, 6.9);
  }
  b.cylinder(C.wood, 0, 2.2, 3.4, 0.045, 3, 6);
  b.box(C.rust, 0.35, 3.42, 3.4, 0.72, 0.4, 0.04);
  b.finish();
  const ad = new T.Group();
  group.add(ad);
  for (const side of [-1, 1])
    addSign(
      ad,
      "ЧИТАЙТЕ «ПЕРВУЮ ПОЛОСУ»",
      side * 1.265,
      1.54,
      -0.3,
      4.8,
      0.65,
      C.white,
      C.teal,
      (side * Math.PI) / 2,
    );
  const wake = new T.Group();
  group.add(wake);
  for (const side of [-1, 1]) {
    const mesh = new T.Mesh(
      new T.PlaneGeometry(0.18, 8),
      new T.MeshBasicMaterial({
        color: "#c5dcc6",
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = side * 0.2;
    mesh.position.set(side * 1.7, -0.35, -5.7);
    wake.add(mesh);
  }
  return { group, ad, wake };
}

function createCart(color: string) {
  const group = new T.Group(),
    b = new GeometryBatch(group);
  b.box(C.wood, 0, 0.72, 0, 1.1, 0.7, 1.6);
  b.box(color, 0, 1.2, -0.4, 1.2, 0.18, 1.1);
  b.box(C.wood, 0, 0.72, 1.2, 0.14, 0.1, 1.5);
  for (const x of [-0.64, 0.64]) {
    const g = new T.CylinderGeometry(0.48, 0.48, 0.1, 12);
    g.rotateZ(Math.PI / 2);
    b.add(g, C.dark, x, 0.48, 0);
    const g2 = new T.CylinderGeometry(0.28, 0.28, 0.11, 8);
    g2.rotateZ(Math.PI / 2);
    b.add(g2, C.wood, x, 0.48, 0);
  }
  // Driver pushes the cart, so cart traffic stays at a walking pace.
  b.box(color, 0, 1.15, -1.1, 0.4, 0.6, 0.3);
  b.sphere(C.ochre, 0, 1.62, -1.1, 0.2);
  b.box(C.dark, -0.12, 0.53, -1.15, 0.12, 0.65, 0.13);
  b.box(C.dark, 0.12, 0.53, -1.02, 0.12, 0.65, 0.13);
  b.finish();
  return group;
}

function createReporter() {
  const group = new T.Group();
  addBox(group, C.rust, 0.5, 0.67, 0.35, 0, 1.05, 0);
  const head = standardMesh(new T.SphereGeometry(0.21, 8, 6), C.ochre);
  head.position.y = 1.6;
  group.add(head);
  const hat = standardMesh(
    new T.CylinderGeometry(0.27, 0.27, 0.12, 10),
    C.slate,
  );
  hat.position.y = 1.8;
  group.add(hat);
  addBox(group, C.wood, 0.25, 0.4, 0.3, 0.38, 1, 0);
  addBox(group, C.white, 0.3, 0.34, 0.04, 0.43, 1.25, 0.17);
  const legs: T.Group[] = [];
  for (const x of [-0.15, 0.15]) {
    const leg = new T.Group();
    leg.position.set(x, 0.77, 0);
    addBox(leg, C.dark, 0.16, 0.7, 0.2, 0, -0.34, 0);
    group.add(leg);
    legs.push(leg);
  }
  const ring = new T.Mesh(
    new T.RingGeometry(0.5, 0.65, 24),
    new T.MeshBasicMaterial({ color: C.rust, side: T.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);
  group.userData.legs = legs;
  return group;
}

function createPeople() {
  const root = new T.Group(),
    count = 28;
  const body = new T.InstancedMesh(
    new T.BoxGeometry(0.38, 0.58, 0.29),
    new T.MeshStandardMaterial({ color: "#ffffff", roughness: 1 }),
    count,
  );
  const head = new T.InstancedMesh(
    new T.SphereGeometry(0.17, 7, 5),
    new T.MeshStandardMaterial({ color: "#c3a47b", roughness: 1 }),
    count,
  );
  const hat = new T.InstancedMesh(
    new T.CylinderGeometry(0.23, 0.23, 0.12, 8),
    new T.MeshStandardMaterial({ color: C.dark, roughness: 1 }),
    count,
  );
  const leg = new T.InstancedMesh(
    new T.BoxGeometry(0.12, 0.49, 0.14),
    new T.MeshStandardMaterial({ color: C.dark, roughness: 1 }),
    count * 2,
  );
  const arm = new T.InstancedMesh(
    new T.BoxGeometry(0.1, 0.47, 0.12),
    new T.MeshStandardMaterial({ color: C.cream, roughness: 1 }),
    count * 2,
  );
  const meshes = [body, head, hat, leg, arm];
  meshes.forEach((m) => {
    m.castShadow = true;
    m.frustumCulled = false;
    root.add(m);
  });
  const color = new T.Color(),
    matrix = new T.Matrix4(),
    rotation = new T.Quaternion(),
    position = new T.Vector3(),
    size = new T.Vector3(1, 1, 1),
    euler = new T.Euler();
  const coat = [C.rust, C.teal, C.cream, C.slate, C.wood, C.brickLight];
  for (let i = 0; i < count; i++)
    body.setColorAt(i, color.set(coat[i % coat.length]));
  const paths = [
    streetLoop(-42, -24, -19, -2, 1.2),
    streetLoop(-18, -1, -19, -2, 1.1),
    streetLoop(5, 21, -19, -2, 1.1),
    streetLoop(-42, 42, 18.8, 21, 0.7),
  ];
  const update = (time: number) => {
    for (let i = 0; i < count; i++) {
      const path = paths[i % paths.length],
        phase = (i * 0.137 + time * (0.0045 + (i % 3) * 0.0006)) % 1,
        p = path.getPointAt(phase),
        t = path.getTangentAt(phase),
        yaw = Math.atan2(t.x, t.z),
        walk = Math.sin(time * 7 + i * 2);
      const compose = (
        mesh: T.InstancedMesh,
        index: number,
        dx: number,
        dy: number,
        dz: number,
        tilt = 0,
      ) => {
        const xx = dx * Math.cos(yaw) + dz * Math.sin(yaw),
          zz = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
        position.set(p.x + xx, dy, p.z + zz);
        rotation.setFromEuler(euler.set(tilt, yaw, 0));
        matrix.compose(position, rotation, size);
        mesh.setMatrixAt(index, matrix);
      };
      compose(body, i, 0, 0.95, 0);
      compose(head, i, 0, 1.43, 0);
      compose(hat, i, 0, 1.61, 0);
      for (const side of [-1, 1]) {
        const k = i * 2 + (side > 0 ? 1 : 0);
        compose(
          leg,
          k,
          side * 0.11,
          0.41,
          walk * side * 0.11,
          walk * side * 0.47,
        );
        compose(
          arm,
          k,
          side * 0.26,
          0.94,
          -walk * side * 0.07,
          -walk * side * 0.42,
        );
      }
    }
    meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
  };
  update(0);
  return {
    root,
    update,
    setQuality(low: boolean) {
      body.count = head.count = hat.count = low ? 18 : count;
      leg.count = arm.count = (low ? 18 : count) * 2;
    },
  };
}
