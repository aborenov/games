import Phaser from 'phaser';
import type { BuildingId, GameState } from '../game/types';

export interface Transform { zoom: number; x: number; y: number; width: number; height: number; worldWidth: number; worldHeight: number }
export const LANDMARKS: Record<BuildingId, { x: number; y: number }> = {
  newsroom: { x: .52, y: .30 }, bank: { x: .84, y: .26 },
  press: { x: .84, y: .625 }, lot: { x: .19, y: .555 }, market: { x: .22, y: .665 },
};
export interface Callbacks {
  ready: () => void;
  transform: (transform: Transform) => void;
  building: (id: BuildingId) => void;
  fail: (message: string) => void;
}

export class CityScene extends Phaser.Scene {
  private callbacks: Callbacks;
  private state: GameState;
  private worldWidth = 852;
  private worldHeight = 1846;
  private baseZoom = 1;
  private lastPointer: { x: number; y: number } | null = null;
  private moved = 0;
  private pinchDistance = 0;
  private kiosk!: Phaser.GameObjects.Image;
  private boat!: Phaser.GameObjects.Image;
  private tram!: Phaser.GameObjects.Image;
  private steam: Phaser.GameObjects.Image[] = [];
  private lastKiosk = '';
  private lastTransform = '';
  private phase = 0;

