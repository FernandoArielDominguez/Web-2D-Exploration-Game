import type { Rect } from '../types';

export abstract class Entity {
  readonly bounds: Rect;

  protected constructor(x: number, y: number, width: number, height: number) {
    this.bounds = { x, y, width, height };
  }

  get position() {
    return { x: this.bounds.x, y: this.bounds.y };
  }

  abstract update(deltaTime: number): void;
}