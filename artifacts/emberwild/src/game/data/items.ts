export type MaterialTone = 'crystal' | 'gold' | 'ice' | 'wood';

export type MaterialItem = {
  id: string;
  name: string;
  detail: string;
  tone: MaterialTone;
  count: number;
  asset: string;
};

export const MATERIAL_ITEMS: MaterialItem[] = [
  {
    id: 'crystal',
    name: 'Star crystal',
    detail: 'Cold light in mineral form',
    tone: 'crystal',
    count: 2,
    asset: '/assets/items/crystal.png',
  },
  {
    id: 'gold_ore',
    name: 'Sunstone ore',
    detail: 'A warm, heavy seam',
    tone: 'gold',
    count: 6,
    asset: '/assets/items/gold-ore.png',
  },
  {
    id: 'light_ore',
    name: 'Frost ore',
    detail: 'Pale stone from deep ground',
    tone: 'ice',
    count: 3,
    asset: '/assets/items/light-ore.png',
  },
  {
    id: 'wood_log',
    name: 'Emberwood log',
    detail: 'Freshly cut heartwood',
    tone: 'wood',
    count: 12,
    asset: '/assets/items/wood-log.png',
  },
];