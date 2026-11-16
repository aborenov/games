import * as T from "three";
import { createActors, type CityActors } from "./actors";
import { COLORS, pickedPlace } from "./geometry";
import { PLACES } from "./places";
import { createWorld, type CityWorld } from "./world";
import type { CityMarker, CityPlaceId, CityView } from "./types";

interface EngineOptions {
  view: CityView;
  onSelect: (id: CityPlaceId) => void;
  onError: (message: string) => void;
  onReady: () => void;
}
type MarkerElement = { id: CityPlaceId; element: HTMLButtonElement };
interface Pointer {
  x: number;
  y: number;
  startX: number;
  startY: number;
  marker: CityPlaceId | null;
}
interface CameraPose {
  x: number;
  z: number;
  zoom: number;
  angle: number;
}

export class CityEngine {
  readonly scene = new T.Scene();
  readonly camera = new T.OrthographicCamera(-50, 50, 50, -50, 0.1, 500);
  readonly renderer: T.WebGLRenderer;
  readonly world: CityWorld;
  readonly actors: CityActors;
  private host: HTMLElement;
  private options: EngineOptions;
  private view: CityView;
  private pose: CameraPose = { x: 3, z: -5, zoom: 1, angle: Math.PI * 0.22 };
  private tween: {
    from: CameraPose;
    to: CameraPose;
    elapsed: number;
    duration: number;
  } | null = null;
  private pointers = new Map<number, Pointer>();
  private gestureMoved = false;
  private pinched = false;
  private selection: T.Mesh;
  private selected: CityPlaceId | null = null;
  private markerElements: MarkerElement[] = [];
  private resizeObserver: ResizeObserver;
  private raf = 0;
  private lastTime = 0;
  private time = 0;
  private dirty = true;
  private disposed = false;
  private width = 1;
  private height = 1;
  private raycaster = new T.Raycaster();
  private plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  private ndc = new T.Vector2();
  private frameCount = 0;
  private renderedFrames = 0;
  private lastTapped: CityPlaceId | null = null;
  private directional: T.DirectionalLight;

