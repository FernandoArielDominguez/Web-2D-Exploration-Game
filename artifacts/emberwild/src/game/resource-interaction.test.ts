import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { RESOURCE_DEFINITIONS } from './data/resources';
import type { GameSnapshot } from './core/EventBus';
import { ResourceNode } from './entities/ResourceNode';
import { World } from './world/World';

type GameState = {
  coins: number;
  feedback: GameSnapshot['feedback'];
  inventory: Map<string, number>;
};

const storage = new Map<string, string>();

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  },
});

beforeEach(() => {
  storage.clear();
});

function getGameState(game: unknown): GameState {
  return game as GameState;
}

test('each hit removes exactly one point of resource durability', () => {
  const definition = RESOURCE_DEFINITIONS[0];
  const resource = new ResourceNode(definition, 0, 0);

  for (let hit = 1; hit <= definition.maxDurability; hit += 1) {
    const result = resource.hit();

    assert.equal(
      resource.durability,
      definition.maxDurability - hit,
      `hit ${hit} should remove exactly one durability point`,
    );

    if (hit < definition.maxDurability) {
      assert.deepEqual(result, {
        applied: true,
        dropped: 0,
        depleted: false,
        durability: definition.maxDurability - hit,
      });
    } else {
      assert.deepEqual(result, {
        applied: true,
        dropped: definition.dropAmount,
        depleted: true,
        durability: 0,
      });
    }
  }
});

test('the final nearby hit drops material and removes the node from interaction', () => {
  const world = new World();
  const resource = world.resources[0];
  const playerPosition = resource.position;

  for (let hit = 1; hit < resource.definition.maxDurability; hit += 1) {
    const result = world.hitNearbyResource(playerPosition);

    assert.ok(result);
    assert.equal(result.result.dropped, 0);
    assert.equal(world.getNearbyResource(playerPosition), resource);
  }

  const finalHit = world.hitNearbyResource(playerPosition);

  assert.ok(finalHit);
  assert.equal(finalHit.resource, resource);
  assert.equal(finalHit.result.dropped, resource.definition.dropAmount);
  assert.equal(finalHit.result.applied, true);
  assert.equal(finalHit.result.depleted, true);
  assert.equal(resource.isDepleted, true);
  assert.equal(world.getNearbyResource(playerPosition), null);
  assert.equal(world.hitNearbyResource(playerPosition), null);
});

test('the map loads unique resource placements and structures from data', () => {
  const world = new World();
  const resourceIds = new Set(world.resources.map((resource) => resource.id));
  const structureIds = new Set(world.structures.map((structure) => structure.id));

  assert.ok(world.resources.length > RESOURCE_DEFINITIONS.length);
  assert.equal(resourceIds.size, world.resources.length);
  assert.ok(world.structures.length >= 4);
  assert.equal(structureIds.size, world.structures.length);
  assert.equal(world.isRegionUnlocked('emberheart-meadow'), true);
  assert.equal(world.isRegionUnlocked('whisper-river'), false);
  assert.equal(world.getNearbyResource({ x: 850, y: 930 }), null);
});

test('unlocking a region spends coins and persists between sessions', async () => {
  const { Game } = await import('./Game');
  const firstSession = new Game();
  const firstState = getGameState(firstSession);
  const region = firstSession.world.regions.find((candidate) => candidate.id === 'whisper-river');

  assert.ok(region);
  assert.equal(firstSession.world.isRegionUnlocked(region.id), false);
  firstSession.unlockRegion(region.id);

  assert.equal(firstSession.world.isRegionUnlocked(region.id), true);
  assert.equal(firstState.coins, 126 - region.unlockCost);
  assert.equal(firstState.feedback.tone, 'success');

  const resumedSession = new Game();
  const resumedState = getGameState(resumedSession);
  assert.equal(resumedSession.world.isRegionUnlocked(region.id), true);
  assert.equal(resumedState.coins, 126 - region.unlockCost);
});