  constructor(state: GameState, callbacks: Callbacks) {
    super({ key: 'BelfordCity' });
    this.state = state;
    this.callbacks = callbacks;
  }
  preload() {
    for (const key of ['city-map', 'kiosk', 'boat', 'tram', 'steam']) this.load.image(key, '/assets/' + key + '.webp');
    this.load.on('loaderror', () => this.callbacks.fail('Не удалось загрузить город. Проверьте соединение и обновите игру.'));
  }
  create() {
    const image = this.textures.get('city-map').getSourceImage();
    this.worldWidth = image.width; this.worldHeight = image.height;
    this.add.image(0, 0, 'city-map').setOrigin(0);
    this.steam = Array.from({ length: 4 }, () => this.add.image(0, 0, 'steam').setDepth(2).setAlpha(0));
    this.boat = this.add.image(0, 0, 'boat').setOrigin(.5, .7).setDepth(3);
    this.tram = this.add.image(0, 0, 'tram').setOrigin(.5, .85).setDepth(4);
    this.kiosk = this.add.image(this.worldWidth * .19, this.worldHeight * .554, 'kiosk').setOrigin(.5, .88).setDepth(5);
    this.kiosk.setDisplaySize(this.worldWidth * .19, this.worldWidth * .19);
    this.input.addPointer(1);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.lastPointer = { x: p.x, y: p.y }; this.moved = 0; this.pinchDistance = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const first = this.input.pointer1, second = this.input.pointer2;
      if (first?.isDown && second?.isDown) {
        const distance = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
        if (this.pinchDistance > 0) this.zoom(this.cameras.main.zoom * distance / this.pinchDistance);
        this.pinchDistance = distance; this.moved = 100;
        return;
      }
      if (!p.isDown || !this.lastPointer) return;
      const dx = p.x - this.lastPointer.x, dy = p.y - this.lastPointer.y;
      this.moved += Math.abs(dx) + Math.abs(dy);
      this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      this.lastPointer = { x: p.x, y: p.y };
      this.clampCamera(); this.reportTransform();
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      this.pinchDistance = 0;
      if (this.moved < 12) {
        const point = this.cameras.main.getWorldPoint(p.x, p.y), nx = point.x / this.worldWidth, ny = point.y / this.worldHeight;
        if (nx > .62 && ny > .12 && ny < .28) this.callbacks.building('bank');
        else if (nx > .66 && ny > .53 && ny < .69) this.callbacks.building('press');
        else if (nx < .31 && ny > .47 && ny < .59) this.callbacks.building('lot');
        else if (nx < .36 && ny > .59 && ny < .72) this.callbacks.building('market');
        else if (nx > .24 && nx < .72 && ny > .28 && ny < .50) this.callbacks.building('newsroom');
      }
      this.lastPointer = null;
    });
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => this.zoom(this.cameras.main.zoom * (dy > 0 ? .92 : 1.08)));
    this.scale.on('resize', () => this.fit());
    this.fit(); this.syncState(this.state); this.callbacks.ready();
  }
  private fit() {
    const camera = this.cameras.main;
    camera.setViewport(0, 0, this.scale.width, this.scale.height);
    this.baseZoom = Math.max(this.scale.width / this.worldWidth, this.scale.height / this.worldHeight);
    camera.setZoom(this.baseZoom * 1.12);
    camera.centerOn(this.worldWidth * .51, this.worldHeight * .485);
    this.clampCamera(); this.reportTransform();
  }
  private clampCamera() {
    const c = this.cameras.main;
    const viewWidth = c.width / c.zoom, viewHeight = c.height / c.zoom;
    const pivotX = (viewWidth - c.width) * c.originX, pivotY = (viewHeight - c.height) * c.originY;
    c.scrollX = Phaser.Math.Clamp(c.scrollX - pivotX, 0, Math.max(0, this.worldWidth - viewWidth)) + pivotX;
    c.scrollY = Phaser.Math.Clamp(c.scrollY - pivotY, 0, Math.max(0, this.worldHeight - viewHeight)) + pivotY;
  }
  private reportTransform() {
    const c = this.cameras.main;
    const key = [c.zoom, c.scrollX, c.scrollY, c.width, c.height].join(',');
    if (key === this.lastTransform) return;
    this.lastTransform = key;
    const x = c.scrollX - (c.width / c.zoom - c.width) * c.originX;
    const y = c.scrollY - (c.height / c.zoom - c.height) * c.originY;
    this.callbacks.transform({ zoom: c.zoom, x, y, width: c.width, height: c.height, worldWidth: this.worldWidth, worldHeight: this.worldHeight });
  }
  zoom(value: number) {
    if (!this.cameras?.main) return;
    const c = this.cameras.main, center = c.getWorldPoint(c.width / 2, c.height / 2);
    c.setZoom(Phaser.Math.Clamp(value, this.baseZoom, this.baseZoom * 2.5));
    c.centerOn(center.x, center.y); this.clampCamera(); this.reportTransform();
  }
  zoomBy(factor: number) { if (this.cameras?.main) this.zoom(this.cameras.main.zoom * factor); }
  resetView() { if (this.cameras?.main) this.fit(); }
  syncState(next: GameState) {
    this.state = next;
    if (!this.kiosk) return;
    const status = next.city.kiosk.status;
    this.kiosk.setVisible(status !== 'locked').setAlpha(status === 'building' ? .4 : 1);
    if (this.lastKiosk === 'building' && status === 'open' && next.settings.motion) {
      this.tweens.add({ targets: this.kiosk, alpha: { from: .2, to: 1 }, duration: 700, ease: 'Sine.Out' });
    }
    this.lastKiosk = status;
  }
  update(_time: number, delta: number) {
    if (!this.boat || !this.tram) return;
    if (this.state.settings.motion) this.phase += Math.min(delta, 50) / 1000;
    const boatProgress = (this.phase / 55) % 1;
    this.boat.setPosition(this.worldWidth * (.08 + boatProgress * .84), this.worldHeight * (.785 + Math.sin(boatProgress * Math.PI) * .035));
    this.boat.setDisplaySize(this.worldWidth * .19, this.worldWidth * .19 * .5625);
    const tramProgress = (this.phase / 35) % 1, t = .5 - Math.cos(tramProgress * Math.PI * 2) * .5;
    this.tram.setPosition(this.worldWidth * (.45 + t * .11), this.worldHeight * (.515 + t * .135));
    this.tram.setDisplaySize(this.worldWidth * .18, this.worldWidth * .18 * .5625).setFlipX(tramProgress > .5);
    this.steam.forEach((puff, i) => {
      const life = (this.phase / 6 + i / this.steam.length) % 1;
      const size = this.worldWidth * (.04 + life * .16);
      puff.setVisible(this.state.city.press.status === 'open')
        .setPosition(this.worldWidth * (.878 + life * .12), this.worldHeight * (.447 - life * .06))
        .setDisplaySize(size, size).setRotation(life * .3).setAlpha(Math.sin(life * Math.PI) * .38);
    });
  }
}
