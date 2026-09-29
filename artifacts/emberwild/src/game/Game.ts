import { Camera } from './core/Camera';
import { AssetManager } from './core/AssetManager';
import { EventBus, type GameEventMap, type GameSnapshot } from './core/EventBus';
import { GameLoop } from './core/GameLoop';
import { Input } from './core/Input';
import { loadSaveGame, saveGame } from './core/SaveGame';
import { MATERIAL_ITEMS } from './data/items';
import { Player } from './entities/Player';
import { World, WORLD_BOUNDS } from './world/World';

const PLAYER_IDLE_ASSETS = ['player-idle-1', 'player-idle-2', 'player-idle-3'];
const PLAYER_WALK_ASSETS = ['player-walk-1', 'player-walk-2', 'player-walk-3', 'player-walk-4'];

export class Game {
  readonly input = new Input();

  readonly camera = new Camera();

  readonly assets = new AssetManager();

  readonly events = new EventBus<GameEventMap>();

  readonly world = new World();

  readonly player = new Player(WORLD_BOUNDS.width / 2, WORLD_BOUNDS.height / 2 + 120);

  private readonly loop: GameLoop;

  private context: CanvasRenderingContext2D | null = null;

  private canvas: HTMLCanvasElement | null = null;

  private viewport = { width: 1, height: 1 };

  private paused = false;

  private debug = false;

  private readonly saveState = loadSaveGame();

  private coins = this.saveState.coins;

  private lockedBoundaryFeedbackTimer = 0;

  private fps = 60;

  private fpsAccumulator = 0;

  private fpsFrames = 0;

  private readonly inventory = new Map(MATERIAL_ITEMS.map((item) => [item.id, item.count]));

  private feedbackId = 0;

  private feedback: GameSnapshot['feedback'] = {
    id: 0,
    message: 'The wilds are listening',
    tone: 'neutral',
  };

  constructor() {
    this.world.restoreSaveState(this.saveState.resources, this.saveState.unlockedRegions);
    this.inventory.clear();
    Object.entries(this.saveState.inventory).forEach(([itemId, count]) => {
      this.inventory.set(itemId, count);
    });
    this.loop = new GameLoop({
      update: (deltaTime) => this.update(deltaTime),
      render: (interpolation) => this.render(interpolation),
    });
  }

  mount(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.input.attach();
    void this.loadResourceAssets();
    void this.loadPlayerAssets();
    this.resize();
    this.loop.start();
  }

  unmount(): void {
    this.persistSaveGame();
    this.loop.stop();
    this.input.detach();
    this.events.clear();
    this.context = null;
    this.canvas = null;
  }