test('gathering a depleted node increments its material exactly once', async () => {
  const { Game } = await import('./Game');
  const game = new Game();
  const resource = game.world.resources[0];
  const state = getGameState(game);
  const initialCount = state.inventory.get(resource.definition.itemId) ?? 0;
  const initialCoins = state.coins;

  game.player.bounds.x = resource.position.x;
  game.player.bounds.y = resource.position.y;

  for (let hit = 0; hit < resource.definition.maxDurability; hit += 1) {
    game.gatherNearbyResource();
  }

  assert.equal(
    state.inventory.get(resource.definition.itemId),
    initialCount + resource.definition.dropAmount,
  );
  assert.equal(state.coins, initialCoins + resource.definition.coinDrop);
  assert.equal(state.feedback.tone, 'success');
  assert.match(state.feedback.message, /^Collected \d+ /);
  assert.equal(game.world.getNearbyResource(resource.position), null);
});

test('starting island has extra harvestable nodes and depleted nodes respawn', () => {
  const world = new World();
  const startingResources = world.resources.filter((resource) =>
    ['emberwood-tree-heartland-north', 'emberwood-tree-heartland-south', 'sunstone-vein-heartland-west', 'sunstone-vein-heartland-east'].includes(resource.id),
  );

  assert.equal(startingResources.length, 4);
  assert.ok(startingResources.every((resource) => world.getNearbyResource(resource.position) === resource));

  const resource = startingResources[0];
  for (let hit = 0; hit < resource.definition.maxDurability; hit += 1) {
    world.hitNearbyResource(resource.position);
  }

  assert.equal(resource.isDepleted, true);
  resource.update(18);
  assert.equal(resource.isDepleted, false);
  assert.equal(resource.durability, resource.definition.maxDurability);
});

test('gathering without a nearby node gives feedback and leaves inventory unchanged', async () => {
  const { Game } = await import('./Game');
  const game = new Game();
  const state = getGameState(game);
  const initialInventory = Object.fromEntries(state.inventory);

  game.player.bounds.x = 100;
  game.player.bounds.y = 100;
  game.gatherNearbyResource();

  assert.deepEqual(Object.fromEntries(state.inventory), initialInventory);
  assert.deepEqual(state.feedback, {
    id: 1,
    message: 'Move closer to a resource node',
    tone: 'warning',
  });
});

test('restores partially harvested durability in a later game session', async () => {
  const { Game } = await import('./Game');
  const firstSession = new Game();
  const resource = firstSession.world.resources[0];

  firstSession.player.bounds.x = resource.position.x;
  firstSession.player.bounds.y = resource.position.y;
  for (let hit = 0; hit < resource.definition.maxDurability - 1; hit += 1) {
    firstSession.gatherNearbyResource();
  }

  const resumedSession = new Game();
  const resumedResource = resumedSession.world.resources[0];

  assert.equal(resumedResource.durability, 1);
  assert.equal(resumedResource.isDepleted, false);
  assert.equal(
    resumedSession.world.getNearbyResource(resumedResource.position),
    resumedResource,
  );
});

test('does not drop material from an exhausted node in a later game session', async () => {
  const { Game } = await import('./Game');
  const firstSession = new Game();
  const resource = firstSession.world.resources[0];

  firstSession.player.bounds.x = resource.position.x;
  firstSession.player.bounds.y = resource.position.y;
  for (let hit = 0; hit < resource.definition.maxDurability; hit += 1) {
    firstSession.gatherNearbyResource();
  }

  const resumedSession = new Game();
  const resumedResource = resumedSession.world.resources[0];
  const resumedState = getGameState(resumedSession);
  const savedMaterialCount = resumedState.inventory.get(resource.definition.itemId);

  resumedSession.player.bounds.x = resumedResource.position.x;
  resumedSession.player.bounds.y = resumedResource.position.y;
  resumedSession.gatherNearbyResource();

  assert.equal(resumedResource.isDepleted, true);
  assert.equal(resumedSession.world.getNearbyResource(resumedResource.position), null);
  assert.equal(
    resumedState.inventory.get(resource.definition.itemId),
    savedMaterialCount,
  );
  assert.equal(resumedState.feedback.tone, 'warning');
  assert.equal(resumedState.feedback.message, 'Move closer to a resource node');
});