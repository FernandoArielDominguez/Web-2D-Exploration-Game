import type { Camera } from '../core/Camera';
import type { AssetManager } from '../core/AssetManager';
import { RESOURCE_DEFINITIONS_BY_ID, RESOURCE_SPAWNS } from '../data/resource-spawns';
import {
  REGION_DEFINITIONS,
  REGION_DEFINITIONS_BY_ID,
  STARTING_REGION_ID,
  type RegionDefinition,
} from '../data/regions';
import { STRUCTURE_DEFINITIONS, type StructureDefinition } from '../data/structures';
import type { SavedResourceState } from '../core/SaveGame';
import type { Player } from '../entities/Player';
import { ResourceNode, type ResourceHitResult } from '../entities/ResourceNode';
import type { Vec2 } from '../types';

export const WORLD_BOUNDS = {
  width: 2600,
  height: 1800,
};

const TILE_SIZE = 64;

export class World {
  readonly zone = 'Mosslight Meadow';
  readonly regions = REGION_DEFINITIONS;
  readonly resources = RESOURCE_SPAWNS.flatMap((spawn) => {
    const definition = RESOURCE_DEFINITIONS_BY_ID.get(spawn.definitionId);
    return definition ? [new ResourceNode(definition, spawn.x, spawn.y, spawn.id)] : [];
  });
  readonly structures = STRUCTURE_DEFINITIONS;

  readonly interactionRange = 170;

  private unlockedRegionIds = new Set<string>([STARTING_REGION_ID]);

  getSaveState(): Record<string, SavedResourceState> {
    return Object.fromEntries(
      this.resources.map((resource) => [resource.id, resource.getSaveState()]),
    );
  }

  restoreSaveState(
    savedResources: Record<string, SavedResourceState>,
    unlockedRegions: string[] = [STARTING_REGION_ID],
  ): void {
    this.unlockedRegionIds = new Set(
      unlockedRegions.filter((regionId) => REGION_DEFINITIONS_BY_ID.has(regionId)),
    );
    this.unlockedRegionIds.add(STARTING_REGION_ID);
    this.resources.forEach((resource) => {
      resource.restoreSaveState(savedResources[resource.id]);
    });
  }

  getUnlockedRegionIds(): string[] {
    return [...this.unlockedRegionIds];
  }

  isRegionUnlocked(regionId: string): boolean {
    return this.unlockedRegionIds.has(regionId);
  }

  unlockRegion(regionId: string): boolean {
    if (!REGION_DEFINITIONS_BY_ID.has(regionId)) {
      return false;
    }

    this.unlockedRegionIds.add(regionId);
    return true;
  }

  lockRegion(regionId: string): void {
    if (regionId !== STARTING_REGION_ID) {
      this.unlockedRegionIds.delete(regionId);
    }
  }

  getRegionAt(position: Vec2): RegionDefinition | null {
    return this.regions.find(
      (region) =>
        position.x >= region.bounds.left &&
        position.x <= region.bounds.right &&
        position.y >= region.bounds.top &&
        position.y <= region.bounds.bottom,
    ) ?? null;
  }

  isPositionUnlocked(position: Vec2): boolean {
    const region = this.getRegionAt(position);
    return region ? this.isRegionUnlocked(region.id) : false;
  }

  render(
    context: CanvasRenderingContext2D,
    camera: Camera,
    viewport: { width: number; height: number },
    player: Player,
    assets: AssetManager,
  ): void {
    const visible = {
      left: Math.floor(camera.position.x / TILE_SIZE) * TILE_SIZE,
      top: Math.floor(camera.position.y / TILE_SIZE) * TILE_SIZE,
      right: camera.position.x + viewport.width / camera.zoom + TILE_SIZE,
      bottom: camera.position.y + viewport.height / camera.zoom + TILE_SIZE,
    };

    context.fillStyle = '#213b3a';
    context.fillRect(0, 0, viewport.width, viewport.height);

    for (let y = visible.top; y < visible.bottom; y += TILE_SIZE) {
      for (let x = visible.left; x < visible.right; x += TILE_SIZE) {
        const shade = (Math.abs(x * 13 + y * 7) % 4) * 0.015;
        const screen = camera.worldToScreen({ x, y });
        context.fillStyle = `rgba(116, 151, 112, ${0.54 + shade})`;
        context.fillRect(
          screen.x,
          screen.y,
          TILE_SIZE * camera.zoom + 1,
          TILE_SIZE * camera.zoom + 1,
        );

        this.drawGroundDetail(context, camera, x, y);
      }
    }

    this.drawLockedRegions(context, camera);
    this.structures.forEach((structure) => {
      if (this.isRegionUnlocked(structure.regionId)) {
        this.drawStructure(context, camera, structure);
      }
    });
    this.resources.forEach((resource) => {
      const regionId = RESOURCE_SPAWNS.find((spawn) => spawn.id === resource.id)?.regionId;
      if (regionId && this.isRegionUnlocked(regionId)) {
        this.drawResource(context, camera, resource, player.position, assets);
      }
    });
    this.drawWorldEdge(context, camera);
    this.drawPlayerMarker(context, camera, player);
  }

