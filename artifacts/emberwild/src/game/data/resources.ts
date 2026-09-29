import type { ResourceNodeDefinition } from '../entities/ResourceNode';

export const RESOURCE_DEFINITIONS: ResourceNodeDefinition[] = [
  {
    id: 'emberwood-tree',
    name: 'Emberwood tree',
    itemId: 'wood_log',
    kind: 'tree',
    asset: '/assets/items/wood-log.png',
    maxDurability: 4,
    dropAmount: 3,
    coinDrop: 8,
  },
  {
    id: 'sunstone-vein',
    name: 'Sunstone vein',
    itemId: 'gold_ore',
    kind: 'ore',
    asset: '/assets/items/gold-ore.png',
    maxDurability: 3,
    dropAmount: 2,
    coinDrop: 12,
  },
  {
    id: 'frost-vein',
    name: 'Frost ore vein',
    itemId: 'light_ore',
    kind: 'ore',
    asset: '/assets/items/light-ore.png',
    maxDurability: 3,
    dropAmount: 2,
    coinDrop: 16,
  },
  {
    id: 'star-crystal-cluster',
    name: 'Star crystal cluster',
    itemId: 'crystal',
    kind: 'ore',
    asset: '/assets/items/crystal.png',
    maxDurability: 4,
    dropAmount: 1,
    coinDrop: 20,
  },
];