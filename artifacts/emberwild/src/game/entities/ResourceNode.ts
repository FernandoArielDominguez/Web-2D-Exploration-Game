import { Entity } from './Entity';

import type { Vec2 } from '../types';
import type { SavedResourceState } from '../core/SaveGame';

export type ResourceNodeKind = 'tree' | 'ore';

export type ResourceNodeDefinition = {
  id: string;
  name: string;
  itemId: string;
  kind: ResourceNodeKind;
  asset: string;
  maxDurability: number;
  dropAmount: number;
  coinDrop: number;
};

export type ResourceNodeState = {
  id: string;
  name: string;
  itemId: string;
  durability: number;
  maxDurability: number;
  distance: number;
  position: Vec2;
};

export type ResourceHitResult = {
  applied: boolean;
  dropped: number;
  depleted: boolean;
  durability: number;
};

export class ResourceNode extends Entity {
  private static readonly RESPAWN_SECONDS = 18;

  durability: number;
  private hitPulse = 0;
  private depleted = false;
  private respawnTimer = 0;

  constructor(
    readonly definition: ResourceNodeDefinition,
    x: number,
    y: number,
    readonly id = definition.id,
  ) {
    super(x, y, definition.kind === 'tree' ? 58 : 52, definition.kind === 'tree' ? 72 : 48);
    this.durability = definition.maxDurability;
  }

  get isDepleted(): boolean {
    return this.depleted;
  }

  hit(): ResourceHitResult {
    if (this.depleted) {
      return {
        applied: false,
        dropped: 0,
        depleted: true,
        durability: this.durability,
      };
    }

    this.durability = Math.max(0, this.durability - 1);
    this.hitPulse = 0.22;
    if (this.durability === 0) {
      this.depleted = true;
      this.respawnTimer = ResourceNode.RESPAWN_SECONDS;
      return {
        applied: true,
        dropped: this.definition.dropAmount,
        depleted: true,
        durability: this.durability,
      };
    }

    return {
      applied: true,
      dropped: 0,
      depleted: false,
      durability: this.durability,
    };
  }

  getState(playerPosition: Vec2): ResourceNodeState {
    return {
      id: this.id,
      name: this.definition.name,
      itemId: this.definition.itemId,
      durability: this.durability,
      maxDurability: this.definition.maxDurability,
      distance: Math.round(Math.hypot(this.position.x - playerPosition.x, this.position.y - playerPosition.y)),
      position: this.position,
    };
  }

  get isPulsing(): boolean {
    return this.hitPulse > 0;
  }

  getSaveState(): SavedResourceState {
    return {
      durability: this.durability,
      depleted: this.depleted,
    };
  }

  restoreSaveState(state: SavedResourceState | undefined): void {
    if (!state) {
      return;
    }

    this.durability = Math.min(
      this.definition.maxDurability,
      Math.max(0, Math.floor(state.durability)),
    );
    this.depleted = state.depleted || this.durability === 0;
    this.respawnTimer = this.depleted ? ResourceNode.RESPAWN_SECONDS : 0;
  }

  update(deltaTime: number): void {
    this.hitPulse = Math.max(0, this.hitPulse - deltaTime);
    if (!this.depleted) {
      return;
    }

    this.respawnTimer = Math.max(0, this.respawnTimer - deltaTime);
    if (this.respawnTimer === 0) {
      this.durability = this.definition.maxDurability;
      this.depleted = false;
    }
  }
}