  resize(): void {
    if (!this.canvas || !this.context) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.viewport = { width: rect.width, height: rect.height };
    this.canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.camera.setViewport(rect.width, rect.height);
    this.camera.setBounds(WORLD_BOUNDS);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private update(deltaTime: number): void {
    if (this.paused) {
      this.input.endFrame();
      return;
    }

    this.lockedBoundaryFeedbackTimer = Math.max(0, this.lockedBoundaryFeedbackTimer - deltaTime);
    const previousPosition = this.player.position;
    this.player.updateFromInput(this.input, deltaTime, WORLD_BOUNDS);
    if (!this.world.isPositionUnlocked(this.player.position)) {
      this.player.bounds.x = previousPosition.x;
      this.player.bounds.y = previousPosition.y;
      if (this.lockedBoundaryFeedbackTimer === 0) {
        this.setFeedback('The frontier is sealed; unlock this region from the map', 'warning');
        this.lockedBoundaryFeedbackTimer = 1.25;
      }
    }
    this.world.update(deltaTime);
    if (this.input.wasPressed('e')) {
      this.gatherNearbyResource();
    }
    this.camera.follow(this.player.position, deltaTime);
    this.fpsAccumulator += deltaTime;
    this.fpsFrames += 1;
    if (this.fpsAccumulator >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrames = 0;
    }
    this.input.endFrame();
  }

  private render(interpolation: number): void {
    if (!this.context) {
      return;
    }

    this.context.clearRect(0, 0, this.viewport.width, this.viewport.height);
    this.context.save();
    this.world.render(this.context, this.camera, this.viewport, this.player, this.assets);
    this.renderPlayer(this.context);
    this.context.restore();

    if (this.debug) {
      this.renderDebugOverlay(this.context);
    }

    this.events.emit('snapshot', this.createSnapshot(interpolation));
  }

  private renderPlayer(context: CanvasRenderingContext2D): void {
    const screen = this.camera.worldToScreen(this.player.position);
    const scale = this.camera.zoom;
    const width = this.player.bounds.width * scale;
    const height = this.player.bounds.height * scale;
    const frameAssets = this.player.state === 'walking' ? PLAYER_WALK_ASSETS : PLAYER_IDLE_ASSETS;
    const frameDuration = this.player.state === 'walking' ? 120 : 720;
    const frameIndex = Math.floor(performance.now() / frameDuration) % frameAssets.length;
    const sprite = this.assets.getImage(frameAssets[frameIndex]);

    context.save();
    if (sprite) {
      const spriteWidth = 58 * scale;
      const spriteHeight = 78 * scale;
      const feetY = screen.y + height / 2;
      context.translate(screen.x, feetY - spriteHeight);
      if (this.player.direction === 'left') {
        context.scale(-1, 1);
      }
      context.imageSmoothingEnabled = false;
      context.drawImage(
        sprite,
        -spriteWidth / 2,
        0,
        spriteWidth,
        spriteHeight,
      );
      context.restore();
      return;
    }

    const top = screen.y - height / 2;
    context.translate(screen.x, top);
    context.fillStyle = '#f4c98a';
    context.beginPath();
    context.arc(0, 8 * scale, 11 * scale, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#29484a';
    context.beginPath();
    context.arc(0, 5 * scale, 12 * scale, Math.PI, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e37951';
    context.roundRect(
      -width / 2,
      18 * scale,
      width,
      height - 18 * scale,
      8 * scale,
    );
    context.fill();
    context.fillStyle = '#f6dd9c';
    context.roundRect(
      -width / 2 + 5 * scale,
      20 * scale,
      width - 10 * scale,
      8 * scale,
      4 * scale,
    );
    context.fill();
    context.restore();
  }

  private renderDebugOverlay(context: CanvasRenderingContext2D): void {
    const lines = [
      `FPS ${this.fps}`,
      `PLAYER ${Math.round(this.player.bounds.x)}, ${Math.round(this.player.bounds.y)}`,
      `ZONE ${this.world.zone}`,
      `ENTITIES ${this.world.resources.filter((resource) => !resource.isDepleted).length + 1}`,
      `CAMERA ${Math.round(this.camera.position.x)}, ${Math.round(this.camera.position.y)}`,
    ];
    context.save();
    context.font = '12px ui-monospace, monospace';
    context.fillStyle = 'rgba(12, 24, 23, 0.78)';
    context.fillRect(16, 16, 214, lines.length * 18 + 18);
    context.fillStyle = '#d9e5bb';
    lines.forEach((line, index) => context.fillText(line, 28, 38 + index * 18));
    context.restore();
  }

  private createSnapshot(interpolation: number): GameSnapshot {
    return {
      fps: this.fps,
      player: {
        x: Math.round(this.player.bounds.x),
        y: Math.round(this.player.bounds.y),
        state: this.player.state,
        direction: this.player.direction,
      },
      camera: {
        x: Math.round(this.camera.position.x),
        y: Math.round(this.camera.position.y),
        zoom: this.camera.zoom,
      },
      world: {
        ...WORLD_BOUNDS,
        zone: this.world.zone,
        regions: this.world.regions.map((region) => ({
          id: region.id,
          name: region.name,
          subtitle: region.subtitle,
          unlockCost: region.unlockCost,
          unlocked: this.world.isRegionUnlocked(region.id),
        })),
      },
      entityCount: this.world.resources.filter((resource) => !resource.isDepleted).length + 1,
      coins: this.coins,
      inventory: Object.fromEntries(this.inventory),
      nearbyResource: this.world.getNearbyResource(this.player.position)?.getState(this.player.position) ?? null,
      feedback: this.feedback,
    };
  }

  gatherNearbyResource(): void {
    const result = this.world.hitNearbyResource(this.player.position);
    if (!result) {
      this.setFeedback('Move closer to a resource node', 'warning');
      return;
    }

    const { resource, result: hitResult } = result;
    if (!hitResult.applied) {
      this.setFeedback(`${resource.definition.name} is already exhausted`, 'warning');
      return;
    }

    if (hitResult.dropped > 0) {
      const current = this.inventory.get(resource.definition.itemId) ?? 0;
      const nextCount = current + hitResult.dropped;
      this.inventory.set(resource.definition.itemId, nextCount);
      this.coins += resource.definition.coinDrop;
      const saveResult = this.persistSaveGame();
      const itemName = resource.definition.name.replace(' tree', '').replace(' vein', '').replace(' cluster', '');
      if (saveResult.saved) {
        this.setFeedback(`Collected ${hitResult.dropped} ${itemName} · +${resource.definition.coinDrop} coins`, 'success');
      } else {
        this.setFeedback(`Collected ${hitResult.dropped} ${itemName}; progress could not be saved`, 'error');
      }
      return;
    }

    const saveResult = this.persistSaveGame();
    this.setFeedback(
      saveResult.saved
        ? `${resource.definition.name}: ${hitResult.durability}/${resource.definition.maxDurability} resistance`
        : `${resource.definition.name} hit, but progress could not be saved`,
      saveResult.saved ? 'neutral' : 'error',
    );
  }

  unlockRegion(regionId: string): void {
    const region = this.world.regions.find((candidate) => candidate.id === regionId);
    if (!region || this.world.isRegionUnlocked(regionId)) {
      return;
    }

    if (this.coins < region.unlockCost) {
      this.setFeedback(`Need ${region.unlockCost - this.coins} more coins to open ${region.name}`, 'warning');
      return;
    }

    const previousCoins = this.coins;
    this.coins -= region.unlockCost;
    this.world.unlockRegion(regionId);
    const saveResult = this.persistSaveGame();
    if (!saveResult.saved) {
      this.coins = previousCoins;
      this.world.lockRegion(regionId);
      this.setFeedback(`Could not save the ${region.name} unlock`, 'error');
      return;
    }

    this.setFeedback(`${region.name} is open. The wilds are yours to explore`, 'success');
  }

  private setFeedback(message: string, tone: GameSnapshot['feedback']['tone']): void {
    this.feedbackId += 1;
    this.feedback = { id: this.feedbackId, message, tone };
  }

  private persistSaveGame(): ReturnType<typeof saveGame> {
    return saveGame({
      coins: this.coins,
      inventory: Object.fromEntries(this.inventory),
      resources: this.world.getSaveState(),
      unlockedRegions: this.world.getUnlockedRegionIds(),
    });
  }

  private async loadResourceAssets(): Promise<void> {
    const definitions = new Map(
      this.world.resources.map((resource) => [resource.definition.id, resource.definition]),
    );
    await Promise.all(
      [...definitions.values()].map((definition) =>
        this.assets.loadImage(definition.id, definition.asset),
      ),
    );
  }

  private async loadPlayerAssets(): Promise<void> {
    const idleAssets = PLAYER_IDLE_ASSETS.map((id, index) => [id, `/assets/player/idle-${index + 1}.png`] as const);
    const walkAssets = PLAYER_WALK_ASSETS.map((id, index) => [id, `/assets/player/walk-${index + 1}.png`] as const);
    await Promise.all(
      [...idleAssets, ...walkAssets].map(([id, source]) => this.assets.loadImage(id, source)),
    );
  }
}
