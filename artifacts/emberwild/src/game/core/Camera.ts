import type { Vec2 } from '../types';

export type CameraBounds = {
  width: number;
  height: number;
};

export class Camera {
  readonly position: Vec2 = { x: 0, y: 0 };
  zoom = 1;

  private viewport = { width: 1, height: 1 };
  private bounds: CameraBounds = { width: 1, height: 1 };

  setViewport(width: number, height: number): void {
    this.viewport = { width, height };
    this.clamp();
  }

  setBounds(bounds: CameraBounds): void {
    this.bounds = bounds;
    this.clamp();
  }

  follow(target: Vec2, deltaTime: number, smooth = 8): void {
    const targetX = target.x - this.viewport.width / (2 * this.zoom);
    const targetY = target.y - this.viewport.height / (2 * this.zoom);
    const amount = 1 - Math.exp(-smooth * deltaTime);

    this.position.x += (targetX - this.position.x) * amount;
    this.position.y += (targetY - this.position.y) * amount;
    this.clamp();
  }

  worldToScreen(point: Vec2): Vec2 {
    return {
      x: (point.x - this.position.x) * this.zoom,
      y: (point.y - this.position.y) * this.zoom,
    };
  }

  screenToWorld(point: Vec2): Vec2 {
    return {
      x: point.x / this.zoom + this.position.x,
      y: point.y / this.zoom + this.position.y,
    };
  }

  private clamp(): void {
    const visibleWidth = this.viewport.width / this.zoom;
    const visibleHeight = this.viewport.height / this.zoom;
    const maxX = Math.max(0, this.bounds.width - visibleWidth);
    const maxY = Math.max(0, this.bounds.height - visibleHeight);

    this.position.x = Math.min(Math.max(0, this.position.x), maxX);
    this.position.y = Math.min(Math.max(0, this.position.y), maxY);
  }
}