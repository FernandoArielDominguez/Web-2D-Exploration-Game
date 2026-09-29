import { Entity } from './Entity';
import type { CameraBounds } from '../core/Camera';
import type { Direction } from '../types';
import type { Input } from '../core/Input';

export class Player extends Entity {
  readonly maxHealth = 100;
  readonly maxEnergy = 100;
  health = this.maxHealth;
  energy = this.maxEnergy;
  readonly speed = 230;
  direction: Direction = 'down';
  state: 'idle' | 'walking' = 'idle';

  constructor(x: number, y: number) {
    super(x, y, 34, 44);
  }

  updateFromInput(
    input: Input,
    deltaTime: number,
    worldBounds: CameraBounds,
  ): void {
    const movement = input.getMovement();
    const magnitude = Math.hypot(movement.x, movement.y);

    if (magnitude === 0) {
      this.state = 'idle';
      return;
    }

    const normalizedX = movement.x / magnitude;
    const normalizedY = movement.y / magnitude;
    this.bounds.x += normalizedX * this.speed * deltaTime;
    this.bounds.y += normalizedY * this.speed * deltaTime;
    this.bounds.x = Math.min(
      Math.max(this.bounds.width / 2, this.bounds.x),
      worldBounds.width - this.bounds.width / 2,
    );
    this.bounds.y = Math.min(
      Math.max(this.bounds.height / 2, this.bounds.y),
      worldBounds.height - this.bounds.height / 2,
    );

    this.state = 'walking';
    if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
      this.direction = normalizedX > 0 ? 'right' : 'left';
    } else {
      this.direction = normalizedY > 0 ? 'down' : 'up';
    }
  }

  update(): void {
    // Player movement is owned by updateFromInput so input stays outside the entity.
  }
}