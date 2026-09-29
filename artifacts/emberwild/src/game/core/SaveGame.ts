import { MATERIAL_ITEMS } from '../data/items';

export const SAVE_GAME_KEY = 'emberwild-save-v1';

export type SavedResourceState = {
  durability: number;
  depleted: boolean;
};

export type SavedGameState = {
  coins: number;
  inventory: Record<string, number>;
  resources: Record<string, SavedResourceState>;
  unlockedRegions: string[];
};

export type SaveGameResult =
  | { saved: true }
  | { saved: false; reason: 'storage-unavailable' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeInventory(value: unknown): Record<string, number> {
  const inventory: Record<string, number> = {};
  const source = isRecord(value) ? value : {};

  MATERIAL_ITEMS.forEach((item) => {
    const count = source[item.id];
    inventory[item.id] =
      typeof count === 'number' && Number.isFinite(count)
        ? Math.max(0, Math.floor(count))
        : item.count;
  });

  return inventory;
}

function sanitizeCoins(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 126;
}

function sanitizeUnlockedRegions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ['emberheart-meadow'];
  }

  const regions = value.filter((regionId): regionId is string => typeof regionId === 'string');
  return regions.includes('emberheart-meadow') ? [...new Set(regions)] : ['emberheart-meadow', ...new Set(regions)];
}

function sanitizeResources(value: unknown): Record<string, SavedResourceState> {
  const resources: Record<string, SavedResourceState> = {};
  const source = isRecord(value) ? value : {};

  Object.entries(source).forEach(([resourceId, candidate]) => {
    const saved = isRecord(candidate) ? candidate : null;
    if (!saved) {
      return;
    }

    if (typeof saved.durability !== 'number' || !Number.isFinite(saved.durability)) {
      return;
    }

    const durability = Math.max(0, Math.floor(saved.durability));
    const depleted = saved.depleted === true || durability === 0;

    resources[resourceId] = { durability, depleted };
  });

  return resources;
}

export function createDefaultSaveGame(): SavedGameState {
  return {
    coins: 126,
    inventory: sanitizeInventory(null),
    resources: sanitizeResources(null),
    unlockedRegions: ['emberheart-meadow'],
  };
}

export function loadSaveGame(): SavedGameState {
  const fallback = createDefaultSaveGame();

  try {
    const raw = window.localStorage.getItem(SAVE_GAME_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return fallback;
    }

    return {
      coins: sanitizeCoins(parsed.coins),
      inventory: sanitizeInventory(parsed.inventory),
      resources: sanitizeResources(parsed.resources),
      unlockedRegions: sanitizeUnlockedRegions(parsed.unlockedRegions),
    };
  } catch {
    return fallback;
  }
}

export function saveGame(state: SavedGameState): SaveGameResult {
  try {
    window.localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(state));
    return { saved: true };
  } catch {
    console.warn('[Emberwild] Progress could not be saved to local storage.');
    return { saved: false, reason: 'storage-unavailable' };
  }
}