  constructor(host: HTMLElement, options: EngineOptions) {
    this.host = host;
    this.options = options;
    this.view = options.view;
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.setClearColor("#dce0cb");
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Трёхмерный город Белфорд. Перетаскивайте для обзора.",
    );
    this.renderer.domElement.style.cssText =
      "display:block;width:100%;height:100%;touch-action:none;outline:none;";
    this.renderer.domElement.tabIndex = 0;
    host.prepend(this.renderer.domElement);
    this.scene.background = new T.Color("#dce0cb");
    this.scene.fog = new T.Fog("#dce0cb", 140, 285);
    this.scene.add(new T.HemisphereLight("#f2f1e6", "#8b9c92", 1.65));
    this.directional = new T.DirectionalLight("#fff0d6", 3.1);
    this.directional.position.set(-48, 90, 38);
    this.directional.castShadow = true;
    Object.assign(this.directional.shadow.camera, {
      left: -83,
      right: 83,
      top: 83,
      bottom: -83,
      near: 1,
      far: 190,
    });
    this.directional.shadow.normalBias = 0.075;
    this.directional.shadow.bias = -0.0002;
    this.directional.shadow.radius = 2;
    this.scene.add(this.directional, this.directional.target);
    this.world = createWorld();
    this.actors = createActors(this.world);
    this.scene.add(this.world.root, this.actors.root);
    this.selection = new T.Mesh(
      new T.RingGeometry(0.95, 1, 64),
      new T.MeshBasicMaterial({
        color: COLORS.teal,
        transparent: true,
        opacity: 0.85,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    this.selection.rotation.x = -Math.PI / 2;
    this.selection.position.y = 0.26;
    this.selection.visible = false;
    this.scene.add(this.selection);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.bind();
    this.updateView(options.view);
    this.resize();
    if (import.meta.env.DEV) {
      (host as HTMLElement & { cityEngine?: CityEngine }).cityEngine = this;
      (window as Window & { __cityEngine?: CityEngine }).__cityEngine = this;
    }
    this.world.applyView(this.view);
    this.render();
    host.dataset.cityReady = "true";
    this.options.onReady();
    this.raf = requestAnimationFrame(this.tick);
  }

  setCallbacks(
    onSelect: EngineOptions["onSelect"],
    onError: EngineOptions["onError"],
  ) {
    this.options.onSelect = onSelect;
    this.options.onError = onError;
  }
  updateView(view: CityView) {
    const qualityChanged = view.quality !== this.view?.quality;
    this.view = view;
    this.world.applyView(view);
    this.actors.applyView(view);
    this.actors.update(0, this.time, view);
    this.renderer.shadowMap.needsUpdate = true;
    if (!view.motion && this.tween) this.tween = null;
    if (qualityChanged) this.resize();
    this.dirty = true;
  }
  setMarkers(elements: MarkerElement[], _markers?: CityMarker[]) {
    this.markerElements = elements;
    this.projectMarkers();
  }
  select(id: CityPlaceId | null) {
    this.selected = id;
    const place = PLACES.find((p) => p.id === id);
    this.selection.visible = !!place;
    if (place) {
      const radius =
        id === "kiosk"
          ? 3.4
          : id === "tram"
            ? 3.9
            : id === "park"
              ? 8
              : id === "factory"
                ? 11
                : 8.2;
      this.selection.userData.radius = radius;
      this.selection.scale.setScalar(radius);
      this.selection.position.set(place.position[0], 0.28, place.position[2]);
    }
    this.dirty = true;
  }
  focus = (id: string) => {
    const place = PLACES.find((p) => p.id === id);
    if (!place) return;
    const p =
      id === "tram"
        ? this.actors.tram.position
        : new T.Vector3(...place.position);
    this.moveCamera({ x: p.x, z: p.z, zoom: 1.65, angle: this.pose.angle });
  };
  reset = () =>
    this.moveCamera({ x: 3, z: -5, zoom: 1, angle: Math.PI * 0.22 });
  zoomBy = (factor: number) => {
    if (!Number.isFinite(factor) || factor <= 0) return;
    this.moveCamera(
      {
        ...this.pose,
        zoom: T.MathUtils.clamp(this.pose.zoom * factor, 0.64, 2.7),
      },
      0.22,
    );
  };
  rotate = () =>
    this.moveCamera(
      { ...this.pose, angle: this.pose.angle + Math.PI / 2 },
      0.48,
    );

  diagnostics() {
    const info = this.renderer.info;
    return {
      frames: this.renderedFrames,
      tickFrames: this.frameCount,
      time: this.time,
      motion: this.view.motion,
      quality: this.view.quality,
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        pixelRatio: this.renderer.getPixelRatio(),
        size: [this.width, this.height],
        shadowSize: this.directional.shadow.mapSize.x,
        cachedStaticShadows: !this.renderer.shadowMap.autoUpdate,
      },
      camera: {
        ...this.pose,
        position: this.camera.position.toArray(),
        zoom: this.camera.zoom,
      },
      selected: this.selected,
      lastTapped: this.lastTapped,
      tram: this.actors.tram.position.toArray(),
      boat: this.actors.boat.position.toArray(),
      reporter: this.actors.reporter.visible
        ? this.actors.reporter.position.toArray()
        : null,
      factory: this.view.factory,
      kiosk: this.view.kiosk,
      press: this.view.press,
      harbour: this.view.harbour ?? "open",
      tramAd: this.view.tramAd,
      boatAd: this.view.boatAd,
      markers: this.markerElements.map((m) => ({
        id: m.id,
        left: m.element.style.left,
        top: m.element.style.top,
        hidden: m.element.hidden,
      })),
      buildings:
        "Original procedural geometry; façades, pitched roofs, clocks, quays, rails and merged repeated architectural details",
    };
  }
  /** Useful for real-browser gesture tests; this is a projection, not a selection shortcut. */
  projectPlace(id: string) {
    const place = PLACES.find((p) => p.id === id);
    if (!place) return null;
    const p = new T.Vector3(...place.position);
    p.y = id === "hall" ? 10 : id === "factory" ? 5 : 4;
    p.project(this.camera);
    return {
      x: ((p.x + 1) * this.width) / 2,
      y: ((1 - p.y) * this.height) / 2,
    };
  }

  private moveCamera(to: CameraPose, duration = 0.5) {
    this.pointers.clear();
    this.tween = null;
    to.x = T.MathUtils.clamp(to.x, -45, 45);
    to.z = T.MathUtils.clamp(to.z, -43, 46);
    if (this.view.motion)
      this.tween = { from: { ...this.pose }, to, elapsed: 0, duration };
    else {
      this.pose = { ...to };
      this.updateCamera();
    }
    this.dirty = true;
  }
  private resize() {
    if (this.disposed) return;
    const rect = this.host.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const low =
      this.view.quality === "low" ||
      (this.view.quality === "auto" && this.width < 650);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, low ? 1.35 : 1.8),
    );
    this.renderer.setSize(this.width, this.height, false);
    this.actors.setQuality(low);
    this.actors.update(0, this.time, this.view);
    this.renderer.shadowMap.autoUpdate = !low;
    this.renderer.shadowMap.needsUpdate = true;
    const mapSize = low ? 1024 : 2048;
    if (this.directional.shadow.mapSize.x !== mapSize) {
      this.directional.shadow.map?.dispose();
      this.directional.shadow.map = null;
      this.directional.shadow.mapSize.set(mapSize, mapSize);
    }
    const aspect = this.width / this.height,
      vertical = this.width < 650 ? 92 / aspect : Math.max(77, 110 / aspect);
    this.camera.left = (-vertical * aspect) / 2;
    this.camera.right = (vertical * aspect) / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.updateCamera();
    this.dirty = true;
  }
  private updateCamera() {
    const distance = 115;
    this.camera.position.set(
      this.pose.x + Math.sin(this.pose.angle) * distance,
      105,
      this.pose.z + Math.cos(this.pose.angle) * distance,
    );
    this.camera.lookAt(this.pose.x, 0, this.pose.z);
    this.camera.zoom = this.pose.zoom;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  private projectMarkers() {
    const v = new T.Vector3();
    this.markerElements.forEach(({ id, element }) => {
      const place = PLACES.find((p) => p.id === id);
      if (!place) return;
      if (id === "tram")
        v.copy(this.actors.tram.position).add(new T.Vector3(0, 5, 0));
      else v.set(...place.position);
      v.project(this.camera);
      const x = ((v.x + 1) * this.width) / 2,
        y = ((1 - v.y) * this.height) / 2;
      element.hidden =
        v.z > 1 ||
        v.z < -1 ||
        x < -30 ||
        x > this.width + 30 ||
        y < (this.width < 650 ? 210 : 50) ||
        y > this.height - 80;
      element.style.left = `${x.toFixed(1)}px`;
      element.style.top = `${y.toFixed(1)}px`;
    });
  }
  private render() {
    this.renderer.render(this.scene, this.camera);
    this.projectMarkers();
    this.renderedFrames++;
    this.dirty = false;
  }
  private tick = (now: number) => {
    if (this.disposed || document.hidden) return;
    const dt = this.lastTime
      ? Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000))
      : 0;
    this.lastTime = now;
    this.frameCount++;
    if (this.view.motion) {
      this.time += dt;
      this.actors.update(dt, this.time, this.view);
      if (this.selected === "tram")
        this.selection.position.set(
          this.actors.tram.position.x,
          0.28,
          this.actors.tram.position.z,
        );
      if (this.selection.visible)
        this.selection.scale.setScalar(
          this.selection.userData.radius *
            (1 + Math.sin(this.time * 2) * 0.014),
        );
      if (this.tween) {
        this.tween.elapsed += dt;
        const t = T.MathUtils.clamp(
            this.tween.elapsed / this.tween.duration,
            0,
            1,
          ),
          ease = t * t * (3 - 2 * t);
        for (const key of ["x", "z", "zoom", "angle"] as const)
          this.pose[key] = T.MathUtils.lerp(
            this.tween.from[key],
            this.tween.to[key],
            ease,
          );
        this.updateCamera();
        if (t === 1) this.tween = null;
      }
      this.dirty = true;
    }
    if (this.dirty) this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private groundPoint(x: number, y: number) {
    this.ndc.set((x / this.width) * 2 - 1, 1 - (y / this.height) * 2);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const v = new T.Vector3();
    return this.raycaster.ray.intersectPlane(this.plane, v) ? v : null;
  }
  private localPoint(event: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }
  private pointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    this.tween = null;
    const p = this.localPoint(event);
    if (this.pointers.size === 0) {
      this.gestureMoved = false;
      this.pinched = false;
    }
    const marker =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(".city-marker[data-place]")?.dataset
            .place
        : null;
    this.pointers.set(event.pointerId, {
      ...p,
      startX: p.x,
      startY: p.y,
      marker: PLACES.some((place) => place.id === marker)
        ? (marker as CityPlaceId)
        : null,
    });
    if (this.pointers.size > 1) {
      this.pinched = true;
      this.gestureMoved = true;
    }
    this.host.setPointerCapture(event.pointerId);
    this.host.dataset.dragging = "true";
  };
  private pointerMove = (event: PointerEvent) => {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    event.preventDefault();
    const p = this.localPoint(event),
      old = { x: pointer.x, y: pointer.y };
    if (Math.hypot(p.x - pointer.startX, p.y - pointer.startY) > 5)
      this.gestureMoved = true;
    if (this.pointers.size === 2) {
      const other = [...this.pointers.entries()].find(
        ([id]) => id !== event.pointerId,
      )?.[1];
      if (other) {
        const before = Math.hypot(old.x - other.x, old.y - other.y),
          after = Math.hypot(p.x - other.x, p.y - other.y);
        if (before > 5)
          this.pose.zoom = T.MathUtils.clamp(
            (this.pose.zoom * after) / before,
            0.64,
            2.7,
          );
        this.updateCamera();
      }
    } else if (this.pointers.size === 1 && this.gestureMoved) {
      const a = this.groundPoint(old.x, old.y),
        next = this.groundPoint(p.x, p.y);
      if (a && next) {
        this.pose.x = T.MathUtils.clamp(this.pose.x + a.x - next.x, -49, 49);
        this.pose.z = T.MathUtils.clamp(this.pose.z + a.z - next.z, -46, 49);
        this.updateCamera();
      }
    }
    pointer.x = p.x;
    pointer.y = p.y;
    this.dirty = true;
  };
  private pointerUp = (event: PointerEvent) => {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    const end = this.localPoint(event);
    if (Math.hypot(end.x - pointer.startX, end.y - pointer.startY) > 5)
      this.gestureMoved = true;
    this.pointers.delete(event.pointerId);
    if (
      event.type === "pointerup" &&
      !this.gestureMoved &&
      !this.pinched &&
      this.pointers.size === 0
    ) {
      if (pointer.marker) {
        this.lastTapped = pointer.marker;
        this.options.onSelect(pointer.marker);
      } else {
        const p = this.localPoint(event);
        this.ndc.set((p.x / this.width) * 2 - 1, 1 - (p.y / this.height) * 2);
        this.raycaster.setFromCamera(this.ndc, this.camera);
        const hits = this.raycaster.intersectObjects(
          [this.world.root, this.actors.root],
          true,
        );
        for (const hit of hits) {
          if (!isActuallyVisible(hit.object) || hit.object.userData.passThrough)
            continue;
          const id = pickedPlace(hit);
          if (id) {
            this.lastTapped = id;
            this.options.onSelect(id);
          }
          break;
        }
      }
    }
    if (this.pointers.size === 0) this.host.dataset.dragging = "false";
  };
  private wheel = (event: WheelEvent) => {
    event.preventDefault();
    this.tween = null;
    if (this.pointers.size) this.gestureMoved = true;
    this.pose.zoom = T.MathUtils.clamp(
      this.pose.zoom * Math.exp(-event.deltaY * 0.0012),
      0.64,
      2.7,
    );
    this.updateCamera();
    this.dirty = true;
  };
  private keyDown = (event: KeyboardEvent) => {
    const amount = 4 / this.pose.zoom;
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      event.preventDefault();
      const dx =
          event.key === "ArrowLeft"
            ? -amount
            : event.key === "ArrowRight"
              ? amount
              : 0,
        dz =
          event.key === "ArrowUp"
            ? -amount
            : event.key === "ArrowDown"
              ? amount
              : 0;
      this.moveCamera(
        {
          ...this.pose,
          x:
            this.pose.x +
            dx * Math.cos(this.pose.angle) +
            dz * Math.sin(this.pose.angle),
          z:
            this.pose.z -
            dx * Math.sin(this.pose.angle) +
            dz * Math.cos(this.pose.angle),
        },
        0.18,
      );
    } else if (event.key === "+" || event.key === "=") this.zoomBy(1.2);
    else if (event.key === "-") this.zoomBy(1 / 1.2);
    else if (event.key === "Home") this.reset();
  };
  private visibility = () => {
    cancelAnimationFrame(this.raf);
    this.lastTime = 0;
    if (!document.hidden && !this.disposed) {
      this.dirty = true;
      this.raf = requestAnimationFrame(this.tick);
    }
  };
  private contextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(this.raf);
    this.options.onError(
      "Графический контекст города потерян. Сохранение игры не затронуто. Обновите страницу, чтобы восстановить вид города.",
    );
  };
  private suppressGestureClick = (event: MouseEvent) => {
    if (event.detail > 0 && (this.gestureMoved || this.pinched)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  private bind() {
    const h = this.host;
    h.addEventListener("pointerdown", this.pointerDown);
    h.addEventListener("pointermove", this.pointerMove);
    h.addEventListener("pointerup", this.pointerUp);
    h.addEventListener("pointercancel", this.pointerUp);
    h.addEventListener("wheel", this.wheel, { passive: false });
    h.addEventListener("keydown", this.keyDown);
    h.addEventListener("click", this.suppressGestureClick, true);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    document.addEventListener("visibilitychange", this.visibility);
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    const c = this.renderer.domElement,
      h = this.host;
    h.removeEventListener("pointerdown", this.pointerDown);
    h.removeEventListener("pointermove", this.pointerMove);
    h.removeEventListener("pointerup", this.pointerUp);
    h.removeEventListener("pointercancel", this.pointerUp);
    h.removeEventListener("wheel", this.wheel);
    h.removeEventListener("keydown", this.keyDown);
    h.removeEventListener("click", this.suppressGestureClick, true);
    c.removeEventListener("webglcontextlost", this.contextLost);
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    this.scene.traverse((object) => {
      const mesh = object as T.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) {
        const all = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        all.forEach((m) => {
          materials.add(m);
          Object.values(m).forEach((v) => {
            if (v instanceof T.Texture) textures.add(v);
          });
        });
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    this.directional.shadow.map?.dispose();
    this.renderer.dispose();
    c.remove();
    delete (this.host as HTMLElement & { cityEngine?: CityEngine }).cityEngine;
    const win = window as Window & { __cityEngine?: CityEngine };
    if (win.__cityEngine === this) delete win.__cityEngine;
  }
}

function isActuallyVisible(object: T.Object3D) {
  let node: T.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}