  update(deltaTime: number): void {
    this.resources.forEach((resource) => resource.update(deltaTime));
  }

  getNearbyResource(playerPosition: Vec2): ResourceNode | null {
    return this.resources
      .filter((resource) => !resource.isDepleted)
      .filter((resource) => {
        const regionId = RESOURCE_SPAWNS.find((spawn) => spawn.id === resource.id)?.regionId;
        return regionId ? this.isRegionUnlocked(regionId) : false;
      })
      .filter((resource) => Math.hypot(resource.position.x - playerPosition.x, resource.position.y - playerPosition.y) <= this.interactionRange)
      .sort((left, right) => {
        const leftDistance = Math.hypot(left.position.x - playerPosition.x, left.position.y - playerPosition.y);
        const rightDistance = Math.hypot(right.position.x - playerPosition.x, right.position.y - playerPosition.y);
        return leftDistance - rightDistance;
      })[0] ?? null;
  }

  hitNearbyResource(
    playerPosition: Vec2,
  ): { resource: ResourceNode; result: ResourceHitResult } | null {
    const resource = this.getNearbyResource(playerPosition);
    if (!resource) {
      return null;
    }

    return { resource, result: resource.hit() };
  }

  private drawLockedRegions(context: CanvasRenderingContext2D, camera: Camera): void {
    this.regions
      .filter((region) => !this.isRegionUnlocked(region.id))
      .forEach((region) => {
        const topLeft = camera.worldToScreen({ x: region.bounds.left, y: region.bounds.top });
        const width = (region.bounds.right - region.bounds.left) * camera.zoom;
        const height = (region.bounds.bottom - region.bounds.top) * camera.zoom;

        context.save();
        context.fillStyle = '#2e5f6d';
        context.fillRect(topLeft.x, topLeft.y, width, height);
        context.globalAlpha = 0.28;
        context.strokeStyle = '#a6d5d2';
        context.lineWidth = Math.max(1, 2 * camera.zoom);
        for (let y = topLeft.y + 24 * camera.zoom; y < topLeft.y + height; y += 38 * camera.zoom) {
          for (let x = topLeft.x - 30 * camera.zoom; x < topLeft.x + width; x += 74 * camera.zoom) {
            context.beginPath();
            context.moveTo(x, y);
            context.quadraticCurveTo(
              x + 18 * camera.zoom,
              y - 7 * camera.zoom,
              x + 37 * camera.zoom,
              y,
            );
            context.quadraticCurveTo(
              x + 56 * camera.zoom,
              y + 7 * camera.zoom,
              x + 74 * camera.zoom,
              y,
            );
            context.stroke();
          }
        }
        context.globalAlpha = 0.92;
        context.fillStyle = '#e0d6b0';
        context.font = `${Math.max(10, 12 * camera.zoom)}px ui-monospace, monospace`;
        context.textAlign = 'center';
        context.fillText('LOCKED', topLeft.x + width / 2, topLeft.y + height / 2);
        context.globalAlpha = 0.7;
        context.strokeStyle = region.color;
        context.setLineDash([8 * camera.zoom, 7 * camera.zoom]);
        context.strokeRect(topLeft.x, topLeft.y, width, height);
        context.restore();
      });
  }

  private drawGroundDetail(
    context: CanvasRenderingContext2D,
    camera: Camera,
    x: number,
    y: number,
  ): void {
    const seed = Math.abs(x * 17 + y * 23);
    if (seed % 5 !== 0) {
      return;
    }

    const screen = camera.worldToScreen({
      x: x + 14 + (seed % 28),
      y: y + 17 + (seed % 23),
    });
    const size = Math.max(2, 3 * camera.zoom);
    context.fillStyle = 'rgba(202, 212, 144, 0.42)';
    context.beginPath();
    context.arc(screen.x, screen.y, size, 0, Math.PI * 2);
    context.fill();
  }

  private drawStructure(
    context: CanvasRenderingContext2D,
    camera: Camera,
    structure: StructureDefinition,
  ): void {
    const center = camera.worldToScreen({ x: structure.x, y: structure.y });
    const scale = camera.zoom;

    context.save();
    context.globalAlpha = 0.92;

    if (structure.kind === 'camp') {
      this.drawCamp(context, center.x, center.y, scale);
    } else if (structure.kind === 'bridge') {
      this.drawBridge(context, center.x, center.y, scale, structure);
    } else if (structure.kind === 'monolith') {
      this.drawMonolith(context, center.x, center.y, scale);
    } else {
      this.drawShelter(context, center.x, center.y, scale);
    }

    context.restore();
  }

  private drawCamp(context: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    context.strokeStyle = '#d6c38b';
    context.lineWidth = 3 * scale;
    context.beginPath();
    context.arc(x, y + 4 * scale, 48 * scale, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = '#b96a43';
    context.beginPath();
    context.moveTo(x, y - 34 * scale);
    context.lineTo(x - 28 * scale, y + 22 * scale);
    context.lineTo(x + 28 * scale, y + 22 * scale);
    context.closePath();
    context.fill();
    context.fillStyle = '#f8d38a';
    context.beginPath();
    context.arc(x, y + 7 * scale, 10 * scale, 0, Math.PI * 2);
    context.fill();
  }

  private drawBridge(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    structure: StructureDefinition,
  ): void {
    context.fillStyle = 'rgba(25, 37, 33, 0.28)';
    context.beginPath();
    context.ellipse(x, y + 22 * scale, 82 * scale, 13 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#795440';
    context.fillRect(
      x - (structure.width / 2) * scale,
      y - 17 * scale,
      structure.width * scale,
      34 * scale,
    );
    context.strokeStyle = '#c18a5d';
    context.lineWidth = 3 * scale;
    for (let plank = -4; plank <= 4; plank += 1) {
      const plankX = x + plank * 20 * scale;
      context.beginPath();
      context.moveTo(plankX, y - 16 * scale);
      context.lineTo(plankX, y + 16 * scale);
      context.stroke();
    }
    context.strokeStyle = '#5c4538';
    context.lineWidth = 4 * scale;
    context.strokeRect(
      x - (structure.width / 2) * scale,
      y - 17 * scale,
      structure.width * scale,
      34 * scale,
    );
  }

  private drawMonolith(context: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    context.fillStyle = 'rgba(25, 37, 33, 0.28)';
    context.beginPath();
    context.ellipse(x, y + 32 * scale, 31 * scale, 10 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#536968';
    context.beginPath();
    context.moveTo(x - 25 * scale, y + 28 * scale);
    context.lineTo(x - 18 * scale, y - 40 * scale);
    context.lineTo(x + 6 * scale, y - 55 * scale);
    context.lineTo(x + 28 * scale, y + 22 * scale);
    context.closePath();
    context.fill();
    context.strokeStyle = '#9ac2ac';
    context.lineWidth = 2 * scale;
    context.beginPath();
    context.moveTo(x, y - 28 * scale);
    context.lineTo(x + 9 * scale, y - 7 * scale);
    context.lineTo(x - 5 * scale, y + 10 * scale);
    context.stroke();
  }

  private drawShelter(context: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    context.fillStyle = 'rgba(25, 37, 33, 0.28)';
    context.beginPath();
    context.ellipse(x, y + 30 * scale, 66 * scale, 13 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#9a674b';
    context.fillRect(x - 52 * scale, y - 4 * scale, 104 * scale, 40 * scale);
    context.fillStyle = '#4d493f';
    context.beginPath();
    context.moveTo(x - 67 * scale, y - 4 * scale);
    context.lineTo(x, y - 48 * scale);
    context.lineTo(x + 67 * scale, y - 4 * scale);
    context.closePath();
    context.fill();
    context.fillStyle = '#e1bb79';
    context.fillRect(x - 13 * scale, y + 10 * scale, 26 * scale, 26 * scale);
  }

  private drawResource(
    context: CanvasRenderingContext2D,
    camera: Camera,
    resource: ResourceNode,
    playerPosition: Vec2,
    assets: AssetManager,
  ): void {
    if (resource.isDepleted) {
      return;
    }

    const screen = camera.worldToScreen(resource.position);
    const scale = camera.zoom;
    const nearby = Math.hypot(resource.position.x - playerPosition.x, resource.position.y - playerPosition.y) <= this.interactionRange;
    const image = assets.getImage(resource.definition.id);
    const pulse = resource.isPulsing ? 1.12 : 1;

    context.save();
    context.globalAlpha = nearby ? 1 : 0.92;
    context.fillStyle = resource.definition.kind === 'tree' ? 'rgba(40, 65, 45, 0.36)' : 'rgba(48, 58, 61, 0.42)';
    context.beginPath();
    context.ellipse(
      screen.x,
      screen.y + 25 * scale,
      (resource.definition.kind === 'tree' ? 30 : 27) * scale,
      9 * scale,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();

    if (resource.definition.kind === 'tree') {
      context.fillStyle = '#604f3e';
      context.fillRect(screen.x - 8 * scale, screen.y - 17 * scale, 16 * scale, 42 * scale);
      context.fillStyle = '#355d4b';
      context.beginPath();
      context.arc(screen.x, screen.y - 28 * scale, 25 * scale * pulse, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#4c7b58';
      context.beginPath();
      context.arc(screen.x - 13 * scale, screen.y - 18 * scale, 16 * scale * pulse, 0, Math.PI * 2);
      context.arc(screen.x + 14 * scale, screen.y - 17 * scale, 16 * scale * pulse, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillStyle = '#596d6c';
      context.beginPath();
      context.moveTo(screen.x - 25 * scale, screen.y + 16 * scale);
      context.lineTo(screen.x - 18 * scale, screen.y - 15 * scale);
      context.lineTo(screen.x + 7 * scale, screen.y - 25 * scale);
      context.lineTo(screen.x + 26 * scale, screen.y - 6 * scale);
      context.lineTo(screen.x + 18 * scale, screen.y + 18 * scale);
      context.closePath();
      context.fill();
    }

    if (image) {
      const spriteSize = resource.definition.kind === 'tree' ? 34 : 38;
      context.drawImage(
        image,
        screen.x - (spriteSize / 2) * scale,
        screen.y - (spriteSize / 2 + 5) * scale,
        spriteSize * scale,
        spriteSize * scale,
      );
    }

    if (nearby) {
      const barWidth = 58 * scale;
      const barHeight = Math.max(4, 5 * scale);
      const barLeft = screen.x - barWidth / 2;
      const barTop = screen.y - 54 * scale;
      context.fillStyle = 'rgba(18, 27, 29, 0.75)';
      context.fillRect(barLeft, barTop, barWidth, barHeight);
      context.fillStyle = '#efb56f';
      context.fillRect(
        barLeft,
        barTop,
        barWidth * (resource.durability / resource.definition.maxDurability),
        barHeight,
      );
      context.strokeStyle = 'rgba(247, 223, 175, 0.45)';
      context.lineWidth = Math.max(1, scale);
      context.strokeRect(barLeft, barTop, barWidth, barHeight);
    }
    context.restore();
  }

  private drawWorldEdge(context: CanvasRenderingContext2D, camera: Camera): void {
    const topLeft = camera.worldToScreen({ x: 0, y: 0 });
    const bottomRight = camera.worldToScreen({
      x: WORLD_BOUNDS.width,
      y: WORLD_BOUNDS.height,
    });
    context.save();
    context.strokeStyle = 'rgba(32, 45, 43, 0.38)';
    context.lineWidth = 18 * camera.zoom;
    context.strokeRect(
      topLeft.x + context.lineWidth / 2,
      topLeft.y + context.lineWidth / 2,
      bottomRight.x - topLeft.x - context.lineWidth,
      bottomRight.y - topLeft.y - context.lineWidth,
    );
    context.restore();
  }

  private drawPlayerMarker(
    context: CanvasRenderingContext2D,
    camera: Camera,
    player: Player,
  ): void {
    const screen = camera.worldToScreen(player.position);
    context.save();
    context.fillStyle = 'rgba(26, 38, 35, 0.24)';
    context.beginPath();
    context.ellipse(
      screen.x,
      screen.y + 18 * camera.zoom,
      23 * camera.zoom,
      8 * camera.zoom,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }
}